// F79 · round 2 · the measures of Transformar v2 before showing it (prototype self-check): the side margin, targets under
// 44 px, the dock against the page (does the last row scroll above it?), text cut without an ellipsis, the fonts loaded.
// Needs headless Chrome on port 9333 (shots-v2.sh starts one). Usage: node measure-v2.mjs <file.html> > out.json
import { resolve } from 'node:path';
const [file] = process.argv.slice(2);
const STATES = ['empty', 'typing', 'scanning', 'results', 'chosen1', 'chosen', 'many', 'reorder', 'removed', 'paste', 'pastereport', 'notfound', 'error', 'noname', 'creating', 'created', 'createfail', 'guest'];
const t = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const wait = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = `(() => {
  const root = document.getElementById('f79-root');
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const small = [...root.querySelectorAll('button, input, [data-open]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent || e.placeholder || e.className).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((x) => x.h < 44 || x.w < 44);
  const cut = [...root.querySelectorAll('b, span, small, p, h1, h2, h3, em, label')].filter(vis).filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis' && getComputedStyle(e).overflow !== 'visible').map((e) => e.textContent.trim().slice(0, 40));
  const wrap = root.querySelector('.t-wrap'); const first = root.querySelector('.t-stage .t-field, .t-hero');
  const dock = root.querySelector('.t-dockwrap'); const grid = [...root.querySelectorAll('.t-card')];
  const pad = parseFloat(getComputedStyle(wrap).paddingBottom);
  const dockH = dock ? dock.getBoundingClientRect().height : 0;
  const lastBottom = grid.length ? Math.max(...grid.map((g) => g.getBoundingClientRect().bottom + scrollY)) : 0;
  const docH = document.documentElement.scrollHeight;
  return { left: first ? Math.round(first.getBoundingClientRect().left) : null, dockH: Math.round(dockH), wrapPadBottom: pad,
    lastRowClearsDock: grid.length ? (docH - lastBottom) >= dockH : null, small, cut,
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight) };
})()`;
const out = {};
for (const [w, h, mobile] of [[1280, 900, false], [393, 852, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: 'file://' + resolve(file) + '#s=empty' });
  await sleep(1800);
  for (const s of STATES) {
    await send('Runtime.evaluate', { expression: `F79.scenario('${s}'); document.body.classList.add('framed')` });
    await sleep(400);
    const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
    out[`${s}-${w}`] = r.result.result.value;
  }
}
console.log(JSON.stringify(out, null, 1));
ws.close();
