// F90 evidence: exporting from the saved playlists screen, on the BUILT site.
//   PLAYWRIGHT_MODULE=/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs \
//     node reports/evidence/F90/export-from-saved-playlists/shoot.mjs        (from the project root; writes next to this file)
// Playwright 1.56.1 from the MJRPpersonal checkout (the one the earlier agents used: WebKit 2215 and Chromium are in the machine's cache).
// Builds the site into a temp folder, serves it on 127.0.0.1, aborts every request to Firebase Auth / Firestore / installations
// (hosts matching identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations), Apple and Spotify. No sign-in, nothing
// is read from or written to any database: the saved playlists come from a stand-in source put on the app's own reader (found among
// the built modules), and no export is ever started (the window is only opened and read).
// Shoots: WebKit with the iPhone 14 profile, and Chromium at 1280. Crops only.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const { webkit, chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = path.dirname(new URL(import.meta.url).pathname)
// F90_DIST=<folder of an earlier build> skips the build (only for running the script again while it is being written)
const dist = process.env.F90_DIST || fs.mkdtempSync(path.join(os.tmpdir(), 'f90-export-'))
if (!process.env.F90_DIST) execFileSync('npx', ['vite', 'build', '--outDir', dist, '--emptyOutDir'], { stdio: 'ignore' })
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0])
    let f = path.join(dist, u)
    if (u === '/home') f = path.join(dist, 'index.html')
    else if (u.startsWith('/api/')) { r.writeHead(500); return r.end('{}') }
    else if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, path.extname(u) ? u : 'app.html')
    if (!fs.existsSync(f)) { r.writeHead(404); return r.end() }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(r)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const site = `http://127.0.0.1:${server.address().port}`

const track = (title, i) => ({ title, artist: 'Pink Floyd', album: 'The Dark Side of the Moon', duration: 200 + i * 7 })
const playlist = (id, name, batchName, savedAt, count, order) => ({
    id, name, batchName, savedAt, order, tracks: Array.from({ length: count }, (_, i) => track(`${name} song ${i + 1}`, i))
})
const SERIES = [{ id: 's1', name: 'Pink Floyd Essentials', updatedAt: '2026-11-20T12:00:00Z', albums: [] }]
const PLAYLISTS = {
    s1: [
        playlist('a1', 'Side One', 'Road trip mix', '2026-11-20T12:00:00Z', 9, 0),
        playlist('a2', 'Side Two', 'Road trip mix', '2026-11-20T12:00:00Z', 8, 1),
        playlist('a3', 'Deep Cuts', 'Road trip mix', '2026-11-20T12:00:00Z', 7, 2),
        playlist('b1', 'Morning', 'Slow Sunday', '2026-11-18T12:00:00Z', 6, 0)
    ]
}

// Put the stand-in source on the reader of the screen that is open (the router, exported by the build, holds the open view; the
// view holds its controller and the controller its reader) and read the list again.
const STAGE = `(async (data) => {
  const urls = new Set([...document.querySelectorAll('script[src],link[rel=modulepreload]')].map(e => e.src || e.href)
    .concat(performance.getEntriesByType('resource').map(e => e.name)).filter(u => /\\.js(\\?|$)/.test(u)))
  let router = null
  for (const url of urls) {
    try { const mod = await import(url); for (const v of Object.values(mod)) if (v && typeof v === 'object' && 'currentView' in v && 'routes' in v) router = v } catch (e) {}
  }
  const reader = router?.currentView?.controller?.reader
  if (!reader) return 'no reader'
  reader.source = { listSeries: async () => data.series, listPlaylists: async (_u, id) => data.playlists[id] || [], deletePlaylists: async () => { throw new Error('read only') } }
  reader.covers = null
  await reader.load({ fresh: true })
  return 'ok'
})`

// The folder step: MusicKit is blocked here, so the list of folders can only be seen reading and then failing (the real list needs the
// owner's Apple Music account; the listed state is proven by test/views/AppleFolderStep.test.js with a double). The app gives
// MusicKit 10 s to start, so the failed state arrives after that.
const stepStates = async (page, prefix, tap, panelSelector, clipOf) => {
    await tap(page.locator('#playlist-export-window [data-export="apple"]'))
    await page.waitForSelector('[data-apple-folder-step]')
    log[`${prefix}.folderStep.reading`] = (await page.locator('[data-apple-folder-step]').innerText()).replace(/\s+/g, ' ')
    await page.waitForFunction(() => /could not be read/.test(document.querySelector('[data-apple-folder-step]')?.textContent || ''), null, { timeout: 30000 })
    log[`${prefix}.folderStep.failed`] = (await page.locator('[data-apple-folder-step]').innerText()).replace(/\s+/g, ' ')
    log[`${prefix}.folderStep.selected`] = await page.evaluate(() => document.querySelector('input[name="apple-folder"]:checked')?.value)
    log[`${prefix}.folderStep.targets`] = await page.locator('[data-apple-folder-step] label, [data-apple-folder-step] button').evaluateAll((els) => els.map((e) => ({ t: e.textContent.trim().slice(0, 24), h: Math.round(e.getBoundingClientRect().height) })))
    await shot(page, `${prefix}-folder-step`, await clipOf(page, panelSelector))
}

const log = {}
const errors = []

async function open(browser, contextOptions, tag) {
    const ctx = await browser.newContext(contextOptions)
    await ctx.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations|js-cdn\.music\.apple|api\.spotify/, (r) => r.abort())
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(`${tag} pageerror ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|blocked|aborted/i.test(m.text())) errors.push(`${tag} console ${m.text().slice(0, 200)}`) })
    await page.goto(site + '/saved-playlists', { waitUntil: 'load' }).catch(() => {})
    await page.waitForTimeout(2500)
    await page.addStyleTag({ content: '#toast-container{display:none!important}' })
    log[`${tag}.stage`] = await page.evaluate(`${STAGE}(${JSON.stringify({ series: SERIES, playlists: PLAYLISTS })})`)
    await page.waitForSelector('.series-group', { timeout: 15000 })
    return { ctx, page }
}

const box = async (page, selector, nth = 0) => {
    const b = await page.locator(selector).nth(nth).boundingBox()
    return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }
}
const shot = (page, name, clip) => page.screenshot({ path: path.join(out, `${name}.png`), clip })
const around = (b, pad = 12) => ({ x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.w + pad * 2, height: b.h + pad * 2 })

// ---------------- the phone: WebKit, iPhone 14 ----------------
{
    const browser = await webkit.launch()
    const { ctx, page } = await open(browser, { ...devices['iPhone 14'] }, 'phone')
    await page.locator('.saved-series-toggle').first().tap()
    await page.locator('.saved-phone-batch__main').first().tap()
    await page.waitForSelector('.saved-phone-playlist-head')
    const rowBox = await box(page, '.saved-phone-playlist-head')
    const exportBtn = await box(page, '.saved-phone-playlist-head [aria-label^="Export "]')
    log['phone.rowExportTarget'] = exportBtn
    log['phone.rowExportLabels'] = await page.locator('.saved-phone-playlist-head [aria-label^="Export "]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    log['phone.pageScrollsSideways'] = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    const batchRows = await box(page, '.saved-phone-batch')
    await shot(page, 'phone-row-action', { x: 0, y: Math.max(0, batchRows.y - 4), width: 393, height: Math.min(batchRows.h + 8, 420) })

    // the playlist's own Export -> the window, for that playlist only
    await page.locator('.saved-phone-playlist-head [aria-label="Export Side Two"]').tap()
    await page.waitForSelector('#playlist-export-window')
    await page.waitForTimeout(400)
    log['phone.window.single'] = await page.locator('#playlist-export-window').innerText()
    log['phone.window.single.targets'] = await page.locator('#playlist-export-window [data-export]').evaluateAll((els) => els.map((e) => ({ text: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height) })))
    await shot(page, 'phone-window-one-playlist', { x: 0, y: 852 - 330, width: 393, height: 330 })
    // Apple Music asks for the folder first: the series' name selected
    await stepStates(page, 'phone', (l) => l.tap(), '#playlist-export-window .sheet__panel', async (pg, sel) => { const b = await box(pg, sel); return { x: 0, y: Math.max(0, b.y), width: 393, height: Math.min(b.h, 852 - b.y) } })
    await page.locator('[data-folder-back]').tap()
    // Spotify for one playlist: its own window, nothing chosen between merge and separate
    await page.locator('#playlist-export-window [data-export="spotify"]').tap()
    await page.waitForSelector('#spotify-export-modal')
    await page.waitForTimeout(300)
    log['phone.spotify.single'] = (await page.locator('#spotify-export-modal').innerText()).replace(/\s+/g, ' ')
    await shot(page, 'phone-spotify-one-playlist', { x: 0, y: 0, width: 393, height: 852 })
    await page.locator('#spotify-export-modal .close-modal-btn').first().tap()

    // the batch's «⋯» -> Export beside Edit batch -> the window, all of the batch
    await page.locator('[aria-label^="Actions for batch"]').first().tap()
    await page.waitForSelector('.sheet .albums-sheet__row')
    await page.waitForTimeout(400)
    log['phone.batchSheet'] = await page.locator('.sheet .albums-sheet__label').allInnerTexts()
    await shot(page, 'phone-batch-action', { x: 0, y: 852 - 330, width: 393, height: 330 })
    await page.locator('.sheet .albums-sheet__row', { hasText: /^\s*Export\s*$/ }).tap()
    await page.waitForSelector('#playlist-export-window')
    await page.waitForTimeout(400)
    log['phone.window.batch'] = await page.locator('#playlist-export-window').innerText()
    await shot(page, 'phone-window-batch', { x: 0, y: 852 - 330, width: 393, height: 330 })
    await ctx.close()
    await browser.close()
}

// ---------------- the computer: Chromium at 1280 ----------------
{
    const browser = await chromium.launch()
    const { ctx, page } = await open(browser, { viewport: { width: 1280, height: 800 } }, 'desktop')
    const card = await box(page, '.batch-group-card')
    await page.locator('.batch-header').first().hover()
    const headerBox = await box(page, '.batch-header')
    log['desktop.batchButtons'] = await page.locator('.batch-card-buttons').first().locator('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    await shot(page, 'desktop-batch-action', around(headerBox, 8))

    await page.locator('.batch-header').first().click() // opens the batch
    await page.locator('.playlist-row').nth(1).hover()
    const rowBox = await box(page, '.playlist-row', 1)
    log['desktop.rowButtons'] = await page.locator('.playlist-row').nth(1).locator('.playlist-row-buttons button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    await shot(page, 'desktop-row-action', around(rowBox, 8))

    await page.locator('.playlist-row').nth(1).locator('[aria-label^="Export "]').click()
    await page.waitForSelector('#playlist-export-window')
    log['desktop.window.single'] = (await page.locator('#playlist-export-window').innerText()).replace(/\s+/g, ' ')
    log['desktop.focusOnOpen'] = await page.evaluate(() => document.activeElement?.dataset?.export)
    const windowBox = await box(page, '#playlist-export-window .app-modal__panel')
    await shot(page, 'desktop-window-one-playlist', around(windowBox, 24))
    await stepStates(page, 'desktop', (l) => l.click(), '#playlist-export-window .app-modal__panel', async (pg, sel) => around(await box(pg, sel), 24))
    await page.keyboard.press('Escape')
    log['desktop.focusReturnsToRowButton'] = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))

    await page.locator('.batch-header').first().locator('[aria-label^="Export batch"]').click()
    await page.waitForSelector('#playlist-export-window')
    log['desktop.window.batch'] = (await page.locator('#playlist-export-window').innerText()).replace(/\s+/g, ' ')
    const windowBox2 = await box(page, '#playlist-export-window .app-modal__panel')
    await shot(page, 'desktop-window-batch', around(windowBox2, 24))
    await ctx.close()
    await browser.close()
}

log.errors = errors
fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(log, null, 2))
server.close()
if (!process.env.F90_DIST) fs.rmSync(dist, { recursive: true, force: true })
console.log(JSON.stringify(log, null, 2))
