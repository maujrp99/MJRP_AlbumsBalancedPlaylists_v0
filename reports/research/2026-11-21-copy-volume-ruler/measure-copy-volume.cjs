#!/usr/bin/env node
// Mede o volume de texto visível de uma página pública, por tipo de elemento, em duas larguras.
// Uso:
//   PW=/caminho/para/node_modules/playwright node measure-copy-volume.cjs <saida.json> <nome>=<url> [<nome>=<url> ...]
// Sem login, sem clique, sem digitar nada. Só lê a página.
//
// O que conta (regras de contagem — iguais às do relatório):
//  - "dobra" (fold): o texto cuja caixa de linha cruza a janela inicial (0..altura) com a página no topo.
//  - "página inteira": todo texto visível pelo estilo (display, visibility, opacity>0, tamanho>0),
//    depois de rolar até o fim e voltar (para carregar o que é preguiçoso).
//  - Texto = nós de texto do DOM. aria-label, alt e title NÃO contam (não se veem). Placeholder de campo
//    conta à parte (coluna placeholder), porque some quando se digita.
//  - Palavra = sequência separada por espaço que tem ao menos uma letra ou dígito. Caractere = texto com
//    espaços colapsados, sem as bordas.
//  - Rótulo repetido (o mesmo texto no mesmo tipo) conta em todas as aparições em "total" e uma vez em "distintos".
//  - Área de texto = soma das caixas de linha (Range.getClientRects) recortadas à janela, dividida pela área da janela.
//  - Tipo do elemento: o ancestral mais próximo decide (ver classify()). É heurística; o relatório diz isso.
const fs = require('fs');
const { chromium } = require(process.env.PW || 'playwright');

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1 },
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
};

function inPage() {
  const KINDS = ['consent', 'data', 'title', 'heading', 'lede', 'button', 'nav', 'label', 'helper', 'status', 'card', 'body', 'footer', 'other'];
  const vw = window.innerWidth, vh = window.innerHeight;
  const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const visible = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return false;
      if (e.getAttribute('aria-hidden') === 'true' && e.closest('[aria-hidden="true"]') === e && cs.position === 'absolute' && e.getBoundingClientRect().width < 2) return false;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // texto só para leitor de tela (sr-only): 1px recortado
    const cs = getComputedStyle(el);
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') return false;
    return true;
  };
  const classify = (el) => {
    const c = (sel) => el.closest(sel);
    // aviso de cookies/consentimento: fica à parte (não é copy do produto)
    const cz = c('[id*=onetrust i],[class*=onetrust i],[id*=cookie i],[class*=cookie i],[id*=consent i],[class*=consent i],[aria-label*=cookie i],[aria-label*=privacy i]');
    // só conta como aviso quando o bloco é pequeno (uma classe «cookie» no <body> não faz da página inteira um aviso)
    if (cz && cz !== document.body && cz !== document.documentElement && (cz.textContent || '').length < 2500) return 'consent';
    // dado de catálogo (nome de álbum, artista, faixa): é conteúdo, não copy do produto
    if (c('a[href*="/album/"],a[href*="/artist/"],a[href*="/track/"],a[href*="/playlist/"],a[href*="/release/"],a[href*="/master/"],a[href*=".bandcamp.com"],[data-testid*=tracklist i],[class*=tracklist i],[class*=track-title i]')) return 'data';
    if (c('footer,[role=contentinfo]')) return 'footer';
    if (c('button,[role=button],input[type=submit],input[type=button],a[class*=btn i],a[class*=button i],a[class*=cta i]')) return 'button';
    if (c('nav,[role=navigation],[role=tab],[role=tablist],[role=menu],[role=menuitem],header a')) return 'nav';
    if (c('[role=alert],[role=status],[aria-live],[class*=toast i],[class*=snackbar i],[class*=error i],[class*=empty i]')) return 'status';
    if (c('h1')) return 'title';
    if (c('h2,h3,h4,h5,h6,[role=heading]')) return 'heading';
    if (c('label,legend')) return 'label';
    if (c('[class*=hint i],[class*=helper i],[class*=help i],small,figcaption,[class*=caption i]')) return 'helper';
    if (c('article,li,[class*=card i],[class*=tile i],[class*=item i]')) return 'card';
    const p = c('p');
    if (p) {
      // lede: primeiro parágrafo depois do h1, no mesmo bloco
      const h1 = document.querySelector('h1');
      if (h1 && h1.parentElement && h1.parentElement.contains(p) && (h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        const ps = [...h1.parentElement.querySelectorAll('p')];
        if (ps[0] === p) return 'lede';
      }
      return 'body';
    }
    return 'other';
  };
  const blank = () => Object.fromEntries(KINDS.map((k) => [k, { items: 0, words: 0, chars: 0 }]));
  const out = { fold: blank(), page: blank(), foldTextArea: 0, foldItems: [], pageItems: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map();
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    if (!visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const kind = classify(el);
    const w = words(t), ch = t.length;
    out.page[kind].items++; out.page[kind].words += w; out.page[kind].chars += ch;
    out.pageItems.push({ kind, text: t.slice(0, 200), words: w, chars: ch });
    let foldArea = 0;
    for (const r of rects) {
      const x0 = Math.max(0, r.left), x1 = Math.min(vw, r.right), y0 = Math.max(0, r.top), y1 = Math.min(vh, r.bottom);
      if (x1 > x0 && y1 > y0) foldArea += (x1 - x0) * (y1 - y0);
    }
    if (foldArea > 0) {
      out.fold[kind].items++; out.fold[kind].words += w; out.fold[kind].chars += ch;
      out.foldTextArea += foldArea;
      out.foldItems.push({ kind, text: t.slice(0, 200), words: w, chars: ch });
    }
    seen.set(kind + '|' + t, true);
  }
  const ph = [...document.querySelectorAll('input[placeholder],textarea[placeholder]')].filter(visible).map((e) => e.placeholder.trim()).filter(Boolean);
  out.placeholders = ph;
  out.distinctPageTexts = seen.size;
  out.foldTextShare = +(out.foldTextArea / (vw * vh)).toFixed(4);
  out.pageHeight = document.documentElement.scrollHeight;
  out.viewport = { vw, vh };
  out.title = document.title;
  return out;
}

const sum = (o, f) => Object.values(o).reduce((a, v) => a + v[f], 0);

(async () => {
  const [outFile, ...targets] = process.argv.slice(2);
  if (!outFile || !targets.length) { console.error('uso: node measure-copy-volume.cjs <saida.json> nome=url ...'); process.exit(2); }
  const browser = await chromium.launch();
  const results = [];
  for (const t of targets) {
    const i = t.indexOf('=');
    const name = t.slice(0, i), url = t.slice(i + 1);
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor, userAgent: vp.userAgent, locale: 'en-US', reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const rec = { name, url, device: vpName, width: vp.width, height: vp.height, measuredAt: new Date().toISOString() };
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2500);
        const fold = await page.evaluate(inPage);
        await page.screenshot({ path: outFile.replace(/\.json$/, `-${name}-${vpName}.png`) }).catch(() => {});
        // rola até o fim para carregar o que é preguiçoso, volta ao topo e mede a página inteira
        await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(1200);
        const whole = await page.evaluate(inPage);
        rec.finalUrl = page.url();
        rec.title = fold.title;
        const copy = (o) => Object.entries(o).filter(([k]) => k !== 'consent' && k !== 'data').reduce((a, [, v]) => ({ words: a.words + v.words, chars: a.chars + v.chars }), { words: 0, chars: 0 });
        rec.foldCopy = copy(fold.fold); rec.pageCopy = copy(whole.page);
        rec.fold = { byKind: fold.fold, words: sum(fold.fold, 'words'), chars: sum(fold.fold, 'chars'), items: sum(fold.fold, 'items'), textShare: fold.foldTextShare, texts: fold.foldItems };
        rec.page = { byKind: whole.page, words: sum(whole.page, 'words'), chars: sum(whole.page, 'chars'), items: sum(whole.page, 'items'), distinct: whole.distinctPageTexts, height: whole.pageHeight, screens: +(whole.pageHeight / vp.height).toFixed(1), texts: whole.pageItems };
        rec.placeholders = whole.placeholders;
      } catch (e) {
        rec.error = String(e.message || e).slice(0, 300);
      }
      results.push(rec);
      console.log(`${name} ${vpName}: ${rec.error ? 'ERRO ' + rec.error : `dobra ${rec.fold.words} pal / ${rec.fold.chars} car (copy sem cookies e dados: ${rec.foldCopy.words} pal), ${Math.round(rec.fold.textShare * 100)}% texto; página ${rec.page.words} pal (copy ${rec.pageCopy.words}), ${rec.page.screens} telas`}`);
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
})();
