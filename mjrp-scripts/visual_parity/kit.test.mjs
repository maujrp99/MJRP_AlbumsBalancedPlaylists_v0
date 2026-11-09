// cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// Tests of the visual parity kit: the rules on sample facts (a pair that must pass, one that must fail), the judge on
// facts written to a temporary folder, and — when the consuming project's Playwright is reachable — the whole sensor
// end to end on two small pages (a prototype and a product that differ in the menu, the font and a component).
// Run from the consuming project (it pins Playwright): node --test <path to>/visual_parity/
// VISUAL_PARITY_DEPS=<folder with node_modules> points at Playwright from elsewhere.
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ah01Adjust, ah01Grounds, baseChecks, contrast, drawerChecks, markdownDivergences, squeezeDivergences, staticChecks,
  tableDivergences, TEXT_HEALTH_OPTIONS, textHealthChecks, isSqueezed, missingWebfonts, parseColor, rawMarkdownMarkers, tokenMatches,
} from './rules.mjs';
import { aggregate, expectedRecords, judge } from './judge.mjs';
import { isLoopback, startServers } from './servers.mjs';
import { configProblem, CONFIG_FORMAT, playwrightCompatible, STABLE_EXPORTS } from './version.mjs';
import { conditionsOf } from './capture.mjs';
import { collectFacts } from './facts.mjs';
import { loadPlaywright, run } from './run.mjs';
import { collectRun, holdsVersioned, promotedPairs, removeChildren } from './collect.mjs';

const type = (first, size = '15px') => ({ family: `"${first}", serif`, first, size, weight: '400', lineHeight: 'normal', letterSpacing: 'normal', transform: 'none', color: 'rgb(0, 0, 0)', text: 'x' });
const card = (title) => ({ title, collapse: 'button', collapsed: false, border: '1px solid rgb(0, 0, 0)', radius: '4px', padding: '20px', background: 'rgb(255, 255, 255)' });
const side = () => ({
  palette: 'light', order: ['header', 'main'], cards: [card('Um'), card('Dois')],
  components: { 'collapse-all': 1, 'card-collapse-toggle': 2 },
  typography: { body: type('Manrope'), cardTitle: type('Lora', '19px') },
  tokens: { '--bg': '#ffffff', '--surface': '#f5f5f5', '--text': '#2d2d2d', '--muted': '#545955' },
  fontsLoaded: ['Lora 700', 'Manrope 400'],
  textHealth: { rawMarkdown: { count: 0, samples: [] }, squeezed: { count: 0, samples: [] } },
  layout: { mainLeft: 0, mainWidth: 1200, headerHeight: 52, firstCardTop: 100, cardGap: 18, horizontalOverflow: false, pageHeight: 2000 },
});
const record = () => ({ scenario: 'home', title: 'Home', ui: [], proto: side(), product: side(), protoActions: [], productActions: [] });
const OPTS = { coreTokens: ['--bg', '--text', '--muted'] };
const ids = (rec) => baseChecks(rec, OPTS).map((c) => `${c.sev} ${c.id}`);

test('rules: a record where both sides agree is at parity', () => {
  assert.deepEqual(baseChecks(record(), OPTS), []);
});

test('rules: a missing component, a collapse, a font, a palette and a menu order fail as P0', () => {
  const rec = record();
  rec.product.components['collapse-all'] = 0;
  rec.product.cards = [{ ...card('Um'), collapse: 'none' }, card('Dois')];
  rec.product.components['card-collapse-toggle'] = 1;
  rec.product.typography.cardTitle = type('Georgia', '19px');
  rec.product.palette = 'dark';
  rec.product.order = ['main', 'header'];
  const got = ids(rec);
  for (const want of ['P0 component: collapse-all', 'P0 card-collapse', 'P0 font: cardTitle', 'P0 palette', 'P0 shell-order']) {
    assert.ok(got.includes(want), `${want} in ${got.join(' | ')}`);
  }
});

test('rules: the product without the webfont a role draws fails; a preloaded font no role draws does not', () => {
  const rec = record();
  rec.product.fontsLoaded = ['Manrope 400'];
  assert.ok(ids(rec).includes('P0 webfonts-loaded'));
  const ok = record();
  ok.proto.fontsLoaded = [...ok.proto.fontsLoaded, 'Playfair Display 400'];
  assert.deepEqual(missingWebfonts(ok.proto, ok.product), []);
});

test('rules: AH-01 — the product may push a failing --muted to pass; an unrelated value still fails', () => {
  const proto = { '--bg': '#ffffff', '--surface': '#ffffff', '--err-bg': '#fde8e8', '--muted': '#6b6b6b' };
  const grounds = ah01Grounds(proto);
  const adjusted = ah01Adjust('#6b6b6b', grounds);
  assert.ok(contrast(parseColor(adjusted), parseColor('#fde8e8')) >= 4.5);
  assert.ok(tokenMatches('--muted', proto, { ...proto, '--muted': adjusted }));
  assert.ok(!tokenMatches('--muted', proto, { ...proto, '--muted': '#0000ff' }));
});

test('rules: raw markdown and squeezed text on the product only fail as P1', () => {
  assert.deepEqual(rawMarkdownMarkers('o `doctor` **reprova**'), ['backtick', 'bold']);
  assert.ok(isSqueezed({ width: 13, lines: 9, text: 'falhou ler' }));
  assert.ok(!isSqueezed({ width: 300, lines: 2, text: 'um rótulo de duas linhas' }));
  const rec = record();
  rec.product.textHealth = { rawMarkdown: { count: 1, samples: ['`x`'] }, squeezed: { count: 1, samples: [{ text: 'abc', width: 13, lines: 9 }] } };
  const got = ids(rec);
  assert.ok(got.includes('P1 raw-markdown'));
  assert.ok(got.includes('P1 squeezed-text'));
});

test('rules: a gesture the prototype accepts and the product refuses fails as P0', () => {
  const rec = record();
  rec.protoActions = [{ action: 'click:.min-all', available: true }];
  rec.productActions = [{ action: 'click:.min-all', available: false }];
  assert.ok(ids(rec).includes('P0 action-available: click:.min-all'));
});

test('conditions: browsers × viewports × palettes, named as the judge groups them', () => {
  const names = conditionsOf({ browsers: ['chromium', 'webkit'], viewports: [{ id: 'desktop', width: 1440, height: 900 }, { id: 'mobile', width: 390, height: 844, isMobile: true }], palettes: [{ id: 'L8', colorScheme: 'light' }] }).map((c) => c.name);
  assert.deepEqual(names, ['chromium-desktop-L8', 'chromium-mobile-L8', 'webkit-desktop-L8', 'webkit-mobile-L8']);
});

test('judge: facts on disk → summary.md, diff.json and the exit code; no facts → 2', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'vp-judge-'));
  assert.equal((await judge({ dir, checks: (r) => baseChecks(r, OPTS) })).code, 2);
  mkdirSync(join(dir, 'facts', 'chromium-desktop-light'), { recursive: true });
  const bad = record();
  bad.product.palette = 'dark';
  writeFileSync(join(dir, 'facts', 'chromium-desktop-light', 'home.json'), JSON.stringify(bad));
  const r = await judge({ dir, checks: (rec) => baseChecks(rec, OPTS), date: '2026-10-12' });
  assert.equal(r.code, 1);
  assert.equal(r.total.P0, 1);
  assert.ok(existsSync(join(dir, 'summary.md')) && existsSync(join(dir, 'diff.json')));
  assert.equal(aggregate([{ condition: 'x', rec: record() }], (rec) => baseChecks(rec, OPTS)).lines.length, 0);
});


// ---- architecture audit of ADR-0017 (2026-10-12): no silent pass, a versioned surface, loopback and process groups
test('judge: an empty facts/ folder is not parity (exit 2); a scenario expected and not captured is a P0 capture', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'vp-empty-'));
  mkdirSync(join(dir, 'facts', 'chromium-desktop-light'), { recursive: true });
  assert.equal((await judge({ dir, checks: (r) => baseChecks(r, OPTS) })).code, 2);
  writeFileSync(join(dir, 'facts', 'chromium-desktop-light', 'old.json'), JSON.stringify({ ...record(), scenario: 'old' }));
  const r = await judge({ dir, checks: (rec) => baseChecks(rec, OPTS), expect: { scenarios: ['home'], conditions: ['chromium-desktop-light'] } });
  assert.equal(r.code, 1, 'home was expected and has no facts');
  assert.deepEqual(r.lines.map((l) => `${l.sev} ${l.id} ${l.scenario}`), ['P0 capture home']);
  const none = await judge({ dir, checks: (rec) => baseChecks(rec, OPTS), expect: { scenarios: [], conditions: ['chromium-desktop-light'] } });
  assert.equal(none.code, 2, 'zero scenarios in the config: nothing judged');
  assert.equal(expectedRecords([{ condition: 'c', rec: record() }], undefined).length, 1);
});

test('version: every stable export exists — removing or renaming one is a MAJOR change', async () => {
  for (const [file, names] of Object.entries(STABLE_EXPORTS)) {
    const mod = await import(`./${file}`);
    for (const n of names) assert.ok(n in mod, `${file} exports ${n}`);
  }
});

test('version: a config of another format, or with unknown keys, is refused; the Playwright range is checked', () => {
  assert.equal(configProblem({ scenarios: [] }), null);
  assert.equal(configProblem({ format: CONFIG_FORMAT, scenarios: [] }), null);
  assert.match(configProblem({ format: CONFIG_FORMAT + 1 }), /formato/);
  assert.match(configProblem({ scenarioz: [] }), /scenarioz/);
  assert.ok(playwrightCompatible('1.63.0'));
  assert.ok(!playwrightCompatible('1.40.0'));
  assert.ok(!playwrightCompatible('2.0.0'));
});

test('servers: only loopback; stop() ends the whole group (no grandchild left serving)', async () => {
  assert.ok(isLoopback('http://127.0.0.1:5173/'));
  assert.ok(isLoopback('file:///tmp/x.html'));
  assert.ok(!isLoopback('http://0.0.0.0:8000/'));
  assert.ok(!isLoopback('http://192.168.0.10:8000/'));
  // a shell that starts the real server as a grandchild — the shape of `npm run preview` → vite
  const { urls, stop } = await startServers([{ name: 'p', cmd: ['sh', '-c', 'python3 -u -m http.server 0 --bind 127.0.0.1 & wait'],
    ready: 'port (\\d+)', url: 'http://127.0.0.1:$1/' }]);
  assert.equal((await fetch(urls.p)).status, 200);
  await stop();
  await assert.rejects(fetch(urls.p), 'the grandchild server is gone after stop()');
  await assert.rejects(startServers([{ name: 'open', cmd: ['python3', '-u', '-m', 'http.server', '0', '--bind', '0.0.0.0'],
    ready: 'Serving HTTP on (\\S+) port (\\d+)', url: 'http://$1:$2/' }]), /loopback/);
});

// ---- end to end: two small pages through run() — capture in Chromium, judge, exit code
const PAGE = ({ menu, font, collapseAll, bg = '#ffffff', note = 'Um texto.' }) => `<!doctype html><html data-palette="light"><head><style>
:root { --bg: ${bg}; --text: #222222; --muted: #555555; }
body { margin: 0; font: 15px/1.4 ${font}; background: var(--bg); color: var(--text); }
header { height: 52px; display: flex; gap: 12px; align-items: center; padding: 0 16px; }
main { max-width: 900px; margin: 0 auto; } .card { border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin: 18px 0; }
</style></head><body><header><nav>${menu.map((m) => `<button>${m}</button>`).join('')}</nav></header><main>
${collapseAll ? '<div class="colall"><button>Minimizar tudo</button></div>' : ''}
<section class="card"><h2>Custo <button aria-expanded="true">−</button></h2><p>${note}</p></section>
<section class="card"><h2>Por projeto <button aria-expanded="true">−</button></h2><p>Outro texto.</p></section>
</main></body></html>`;

let playwright = null;
try {
  playwright = await loadPlaywright(process.env.VISUAL_PARITY_DEPS ?? process.cwd());
} catch { /* no Playwright where this runs: the end-to-end tests are skipped */ }

let lastE2eDir = null;
async function e2e(product) {
  const dir = mkdtempSync(join(tmpdir(), 'vp-e2e-'));
  lastE2eDir = dir;
  writeFileSync(join(dir, 'proto.html'), PAGE({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true }));
  writeFileSync(join(dir, 'product.html'), PAGE(product));
  const config = {
    name: 'e2e', evidenceDir: 'evidence', deps: process.env.VISUAL_PARITY_DEPS ?? process.cwd(), pairs: [],
    prototype: { url: pathToFileURL(join(dir, 'proto.html')).href, settleMs: 50 },
    product: { url: pathToFileURL(join(dir, 'product.html')).href, settleMs: 50 },
    conditions: { browsers: ['chromium'], viewports: [{ id: 'desktop', width: 1200, height: 800 }], palettes: [{ id: 'light', colorScheme: 'light' }] },
    scenarios: [{ id: 'home', title: 'Home' }],
    facts: { regions: { header: 'header', main: 'main' }, components: { 'collapse-all': '.colall' }, roles: { navTab: 'header nav button' } },
    rules: { coreTokens: ['--bg', '--text', '--muted'] },
  };
  writeFileSync(join(dir, 'visual.config.mjs'), `export default ${JSON.stringify(config)};`);
  return run(join(dir, 'visual.config.mjs'), { log: () => {} });
}

test('end to end: the same page on both sides is at parity (exit 0)', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  assert.equal(await e2e({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true }), 0);
  // F52 TASK-00: the run collected its own captures — only the verdict stays
  const [day] = readdirSync(join(lastE2eDir, 'evidence'));
  assert.deepEqual(readdirSync(join(lastE2eDir, 'evidence', day)).sort(), ['diff.json', 'summary.md']);
});

test('end to end: a product without the collapse-all bar fails (exit 1)', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  assert.equal(await e2e({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: false }), 1);
});

// ---- the STATIC reference (MJRP 2026-10-12: exports of Figma or another design tool): a sample image, rendered here
// from the prototype page, stands as the approved reference; the product is judged by image and by its own rules
async function e2eStatic(product) {
  const dir = mkdtempSync(join(tmpdir(), 'vp-static-'));
  mkdirSync(join(dir, 'exports'));
  writeFileSync(join(dir, 'proto.html'), PAGE({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true }));
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(dir, 'proto.html')).href);
  await page.screenshot({ path: join(dir, 'exports', 'home.png'), fullPage: true });     // the sample image
  await browser.close();
  writeFileSync(join(dir, 'product.html'), PAGE(product));
  const config = {
    name: 'e2e-static', evidenceDir: 'evidence', deps: process.env.VISUAL_PARITY_DEPS ?? process.cwd(), pairs: [],
    prototype: { kind: 'static', images: 'exports' },
    product: { url: pathToFileURL(join(dir, 'product.html')).href, settleMs: 50 },
    conditions: { browsers: ['chromium'], viewports: [{ id: 'desktop', width: 1200, height: 800 }], palettes: [{ id: 'light', colorScheme: 'light' }] },
    scenarios: [{ id: 'home', title: 'Home' }],
    rules: { imageDiffMax: 0.05 },
  };
  writeFileSync(join(dir, 'visual.config.mjs'), `export default ${JSON.stringify(config)};`);
  const lines = [];
  const code = await run(join(dir, 'visual.config.mjs'), { log: (l) => lines.push(l) });
  return { code, lines };
}

test('static reference: the product that looks like the exported image is at parity (exit 0)', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  const r = await e2eStatic({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true });
  assert.equal(r.code, 0, r.lines.join('\n'));
});

test('static reference: a product far from the image fails by the image difference (exit 1)', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  const r = await e2eStatic({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true, bg: '#202020' });
  assert.equal(r.code, 1, r.lines.join('\n'));
});

test('static reference: raw markdown on the product fails on its own (exit 1), with no facts on the other side', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  const r = await e2eStatic({ menu: ['Overview', 'Wiki'], font: 'serif', collapseAll: true, note: 'o **doctor** reprova' });
  assert.equal(r.code, 1, r.lines.join('\n'));
});

test('static reference: the rules alone — image ceiling, width, and the product-only rules', () => {
  const rec = { scenario: 'home', reference: 'static', proto: null, product: side(), imageDiff: { ratio: 0.01, refWidth: 1200, productWidth: 1200 } };
  assert.deepEqual(staticChecks(rec), []);
  assert.ok(staticChecks({ ...rec, imageDiff: { ratio: 0.3, refWidth: 1200, productWidth: 1200 } }).some((c) => c.sev === 'P1'));
  assert.ok(staticChecks({ ...rec, imageDiff: { ratio: 0.01, refWidth: 1440, productWidth: 1200 } }).some((c) => c.id === 'image-width'));
  assert.equal(staticChecks({ ...rec, protoError: 'sem imagem' })[0].sev, 'P0');
});

// ---- the rules of the Control Center's judge of drawers and tables (2026-10-12), moved to the kit: by component
const th = (extra = {}) => ({ rawMarkdown: { count: 0, samples: [], items: [] }, squeezed: { count: 0, samples: [], items: [] }, columns: {}, tables: [], overflow: { count: 0, items: [] }, ...extra });

test('by component: raw markdown fails only where the reference shows none of that marker', () => {
  const pt = th({ rawMarkdown: { count: 1, samples: [], items: [{ text: '## Now', component: 'Memória', markers: ['heading'] }] } });
  const qt = th({ rawMarkdown: { count: 2, samples: [], items: [{ text: '## Now', component: 'Memória', markers: ['heading'] }, { text: '`x`', component: 'Log recente', markers: ['backtick'] }] } });
  assert.deepEqual(markdownDivergences(pt, qt).map((i) => i.component), ['Log recente']);
  assert.deepEqual(textHealthChecks(pt, qt).map((c) => c.id), ['raw-markdown']);
});

test('by component: squeezed text fails only when its column is narrower than 80% of the reference column', () => {
  const pt = th({ columns: { Achados: 135 } });
  const ok = th({ squeezed: { count: 1, samples: [], items: [{ text: 'a b c', width: 120, lines: 6, component: 'Achados' }] }, columns: { Achados: 120 } });
  const bad = th({ squeezed: { count: 1, samples: [], items: [{ text: 'a b c', width: 50, lines: 6, component: 'Achados' }] }, columns: { Achados: 50 } });
  assert.equal(squeezeDivergences(pt, ok).narrower.length, 0);
  assert.equal(squeezeDivergences(pt, bad).narrower.length, 1);
  assert.deepEqual(textHealthChecks(pt, bad).map((c) => c.id), ['squeezed-text-narrower-column']);
});

test('tables and overflow: a problem the reference does not have in the same component fails', () => {
  const pt = th({ tables: [{ component: 'Achados', overflow: false, brokenWords: 0, narrowCells: 0, samples: [] }] });
  const qt = th({ tables: [{ component: 'Achados', overflow: true, brokenWords: 2, narrowCells: 0, samples: ['x'] }], overflow: { count: 1, items: [{ text: 'longo', component: 'Achados', kind: 'edge', by: 12 }] } });
  assert.deepEqual(tableDivergences(pt, qt).map((d) => d.problem.id), ['overflow', 'broken-words']);
  assert.deepEqual(textHealthChecks(pt, qt).map((c) => c.id), ['table-overflow', 'table-broken-words', 'text-overflow']);
});

test('drawers: width over the screen, past the edge, and the text health inside, under `drawer <kind>: `', () => {
  const drawerSide = (d, health) => ({ ...side(), viewport: { width: 1440, height: 900 }, drawer: d, textHealth: health });
  const rec = {
    scenario: 'drawer-adr', drawer: 'adr',
    proto: drawerSide({ width: 560, left: 880, right: 1440, ratio: 0.389, wide: false, title: 'ADR' }, th()),
    product: drawerSide({ width: 900, left: 600, right: 1500, ratio: 0.625, wide: false, title: 'ADR' },
      th({ rawMarkdown: { count: 1, samples: [], items: [{ text: '**x**', component: 'drawer', markers: ['bold'] }] } })),
    protoActions: [{ action: 'drawer:adr', available: true, row: true, opened: true }],
    productActions: [{ action: 'drawer:adr', available: true, row: true, opened: true }],
  };
  assert.deepEqual(drawerChecks(rec).map((c) => c.id), ['drawer adr: width-ratio', 'drawer adr: past-screen-edge', 'drawer adr: raw-markdown']);
  assert.deepEqual(baseChecks(rec, OPTS).map((c) => c.id), drawerChecks(rec).map((c) => c.id));
  const noRow = { ...rec, productActions: [{ action: 'drawer:adr', available: false, row: false }] };
  assert.deepEqual(drawerChecks(noRow).map((c) => `${c.sev} ${c.id}`), ['P2 drawer adr: no-row']);
});

// UAT-427 (F209, kit 1.3): the facts as the Control Center's capture of the `f135-card-drawer-*` scenarios writes them
// (web/visual/parity.spec.ts: `drawer:<kind>` with row/opened/cards; the plain `click` with only `available`), with the
// product's card that opens nothing - the case that used to give 0 findings.
test('drawers: a card the product has and that opens nothing is a P0, whatever the prototype did (the f135-card-drawer-* facts)', () => {
  const drawerSide = (d) => ({ ...side(), viewport: { width: 1440, height: 900 }, drawer: d, textHealth: th() });
  const open = { width: 560, left: 880, right: 1440, ratio: 0.389, wide: false, title: 'F135' };
  // -feature: the prototype's hash reaches no row (recheck-30, R30-01); the product clicks its card and no drawer opens
  const feature = {
    scenario: 'f135-card-drawer-feature', drawer: 'delivery-feature',
    proto: drawerSide(null), product: drawerSide(null),
    protoActions: [{ action: 'drawer:delivery-feature', available: false, row: false, opened: false }],
    productActions: [{ action: 'drawer:delivery-feature', available: false, row: true, opened: false }],
  };
  assert.deepEqual(drawerChecks(feature).map((c) => `${c.sev} ${c.id}`), ['P0 drawer delivery-feature: does-not-open']);
  assert.deepEqual(drawerChecks({ ...feature, protoActions: [{ action: 'drawer:delivery-feature', available: true, row: true, opened: true }], proto: drawerSide(open) })
    .map((c) => `${c.sev} ${c.id}`), ['P0 drawer delivery-feature: does-not-open']);
  // the product opens it: no finding about the click
  assert.deepEqual(drawerChecks({ ...feature, product: drawerSide(open), productActions: [{ action: 'drawer:delivery-feature', available: true, row: true, opened: true }] }), []);
  // -story and -epic click by the plain gesture: the prototype is there by its hash, the product clicks
  const story = {
    scenario: 'f135-card-drawer-story', drawer: 'board-story',
    proto: drawerSide(open), product: drawerSide(null),
    protoActions: [{ action: 'click', available: true }], productActions: [{ action: 'click', available: true }],
  };
  assert.deepEqual(baseChecks(story, OPTS).map((c) => `${c.sev} ${c.id}`), ['P0 drawer board-story: does-not-open']);
  assert.deepEqual(drawerChecks({ ...story, product: drawerSide(open) }), []);
  // the gesture found no target: a row the data may not have, as before (P2 when the prototype has it)
  assert.deepEqual(drawerChecks({ ...story, productActions: [{ action: 'click', available: false }] }).map((c) => `${c.sev} ${c.id}`), ['P2 drawer board-story: no-row']);
  // cards on screen and none of them a button: its own rule (P0), not the no-row the data may explain
  const notButton = { ...feature, productActions: [{ action: 'drawer:delivery-feature', available: false, row: false, opened: false, cards: 4 }] };
  assert.deepEqual(drawerChecks(notButton).map((c) => `${c.sev} ${c.id}`), ['P0 drawer delivery-feature: card-not-a-button']);
  assert.deepEqual(drawerChecks({ ...notButton, productActions: [{ action: 'drawer:delivery-feature', available: false, row: false, opened: false, cards: 0 }] }), []);
});

test('facts: components, a table cell too narrow and an open drawer are measured in the page', { skip: !playwright && 'Playwright not reachable from here' }, async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(`<!doctype html><body style="font:15px sans-serif;margin:0"><main>
    <section class="card"><h2>Achados</h2><table style="width:120px;table-layout:fixed"><tr><td style="width:20px">texto</td><td>outro</td></tr></table></section>
    </main><div role="dialog" style="position:fixed;right:0;top:0;width:300px;height:400px;background:#fff"><h2>ADR</h2><p>o **doctor** reprova</p></div></body>`);
  const facts = await page.evaluate(collectFacts, { regions: { main: 'main' }, text: TEXT_HEALTH_OPTIONS });
  await browser.close();
  assert.equal(facts.drawer.width, 300);
  assert.ok(facts.textHealth.tables.some((t) => t.component === 'Achados' && t.narrowCells > 0), JSON.stringify(facts.textHealth.tables));
  assert.ok(facts.textHealth.rawMarkdown.items.some((i) => i.component === 'drawer' && i.markers.includes('bold')));
});

// F52 TASK-00 (harness-kaizen 2026-10-19 22:59): the harness collects what it creates — a judge run was ~10 GB and 400 of
// them filled the MJRP's disk. The run folder keeps the verdict and the pairs promoted to evidence, nothing else.
// the folders the collect tests make in the temporary folder: each test owes its own back (F52 TASK-00), nothing else is removed
const madeHere = [];
after(() => madeHere.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function sampleRun() {
  const dir = mkdtempSync(join(tmpdir(), 'visual-collect-'));
  madeHere.push(dir);
  for (const cond of ['chromium-desktop-L8', 'webkit-desktop-L8']) {
    mkdirSync(join(dir, cond), { recursive: true });
    mkdirSync(join(dir, 'facts', cond), { recursive: true });
    mkdirSync(join(dir, 'pairs', cond), { recursive: true });
    for (const sc of ['home', 'tokens']) {
      writeFileSync(join(dir, cond, `${sc}.proto.png`), Buffer.alloc(2048));
      writeFileSync(join(dir, cond, `${sc}.product.png`), Buffer.alloc(2048));
      writeFileSync(join(dir, 'facts', cond, `${sc}.json`), '{}');
      writeFileSync(join(dir, 'pairs', cond, `${sc}.pair.jpg`), Buffer.alloc(512));
    }
  }
  mkdirSync(join(dir, '.playwright'));
  writeFileSync(join(dir, '.playwright', 'trace.zip'), Buffer.alloc(4096));
  writeFileSync(join(dir, 'summary.md'), '# resumo');
  writeFileSync(join(dir, 'diff.json'), '{}');
  writeFileSync(join(dir, 'notes.md'), 'a hand-written file the kit did not create');
  return dir;
}

test('collect: the run folder keeps the summary, the diff and the pairs of P0/P1 lines — every capture and fact goes', () => {
  const dir = sampleRun();
  const lines = [{ sev: 'P1', scenario: 'home', projects: ['chromium-desktop-L8'] }, { sev: 'P2', scenario: 'tokens', projects: ['webkit-desktop-L8'] }];
  const out = collectRun({ dir, lines, conditions: ['chromium-desktop-L8', 'webkit-desktop-L8'] });
  assert.equal(out.collected, true);
  assert.ok(out.freed > 0);
  assert.deepEqual(out.kept, [join('pairs', 'chromium-desktop-L8', 'home.pair.jpg')]);
  assert.deepEqual(readdirSync(dir).sort(), ['diff.json', 'notes.md', 'pairs', 'summary.md']);
  assert.deepEqual(readdirSync(join(dir, 'pairs')), ['chromium-desktop-L8']);
  assert.deepEqual(readdirSync(join(dir, 'pairs', 'chromium-desktop-L8')), ['home.pair.jpg']);
});

test('collect: parity (no P0/P1) leaves only the summary and the diff; VISUAL_KEEP_CAPTURES=1 leaves everything', () => {
  const kept = sampleRun();
  assert.equal(collectRun({ dir: kept, lines: [], env: { VISUAL_KEEP_CAPTURES: '1' } }).collected, false);
  assert.ok(existsSync(join(kept, 'facts')) && existsSync(join(kept, 'chromium-desktop-L8', 'home.product.png')));
  const dir = sampleRun();
  collectRun({ dir, lines: [{ sev: 'P2', scenario: 'home', projects: ['chromium-desktop-L8'] }], env: {} });
  assert.deepEqual(readdirSync(dir).sort(), ['diff.json', 'notes.md', 'summary.md']);
});

test('collect: a run that was not judged (no summary.md) is never collected', () => {
  const dir = sampleRun();
  removeChildren(dir, ['summary.md']);
  assert.ok(!existsSync(join(dir, 'summary.md')));
  assert.equal(collectRun({ dir, lines: [], env: {} }).collected, false);
  assert.ok(existsSync(join(dir, 'facts')), 'captures of an unjudged run stay');
});

test('collect: removeChildren never leaves the folder — not by .., not by an absolute name, not through a symlink', () => {
  const dir = sampleRun();
  const outside = mkdtempSync(join(tmpdir(), 'visual-outside-'));
  madeHere.push(outside);
  writeFileSync(join(outside, 'precious.txt'), 'x');
  symlinkSync(outside, join(dir, 'link'));
  removeChildren(dir, ['..', outside, '.', 'link']);
  assert.ok(existsSync(join(outside, 'precious.txt')), 'the target of a symlink survives');
  assert.ok(existsSync(dir));
});

test('collect: a sister folder and the parent survive — only the folder of the run itself is touched (the 2026-10-19 scratch folders)', () => {
  const parent = mkdtempSync(join(tmpdir(), 'visual-parent-'));
  madeHere.push(parent);
  const mine = join(parent, 'run-mine');
  const sister = join(parent, 'run-sister');
  const other = join(parent, 'f33-agent');
  for (const folder of [mine, sister]) mkdirSync(folder);
  writeFileSync(join(parent, 'orchestrator-script.py'), 'print(1)');
  mkdirSync(join(other, 'facts'), { recursive: true });
  writeFileSync(join(other, 'facts', 'keep.json'), '{}');
  // the sister is a judged run with the very names the collector removes: it must not matter, it is not the run being collected
  mkdirSync(join(sister, 'facts', 'chromium-desktop-L8'), { recursive: true });
  writeFileSync(join(sister, 'summary.md'), 'x');
  mkdirSync(join(mine, 'facts', 'chromium-desktop-L8'), { recursive: true });
  mkdirSync(join(mine, 'chromium-desktop-L8'));
  writeFileSync(join(mine, 'summary.md'), 'x');
  // conditions that try to leave the run folder: by .., by the sister's name, by an absolute path
  const out = collectRun({ dir: mine, lines: [], conditions: ['chromium-desktop-L8', '../run-sister', '../f33-agent', sister, '..'], env: {} });
  assert.equal(out.collected, true);
  assert.deepEqual(readdirSync(mine), ['summary.md']);
  assert.deepEqual(readdirSync(parent).sort(), ['f33-agent', 'orchestrator-script.py', 'run-mine', 'run-sister']);
  assert.ok(existsSync(join(sister, 'facts', 'chromium-desktop-L8')) && existsSync(join(sister, 'summary.md')));
  assert.ok(existsSync(join(other, 'facts', 'keep.json')));
});

test('collect: only P0 and P1 lines promote a pair', () => {
  const keep = promotedPairs([{ sev: 'P0', scenario: 'a', projects: ['c1', 'c2'] }, { sev: 'P1', scenario: 'b', projects: ['c1'] }, { sev: 'P2', scenario: 'z', projects: ['c1'] }]);
  assert.deepEqual([...keep].sort(), [join('pairs', 'c1', 'a.pair.jpg'), join('pairs', 'c1', 'b.pair.jpg'), join('pairs', 'c2', 'a.pair.jpg')]);
});

// F52 judge P1-2 (harness-kaizen 2026-10-23 21:11: a cleanup deleted 1,628 versioned images once): nothing git versions is ever removed.
const RUN = 'reports/evidence/UAT-visual/2026-10-19-recheck';
function repoWithRun() {
  const root = mkdtempSync(join(tmpdir(), 'visual-git-'));
  madeHere.push(root);
  const git = (...args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  git('init', '-q');
  const dir = join(root, RUN);
  const put = (rel, text = 'x') => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  put('summary.md');
  put('diff.json');
  put('chromium-desktop-L8/home.product.png', 'versioned');     // committed evidence of an old run, in a folder named like a capture
  put('chromium-desktop-L8/tokens.product.png', 'fresh');       // today's capture, not versioned
  put('facts/chromium-desktop-L8/home.json', 'versioned');
  put('facts/chromium-desktop-L8/tokens.json', 'fresh');
  put('pairs/chromium-desktop-L8/home.pair.jpg', 'versioned');  // a pair nobody promoted, but git holds it
  put('pairs/chromium-desktop-L8/tokens.pair.jpg', 'fresh');
  git('add', ...['summary.md', 'diff.json', 'chromium-desktop-L8/home.product.png', 'facts/chromium-desktop-L8/home.json', 'pairs/chromium-desktop-L8/home.pair.jpg'].map((f) => `${RUN}/${f}`));
  return { root, dir };
}

test('collect: a file git versions survives the collection, whatever folder it is in; only the untracked captures go', () => {
  const { dir } = repoWithRun();
  const out = collectRun({ dir, lines: [], conditions: ['chromium-desktop-L8'], env: {} });
  assert.equal(out.collected, true);
  for (const kept of ['summary.md', 'diff.json', 'chromium-desktop-L8/home.product.png', 'facts/chromium-desktop-L8/home.json', 'pairs/chromium-desktop-L8/home.pair.jpg']) {
    assert.ok(existsSync(join(dir, kept)), `${kept} is versioned: it must survive`);
  }
  for (const gone of ['chromium-desktop-L8/tokens.product.png', 'facts/chromium-desktop-L8/tokens.json', 'pairs/chromium-desktop-L8/tokens.pair.jpg']) {
    assert.ok(!existsSync(join(dir, gone)), `${gone} is not versioned: it is a capture and goes`);
  }
  assert.ok(out.versioned.length > 0, 'it says what it left because git holds it');
});

test('collect: holdsVersioned answers for a file, a folder with one tracked file inside, and a folder that is in no repository', () => {
  const { dir } = repoWithRun();
  assert.equal(holdsVersioned(join(dir, 'summary.md')), true);
  assert.equal(holdsVersioned(join(dir, 'chromium-desktop-L8')), true);
  assert.equal(holdsVersioned(join(dir, 'chromium-desktop-L8', 'tokens.product.png')), false);
  const loose = mkdtempSync(join(tmpdir(), 'visual-nogit-'));
  madeHere.push(loose);
  writeFileSync(join(loose, 'a.png'), 'x');
  assert.equal(holdsVersioned(loose), false);
  assert.equal(holdsVersioned(join(loose, 'a.png')), false);
});

test('collect: removeChildren of a versioned file removes nothing and says so; with git out of reach it removes nothing at all', () => {
  const { dir } = repoWithRun();
  const kept = [];
  assert.equal(removeChildren(dir, ['summary.md'], { kept }), 0);
  assert.deepEqual(kept, ['summary.md']);
  assert.ok(existsSync(join(dir, 'summary.md')));
  const path = process.env.PATH;
  process.env.PATH = '';                                          // git cannot be asked: "cannot prove it is not versioned"
  try {
    assert.equal(removeChildren(dir, ['facts']), 0);
  } finally {
    process.env.PATH = path;
  }
  assert.ok(existsSync(join(dir, 'facts', 'chromium-desktop-L8', 'tokens.json')), 'nothing was removed while git was out of reach');
});
