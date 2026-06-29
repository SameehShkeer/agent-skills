# project-blueprint

> Turn a project idea into one **self-contained HTML file** — an interactive
> Decisions log, a full PRD, Mermaid diagrams, and hands-on teaching widgets —
> with a configurable light/dark design system baked in.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/hero-dark.png">
  <img alt="project-blueprint output" src="../../docs/assets/hero-light.png" width="760">
</picture>

## What it does

Give it a project (`/project-blueprint spec out a URL shortener`) and it produces one
HTML file with four tabs:

| Tab | What's in it |
|---|---|
| **Decisions** | An interactive design-decision log — tap an option to see the trade-off; "changed from as-built" counter; reset. |
| **PRD** | A real product-requirements doc in an editorial layout (numbered sections, requirement tables, goal/non-goal cards). |
| **Diagrams** | Class, component, sequence, activity & state diagrams (Mermaid), re-themed live with the palette. |
| **Interactive** | 2–4 hands-on widgets that teach the project's core concepts, laddered basic → advanced. |

Add **`grill me`** to be interviewed on the engineering decisions (TDD? DDD?
architecture? persistence?) before it builds; otherwise it decides and logs them
for you to review.

## Install

**Marketplace (recommended):**
```text
/plugin marketplace add SameehShkeer/agent-skills
/plugin install project-blueprint@sameeh-skills
```

**Manual:**
```bash
cp -r skills/project-blueprint ~/.claude/skills/project-blueprint
```

Then: `/project-blueprint <your idea>`

## What's in the box

```
project-blueprint/
├── SKILL.md                       # the skill (workflow + frontmatter)
├── assets/
│   ├── design-system.css          # the locked, configurable design system (source of truth)
│   ├── template.html              # the 4-tab artifact scaffold
│   └── widget-library.js          # vetted copy-paste interactive widgets
├── references/
│   ├── design-decisions.md        # the decision-log schema + catalog
│   ├── mermaid-cheatsheet.md      # diagram syntax that renders on Mermaid 11
│   └── interactive-visuals.md     # how to build genuinely-interactive widgets
├── scripts/
│   ├── build_blueprint.mjs        # renders diagrams (light+dark) to inline SVG + validates (Node + puppeteer)
│   └── check_structure.py         # zero-dependency static validator (Python 3)
└── evals/                         # test prompts + assertions
```

## Dependencies & trust

- The **output** HTML is self-contained and opens offline; the only network touch is
  Google Fonts (graceful fallback to system fonts).
- The optional **build/validate** step (`scripts/build_blueprint.mjs`) uses Node +
  puppeteer (a headless browser) to render diagrams and smoke-test widgets. It runs
  only when you invoke it; it fetches Mermaid from a CDN **at build time** and
  produces an offline file. `scripts/check_structure.py` needs nothing.

See the repo [SECURITY.md](../../SECURITY.md). Licensed under [MIT](../../LICENSE).
