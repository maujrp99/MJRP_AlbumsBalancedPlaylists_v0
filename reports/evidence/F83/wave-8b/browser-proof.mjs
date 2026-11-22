// F83 wave 8b: the browser proof of the notices, the question windows and the loading bar in React (this branch) against the hand-made ones of the
// parent (f4eae56), on the BUILT sites.
//
//   ENGINE=chromium|webkit PROFILE=1280|900|899|iphone14|se [CONTROL=1] [ONLY=name,name] node browser-proof.mjs <dist of the parent> <dist of this branch>
//   (the same with two addresses, http://127.0.0.1:PORT of the dev servers of the two trees, runs the `direct*` scenarios: the engines called by the page)
//
// Two builds are served by a small static server with the fallback to app.html (as the hosting answers a deep route). CONTROL=1 gives the parent twice: the
// noise control (what two runs of the SAME code differ by). Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis,
// firebaseinstallations) and so is every other host. No key is read or written here.
//
// The screens that open a notice, a question window or the bar are driven the same way on both sides, in step: the albums screen (remove an album, the
// question and the one to type; the series, whose question is asked only after a read of the saved playlists that the blocked database refuses), the
// inventory (remove an item, its notices), the saved playlists (delete a batch or all), the playlists on the edit screen (a playlist on the phone), the
// shell (disconnect Spotify, the sign-in window), the Start screen (the search with nothing typed, three times) and the callback of Spotify, the
// notice of the blocked login on load, and a slow change of screen for the bar. The world the page is given is the same on both sides; where the built
// site hands no store, one line is added to the END of the main script when it is served (the same line on both sides, nothing published).
//
// After each step, on both sides: what the page says in each layer (the notices, the bar, the windows and the sheets: every element, attribute, text node and
// box), the focus, the lock on the page (the style of the body and its mark), the scroll, a picture, the errors of the page, and the TIMELINE: when each
// notice came, came in, went out and was taken away, when the bar showed and hid, when a window came and left, when the page was held and given back, and
// where the focus went, each in milliseconds from the first input of the step. A difference is written with where it is.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import { PNG } from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || '1280'
const CONTROL = process.env.CONTROL === '1'
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const TAG = `${ENGINE_NAME}-${PROFILE}${/^https?:/.test(process.argv[2] || '') ? '-dev' : ''}${CONTROL ? '-control' : ''}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const RAW = path.join(HERE, 'raw')
const SHOTS = path.join(HERE, 'figures')
fs.mkdirSync(RAW, { recursive: true })
fs.mkdirSync(SHOTS, { recursive: true })

const PROFILES = {
    1280: { phone: false, options: { viewport: { width: 1280, height: 900 } } },
    900: { phone: false, options: { viewport: { width: 900, height: 900 } } },
    899: { phone: true, options: { viewport: { width: 899, height: 900 } } },
    iphone14: { phone: true, touch: true, options: { ...devices['iPhone 14'] } },
    se: { phone: true, touch: true, options: { ...devices['iPhone SE'] } }
}
const P = PROFILES[PROFILE]
if (!P) throw new Error(`unknown profile ${PROFILE}`)
const PHONE = P.phone
const FRAME = 20 // one frame (16.7 ms at 60 Hz) and what a page can tell of it: the tolerance of a time that two runs of the same code may differ by

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 900) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
const SEAMS = (text) => {
    // the inventory store and the saved playlists store, put on `window` by one line at the end of the main script / the screen's file (the same on both sides)
    const inv = /class (\w+)\{constructor\(\)\{this\.albums=\[\],this\.loading=!1/.exec(text)
    if (inv) { const inst = new RegExp(`(\\w+)=new ${inv[1]}\\b`).exec(text)?.[1]; if (inst) return `${text}\n;window.__inv=${inst};` }
    const klass = text.match(/class ([\w$]+)\{constructor\(\)\{this\.generation=0,this\.userId=null,this\.listStatus/)
    if (klass) {
        const store = text.match(new RegExp(`([\\w$]+)=new ${klass[1].replace('$', '\\$')}\\b`))
        const reader = store && text.match(new RegExp(`([\\w$]+)=new [\\w$]+\\(\\{store:${store[1].replace('$', '\\$')}[,}]`))
        if (store && reader) return `${text}\n;window.__saved={store:${store[1]},reader:${reader[1]}};`
    }
    return text
}
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        let body = fs.readFileSync(file)
        if (/\/assets\/[^/]+\.js$/.test(url.pathname)) body = Buffer.from(SEAMS(body.toString('utf8')))
        const delay = server.delays.find(([pattern]) => pattern.test(url.pathname))
        setTimeout(() => { res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(body) }, delay ? delay[1] : 0)
    })
    server.delays = []
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

// ---- what is read from a page (the same text of code on both sides)
const NORMALIZE = () => {
    const fingerprint = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }
    const value = (el, name, v) => (name === 'style' ? el.style.cssText : name === 'class' ? v.split(/\s+/).filter(Boolean).sort().join(' ') : v)
    const attrs = (el) => [...el.attributes].map(({ name, value: v }) => [name, value(el, name, v)]).sort(([a], [b]) => a.localeCompare(b)).map(([n, v]) => ` ${n}="${v}"`).join('')
    const describe = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        const whole = `<${tag}${attrs(node)}>${[...node.childNodes].map(describe).join('')}</${tag}>`
        return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole)}"/>` : whole
    }
    const texts = (root) => { const out = []; const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3 && c.textContent.trim()) out.push(c.textContent); else if (c.nodeType === 1) walk(c) } }; walk(root); return JSON.stringify(out) }
    return (element) => {
        const clone = element.cloneNode(true)
        const live = [...element.querySelectorAll('input')]
        ;[...clone.querySelectorAll('input')].forEach((input, index) => { input.setAttribute('data-typed', live[index].value) })
        const boxes = [...element.querySelectorAll('*')].map((n, i) => { const r = n.getBoundingClientRect(); return `${i}:${n.tagName}:${[r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',')}` }).join(';')
        return describe(clone).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim() + '\n' + texts(element) + '\n' + boxes
    }
}
const READ = `(${NORMALIZE.toString()})()`
const LAYERS = '#toast-container, #globalProgress, .app-modal, .rank-window, #spotify-export-modal, .modal-overlay, .sheet'

/** The recorder: every thing the engines do to the page, with its time (performance.now), and every input. Installed before the page loads, the same on both sides. */
const RECORDER = () => {
    window.__tl = []
    window.__inputs = []
    const log = (kind, detail) => window.__tl.push({ t: performance.now(), kind, detail })
    const textOf = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    const isWindow = (el) => el.nodeType === 1 && el.matches?.('.app-modal, .rank-window, #spotify-export-modal, .modal-overlay, .sheet')
    const isToast = (el) => el.nodeType === 1 && el.matches?.('#toast-container > *')
    const toastState = (el) => (el.classList.contains('translate-x-0') ? 'in' : 'out')
    const state = new WeakMap()
    const watch = () => {
        new MutationObserver((records) => {
            for (const record of records) {
                if (record.type === 'childList') {
                    for (const node of record.addedNodes) {
                        if (isToast(node)) { if (!state.has(node)) { log('toast+', textOf(node) + ' ' + toastState(node)); state.set(node, toastState(node)) } }
                        else if (isWindow(node)) log('window+', node.id || node.className.split(' ')[0])
                        else if (node.nodeType === 1 && node.id === 'toast-container') {
                            log('toast-box+', '')
                            // a box that comes with a notice already in it (the React one) is told as the box, then each notice in it, as the hand-made one told them
                            node.querySelectorAll(':scope > *').forEach((toast) => { if (!state.has(toast)) { log('toast+', textOf(toast) + ' ' + toastState(toast)); state.set(toast, toastState(toast)) } })
                        }
                        else if (node.nodeType === 1 && node.id === 'globalProgress') log('bar+', node.style.display || 'none')
                    }
                    for (const node of record.removedNodes) {
                        if (isToast(node) || (node.nodeType === 1 && node.matches?.('.toast'))) log('toast-', textOf(node))
                        else if (isWindow(node)) log('window-', node.id || node.className.split(' ')[0])
                    }
                } else if (record.type === 'attributes') {
                    const el = record.target
                    if (el === document.body) log('body', `${el.dataset.scrollLocked || 'free'} ${el.style.position || ''}`)
                    else if (el.id === 'globalProgress') log('bar', el.style.display || 'none')
                    else if (el.nodeType === 1 && el.matches?.('#toast-container > *') && record.attributeName === 'class') {
                        const now = toastState(el)
                        if (state.get(el) !== now) { state.set(el, now); log('toast-' + now, textOf(el)) }
                    }
                }
            }
        }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'data-scroll-locked'] })
    }
    if (document.documentElement) watch(); else document.addEventListener('DOMContentLoaded', watch)
    document.addEventListener('focusin', (event) => { const e = event.target; const on = document.querySelector('.app-modal, .rank-window, #spotify-export-modal, .modal-overlay, .sheet') ? 'window on' : 'window off'; log('focus', `${e && e.tagName ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') : '?'} [${on}]`) }, true)
    for (const type of ['pointerdown', 'click', 'keydown']) document.addEventListener(type, () => window.__inputs.push(performance.now()), true)
    Date.prototype.toLocaleTimeString = () => '12:00:00 PM'
}

const browser = await ENGINE.launch()

// ---- the world
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>`)}`
const NAMES = ['Speak to Me', 'Breathe', 'On the Run', 'Time', 'The Great Gig in the Sky', 'Money', 'Us and Them', 'Any Colour You Like', 'Brain Damage', 'Eclipse']
const ARTISTS = ['Pink Floyd', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen']
const ITEMS = Array.from({ length: 12 }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`, title: `The Album ${i}`, artist: ARTISTS[i % ARTISTS.length], format: ['cd', 'vinyl', 'digital', null][i % 4], owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    purchasePrice: i % 2 === 0 ? 40 + i : null, currency: i % 4 === 0 ? 'BRL' : 'USD', notes: '',
    albumData: { id: `al-${i}`, title: `The Album ${i}`, artist: ARTISTS[i % ARTISTS.length], year: 1970 + i, coverUrl: cover(i * 29 % 360), tracks: NAMES.map((title, j) => ({ title, position: j + 1, duration: 60 + 31 * j })) },
    averages: { rating: 70 + i, popularity: 40 + i, ratedTracks: 7, popTracks: 7, tracks: 10 }, addedToInventory: `2026-10-${String(1 + i).padStart(2, '0')}T10:00:00.000Z`
}))
const ALBUMS_WORLD = `(async () => {
  const tracks = (j) => ${JSON.stringify(NAMES)}.map((t, i) => ({ title: t, position: i + 1, duration: 60 + 31 * i, rank: i % 2 ? undefined : i + 1, rating: i % 3 ? 70 + i : undefined, spotifyPopularity: i % 4 === 3 ? -1 : 25 + i * 6, userRank: undefined }))
  const make = (sid, j, artist, title) => ({ id: sid + '-' + j, title, artist, year: String(1970 + j), releaseDate: (1970 + j) + '-01-01', type: 'Album', coverUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(' + (j * 40) + ',45%,35%)"/></svg>'),
    tracks: tracks(j), hasUserRanking: false, bestEverAlbumId: null, spotifyId: null, seriesIds: [sid], getTracks: () => tracks(j) })
  const series = [{ id: 's0', name: 'Floyd', createdAt: new Date(2026, 0, 10), albumQueries: Array.from({ length: 4 }, (_, j) => ({ artist: 'Pink Floyd', title: 'Album ' + j })) }]
  window.albumLoadService.load = () => {}
  window.albumLoadService.refreshSource = () => {}
  window.albumSeriesStore.setSeries(series)
  window.albumLoadStore.setSeriesOrder(['s0'])
  const all = []
  series[0].albumQueries.forEach((q, j) => { all.push(make('s0', j, q.artist, q.title)) })
  window.albumLoadStore.setSeriesEntries('s0', series[0].albumQueries.map((q, j) => ({ key: (q.artist + ' - ' + q.title).toLowerCase(), seriesId: 's0', query: q, status: 'found', error: null, album: all[j], enrichment: { acclaim: 'done', popularity: 'empty', userRanking: 'not-connected' } })))
  window.albumsStore.setAlbumsBySeries({ ALL_SERIES_VIEW: all })
  window.albumLoadStore.flush()
})()`
const GENERATED = () => {
    const track = (title, album, duration = 200) => ({ id: `t-${title}`, title, artist: 'Artist', album, duration })
    return [
        { id: 'g1', name: 'Greatest Hits', title: 'Greatest Hits', batchName: 'Mix', tracks: [track('One', 'A'), track('Two', 'A'), track('Three', 'B')] },
        { id: 'g2', name: 'Deep Cuts', title: 'Deep Cuts', batchName: 'Mix', tracks: [track('Four', 'C'), track('Nowhere Man', 'D')] }
    ]
}

async function open(base, surface, options = {}) {
    const context = await browser.newContext({ ...P.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
    await context.route(url => new URL(url).hostname !== '127.0.0.1', route => route.abort())
    await context.route(BLOCKED, route => route.abort())
    await context.addInitScript(`(${RECORDER.toString()})()`)
    if (options.spotify) await context.addInitScript(() => { try { localStorage.setItem('spotify_access_token', 'proof-token'); localStorage.setItem('spotify_expires_at', String(Date.now() + 3600000)) } catch { /* none */ } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) })
    await page.goto(base + (options.url || '/start'), { waitUntil: 'load' })
    await page.waitForFunction(() => window.router && document.getElementById('app'), null, { timeout: 40000 })
    if (!options.keepLoginNotice) await page.waitForTimeout(options.settle ?? 5600) // the notice of the blocked login comes seconds after the load and leaves after 4 s, on either side
    if (options.keepLoginNotice) return { context, page, errors }
    await surfaces[surface]?.(page)
    await page.waitForTimeout(800)
    await page.evaluate(() => { window.__tl = []; window.__inputs = [] })
    return { context, page, errors }
}

const surfaces = {
    start: async () => { },
    albums: async (page) => {
        await page.evaluate(() => window.router.navigate('/albums'))
        await page.waitForFunction(() => window.albumLoadService && window.albumLoadStore && window.albumSeriesStore && window.albumsStore && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
        await page.waitForTimeout(1200)
        await page.evaluate(ALBUMS_WORLD)
        await page.waitForSelector('[data-action="view-modal"]', { timeout: 10000 })
    },
    inventory: async (page) => {
        await page.evaluate(() => window.router.navigate('/inventory'))
        await page.waitForFunction(() => window.__inv, null, { timeout: 20000 })
        await page.evaluate((items) => window.__inv.setAlbums(items), ITEMS)
        await page.waitForSelector(PHONE ? '.inv-row, .inv-tile' : '.inventory-card-wrapper', { timeout: 10000 })
    },
    saved: async (page) => {
        await page.evaluate(() => window.router.navigate('/saved-playlists'))
        await page.waitForSelector('#genericSearch', { timeout: 20000 })
        await page.waitForFunction(() => window.__saved, null, { timeout: 20000 })
        await page.evaluate(() => {
            window.__saved.reader.load = () => new Promise(() => {})
            window.__saved.reader.refreshSeries = () => Promise.resolve()
            const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
            const playlist = (id, batchName, tracks) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks })
            const playlists = [playlist('p1', 'Sunday mix', [track('One', 'Physical Graffiti', 510), track('Two', 'Led Zeppelin II', 275)]), playlist('p2', 'Sunday mix', [track('Three', 'Raising Sand', 200)])]
            const entry = { seriesId: 's1abcdefghij', series: { id: 's1abcdefghij', name: 'Plant', updatedAt: '2026-11-01T00:00:00Z' }, status: 'ready', error: null, refreshing: false, thumbnails: [], playlists, batches: [{ name: 'Sunday mix', savedAt: '2026-11-01T10:00:00Z', playlists }] }
            window.__saved.store.begin(1, 'u1')
            window.__saved.store.setSeries([entry])
            window.__saved.store.flush()
        })
        await page.waitForTimeout(1500)
        if (PHONE) {
            await page.locator('.saved-series-toggle').first().click()
            await page.waitForTimeout(600)
        }
    },
    edit: async (page) => {
        await page.addScriptTag({ content: `window.__generated = ${GENERATED.toString()}` })
        await page.evaluate(() => { window.playlistsStore.setPlaylists(window.__generated(), 'sA'); window.playlistsStore.setBatchName('Mix'); window.router.navigate('/playlists') })
        await page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
        await page.waitForTimeout(1200)
    }
}

/** The pixels two pictures differ by: below the top bar (the page, the notices, the windows) and in it (the equalizer of the bar moves on its own: parent against parent differs in the same place). */
const TOP_BAR = 80
function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, top: 0, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, top = 0, delta = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (!d) continue
        const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width)
        if (y < TOP_BAR) { top++; continue }
        apart++; delta = Math.max(delta, d); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
    return { apart, top, delta, box: apart ? `x ${x0}-${x1}, y ${y0}-${y1}` : '' }
}

const layersNow = (page) => page.evaluate(`(() => { const read = ${READ}; return [...document.querySelectorAll('${LAYERS}')].map(el => read(el)).join('\\n#####\\n') })()`)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className).split(' ')[0]}` })
const lockNow = (page) => page.evaluate(() => `${document.body.getAttribute('style') || ''} | ${document.body.dataset.scrollLocked || 'free'} | scrollY ${Math.round(window.scrollY)}`)
const noticesNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('#toast-container .toast')].map(e => e.textContent.trim().replace(/\s+/g, ' '))))
/** The events since the last read, as they came (performance.now), with the inputs of the step. */
const timelineNow = (page) => page.evaluate(() => {
    const raw = { events: window.__tl, inputs: window.__inputs }
    window.__tl = []; window.__inputs = []
    return raw
})
/**
 * What an event is measured from: a notice's coming, from the input that made it; its going in, going out and away, from its own coming; everything else,
 * from the latest input before it (or from the start of the step). That is the engine's own time, whatever the pace of the script between two inputs.
 */
function relative({ events, inputs }, begun) {
    const made = {}
    const out = []
    for (const e of events) {
        const latest = inputs.filter(t => t <= e.t).pop()
        let base = latest ?? begun
        const text = String(e.detail).replace(/ (in|out)$/, '')
        if (e.kind === 'toast+') (made[text] ||= []).push(e.t)
        else if (/^toast-(in|out)?$/.test(e.kind) && made[text]?.length) { base = made[text][0]; if (e.kind === 'toast-') made[text].shift() }
        out.push([Math.round((e.t - base) * 10) / 10, e.kind, e.detail])
    }
    return out
}

/**
 * Does the step on both sides and compares what it left. `run(page, side, snap)` may take pictures of the moment with `snap(label, { shot })` (the layers, the
 * notices, the focus, the lock, and, with `shot`, the pixels of the page), each compared with the same one of the other side. `time`: the timeline is read from
 * the first input of the step (or from the load, with `fromLoad`). What is compared at the end of the step is the page as it stands.
 */
async function step(label, sides, run, { wait = 1000, time = true, shoot = true, fromLoad = false } = {}) {
    const timelines = []
    for (const side of sides) {
        if (side.opening) Object.assign(side, await side.opening())
        side.snaps = {}
        const begun = fromLoad ? 0 : await side.page.evaluate(() => performance.now())
        side.at = (ms) => side.page.waitForFunction(([ms, begun]) => performance.now() >= (window.__inputs.length ? window.__inputs[0] : begun) + ms, [ms, begun], { polling: 'raf', timeout: 30000 })
        const snap = async (name, { shot = false } = {}) => {
            side.snaps[name] = { layers: await layersNow(side.page), notices: await noticesNow(side.page), focus: await focusNow(side.page), lock: await lockNow(side.page), shot: shot ? await side.page.screenshot({ animations: 'disabled', caret: 'hide' }) : null }
        }
        await run(side.page, side, snap)
        await side.page.waitForTimeout(wait)
        await snap('end', { shot: shoot })
        const raw = await timelineNow(side.page)
        if (fromLoad) {
            const first = raw.events.find(e => e.kind !== 'bar+')
            side.firstEvent = first ? Math.round(first.t) : null
            timelines.push(relative(raw, first ? first.t : 0))
        } else timelines.push(relative(raw, begun))
    }
    const [a, b] = sides
    if (fromLoad) note(`${TAG} · ${label} · when the first notice came, from the start of the load (told, not compared: it is the time the blocked login took to fail)`, true, `${a.name} ${a.firstEvent} ms, ${b.name} ${b.firstEvent} ms`)
    const keep = (events) => events.filter(([, kind]) => kind !== 'bar+' && (time || kind !== 'focus'))
    // The page tells a removal one microtask after it happened (the observer's notice), and a focus at once: when a focus says «window off», the window had left before it,
    // whichever of the two lines comes first. They are put in the order they happened in, the same way on both sides.
    const inOrder = (events) => {
        const out = [...events]
        for (let i = 0; i + 1 < out.length; i++) if (out[i][1] === 'focus' && /\[window off\]$/.test(out[i][2]) && out[i + 1][1] === 'window-') { [out[i], out[i + 1]] = [out[i + 1], out[i]]; i = Math.max(-1, i - 2) }
        return out
    }
    const kinds = (events) => inOrder(keep(events)).map(([, kind, detail]) => `${kind} ${detail}`)
    const [ka, kb] = [kinds(timelines[0]), kinds(timelines[1])]
    const same = JSON.stringify(ka) === JSON.stringify(kb)
    note(`${TAG} · ${label} · the timeline: what happened, in order`, same, same ? `${ka.length} events: ${ka.join(' → ').slice(0, 240)}` : `\n parent: ${ka.join(' → ')}\n mine:   ${kb.join(' → ')}`)
    if (same && ka.length) {
        const [ta, tb] = [inOrder(keep(timelines[0])), inOrder(keep(timelines[1]))]
        const deltas = ta.map(([t], i) => Math.abs(t - tb[i][0]))
        const worst = Math.max(...deltas)
        const at = deltas.indexOf(worst)
        const within = deltas.filter(d => d <= FRAME).length
        note(`${TAG} · ${label} · the timeline: when (±1 frame, ${FRAME} ms)`, worst <= FRAME, `${within} of ${deltas.length} events within a frame, the worst ${worst.toFixed(1)} ms (${ta[at][1]} ${ta[at][2]}: ${ta[at][0]} against ${tb[at][0]})`)
    }
    for (const name of Object.keys(a.snaps)) {
        const [x, y] = [a.snaps[name], b.snaps[name]]
        const where = `${label} · ${name === 'end' ? 'at the end' : name}`
        note(`${TAG} · ${where} · the layers (notices, bar, windows, sheets: elements, text nodes, boxes)`, x.layers === y.layers, x.layers === y.layers ? `${x.layers.length} chars` : `\n parent: ${x.layers.slice(0, 500)}\n mine:   ${y.layers.slice(0, 500)}`)
        note(`${TAG} · ${where} · the focus`, x.focus === y.focus, `${x.focus} | ${y.focus}`)
        note(`${TAG} · ${where} · the page lock and the scroll`, x.lock === y.lock, x.lock === y.lock ? x.lock : `\n parent: ${x.lock}\n mine:   ${y.lock}`)
        note(`${TAG} · ${where} · the notices on screen (text)`, x.notices === y.notices, x.notices === y.notices ? x.notices.slice(0, 200) : `\n parent: ${x.notices}\n mine:   ${y.notices}`)
        if (x.shot && y.shot) {
            const diff = pixelsApart(x.shot, y.shot)
            note(`${TAG} · ${where} · the picture of the page (below the top bar)`, diff.apart === 0, `${diff.apart === 0 ? 'same pixels' : `${diff.apart} pixels apart, the most ${diff.delta}/255, in ${diff.box}`}; in the top bar: ${diff.top}`)
            if (diff.apart) { const stem = `${TAG}-${label}-${name}`.replace(/\W+/g, '-').slice(0, 90); fs.writeFileSync(path.join(SHOTS, `${stem}-parent.png`), x.shot); fs.writeFileSync(path.join(SHOTS, `${stem}-mine.png`), y.shot) }
        }
    }
    for (const side of sides) { const e = side.errors.splice(0); note(`${TAG} · ${label} · errors of the page (${side.name})`, e.length === 0, e.join(' | ')) }
}

const tap = (page, selector, index = 0) => (P.touch ? page.locator(selector).nth(index).tap() : page.locator(selector).nth(index).click())
const SCENARIOS = {}

SCENARIOS.load = async (mk) => {
    // the notice of the blocked login: it comes on its own some seconds after the load, and leaves after 4 s (the clock is the load's)
    const sides = await mk('start', { keepLoginNotice: true, deferred: true })
    await step('the notice of the blocked login on load: it comes and goes', sides, async (page, side, snap) => {
        await side.at(2000)
        await snap('shown', { shot: true })
        await side.at(6000)
    }, { wait: 300, shoot: false, fromLoad: true })
    return sides
}
SCENARIOS.search = async (mk) => {
    const sides = await mk('start')
    const search = '#btnScanArtist'
    await step('Start: Search with nothing typed, three times: three notices stacked, then each goes on its own time', sides, async (page, side, snap) => {
        for (let i = 0; i < 3; i++) { await tap(page, search); await page.waitForTimeout(150) }
        await side.at(900)
        await snap('three notices', { shot: true })
        await side.at(3900)
        await snap('still there, a moment before the first goes')
        await side.at(5400)
        await snap('all gone')
    }, { wait: 300 })
    return sides
}
SCENARIOS.callback = async (mk) => {
    const sides = await mk('start')
    await step('/callback: the notice «Failed to connect to Spotify», the way back to Start, and the notice goes', sides, async (page, side, snap) => {
        await page.evaluate(() => window.router.navigate('/callback'))
        await side.at(900)
        await snap('the notice', { shot: true })
        await side.at(5000)
    }, { wait: 300 })
    return sides
}
const albumRemove = async (page) => {
    if (PHONE) { await tap(page, '.album-more'); await page.waitForTimeout(800); await page.locator('.sheet [data-action="remove-album"], .sheet button:has-text("Remove")').first().tap() } else await tap(page, '[data-action="remove-album"]')
}
SCENARIOS.album = async (mk) => {
    const sides = await mk('albums')
    await step('Albums: «Remove album» opens the question; the backdrop and the panel do nothing; Escape is Cancel', sides, async (page, side, snap) => {
        await albumRemove(page)
        await page.waitForTimeout(600)
        await snap('the question', { shot: true })
        await page.mouse.click(5, 5)
        await page.waitForTimeout(100)
        await page.locator('#confirm-modal .app-modal__panel').click({ position: { x: 20, y: 20 } })
        await page.waitForTimeout(200)
        await snap('after the backdrop and the panel')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await snap('after Escape', { shot: true })
    }, { wait: 300 })
    await step('Albums: the question and the cross, then the question and «Cancel»', sides, async (page, side, snap) => {
        await albumRemove(page)
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal .app-modal__close')
        await page.waitForTimeout(400)
        await snap('after the cross')
        await albumRemove(page)
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal [data-action="cancel"]')
        await page.waitForTimeout(400)
    }, { wait: 300 })
    await step('Albums: the question and «Remove»: the notice (or the question to type) that follows', sides, async (page, side, snap) => {
        await albumRemove(page)
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.waitForTimeout(1500)
        await snap('after Remove', { shot: true })
        if (await page.locator('#input-modal').count()) {
            await page.waitForTimeout(100)
            await page.keyboard.type('Album 1')
            await page.waitForTimeout(150)
            await snap('typed', { shot: true })
            await page.keyboard.press('Enter')
            await page.waitForTimeout(1500)
            await snap('after Enter', { shot: true })
        }
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.inventory = async (mk) => {
    const sides = await mk('inventory')
    const openQuestion = async (page) => {
        if (PHONE) { await tap(page, '.inv-row__more, .inv-tile__more, [data-action="item-more"]'); await page.waitForTimeout(800); await page.locator('.sheet [data-action="delete-modal"], .sheet button:has-text("Remove"), .sheet button:has-text("Delete")').first().tap() } else await tap(page, '.delete-album-btn')
    }
    await step('Inventory: «Delete» opens the question; Escape is Cancel', sides, async (page, side, snap) => {
        await openQuestion(page)
        await page.waitForTimeout(600)
        await snap('the question', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await snap('after Escape', { shot: true })
    }, { wait: 300 })
    await step('Inventory: the question and «Cancel», then the question and «Remove»: the notice of the refused write, and it goes', sides, async (page, side, snap) => {
        await openQuestion(page)
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal [data-action="cancel"]')
        await page.waitForTimeout(400)
        await snap('after Cancel')
        await openQuestion(page)
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.waitForTimeout(1500)
        await snap('after Remove', { shot: true })
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.saved = async (mk) => {
    const sides = await mk('saved')
    const del = '[data-action="delete-batch"], [data-action="delete-all"], .batch-delete, button[title*="elete"]'
    // the computer: the button of the batch; the phone: the batch's «⋯» and the «Delete batch» of its sheet
    const openQuestion = async (page) => {
        if (PHONE) { await page.locator('[aria-label^="Actions for batch"]').first().tap(); await page.waitForTimeout(900); await page.locator('.sheet button:has-text("Delete batch")').first().tap() } else await tap(page, del)
    }
    await step('Saved playlists: «Delete» opens the question; Escape is Cancel; again, «Delete»: the notice of the refused write', sides, async (page, side, snap) => {
        if (!PHONE) await page.locator('.batch-header').first().click().catch(() => { })
        await page.waitForTimeout(400)
        await openQuestion(page)
        await page.waitForTimeout(600)
        await snap('the question', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
        await snap('after Escape')
        if (PHONE && (await page.locator('.sheet').count())) await page.locator('.sheet button:has-text("Delete batch")').first().tap(); else await openQuestion(page)
        await page.waitForTimeout(700)
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.waitForTimeout(1500)
        await snap('after Delete', { shot: true })
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.shell = async (mk) => {
    const sides = await mk('start', { spotify: true })
    const menu = PHONE ? '#phoneMenuBtn' : '#userMenuBtn'
    const disconnect = '[data-connection="spotify"] [data-action="disconnect"]:visible'
    await step('Shell: the account panel, «Disconnect» Spotify opens the question; Escape is Cancel; again, confirm: the notice «Disconnected»', sides, async (page, side, snap) => {
        await tap(page, menu)
        await page.waitForTimeout(600)
        await page.locator(disconnect).first().click()
        await page.waitForTimeout(600)
        await snap('the question', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await snap('after Escape')
        if (await page.locator(disconnect).count() === 0) { await tap(page, menu); await page.waitForTimeout(500) }
        await page.locator(disconnect).first().click()
        await page.waitForTimeout(600)
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.waitForTimeout(1000)
        await snap('after Disconnect', { shot: true })
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.signin = async (mk) => {
    const sides = await mk('start', { url: '/start?signin' })
    await step('Sign in: the window opens from the entry link; Google with the login blocked gives a notice, and it goes', sides, async (page, side, snap) => {
        await snap('the window', { shot: true })
        await page.locator('#googleLoginBtn').click({ timeout: 3000 }).catch(() => { })
        await page.waitForTimeout(2500)
        await snap('after Google')
        await page.waitForTimeout(4500)
    }, { wait: 300, shoot: false })
    return sides
}
SCENARIOS.playlists = async (mk) => {
    const sides = await mk('edit')
    await step('Playlists: «Regenerate» with no series gives a notice, and it goes', sides, async (page, side, snap) => {
        if (PHONE) { await page.locator('[data-action="toggle-regenerate-panel"]').first().evaluate(el => el.click()).catch(() => { }) } else await tap(page, '[data-action="toggle-regenerate-panel"]')
        await page.waitForTimeout(800)
        await snap('the panel', { shot: true })
        await page.locator('[data-action="regenerate-playlists"]').first().evaluate(el => el.click())
        await page.waitForTimeout(1500)
        await snap('after Regenerate', { shot: true })
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.playlistDelete = async (mk) => {
    // the phone: deleting a whole playlist is asked first, from its sheet (the computer deletes on one click, with no question)
    if (!PHONE) { note(`${TAG} · playlistDelete · on the computer a playlist is deleted on one click: no question to prove`, true); return [] }
    const sides = await mk('edit')
    await step('Playlists on the phone: «Delete this playlist» asks; Escape is Cancel; again, «Delete playlist»', sides, async (page, side, snap) => {
        const open = async () => { await tap(page, '.phone-more'); await page.waitForTimeout(900); await page.locator('.sheet .phone-sheet-action--danger').last().tap() }
        await open()
        await page.waitForTimeout(700)
        await snap('the question over the sheet', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
        await snap('after Escape', { shot: true })
        if (!(await page.locator('.sheet').count())) await open(); else await page.locator('.sheet .phone-sheet-action--danger').last().tap()
        await page.waitForTimeout(700)
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.waitForTimeout(1500)
        await snap('after Delete playlist', { shot: true })
        await page.waitForTimeout(4500)
    }, { wait: 300 })
    return sides
}
SCENARIOS.progress = async (mk, servers) => {
    // a slow change of screen: the bar shows after its delay and hides when the screen is in. The files of the screens come 1.6 s late (and the screens of the menu come
    // down in the background one after the other, so a second change of screen right after the first finds its file still on the way). Each side is opened inside its own step,
    // so that both go through the same minutes of the same load.
    for (const server of servers) server.delays.push([/\/assets\/index-[^/]*\.js$/, 1600])
    const sides = await mk('start', { settle: 0, deferred: true })
    await step('the bar: a slow change of screen to the albums, and right after it to the playlists', sides, async (page, side, snap) => {
        await page.evaluate(() => window.router.navigate('/albums'))
        await side.at(900)
        await snap('during the first', { shot: false })
        await side.at(2300)
        await snap('between')
        await page.evaluate(() => window.router.navigate('/playlists'))
        await page.waitForTimeout(900)
        await snap('during the second', { shot: false })
        await page.waitForTimeout(2600)
    }, { wait: 300, shoot: false })
    return sides
}

// ---- the engines called directly, on the dev servers of both trees (MODE=dev: the arguments are the two addresses). The modules are the very ones the app uses, so a
// notice called here is drawn by the shell of the app, and a question is put on the page the way a screen puts it: every kind of notice, every question (the one to
// type included, which no screen of the app reaches today), the bar.
const MODULES = {
    parent: { toast: '/js/components/Toast.js', dialogs: '/js/services/DialogService.js', progress: '/js/components/GlobalProgress.js' },
    mine: { toast: '/js/stores/toasts.js', dialogs: '/js/ui/dialogs/dialogs.ts', progress: '/js/stores/progress.js' },
    'parent again': { toast: '/js/components/Toast.js', dialogs: '/js/services/DialogService.js', progress: '/js/components/GlobalProgress.js' }
}
const useEngines = async (side) => {
    await side.page.evaluate(async (paths) => {
        const [t, d, p] = await Promise.all([import(paths.toast), import(paths.dialogs), import(paths.progress)])
        window.__e = { toast: t.toast, showToast: t.showToast, dialogs: d.dialogService, progress: p.globalProgress, answers: [] }
        window.__ask = (promise, label) => promise.then(v => window.__e.answers.push(`${label}: ${JSON.stringify(v === undefined ? 'undefined' : v)}`))
    }, MODULES[side.name])
}
const answersNow = (page) => page.evaluate(() => JSON.stringify(window.__e.answers))
SCENARIOS.directToasts = async (mk) => {
    const sides = await mk('start')
    for (const side of sides) await useEngines(side)
    await step('every kind of notice, stacked, each on its own time, and the close button', sides, async (page, side, snap) => {
        await page.evaluate(() => { const { toast } = window.__e; toast.success('A success notice'); setTimeout(() => toast.error('An error notice'), 250); setTimeout(() => toast.warning('A warning notice', 2500), 500); setTimeout(() => toast.info('An info notice'), 750) })
        await side.at(1100)
        await snap('four notices', { shot: true })
        await tap(page, '#toast-container .toast:nth-child(2) .toast-close')
        await side.at(1500)
        await snap('the second one closed by its button')
        await side.at(3200)
        await snap('the warning gone by its own 2.5 s')
        await side.at(5600)
        await snap('all gone')
    }, { wait: 300 })
    await step('showToast with each argument, a text that is text, a duration of zero', sides, async (page, side, snap) => {
        await page.evaluate(() => { const { showToast } = window.__e; showToast('Plain'); showToast('<img src=x onerror="window.__xss=1"> & "quoted"', 'error', 1200); showToast('Zero', 'success', 0) })
        await side.at(600)
        await snap('three', { shot: true })
        await side.at(5000)
        await snap('all gone')
    }, { wait: 300 })
    return sides
}
SCENARIOS.directProgress = async (mk) => {
    const sides = await mk('start')
    for (const side of sides) await useEngines(side)
    await step('the bar: two loaders, one finishes, the other, and the 200 ms', sides, async (page, side, snap) => {
        await page.evaluate(() => { const { progress } = window.__e; progress.start(); setTimeout(() => progress.start(), 100); setTimeout(() => progress.finish(), 400); setTimeout(() => progress.finish(), 900) })
        await side.at(300)
        await snap('showing', { shot: true })
        await side.at(700)
        await snap('one of two done')
        await side.at(1500)
        await snap('hidden')
        await page.evaluate(() => { window.__e.progress.start() })
        await side.at(1700)
        await snap('a new loader shows it again')
        await page.evaluate(() => { window.__e.progress.forceHide() })
        await side.at(1900)
        await snap('forced')
    }, { wait: 300, shoot: false })
    return sides
}
SCENARIOS.directQuestions = async (mk) => {
    const sides = await mk('start')
    for (const side of sides) await useEngines(side)
    const ask = (page, code) => page.evaluate(code)
    await step('confirm: the window, the backdrop and the panel do nothing, Escape answers false', sides, async (page, side, snap) => {
        await page.evaluate(() => { window.__ask(window.__e.dialogs.confirm({ title: 'Delete the series?', message: 'It cannot be undone.', variant: 'danger', confirmText: 'Delete' }), 'confirm Escape') })
        await page.waitForTimeout(500)
        await snap('open', { shot: true })
        await page.mouse.click(5, 5)
        await page.locator('#confirm-modal .app-modal__panel').click({ position: { x: 20, y: 20 } })
        await snap('after the backdrop and the panel')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await snap('after Escape', { shot: true })
    }, { wait: 300 })
    await step('confirm: the cross, Cancel and Delete', sides, async (page, side, snap) => {
        const open = (label) => page.evaluate((label) => { window.__ask(window.__e.dialogs.confirm({ title: 'Delete?', message: 'Sure?', variant: 'warning' }).then((v) => { window.__e.answers.push(`${label}: the window was ${document.getElementById('confirm-modal') ? 'STILL ON' : 'off'} the page when the caller went on`); return v }), label) }, label)
        await open('cross'); await page.waitForTimeout(400); await tap(page, '#confirm-modal .app-modal__close'); await page.waitForTimeout(300)
        await open('cancel'); await page.waitForTimeout(400); await tap(page, '#confirm-modal [data-action="cancel"]'); await page.waitForTimeout(300)
        await open('confirm'); await page.waitForTimeout(400); await tap(page, '#confirm-modal [data-action="confirm"]'); await page.waitForTimeout(300)
        await snap('closed')
        await ask(page, '1')
        side.answers = await answersNow(page)
    }, { wait: 300 })
    note(`${TAG} · confirm: what each answered`, sides[0].answers === sides[1].answers, `${sides[0].answers} | ${sides[1].answers}`)
    await step('prompt: the field takes the focus a frame later, the button is off until there is text, Enter answers, Escape answers null', sides, async (page, side, snap) => {
        await page.evaluate(() => { window.__ask(window.__e.dialogs.prompt({ title: 'Name the series', message: 'Pick a name.', label: 'Name', placeholder: 'A name' }), 'prompt Enter') })
        await page.waitForTimeout(400)
        await snap('open, empty', { shot: true })
        await page.keyboard.type('   ')
        await snap('only spaces')
        await page.keyboard.press('Enter')
        await snap('Enter on spaces does nothing')
        await page.keyboard.type('Rock classics')
        await snap('typed', { shot: true })
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)
        await snap('answered by Enter')
        await page.evaluate(() => { window.__ask(window.__e.dialogs.prompt({ title: 'Rename', initialValue: 'Old name' }), 'prompt Escape') })
        await page.waitForTimeout(400)
        await snap('open, with a name', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await snap('after Escape')
        await page.evaluate(() => { window.__ask(window.__e.dialogs.prompt({ title: 'Save it' }), 'prompt Save') })
        await page.waitForTimeout(300)
        await page.keyboard.type('Jazz')
        await tap(page, '#input-modal .app-modal__footer button:last-child')
        await page.waitForTimeout(300)
        side.answers = await answersNow(page)
    }, { wait: 300 })
    note(`${TAG} · prompt: what each answered`, sides[0].answers === sides[1].answers, `${sides[0].answers} | ${sides[1].answers}`)
    await step('alert, and one window taking the place of another', sides, async (page, side, snap) => {
        await page.evaluate(() => { window.__ask(window.__e.dialogs.alert('Heads up', 'Something happened.'), 'alert') })
        await page.waitForTimeout(400)
        await snap('alert', { shot: true })
        await tap(page, '#confirm-modal [data-action="confirm"]')
        await page.evaluate(() => { window.__ask(window.__e.dialogs.confirm({ title: 'First', message: '1' }), 'first'); window.__ask(window.__e.dialogs.prompt({ title: 'Second' }), 'second') })
        await page.waitForTimeout(500)
        await snap('the second took the place', { shot: true })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        side.answers = await answersNow(page)
    }, { wait: 300 })
    note(`${TAG} · alert and replacing: what each answered`, sides[0].answers === sides[1].answers, `${sides[0].answers} | ${sides[1].answers}`)
    return sides
}

// ---- run
const DEV = /^https?:/.test(oldDist)
const alone = (base) => ({ base, server: { delays: [], close() { } } })
const oldSite = DEV ? alone(oldDist) : await serve(oldDist)
const newSite = DEV ? alone(CONTROL ? oldDist : newDist) : await serve(CONTROL ? oldDist : newDist)
const names = Object.keys(SCENARIOS).filter(name => DEV === name.startsWith('direct')).filter(name => !ONLY.length || ONLY.includes(name))
for (const name of names) {
    console.log(`--- ${name}`)
    const opened = []
    const mk = async (surface, options = {}) => {
        const names = ['parent', CONTROL ? 'parent again' : 'mine']
        const bases = [oldSite.base, newSite.base]
        // `deferred`: a side is opened inside its own step, so that what the load does (the notice of the blocked login) is read by the clock of the load
        const sides = options.deferred ? bases.map((base, i) => ({ name: names[i], opening: () => open(base, surface, options) })) : [await open(bases[0], surface, options), await open(bases[1], surface, options)]
        sides.forEach((side, i) => { side.name = names[i] })
        opened.push(...sides)
        return sides
    }
    try { await SCENARIOS[name](mk, [oldSite.server, newSite.server]) } catch (error) { note(`${TAG} · ${name} · the scenario ran to its end`, false, error.message.split('\n')[0]) }
    for (const side of opened) await side.context?.close()
    oldSite.server.delays = []; newSite.server.delays = []
}
await browser.close()
oldSite.server.close(); newSite.server.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(0)
