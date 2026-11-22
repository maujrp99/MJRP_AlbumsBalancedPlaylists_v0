// F89 proof: the inventory gallery on the phone, on a BUILT page, in WebKit (Safari's engine) with the iPhone 14 and iPhone SE profiles
// and one tablet width (820 px). Firebase Auth, Firestore and installations are aborted; the data is staged by the harness
// (harness/inventory.js: the real screen, the real stylesheets in the order of the build, fixture items, no network).
//   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node reports/evidence/F76/inventory-gallery-phone/shoot.mjs [outDir]
// Writes the crops (jpeg, CSS pixels) and measures.json to outDir; exit code 1 if a check fails.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../../../..')
const { webkit, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = process.argv[2] || path.join(here)
fs.mkdirSync(out, { recursive: true })

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-gallery-'))
execFileSync('npx', ['vite', 'build', '--config', path.join(here, 'harness/vite.build.config.mjs')], { cwd: repo, stdio: 'ignore', env: { ...process.env, OUT: dist } })
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((q, r) => {
    const f = path.join(dist, decodeURIComponent(q.url.split('?')[0]))
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(r)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const page_ = (query) => `http://127.0.0.1:${server.address().port}/reports/evidence/F76/inventory-gallery-phone/harness/inventory.html?${query}`

const PROFILES = [
    ['iphone14', devices['iPhone 14']],
    ['iphone393', { ...devices['iPhone 14'], viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 } }], // the owner's iPhone 15 Pro, in CSS pixels
    ['iphoneSE3', devices['iPhone SE (3rd gen)']], // 375 px: 2 columns (3 from 640 px, as Albums)
    ['iphoneSE', devices['iPhone SE']], // the first SE, 320 px: 2 columns
    ['tablet820', { ...devices['iPad (gen 7)'], viewport: { width: 820, height: 1180 }, screen: { width: 820, height: 1180 } }]
]
const EXTRA = new Set(['iphone393', 'iphoneSE3'])
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/

// What the gallery looks like in numbers: columns, sides, targets, text, truncation, sideways scroll, the bottom menu.
const MEASURE = `(() => {
  const r = (n) => Math.round(n * 100) / 100
  const tiles = [...document.querySelectorAll('.inv-tile')]
  const boxes = tiles.map(t => t.getBoundingClientRect())
  const firstTop = boxes.length ? boxes[0].top : 0
  const columns = boxes.filter(b => Math.abs(b.top - firstTop) < 2).length
  const size = (sel) => { const all = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()); return all.length ? { w: r(Math.min(...all.map(b => b.width))), h: r(Math.min(...all.map(b => b.height))), n: all.length } : null }
  const sizes = []
  document.querySelectorAll('.inv-tile .inv-tile__title, .inv-tile .inv-tile__artist, .inv-tile .inv-tile__amount, .inv-tile .inv-tile__origin, .inv-tile .inv-tile__pill').forEach(e => sizes.push(parseFloat(getComputedStyle(e).fontSize)))
  const cut = [...document.querySelectorAll('.inv-tile__pill')].filter(e => e.scrollWidth > e.clientWidth + 1).length
  const bar = document.querySelector('.phone-tabbar')
  const lastTile = tiles[tiles.length - 1]
  const more = document.querySelector('.inv-more, .inv-more__count')
  const last = more || lastTile
  const doc = document.documentElement
  return {
    viewport: innerWidth + 'x' + innerHeight, tiles: tiles.length, rows: document.querySelectorAll('.inv-row').length, columns,
    tileWidth: boxes.length ? r(boxes[0].width) : null, coverWidth: tiles[0] ? r(tiles[0].querySelector('.inv-tile__cover').getBoundingClientRect().width) : null,
    scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, sideways: doc.scrollWidth > doc.clientWidth,
    open: size('.inv-tile__open'), status: size('.inv-tile__status'), more: size('.inv-tile__more'),
    minFont: sizes.length ? Math.min(...sizes) : null, pillsCut: cut,
    lastBottom: last ? r(last.getBoundingClientRect().bottom) : null, tabbarTop: bar ? r(bar.getBoundingClientRect().top) : null
  }
})()`

const browser = await webkit.launch()
const failures = []
const measures = {}
const shots = []

for (const [name, device] of PROFILES) {
    const ctx = await browser.newContext({ ...device })
    await ctx.route(BLOCKED, (route) => route.abort())
    const consoleErrors = []
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => consoleErrors.push(String(e)))
    const note = (key, m) => { (measures[name] ||= {})[key] = m }
    const open = async (query) => {
        await page.goto(page_(query), { waitUntil: 'load' })
        await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
        await page.addStyleTag({ content: '#toast-container{display:none!important}*{animation:none!important;transition:none!important}' })
        await page.waitForTimeout(250)
    }
    // the profiles that only add a width keep three crops each (the others take them all)
    const FEW = new Set(['gallery-top', 'gallery-end'])
    const shoot = async (key, options = {}) => {
        if (EXTRA.has(name) && !FEW.has(key)) return
        const file = `${name}-${key}.jpg`
        await page.screenshot({ path: path.join(out, file), type: 'jpeg', quality: 66, scale: 'css', ...options })
        shots.push(file)
    }
    const measure = async (key) => { const m = await page.evaluate(MEASURE); note(key, m); return m }

    // 1. Nothing chosen: the list, as before
    await open('n=60')
    let m = await measure('list-default')
    if (m.tiles !== 0 || m.rows === 0) failures.push(`${name} list-default: expected the list, got ${m.tiles} cards and ${m.rows} rows`)
    await shoot('list-default')

    // 2. The gallery, top of the list: a long title, an album with no cover, a wishlist album, values with their origin
    await open('n=60&view=grid')
    m = await measure('gallery-top')
    const width = await page.evaluate('innerWidth')
    const expectedColumns = width >= 640 ? 3 : 2 // the albums grid's: 2, and 3 from 640 px
    if (m.columns !== expectedColumns) failures.push(`${name} gallery-top: ${m.columns} columns, expected ${expectedColumns}`)
    if (m.sideways) failures.push(`${name} gallery-top: scrolls sideways (${m.scrollWidth} > ${m.clientWidth})`)
    if (m.open.h < 44 || m.status.h < 44 || m.status.w < 44 || m.more.w < 44 || m.more.h < 44) failures.push(`${name} gallery-top: a target under 44 px ${JSON.stringify({ open: m.open, status: m.status, more: m.more })}`)
    if (m.minFont < 12) failures.push(`${name} gallery-top: text of ${m.minFont}px`)
    if (m.pillsCut) failures.push(`${name} gallery-top: ${m.pillsCut} status pills cut`)
    await shoot('gallery-top')
    await page.evaluate('window.scrollTo(0, 900)')
    await page.waitForTimeout(150)
    await measure('gallery-scrolled')
    await shoot('gallery-scrolled')

    // 3. The switch: the sheet, then each view, then a reload that keeps the choice
    await open('n=60&s=switch')
    await shoot('switch-open')
    const pressed = await page.$$eval('[data-view]', (b) => b.map((x) => `${x.textContent.trim()}:${x.getAttribute('aria-pressed')}`))
    if (pressed.join() !== 'Gallery:false,List:true') failures.push(`${name} switch: the sheet says ${pressed.join()}`)
    await page.click('[data-view="grid"]')
    await page.waitForTimeout(250)
    await shoot('switch-gallery-chosen')
    await page.click('[data-role="filters-done"]')
    await page.waitForTimeout(250)
    m = await measure('after-switch')
    if (m.tiles === 0) failures.push(`${name} switch: no card after choosing the gallery`)
    const kept = await page.evaluate("localStorage.getItem('mjrp_inventory_view_mode')")
    if (kept !== 'grid') failures.push(`${name} switch: kept ${kept}`)
    await open('n=60&keep=1')
    m = await measure('reloaded-with-choice')
    if (m.tiles === 0 || m.rows !== 0) failures.push(`${name} reload: the gallery was not kept`)
    await page.evaluate("document.querySelector('[data-phone-action=\"filters\"]').click()")
    await page.waitForTimeout(300)
    await page.click('[data-view="list"]')
    await page.click('[data-role="filters-done"]')
    await page.waitForTimeout(250)
    m = await measure('back-to-list')
    if (m.rows === 0 || m.tiles !== 0) failures.push(`${name} switch back: the list did not come back`)
    await open('n=60&keep=1')
    m = await measure('reloaded-with-list')
    if (m.rows === 0) failures.push(`${name} reload: the list was not kept`)

    // 4. The same actions from a card: the status sheet and the album's actions (with «Where to buy»)
    await open('n=60&view=grid&s=status')
    await shoot('status-sheet')
    await open('n=60&view=grid&s=more')
    await shoot('actions-sheet')
    await page.evaluate("document.querySelector('.sheet__body').scrollTo(0, 400)")
    await page.waitForTimeout(150)
    await shoot('actions-sheet-where-to-buy')
    const stores = await page.$$eval('.sheet a[data-store]', (a) => a.map((x) => x.dataset.store))
    if (stores.join() !== 'Discogs,Amazon,iMusic') failures.push(`${name} actions: stores ${stores.join()}`)
    await open('n=60&view=grid')
    await page.click('.inv-tile__open')
    await page.waitForTimeout(900)
    const windowOpen = await page.$$eval('.app-modal, .album-window, [role="dialog"]', (n) => n.length)
    note('open-album-dialogs', windowOpen)
    await shoot('album-window')

    // 5. Search, a status filter, the values notice: the same in the gallery
    await open('n=60&view=grid&s=search')
    m = await measure('gallery-search')
    await shoot('gallery-search')
    await open('n=60&view=grid&s=wishlist')
    m = await measure('gallery-wishlist')
    await shoot('gallery-wishlist')

    // 6. The end of the list: the bottom menu does not cover the last card or the count under it
    await open('n=7&view=grid')
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    await page.waitForTimeout(250)
    m = await measure('gallery-end')
    if (!(m.lastBottom <= m.tabbarTop - 8)) failures.push(`${name} gallery-end: the last line ends at ${m.lastBottom} and the bottom menu starts at ${m.tabbarTop}`)
    if (m.sideways) failures.push(`${name} gallery-end: scrolls sideways`)
    await shoot('gallery-end')
    await open('n=7')
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    await page.waitForTimeout(250)
    m = await measure('list-end')
    await shoot('list-end')

    // 7. 50 more
    await open('n=120&view=grid')
    m = await measure('gallery-first-chunk')
    if (m.tiles !== 50) failures.push(`${name} chunk: ${m.tiles} cards`)
    await page.click('[data-phone-action="more-rows"]')
    await page.waitForTimeout(250)
    m = await measure('gallery-second-chunk')
    if (m.tiles !== 100) failures.push(`${name} chunk: ${m.tiles} cards after «Show 50 more»`)

    note('consoleErrors', consoleErrors)
    if (consoleErrors.length) failures.push(`${name}: console errors ${JSON.stringify(consoleErrors.slice(0, 3))}`)
    await ctx.close()
}

// 8. The same columns, gaps and cover sizes as the albums screen's grid, at every width of the phone layout
const COMPARE = `(() => {
  const r = (n) => Math.round(n * 100) / 100
  const read = (grid, cell) => {
    const s = getComputedStyle(grid)
    const cells = [...grid.querySelectorAll(cell)].map((c) => c.getBoundingClientRect())
    const top = cells[0].top
    return { columns: cells.filter((c) => Math.abs(c.top - top) < 2).length, columnGap: s.columnGap, rowGap: s.rowGap, cellWidth: r(cells[0].width) }
  }
  return { albums: read(document.getElementById('albumsGridSandbox'), '.album-tile'), inventory: read(document.querySelector('.inv-tiles'), '.inv-tile') }
})()`
const widths = {}
for (const width of [320, 360, 375, 393, 430, 600, 640, 768, 820, 899]) {
    const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width, height: 900 }, screen: { width, height: 900 } })
    await ctx.route(BLOCKED, (route) => route.abort())
    const page = await ctx.newPage()
    await page.goto(page_('n=40&view=grid&s=compare'), { waitUntil: 'load' })
    await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
    await page.waitForTimeout(250)
    const m = await page.evaluate(COMPARE)
    widths[width] = m
    if (JSON.stringify(m.albums) !== JSON.stringify(m.inventory)) failures.push(`${width} px: the albums grid is ${JSON.stringify(m.albums)} and the gallery is ${JSON.stringify(m.inventory)}`)
    await ctx.close()
}
measures.sameAsAlbums = widths

await browser.close()
server.close()
fs.rmSync(dist, { recursive: true, force: true })
fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify({ webkit: 'Playwright WebKit', profiles: Object.fromEntries(PROFILES.map(([n, d]) => [n, d.viewport])), measures, failures }, null, 2))
console.log(`${shots.length} crops in ${out}`)
if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1) }
console.log('OK: the gallery is drawn, switched, kept and measured; no sideways scroll, no console error')
