// F83 wave 6b: the browser proof that the windows of the albums and inventory screens in React (this branch) are the hand-made windows of their parent
// (315ae5f), on the BUILT sites. Two builds are served (a small static server with the fallback to app.html, as the hosting has it):
//
//   ENGINE=webkit|chromium PROFILE=1280|900|899|393x852|375x667 [OLD_AGAINST_OLD=1] node browser-proof.mjs <dist of the parent> <dist of this branch>
//
// The windows: the album window opened by the albums screen and by the inventory (with its table of tracks, the tabs and the value section: the
// Discogs server answers are replaced by stand-ins for /api/value-sources, /api/exchange-rates and /api/album-value), the window to edit an item, the
// window to add an album to the inventory. Each is opened, filled and closed on each side the same way (by the cross, «Close», the backdrop and Escape),
// and the windows over the page (elements, attributes, classes, field values), the text, the boxes, where the focus is, a picture of the window and the
// errors of the page are compared. Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations).
// The inventory store is not exposed by the built site: the script answers the request of the main script with the same text and one line at its end
// that puts the store on `window.__inv` (the same line on both builds, 6a's seam); the albums screen's stores are on `window` already. Nothing in a
// key: nothing here reads or writes one.
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
const COMPUTER = ['1280', '900'].includes(PROFILE)
const OLD_ONLY = process.env.OLD_AGAINST_OLD === '1'
const TAG = `${ENGINE_NAME}-${PROFILE}${OLD_ONLY ? '-old-vs-old' : ''}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const DIFFS = path.join(HERE, 'diffs')
fs.mkdirSync(DIFFS, { recursive: true })
fs.mkdirSync(path.join(HERE, 'raw'), { recursive: true })

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 500) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 220) : ''}`) }

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

// ---- the world: tracks with ranks, ratings and popularity; items of every status; covers as small pictures
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>`)}`
const NAMES = ['Speak to Me', 'Breathe', 'On the Run', 'Time', 'The Great Gig in the Sky', 'Money', 'Us and Them', 'Any Colour You Like', 'Brain Damage', 'Eclipse']
const tracksOf = (i) => NAMES.map((title, j) => ({ title, position: j + 1, duration: 60 + 31 * j, rank: (j * 3 + i) % 11 || 999, rating: j % 3 === 0 ? undefined : 60 + j * 3, spotifyPopularity: j % 4 === 3 ? -1 : 20 + j * 7, userRank: j === 2 ? 1 : undefined, artist: j === 4 ? 'A guest' : undefined }))
const ARTISTS = ['Pink Floyd', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen']
const ITEMS = Array.from({ length: 12 }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`,
    title: `The Album ${i}`,
    artist: ARTISTS[i % ARTISTS.length],
    format: ['cd', 'vinyl', 'digital', null][i % 4],
    owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    purchasePrice: i % 2 === 0 ? 40 + i : null,
    currency: i % 4 === 0 ? 'BRL' : 'USD',
    notes: i === 0 ? 'a first pressing, <b>mint</b>' : '',
    albumData: { id: `al-${i}`, title: `The Album ${i}`, artist: ARTISTS[i % ARTISTS.length], year: 1970 + i, coverUrl: cover(i * 29 % 360), tracks: tracksOf(i) },
    averages: { rating: 70 + i, popularity: 40 + i, ratedTracks: 7, popTracks: 7, tracks: 10 },
    addedToInventory: `2026-10-${String(1 + i).padStart(2, '0')}T10:00:00.000Z`
}))

const SEAM = (text) => {
    const cls = /class (\w+)\{constructor\(\)\{this\.albums=\[\],this\.loading=!1/.exec(text)?.[1]
    const inst = cls && new RegExp(`(\\w+)=new ${cls}\\b`).exec(text)?.[1]
    if (!inst) throw new Error('the inventory store was not found in the main script')
    return `${text}\n;window.__inv=${inst};`
}

/** The albums screen, as the answers of Apple Music would have made it (5b's world, with the tracks the windows show). */
const WORLD = `(async () => {
  const tracks = (j) => ${JSON.stringify(NAMES)}.map((t, i) => ({ title: t, position: i + 1, duration: 60 + 31 * i, rank: i % 2 ? undefined : i + 1, rating: i % 3 ? 70 + i : undefined, spotifyPopularity: i % 4 === 3 ? -1 : 25 + i * 6, userRank: j === 0 && i === 2 ? 1 : undefined }))
  const make = (sid, j, artist, title) => ({ id: sid + '-' + j, title, artist, year: String(1970 + j), releaseDate: (1970 + j) + '-01-01', type: 'Album', coverUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(' + (j * 40) + ',45%,35%)"/></svg>'),
    tracks: tracks(j), hasUserRanking: j % 3 === 0, bestEverAlbumId: j % 2 === 0 ? String(100 + j) : null, spotifyId: j % 4 === 0 ? 'sp' + j : null, seriesIds: [sid],
    getTracks: (kind) => tracks(j).map((t) => (kind === 'acclaim' ? { ...t } : { ...t })) })
  const series = [{ id: 's0', name: 'Floyd', createdAt: new Date(2026, 0, 10), albumQueries: Array.from({ length: 4 }, (_, j) => ({ artist: 'Pink Floyd', title: 'Album ' + j })) }]
  window.albumLoadService.load = () => {}
  window.albumLoadService.refreshSource = () => {}
  window.albumSeriesStore.setSeries(series)
  window.albumLoadStore.setSeriesOrder(['s0'])
  const all = []
  series[0].albumQueries.forEach((q, j) => { all.push(make('s0', j, q.artist, q.title)) })
  window.albumLoadStore.setSeriesEntries('s0', series[0].albumQueries.map((q, j) => ({ key: (q.artist + ' - ' + q.title).toLowerCase(), seriesId: 's0', query: q, status: 'found', error: null, album: all[j], enrichment: { acclaim: j === 1 ? 'failed' : 'done', popularity: j === 2 ? 'failed' : 'empty', userRanking: 'not-connected' } })))
  window.albumsStore.setAlbumsBySeries({ ALL_SERIES_VIEW: all })
  window.albumLoadStore.flush()
})()`

const contextOptions = () => {
    if (COMPUTER) return { reducedMotion: 'reduce', viewport: { width: Number(PROFILE), height: 900 } }
    const [width, height = 900] = PROFILE.split('x').map(Number)
    return { ...devices['iPhone 14'], viewport: { width, height }, reducedMotion: 'reduce' }
}

const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

async function open(base, screen) {
    const browser = await ENGINE.launch()
    const context = await browser.newContext(contextOptions())
    await context.route(BLOCKED, route => route.abort())
    await context.route(/\/api\/value-sources/, route => route.fulfill(json({ data: { discogs: 'on' }, outcome: 'found' })))
    await context.route(/\/api\/exchange-rates/, route => route.fulfill(json({ data: { rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }, outcome: 'found' })))
    await context.route(/\/api\/album-value/, route => route.fulfill(json({ data: { release: { id: 249504, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/249504' }, conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }, currency: 'USD', readAt: '2026-11-18T10:00:00.000Z' }, outcome: 'found' })))
    if (screen === 'inventory') {
        await context.route(/\/assets\/main-[^/]*\.js$/, async route => {
            const response = await route.fetch()
            await route.fulfill({ response, body: SEAM(await response.text()) })
        })
    }
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(String(error.message || error)))
    if (screen === 'inventory') {
        await page.goto(`${base}/inventory`, { waitUntil: 'load' })
        await page.waitForFunction(() => window.__inv, null, { timeout: 20000 })
        await page.evaluate((items) => window.__inv.setAlbums(items), ITEMS)
        await page.waitForSelector(COMPUTER ? '.inventory-card-wrapper' : '.inv-row, .inv-tile', { timeout: 10000 })
    } else {
        await page.goto(`${base}/albums`, { waitUntil: 'load' })
        await page.waitForFunction(() => window.albumLoadService && window.albumLoadStore && window.albumSeriesStore && window.albumsStore && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
        await page.waitForTimeout(1200)
        await page.evaluate(WORLD)
        await page.waitForSelector('[data-action="view-modal"]', { timeout: 10000 })
        // the add window writes through the inventory service: its calls stop in the page, on both sides alike
        await page.evaluate(() => { window.__adds = [] })
    }
    await page.waitForTimeout(1500)
    return { browser, page, errors }
}

const tap = (page, selector, index = 0) => (COMPUTER ? page.locator(selector).nth(index).click() : page.locator(selector).nth(index).tap())
const WINDOW = '.modal-overlay.album-window, #inventory-edit-modal, #inventory-add-modal'

// ---- the states: the same steps on each side
const openView = (screen) => async (p) => { await tap(p, screen === 'inventory' ? (COMPUTER ? '.inventory-card-wrapper [data-action="view-modal"]' : '.inv-row__open, .inv-tile [data-action="view-modal"]') : '[data-action="view-modal"]'); await p.waitForSelector('.modal-overlay.album-window'); await p.waitForTimeout(500) }
const closers = {
    'the cross': (p) => tap(p, COMPUTER ? '.modal-header [data-action="close"]' : '.album-window__close'),
    '«Close»': (p) => tap(p, '.modal-footer button'),
    'the backdrop': (p) => p.mouse.click(5, 5),
    'Escape': (p) => p.keyboard.press('Escape')
}
const STATES = []
for (const screen of ['albums', 'inventory']) {
    const view = openView(screen)
    STATES.push({ screen, name: `${screen}: the album window opened`, steps: view })
    for (const [name, close] of Object.entries(closers)) {
        if (!COMPUTER && (name === 'the backdrop' || name === '«Close»')) continue // the window is the whole screen on the phone: no backdrop to press, and the footer is not drawn
        STATES.push({ screen, name: `${screen}: the album window closed by ${name}`, steps: async (p) => { await view(p); await close(p); await p.waitForTimeout(450) } })
    }
    if (COMPUTER) {
        STATES.push({ screen, name: `${screen}: the table sorted by the popularity, twice`, steps: async (p) => { await view(p); await tap(p, '.sort-header[data-sort="spotifyPopularity"]'); await tap(p, '.sort-header[data-sort="spotifyPopularity"]') } })
    } else {
        STATES.push({ screen, name: `${screen}: the tabs of the phone, BEA then Spotify`, steps: async (p) => { await view(p); await tap(p, '.tracks-tabs__segment[data-tab="acclaim"]'); await tap(p, '.tracks-tabs__segment[data-tab="spotify"]') } })
        STATES.push({ screen, name: `${screen}: the window scrolled, the title in the bar`, steps: async (p) => { await view(p); await p.locator('.modal-container').evaluate(el => { el.querySelector('.modal-content > div, .modal-content').scrollTo?.(0, 400) }); await p.waitForTimeout(400) } })
    }
}
// the inventory's own: the value section, the window to edit, the sheet of the phone
STATES.push({ screen: 'inventory', name: 'inventory: the value section, read now, an invalid value written', steps: async (p) => {
    await openView('inventory')(p)
    if (!COMPUTER) await tap(p, '.value-fold__toggle')
    await tap(p, '[data-action="read-value"]'); await p.waitForTimeout(900)
    await p.fill('#inventoryValueInput', 'abc'); await tap(p, '[data-action="save-value"]'); await p.waitForTimeout(500)
} })
STATES.push({ screen: 'inventory', name: 'inventory: where to buy (the stores)', steps: async (p) => { await openView('inventory')(p) } })
const openEdit = async (p) => {
    if (COMPUTER) await tap(p, '.edit-album-btn')
    else { await tap(p, '.inv-row__more'); await p.locator('.sheet button', { hasText: /^\s*Edit/ }).first().tap() }
    await p.waitForSelector('#inventory-edit-modal'); await p.waitForTimeout(500)
}
STATES.push({ screen: 'inventory', name: 'inventory: the window to edit', steps: openEdit })
STATES.push({ screen: 'inventory', name: 'inventory: the window to edit, filled', steps: async (p) => { await openEdit(p); await p.selectOption('#edit-format', 'vinyl'); await p.locator('input[name="edit-currency"][value="USD"]').check(); await p.fill('#inventory-edit-modal input[type="number"]', '33.5'); await p.fill('#inventory-edit-modal textarea', 'two\nlines') } })
for (const name of ['the cross', 'Cancel', 'Escape', 'the backdrop']) {
    STATES.push({ screen: 'inventory', name: `inventory: the window to edit closed by ${name}`, steps: async (p) => {
        await openEdit(p)
        if (name === 'the cross') await tap(p, '#inventory-edit-modal .app-modal__close')
        else if (name === 'Cancel') await tap(p, '#inventory-edit-modal .btn-ghost')
        else if (name === 'Escape') await p.keyboard.press('Escape')
        else await p.mouse.click(5, 5)
        await p.waitForTimeout(400)
    } })
}
const openAdd = async (p) => {
    if (COMPUTER) await tap(p, '[data-action="add-to-inventory"]')
    else { await tap(p, '[data-action="album-more"]'); await p.locator('.sheet button', { hasText: /nventory/ }).first().tap() }
    await p.waitForSelector('#inventory-add-modal'); await p.waitForTimeout(500)
}
STATES.push({ screen: 'albums', name: 'albums: the window to add', steps: openAdd })
STATES.push({ screen: 'albums', name: 'albums: the window to add, filled (USD, the prefix changes)', steps: async (p) => { await openAdd(p); await p.selectOption('#add-format', 'vinyl'); await p.locator('input[name="add-currency"][value="USD"]').check(); await p.fill('#inventory-add-modal input[type="number"]', '25.5'); await p.fill('#inventory-add-modal textarea', 'Mint') } })
STATES.push({ screen: 'albums', name: 'albums: the window to add closed by Cancel', steps: async (p) => { await openAdd(p); await tap(p, '#inventory-add-modal .btn-ghost'); await p.waitForTimeout(400) } })
// leaving the screen with the window open: the one change on purpose (the hand-made window stayed over the next screen)

const facts = (page) => page.evaluate((WINDOW) => {
    const fingerprint = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }
    const attrs = (el) => [...el.attributes].filter(({ name, value }) => !(name === 'style' && value === '') && !(el.tagName === 'INPUT' && (name === 'checked' || (name === 'value' && el.type !== 'radio'))) && !(name === 'selected' && el.tagName === 'OPTION'))
        .map(({ name, value }) => [name, name === 'style' ? el.style.cssText : name === 'class' ? value.split(/\s+/).filter(Boolean).sort().join(' ') : value]).sort(([a], [b]) => a.localeCompare(b)).map(([n, v]) => ` ${n}="${v}"`).join('')
    const describe = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        const inner = tag === 'textarea' ? '' : [...node.childNodes].map(describe).join('')
        const state = tag === 'input' ? (node.type === 'radio' ? `[checked=${node.checked}]` : `[held=${node.value}]`) : tag === 'textarea' ? `[held=${node.value}]` : tag === 'select' ? `[chosen=${node.value}]` : ''
        const whole = `<${tag}${attrs(node)}>${inner}</${tag}>${state}`
        return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole.replace(/>\s+</g, '><'))}"/>` : whole
    }
    const layers = [...document.querySelectorAll(WINDOW)]
    const active = document.activeElement
    const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    const parts = ['.modal-container', '.modal-header', '.modal-content', '.modal-footer', '.app-modal__panel', '.app-modal__footer', '.value-fold', '[data-role="estimated-value"]', '[data-role="where-to-buy"]', '.tracks-table-root', '.tracks-tabs', '.album-window__bar'].flatMap(s => layers.flatMap(l => [...l.querySelectorAll(s)].slice(0, 1).map(el => [s, box(el)])))
    const small = [...document.querySelectorAll('.album-window button, .album-window a, #inventory-edit-modal button, #inventory-add-modal button')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44) }).map(el => `${el.tagName}.${[...el.classList].join('.').slice(0, 40)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)
    return {
        count: layers.length,
        html: layers.map(describe).join('\n').replace(/>\s+</g, '><').replace(/(\[(?:held|checked|chosen)=[^\]]*\]) +</g, '$1<'),
        text: layers.map(l => l.innerText.replace(/\s+/g, ' ').trim()).join(' | '),
        focus: active && active !== document.body ? `${active.tagName}#${active.id}.${[...active.classList].join('.')}` : 'the page',
        inside: layers.some(l => l.contains(active)),
        parts,
        small,
        locked: getComputedStyle(document.body).overflow
    }
}, WINDOW)

function compare(a, b) {
    const A = PNG.sync.read(a), B = PNG.sync.read(b)
    if (A.width !== B.width || A.height !== B.height) return { size: false, pixels: -1, max: 255 }
    let pixels = 0, max = 0
    const diff = new PNG({ width: A.width, height: A.height })
    for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]))
        if (d > 0) { pixels++; max = Math.max(max, d); diff.data.set([255, 0, 0, 255], i) } else diff.data.set([A.data[i], A.data[i + 1], A.data[i + 2], 40], i)
    }
    return { size: true, pixels, max, diff: pixels ? PNG.sync.write(diff) : null }
}

const windowShot = async (page) => {
    const handle = page.locator('.modal-container, .app-modal__panel').last()
    try { if (await handle.count()) return await handle.screenshot({ timeout: 3000 }) } catch { /* none */ }
    return null
}

const servers = await Promise.all([serve(oldDist), serve(OLD_ONLY ? oldDist : newDist)])
const [oldSide, newSide] = servers.map(s => s.base)
const only = process.env.ONLY
for (const state of STATES.filter(s => !only || s.name.includes(only))) {
    const shots = []
    const seen = []
    const errors = []
    for (const base of [oldSide, newSide]) {
        const { browser, page, errors: errs } = await open(base, state.screen)
        try { await state.steps(page) } catch (error) { errs.push(`STEP: ${String(error.message).slice(0, 160)}`) }
        await page.waitForTimeout(400)
        shots.push(await windowShot(page))
        seen.push(await facts(page))
        errors.push(...errs)
        await browser.close()
    }
    const key = state.name.replace(/\W+/g, '_')
    const [o, n] = seen
    if (shots[0] && shots[1]) {
        const c = compare(shots[0], shots[1])
        note(`${state.name}: the picture of the window`, c.size && c.pixels === 0, c.size ? `${c.pixels} pixels differ, at most ${c.max} of 255` : 'the pictures differ in size')
        if (c.diff) fs.writeFileSync(path.join(DIFFS, `${TAG}-${key}.png`), c.diff)
    } else note(`${state.name}: the picture of the window`, !shots[0] && !shots[1], 'a window on one side only')
    note(`${state.name}: the number of windows over the page`, o.count === n.count, `old ${o.count} / new ${n.count}`)
    note(`${state.name}: the elements, attributes, classes and fields`, o.html === n.html, o.html === n.html ? '' : `first difference at ${[...o.html].findIndex((c, i) => c !== n.html[i])}: old ${o.html.slice(Math.max(0, [...o.html].findIndex((c, i) => c !== n.html[i]) - 60), [...o.html].findIndex((c, i) => c !== n.html[i]) + 100)} / new ${n.html.slice(Math.max(0, [...o.html].findIndex((c, i) => c !== n.html[i]) - 60), [...o.html].findIndex((c, i) => c !== n.html[i]) + 100)}`)
    note(`${state.name}: the visible text`, o.text === n.text, o.text === n.text ? '' : `old: ${o.text.slice(0, 120)} / new: ${n.text.slice(0, 120)}`)
    note(`${state.name}: the boxes of the parts`, JSON.stringify(o.parts) === JSON.stringify(n.parts), JSON.stringify(o.parts) === JSON.stringify(n.parts) ? '' : `old ${JSON.stringify(o.parts)} / new ${JSON.stringify(n.parts)}`)
    note(`${state.name}: the focus and the lock of the page`, o.focus === n.focus && o.locked === n.locked, `old ${o.focus} (${o.locked}) / new ${n.focus} (${n.locked})`)
    note(`${state.name}: the touch targets under 44 px (old ${o.small.length}, new ${n.small.length})`, JSON.stringify(o.small) === JSON.stringify(n.small), n.small.slice(0, 3).join('; '))
    note(`${state.name}: no error on the page`, errors.length === 0, errors[0] || '')
}
servers.forEach(s => s.server.close())
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(HERE, 'raw', `results-${TAG}.json`), JSON.stringify({ tag: TAG, total: results.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} of ${results.length} comparisons equal`)
process.exit(0)
