#!/usr/bin/env python3
"""
check_structure.py — zero-dependency static validator for a project-blueprint HTML file.

Runs anywhere Python 3 runs (no network, no packages), so it is the always-available
gate. It catches the cheap, common failures statically; it does NOT prove that
diagrams render or that widgets work — for that, run build_blueprint.mjs, which loads
the file in a real browser. Use this as a fast pre-check and as the fallback when a
headless browser isn't available.

Usage:
    python3 check_structure.py <blueprint.html>

Exit code 0 = PASS, 1 = one or more checks failed (details printed).
"""
import re
import sys
from pathlib import Path


def check(html: str) -> list[tuple[bool, str]]:
    results: list[tuple[bool, str]] = []

    def ok(cond, label, detail=""):
        results.append((bool(cond), label + (f" — {detail}" if detail else "")))

    # 1. No unfilled template placeholders.
    leftover = re.findall(r"\{\{[^}]+\}\}", html)
    ok(not leftover, "No leftover {{placeholders}}",
       "" if not leftover else f"found {sorted(set(leftover))}")

    # 2. Four tabs present with navigation.
    want = {"decisions", "prd", "diagrams", "visuals"}
    tabs = set(re.findall(r'data-tab="(decisions|prd|diagrams|visuals)"', html))
    ok(tabs == want, "Four tabs (decisions/prd/diagrams/visuals) present",
       "" if tabs == want else f"found {sorted(tabs)}")

    # 3. Diagram blocks: expect 5. Works on both the authored file (Mermaid source)
    #    and a built file (diagrams already rendered to inline SVG by build_blueprint.mjs).
    blocks = re.findall(r'<div class="mermaid"[^>]*>(.*?)</div>', html, re.DOTALL)
    ok(len(blocks) == 5, "Exactly 5 diagram blocks", f"found {len(blocks)}")
    prerendered = "data-rendered" in html or "<svg" in html
    if prerendered:
        # Built file: diagrams are SVG; source-level syntax checks no longer apply.
        results.append((True, "Diagrams already rendered to inline SVG (built file) — "
                              "syntax checks skipped; run build only on the authored source"))
    else:
        nonempty = [b for b in blocks if len(b.strip()) > 10]
        ok(len(nonempty) == len(blocks) and blocks, "All mermaid blocks are non-empty",
           f"{len(nonempty)}/{len(blocks)} non-empty")
        # A common silent failure: the mermaid source got HTML-escaped (&lt; instead of
        # <), which makes Mermaid choke. Real mermaid source rarely needs entities.
        escaped = [i for i, b in enumerate(blocks) if re.search(r"&(lt|gt|amp);", b)]
        ok(not escaped, "No HTML-escaped mermaid source",
           "" if not escaped else f"blocks {escaped} contain &lt;/&gt;/&amp; — write raw < > &")
        # The five expected diagram kinds (component+activity are flowcharts).
        has = lambda kw: bool(re.search(kw, html))
        kinds_ok = has(r"classDiagram") and has(r"sequenceDiagram") and has(r"stateDiagram") \
            and len(re.findall(r"(flowchart|graph)\s+(TB|TD|LR|RL|BT)", html)) >= 2
        ok(kinds_ok, "All five diagram kinds present (class/component/sequence/activity/state)")

    # 4. Interactive widgets: 2-4 registered, three tiers present.
    widgets = len(re.findall(r"__widgets\.push", html))
    ok(2 <= widgets <= 4, "2–4 registered widgets", f"found {widgets}")
    tiers = {t for t in ("tier-1", "tier-2", "tier-3") if re.search(t + r'["\s]', html)}
    ok(tiers == {"tier-1", "tier-2", "tier-3"}, "Three difficulty tiers present",
       "" if len(tiers) == 3 else f"found {sorted(tiers)}")

    # 5. Structural balance: a tier header and a concept card per widget, roughly.
    concepts = len(re.findall(r'class="concept', html))
    ok(concepts >= widgets, "At least one .concept card per widget",
       f"{concepts} concepts, {widgets} widgets")

    # 6b. Design system present: tokens + light/dark + the config switcher.
    ds_ok = ("data-mode=" in html and "--accent" in html
             and 'data-direction' in html and 'data-typeface' in html)
    ok(ds_ok, "Locked design system present (data-mode/direction/typeface + --accent)")
    ok('id="cfg-mode"' in html, "Theme switcher present (mode/direction/typeface/accent)",
       "" if 'id="cfg-mode"' in html else "no #cfg-mode control found")

    # 6. Design-decision log: present, valid JSON, non-empty, well-formed.
    m = re.search(r'<script[^>]*id="design-decisions"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        ok(False, "Embedded design-decisions log present",
           'no <script id="design-decisions"> block (and no {{DESIGN_DECISIONS_JSON}} fill)')
    else:
        import json
        try:
            data = json.loads(m.group(1).strip() or "null")
        except json.JSONDecodeError as e:
            data = None
            ok(False, "Design-decisions log is valid JSON", str(e))
        if isinstance(data, dict):
            # Accept grouped ({groups:[{cat,decisions:[]}]}) or flat ({decisions:[]}).
            decisions = list(data.get("decisions") or [])
            for g in (data.get("groups") or []):
                decisions.extend(g.get("decisions") or [])
            ok(len(decisions) >= 1, "Design-decisions log has at least one decision",
               f"{len(decisions)} decisions")
            def good(d):
                if not isinstance(d, dict) or d.get("decidedBy") not in ("user", "default"):
                    return False
                if not (d.get("title") or d.get("question")):
                    return False
                # a chosen option (asBuilt/decision) and some rationale (note/rationale or per-option notes)
                has_choice = d.get("asBuilt") or d.get("decision")
                has_why = d.get("note") or d.get("rationale") or \
                    any(isinstance(o, dict) and o.get("note") for o in (d.get("options") or []))
                return bool(has_choice and has_why)
            bad = [d for d in decisions if not good(d)]
            ok(not bad, "Each decision has a title, a chosen option, a rationale, and decidedBy(user|default)",
               "" if not bad else f"{len(bad)} malformed decision(s)")
            ok(data.get("mode") in ("grilled", "auto"), "Log records mode (grilled|auto)",
               f"mode={data.get('mode')!r}")
        elif data is not None:
            ok(False, "Design-decisions log is a JSON object", f"got {type(data).__name__}")

    return results


def main():
    if len(sys.argv) != 2:
        print("usage: python3 check_structure.py <blueprint.html>")
        sys.exit(2)
    p = Path(sys.argv[1])
    if not p.exists():
        print(f"file not found: {p}")
        sys.exit(2)
    html = p.read_text(errors="ignore")
    results = check(html)
    failed = [label for passed, label in results if not passed]
    for passed, label in results:
        print(f"  {'PASS' if passed else 'FAIL'}  {label}")
    if failed:
        print(f"\nFAIL — {len(failed)} check(s) failed. Fix them before shipping.")
        sys.exit(1)
    print("\nPASS — static structure looks good. "
          "Run build_blueprint.mjs to confirm diagrams render and widgets work.")


if __name__ == "__main__":
    main()
