// F83 wave 6c: the browser proof that the inventory screen of this branch (the sentences of the models now come from the dictionary) says the same ENGLISH
// as its parent (6622654), on the BUILT sites. It is the script of wave 6a with the Discogs of the server replaced by stand-ins (VALUES=1: /api/value-sources,
// /api/exchange-rates and /api/album-value answer by `page.route`, nothing goes to Discogs) so that the lines the models write about a value (the label, the
// reason with no value, the notices of a run, the notes of the totals) are on the screen. Nothing in a key: nothing here reads or writes one.
//
//   VALUES=1 ENGINE=webkit|chromium PROFILE=1280|393x852 [OLD_AGAINST_OLD=1] node browser-proof-screen.mjs <dist of the parent> <dist of this branch>
//
import { chromium, webkit, devices } from '@playwright/test'
import { PNG } from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'chromium' ? 'chromium' : 'webkit'
const ENGINE = ENGINE_NAME === 'chromium' ? chromium : webkit
const PROFILE = process.env.PROFILE || '393x852'
const COMPUTER = ['1280', '900'].includes(PROFILE) // 899 is the last width of the phone (the iPhone profile with that window)
const OLD_ONLY = process.env.OLD_AGAINST_OLD === '1'
const VALUES = process.env.VALUES === '1'
const TAG = `${ENGINE_NAME}-${PROFILE}${VALUES ? '-values' : ''}${OLD_ONLY ? '-old-vs-old' : ''}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const DIFFS = path.join(HERE, 'diffs')
fs.mkdirSync(DIFFS, { recursive: true })
fs.mkdirSync(path.join(HERE, 'raw'), { recursive: true })

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 200) : ''}`) }

// ---- two static servers
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

// ---- the items: every status, a cover and none, a format and none, averages and none, enough to need the second chunk of the phone's list? no: 60 rows
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>`)}`
const ARTISTS = ['ABBA', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen', 'Rush', 'Yes', 'Zappa', 'Beck']
const ITEMS = Array.from({ length: 60 }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`,
    title: i % 7 === 0 ? `A long title of an album that does not fit in a line number ${i}` : `Album ${i}`,
    artist: ARTISTS[i % ARTISTS.length],
    format: ['cd', 'vinyl', 'digital', null][i % 4],
    owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    albumData: i % 5 === 0 ? {} : { coverUrl: cover(i * 17 % 360) },
    averages: i % 2 === 0 ? { rating: 70 + i % 25, popularity: 30 + i % 50, ratedTracks: 9, popTracks: 10, tracks: 10 } : undefined,
    addedToInventory: `2026-10-${String(1 + i % 28).padStart(2, '0')}T10:00:00.000Z`
}))

const SEAM = (text) => {
    const cls = /class (\w+)\{constructor\(\)\{this\.albums=\[\],this\.loading=!1/.exec(text)?.[1]
    const inst = cls && new RegExp(`(\\w+)=new ${cls}\\b`).exec(text)?.[1]
    if (!inst) throw new Error('the inventory store was not found in the main script')
    return `${text}\n;window.__inv=${inst};`
}

const contextOptions = () => {
    if (COMPUTER) return { reducedMotion: 'reduce', viewport: { width: Number(PROFILE), height: 900 } }
    const [width, height = 900] = PROFILE.split('x').map(Number)
    return { ...devices['iPhone 14'], viewport: { width, height }, reducedMotion: 'reduce' }
}

async function open(base, { gallery = false } = {}) {
    const browser = await ENGINE.launch()
    const context = await browser.newContext(contextOptions())
    if (gallery) await context.addInitScript(() => localStorage.setItem('mjrp_inventory_view_mode', 'grid'))
    await context.route(BLOCKED, route => route.abort())
    if (VALUES) {
        const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
        await context.route(/\/api\/value-sources/, route => route.fulfill(json({ data: { discogs: 'on' }, outcome: 'found' })))
        await context.route(/\/api\/exchange-rates/, route => route.fulfill(json({ data: { rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }, outcome: 'found' })))
        await context.route(/\/api\/album-value/, route => route.fulfill(json({ data: { release: { id: 249504, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/249504' }, conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }, currency: 'USD', readAt: '2026-11-18T10:00:00.000Z' }, outcome: 'found' })))
    }
    await context.route(/\/assets\/main-[^/]*\.js$/, async route => {
        const response = await route.fetch()
        await route.fulfill({ response, body: SEAM(await response.text()) })
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(String(error.message || error)))
    await page.goto(`${base}/inventory`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__inv, null, { timeout: 20000 })
    await page.evaluate((items) => window.__inv.setAlbums(items), ITEMS)
    await page.waitForSelector(COMPUTER ? '.inventory-card-wrapper, .inventory-row-wrapper' : '.inv-row, .inv-tile', { timeout: 10000 })
    await page.waitForTimeout(900)
    return { browser, page, errors }
}

// ---- the states: the same steps on each side
const tap = (page, selector, index = 0) => (COMPUTER ? page.locator(selector).nth(index).click() : page.locator(selector).nth(index).tap())
const STATES = COMPUTER ? [
    { name: 'the grid', steps: async () => { } },
    { name: 'the list', steps: async (p) => { await tap(p, '#toggleViewMode') } },
    { name: 'the search typed', steps: async (p) => { await p.locator('#inventorySearch').fill('Alb'); await p.locator('#inventorySearch').press('End') } },
    { name: 'the format Vinyl', steps: async (p) => { await p.selectOption('#formatFilter', 'vinyl') } },
    { name: 'the order Artist Z-A', steps: async (p) => { await p.selectOption('#inventorySort', 'artist_desc') } },
    { name: 'a count of the header pressed', steps: async (p) => { await tap(p, '[data-status-count="wishlist"]') } },
    { name: 'the album window opened by a card (hand-made window)', steps: async (p) => { await tap(p, '.album-card-compact h3') }, after: true },
    { name: 'every order, one after the other (the names are read from the select)', steps: async (p) => { for (const v of ['averageRating', 'averageRating_asc', 'averagePopularity', 'value', 'value_asc', 'addedToInventory', 'addedToInventory_asc']) await p.selectOption('#inventorySort', v) } },
    { name: 'the statuses of the header and of the card selector', steps: async (p) => { await tap(p, '[data-status-count="owned"]') } },
    { name: 'the notice of the albums that wait, then «Read them now»', values: true, steps: async (p) => { await p.waitForTimeout(600); await p.locator('[data-notice-action="read-values"]').first().click(); await p.waitForTimeout(500) } },
    { name: 'the euro chosen, the notes of the totals', values: true, steps: async (p) => { await p.waitForTimeout(600); await p.locator('[data-currency="EUR"]').first().click() } }
] : [
    { name: 'the list', steps: async () => { } },
    { name: 'the gallery', gallery: true, steps: async () => { } },
    { name: 'the filters sheet', steps: async (p) => { await tap(p, '[data-phone-action="filters"]') } },
    { name: 'the filters sheet: gallery, vinyl, order by artist Z-A', steps: async (p) => { await tap(p, '[data-phone-action="filters"]'); await tap(p, '[data-view="grid"]'); await tap(p, '[data-format="vinyl"]'); await tap(p, '[data-sort="artist_desc"]') } },
    { name: 'the sheet of an album', steps: async (p) => { await tap(p, '.inv-row__more') } },
    { name: 'the status sheet, then another status', steps: async (p) => { await tap(p, '.inv-row__status'); await tap(p, '.inv-choice', 2) } },
    { name: 'the jump sheet', steps: async (p) => { await tap(p, '[data-phone-action="jump"]') } },
    { name: 'the jump to a letter', steps: async (p) => { await tap(p, '[data-phone-action="jump"]'); await tap(p, '.inv-jump__target', 4) } },
    { name: 'the actions sheet', steps: async (p) => { await tap(p, '[data-phone-action="actions"]') } },
    { name: 'Show 50 more', steps: async (p) => { await tap(p, '[data-phone-action="more-rows"]') } },
    { name: 'the sheet of the values, and the sheet of the actions with values on', values: true, steps: async (p) => { await p.waitForTimeout(600); await tap(p, '[data-phone-action="actions"]') } },
    { name: 'the status sheet shows the three names', steps: async (p) => { await tap(p, '.inv-row__status') } },
    { name: 'the search with nothing found, then cleared', steps: async (p) => { await p.locator('#inventorySearch').fill('zzzz'); await p.waitForTimeout(300); await tap(p, '[data-phone-action="clear-filters"]') } }
]

const facts = (page) => page.evaluate(() => {
    const app = document.getElementById('app')
    const active = document.activeElement
    const box = (selector) => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return {
        text: (app?.innerText || '').replace(/\s+/g, ' ').trim() + ' | ' + [...document.querySelectorAll('.sheet:not(.sheet--closing)')].map(s => s.innerText.replace(/\s+/g, ' ')).join(' | '),
        focus: active && active !== document.body ? `${active.tagName}#${active.id}.${[...active.classList].join('.')}` : 'the page',
        boxes: ['#inventoryTotals', '.inventory-card-wrapper', '.inventory-row-wrapper', '.inv-row', '.inv-tile', '.inv-bar', '#inventory-grid-container', '.sheet__panel'].map(box),
        height: document.documentElement.scrollHeight,
        scroll: Math.round(window.scrollY)
    }
})

function compare(a, b) {
    const A = PNG.sync.read(a)
    const B = PNG.sync.read(b)
    if (A.width !== B.width || A.height !== B.height) return { size: false, pixels: -1, max: 255 }
    let pixels = 0
    let max = 0
    const diff = new PNG({ width: A.width, height: A.height })
    for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]))
        if (d > 0) { pixels++; max = Math.max(max, d); diff.data.set([255, 0, 0, 255], i) } else diff.data.set([A.data[i], A.data[i + 1], A.data[i + 2], 40], i)
    }
    return { size: true, pixels, max, diff: pixels ? PNG.sync.write(diff) : null }
}

const servers = await Promise.all([serve(oldDist), serve(OLD_ONLY ? oldDist : newDist)])
const [oldSide, newSide] = servers.map(s => s.base)
for (const state of STATES.filter(one => VALUES ? one.values : !one.values)) {
    const shots = []
    const seen = []
    const errors = []
    for (const base of [oldSide, newSide]) {
        const { browser, page, errors: errs } = await open(base, { gallery: state.gallery })
        await state.steps(page)
        await page.waitForTimeout(700)
        shots.push(await page.screenshot())
        seen.push(await facts(page))
        errors.push(...errs)
        await browser.close()
    }
    const key = state.name.replace(/\W+/g, '_')
    const c = compare(shots[0], shots[1])
    note(`${state.name}: the picture`, c.size && c.pixels === 0, c.size ? `${c.pixels} pixels differ, at most ${c.max} of 255` : 'the pictures differ in size')
    if (c.diff) fs.writeFileSync(path.join(DIFFS, `${TAG}-${key}.png`), c.diff)
    const [o, n] = seen
    note(`${state.name}: the visible text`, o.text === n.text, o.text === n.text ? '' : `old: ${o.text.slice(0, 120)} / new: ${n.text.slice(0, 120)}`)
    note(`${state.name}: the boxes and the height of the page`, JSON.stringify([o.boxes, o.height]) === JSON.stringify([n.boxes, n.height]), JSON.stringify([o.boxes, o.height]) === JSON.stringify([n.boxes, n.height]) ? '' : `old ${JSON.stringify(o.boxes)} ${o.height} / new ${JSON.stringify(n.boxes)} ${n.height}`)
    note(`${state.name}: the focus and the scroll`, o.focus === n.focus && o.scroll === n.scroll, `old ${o.focus} @${o.scroll} / new ${n.focus} @${n.scroll}`)
    note(`${state.name}: no error on the page`, errors.length === 0, errors[0] || '')
}
servers.forEach(s => s.server.close())
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(HERE, 'raw', `results-${TAG}.json`), JSON.stringify({ tag: TAG, total: results.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} of ${results.length} comparisons equal`)
process.exit(0)
