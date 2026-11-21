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

// What the page does for each state, with the controller the Home exposes (window.controller)
const SETUP = `(() => {
  const c = window.controller, list = ${JSON.stringify(fixture)};
  c.picker.service = { scanArtist: async (q) => (/floydd/i.test(q) ? { albums: [], reclassified: null } : { albums: list, reclassified: null }) };
  c.albumSearchService = { search: async (artist, title) => (/Pinkk$/.test(title) ? [] : [{ id: 'x-' + title, title, artist, year: 1976, coverUrl: null }]) };
  c.writeSeries = async () => ({ id: 'proof-only-not-saved' });
  window.__guest = (on) => { c.state.guest = on; c.redraw(); };
  window.__guest(false);
  // a search as the person makes it: the artist written in the field, then «Search»
  window.__search = (q) => { document.querySelector('#artistScanInput').value = q; return c.search(q); };
})()`;
const FOUR_JS = JSON.stringify(FOUR);
const DRIVE = {
  empty: '',
  typing: `(() => { const f = document.querySelector('#artistScanInput'); f.focus(); f.value = 'Pink Fl'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`,
  scanning: `(() => { controller.picker.service = { scanArtist: () => new Promise(() => {}) }; __search('Pink Floyd'); })()`,
  results: `__search('Pink Floyd')`,
  chosen1: `__search('Pink Floyd').then(() => controller.clickCard(${FOUR_JS}[0]))`,
  chosen: `__search('Pink Floyd').then(() => ${FOUR_JS}.forEach((i) => controller.clickCard(i)))`,
  many: `__search('Pink Floyd').then(() => { controller.addAll(); controller.setName('Pink Floyd, the studio years'); controller.redraw(); })`,
  reorder: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); if (matchMedia('(max-width: 767px)').matches) document.querySelector('.home-dock__open').click(); else controller.toggleOpen(); controller.move(${FOUR_JS}[2], -1); })`,
  removed: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); if (matchMedia('(max-width: 767px)').matches) document.querySelector('.home-dock__open').click(); else controller.toggleOpen(); controller.removeWithUndo(${FOUR_JS}[1]); })`,
  paste: `controller.setMode('paste', ${JSON.stringify(PASTE)})`,
  pastereport: `(() => { controller.setMode('paste', 'Joni Mitchell - Hejira\\nYes - Close to the Edge\\nCaravan - In the Land of Grey and Pinkk'); return controller.addPastedList(controller.view.pasteList.value()); })()`,
  notfound: `__search('Pink Floydd Qxz')`,
  error: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); controller.picker.service = { scanArtist: async () => { throw Object.assign(new Error('deadline'), { code: 'deadline' }); } }; return __search('Pink Floyd'); })`,
  noname: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); controller.setName(''); controller.redraw(); return controller.createSeries(); })`,
  creating: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); controller.writeSeries = () => new Promise(() => {}); controller.createSeries(); })`,
  created: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); return controller.createSeries(); })`,
  createfail: `__search('Pink Floyd').then(() => { ${FOUR_JS}.forEach((i) => controller.clickCard(i)); controller.writeSeries = async () => { throw Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }); }; return controller.createSeries(); })`,
  guest: `window.__guest(true)`
};


const FACTS = `(() => {
  const want = ['Joni Mitchell - Hejira', 'Radiohead OK Computer', 'Added 2 albums.', 'Added 13 albums.', 'Added 17 albums.'];
  const out = [];
  const all = [...document.querySelectorAll('body *')];
  for (const w of want) { const e = all.find(e => e.getBoundingClientRect().height > 0 && (((e.value || '') === w) || ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim() === w)))); if (e) { const c = getComputedStyle(e); out.push(w + ' | ' + e.tagName + ' ' + c.fontFamily.slice(0, 20) + ' ' + c.fontSize + ' ' + c.fontWeight); } }
  const badges = all.filter(e => /^[0-9]{1,2}$/.test((e.innerText || '').trim()) && e.children.length === 0 && e.getBoundingClientRect().height > 0).slice(0, 3).map(e => { const c = getComputedStyle(e); return e.innerText.trim() + ' ' + c.fontFamily.slice(0, 20) + ' ' + c.fontSize + ' ' + c.fontWeight; });
  return { out, badges };
})()`;
const results = {};
const shot = async (name) => { results[name] = await run(FACTS); console.log(name, JSON.stringify(results[name])); };


for (const [w, h, mobile] of [[1280, 900, false], [393, 852, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  for (const s of states) {
    if (which !== 'built') {
      await send('Page.navigate', { url: `file://${resolve('design/inception/home-transformar-v2.html')}#s=${s}` });
      await sleep(1600);
      await run(`window.F79 && F79.scenario('${s}'); document.body.classList.add('framed')`);
      await sleep(900);
      await shot(`proto-${s}-${w}.jpg`);
    }
    if (which !== 'proto') {
      await send('Page.navigate', { url: `${site}/home` });
      await sleep(3500);
      await run(SETUP);
      if (DRIVE[s]) await run(DRIVE[s]);
      await sleep(1200);
      await run('window.scrollTo(0, 0)');
      await shot(`built-${s}-${w}.jpg`);
    }
  }
}
writeFileSync(resolve(out, 'facts.json'), JSON.stringify(results, null, 1));
ws.close();
