# Mermaid cheat-sheet for the 5 required diagrams

## Contents
- General rules that prevent most failures
- 1. Class diagram
- 2. Component diagram (flowchart idiom)
- 3. Sequence diagram
- 4. Activity diagram (flowchart idiom)
- 5. State diagram
- Where diagram *content* comes from (→ SKILL.md's "Build the Diagrams" step)

This file is about **syntax** — the forms that render on Mermaid 11. What each
diagram should *depict* is decided in SKILL.md's "Build the Diagrams" step (derive
it from the PRD).

The Diagrams tab must contain all five of these, in this order, each in its own
`.diagram-block`. Mermaid renders client-side during authoring, so a single syntax
slip makes a diagram show an error box instead of a picture — the build step
(`scripts/build_blueprint.mjs`) catches this before handoff, but it's cheaper to
get it right here. The patterns below are known to render on Mermaid 11. When in
doubt, prefer the simpler form here over a fancier construct you're unsure about.

General rules that prevent most failures:
- Put each diagram's source inside `<div class="mermaid"> ... </div>`. Do **not**
  HTML-escape it (write `<`, `>`, `&` only where the syntax itself needs them).
- Keep node IDs alphanumeric (`UserSvc`, not `User Svc`). Put spaces/punctuation
  in the **label**, e.g. `UserSvc["User Service"]`.
- Avoid parentheses, `{`, `}`, `:` and `;` inside un-quoted labels — quote the
  label if you need them: `A["fetch(id): User"]`.
- Don't put a comment on the same line as a statement. `%%` comments go on their
  own line.
- One statement per line. Blank lines are fine.

---

## 1. Class diagram

```
classDiagram
    class User {
        +String id
        +String email
        -String passwordHash
        +login(password) bool
        +logout() void
    }
    class Order {
        +String id
        +Date createdAt
        +total() Money
    }
    class OrderItem {
        +int quantity
    }
    User "1" --> "*" Order : places
    Order "1" *-- "*" OrderItem : contains
    Order ..|> Payable : implements
```

Relationship arrows: `<|--` inheritance, `*--` composition, `o--` aggregation,
`-->` association, `..>` dependency, `..|>` realization. Multiplicity goes in
quotes on each side. Visibility: `+` public, `-` private, `#` protected.

## 2. Component diagram

Mermaid has no dedicated "component" type; use a `flowchart` with `subgraph`s to
group components and show interfaces/dependencies. This is the accepted idiom.

```
flowchart TB
    subgraph Client["Web Client"]
        UI["React UI"]
    end
    subgraph Backend["API Server"]
        API["REST API"]
        Auth["Auth Service"]
        Orders["Order Service"]
    end
    subgraph Data["Data Layer"]
        DB[("PostgreSQL")]
        Cache[("Redis")]
    end
    UI -->|HTTPS| API
    API --> Auth
    API --> Orders
    Orders --> DB
    Auth --> Cache
```

Use `[(" ")]` for datastores/cylinders, `(" ")` for services, `[" "]` for plain
components. Direction `TB` (top-bottom) or `LR` (left-right).

## 3. Sequence diagram

```
sequenceDiagram
    actor U as User
    participant API
    participant DB as Database
    U->>API: POST /login {email, pw}
    activate API
    API->>DB: SELECT user WHERE email
    DB-->>API: user row
    alt password valid
        API-->>U: 200 + JWT
    else invalid
        API-->>U: 401 Unauthorized
    end
    deactivate API
```

`->>` solid call, `-->>` dashed return. Wrap conditional flows in
`alt/else/end`, loops in `loop/end`, parallel in `par/and/end`. Declare
participants up front to control ordering.

## 4. Activity diagram

Mermaid has no `activity` keyword; the standard substitute is a `flowchart` with
decision diamonds — it reads as an activity/flow diagram.

```
flowchart TD
    Start([Start]) --> Input[/Enter URL/]
    Input --> Valid{Valid URL?}
    Valid -->|No| Err[Show error] --> Input
    Valid -->|Yes| Gen[Generate short code]
    Gen --> Exists{Code collision?}
    Exists -->|Yes| Gen
    Exists -->|No| Save[(Save mapping)]
    Save --> Done([Return short URL])
```

`([text])` start/end (stadium), `[/text/]` input/output, `{text}` decision,
`[text]` action, `[(text)]` datastore.

## 5. State diagram

```
stateDiagram-v2
    [*] --> Draft
    Draft --> InReview : submit
    InReview --> Draft : request changes
    InReview --> Published : approve
    Published --> Archived : archive
    Archived --> [*]
    state InReview {
        [*] --> Pending
        Pending --> Checking : reviewer opens
        Checking --> [*]
    }
```

`[*]` is the start/end pseudostate. Transitions: `A --> B : event`. Nest
substates inside `state Name { ... }`.

---

## Where diagram *content* comes from

This file gave you the syntax. *What* each diagram depicts is decided in
SKILL.md's **"Build the Diagrams"** step — derive every diagram from the PRD's
data model and flows. A
diagram that would look identical for any app is a failure: name real entities,
real endpoints, real states.
