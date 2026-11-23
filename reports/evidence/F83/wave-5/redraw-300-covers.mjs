// F83 wave 5 (TASK-22), the redraw time of the albums screen with 300 covers, measured on the screen AS IT IS TODAY (hand-made),
// so the React screen has a number to stay under (the ceiling is 1.2 times this; proposal § 11).
//
//   node reports/evidence/F83/wave-5/redraw-300-covers.mjs <dev server base, e.g. http://localhost:5191> [label]
//
// What is measured: the albums are put in the stores (25 series of 12 albums, or one series of 300, all «found»; the album load itself is silenced, so nothing is asked
// of any catalog), and the time from the store telling (the one microtask that redraws the screen) to the layout being done is read with
// performance.now(), on 1280 (computer) and 393 (phone), in the grid view and in the list view, 7 draws each; the first is thrown away
// (the page warms up) and the median of the other six is reported. Firebase Auth and Firestore are blocked (identitytoolkit, securetoken,
// firestore.googleapis, firebaseinstallations): the page is a visitor, nothing is made in production. Result: raw/redraw-300-covers-<label>.json
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const [base, label = 'old'] = process.argv.slice(2)
const OUT = path.dirname(new URL(import.meta.url).pathname)
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const browser = await chromium.launch()
const results = {}

const PAGE_JOB = `(async ({ per, count, mode }) => {
  const series = Array.from({ length: count }, (_, i) => ({ id: 's' + i, name: 'Series ' + i, createdAt: new Date(2026, 0, i + 1), albumQueries: Array.from({ length: per }, (_, j) => ({ artist: 'Artist ' + i, title: 'Album ' + i + '-' + j })) }))
  window.albumLoadService.load = () => {}
  window.albumLoadService.refreshSource = () => {}
  window.albumSeriesStore.setSeries(series)
  window.albumLoadStore.setSeriesOrder(series.map(s => s.id))
  series.forEach(s => window.albumLoadStore.setSeriesEntries(s.id, s.albumQueries.map((q, j) => {
    const key = (q.artist + ' - ' + q.title).toLowerCase()
    return { key, seriesId: s.id, query: q, status: 'found', error: null, enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'done' },
      album: { id: s.id + '-' + j, title: q.title, artist: q.artist, year: 1970 + (j % 40), releaseDate: (1970 + (j % 40)) + '-01-01', type: 'Album', coverUrl: 'https://is1-ssl.mzstatic.com/image/' + s.id + '-' + j + '.jpg', tracks: [] } }
  })))
  window.albumLoadStore.flush()
  if (mode.single) { window.router.navigate('/albums/s0'); await new Promise(r => setTimeout(r, 1200)); window.albumLoadStore.setSeriesOrder(series.map(s => s.id)); window.albumLoadStore.flush() }
  await new Promise(r => setTimeout(r, 400))
  const times = []
  for (let n = 0; n < 7; n++) {
    const t0 = performance.now()
    window.albumLoadStore._changed(); window.albumLoadStore.flush()
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    document.body.offsetHeight
    times.push(performance.now() - t0)
    await new Promise(r => setTimeout(r, 120))
  }
  return { covers: document.querySelectorAll('#series-grid-inner img').length, cards: document.querySelectorAll('#series-grid-inner [data-action="view-modal"]').length, times }
})`

// 300 covers two ways: 25 series of 12 albums (the all-series screen draws the first 12 of each) and one series of 300 albums (the one-series screen)
const SHAPES = { 'all-25x12': { per: 12, count: 25, single: false }, 'one-300': { per: 300, count: 1, single: true } }
for (const [width, phone] of [[1280, false], [393, true]]) {
  for (const [shape, geometry] of Object.entries(SHAPES)) {
    for (const mode of ['grid', 'list']) {
        const context = await browser.newContext({ viewport: { width, height: phone ? 852 : 900 }, hasTouch: phone, isMobile: phone })
        const page = await context.newPage()
        await page.route(BLOCKED, (route) => route.abort())
        await page.route(/mzstatic\.com/, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#456"/></svg>' }))
        await page.addInitScript((m) => { try { localStorage.setItem('albumsViewMode', m === 'grid' ? 'compact' : 'expanded'); localStorage.setItem('albumsPageSize', '50') } catch (e) { /* none */ } }, mode)
        await page.goto(base + '/albums', { waitUntil: 'load' })
        await page.waitForFunction(() => window.albumLoadService && window.albumLoadStore && window.albumSeriesStore && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
        await page.waitForTimeout(1500)
        const run = await page.evaluate(`${PAGE_JOB}({ per: ${geometry.per}, count: ${geometry.count}, mode: ${JSON.stringify({ single: geometry.single })} })`)
        const sorted = run.times.slice(1).sort((a, b) => a - b)
        const median = (sorted[2] + sorted[3]) / 2
        results[`${width}-${shape}-${mode}`] = { covers: run.covers, cards: run.cards, medianMs: Math.round(median * 10) / 10, allMs: run.times.map(t => Math.round(t * 10) / 10) }
        console.log(`${width} ${shape} ${mode}: ${run.cards} cards, ${run.covers} covers, median redraw ${median.toFixed(1)} ms  [${run.times.map(t => t.toFixed(0)).join(', ')}]`)
        await context.close()
    }
  }
}
fs.writeFileSync(path.join(OUT, 'raw', `redraw-300-covers-${label}.json`), JSON.stringify(results, null, 2))
await browser.close()
