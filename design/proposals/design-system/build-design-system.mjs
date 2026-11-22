#!/usr/bin/env node
/**
 * F86 — builds the page of the site's design system from docs/specs/design-system.md.
 *
 *   node design/proposals/design-system/build-design-system.mjs
 *
 * Reads   docs/specs/design-system.md       (the source: colours, contrast, type, measures, components, the
 *                                            lines pending the MJRP's word, conflicts — the page never
 *                                            carries a value the document or the site's CSS does not have)
 *         the site's own CSS                (Tailwind built from tailwind.config.js and public/css/tailwind.css,
 *                                            then the files in the order the site loads them; the entry
 *                                            page's own <style> from public/splash.html; the Home's tokens
 *                                            read from public/css/views/home.css)
 *         specimens.mjs                     (the live pieces, drawn by the site's code where it can be called)
 *         copy-rules.mjs                    (the voice, the decided words, the copy-volume ruler, with sources)
 *         design/inception/splash-menu-bar-v4.html  (the home with the bar-menu, a prototype pending approval:
 *                                            shown as it is, in frames, for the bar-menu and the vignettes)
 * Writes  design-system.html                (generated: never edit; published as a private Claude Artifact)
 *
 * Structure (critique of 2026-11-21, reports/audits/2026-11-21-mjrpalbumblender-v0-f86-design-system-page-critique.md):
 * the identity on the first screen, shown; a small index; colours, type, space and shape, motion, components,
 * copy, the disagreements between the document and the CSS; «Para aprovar» as its own button in the header.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { specimens, fictionalCover } from './specimens.mjs'
import { voice, words, ruler, rulerSource, COPY_REVIEW_URL } from './copy-rules.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../..')
const DOC = path.join(ROOT, 'docs/specs/design-system.md')
const OUT = path.join(HERE, 'design-system.html')
const PROTO = 'design/inception/splash-menu-bar-v4.html'
const require = createRequire(import.meta.url)
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

// ── the site's CSS ────────────────────────────────────────────────────────────────────────────────
function tailwind() {
  const cli = path.join(path.dirname(require.resolve('tailwindcss/package.json')), 'lib/cli.js')
  return execFileSync(process.execPath, [cli, '-c', 'tailwind.config.js', '-i', 'public/css/tailwind.css', '--minify'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}
/** A CSS file with its @import lines replaced by the files they name (as Vite does). */
function inline(p) {
  const dir = path.dirname(p)
  return read(p).replace(/@import\s+['"]([^'"]+)['"];?/g, (_, f) => inline(path.join(dir, f)))
}
function appCss() {
  // the order of public/index.html (modals.css) and public/js/app.js (index, tailwind, mobile, screens, safe-area)
  return [inline('public/css/modals.css'), inline('public/css/index.css'), tailwind(), inline('public/css/mobile.css'),
    inline('public/css/mobile/screens.css'), inline('public/css/safe-area.css')].join('\n')
}
function splashCss() {
  return read('public/splash.html').match(/<style>([\s\S]*?)<\/style>/)[1]
}
const dataUri = (p, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, p)).toString('base64')}`
/** An image made smaller for the page (sips on the Mac; the full file if it is not there). */
function smallPng(p, size) {
  const tmp = path.join(fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'f86-')), 'x.png')
  try {
    execFileSync('sips', ['-Z', String(size), path.join(ROOT, p), '--out', tmp], { stdio: 'ignore' })
    return `data:image/png;base64,${fs.readFileSync(tmp).toString('base64')}`
  } catch { return dataUri(p, 'image/png') }
}

// ── the document ──────────────────────────────────────────────────────────────────────────────────
const md = fs.readFileSync(DOC, 'utf8')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Feature codes said with their plain names first (the MJRP's rule: no bare codes in visible text). */
const FEATURES = { F63: 'feature da lista colada', F76: 'feature do celular', F79: 'Home nova', F80: 'página de entrada', F81: 'feature dos textos do site', F83: 'migração para React', F86: 'feature desta página' }
const named = (s) => String(s).replace(/(?<!\()\b(F\d{2})\b/g, (m, f) => FEATURES[f] ? `${FEATURES[f]} (${f})` : m)
/** A cell of the document as HTML: `code` and **bold** kept, the rest as text. */
const cell = (s) => esc(named(s)).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
/** The same, with the code marks dropped (for visible lines: plain names first, no bare codes). */
const plain = (s) => esc(named(s).replace(/`([^`]+)`/g, '$1')).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
/** The first table under a heading (the heading's exact text), as objects keyed by the header cells. */
function table(heading) {
  const lines = md.split('\n')
  const at = lines.findIndex((l) => l.trim() === heading)
  if (at < 0) throw new Error(`design-system.md has no heading «${heading}»`)
  const level = heading.match(/^#+/)[0].length
  const rows = []
  let head = null
  for (const line of lines.slice(at + 1)) {
    const h = line.match(/^(#+)\s/)
    if (h && h[1].length <= level) break
    if (!line.startsWith('|')) { if (head && rows.length) break; continue }
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim().replace(/\\\|/g, '|'))
    if (!head) { head = cells; continue }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue
    rows.push(Object.fromEntries(head.map((k, i) => [k, cells[i] ?? ''])))
  }
  if (!rows.length) throw new Error(`no table under «${heading}»`)
  return rows
}
/** The first paragraph under a heading. */
function para(heading) {
  const lines = md.split('\n')
  const at = lines.findIndex((l) => l.trim() === heading)
  return lines.slice(at + 1).find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('|')) || ''
}
const colours = table('### Cores')
const fire = table('### O fogo')
const eqs = table('### O equalizador')
const type = table('### Tipo')
const measures = table('### Medidas')
const families = table('### Famílias')
const parts = table('## Componentes')
const pending = table('## Pendentes')
const conflicts = table('## Conflitos no código')
const unused = table('## Declarado e não usado')
const defects = table('## Defeitos do CSS')
/** The tables of lines marked pending the MJRP's word, by the heading that says so (in document order). */
const PENDING_TABLES = [
  ['### Página de entrada · rodada 3 (a home com o menu na barra) — propostos, pendentes de aprovação do MJRP', 'A home com o menu na barra (rodadas de hoje)'],
  ['#### Home · o que a construção da F79 acrescentou (decidido pelo agente — revisável)', 'O que a construção da Home acrescentou'],
  ['## Página de entrada (F80) — padrões propostos, pendentes de aprovação do MJRP', 'Página de entrada, rodada 1']
]
const pendingGroups = PENDING_TABLES.map(([h, label]) => ({ label, rows: table(h) }))

// ── contrast, measured here (WCAG 2), against what the document says ────────────────────────────────
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) }
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const over = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a))
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
const br = (n) => n.toFixed(1).replace('.', ',')
const paletteLine = para('## Paleta')
/** [label as the document writes it, plain name, colour, alpha] */
const PAIRS = [
  ['branco', 'Texto', '#ffffff', 1], ['`#a0a0a8`', 'Cinza', '#a0a0a8', 1], ['branco a 72 %', 'Texto apagado', '#ffffff', 0.72],
  ['branco a 64 %', 'Texto mais apagado', '#ffffff', 0.64], ['`#fb923c`', 'Laranja de texto', '#fb923c', 1], ['`#4ade80`', 'Verde', '#4ade80', 1],
  ['`#fca5a5`', 'Rosa', '#fca5a5', 1], ['`#f87171`', 'Vermelho claro', '#f87171', 1]
]
const contrast = PAIRS.map(([label, name, c, a]) => {
  const onBlack = ratio(over(hex(c), a, [0, 0, 0]), [0, 0, 0])
  const onPanel = ratio(over(hex(c), a, hex('#101014')), hex('#101014'))
  const m = paletteLine.match(new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ([\\d,]+):1 \\(([\\d,]+):1\\)`))
  const said = m ? [m[1], m[2]] : null
  const agrees = said && Math.abs(parseFloat(said[0].replace(',', '.')) - onBlack) < 0.06 && Math.abs(parseFloat(said[1].replace(',', '.')) - onPanel) < 0.06
  return { name, c, a, onBlack, onPanel, said, agrees }
})
const onFire = ['#f97316', '#dc2626'].map((bg) => ({ bg, white: ratio([255, 255, 255], hex(bg)), black: ratio(hex('#0b0b0b'), hex(bg)) }))

// the Home's tokens, read from the CSS itself
const homeTokens = [...read('public/css/views/home.css').match(/:root\s*{([\s\S]*?)}/)[1].matchAll(/(--home-[a-z-]+):\s*([^;]+);/g)].map(([, k, v]) => ({ k, v: v.trim() }))

// ── the page ──────────────────────────────────────────────────────────────────────────────────────
const live = await specimens(ROOT)
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const LOGO = smallPng('public/assets/images/logo.png', 96)
const WORDMARK = smallPng('public/assets/images/TheAlbumBlender.png', 1100) // transparent (critique finding 6)
const SPLASH_WORDMARK = dataUri('public/splash/wordmark.jpg', 'image/jpeg')
const words$ = (t) => String(t).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

/** The entry page's pieces, from its own markup: the top bar, the progress thread, the first screen. */
function splashMarkup() {
  const page = read('public/splash.html')
  const top = page.match(/<header class="top">[\s\S]*?<\/header>/)[0].replace('/splash/wordmark.jpg', SPLASH_WORDMARK)
  const heights = ['.55', '1', '.7', '.4', '.8']
  const bars = heights.map((h) => `<i style="--h:${Number(h) * 100}%"></i>`).join('')
  const thread = page.match(/<nav class="thread"[\s\S]*?<\/nav>\s*<\/div>\s*<\/nav>|<nav class="thread"[\s\S]*?<\/div><\/nav>/)[0]
    .replace(/<a class="g" ([^>]*)><\/a>/g, (m, attrs) => `<a class="g" ${attrs}>${bars}</a>`)
    .replace(/<a class="g" href="#a1"/, '<a class="g on" href="#a1"').replace(/<a class="g" href="#a2"/, '<a class="g on" href="#a2"')
    .replace(' hidden>Pause motion', '>Pause motion')
  const hero = page.match(/<section class="hero"[\s\S]*?<\/section>/)[0]
  return `${top}${thread}<main class="wrap story" style="display:block">${hero}</main>`
}

let frameN = 0
const templates = []
/** One live frame: the markup in a <template>, drawn by the page's script into an iframe of `w` px. */
function frame(css, inner, w, h, label) {
  const id = `t${frameN++}`
  templates.push(`<template id="${id}">${inner.replaceAll('{{LOGO}}', LOGO).replaceAll('{{SPLASH}}', splashMarkup())}</template>`)
  return `<figure class="frame" style="--w:${w};--h:${h}"><figcaption>${esc(label)}</figcaption><div class="frame__box"><iframe title="${esc(label)}" data-tpl="${id}" data-css="${css}" width="${w}" height="${h}" loading="lazy"></iframe></div></figure>`
}
/** A frame of the home prototype (v4), at an anchor and in a state, drawn when it comes near the screen. */
function protoFrame(label, { at = '', w = 1280, h = 140, state = '', ph = 0 } = {}) {
  frameN++
  // on a narrow screen a computer-width frame would shrink to a quarter: there it is drawn at 390 px (ph tall)
  const narrow = w > 500 && ph ? ` data-pw="390" data-ph="${ph}"` : ''
  return `<figure class="frame" style="--w:${w};--h:${h}"><figcaption>${esc(label)}</figcaption><div class="frame__box"><iframe title="${esc(label)}" data-proto="${esc(at)}" data-state="${state}" width="${w}" height="${h}"${narrow}></iframe></div></figure>`
}
function pair(spec) {
  const out = []
  if (spec.desktop) out.push(frame(spec.css, spec.desktop, 960, spec.dh || 240, 'Computador'))
  if (spec.phone) out.push(frame(spec.css, spec.phone, 390, spec.ph || 420, 'Celular · 390'))
  return `<div class="pair${spec.desktop ? (spec.phone ? '' : ' pair--wide') : ' pair--phone'}">${out.join('')}</div>`
}
/** A closed table, its summary naming what it holds (critique finding 5). */
const details = (name, rows, cols) => `<details class="det"><summary>${esc(name)}</summary><div class="scroll"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${cell(r[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`
const finding = (html) => `<p class="finding"><span class="finding__tag">Desencontro</span> ${html}</p>`
const section = (id, title, line, body) => `<section class="fam" id="${id}"><h2>${esc(title)}</h2>${line ? `<p class="line">${line}</p>` : ''}${body}</section>`
const eqBars = (n, cls = 'is-live') => `<div class="home-eq ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="--h:${(0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)};--d:${(i % 7) * -0.13}s"></i>`).join('')}</div>`

// ── 1. the identity, shown (≤ 100 words on the computer, ≤ 70 on the phone) ──
const swatches = colours.filter((c) => c['Na abertura']).map((c) => `<li><i style="background:${esc(c.Valor.replace(/`/g, '').split(' · ')[0].trim())}"></i><span>${esc(c['Na abertura'])}</span></li>`).join('')
const opening = `
<section class="open" id="identidade" aria-labelledby="open-h">
  <h1 id="open-h" class="sr">Design system do Album Blender</h1>
  <img class="wordmark" src="${WORDMARK}" alt="The Album Blender">
  <ul class="sw" aria-label="As cores">${swatches}</ul>
  <div class="idrow">
    <p class="type"><span class="type__syne">Aa</span><span class="type__sys">Aa</span><small>Syne nos títulos · texto do sistema</small></p>
    <p class="fire"><button type="button" class="home-btn is-flame is-big" tabindex="-1">Create series</button><small>o fogo: um por tela</small></p>
  </div>
  <div class="eqrow">${eqBars(48)}<small>o equalizador: mexendo é esperando</small></div>
</section>`

// ── 2. colours ──
const colourCards = colours.map((c) => {
  const v = c.Valor.replace(/`/g, '').split(' · ')[0].trim()
  return `<li class="tok"><i style="background:${esc(v)}"></i><b>${esc(c.Nome)}</b><span>${plain(c['Para quê'])}</span><code>${esc(c.Valor.replace(/`/g, ''))}</code></li>`
}).join('')
const contrastRows = contrast.map((r) => {
  const col = r.a < 1 ? `rgba(255,255,255,${r.a})` : r.c
  return `<tr><td><span class="aa" style="color:${col};background:#000">Aa</span><span class="aa" style="color:${col};background:#101014">Aa</span> ${esc(r.name)}</td><td class="n">${br(r.onBlack)}:1</td><td class="n">${br(r.onPanel)}:1</td><td>${r.agrees ? 'igual ao documento' : `<b class="warn">o documento diz ${r.said ? `${r.said[0]} e ${r.said[1]}` : '—'}</b>`}</td></tr>`
}).join('')
const fireRows = onFire.map((f) => `<tr><td><span class="aa" style="color:#fff;background:${f.bg}">Aa</span><span class="aa" style="color:#0b0b0b;background:${f.bg}">Aa</span> ${f.bg === '#f97316' ? 'ponta laranja do fogo' : 'ponta vermelha do fogo'}</td><td class="n">branco ${br(f.white)}:1</td><td class="n">preto ${br(f.black)}:1</td><td>${f.white < 3 ? 'branco só passa como texto grande' : 'os dois passam como texto grande'}</td></tr>`).join('')
const colourSection = section('cores', 'Cores', 'Um tema só, escuro. O laranja é a ação; o vermelho, a outra ponta do fogo e o perigo.', `
  <ul class="toks">${colourCards}</ul>
  <h3 class="h3">Contraste, medido aqui</h3>
  <div class="scroll"><table class="ct"><thead><tr><th>Texto (sobre o preto e o painel)</th><th>No preto</th><th>No painel</th><th>Conferido</th></tr></thead><tbody>${contrastRows}</tbody></table></div>
  <div class="scroll"><table class="ct"><thead><tr><th>Texto sobre o fogo</th><th>Branco</th><th>Preto</th><th></th></tr></thead><tbody>${fireRows}</tbody></table></div>
  ${details('onde cada cor está no código', colours, ['Nome', 'Valor', 'Onde no código', 'Estado'])}`)

// ── 3. type ──
const typeSection = section('tipo', 'Tipo', plain(families.find((f) => f['Família'] === 'Tipo')?.['Uma linha'] || ''), `
  <div class="scale">${type.map((t) => `<p><span style="font-family:${t['Família'].startsWith('Syne') ? "'Syne',sans-serif" : "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"};font-size:${parseInt(t.Tamanho, 10)}px;font-weight:${parseInt(t.Peso, 10)}">${esc(t.Papel)}</span><small>${esc(t.Tamanho)} · ${esc(t.Peso)}</small></p>`).join('')}</div>
  ${finding('No computador, a dica sob o campo da Home (<code>.home-hint</code>) sai em Syne, herdada da página; o documento diz «texto do sistema». É a mesma escolha da pergunta «Fonte do texto corrido», em <a href="#aprovar">Para aprovar</a>.')}
  ${details('tamanhos, pesos e onde', type, ['Papel', 'Família', 'Tamanho', 'Peso', 'Onde'])}`)

// ── 4. space and shape ──
const px = (v) => (String(v).match(/(\d+)\s*px/) || [])[1]
const shapeCard = (m) => {
  const v = m.Valor.replace(/`/g, '')
  let demo = ''
  if (/^canto|^ficha/.test(m.Medida)) demo = `<i class="demo" style="border-radius:${/redonda/.test(v) ? '999px' : `${px(v) || 12}px`}"></i>`
  else if (/^sombra|^brilho/.test(m.Medida)) demo = `<i class="demo" style="box-shadow:${esc(v.split(' · ')[0])};background:#1c1c22"></i>`
  else if (/^alvo/.test(m.Medida)) demo = '<i class="demo" style="width:44px;height:44px;border-radius:4px;outline:1px dashed rgba(255,255,255,.4)"></i>'
  else if (/^botão principal/.test(m.Medida)) demo = '<i class="demo" style="height:48px;width:96px;border-radius:12px;background:var(--fire)"></i>'
  else if (/^margem|^entre/.test(m.Medida)) demo = `<i class="demo demo--gap" style="--g:${px(v) || 8}px"><b></b><b></b></i>`
  else if (/^vidro/.test(m.Medida)) demo = '<i class="demo demo--glass"></i>'
  return `<li class="shape">${demo}<b>${esc(m.Medida)}</b><span>${plain(m.Valor)}</span></li>`
}
const shapeSection = section('forma', 'Espaço e forma', 'Alvos de 44 px, cantos de 12 px nos botões, 16 px de margem no celular.', `
  <ul class="shapes">${measures.filter((m) => !/^movimento|^barras/.test(m.Medida)).map(shapeCard).join('')}</ul>
  ${finding('O documento diz que a base da série da Home é vidro sobre <code>rgba(8, 8, 10, 0.78)</code>; no CSS ela é <code>rgba(12, 12, 15, 0.94)</code> (<code>.home-dock</code>). Os 0,78 são das barras do celular (<code>--phone-bar-bg</code>). Corrigido no documento, pendente de aprovação.')}
  ${details('todas as medidas e onde', measures, ['Medida', 'Valor', 'Onde'])}`)

// ── 5. motion ──
const eqLabelled = `<div class="home-page" style="padding:10px 28px 18px">${['still', 'live', 'flat'].map((st, i) => `<div style="display:grid;grid-template-columns:150px 1fr;align-items:end;gap:16px;margin-bottom:14px"><span style="font:700 15px 'Syne',sans-serif;color:#fff">${['pronto', 'esperando', 'não respondeu'][i]}</span><div class="home-stage is-small" style="padding:0">${live['Fogo e equalizador'].desktop.match(new RegExp(`<div class="home-eq is-${st}"[\\s\\S]*?<\\/div>`))[0]}</div></div>`).join('')}</div>`
const motionSection = section('movimento', 'Movimento', 'O fogo e o equalizador são da casa. O movimento quer dizer espera e para sozinho.', `
  <div class="pair pair--wide">${frame('app', eqLabelled, 960, 200, 'O equalizador da Home, nos três estados')}</div>
  <div class="pair pair--wide">${frame('splash', '{{SPLASH}}', 1280, 150, 'O fio da página de entrada: um grupo de barras por parte')}</div>
  <div class="pair pair--wide">${protoFrame('O fogo vivo e as vinhetas da home nova (protótipo, pendente)', { at: '#albums', w: 1280, h: 640 })}</div>
  <ul class="rules">
    <li><b>Para sozinho.</b> Fogo e equalizador param 10 s depois da última rolagem.</li>
    <li><b>Pode pausar.</b> Um botão de pausa, de 44 px, onde há movimento.</li>
    <li><b>Menos movimento.</b> Com a preferência do sistema, nada se mexe; as barras ficam paradas.</li>
  </ul>
  <p><button type="button" class="calm" id="calm" aria-pressed="false">Ver com menos movimento</button></p>
  ${details('fogo e equalizador, onde e como', [...fire.map((f) => ({ Peça: f.Onde, Como: f.Como, Estado: f.Estado })), ...eqs.map((e) => ({ Peça: `equalizador · ${e.Onde}`, Como: `${e.Barras}; ${e.Cores}; ${e.Estados}`, Estado: e.Estado }))], ['Peça', 'Como', 'Estado'])}`)

// ── 6. components ──
const famBlocks = families.filter((f) => live[f['Família']] && f['Família'] !== 'Fogo e equalizador').map((f) => {
  const name = f['Família']
  const rows = parts.filter((p) => p['Família'] === name)
  return `<article class="comp" id="c-${slug(name)}"><h3>${esc(name)}</h3><p class="line">${plain(f['Uma linha'])}</p>${pair(live[name])}${rows.length ? details(`as peças de ${name.toLowerCase()}`, rows, ['Peça', 'Como é', 'Classes', 'Arquivo', 'Estado']) : ''}</article>`
})
const extraBlocks = live.extras.map((x) => `<article class="comp" id="c-${slug(x.name)}"><h3>${esc(x.name)}</h3><p class="line">${esc(x.line)}</p>${pair(x.spec)}${finding(`O site usa esta peça (${cell(x.file)}), mas a tabela de componentes do documento não a lista.`)}</article>`)
const barMenu = `<article class="comp" id="c-barra-menu"><h3>A barra que é o menu</h3><p class="line">Na home nova, o equalizador é o menu: cinco partes, uma por item. Protótipo, pendente de aprovação.</p>
  <div class="pair pair--wide">${protoFrame('Computador · sem conta', { w: 1280, h: 140 })}</div></article>`
const compNav = [...families.filter((f) => live[f['Família']] && f['Família'] !== 'Fogo e equalizador').map((f) => f['Família']), ...live.extras.map((x) => x.name), 'A barra que é o menu']
const compSection = section('componentes', 'Componentes', 'Cada peça desenhada com o CSS do site, no computador e a 390 px.', `
  <nav class="chips" aria-label="Peças">${compNav.map((n) => `<a href="#c-${slug(n)}">${esc(n)}</a>`).join('')}</nav>
  ${famBlocks.join('')}${extraBlocks.join('')}${barMenu}`)

// ── 7. copy ──
const meter = (n, target, ceiling) => {
  const top = Math.max(ceiling + 2, n)
  return `<span class="meter" role="img" aria-label="${n} de ${ceiling}">${Array.from({ length: Math.min(top, 60) }, (_, i) => `<i class="${i < n ? (i < target ? 'ok' : i < ceiling ? 'mid' : 'over') : ''}${i === ceiling - 1 ? ' cap' : ''}"></i>`).join('')}</span>`
}
const rulerRows = ruler.map((r) => {
  const g = r.good.count ?? words$(r.good.text), b = r.bad.count ?? words$(r.bad.text)
  const scale = r.ceiling > 40 ? 10 : 1 // the first screen in tens of words
  return `<article class="rule">
    <h3>${esc(r.kind)} <small>alvo ${r.target} · teto ${r.ceiling} ${esc(r.unit)}${r.phone ? ` · ${esc(r.phone)}` : ''}</small></h3>
    <p class="ex ex--good"><span class="ex__tag">Bom · ${g}</span>${meter(Math.round(g / scale), Math.round(r.target / scale), Math.round(r.ceiling / scale))}<q>${esc(r.good.text)}</q><small>${esc(r.good.where)}</small></p>
    <p class="ex ex--bad"><span class="ex__tag">Ruim · ${b}</span>${meter(Math.round(b / scale), Math.round(r.target / scale), Math.round(r.ceiling / scale))}<q>${esc(r.bad.text)}</q><small>${esc(r.bad.where)}</small></p>
  </article>`
}).join('')
const copySection = section('texto', 'Texto', `A voz, as palavras decididas e a régua do tamanho. A lista inteira dos textos está na <a href="${COPY_REVIEW_URL}" target="_blank" rel="noopener">página de revisão dos textos</a>.`, `
  <ul class="rules">${voice.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>
  <h3 class="h3">Palavras decididas</h3>
  <div class="scroll"><table class="words"><thead><tr><th>Diga</th><th>Em vez de</th><th>Nas palavras dele, 21/11</th></tr></thead><tbody>${words.map((w) => `<tr><td><b>${esc(w.say)}</b></td><td><s>${esc(w.not)}</s></td><td>«${esc(w.his)}»</td></tr>`).join('')}</tbody></table></div>
  <h3 class="h3">A régua</h3>
  <p class="note">Cada barra é uma palavra (na primeira tela, dez): laranja até o alvo, vermelho até o teto, apagado além dele. ${esc(rulerSource)}</p>
  <div class="rulers">${rulerRows}</div>`)

// ── 8. what waits for his word ──
const PROTO_SAMPLE = {
  'Barra-menu (o fio que é o menu)': { w: 1280, h: 140, ph: 200 },
  'Onde a barra-menu mora': { w: 390, h: 760 },
  'Topo com conta': { w: 1280, h: 140, state: 'in', ph: 200 },
  'Virada como faixa curta (v2)': { at: '#flip', w: 1280, h: 380, ph: 420 },
  'Cartão do ranking com disco real (v2)': { at: '#albums', w: 1280, h: 640, ph: 640 },
  'Pausar o movimento como ícone': { w: 1280, h: 520, ph: 640 },
  'Vinheta da história (v4)': { at: '#playlists', w: 1280, h: 640, ph: 640 },
  'Vinheta: movimento ligado à rolagem (v4)': { at: '#blend', w: 390, h: 760 },
  'Ritmo das histórias (v4)': { at: '#start', w: 1280, h: 900, ph: 760 },
  'Fogo em movimento': { w: 1280, h: 520, ph: 640 }
}
const SAME_AS = { 'Botão principal da página pública': 'texto-no-fogo', 'Fonte do texto corrido no computador': 'fonte-do-corpo', 'Equalizador': 'ponta-amarela' }
const coversSample = (caption) => `<div class="covers">${[0, 1, 2].map((i) => `<img src="${fictionalCover(i)}" alt="">`).join('')}${caption ? '<small>Fictional albums · original art</small>' : ''}</div>`
function sample(row) {
  const name = row['Padrão']
  if (PROTO_SAMPLE[name]) return protoFrame(PROTO_SAMPLE[name].w < 500 ? 'Celular · 390 (protótipo)' : 'Computador (protótipo)', PROTO_SAMPLE[name])
  const s = live.pendingSamples[name]
  if (s) return frame(s.css, s.html, s.w, s.h, s.w < 500 ? 'Celular · 390' : 'Computador')
  if (name === 'Capa fictícia') return coversSample(false)
  if (name === 'Aviso de capas fictícias') return coversSample(true)
  if (name === 'Os tokens da Home') return `<ul class="toks toks--mini">${homeTokens.filter((t) => !/font|-h$/.test(t.k)).map((t) => `<li class="tok"><i style="background:${esc(t.v.replace(/var\(--home-flame-a\)/g, '#f97316').replace(/var\(--home-flame-b\)/g, '#dc2626'))}"></i><code>${esc(t.k)}</code></li>`).join('')}</ul>`
  return '<p class="note">Sem amostra viva.</p>'
}
const qId = (k) => `q-${k}`
const questions = pending.map((p) => {
  const v = live.variants[p.Mostra]
  const opts = v.options
    ? `<div class="pair pair--ask">${v.options.map((o) => frame(o.css, o.html, o.w, o.h, o.label)).join('')}</div>`
    : `<div class="pair pair--ask">${v.inline.map((o) => `<figure class="frame"><figcaption>${esc(o.label)}</figcaption><p class="body1" style="font-family:${o.font}">${esc(v.para)}</p></figure>`).join('')}</div>`
  return `<article class="ask" id="${qId(p.Mostra)}"><h3>${esc(p['Padrão'])}</h3><p class="q">${plain(p.Pergunta)}</p><p class="rec">${esc(v.rec)}</p>${opts}
    <details class="det"><summary>como está hoje no código</summary><p>${cell(p['Hoje no código'])}</p></details></article>`
}).join('')
// a decision the disagreements turned up (critique 2 of 2026-11-21, finding 6): it waits here, with a recommendation
const threadAsk = `<article class="ask" id="q-fio"><h3>Espessura das barras do fio</h3><p class="q">O fio da página de entrada: as barras vão de 2 ou de 3 px a 7 px? O documento diz as duas coisas.</p><p class="rec">Recomendo corrigir o documento para 2 a 7 px, como o CSS já faz. Não custa nada no site.</p></article>`
let pendingCount = pending.length + 1
const groups = pendingGroups.map((g) => {
  const cards = g.rows.map((r) => {
    pendingCount++
    const same = SAME_AS[r['Padrão']]
    const how = r['Como é'] || r['Como é (v2)'] || ''
    const change = r['Muda o quê'] || r['Reusa / novo'] || ''
    const wide = PROTO_SAMPLE[r['Padrão']]?.w > 500 || live.pendingSamples[r['Padrão']]?.w > 500
    return `<article class="pend${wide ? ' pend--wide' : ''}"><h4>${esc(r['Padrão'])}</h4>${same ? `<p class="note">A mesma decisão de <a href="#${qId(same)}">${esc(pending.find((p) => p.Mostra === same)['Padrão'])}</a>, acima.</p>` : sample(r)}
      <p class="chg">${plain(change)}</p>
      <details class="det"><summary>como é e por quê</summary><p>${cell(how)}</p><p>${cell(r['Por quê'] || '')}</p></details></article>`
  }).join('')
  return `<h3 class="h3">${esc(g.label)} <small>${g.rows.length}</small></h3><div class="pends">${cards}</div>`
}).join('')
const pendingSection = section('aprovar', 'Para aprovar', 'O que o site usa ou propõe e ainda espera a sua palavra. Primeiro as perguntas; depois cada linha, com a amostra.', `${questions}${threadAsk}${groups}`)

// ── 9. the disagreements and the code ──
const codeSection = section('desencontros', 'Desencontros', 'Onde o documento e o CSS não batem, e o que o levantamento achou fora do lugar. Nada foi mudado no código.', `
  <ul class="rules">
    <li>O texto corrido da Home: o documento dizia 16/22 px; o CSS tem 16 px com linha de 24 no computador e 15 px com linha de 22 no celular (<code>.home-hero p</code>). <i>Corrigido no documento, pendente.</i></li>
    <li>O contraste no painel: o documento dizia 18,6, 9,6 e 7,5 para o branco e os dois brancos apagados; medido aqui, 19,0, 10,0 e 8,1. <i>Corrigido no documento, pendente.</i></li>
    <li>O texto preto no fogo: uma linha do documento dizia 7,5 e 4,35; medido, 7,0 e 4,1, como a outra linha já dizia. <i>Corrigido no documento, pendente.</i></li>
    <li>A base da série da Home: vidro de 0,94, não de 0,78. <i>Corrigido no documento, pendente.</i></li>
    <li>O fio da página de entrada: uma linha diz barras de 3 a 7 px, outra de 2 a 7; o CSS tem 2 a 7 (<code>.thread .g i</code>). A linha é de um protótipo aprovado, então não foi mexida: a pergunta está em <a href="#q-fio">Para aprovar</a>, com a recomendação.</li>
    <li>A dica da Home em Syne no computador; o documento diz texto do sistema. Fica para a pergunta da fonte.</li>
    <li>Cores no CSS que o documento não lista: o cinza <code>#d4d4d8</code> das fichas (<code>.home-chip</code>), o cinza azulado <code>#1f2937</code> do cartão de álbum no computador (<code>bg-gray-800</code>) e o rosa <code>#fecaca</code> do aviso «Try again» das séries.</li>
    <li>Peças que o site usa e a tabela de componentes não lista: os avisos com «Try again», os estados vazios, o cartão de álbum no computador e a linha de faixa.</li>
  </ul>
  ${details('cores e regras repetidas no código', conflicts, Object.keys(conflicts[0]))}
  ${details('declarado e sem uso', unused, Object.keys(unused[0]))}
  ${details('defeitos do CSS', defects, Object.keys(defects[0]))}`)

const nav = [['cores', 'Cores'], ['tipo', 'Tipo'], ['forma', 'Espaço e forma'], ['movimento', 'Movimento'], ['componentes', 'Componentes'], ['texto', 'Texto'], ['desencontros', 'Desencontros']]
  .map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')
const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })

const page = fs.readFileSync(path.join(HERE, 'design-system.template.html'), 'utf8')
  .replace('/*HOME_CSS*/', inline('public/css/views/home.css'))
  .replace('<!--LOGO-->', LOGO)
  .replace('<!--NAV-->', nav)
  .replace('<!--APPROVE-->', `Para aprovar <b>${pendingCount}</b>`)
  .replace('<!--BODY-->', [opening, colourSection, typeSection, shapeSection, motionSection, compSection, copySection, pendingSection, codeSection].join('\n'))
  .replace('<!--FOOT-->', `Rascunho, gerado do documento do design system em ${today}. Os valores vêm dele e do CSS do site; nada aqui é aprovação.`)
  .replace('<!--TEMPLATES-->', templates.join('\n'))
  .replace('/*CSS_APP*/null', JSON.stringify(appCss()).replace(/<\//g, '<\\/'))
  .replace('/*CSS_SPLASH*/null', JSON.stringify(splashCss()).replace(/<\//g, '<\\/'))
  .replace('/*PROTO*/null', JSON.stringify(read(PROTO)).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--'))
fs.writeFileSync(OUT, page)
const disagree = contrast.filter((c) => !c.agrees).length
console.log(`${path.relative(ROOT, OUT)}: ${(page.length / 1024).toFixed(0)} KB, ${frameN} frames, ${pendingCount} lines to approve, ${disagree} contrast values differing from the document`)
