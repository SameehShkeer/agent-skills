# Building the Interactive Visuals tab

## Contents
- The laddering principle (three tiers)
- Choosing concepts that matter for *this* project
- How to make a widget genuinely interactive (+ techniques)
- Quality bar (where artifacts fall short)
- Anti-patterns to avoid

Note: `assets/widget-library.js` has ready-to-copy widget skeletons (slider-redraw,
canvas-loop, step-through, toggle-compare, DOM-sim, click-to-build). Use those as
the mechanism; use this file to decide *which concepts* to teach and *how good* a
widget has to be.

This is the tab that makes the artifact special. The goal: take the *core ideas*
of the project being built and let the reader **learn them by doing** — dragging,
clicking, stepping, watching something change. A static diagram with a play
button is not enough. The reader should be able to form a mental model by poking
at it.

## The laddering principle

Organize concepts into three tiers so understanding compounds:

- **Tier 1 — Basic / Top-level** (`.tier-1`): the big idea a newcomer needs first.
  "What even is this thing and what problem does it solve?" Keep the interaction
  dead simple — one slider, one toggle, one button.
- **Tier 2 — Intermediate** (`.tier-2`): how the core mechanism actually works.
  This is where you simulate the real algorithm/flow at a small scale.
- **Tier 3 — Advanced** (`.tier-3`): the hard parts — edge cases, scale,
  failure modes, tradeoffs. Show what breaks and why the design handles it.

Aim for **2–4 concepts total** across the tiers (e.g. 1 basic, 1–2 intermediate,
1 advanced). Each concept is one `.concept` card with a working widget. Fewer,
genuinely interactive widgets beat many shallow ones.

## Choosing concepts that matter for *this* project

Don't explain generic CS. Explain the ideas that are load-bearing for the
specific project. Ask: "If someone understood only 3–4 things about this system,
which would let them reason about it?" These examples show the *shape* of good
laddering — they are not a menu to pick from. Derive your concepts from this
project's own load-bearing ideas; if it resembles none of these, that's expected.

- URL shortener → (1) hashing long→short, (2) collision handling, (3) redirect lookup at scale / caching.
- Rate limiter → (1) what throttling feels like, (2) token-bucket refill, (3) distributed counters with clock skew.
- Chat app → (1) message send/receive, (2) websocket vs polling, (3) delivery ordering & offline sync.
- Habit tracker → (1) streak counting, (2) the streak-break grace logic, (3) timezone-correct day boundaries.

Each concept should connect back to a real requirement in the PRD.

## How to make a widget genuinely interactive

Every widget lives in a `.concept` block and registers an init function so it
wires up after load:

```html
<div class="concept tier-2">
  <h3>Token bucket refill</h3>
  <p class="lead">Tokens drip in at a fixed rate. Each request spends one. Empty bucket → request is throttled.</p>
  <div class="stage">
    <canvas id="bucketCanvas" width="600" height="180"></canvas>
    <div class="controls">
      <label>Refill rate (tokens/s)
        <input id="rate" type="range" min="1" max="10" value="3" />
      </label>
      <button class="action" id="sendReq">Send request</button>
      <span class="readout" id="bucketRead">tokens: 5</span>
    </div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const cv = document.getElementById('bucketCanvas');
  const ctx = cv.getContext('2d');
  let tokens = 5, capacity = 10, last = 0;
  const rateEl = document.getElementById('rate');
  const read = document.getElementById('bucketRead');
  document.getElementById('sendReq').addEventListener('click', () => {
    if (tokens >= 1) { tokens -= 1; flash('#7ee0c0'); } else { flash('#ff6b6b'); }
  });
  let flashColor = null, flashUntil = 0;
  function flash(c){ flashColor = c; flashUntil = 600; }
  function frame(t){
    const dt = last ? (t - last) / 1000 : 0; last = t;
    tokens = Math.min(capacity, tokens + dt * Number(rateEl.value));
    read.textContent = 'tokens: ' + tokens.toFixed(1);
    ctx.clearRect(0,0,cv.width,cv.height);
    // draw bucket fill
    const w = cv.width - 20, h = cv.height - 20;
    ctx.strokeStyle = '#2a2f3a'; ctx.strokeRect(10,10,w,h);
    ctx.fillStyle = '#6ea8fe';
    const fillH = h * (tokens / capacity);
    ctx.fillRect(10, 10 + (h - fillH), w, fillH);
    if (flashUntil > 0) { flashUntil -= dt*1000; ctx.fillStyle = flashColor; ctx.globalAlpha = 0.25; ctx.fillRect(10,10,w,h); ctx.globalAlpha = 1; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
</script>
```

This is one worked example to show the registration + animation-loop pattern — not
a widget to reuse. The token bucket only fits a project that actually has a
refill/throttle idea; for anything else, start from the closest skeleton in
`assets/widget-library.js` and put *this* project's logic in it.

Key techniques you can mix and match — pick whatever fits the concept:

- **Slider → live readout/redraw**: parameter on a range input drives a number,
  bar, or canvas drawing that updates on `input`.
- **Canvas animation loop**: `requestAnimationFrame` for anything that flows,
  fills, moves, or decays over time (queues, buckets, packets, particles).
- **Step-through**: a "Next step" button that advances an algorithm one move at a
  time, highlighting the active element (great for hashing, sorting, lookups,
  state transitions).
- **Click-to-add / build**: let the reader add nodes, send messages, insert keys,
  and watch the structure respond.
- **Toggle a condition**: a switch that flips between "naive" and "with the fix"
  so the reader sees *why* a design choice exists (e.g. caching on/off, retry
  on/off) and the readout changes.
- **Small DOM/SVG simulations**: for discrete things (a hash table's buckets, a
  list of connected clients) plain divs/SVG you mutate are clearer than canvas.

## Quality bar (this is where artifacts usually fall short)

- **It must actually run.** No external data, no build step, no imports beyond
  what's already on the page. Vanilla JS only. Don't trust a read-through — the
  build step (`scripts/build_blueprint.mjs`, the "Build, validate" step in
  SKILL.md) loads the file in a real
  browser and will fail the build on a throwing or inert widget.
- **State changes visibly.** If moving the slider doesn't change anything on
  screen, it's not interactive. Every control must have a visible effect.
- **Tie the interaction to the lesson.** A pretty animation that doesn't teach the
  concept is decoration. The reader should come away understanding the *idea*,
  not just having watched a loop.
- **Self-explanatory.** Each widget has a one-line `.lead` saying what to try and
  what to notice. The reader shouldn't need you there to get it.
- **Use the design tokens, not hardcoded colors.** Colors and fonts come from the
  locked design system: `var(--accent)`, `var(--accent-contrast)`, `var(--ok)`,
  `var(--warn)`, `var(--danger)`, `var(--bg)`, `var(--bg-elev)`, `var(--bg-elev-2)`,
  `var(--text)`, `var(--text-dim)`, `var(--border)`, `var(--font-mono)`. Style
  widgets with these so they adapt when the reader flips light/dark, direction, or
  accent. For canvas drawing where you need a literal color string, read the token
  at runtime: `getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`
  (re-read it if you want the canvas to follow live accent/theme changes).
- **Register via `window.__widgets.push(fn)`** so it initializes cleanly, and
  scope your variables inside the function to avoid collisions between widgets.

## Anti-patterns to avoid

- A `<video>`, image, or static SVG labelled "interactive". It isn't.
- A button that just `alert()`s or toggles a `display` with no model behind it.
- Re-explaining generic programming concepts unrelated to the project.
- One giant widget trying to show everything — split into tiered concepts.
- Libraries that need network/build (React JSX without a transpiler, d3 modules
  via bare import). If you use a CDN lib, use the global-script (UMD) build and
  verify the global name.
