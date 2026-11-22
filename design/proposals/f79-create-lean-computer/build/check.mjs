// F79 · Create on the computer. Reused from design/proposals/f79-start-lean/build/check.mjs, at 1280 x 800 and 1440 x 900.
// The checks of the proposal, on the same frames the comparator shows ($F79C_RAW/frames/*.html, file://):
// the words of the first screen (the ruler's way: reports/research/2026-11-21-copy-volume-ruler.md § 6), the title's
// size and lines, every tap target under 44 px, and a screenshot of each first screen. Writes ../caps/counts.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { open, sleep } from './cdp.mjs'
const here = path.dirname(fileURLToPath(import.meta.url))
const CAPS = path.join(here, '..', 'caps')
const RAW = process.env.F79C_RAW || path.join(here, '..', 'raw')
fs.mkdirSync(path.join(RAW, 'shots'), { recursive: true })
const p = await open()

const MEASURE = `(() => {
  const H = innerHeight, words = (s) => (s.match(/\\S+/g) || []).filter((w) => /[\\p{L}\\p{N}]/u.test(w)).length
  const menu = (el) => el.closest('header, .phone-tabbar, .bottom-menu, .top-menu, nav')
  let total = 0, inMenus = 0, catalog = 0; const seen = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const t = walker.currentNode, el = t.parentElement, text = t.textContent.trim()
    if (!text || !el || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue
    if (el.closest('[aria-hidden="true"], .sr-only, script, style, #toast-container')) continue
    const r = document.createRange(); r.selectNodeContents(t)
    const rects = [...r.getClientRects()].filter((b) => b.width > 0 && b.bottom > 0 && b.top < H)
    if (!rects.length) continue
    const n = words(text)
    if (el.closest('.home-card, #homeArtistName, .home-dcv')) { catalog += n; continue }
    if (menu(el)) inMenus += n; else seen.push(text)
    total += n
  }
  const ph = document.querySelector('#artistScanInput')
  const placeholder = ph && ph.checkVisibility() && !ph.value ? words(ph.placeholder) : 0
  const h1 = document.querySelector('#homeHero h1'), h1v = h1 && h1.checkVisibility()
  const lines = (el) => { if (!el) return 0; const r = document.createRange(); r.selectNodeContents(el); const tops = new Set([...r.getClientRects()].map((b) => Math.round(b.top))); return tops.size }
  const small = [...document.querySelectorAll('button, a, input, select, [role="button"]')].filter((e) => e.checkVisibility() && !e.closest('[aria-hidden="true"]')).map((e) => { const b = e.getBoundingClientRect(); return { e, b } })
    .filter(({ b }) => b.top < H && b.bottom > 0 && (b.height < 44 || b.width < 44)).map(({ e, b }) => (e.id || e.className.toString().slice(0, 30) || e.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' «' + (e.textContent || e.placeholder || '').trim().slice(0, 24) + '»')
  return { words: total, menus: inMenus, product: total - inMenus, catalog, placeholder, texts: seen,
    title: h1v ? { size: getComputedStyle(h1).fontSize, lines: lines(h1), overflow: h1.scrollWidth > h1.clientWidth + 1 } : null,
    fieldTop: Math.round(document.querySelector('#homeField')?.getBoundingClientRect().top || -1), small,
    hscroll: document.documentElement.scrollWidth > innerWidth }
})()`

const out = { today: {}, lean: {}, steps: {} }
const detail = {}
for (const option of ['today', 'lean', 'steps']) {
  for (const who of ['in', 'out']) {
    for (const [w, h] of [[1280, 800], [1440, 900]]) {
      await p.size(w, h, false)
      await p.go('file://' + path.join(RAW, 'frames', `${option}-${who}-empty.html`), 1800)
      const m = await p.run(MEASURE)
      out[option][`${who}-${w}`] = { words: m.product, menus: m.menus, placeholder: m.placeholder }
      detail[`${option}-${who}-${w}`] = m
      await p.shot(path.join(RAW, 'shots', `first-${option}-${who}-${w}.png`))
    }
  }
}
// the other states: the targets and the sideways scroll, at both sizes
const states = ['typing', 'searching', 'results', 'chosen', 'paste', 'failed', 'notfound', 'what']
const statesCheck = {}
for (const option of ['today', 'lean', 'steps']) {
  for (const st of states) {
    for (const [w, h] of [[1280, 800], [1440, 900]]) {
      await p.size(w, h, false)
      await p.go('file://' + path.join(RAW, 'frames', `${option}-out-${st}.html`), 1500)
      const m = await p.run(MEASURE)
      statesCheck[`${option}-out-${st}-${w}`] = { words: m.product, small: m.small, hscroll: m.hscroll }
      if (w === 1440) await p.shot(path.join(RAW, 'shots', `state-${option}-out-${st}.png`))
    }
  }
}
out.notes = 'Contadas como na régua: o texto cuja linha aparece ao abrir a tela, no topo; fora o que é só para leitor de tela.'
fs.writeFileSync(path.join(CAPS, 'counts.json'), JSON.stringify(out, null, 1))
fs.writeFileSync(path.join(RAW, 'checks.json'), JSON.stringify({ firstScreen: detail, states: statesCheck, errors: p.errors }, null, 1))
console.log(JSON.stringify(out, null, 1))
for (const [k, m] of Object.entries(detail)) console.log(k, m.title, 'field@', m.fieldTop, 'small:', m.small.length, m.hscroll ? 'HSCROLL' : '')
console.log('errors', p.errors)
p.close()
