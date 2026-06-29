# Planning & recording design decisions

Every project carries *how-to-build* choices that the bare feature request doesn't
state: testing methodology, architecture style, persistence, API shape, and so on.
This skill surfaces those choices instead of burying them — it plans the ones that
actually matter for *this* project, then either **asks the user** (grill-me mode)
or **decides them itself** (default mode), and in both cases writes a structured,
reviewable **decision log** into the artifact.

## Contents
- Which decisions to plan (catalog — draw from it, don't dump it)
- Grill-me vs default (auto) mode
- The decision-log JSON schema (drives the interactive Decisions tab)
- How it renders
- How decisions flow into the rest of the blueprint

---

## Which decisions to plan

Pick the handful that are genuinely load-bearing for this project — the choices
that, if made differently, would change the code or the architecture. A small CLI
tool doesn't need an API-style decision; a data pipeline cares about batch vs
stream far more than about REST vs GraphQL. Aim for the vital few (often ~5–10),
not an exhaustive interrogation. The catalog below is a menu to draw from and a
prompt for your own project-specific questions — not a checklist to ask in full.

| Category | Example decision | Typical options |
|---|---|---|
| Testing methodology | Test-first or test-after? | TDD · test-after · BDD · minimal/smoke only |
| Design approach | Model the domain explicitly? | Domain-Driven Design · transaction-script · CRUD-first |
| Code principles | Which discipline to lean on? | SOLID/OOP · functional core · pragmatic/mixed |
| Architecture style | How are modules arranged? | layered · hexagonal/ports-&-adapters · clean · MVC · event-driven |
| System shape | One deployable or many? | monolith · modular monolith · microservices |
| Persistence | How is state stored? | relational/SQL · document/NoSQL · event-sourcing · in-memory · file |
| Data access | How does code reach the store? | ORM · query builder · raw SQL · repository pattern |
| API style | How do clients talk to it? | REST · GraphQL · gRPC · RPC · none (library/CLI) |
| Sync vs async | How is work coordinated? | synchronous request/response · message queue · streaming · batch |
| Auth & security | Who can do what? | session · JWT · OAuth/OIDC · API keys · none (internal) |
| Error handling | How are failures expressed? | exceptions · result/either types · error codes |
| Observability | What's instrumented? | structured logs · metrics · tracing · minimal |
| Tech stack | Language/runtime/framework | (project-specific) |
| Scale target | What load is assumed? | single-user · team · public/high-traffic |
| Deployment | Where does it run? | local · single VM/container · serverless · k8s |

Add categories the project demands and drop ones it doesn't. The goal is the
decisions a senior engineer would want pinned down before writing code.

## Grill-me vs default (auto) mode

Detect the mode from the user's request:

- **Grill-me mode** — the request contains "grill me" (or close variants: "grill",
  "interview me", "ask me the questions", "quiz me on the design"). Don't assume
  anything load-bearing: walk the user through each planned decision and use their
  answers. This is the full design interview, so it also absorbs any project-
  clarifying questions you'd otherwise ask in the "Understand the project" step —
  fold them into the same interview rather than asking twice.
  - Ask with the interactive question tool, in batches (a few at a time, not all at
    once). For each decision, present the realistic options and put your
    **recommended** default first, labelled as recommended, with a one-line reason —
    the user is choosing, but shouldn't have to be an expert to answer.
  - Record each answer with `decidedBy: "user"`.

- **Default (auto) mode** — the request does NOT ask to be grilled. Do **not**
  interrupt the user. Decide every planned question yourself: pick the sensible
  default for this project and move on. Record each with `decidedBy: "default"` and
  a rationale that explains *why* it's the right default here. The user can read the
  decision log afterward and override anything.

The two modes produce the *same* artifact shape — the only differences are who made
each call (`decidedBy`) and whether you paused to ask. Default mode is what runs in
non-interactive contexts (and what keeps the skill usable without a back-and-forth).

## The decision-log JSON schema

The **Decisions** tab (tab 01) is rendered *entirely* from this JSON by the
template — you don't hand-write any markup for it. Just fill the
`{{DESIGN_DECISIONS_JSON}}` placeholder (embedded as
`<script type="application/json" id="design-decisions">`, so it travels inside the
single file and is machine-readable) and the template builds the interactive
what-if explorer: grouped cards, tappable options, per-option rationale, a
"changed from as-built" counter, and a reset button.

Use this grouped shape. The key richness vs. a flat list: each option carries its
**own `note`** (the rationale *if you picked that option*), so tapping a different
option live-updates the explanation. `asBuilt` is the choice the project actually
took (the one decided in grill-me or auto mode).

```json
{
  "mode": "grilled",                       // "grilled" | "auto"
  "project": "<project name>",
  "groups": [
    {
      "cat": "Testing & quality",
      "decisions": [
        {
          "id": "testing-methodology",     // short kebab-case slug, unique
          "title": "Test-first or test-after?",
          "question": "How should correctness be pinned down as the code grows?",
          "decidedBy": "user",             // "user" (grilled) | "default" (auto)
          "asBuilt": "TDD (test-first)",   // the choice actually taken
          "options": [
            { "label": "TDD (test-first)", "note": "Crisp correct/incorrect signal makes red-green-refactor cheap and catches carry bugs the moment they appear." },
            { "label": "Test-after",       "note": "Faster to a first spike, but regressions slip in before tests exist; fine for a throwaway prototype." },
            { "label": "Smoke only",       "note": "Minimal safety net — acceptable only if this is a demo you'll discard." }
          ]
        }
      ]
    }
  ]
}
```

Rules that keep the tab good:
- Each option's `note` must be *specific to this project* and explain the trade-off
  of choosing it — the reader taps to compare, so all notes matter, not just the winner.
- `asBuilt` must match one option `label` exactly. `decidedBy: "user"` for grilled,
  `"default"` for auto.
- A flat `{ "decisions": [...] }` (each with a `category`) is also accepted — the
  template groups by `category` — but grouped is preferred.

## How it renders

You write **no** decisions markup. The template's renderer reads the JSON and
produces the tab: category headers, a card per decision (title + a `you`/`auto`
status pill + the question + an option button row with the as-built option tagged +
the selected option's note under a dashed rule + a "↪ what-if" line when the reader
explores a different choice). A reader can also recover the raw record with
`JSON.parse(document.getElementById('design-decisions').textContent)`.

If the user explicitly wants the decisions as a standalone file too, you may also
write a sidecar `<project-slug>-decisions.json` — but the embedded block is the
primary record so the deliverable stays one self-contained file.

## How decisions flow into the rest of the blueprint

The decision log isn't a side artifact — it's the design spine. Once decided, the
choices must show up downstream:

- A **hexagonal/clean** architecture choice → the component diagram shows ports &
  adapters, not a flat layering.
- A **TDD** choice → the PRD's non-functional/quality section mentions the test
  strategy and coverage expectation.
- A **microservices** choice → the component and sequence diagrams show service
  boundaries and inter-service calls.
- An **event-sourcing** choice → the state diagram and data model reflect events,
  not just current-state rows.

If a diagram or PRD section would look the same regardless of the decisions logged,
the decisions aren't actually informing the design — fix that.
