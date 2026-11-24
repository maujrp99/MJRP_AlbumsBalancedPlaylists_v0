// cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The rules of the visual parity kit, as pure functions: no file, no browser, no clock. They compare the facts of the
// approved prototype and of the product (facts.mjs) for one screen, one state and one condition, and say what diverges
// and how much: P0 breaks the identity or misses the component, P1 diverges the form visibly, P2 is detail (does not
// fail). What counts is form — component, order, typography, colour, spacing, behaviour — never the data.
//
// Born from the Control Center 1.0 (2026-10-11): a release shipped with every sensor green and a screen unlike its
// approved prototype. The project's own exceptions (cards out of the release, components the real data replaces) stay
// in the project's checks; the ones here are general and each carries the incident it came from.
//
// A project uses baseChecks() as is, or composes its own checks() from the groups below, overriding the labels.

/**
 * The id of each check — what diff.json carries and a project's tests compare, so it is English (what the machine reads
 * is English; CLAUDE.md, "Nomes"). A project may pass its own ids (`labels`): the Control Center keeps the Portuguese ids
 * of its stored runs, which its regression test compares and which are not rewritten.
 */
export const LABELS = {
  capture: 'capture',
  order: 'shell-order',
  cardsCount: 'cards-count',
  cardsOrder: 'cards-order-or-title',
  collapse: 'card-collapse',
  collapseMechanism: 'card-collapse-mechanism',
  cardPadding: 'card-padding',
  cardRadius: 'card-radius',
  cardBorder: 'card-border',
  component: (name) => `component: ${name}`,
  componentExtra: (name) => `component-extra: ${name}`,
  font: (role) => `font: ${role}`,
  size: (role) => `font-size: ${role}`,
  weight: (role) => `font-weight: ${role}`,
  caseSpacing: (role) => `text-case-spacing: ${role}`,
  webfonts: 'webfonts-loaded',
  tokenNames: 'token-names',
  token: (name) => `token: ${name}`,
  tokenFallback: (name) => `token-fallback: ${name}`,
  palette: 'palette',
  headerHeight: 'header-height',
  mainWidth: 'main-width',
  cardGap: 'card-gap',
  overflow: 'horizontal-scroll',
  rawMarkdown: 'raw-markdown',
  overflowing: 'text-overflow',
  squeezedNarrower: () => 'squeezed-text-narrower-column',
  table: (problem) => `table-${problem}`,
  drawerNoRow: (kind) => `drawer ${kind}: no-row`,
  drawerNotOpen: (kind) => `drawer ${kind}: does-not-open`,
  drawerNotButton: (kind) => `drawer ${kind}: card-not-a-button`,
  drawerWideMismatch: (kind) => `drawer ${kind}: wide-mismatch`,
  drawerRatio: (kind) => `drawer ${kind}: width-ratio`,
  drawerEdge: (kind) => `drawer ${kind}: past-screen-edge`,
  drawerWhere: (kind) => `drawer ${kind}: `,
  imageDiff: 'image-diff',
  imageWidth: 'image-width',
  squeezed: () => 'squeezed-text',
  action: (name) => `action-available: ${name}`,
};
const label = (labels, key, ...args) => {
  const v = labels?.[key] ?? LABELS[key];
  return typeof v === 'function' ? v(...args) : v;
};

export const simpleTitle = (t) => (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim();
const px = (v) => parseFloat(v ?? '0') || 0;

// ---------------------------------------------------------------------------------------------------------------
// Webfonts (Control Center recheck 2026-10-11, false positive 1). A prototype may preload fonts that no typographic
// role draws. Only a family that some role draws — the first family of the computed font-family of the role's
// element, on either side — must load on the product. A product with no webfont at all still fails (VP-08: the
// product's theme.css had cut the webfonts on its own).

/** The families some typographic role draws: the first family of every sampled role's computed font-family. */
export function drawnFamilies(facts) {
  return new Set(Object.values(facts?.typography ?? {}).filter(Boolean).map((s) => s.first).filter(Boolean));
}

export const family = (entry) => entry.replace(/ \d+$/, '');

/** The families the prototype loaded and draws (on either side) that the product did not load. */
export function missingWebfonts(proto, product) {
  const loadedP = new Set(proto.fontsLoaded.map(family));
  const loadedQ = new Set(product.fontsLoaded.map(family));
  const drawn = new Set([...drawnFamilies(proto), ...drawnFamilies(product)]);
  return [...drawn].filter((f) => loadedP.has(f) && !loadedQ.has(f)).sort();
}

// ---------------------------------------------------------------------------------------------------------------
// Contrast rule AH-01 (design-canon: every text token >= 4.5:1 on bg, surface and the tints), applied to the
// prototype's side before its text tokens are compared (Control Center recheck 2026-10-11, false positive 4: the
// prototype did not adjust a palette's --muted; the product did, as the rule asks).

export const AH01_MIN = 4.5;
/** The text tokens the rule adjusts by default (the design canon names --muted; --text is never pushed). */
export const AH01_TEXT_TOKENS = ['--muted'];
/** Below this CIE76 distance two colours read as the same (just-noticeable difference). */
export const JND = 2.3;

function parseHex(s) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const body = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const v = parseInt(body, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** A colour as the tokens carry it — `#rgb`, `#rrggbb`, `rgb(r, g, b)` or `color-mix(in srgb, A p%, B)` — in RGB. */
export function parseColor(value) {
  const s = (value ?? '').trim();
  if (!s) return null;
  if (s.startsWith('#')) return parseHex(s);
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const mix = /^color-mix\(\s*in srgb\s*,\s*(#[0-9a-f]+)\s+([\d.]+)%\s*,\s*(#[0-9a-f]+)\s*(?:([\d.]+)%)?\s*\)$/i.exec(s);
  if (mix) {
    const [a, b] = [parseHex(mix[1]), parseHex(mix[3])];
    if (!a || !b) return null;
    const p = Number(mix[2]) / 100;
    return a.map((x, i) => Math.round(x * p + b[i] * (1 - p)));
  }
  return null;
}

export const toHex = (rgb) => `#${rgb.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two RGB colours. */
export function contrast(a, b) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function lab(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const f = (x) => (x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 colour difference of two RGB colours. */
export function deltaE(a, b) {
  const [la, lb] = [lab(a), lab(b)];
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** The backgrounds AH-01 declares, read from a side's tokens: bg, surface and every tint (`*-tint`, `--<state>-bg`). */
export function ah01Grounds(tokens) {
  return Object.entries(tokens ?? {})
    .filter(([name]) => name === '--bg' || name === '--surface' || /-tint$/.test(name) || /^--(ok|warn|err|unk)-bg$/.test(name))
    .map(([, value]) => parseColor(value))
    .filter(Boolean);
}

const worst = (rgb, grounds) => Math.min(...grounds.map((g) => contrast(rgb, g)));

/**
 * AH-01 applied to one text colour: unchanged when it already measures >= 4.5:1 on every ground; otherwise moved
 * toward black or white, in 1% steps, as little as it takes to get there (the hue stays). Returns `#rrggbb`.
 */
export function ah01Adjust(color, grounds) {
  const fg = parseColor(color);
  if (!fg || grounds.length === 0) return color;
  if (worst(fg, grounds) >= AH01_MIN) return toHex(fg);
  let best = null;
  for (const target of [[0, 0, 0], [255, 255, 255]]) {
    for (let i = 1; i <= 100; i += 1) {
      const t = i / 100;
      const c = fg.map((x, k) => Math.round(target[k] * t + x * (1 - t)));
      if (worst(c, grounds) >= AH01_MIN) {
        if (!best || t < best.t) best = { t, c };
        break;
      }
    }
  }
  return best ? toHex(best.c) : toHex(fg);
}

/**
 * Whether the product's value of a token matches the prototype's. Equal values always match. For a text token under
 * AH-01 whose prototype value fails the rule on the prototype's own grounds, the product matches when its value passes
 * the rule on those grounds and reads as the adjusted prototype value (CIE76 < JND).
 */
export function tokenMatches(name, protoTokens, productTokens, textTokens = AH01_TEXT_TOKENS) {
  const a = (protoTokens[name] ?? '').toLowerCase();
  const b = (productTokens[name] ?? '').toLowerCase();
  if (a === b) return true;
  if (!textTokens.includes(name)) return false;
  const grounds = ah01Grounds(protoTokens);
  const [pa, pb] = [parseColor(a), parseColor(b)];
  if (!pa || !pb || grounds.length === 0) return false;
  if (worst(pa, grounds) >= AH01_MIN) return false;           // the prototype already passes: compare as is
  const expected = parseColor(ah01Adjust(a, grounds));
  return worst(pb, grounds) >= AH01_MIN && deltaE(pb, expected) < JND;
}

// ---------------------------------------------------------------------------------------------------------------
// Raw markdown in visible text (Control Center UAT-20: the ADR titles and summaries showed backticks, ** and *). The
// patterns travel to the page as sources (the page function cannot import); rawMarkdownMarkers() is the same test here.
export const RAW_MARKDOWN_PATTERNS = [
  { id: 'backtick', source: '`[^`\\s][^`]*`', flags: '' },
  { id: 'bold', source: '\\*\\*[^*\\s][^*]*\\*\\*', flags: '' },
  { id: 'emphasis', source: '(^|[\\s(])\\*[^*\\s](?:[^*]*[^*\\s])?\\*(?=$|[\\s).,;:!?])', flags: '' },
  { id: 'heading', source: '^#{1,6}\\s', flags: '' },
];

/** The markdown markers left raw in a visible text (the ids of RAW_MARKDOWN_PATTERNS that match). */
export function rawMarkdownMarkers(text) {
  const s = (text ?? '').trim();
  return RAW_MARKDOWN_PATTERNS.filter((p) => new RegExp(p.source, p.flags).test(s)).map((p) => p.id);
}

/**
 * Squeezed text (Control Center UAT-21: a read-failed box 13 px wide, one letter per line; UAT-24: a finding's text in
 * a 64 px column at 390, one word per line). A text element (seals and icons aside) is squeezed when it wraps to 3+
 * lines under 60 px, or to 5+ lines of fewer than 12 characters each. The width alone misses UAT-24 (64 px); the
 * 5-line floor keeps out a card title in a large serif that wraps to 3 or 4 short lines on both sides.
 */
export const SQUEEZE_MAX_WIDTH = 60;
export const SQUEEZE_MIN_LINES = 3;
export const SQUEEZE_MAX_CHARS_PER_LINE = 12;
export const SQUEEZE_MIN_WORD_LINES = 5;

/** The same test facts.mjs runs in the page, on a measured element: its width, its line count, its own text. */
export function isSqueezed({ width, lines, text }) {
  const narrow = lines >= SQUEEZE_MIN_LINES && width < SQUEEZE_MAX_WIDTH;
  const wordPerLine = lines >= SQUEEZE_MIN_WORD_LINES && text.length / lines < SQUEEZE_MAX_CHARS_PER_LINE;
  return narrow || wordPerLine;
}

/** What the page-side collector needs from these rules, passed as data (facts.mjs `text` option). */
export const TEXT_HEALTH_OPTIONS = {
  markdown: RAW_MARKDOWN_PATTERNS, squeezeMaxWidth: SQUEEZE_MAX_WIDTH, squeezeMinLines: SQUEEZE_MIN_LINES,
  squeezeMaxCharsPerLine: SQUEEZE_MAX_CHARS_PER_LINE, squeezeMinWordLines: SQUEEZE_MIN_WORD_LINES,
  tableMinCellWidth: 40,
};

// ---------------------------------------------------------------------------------------------------------------
// Components (from the Control Center's judge of drawers and tables, 2026-10-12 — UAT-45, UAT-49; recheck 3 of
// 2026-10-11). facts.mjs names the component of every measured text: the title of its card, `drawer` inside an open
// drawer, or the shell region. The rules below pair the two sides by component, never by page totals: totals blame
// the product for longer data in the same column.

/** The component key as the rules compare it: the card title after simpleTitle. */
export const componentKey = (component) => simpleTitle(component ?? '') || 'page';
const byComponent = (items) => new Set((items ?? []).map((i) => componentKey(i.component)));

/**
 * Squeezed text, by component (recheck 3 of the Control Center, 2026-10-11 · approved by the MJRP 2026-10-12). A
 * squeezed element of the product fails only when its column is visibly narrower than the prototype's column in the
 * same component: below 80% of it, and, besides, under 60 px or wrapped to 5+ lines. The prototype's column is the
 * narrowest width at which the prototype itself lets text wrap in that component (facts `columns`). A squeezed element
 * whose component has no column on the prototype falls back to the count rule, over those elements.
 */
export const SQUEEZE_MIN_RATIO = 0.8;

export function squeezeDivergences(pt, qt) {
  const pItems = pt?.squeezed?.items;
  const qItems = qt?.squeezed?.items;
  if (!Array.isArray(pItems) || !Array.isArray(qItems)) {
    // facts without components (captured before 2026-10-12): the count rule over the whole page
    const [p, q] = [pt?.squeezed?.count ?? 0, qt?.squeezed?.count ?? 0];
    return { narrower: [], unpaired: q > p ? qt.squeezed.samples ?? [] : [], legacy: true, protoUnpaired: p, productUnpaired: q };
  }
  const pCols = Object.fromEntries(Object.entries(pt.columns ?? {}).map(([k, w]) => [componentKey(k), w]));
  const qComponents = new Set([...Object.keys(qt.columns ?? {}).map(componentKey), ...byComponent(qItems)]);
  const narrower = [];
  const unpaired = [];
  for (const item of qItems) {
    const column = pCols[componentKey(item.component)];
    if (column === undefined) unpaired.push(item);
    else if (item.width < SQUEEZE_MIN_RATIO * column && (item.width < SQUEEZE_MAX_WIDTH || item.lines >= SQUEEZE_MIN_WORD_LINES)) narrower.push({ ...item, protoColumn: column });
  }
  const protoUnpaired = pItems.filter((i) => !qComponents.has(componentKey(i.component)) || pCols[componentKey(i.component)] === undefined).length;
  return { narrower, unpaired: unpaired.length > protoUnpaired ? unpaired : [], legacy: false, protoUnpaired, productUnpaired: unpaired.length };
}

/**
 * Raw markdown, by pattern and by component (same origin): a marker the product shows in a component where the
 * prototype shows none of that marker fails. The page total let 120 raw titles through because the prototype had three
 * literal "## Now" titles somewhere else on the page.
 */
export function markdownDivergences(pt, qt) {
  const pItems = pt?.rawMarkdown?.items;
  const qItems = qt?.rawMarkdown?.items;
  if (!Array.isArray(pItems) || !Array.isArray(qItems)) {
    // facts without components: the product shows some, the prototype none
    return (qt?.rawMarkdown?.count ?? 0) > 0 && (pt?.rawMarkdown?.count ?? 0) === 0 ? (qt.rawMarkdown.samples ?? []).map((text) => ({ text, component: 'page', markers: rawMarkdownMarkers(text) })) : [];
  }
  const seen = new Set(pItems.flatMap((i) => i.markers.map((m) => `${componentKey(i.component)}\u0000${m}`)));
  return qItems
    .map((i) => ({ ...i, markers: i.markers.filter((m) => !seen.has(`${componentKey(i.component)}\u0000${m}`)) }))
    .filter((i) => i.markers.length > 0);
}

/**
 * Tables (Control Center UAT-49: "bastante texto quebrado em tabelas"). A visible table diverges when it spills out of
 * its container with no scroll of its own, has a cell with a word broken in the middle, or has a text cell narrower
 * than 40 px — and the prototype has no table in the same component with the same problem. A wide table that scrolls
 * inside its own container (overflow-x: auto) is right.
 */
export const TABLE_MIN_CELL_WIDTH = TEXT_HEALTH_OPTIONS.tableMinCellWidth;
export const TABLE_PROBLEMS = [
  { id: 'overflow', test: (t) => t.overflow },
  { id: 'broken-words', test: (t) => t.brokenWords > 0 },
  { id: 'narrow-cells', test: (t) => t.narrowCells > 0 },
];

export function tableDivergences(pt, qt) {
  const pTables = pt?.tables;
  const qTables = qt?.tables;
  if (!Array.isArray(pTables) || !Array.isArray(qTables)) return [];
  const out = [];
  for (const problem of TABLE_PROBLEMS) {
    const protoHas = new Set(pTables.filter(problem.test).map((t) => componentKey(t.component)));
    const tables = qTables.filter((t) => problem.test(t) && !protoHas.has(componentKey(t.component)));
    if (tables.length) out.push({ problem, tables });
  }
  return out;
}

/**
 * Text overflow (Control Center UAT-49; UAT-30 had been left to the eye). A text element whose scrollWidth exceeds its
 * clientWidth with no scroll of its own (an ellipsis or a line clamp is a cut by design), or whose text passes the edge
 * of its card or drawer. Fails when the product overflows in a component where the prototype does not.
 */
export function overflowDivergences(pt, qt) {
  const pItems = pt?.overflow?.items;
  const qItems = qt?.overflow?.items;
  if (!Array.isArray(pItems) || !Array.isArray(qItems)) return [];
  const protoHas = byComponent(pItems);
  return qItems.filter((i) => !protoHas.has(componentKey(i.component)));
}

// ---------------------------------------------------------------------------------------------------------------
// The check groups. Each returns [{ id, sev, proto, product }] for one pair of sides; none means parity.

/** Typography of each role: family (P0), size (P1 from 2 px, P2 from 1 px), weight (P1), case and spacing (P2). */
export function typographyChecks(p, q, { roles, labels, letterSpacingIgnored = ['body'] } = {}) {
  const out = [];
  for (const role of roles ?? Object.keys(p.typography ?? {})) {
    const a = p.typography?.[role];
    const b = q.typography?.[role];
    if (!a || !b) continue;
    if (a.first !== b.first) out.push({ id: label(labels, 'font', role), sev: 'P0', proto: `${a.first} (${a.family})`, product: `${b.first} (${b.family})` });
    const dSize = Math.abs(px(a.size) - px(b.size));
    if (dSize >= 1) out.push({ id: label(labels, 'size', role), sev: dSize >= 2 ? 'P1' : 'P2', proto: a.size, product: b.size });
    if (a.weight !== b.weight) out.push({ id: label(labels, 'weight', role), sev: 'P1', proto: a.weight, product: b.weight });
    if (a.transform !== b.transform || (a.letterSpacing !== b.letterSpacing && !letterSpacingIgnored.includes(role))) {
      out.push({ id: label(labels, 'caseSpacing', role), sev: 'P2', proto: `${a.transform} ${a.letterSpacing}`, product: `${b.transform} ${b.letterSpacing}` });
    }
  }
  return out;
}

/** The webfonts a role draws that the prototype loaded and the product did not (P0). */
export function webfontChecks(p, q, { labels } = {}) {
  const missing = missingWebfonts(p, q);
  if (!missing.length) return [];
  const fam = (list) => [...new Set(list.map(family))].join(', ');
  return [{ id: label(labels, 'webfonts'), sev: 'P0', proto: `faltam ${missing.join(', ')} · protótipo: ${fam(p.fontsLoaded)}`, product: fam(q.fontsLoaded) || 'nenhuma — cai na fonte do sistema' }];
}

/**
 * The design system's tokens on :root: the names (P2), the core values (P1, text tokens under AH-01), the font
 * stacks' fallback (P2 — the font itself is the webfonts check) and the palette in use (P0).
 */
export function tokenChecks(p, q, { coreTokens = [], textTokens = AH01_TEXT_TOKENS, fallbackTokens = [], paletteAliases = {}, labels } = {}) {
  const out = [];
  const pk = Object.keys(p.tokens ?? {});
  const qk = Object.keys(q.tokens ?? {});
  const onlyP = pk.filter((k) => !qk.includes(k));
  const onlyQ = qk.filter((k) => !pk.includes(k));
  if (onlyP.length || onlyQ.length) out.push({ id: label(labels, 'tokenNames'), sev: 'P2', proto: `só no protótipo: ${onlyP.join(' ') || '—'}`, product: `só no produto: ${onlyQ.join(' ') || '—'}` });
  for (const t of coreTokens) if (!tokenMatches(t, p.tokens, q.tokens, textTokens)) out.push({ id: label(labels, 'token', t), sev: 'P1', proto: p.tokens[t] ?? '—', product: q.tokens[t] ?? '—' });
  for (const t of fallbackTokens) {
    if ((p.tokens[t] ?? '').replace(/["'\s]/g, '') !== (q.tokens[t] ?? '').replace(/["'\s]/g, '')) out.push({ id: label(labels, 'tokenFallback', t), sev: 'P2', proto: p.tokens[t] ?? '—', product: q.tokens[t] ?? '—' });
  }
  const palId = (x) => paletteAliases[x] ?? x;
  if (palId(p.palette) !== palId(q.palette)) out.push({ id: label(labels, 'palette'), sev: 'P0', proto: p.palette ?? '—', product: q.palette ?? '—' });
  return out;
}

/** The layout: header height (P2), container width (P1), gap between cards (P2), horizontal page scroll (P1). */
export function layoutChecks(p, q, { labels } = {}) {
  const out = [];
  const a = p.layout;
  const b = q.layout;
  if (Math.abs(a.headerHeight - b.headerHeight) > 4) out.push({ id: label(labels, 'headerHeight'), sev: 'P2', proto: `${a.headerHeight}px`, product: `${b.headerHeight}px` });
  if (Math.abs(a.mainWidth - b.mainWidth) > 8) out.push({ id: label(labels, 'mainWidth'), sev: 'P1', proto: `${a.mainWidth}px`, product: `${b.mainWidth}px` });
  if (a.cardGap !== null && b.cardGap !== null && Math.abs(a.cardGap - b.cardGap) > 3) out.push({ id: label(labels, 'cardGap'), sev: 'P2', proto: `${a.cardGap}px`, product: `${b.cardGap}px` });
  if (!a.horizontalOverflow && b.horizontalOverflow) out.push({ id: label(labels, 'overflow'), sev: 'P1', proto: 'não', product: 'sim' });
  return out;
}

/**
 * Text health of one pair of sides, on the whole page or, with `where`, inside a drawer: raw markdown by component,
 * squeezed text (a column narrower than the prototype's in the same component; or, unpaired, the count rule), tables
 * and text overflow by component — all P1. Facts captured without components fall back to the page-total rules.
 */
export function textHealthChecks(pt, qt, { labels, where = '' } = {}) {
  const out = [];
  if (!pt || !qt) return out;      // facts captured without the text-health option
  const add = (id, sev, proto, product) => out.push({ id: `${where}${id}`, sev, proto, product });
  const md = markdownDivergences(pt, qt);
  if (md.length) add(label(labels, 'rawMarkdown'), 'P1', pt?.rawMarkdown?.items ? 'sem esse marcador no componente' : '0', `${md.length}: ${md.slice(0, 5).map((i) => `[${i.component}] ${i.markers.join('+')}: ${i.text}`).join(' ‖ ')}`);
  const sq = squeezeDivergences(pt, qt);
  const fmt = (x) => `"${x.text}" ${x.width}px ${x.lines} linhas${x.protoColumn ? ` (protótipo ${x.protoColumn}px)` : ''}${x.component ? ` [${x.component}]` : ''}`;
  if (sq.narrower.length) add(label(labels, 'squeezedNarrower', SQUEEZE_MIN_RATIO), 'P1', sq.narrower.slice(0, 3).map((x) => `[${x.component}] ${x.protoColumn}px`).join(' ‖ '), `${sq.narrower.length}: ${sq.narrower.slice(0, 5).map(fmt).join(' ‖ ')}`);
  if (sq.unpaired.length) add(label(labels, 'squeezed', SQUEEZE_MAX_WIDTH), 'P1', String(sq.protoUnpaired), `${sq.legacy ? qt.squeezed.count : sq.unpaired.length}: ${sq.unpaired.slice(0, 5).map(fmt).join(' ‖ ')}`);
  for (const { problem, tables } of tableDivergences(pt, qt)) add(label(labels, 'table', problem.id), 'P1', 'sem esse problema no componente', `${tables.length}: ${tables.slice(0, 4).map((t) => `[${t.component}] ${(t.samples ?? []).slice(0, 2).join(' · ')}`).join(' ‖ ')}`);
  const ov = overflowDivergences(pt, qt);
  if (ov.length) add(label(labels, 'overflowing'), 'P1', 'sem transbordo no componente', `${ov.length}: ${ov.slice(0, 5).map((i) => `[${i.component}] "${i.text}" +${i.by}px`).join(' ‖ ')}`);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Drawers (Control Center UAT-49: text broken "nas gavetas laterais abertas"). A drawer scenario opens the first
// clickable row of one drawer kind on both sides (the record's `drawer`, the action `drawer:<kind>` with `row` and
// `opened`); the data inside differs, so the form is compared: the drawer's width over the viewport, its edges, and the
// text health inside it.
// UAT-427 (F209, kit 1.3): the click is judged on the PRODUCT's side alone - a row the product has and that does not open its
// drawer is a P0, whatever the prototype did (a product whose cards open nothing used to pass with no finding). A drawer
// scenario that clicks by a plain gesture (`click`, `click:<sel>`, `clickText:<re>`, with no `drawer:<kind>` action) is
// judged the same way: the gesture found its target = the row, a drawer in the side's facts = opened. And a side that
// counts its cards (`cards` on the `drawer:<kind>` action: the cards on screen, clickable or not) and has no clickable row
// while cards are there has a card that is not a button (P0), told apart from a row the data does not have (P2 no-row).

/** The drawer's width over the viewport may differ by this much (0.05 of 1440 px is 72 px). */
export const DRAWER_RATIO_TOLERANCE = 0.05;

/** The text health of what sits inside the open drawer (component `drawer`). */
export const drawerTextHealth = (th) => th && {
  rawMarkdown: th.rawMarkdown?.items ? { ...th.rawMarkdown, items: th.rawMarkdown.items.filter((i) => i.component === 'drawer') } : { count: 0, samples: [], items: [] },
  squeezed: th.squeezed?.items ? { ...th.squeezed, items: th.squeezed.items.filter((i) => i.component === 'drawer') } : { count: 0, samples: [], items: [] },
  columns: Object.fromEntries(Object.entries(th.columns ?? {}).filter(([k]) => k === 'drawer')),
  tables: (th.tables ?? []).filter((t) => t.component === 'drawer'),
  overflow: { items: (th.overflow?.items ?? []).filter((i) => i.component === 'drawer') },
};

/** The checks of a drawer scenario (the record's `drawer` names the kind). */
export function drawerChecks(rec, { labels } = {}) {
  const out = [];
  const add = (id, sev, proto, product) => out.push({ id, sev, proto, product });
  const kind = rec.drawer;
  const pd = rec.proto?.drawer;
  const qd = rec.product?.drawer;
  const find = (list, drawer) => {
    const own = (list ?? []).find((a) => a.action === `drawer:${kind}`);
    if (own) return own;
    const click = [...(list ?? [])].reverse().find((a) => /^click(Text)?(:|$)/.test(String(a.action)));
    return click && { action: click.action, available: click.available, row: !!click.available, opened: !!drawer, cards: click.cards };   // `cards`: UAT-532 (C)
  };
  const pa = find(rec.protoActions, pd);
  const qa = find(rec.productActions, qd);
  if (!qa?.row && qa?.cards > 0) {
    add(label(labels, 'drawerNotButton', kind), 'P0', pa?.row ? 'abre' : '—', `${qa.cards} card(s) na tela, nenhum é botão`);
    return out;
  }
  if (pa?.row && !qa?.row) {
    add(label(labels, 'drawerNoRow', kind), 'P2', 'abre', 'nenhuma linha');
    return out;
  }
  if (!qa?.row) return out;                             // neither side has the row: nothing to compare
  if (!qa.opened || !qd) {
    add(label(labels, 'drawerNotOpen', kind), 'P0', pa?.opened ? (pd?.title ?? 'abre') : '—', 'não abre');
    return out;
  }
  // the wide drawer is for an image: when the first row is an image on one side and a text on the other, the data
  // decided the width, not the form
  if (pd && pd.wide !== qd.wide) add(label(labels, 'drawerWideMismatch', kind), 'P2', `${pd.wide ? 'larga' : 'estreita'} ${pd.width}px`, `${qd.wide ? 'larga' : 'estreita'} ${qd.width}px`);
  else if (pd && Math.abs(pd.ratio - qd.ratio) > DRAWER_RATIO_TOLERANCE) add(label(labels, 'drawerRatio', kind), 'P1', `${pd.width}px de ${rec.proto.viewport.width} (${Math.round(pd.ratio * 100)}%)`, `${qd.width}px de ${rec.product.viewport.width} (${Math.round(qd.ratio * 100)}%)`);
  if (qd.left < -1 || qd.right > rec.product.viewport.width + 1) add(label(labels, 'drawerEdge', kind), 'P1', pd ? `${pd.left}–${pd.right}px` : '—', `${qd.left}–${qd.right}px de ${rec.product.viewport.width}`);
  // with no drawer on the prototype's side, the product's drawer is judged alone: any problem inside it counts
  out.push(...textHealthChecks(drawerTextHealth(pd ? rec.proto.textHealth : null) ?? drawerTextHealth({}), drawerTextHealth(rec.product.textHealth), { labels, where: label(labels, 'drawerWhere', kind) }));
  return out;
}


/** The default ceiling of the static reference's visual difference (share of pixels that differ); the project sets
 * its own in `rules.imageDiffMax` — exported design and live data never match pixel for pixel. */
export const IMAGE_DIFF_MAX = 0.05;

/**
 * The judge of a STATIC reference (exports of a design tool — MJRP, 2026-10-12): there are no facts on the
 * reference's side, so the comparison is by image — the share of pixels that differ above the ceiling (P1), a screen
 * of another width (P1) — and the product alone answers the rules that need no other side: raw markdown, squeezed
 * text, text past its box (tables and drawers), horizontal page scroll (all P1). The eyes on the pairs do the rest.
 */
export function staticChecks(rec, { labels, imageDiffMax = IMAGE_DIFF_MAX } = {}) {
  const q = rec.product;
  if (!q || rec.protoError) return [{ id: label(labels, 'capture'), sev: 'P0', proto: rec.protoError ?? 'ok', product: rec.productError ?? 'ok' }];
  const out = [];
  const d = rec.imageDiff;
  if (!d || d.error) out.push({ id: label(labels, 'capture'), sev: 'P0', proto: 'imagem de referência', product: d?.error ?? 'sem diferença medida' });
  else {
    if (d.refWidth !== d.productWidth) out.push({ id: label(labels, 'imageWidth'), sev: 'P1', proto: `${d.refWidth}px`, product: `${d.productWidth}px` });
    if (d.ratio > imageDiffMax) out.push({ id: label(labels, 'imageDiff'), sev: 'P1', proto: `limiar ${(imageDiffMax * 100).toFixed(1)}%`, product: `${(d.ratio * 100).toFixed(1)}% dos pixels` });
  }
  // the product alone: against an empty reference, every problem of its own text counts (tables, overflow, drawers too)
  const t = q.textHealth;
  if (t) {
    const none = { rawMarkdown: { count: 0, samples: [], items: [] }, squeezed: { count: 0, samples: [], items: [] }, columns: {}, tables: [], overflow: { items: [] } };
    out.push(...textHealthChecks(none, t, { labels }));
  }
  if (q.layout?.horizontalOverflow) out.push({ id: label(labels, 'overflow'), sev: 'P1', proto: '—', product: 'sim' });
  return out;
}

/** The order of the shell's regions, top to bottom (P0). */
export function orderChecks(p, q, { labels, ignore = [] } = {}) {
  const po = (p.order ?? []).filter((k) => !ignore.includes(k));
  const qo = (q.order ?? []).filter((k) => !ignore.includes(k));
  return JSON.stringify(po) === JSON.stringify(qo) ? [] : [{ id: label(labels, 'order'), sev: 'P0', proto: po.join(' › '), product: qo.join(' › ') }];
}

/** The cards: count (P1), order and title (P2), collapse on every card (P0) and its mechanism (P1), the first box. */
export function cardChecks(p, q, { labels, protoCards } = {}) {
  const out = [];
  const add = (key, sev, proto, product, ...args) => out.push({ id: label(labels, key, ...args), sev, proto, product });
  const pCards = protoCards ?? p.cards ?? [];
  const qCards = q.cards ?? [];
  const pc = pCards.map((c) => simpleTitle(c.title));
  const qc = qCards.map((c) => simpleTitle(c.title));
  if (pc.length !== qc.length) add('cardsCount', 'P1', `${pc.length}: ${pCards.map((c) => c.title).join(' · ')}`, `${qc.length}: ${qCards.map((c) => c.title).join(' · ')}`);
  else if (JSON.stringify(pc) !== JSON.stringify(qc)) add('cardsOrder', 'P2', pCards.map((c) => c.title).join(' · '), qCards.map((c) => c.title).join(' · '));
  const pCol = pCards.filter((c) => c.collapse !== 'none').length;
  const qCol = qCards.filter((c) => c.collapse !== 'none').length;
  if (qCol < pCol) add('collapse', 'P0', `${pCol} de ${pCards.length} cards`, `${qCol} de ${qCards.length} cards`);
  const pMech = [...new Set(pCards.map((c) => c.collapse))].join('+');
  const qMech = [...new Set(qCards.map((c) => c.collapse))].join('+');
  if (pCol > 0 && pMech !== qMech) add('collapseMechanism', 'P1', pMech, qMech);
  const [c0p, c0q] = [pCards[0], qCards[0]];
  if (c0p && c0q) {
    if (c0p.padding !== c0q.padding) add('cardPadding', 'P1', c0p.padding, c0q.padding);
    if (c0p.radius !== c0q.radius) add('cardRadius', 'P2', c0p.radius, c0q.radius);
    if (c0p.border !== c0q.border) add('cardBorder', 'P2', c0p.border, c0q.border);
  }
  return out;
}

/**
 * The design system's standardized components: one the prototype shows and the product does not (P0); one the
 * product adds (P2). Names matched by `followData` follow the data, not the design, and are not compared.
 */
export function componentChecks(p, q, { labels, followData = /drawer open|toast|empty/ } = {}) {
  const out = [];
  for (const [name, n] of Object.entries(p.components ?? {})) {
    if (followData.test(name)) continue;
    const m = q.components?.[name] ?? 0;
    if (n > 0 && m === 0) out.push({ id: label(labels, 'component', name), sev: 'P0', proto: String(n), product: '0' });
    else if (n === 0 && m > 0) out.push({ id: label(labels, 'componentExtra', name), sev: 'P2', proto: '0', product: String(m) });
  }
  return out;
}

/** A gesture the prototype accepts and the product does not (P0). */
export function actionChecks(rec, { labels } = {}) {
  const qa = rec.productActions ?? [];
  // the drawer gestures are judged by drawerChecks (a row the data may not have is not a missing gesture)
  return (rec.protoActions ?? []).flatMap((a, i) => (a.available && !qa[i]?.available && !String(a.action).startsWith('drawer:') ? [{ id: label(labels, 'action', a.action), sev: 'P0', proto: 'sim', product: 'não' }] : []));
}

/**
 * The kit's judge for a project with no checks of its own: every group, in the order a reader scans a screen. The
 * options name the project's design system: the core tokens, the font-stack tokens, the palette aliases.
 */
export function baseChecks(rec, opts = {}) {
  if (rec.reference === 'static') return staticChecks(rec, opts);
  const p = rec.proto;
  const q = rec.product;
  if (!p || !q) return [{ id: label(opts.labels, 'capture'), sev: 'P0', proto: rec.protoError ?? 'ok', product: rec.productError ?? 'ok' }];
  if (rec.drawer) return drawerChecks(rec, opts);      // a drawer scenario judges the drawer; the page has its own scenario
  return [
    ...orderChecks(p, q, opts),
    ...cardChecks(p, q, opts),
    ...componentChecks(p, q, opts),
    ...typographyChecks(p, q, opts),
    ...webfontChecks(p, q, opts),
    ...tokenChecks(p, q, opts),
    ...layoutChecks(p, q, opts),
    ...textHealthChecks(p.textHealth, q.textHealth, opts),
    ...actionChecks(rec, opts),
  ];
}
