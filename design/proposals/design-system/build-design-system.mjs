#!/usr/bin/env node
/**
 * F86 — builds the page of the site's design system from docs/specs/design-system.md.
 *
 *   node design/proposals/design-system/build-design-system.mjs
 *
 * Reads   docs/specs/design-system.md       (the source: colours, type, measures, components, pending
 *                                            questions, conflicts — the page never carries a value the
 *                                            document does not have)
 *         the site's own CSS                (Tailwind built from tailwind.config.js and public/css/tailwind.css,
 *                                            then the files in the order the site loads them; the entry
 *                                            page's own <style> from public/splash.html)
 *         specimens.mjs                     (the live pieces, drawn by the site's code where it can be called)
 * Writes  design-system.html                (generated: never edit; published as a private Claude Artifact)
 *
 * Every piece is shown in an iframe at a computer width (960 px) and at 390 px, so the site's media
 * queries decide what each width looks like, exactly as on the site.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { specimens } from './specimens.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../..')
const DOC = path.join(ROOT, 'docs/specs/design-system.md')
const OUT = path.join(HERE, 'design-system.html')
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
/** The logo, made small for the page (sips on the Mac; the full file if it is not there). */
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
/** A cell of the document as HTML: `code` and **bold** kept, the rest as text. */
const cell = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
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
const status = (md.match(/^\*\*Status: ([^*]+)\*\*/m) || [])[1] || 'Draft'
const colours = table('### Cores')
const type = table('### Tipo')
const measures = table('### Medidas')
const families = table('### Famílias')
const parts = table('## Componentes')
const pending = table('## Pendentes')
const conflicts = table('## Conflitos no código')
const unused = table('## Declarado e não usado')
const defects = table('## Defeitos do CSS')
let commit = ''
try { commit = execFileSync('git', ['log', '-1', '--format=%h', '--', 'docs/specs/design-system.md'], { cwd: ROOT, encoding: 'utf8' }).trim() } catch { /* no git */ }

/** A colour value of the document as CSS (the cell may hold `#hex` or a `linear-gradient(...)`). */
const cssValue = (v) => v.replace(/`/g, '').split(' · ')[0].trim()

// ── the page ──────────────────────────────────────────────────────────────────────────────────────
const live = await specimens(ROOT)
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const LOGO = smallPng('public/assets/images/logo.png', 96)
const WORDMARK = dataUri('public/splash/wordmark.jpg', 'image/jpeg')

/** The entry page's pieces, from its own markup: the top bar, the progress thread, the first screen. */
function splashMarkup() {
  const page = read('public/splash.html')
  const top = page.match(/<header class="top">[\s\S]*?<\/header>/)[0].replace('/splash/wordmark.jpg', WORDMARK)
  const heights = ['.55', '1', '.7', '.4', '.8']
  const bars = heights.map((h) => `<i style="--h:${Number(h) * 100}%"></i>`).join('')
  const thread = page.match(/<nav class="thread"[\s\S]*?<\/nav>\s*<\/div>\s*<\/nav>|<nav class="thread"[\s\S]*?<\/div><\/nav>/)[0]
    .replace(/<a class="g" ([^>]*)><\/a>/g, (m, attrs, i) => `<a class="g" ${attrs}>${bars}</a>`)
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
  return `<figure class="frame" style="--w:${w};--h:${h}"><figcaption>${label}</figcaption><div class="frame__box"><iframe title="${esc(label)}" data-tpl="${id}" data-css="${css}" width="${w}" height="${h}" loading="lazy"></iframe></div></figure>`
}
function pair(spec) {
  const out = []
  if (spec.desktop) out.push(frame(spec.css, spec.desktop, 960, spec.dh || 240, 'Computador'))
  if (spec.phone) out.push(frame(spec.css, spec.phone, 390, spec.ph || 420, 'Celular · 390'))
  return `<div class="pair${spec.desktop ? '' : ' pair--phone'}">${out.join('')}</div>`
}
const details = (rows, cols) => `<details class="det"><summary>detalhes</summary><div class="scroll"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${cell(r[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`

// the opening: the identity, shown
const swatches = colours.filter((c) => c['Na abertura']).map((c) => {
  const v = cssValue(c.Valor)
  return `<li><i style="background:${esc(v)}"></i><span>${esc(c['Na abertura'])}</span></li>`
}).join('')
const opening = `
<section class="open" id="identidade" aria-label="A identidade">
  <img class="wordmark" src="${WORDMARK}" alt="The Album Blender">
  <ul class="sw">${swatches}</ul>
  <div class="idrow">
    <p class="type"><span class="type__syne">Aa</span><span class="type__sys">Aa</span><small>Syne · texto do sistema</small></p>
    <p class="fire"><button type="button" class="home-btn is-flame is-big" tabindex="-1">Create series</button><small>o fogo</small></p>
  </div>
  <div class="eqrow">${live['Fogo e equalizador'] ? '' : ''}<div class="home-eq is-live" aria-hidden="true">${Array.from({ length: 48 }, (_, i) => `<i style="--h:${(0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)};--d:${(i % 7) * -0.13}s"></i>`).join('')}</div><small>o equalizador</small></div>
  ${details(colours, ['Nome', 'Valor', 'Para quê', 'Onde no código', 'Estado'])}
</section>`

const typeSection = `
<section class="fam" id="tipo"><h2>Tipo</h2><p class="line">${cell(families.find((f) => f['Família'] === 'Tipo')?.['Uma linha'] || '')}</p>
  <div class="scale">${type.map((t) => `<p style="font-family:${t['Família'].includes('Syne') ? "'Syne',sans-serif" : '-apple-system,BlinkMacSystemFont,\'Segoe UI\',system-ui,sans-serif'};font-size:${parseInt(t.Tamanho, 10)}px;font-weight:${parseInt(t.Peso, 10)}">${esc(t.Papel)}</p>`).join('')}</div>
  ${details(type, ['Papel', 'Família', 'Tamanho', 'Peso', 'Onde'])}
  ${details(measures, ['Medida', 'Valor', 'Onde'])}
</section>`

const famSections = families.filter((f) => live[f['Família']]).map((f) => {
  const name = f['Família']
  const rows = parts.filter((p) => p['Família'] === name)
  return `<section class="fam" id="${slug(name)}"><h2>${esc(name)}</h2><p class="line">${cell(f['Uma linha'])}</p>${pair(live[name])}${rows.length ? details(rows, ['Peça', 'Como é', 'Classes', 'Arquivo', 'Estado']) : ''}</section>`
})

const variantsOf = (key) => live.variants?.[key] || []
const pendingSection = `
<section class="fam wait" id="espera-voce"><h2>Espera você</h2><p class="line">Padrões que o site já usa, decididos pelo agente; cada um com uma pergunta.</p>
  ${pending.map((p) => `<article class="ask"><h3>${esc(p['Padrão'])}</h3><p class="q">${cell(p.Pergunta)}</p>
    <div class="pair pair--ask">${variantsOf(p.Mostra).map((v) => frame(v.css, v.html, v.w || 420, v.h || 140, v.label)).join('')}</div>
    <details class="det"><summary>detalhes</summary><p>${cell(p['Hoje no código'])}</p></details></article>`).join('')}
</section>`

const codeSection = `
<section class="fam" id="no-codigo"><h2>No código</h2><p class="line">O que o levantamento achou fora do lugar.</p>
  ${details(conflicts, Object.keys(conflicts[0]))}
  ${details(unused, Object.keys(unused[0]))}
  ${details(defects, Object.keys(defects[0]))}
</section>`

const nav = [['identidade', 'Identidade'], ['tipo', 'Tipo'], ...families.filter((f) => live[f['Família']]).map((f) => [slug(f['Família']), f['Família']]), ['espera-voce', 'Espera você']]
  .map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')

const page = fs.readFileSync(path.join(HERE, 'design-system.template.html'), 'utf8')
  .replace('/*HOME_CSS*/', inline('public/css/views/home.css'))
  .replace('<!--LOGO-->', LOGO)
  .replace('<!--NAV-->', nav)
  .replace('<!--BODY-->', [opening, typeSection, ...famSections, pendingSection, codeSection].join('\n'))
  .replace('<!--FOOT-->', `Gerada de <code>docs/specs/design-system.md</code>${commit ? ` (commit ${commit})` : ''} · ${esc(status)}`)
  .replace('<!--TEMPLATES-->', templates.join('\n'))
  .replace('/*CSS_APP*/null', JSON.stringify(appCss()).replace(/<\//g, '<\\/'))
  .replace('/*CSS_SPLASH*/null', JSON.stringify(splashCss()).replace(/<\//g, '<\\/'))
fs.writeFileSync(OUT, page)
console.log(`${path.relative(ROOT, OUT)}: ${(page.length / 1024).toFixed(0)} KB, ${frameN} frames, ${families.length} families, ${pending.length} pending`)
