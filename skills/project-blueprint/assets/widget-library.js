/* =====================================================================
   widget-library.js — vetted, copy-paste widget patterns for the
   Interactive Visuals tab.

   This is a READ/COPY asset, not something to link or execute. Each block
   below is a complete, working `window.__widgets.push(function(){ ... })`
   widget that already obeys the template's contract:
     - registers via window.__widgets.push (defined in the template <head>)
     - scopes all its vars inside the function (no collisions between widgets)
     - uses the template's classes (.stage, .controls, button.action, .readout)
     - every control produces a visible change

   HOW TO USE: pick the pattern whose *interaction* fits the concept you're
   teaching, paste BOTH its HTML and its <script> into the concept card, then
   replace the toy logic with the real logic of this project. These are
   starting skeletons that are known to run — not finished widgets, and NOT a
   menu of concepts to teach. The concept must come from the project; the
   pattern is just the mechanism.

   Contents:
     1. sliderRedraw   — a range input drives a number / bar / canvas redraw
     2. canvasLoop     — requestAnimationFrame animation (flow, fill, decay)
     3. stepThrough    — a "Next" button advances an algorithm one move
     4. toggleCompare  — a switch flips naive vs fixed so the reader sees WHY
     5. domSim         — mutate divs/SVG for discrete structures (buckets, lists)
     6. clickToBuild   — reader adds items and the structure responds
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. sliderRedraw — parameter on a range input updates a readout + bars.
   Good for: "as you increase X, Y responds" relationships.
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-1">
  <h3>Concept title</h3>
  <p class="lead">Drag the slider and watch the value respond.</p>
  <div class="stage">
    <div class="controls">
      <label>load = <span id="srVal" class="readout">3</span>
        <input id="srInput" type="range" min="1" max="10" value="3">
      </label>
    </div>
    <div id="srBars" style="display:flex;align-items:flex-end;gap:6px;height:120px;margin-top:12px;"></div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const input = document.getElementById('srInput');
  const val = document.getElementById('srVal');
  const bars = document.getElementById('srBars');
  function render() {
    const n = Number(input.value);
    val.textContent = n;
    bars.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('div');
      const active = i < n;
      b.style.cssText = `flex:1;height:${10 + i * 10}px;border-radius:4px 4px 0 0;
        background:${active ? 'var(--accent)' : 'var(--bg)'};border:1px solid var(--border);`;
      bars.appendChild(b);
    }
  }
  input.addEventListener('input', render);
  render();
});
</script>
*/


/* ---------------------------------------------------------------------
   2. canvasLoop — requestAnimationFrame loop. Use for anything that flows,
   fills, decays, or moves over time (queues, buckets, packets, particles).
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-2">
  <h3>Concept title</h3>
  <p class="lead">Press the button to add work; watch the buffer drain over time.</p>
  <div class="stage">
    <canvas id="clCanvas" width="600" height="160"></canvas>
    <div class="controls">
      <label>drain rate <input id="clRate" type="range" min="1" max="10" value="3"></label>
      <button class="action" id="clAdd">Add work</button>
      <span id="clRead" class="readout">level: 0</span>
    </div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const cv = document.getElementById('clCanvas'), ctx = cv.getContext('2d');
  const rate = document.getElementById('clRate'), read = document.getElementById('clRead');
  let level = 0, last = 0;
  document.getElementById('clAdd').addEventListener('click', () => { level = Math.min(100, level + 25); });
  function frame(t) {
    const dt = last ? (t - last) / 1000 : 0; last = t;
    level = Math.max(0, level - dt * Number(rate.value) * 4);
    read.textContent = 'level: ' + level.toFixed(0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#6ea8fe';
    ctx.fillRect(0, cv.height - (level / 100) * cv.height, cv.width, cv.height);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
</script>
*/


/* ---------------------------------------------------------------------
   3. stepThrough — a "Next step" button advances an algorithm one move at a
   time, highlighting the active element. Great for hashing, sorting,
   lookups, traversals, state transitions.
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-2">
  <h3>Concept title</h3>
  <p class="lead">Step through the algorithm; the active item is highlighted.</p>
  <div class="stage">
    <div id="stItems" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
    <div class="controls">
      <button class="action secondary" id="stReset">Reset</button>
      <button class="action" id="stNext">Next step ▶</button>
      <span id="stLog" class="readout"></span>
    </div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const data = [5, 2, 8, 1, 9, 3];
  const wrap = document.getElementById('stItems'), log = document.getElementById('stLog');
  let i = 0;
  function render() {
    wrap.innerHTML = '';
    data.forEach((v, idx) => {
      const cell = document.createElement('div');
      const active = idx === i;
      cell.textContent = v;
      cell.style.cssText = `width:38px;height:42px;display:flex;align-items:center;justify-content:center;
        font-family:var(--font-mono);font-weight:700;border-radius:var(--radius);color:${active ? 'var(--accent-contrast)' : 'var(--text)'};
        background:${active ? 'var(--accent)' : 'var(--bg)'};border:1px solid var(--border);`;
      wrap.appendChild(cell);
    });
    log.textContent = `visiting index ${i} (value ${data[i]})`;
  }
  document.getElementById('stNext').addEventListener('click', () => { i = (i + 1) % data.length; render(); });
  document.getElementById('stReset').addEventListener('click', () => { i = 0; render(); });
  render();
});
</script>
*/


/* ---------------------------------------------------------------------
   4. toggleCompare — a switch flips between "naive" and "with the fix" so the
   reader sees WHY a design choice exists. The readout must change with it.
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-3">
  <h3>Why we added X</h3>
  <p class="lead">Toggle the fix on and off and watch the outcome change.</p>
  <div class="stage">
    <div class="controls">
      <label><input id="tcFix" type="checkbox"> enable the fix</label>
      <button class="action" id="tcRun">Run 1000 requests</button>
    </div>
    <div id="tcOut" class="readout" style="margin-top:12px;"></div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const fix = document.getElementById('tcFix'), out = document.getElementById('tcOut');
  function run() {
    // replace with the project's real naive-vs-fixed computation
    const failures = fix.checked ? 3 : 240;
    out.textContent = `result: ${failures} failures / 1000 ` + (fix.checked ? '(fix on)' : '(fix off)');
    out.style.color = fix.checked ? 'var(--ok)' : 'var(--danger)';
  }
  document.getElementById('tcRun').addEventListener('click', run);
  fix.addEventListener('change', run);
  run();
});
</script>
*/


/* ---------------------------------------------------------------------
   5. domSim — mutate plain divs/SVG for discrete structures: hash buckets,
   a list of connected clients, a small table. Clearer than canvas for
   discrete state.
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-2">
  <h3>Concept title</h3>
  <p class="lead">Insert a key and watch which bucket it lands in.</p>
  <div class="stage">
    <div class="controls">
      <input id="dsKey" type="text" placeholder="key" style="font:inherit;padding:5px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:6px;">
      <button class="action" id="dsAdd">Insert</button>
    </div>
    <div id="dsBuckets" style="display:flex;gap:8px;margin-top:12px;"></div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const N = 5, buckets = Array.from({ length: N }, () => []);
  const wrap = document.getElementById('dsBuckets'), key = document.getElementById('dsKey');
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % N; return h; }
  function render() {
    wrap.innerHTML = '';
    buckets.forEach((items, i) => {
      const col = document.createElement('div');
      col.style.cssText = 'flex:1;min-height:60px;border:1px solid var(--border);border-radius:8px;padding:6px;background:var(--bg);';
      col.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">bucket ${i}</div>` +
        items.map(k => `<div style="font-family:var(--font-mono);font-size:12px;color:var(--ok);">${k}</div>`).join('');
      wrap.appendChild(col);
    });
  }
  function add() { const k = key.value.trim(); if (!k) return; buckets[hash(k)].push(k); key.value = ''; render(); }
  document.getElementById('dsAdd').addEventListener('click', add);
  render();
});
</script>
*/


/* ---------------------------------------------------------------------
   6. clickToBuild — the reader adds items (nodes, messages, points) and the
   structure responds. Good for graphs, queues, timelines, growing sets.
--------------------------------------------------------------------- */
/*  HTML:
<div class="concept tier-3">
  <h3>Concept title</h3>
  <p class="lead">Click the canvas to add points; the running stat updates.</p>
  <div class="stage">
    <canvas id="cbCanvas" width="600" height="200" style="cursor:crosshair;"></canvas>
    <div class="controls"><span id="cbStat" class="readout">points: 0</span>
      <button class="action secondary" id="cbClear">Clear</button></div>
  </div>
</div>
<script>
window.__widgets.push(function () {
  const cv = document.getElementById('cbCanvas'), ctx = cv.getContext('2d');
  const stat = document.getElementById('cbStat');
  let pts = [];
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#6ea8fe';
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); });
    stat.textContent = 'points: ' + pts.length;
  }
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect();
    pts.push({ x: e.clientX - r.left, y: e.clientY - r.top }); draw();
  });
  document.getElementById('cbClear').addEventListener('click', () => { pts = []; draw(); });
  draw();
});
</script>
*/
