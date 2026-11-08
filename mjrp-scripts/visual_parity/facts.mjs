// cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The structural and style facts of a screen, read in the page — the same function on the prototype and on the product.
// Self-contained: Playwright serializes it into the browser, so it may not reference anything outside its body; what
// it needs from the project (selectors, the text-health thresholds) arrives as one plain-data argument.
//
// Detection is semantic by default (a card is what carries an h2 or a <summary>; a collapse control is a button with
// aria-expanded in that title, or the card being a <details>), so neither side is judged by the other's class names.
// A project whose two DOMs name the same thing differently lists both names in its selectors.
//
// opts = {
//   root:       the view root            (default 'main')
//   header:     the page header          (default 'header')
//   regions:    { name: selector }       the shell's blocks, whose top-to-bottom order is compared
//   cards:      { head, container, toggle, collapsedClass, exclude }
//   components: { name: selector }       the design system's standardized components, counted when visible
//   roles:      { name: selector }       the typographic roles sampled (computed style of the first visible match)
//   paletteAttr: the data attribute on <html> naming the palette in use (default 'palette')
//   skip:       selector whose text is left out of the text health (code, editable fields, prototype-only chrome)
//   overflowSkip: selector left out of the overflow measure (form fields, svg)
//   drawer:     the open drawer (default '.drawer.on, [role="dialog"], dialog[open]'); drawerWideClass marks the wide one
//   text:       TEXT_HEALTH_OPTIONS of rules.mjs (raw markdown patterns, squeeze and table thresholds); absent → none
// Every measured text carries its component (card title, `drawer`, a region name, or `page`): the rules pair the
// two sides by component, never by page totals.
// }
export function collectFacts(opts = {}) {
  const o = {
    root: 'main', header: 'header', regions: {}, components: {}, roles: {}, paletteAttr: 'palette',
    skip: 'code, pre, kbd, samp, textarea, input, script, style, [contenteditable="true"]',
    overflowSkip: 'textarea, input, select, script, style, svg',
    drawer: '.drawer.on, [role="dialog"], dialog[open]', drawerWideClass: 'wide',
    ...opts,
    cards: { head: 'h2, summary', container: '.card, details, section, article', toggle: 'button[aria-expanded]', collapsedClass: 'min', exclude: '[role="dialog"]', ...(opts.cards ?? {}) },
  };
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const visible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.left < window.innerWidth && rect.right > 0;
  };
  const first = (sel, scope = document) => (sel ? [...scope.querySelectorAll(sel)].find((el) => visible(el)) : undefined);
  const ownText = (el) => norm([...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' '));
  const sample = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      family: s.fontFamily, first: (s.fontFamily.split(',')[0] ?? '').replace(/["']/g, '').trim(), size: s.fontSize,
      weight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, transform: s.textTransform,
      color: s.color, text: norm(el.textContent).slice(0, 60),
    };
  };
  const root = first(o.root) ?? document.body;

  // ---- the order of the shell's regions, top to bottom
  const order = Object.entries(o.regions).map(([k, sel]) => [k, first(sel)]).filter(([, el]) => el)
    .sort((a, b) => a[1].getBoundingClientRect().top - b[1].getBoundingClientRect().top).map(([k]) => k);

  // ---- cards: what carries a heading, inside the view root
  const heads = [...root.querySelectorAll(o.cards.head)].filter((h) => visible(h) && !(o.cards.exclude && h.closest(o.cards.exclude)));
  const cardEls = [];
  for (const h of heads) {
    const card = h.closest(o.cards.container) ?? h.parentElement;
    if (!card || cardEls.some((c) => c.card === card)) continue;
    cardEls.push({ card, head: h });
  }
  const cards = cardEls.map(({ card, head }) => {
    const toggle = head.querySelector(o.cards.toggle);
    const collapse = toggle ? 'button' : card.tagName === 'DETAILS' ? 'details' : 'none';
    const collapsed = card.tagName === 'DETAILS' ? !card.open : card.classList.contains(o.cards.collapsedClass);
    const cs = getComputedStyle(card);
    const title = norm([...head.childNodes].filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.matches('button'))).map((n) => n.textContent).join(' '));
    return {
      title: title.slice(0, 80), collapse, collapsed,
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, radius: cs.borderTopLeftRadius,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`, background: cs.backgroundColor,
    };
  });

  // ---- standardized components
  const components = {};
  for (const [name, sel] of Object.entries(o.components)) components[name] = [...document.querySelectorAll(sel)].filter(visible).length;
  components['card-collapse-toggle'] = cards.filter((c) => c.collapse !== 'none').length;

  // ---- typography
  const typography = { body: sample(document.body) };
  for (const [role, sel] of Object.entries(o.roles)) typography[role] = sample(first(sel) ?? null);
  if (!o.roles.cardTitle && cardEls[0]) typography.cardTitle = sample(cardEls[0].head);

  // ---- tokens: every custom property declared on :root (stylesheets + inline), with its computed value
  const names = new Set();
  const visit = (list) => {
    for (const rule of [...list]) {
      if (rule instanceof CSSStyleRule && /:root/.test(rule.selectorText)) {
        for (const prop of [...rule.style]) if (prop.startsWith('--')) names.add(prop);
      } else if (rule.cssRules) visit(rule.cssRules);
    }
  };
  for (const sheet of [...document.styleSheets]) {
    try { visit(sheet.cssRules); } catch { /* cross-origin sheet */ }
  }
  for (const prop of [...document.documentElement.style]) if (prop.startsWith('--')) names.add(prop);
  const rootStyle = getComputedStyle(document.documentElement);
  const tokens = {};
  for (const n of [...names].sort()) tokens[n] = rootStyle.getPropertyValue(n).trim();
  const fontsLoaded = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/["']/g, '')} ${f.weight}`))].sort();

  // ---- the open drawer: the largest visible match of `drawer`, its box over the viewport
  const area = (el) => el.getBoundingClientRect().width * el.getBoundingClientRect().height;
  const drawerEl = [...document.querySelectorAll(o.drawer)].filter((el) => visible(el)).sort((x, y) => area(y) - area(x))[0];
  let drawer = null;
  if (drawerEl) {
    const r = drawerEl.getBoundingClientRect();
    drawer = {
      width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right),
      ratio: Math.round((r.width / window.innerWidth) * 1000) / 1000, wide: drawerEl.classList.contains(o.drawerWideClass),
      title: norm(drawerEl.querySelector('h2, h3')?.textContent).slice(0, 80),
    };
  }

  // ---- components: every measured text is paired across the sides by the component it sits in — the title of its
  // card, `drawer` inside the open drawer, or the shell region (opts.regions)
  const cardTitle = new Map(cardEls.map(({ card }, i) => [card, cards[i].title]));
  const regionEntries = Object.entries(o.regions);
  const componentOf = (el) => {
    if (drawerEl && drawerEl.contains(el)) return 'drawer';
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const title = cardTitle.get(e);
      if (title !== undefined) return title || 'card';
      const region = regionEntries.find(([, sel]) => e.matches(sel));
      if (region && region[1] !== o.root) return region[0];
    }
    return 'page';
  };
  // the box a text must stay inside: its drawer, else its card, else the viewport
  const containerOf = (el) => {
    if (drawerEl && drawerEl.contains(el)) return drawerEl;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) if (cardTitle.has(e)) return e;
    return null;
  };
  const boxOf = (container) => (container ? container.getBoundingClientRect() : { left: 0, right: window.innerWidth });
  const scrollsX = (e) => /(auto|scroll)/.test(getComputedStyle(e).overflowX);
  const scrollerBetween = (el, container) => {
    for (let e = el.parentElement; e && e !== container && e !== document.body; e = e.parentElement) if (scrollsX(e)) return true;
    return false;
  };

  // ---- text health (the rules of rules.mjs, by component): raw markdown left visible, text squeezed into a column too
  // narrow to read, the tables, and text that spills out of its box. Seals and icons are narrow by design and stay out
  // of the squeeze (not of the columns: the reference wraps them too).
  let textHealth = null;
  if (o.text) {
    const t = o.text;
    const CAP = 300;
    const isSealOrIcon = (el) => {
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        if (e.closest('svg') || e.getAttribute('role') === 'img' || e.getAttribute('aria-hidden') === 'true') return true;
        if ([...e.classList].some((c) => /^(tag|chip|badge|pill|seal|icon)$|(tag|chip|badge|seal|icon)$|-ic$/.test(c))) return true;
      }
      return false;
    };
    const patterns = t.markdown.map((p) => ({ id: p.id, re: new RegExp(p.source, p.flags) }));
    const rawSamples = [];
    const rawItems = [];
    let rawCount = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      const text = norm(n.textContent);
      if (!parent || text.length < 2 || parent.closest(o.skip) || !visible(parent)) continue;
      const markers = patterns.filter((p) => p.re.test(text)).map((p) => p.id);
      if (markers.length === 0) continue;
      rawCount += 1;
      if (rawSamples.length < 5) rawSamples.push(text.slice(0, 80));
      if (rawItems.length < CAP) rawItems.push({ text: text.slice(0, 80), component: componentOf(parent), markers });
    }
    // the lines of an element's own text, and how far left and right that text reaches
    const ownLines = (el) => {
      const tops = new Set();
      let right = -Infinity;
      let left = Infinity;
      for (const node of [...el.childNodes]) {
        if (node.nodeType !== Node.TEXT_NODE || norm(node.textContent).length === 0) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of [...range.getClientRects()]) {
          if (r.width <= 0 || r.height <= 0) continue;
          tops.add(Math.round(r.top));
          right = Math.max(right, r.right);
          left = Math.min(left, r.left);
        }
      }
      return { lines: tops.size, right, left };
    };
    const squeezedSamples = [];
    const squeezedItems = [];
    const columns = {};
    const overflowItems = [];
    let squeezedCount = 0;
    let overflowCount = 0;
    for (const el of [...document.body.querySelectorAll('*')]) {
      if (!visible(el)) continue;
      const own = [...el.childNodes].filter((c) => c.nodeType === Node.TEXT_NODE && norm(c.textContent).length > 0);
      if (own.length === 0 || ownText(el).length < 3) continue;
      const width = el.getBoundingClientRect().width;
      const { lines, right, left } = ownLines(el);
      const component = componentOf(el);
      // the column: the narrowest width at which text wraps in this component
      if (lines >= 2 && !el.closest('svg')) columns[component] = Math.min(columns[component] ?? Infinity, Math.round(width));
      // overflow: wider than its own box with no scroll of its own, or past the edge of its card or drawer
      if (!el.closest(o.overflowSkip)) {
        const cs = getComputedStyle(el);
        const container = containerOf(el);
        const block = cs.display !== 'inline' && cs.display !== 'contents';
        const cut = cs.textOverflow === 'ellipsis' || (cs.getPropertyValue('-webkit-line-clamp') || 'none') !== 'none';
        const box = boxOf(container);
        const past = Math.max(right - box.right, box.left - left);
        let kind = null;
        let by = 0;
        if (cut) kind = null;                              // an ellipsis or a line clamp cuts by design
        else if (block && !/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) [kind, by] = ['scroll', el.scrollWidth - el.clientWidth];
        else if (past > 1) [kind, by] = ['edge', past];
        if (kind && !scrollerBetween(el, container)) {
          overflowCount += 1;
          if (overflowItems.length < CAP) overflowItems.push({ text: ownText(el).slice(0, 40), component, kind, by: Math.round(by) });
        }
      }
      if (el.closest(o.skip) || isSealOrIcon(el)) continue;
      // squeezed (rules.mjs isSqueezed): 3+ lines under the width floor, or 5+ lines of about one word each
      const perLine = ownText(el).length / Math.max(1, lines);
      const narrow = lines >= t.squeezeMinLines && width < t.squeezeMaxWidth;
      const wordPerLine = lines >= t.squeezeMinWordLines && perLine < t.squeezeMaxCharsPerLine;
      if (!narrow && !wordPerLine) continue;
      squeezedCount += 1;
      const item = { text: ownText(el).slice(0, 40), width: Math.round(width), lines };
      if (squeezedSamples.length < 5) squeezedSamples.push(item);
      if (squeezedItems.length < CAP) squeezedItems.push({ ...item, component });
    }
    // tables: spilling out of the container with no scroll of its own, a word broken in the middle of a cell, a text
    // cell narrower than the floor
    const tables = [];
    for (const table of [...document.querySelectorAll('table')]) {
      if (!visible(table)) continue;
      const container = containerOf(table);
      const tr = table.getBoundingClientRect();
      const box = boxOf(container);
      const parent = table.parentElement;
      const spills = tr.right > box.right + 1 || tr.left < box.left - 1 || (!!parent && tr.width > parent.clientWidth + 1);
      const overflow = spills && !scrollerBetween(table, container);
      let brokenWords = 0;
      let narrowCells = 0;
      const samples = [];
      if (overflow) samples.push(`tabela ${Math.round(tr.width)}px num contêiner de ${Math.round(parent?.clientWidth ?? box.right - box.left)}px`);
      for (const cell of [...table.querySelectorAll('td, th')].filter((c) => visible(c)).slice(0, 600)) {
        const text = norm(cell.textContent);
        if (text.length === 0) continue;
        const cw = cell.getBoundingClientRect().width;
        if (cw < t.tableMinCellWidth) {
          narrowCells += 1;
          if (samples.length < 4) samples.push(`célula ${Math.round(cw)}px "${text.slice(0, 24)}"`);
        }
        // a word broken in the middle: a run of 3+ characters with no space or dash whose own range spans two lines
        const cellWalker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        for (let tn = cellWalker.nextNode(); tn; tn = cellWalker.nextNode()) {
          for (const m of (tn.textContent ?? '').matchAll(/[^\s\-/—–·]{3,}/g)) {
            const range = document.createRange();
            range.setStart(tn, m.index ?? 0);
            range.setEnd(tn, (m.index ?? 0) + m[0].length);
            const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
            if (tops.size < 2) continue;
            brokenWords += 1;
            if (samples.length < 4) samples.push(`"${m[0].slice(0, 24)}" quebrada numa célula de ${Math.round(cw)}px`);
          }
        }
      }
      tables.push({ component: componentOf(table), overflow, brokenWords, narrowCells, samples });
    }
    textHealth = {
      rawMarkdown: { count: rawCount, samples: rawSamples, items: rawItems },
      squeezed: { count: squeezedCount, samples: squeezedSamples, items: squeezedItems },
      columns,
      tables,
      overflow: { count: overflowCount, items: overflowItems },
    };
  }

  // ---- layout
  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const mainR = rect(first(o.root));
  const c0 = rect(cardEls[0]?.card);
  const c1 = rect(cardEls[1]?.card);
  return {
    url: location.href.replace(/token=[^&#]+/, 'token=REDACTED'),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    palette: document.documentElement.dataset[o.paletteAttr] ?? null,
    order, cards, components, typography, tokens, fontsLoaded, textHealth, drawer,
    layout: {
      mainLeft: Math.round(mainR?.left ?? 0), mainWidth: Math.round(mainR?.width ?? 0),
      headerHeight: Math.round(rect(first(o.header))?.height ?? 0),
      firstCardTop: c0 ? Math.round(c0.top + window.scrollY) : null, cardGap: c0 && c1 ? Math.round(c1.top - c0.bottom) : null,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      pageHeight: document.documentElement.scrollHeight,
    },
  };
}
