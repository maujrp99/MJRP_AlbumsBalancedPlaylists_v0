// F79 · screenshots of the prototypes, by headless Chrome over the DevTools protocol (Chrome started with
// --remote-debugging-port=9333). Used to check each version before showing it, and to draw the wireframes (#wire mode).
// Usage: node shots.mjs <out dir> <file.html> <scenario,scenario|all> [wire] [w1280|w393|both]
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const [out, file, scen = 'all', wire = '', widths = 'both'] = process.argv.slice(2);
const ALL = ['empty', 'scanning', 'results', 'chosen', 'paste', 'error', 'notfound'];
mkdirSync(out, { recursive: true });
const t = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const wait = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable');
const ws_ = widths === 'both' ? [[1280, 900, false], [393, 852, true]] : widths === 'w1280' ? [[1280, 900, false]] : [[393, 852, true]];
for (const [w, h, mobile] of ws_) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  for (const s of scen === 'all' ? ALL : scen.split(',')) {
    await send('Page.navigate', { url: 'file://' + resolve(file) + `#s=${s}${wire ? '&wire' : ''}` });
    await sleep(1500);
    await send('Runtime.evaluate', { expression: `window.F79 && F79.scenario('${s}'); document.body.classList.add('framed')` });
    await sleep(900);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const name = `${basename(file, '.html')}-${s}-${w}${wire ? '-wire' : ''}.png`;
    writeFileSync(resolve(out, name), Buffer.from(r.result.data, 'base64'));
    console.log(name);
  }
}
ws.close();
