// The visual parity sensor of the Album Blender (sensors.visual in .mjrp-project.yml): the screen against its approved visual
// references, run by the harness kit (mjrp-scripts/visual_parity/). Run it through the machine's queue:
//   python3 <harness>/mjrp-scripts/machine_load.py run --label v0-visual-sensor --wait 3600 -- \
//     node mjrp-scripts/visual_parity/run.mjs test/visual/visual.config.mjs
//
// The two references (docs/specs/info-arch.md § Protótipos aprovados), both live HTML served from design/:
//   F79 the Home            design/inception/home-transformar-v2.html   the 18 states, at 1280 and 393
//   F80 the entry page      design/inception/splash-crate-v2.html       the scroll positions, at 1280 and 393, fire «brando» (?fire=soft),
//                                                                       the default fictional covers
//
// No signed-in account: the product is the local Vite dev server of this working tree (127.0.0.1 only), the page is reached as a
// visitor (the app signs the visitor in anonymously by itself). NOTHING IS WRITTEN TO PRODUCTION DATA: the same two seams the F79
// browser proof used are set inside the page and nowhere else — the catalog answers with the «Pink Floyd» scan the prototype
// captured (design/proposals/f79-home/build/capture.json) and HomeController.writeSeries is replaced by a promise this file decides
// (resolved, pending or failed), so the series is never saved.
//
// Not covered by the conditions the kit can express (the kit has no reduced-motion, no-WebGL or no-JavaScript condition): the F80
// «reduced motion», «no JS», «CSS crate» and «motion at rest» states stay with the independent recheck's own captures
// (reports/evidence/F80/recheck/).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
// the Home's route: `/home` on main; F85 moves it to `/start` and makes `/home` redirect to it. Both reach the same page; set
// VISUAL_HOME_PATH=/start to skip the redirect once F85 is in.
const HOME_PATH = process.env.VISUAL_HOME_PATH ?? '/home';
const PRODUCT_PORT = process.env.VISUAL_PRODUCT_PORT ?? '5391';

// ---- F79 · the Home: the 18 states ------------------------------------------------------------------------------------------
const capture = JSON.parse(readFileSync(resolve(root, 'design/proposals/f79-home/build/capture.json'), 'utf8'));
const fixture = capture.albums.map((a) => ({ id: a.id, title: a.title, artist: 'Pink Floyd', year: a.year, releaseDate: `${a.year}-06-01`, type: 'Album', coverUrl: a.cover.replace('300x300bb', '{w}x{h}bb') }));
[['Single', 15], ['Live', 5], ['Compilation', 15]].forEach(([k, n]) => { for (let j = 0; j < n; j++) fixture.push({ id: `x-${k}-${j}`, title: `${k} ${j + 1}`, artist: 'Pink Floyd', year: '2000', releaseDate: '2000-01-01', type: k, coverUrl: null }); });
const FOUR = JSON.stringify([0, 2, 3, 5].map((i) => fixture[i].id));
const PASTE = 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk';

// What the page does to be driven: the controller the Home exposes (window.controller), the two seams, a visitor with no notice
const SETUP = `(async () => {
  for (let i = 0; i < 100 && !(window.controller && window.controller.picker); i += 1) await new Promise((r) => setTimeout(r, 100));
  const c = window.controller, list = ${JSON.stringify(fixture)};
  c.picker.service = { scanArtist: async (q) => (/floydd/i.test(q) ? { albums: [], reclassified: null } : { albums: list, reclassified: null }) };
  c.albumSearchService = { search: async (artist, title) => (/Pinkk$/.test(title) ? [] : [{ id: 'x-' + title, title, artist, year: 1976, coverUrl: null }]) };
  c.writeSeries = async () => ({ id: 'proof-only-not-saved' });
  window.__guest = (on) => { c.state.guest = on; c.redraw(); };
  window.__guest(false);
  window.__search = (q) => { document.querySelector('#artistScanInput').value = q; return c.search(q); };
})()`;

const pick = `${FOUR}.forEach((i) => controller.clickCard(i))`;
const DRIVE = {
  empty: '',
  typing: `(() => { const f = document.querySelector('#artistScanInput'); f.focus(); f.value = 'Pink Fl'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`,
  scanning: `(() => { controller.picker.service = { scanArtist: () => new Promise(() => {}) }; __search('Pink Floyd'); })()`,
  results: `__search('Pink Floyd')`,
  chosen1: `__search('Pink Floyd').then(() => controller.clickCard(${FOUR}[0]))`,
  chosen: `__search('Pink Floyd').then(() => { ${pick}; })`,
  many: `__search('Pink Floyd').then(() => { controller.addAll(); controller.setName('Pink Floyd, the studio years'); controller.redraw(); })`,
  reorder: `__search('Pink Floyd').then(() => { ${pick}; if (matchMedia('(max-width: 767px)').matches) document.querySelector('.home-dock__open').click(); else controller.toggleOpen(); controller.move(${FOUR}[2], -1); })`,
  removed: `__search('Pink Floyd').then(() => { ${pick}; if (matchMedia('(max-width: 767px)').matches) document.querySelector('.home-dock__open').click(); else controller.toggleOpen(); controller.removeWithUndo(${FOUR}[1]); })`,
  paste: `controller.setMode('paste', ${JSON.stringify(PASTE)})`,
  pastereport: `(() => { controller.setMode('paste', 'Joni Mitchell - Hejira\\nYes - Close to the Edge\\nCaravan - In the Land of Grey and Pinkk'); return controller.addPastedList(controller.view.pasteList.value()); })()`,
  notfound: `__search('Pink Floydd Qxz')`,
  error: `__search('Pink Floyd').then(() => { ${pick}; controller.picker.service = { scanArtist: async () => { throw Object.assign(new Error('deadline'), { code: 'deadline' }); } }; return __search('Pink Floyd'); })`,
  noname: `__search('Pink Floyd').then(() => { ${pick}; controller.setName(''); controller.redraw(); return controller.createSeries(); })`,
  creating: `__search('Pink Floyd').then(() => { ${pick}; controller.writeSeries = () => new Promise(() => {}); controller.createSeries(); })`,
  created: `__search('Pink Floyd').then(() => { ${pick}; return controller.createSeries(); })`,
  createfail: `__search('Pink Floyd').then(() => { ${pick}; controller.writeSeries = async () => { throw Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }); }; return controller.createSeries(); })`,
  guest: `window.__guest(true)`,
};
const TITLES = {
  empty: 'Home · primeira visita', typing: 'Home · digitando', scanning: 'Home · buscando', results: 'Home · discografia', chosen1: 'Home · um álbum',
  chosen: 'Home · vários', many: 'Home · muitos', reorder: 'Home · mudando a ordem', removed: 'Home · removido, com Undo', paste: 'Home · colando uma lista',
  pastereport: 'Home · lista adicionada, uma linha pulada', notfound: 'Home · artista não encontrado', error: 'Home · o catálogo não respondeu',
  noname: 'Home · nome faltando', creating: 'Home · criando', created: 'Home · criada', createfail: 'Home · não deu para gravar', guest: 'Home · visitante',
};
const home = (s) => ({
  id: `f79-${s}`, title: TITLES[s],
  proto: { path: `/inception/home-transformar-v2.html#s=${s}`, eval: `(async () => { for (let i = 0; i < 100 && !(window.F79 && window.LEVEL); i += 1) await new Promise((r) => setTimeout(r, 100)); F79.scenario('${s}'); document.body.classList.add('framed'); })()`, actions: [{ wait: 900 }] },
  product: { path: HOME_PATH, eval: SETUP, actions: [...(DRIVE[s] ? [{ eval: DRIVE[s] }] : []), { wait: 1200 }, { eval: 'window.scrollTo(0, 0)' }] },
});

// ---- F80 · the entry page: the first screen and each scroll position of the track ----------------------------------------------
const to = (id) => `document.getElementById('${id}').scrollIntoView({block:'start'}); window.dispatchEvent(new Event('scroll'));`;
const splash = (id, title, anchor) => ({
  id: `f80-${id}`, title,
  proto: { path: '/inception/splash-crate-v2.html?fire=soft' }, product: { path: '/' },
  actions: anchor ? [{ eval: to(anchor) }, { wait: 1800 }] : [{ wait: 1500 }],
});

export default {
  format: 1,
  name: 'Album Blender · Home (F79) e página de entrada (F80)',
  evidenceDir: process.env.VISUAL_EVIDENCE_DIR ?? '../../reports/evidence/F84',   // relative to this file; the date goes at the end
  deps: '../..',                                            // @playwright/test is a devDependency of the root package.json
  // the references are live HTML, served from design/ on a free loopback port (every path below starts at design/)
  prototype: {
    server: { cmd: ['python3', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', 'design'], cwd: '../..', ready: 'port (\\d+)', url: 'http://127.0.0.1:$1' },
    ready: 'body',                                           // the Home prototype draws its screen by script: the scenario eval waits for it
    hideCss: '.proto-strip, .proto-notes, #protoScenarios, footer a[href="#privacy"] { display: none !important; }',
    settleMs: 1500,
  },
  // the product: this working tree's Vite dev server, loopback only, the fictional covers on the entry page (the default of the build)
  product: {
    server: { cmd: ['env', 'VITE_SPLASH_COVERS=fictional', 'npx', 'vite', '--host', '127.0.0.1', '--port', PRODUCT_PORT, '--strictPort'], cwd: '../..', ready: '(http://127\\.0\\.0\\.1:\\d+)', url: '$1', timeoutMs: 120_000 },
    ready: '#artistScanInput, #h1',
    settleMs: 1500,
  },
  conditions: {
    browsers: ['chromium', 'webkit'], locale: 'en-US',
    viewports: [{ id: 'w1280', width: 1280, height: 900 }, { id: 'w393', width: 393, height: 852, isMobile: true }],
    palettes: [{ id: 'dark', colorScheme: 'dark' }],         // both screens are dark only
  },
  scenarios: [
    ...Object.keys(DRIVE).map(home),
    splash('hero', 'Entrada · Lado A · 1 (primeira tela)'),
    splash('a2', 'Entrada · Lado A · 2 — Series', 'a2'), splash('a3', 'Entrada · Lado A · 3 — Ranking', 'a3'),
    splash('a5', 'Entrada · Lado A · 5 — Your shelf', 'a5'), splash('flip', 'Entrada · Flip the record', 'flip'),
    splash('b1', 'Entrada · Lado B · 1', 'b1'), splash('b2', 'Entrada · Lado B · 2 — o convite', 'b2'),
  ],
  facts: { regions: { header: '#header-container nav.top-nav', main: '#app', footer: 'footer.site-footer' }, roles: { h1: 'h1', h2: '#app h2', cta: '.hero a, .final a' } },
};
