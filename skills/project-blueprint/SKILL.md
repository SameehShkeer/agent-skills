---
name: project-blueprint
description: >-
  Turns a project idea into one self-contained HTML file with four tabs: an
  interactive Decisions log, a full PRD, a Diagrams tab (class, component,
  sequence, activity, and state diagrams in Mermaid), and an Interactive Visuals
  tab of hands-on widgets that teach the project's core concepts from basic to
  advanced. Use when the user wants a
  project planned, spec'd out, diagrammed, or explained as a single visual,
  document-style deliverable they can open and read — e.g. "spec out this app",
  "make a PRD / design doc / one-pager", "system design for X", "create diagrams
  for this system", "turn my idea into a blueprint", or "build an interactive
  explainer of how X works". Trigger even when the user never says "PRD" or
  "blueprint" but is handing over a project to think through and wants a visual
  artifact. Add "grill me" to interview the user on key design decisions (TDD,
  DDD, architecture, SOLID); otherwise those are decided and logged automatically.
  Do NOT use when the user wants you to write the actual application code, only a
  single inline diagram, or a plain-text explanation — this produces a standalone
  HTML document, not working software.
license: MIT
compatibility: >-
  Authors a standalone HTML file — no external services. The optional build/validate
  step (scripts/build_blueprint.mjs) needs Node 18+ and puppeteer (one `npm install`
  in scripts/); without it, run scripts/check_structure.py (Python 3, no deps). Best
  in Claude Code.
metadata:
  author: SameehShkeer
  version: "3.0.0"
---

# Project Blueprint

Given a project the user wants to build, produce **one self-contained HTML file**
that opens in any browser with four tabs:

1. **Decisions** — the interactive design-decision log (rendered from JSON; tap
   options to explore trade-offs). See step 2.
2. **PRD** — a real product requirements document for the project.
3. **Diagrams** — class, component, sequence, activity, and state diagrams that
   accurately model *this* project.
4. **Interactive Visuals** — hands-on widgets that teach the project's core
   concepts, laddered basic → intermediate → advanced.

The deliverable is a learning + planning tool: someone should be able to open it
and come away understanding *what* is being built, *how* it's structured, *why* the
key choices were made, and *why* the key ideas work — by reading and by poking at it.
It ships with the locked, configurable design system (the floating **✦ Design**
panel toggles light/dark, vibe, typeface, and accent).

## Workflow

### 1. Understand the project

Read what the user gave you and form a concrete picture of the system: its
purpose, the main entities/data, the core user flows, and the 2–4 ideas that are
load-bearing for how it works. If the request is genuinely ambiguous on something
that would change the whole design (e.g. "build a tracker" — of what? for whom?),
ask a sharp question or two. Otherwise, make sensible assumptions, **state them in
the PRD**, and proceed — don't stall a buildable idea with a questionnaire.

(If the user asked to be **grilled** — see step 2 — fold these clarifying
questions into that design interview instead of asking here.)

### 2. Plan the design decisions ("grill me" vs auto)

A project isn't just *what* to build; it embeds *how*-to-build choices a senior
engineer would pin down first — testing methodology (TDD?), Domain-Driven Design
or not, SOLID/architecture style, REST vs GraphQL, sync vs async, persistence, and
so on. Plan the handful that are genuinely load-bearing for *this* project (a CLI
tool needs no API-style decision; a data pipeline cares about batch vs stream).
`references/design-decisions.md` has a catalog to draw from, the JSON schema, and
the render template — read it.

Then branch on what the user asked for:

- **Grill-me mode** — the request contains "grill me" (or "grill", "interview me",
  "ask me the questions"). Don't assume the load-bearing calls: interview the user.
  Use the interactive question tool in small batches, offering the realistic
  options with your **recommended** default first and a one-line reason, and record
  each answer as `decidedBy: "user"`. This interview also covers any clarifying
  questions from step 1.
- **Default (auto) mode** — the request did NOT ask to be grilled. Don't interrupt:
  decide each question yourself with the sensible default for this project, and
  record it as `decidedBy: "default"` with a rationale. The user reviews the log
  afterward and can override anything.

**Either way, log every decision** into the embedded `{{DESIGN_DECISIONS_JSON}}`
record — and that's *all* you write for the Decisions tab: the template renders the
whole interactive tab (grouped cards, tappable options with per-option rationale, a
"changed from as-built" counter, reset) straight from this JSON. Use the grouped
schema with **per-option `note`s** and an `asBuilt` choice — see
`references/design-decisions.md` for the exact shape. Nothing is decided silently,
and the choices then drive the PRD, diagrams, and visuals (a hexagonal-architecture
choice shows up in the component diagram; a TDD choice shows up in the PRD's quality
section).

### 3. Start from the template

Copy `assets/template.html` to the output file. It already contains the four-tab
shell, the locked design system, Mermaid setup, the widget-init hook, the
JSON-driven Decisions renderer, and the floating **✦ Design** switcher. You fill its
six `{{...}}` placeholders: `{{EYEBROW}}` (a short mono kicker, e.g. "Acme · Billing
Service Blueprint"), `{{PROJECT_TITLE}}` (the big title — appears twice, title bar +
header), `{{DESIGN_DECISIONS_JSON}}` (step 2's log, which renders the Decisions
tab), `{{PRD_CONTENT}}`, `{{DIAGRAMS_CONTENT}}`, and `{{VISUALS_CONTENT}}`. There is
no decisions-markup placeholder — the JSON is the whole tab. Don't rebuild the
scaffold from scratch.

**Don't touch the design system, and author content in its language.** The `<style>`
block is `assets/design-system.css` plus the component layer — a high-fidelity copy
of the source design (880px column, editorial type scale, numbered section dividers,
mono labels, soft-shadow cards). Don't invent palettes, fonts, radii, or layouts,
and don't hardcode hex colors: use the tokens (`var(--accent)`, `var(--ok)`,
`var(--warn)`, `var(--danger)`, `var(--bg-elev)`, `var(--text)`, `var(--text-dim)`,
`var(--text-faint)`, `var(--font-head/-body/-mono)`, `var(--radius/-sm/-lg)`) and the
ready-made component classes when you author the PRD/diagrams/visuals (next steps),
so everything matches and responds to the switcher in light **and** dark.

### 4. Write the PRD (`{{PRD_CONTENT}}`)

A genuine PRD, not a stub — authored in the design's editorial language. Open the
top of `{{PRD_CONTENT}}` with `<h1 class="tab-h1">` + a `<p class="lead">`, then a
row of `<span class="chip">` tags, then numbered sections. Each section is a
divider `<div class="sec"><span class="num">01</span><h2>Title</h2></div>` followed
by its content; bump the number each section. Use the ready-made classes — don't
re-style: `.card-grid` + `.card` (with a mono `.klabel ok`/`.klabel danger` header)
for Goals/Non-goals; `.tbl-wrap` + `<table class="tbl">` (mono uppercase `<th>`,
`<td class="id">` for IDs, right-aligned `<td class="r">` with a `<span class="badge
p0/p1/p2">` for priority) for the requirements table; `<code>` for inline code.

Here's a sensible section skeleton — keep what fits, drop/add as the project needs
(a CLI tool may not need personas; a data pipeline may want "data contracts"):

```
01 Problem & motivation        (who hurts, why now)
02 Goals & non-goals           (.card-grid: Goals card + Non-goals card)
03 Target users / personas
04 User stories                (As a __, I want __, so that __)
05 Functional requirements     (.tbl-wrap table: ID, requirement, priority badge)
06 Non-functional requirements (performance, security, scale, accessibility)
07 Data model                  (entities + key fields — feeds the class diagram)
08 Key user flows              (the main paths — feed the sequence/activity diagrams)
09 Milestones / phases
10 Success metrics
11 Risks & open questions       (include the assumptions you made)
```

Make it specific: real entities, real endpoints, real metrics. The data model and
flows here are the source of truth for the diagrams — keep them consistent. (The
*how*-to-build choices live in the Decisions tab, not here.)

### 5. Build the Diagrams (`{{DIAGRAMS_CONTENT}}`)

All five diagrams, each in its own `.diagram-block` card with a numbered `.dhead`
(mono `.dnum` + `<h3>` title), a short `.why` line, and a `<div class="mermaid">`
with the source. Order: **class → component → sequence → activity → state**. (The
build renders each in light **and** dark and inlines both, so they re-theme live —
just write the source.)

Read `references/mermaid-cheatsheet.md` for the exact syntax that renders on
Mermaid 11 and the idioms for component/activity diagrams (which Mermaid expresses
as flowcharts). Getting syntax right matters — a slip shows an error box instead
of a diagram.

Each diagram must be **derived from the PRD**, not generic:
- Class → domain entities + fields/methods from the data model.
- Component → the actual services/modules and request flow.
- Sequence → one core user flow, end to end.
- Activity → the decision logic of a key operation, with real branches.
- State → the lifecycle of the central entity.

Block template:

```html
<div class="diagram-block">
  <div class="dhead"><span class="dnum">01</span><h3>Class diagram</h3></div>
  <p class="why">Domain entities and their relationships.</p>
  <div class="mermaid">
classDiagram
    ...
  </div>
</div>
```

### 6. Build the Interactive Visuals (`{{VISUALS_CONTENT}}`)

This is what makes the artifact special, and where most attempts fall short. Read
`references/interactive-visuals.md` and follow it closely. In short:

- Pick the concepts (usually 2–4) that are load-bearing for *this* project,
  grouped into tiers: `.tier-1` (basic/top-level), `.tier-2` (intermediate
  mechanism), `.tier-3` (advanced — edge cases, scale, failure modes).
- Each concept is a `.concept` card with a **genuinely interactive** widget:
  sliders that redraw, canvas animation loops, step-through buttons, click-to-
  build simulations, condition toggles that show *why* a design choice exists.
- **Don't author widgets from a blank page.** Copy the closest factory from
  `assets/widget-library.js` (slider-redraw, canvas-loop, step-through, toggle-
  compare, DOM-sim, click-to-build) into the concept card and adapt its logic to
  this project. They already obey the template's contract, so you can't reintroduce
  the init-order bug. Pick by the *interaction* that fits the concept — the concept
  itself must come from the project, not from the library.
- Register each widget with `window.__widgets.push(function(){ ... })` so it
  initializes on load. Vanilla JS only — no build step, no network data.
- Every control must produce a **visible** change, and the interaction must teach
  the concept (not just decorate). One-line `.lead` per widget tells the reader
  what to try and what to notice.

Use a tier header before each group:

```html
<div class="tier-head tier-1"><span class="tier-dot"></span>
  <h2>The big idea</h2><span class="tier-label">Basic</span>
</div>
<div class="concept tier-1"> ... widget ... </div>
```

### 7. Build, validate, and make it offline

The two failure modes that wreck this artifact — a Mermaid syntax slip (error box
instead of a diagram) and a throwing/inert widget — are invisible to a quick read
of the source. Don't eyeball it; **run the bundled validator**, which loads the
file in a real headless browser and checks behavior, not just structure:

```bash
# Fast, zero-dependency static pre-check (runs anywhere, even offline sandboxes):
python3 scripts/check_structure.py <file>

# Full build + validate (needs Node + puppeteer — once: `npm install` in scripts/):
node scripts/build_blueprint.mjs <file>        # writes <file>-offline.html
```

`build_blueprint.mjs` does three things at once: it **renders every diagram and
fails loudly if any won't parse** (naming the bad one), it **inlines the rendered
SVG and strips the Mermaid CDN tag** so the output opens fully offline, and it
**smoke-tests the widgets** (2–4 registered, no console errors, every control
produces a visible change). Treat it as a feedback loop: if it reports a broken
diagram, fix the Mermaid against `references/mermaid-cheatsheet.md`; if it reports
an inert or throwing widget, fix that concept's init function; then re-run. Repeat
until it prints `PASS`. After about two passes, if a single block still won't pass,
remove or simplify it and note that in the deliverable — never ship a known-broken
block.

**If you can't run the build script** (no Node/puppeteer, or a no-network
sandbox): run `check_structure.py` at minimum, and because the Mermaid CDN tag is
still present, the file is *not* offline — say so honestly when you deliver it
("the Diagrams tab fetches Mermaid from a CDN on first load") rather than calling
it self-contained.

### 8. Name and deliver

Ship the validated, offline output (`<project-slug>-blueprint.html` — the file
`build_blueprint.mjs` wrote). Save it in the working directory or where the user
asked. Tell the user the path and give a one-line tour of the four tabs. If you ran
in auto mode, mention they can open the **Decisions** tab, tap a different option to
see the trade-off, and ask you to change any call (then rebuild).

## What "good" looks like

- The Decisions tab renders from the JSON with grouped cards whose options each
  carry a real, project-specific trade-off note — tapping them teaches something.
- The PRD reads like a real product doc someone could build from — specific, not
  boilerplate — and uses the editorial layout (numbered sections, chips, card grid,
  mono-headed tables).
- The five diagrams model the actual system and agree with the PRD's data model
  and flows.
- The interactive widgets genuinely run and genuinely teach — a reader leaves
  understanding the core ideas because they got to play with them.
- Every load-bearing design choice is recorded in the decision log, with `decidedBy`
  reflecting grill-me vs auto — nothing important was decided silently, and the
  choices visibly shape the diagrams and PRD.
- It's a high-fidelity match to the design system and reads correctly in **both
  light and dark** (and under any vibe/typeface/accent) — content uses the tokens
  and component classes, not hardcoded colors; the diagrams re-theme live.
- It passes `build_blueprint.mjs`: one file, diagrams pre-rendered, no broken tab,
  no console errors in light or dark. The diagrams and all logic work offline; the
  only network touch is Google Fonts (cosmetic — the font stacks fall back to
  system fonts offline). (If you couldn't run the build, you've told the user the
  Diagrams tab needs a CDN on first load.)
