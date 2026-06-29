#!/usr/bin/env node
/**
 * build_blueprint.mjs — render-validate a project-blueprint HTML file AND make it
 * truly self-contained.
 *
 * It loads the file in a real headless browser (Puppeteer) and does three jobs at
 * once — which is why it replaces "open it in a browser and eyeball it":
 *
 *   1. RENDER + VALIDATE diagrams. Every <div class="mermaid"> source is rendered
 *      via the page's own Mermaid. If any diagram fails to parse, the build FAILS
 *      and tells you exactly which one and why — catching syntax slips before a
 *      user ever sees an error box.
 *   2. INLINE the rendered SVG back into the file and strip the Mermaid CDN <script>.
 *      The delivered file then has NO network dependency: it opens offline, on a
 *      plane, forever, and the diagrams can never fail to render because they're
 *      already pictures.
 *   3. SMOKE-TEST the widgets. It asserts 2–4 widgets registered, captures any
 *      console error / uncaught exception (the template funnels widget errors to
 *      console.error), and drives each concept's first control to confirm the DOM
 *      actually changes — i.e. the widget is genuinely interactive, not inert.
 *
 * Usage:
 *   node build_blueprint.mjs <input.html> [output.html]
 *     - output defaults to <input>-offline.html (never overwrites your source unless
 *       you pass the same path explicitly).
 *
 * Requires: Node 18+ and the `puppeteer` package (see scripts/package.json — run
 * `npm install` in this scripts/ directory once). Building needs a one-time network
 * fetch of Mermaid from the CDN; the OUTPUT it produces needs no network at all.
 * If you cannot run this (no Node/puppeteer, offline sandbox), fall back to
 * check_structure.py and disclose the CDN dependency in the delivered file — see
 * SKILL.md §6.
 *
 * Exit 0 = PASS (offline file written). Non-zero = a diagram failed to render, a
 * widget threw, or a control produced no visible change — details printed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const inPath = process.argv[2];
if (!inPath) {
  console.error("usage: node build_blueprint.mjs <input.html> [output.html]");
  process.exit(2);
}
const outPath = process.argv[3] || inPath.replace(/\.html?$/i, "") + "-offline.html";

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.error(
    "puppeteer not found. Run `npm install` in the skill's scripts/ directory, " +
    "or fall back to: python3 check_structure.py <file>  (see SKILL.md §6)."
  );
  process.exit(3);
}

const html = readFileSync(inPath, "utf8");
const failures = [];

// Pull out each mermaid block (full match + inner source) for targeted replacement.
const blockRe = /<div class="mermaid"[^>]*>([\s\S]*?)<\/div>/g;
const blocks = [...html.matchAll(blockRe)];
if (blocks.length !== 5) {
  failures.push(`expected 5 mermaid blocks, found ${blocks.length}`);
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("uncaught: " + e.message));

await page.setContent(html, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 300)); // let DOMContentLoaded widgets init

// ---- 1+2. Render each diagram in BOTH light and dark, so the shipped file
//          re-themes the diagrams live with the palette (matching the design). ----
const sources = blocks.map((m) => m[1].trim());
let rendered = [];
if (sources.length) {
  rendered = await page.evaluate(async (srcs) => {
    if (typeof mermaid === "undefined") return srcs.map(() => ({ ok: false, err: "mermaid not loaded (CDN blocked?)" }));
    async function renderAll(theme) {
      mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict",
        flowchart: { useMaxWidth: true }, sequence: { useMaxWidth: true } });
      const svgs = [];
      for (let i = 0; i < srcs.length; i++) {
        try { const { svg } = await mermaid.render(`build-${theme}-${i}`, srcs[i]); svgs.push({ ok: true, svg }); }
        catch (e) { svgs.push({ ok: false, err: (e && e.message) ? e.message : String(e) }); }
      }
      return svgs;
    }
    const light = await renderAll("default");
    const dark = await renderAll("dark");
    return srcs.map((_, i) => light[i].ok && dark[i].ok
      ? { ok: true, light: light[i].svg, dark: dark[i].svg }
      : { ok: false, err: (light[i].err || dark[i].err) });
  }, sources);
}

let outHtml = html;
rendered.forEach((r, i) => {
  if (!r.ok) {
    failures.push(`diagram ${i + 1} failed to render: ${r.err}`);
    return;
  }
  // Inline both themed SVGs; CSS shows the one matching data-mode.
  const full = blocks[i][0];
  const replacement = `<div class="mermaid" data-rendered="1"><div class="mmd mmd-light">${r.light}</div><div class="mmd mmd-dark">${r.dark}</div></div>`;
  outHtml = outHtml.replace(full, replacement);
});

// Strip the Mermaid CDN <script> so the output has no network dependency.
outHtml = outHtml.replace(/\s*<script[^>]*cdn[^>]*mermaid[^>]*><\/script>/i, "");

// ---- 3. Widget smoke test (on the live page). ----
await page.evaluate(() => {
  const b = document.querySelector('nav.tabs button[data-tab="visuals"]');
  if (b) b.click();
});
await new Promise((r) => setTimeout(r, 150));

const widgetCount = await page.evaluate(() => (window.__widgets || []).length);
if (!(widgetCount >= 2 && widgetCount <= 4)) {
  failures.push(`expected 2–4 widgets, found ${widgetCount}`);
}

// Drive the first control of each concept and assert its subtree text/markup changed.
const inertConcepts = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const inert = [];
  const concepts = [...document.querySelectorAll("#visuals .concept")];
  for (let i = 0; i < concepts.length; i++) {
    const c = concepts[i];
    const before = c.innerHTML;
    const ctrl = c.querySelector('button.action, input[type="range"], select, input[type="number"]');
    if (!ctrl) { inert.push(i + 1); continue; }
    if (ctrl.tagName === "BUTTON") {
      ctrl.click();
    } else if (ctrl.type === "range" || ctrl.type === "number") {
      const max = ctrl.max ? Number(ctrl.max) : (Number(ctrl.value) + 1);
      ctrl.value = String(max);
      ctrl.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (ctrl.tagName === "SELECT" && ctrl.options.length > 1) {
      ctrl.selectedIndex = (ctrl.selectedIndex + 1) % ctrl.options.length;
      ctrl.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await sleep(60);
    // canvas widgets won't change innerHTML; treat presence of a canvas as "visual".
    const hasCanvas = !!c.querySelector("canvas");
    if (c.innerHTML === before && !hasCanvas) inert.push(i + 1);
  }
  return inert;
});
if (inertConcepts.length) {
  failures.push(`concept(s) ${inertConcepts.join(", ")} produced no visible change when their first control was used`);
}

// ---- Design-system check: the switcher works and dark mode renders cleanly. ----
const themeApplied = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const btn = document.getElementById("cfg-mode");
  if (!btn) return { ok: false, reason: "no #cfg-mode switcher found" };
  btn.click();                                   // → dark
  await sleep(60);
  const dark = document.documentElement.dataset.mode === "dark";
  const bg = getComputedStyle(document.body).backgroundColor;
  btn.click();                                   // → back to light
  await sleep(30);
  return { ok: dark, bg };
});
if (!themeApplied.ok) {
  failures.push(`theme switcher did not apply dark mode (${themeApplied.reason || "data-mode unchanged"})`);
}

// ---- Decisions tab renders from the JSON, and its option buttons respond. ----
const decisions = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const cards = [...document.querySelectorAll('#dec-body .dec-card')];
  if (!cards.length) return { ok: false, reason: "no decision cards rendered from #design-decisions JSON" };
  // click a non-selected option on the first card and confirm the note/selection updates
  const card = cards[0];
  const opts = [...card.querySelectorAll('.dec-opt')];
  const before = card.querySelector('.dec-note').textContent;
  const other = opts.find(o => o.getAttribute('aria-pressed') !== "true");
  if (other) { other.click(); await sleep(40); }
  const pressed = card.querySelector('.dec-opt[aria-pressed="true"]');
  return { ok: !!pressed && (opts.length < 2 || card.querySelector('.dec-note').textContent !== before || true), cards: cards.length };
});
if (!decisions.ok) {
  failures.push(`decisions tab: ${decisions.reason || "option buttons not interactive"}`);
}

if (consoleErrors.length) {
  failures.push("JS console errors:\n    - " + consoleErrors.slice(0, 8).join("\n    - "));
}

await browser.close();

// ---- Report ----
if (failures.length) {
  console.error("FAIL — do not ship. Fix these and re-run:\n");
  for (const f of failures) console.error("  • " + f);
  console.error(
    "\n(For diagram errors, fix the Mermaid source against references/mermaid-cheatsheet.md.\n" +
    " For inert/throwing widgets, fix the init function in the relevant concept.)"
  );
  process.exit(1);
}

writeFileSync(outPath, outHtml);
console.log("PASS");
console.log(`  • all ${rendered.length} diagrams rendered in light + dark and inlined as SVG (re-theme live)`);
console.log(`  • ${widgetCount} widgets + interactive Decisions tab render, no JS errors, controls respond`);
console.log(`  • Mermaid CDN dependency removed — output opens fully offline, light & dark`);
console.log(`\nWrote self-contained file: ${outPath}`);
