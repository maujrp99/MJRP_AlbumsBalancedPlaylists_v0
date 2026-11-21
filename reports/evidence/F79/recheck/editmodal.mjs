// F79 · the browser proof: the built Home driven to each of the 18 states of the approved prototype
// (design/inception/home-transformar-v2.html), at 1280 x 900 and 393 x 852, beside the prototype's own captures.
// Headless Chrome over the DevTools protocol (started by shoot.sh with --remote-debugging-port=$PORT).
//
// The two seams of the proof, set in the page and nowhere else: the catalog answers with the Pink Floyd scan the
// prototype captured (design/proposals/f79-home/build/capture.json; the other types are fillers, only for the counts
// of the chips), and the series is never written: HomeController.writeSeries is replaced by a promise this script
// decides (resolved, pending or failed). Nothing is written to Firestore.
//
// Usage: node reports/evidence/F79/shoot.mjs <out dir> <site url> <port> [state,state] [proto|built|both]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [out, site, port = '9379', only = '', which = 'both'] = process.argv.slice(2);
const STATES = ['empty', 'typing', 'scanning', 'results', 'chosen1', 'chosen', 'many', 'reorder', 'removed', 'paste',
  'pastereport', 'notfound', 'error', 'noname', 'creating', 'created', 'createfail', 'guest'];
const states = only ? only.split(',') : STATES;
mkdirSync(out, { recursive: true });

const capture = JSON.parse(readFileSync(resolve('design/proposals/f79-home/build/capture.json'), 'utf8'));
const fixture = capture.albums.map((a) => ({ id: a.id, title: a.title, artist: 'Pink Floyd', year: a.year, releaseDate: `${a.year}-06-01`, type: 'Album', coverUrl: a.cover.replace('300x300bb', '{w}x{h}bb') }));
[['Single', 15], ['Live', 5], ['Compilation', 15]].forEach(([k, n]) => { for (let j = 0; j < n; j++) fixture.push({ id: `x-${k}-${j}`, title: `${k} ${j + 1}`, artist: 'Pink Floyd', year: '2000', releaseDate: '2000-01-01', type: k, coverUrl: null }); });
const FOUR = [0, 2, 3, 5].map((i) => fixture[i].id);
const PASTE = 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk';

const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const wait = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(r.result.exceptionDetails).slice(0, 300)}`);
  return r.result?.result?.value;
};
await send('Page.enable');


const OPEN = `(async () => {
  const { SeriesEditModal } = await import('/js/components/series/SeriesEditModal.js');
  const list = ${JSON.stringify(fixture)};
  const m = new SeriesEditModal({ id: 'proof-only', name: 'Pink Floyd selection', albumQueries: ['Pink Floyd - Animals 50', 'Pink Floyd - The Endless River', 'Pink Floyd - A Momentary Lapse of Reason'] }, () => {});
  m.picker.controller.service = { scanArtist: async () => ({ albums: list, reclassified: null }) };
  m.mount(); window.__m = m;
  const inp = document.querySelector('#edit-series-modal input[type=search], #edit-series-modal input:not([value])') ;
  await m.picker.controller.searchArtist('Pink Floyd');
  return document.querySelector('#edit-series-modal') ? 'ok' : 'no modal';
})()`;
for (const [w, h, mobile] of [[1280, 900, false], [393, 852, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: `${site}/home` });
  await sleep(3500);
  console.log(await run(OPEN));
  await sleep(1500);
  let r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(resolve(out, `edit-modal-${w}.jpg`), Buffer.from(r.result.data, 'base64'));
  console.log(await run(`(() => { const el = document.querySelector('#edit-series-modal'); const sc = [...el.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))[0]; if (sc) sc.scrollTop = sc.scrollHeight; return JSON.stringify({ hs: document.documentElement.scrollWidth > innerWidth + 1, sc: !!sc }); })()`));
  await sleep(800);
  r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(resolve(out, `edit-modal-${w}-scrolled.jpg`), Buffer.from(r.result.data, 'base64'));
}
ws.close();
