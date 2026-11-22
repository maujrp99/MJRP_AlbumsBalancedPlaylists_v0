// F83 wave 8c: the browser proof of the phone's sheet in React (this branch) against the hand-made one of the parent (1693d71), on the BUILT sites.
//
//   ENGINE=chromium|webkit PROFILE=1280|900|899|iphone14|se [CONTROL=1] [ONLY=name,name] node browser-proof.mjs <dist of the parent> <dist of this branch>
//
// Two builds are served by a small static server with the fallback to app.html (as the hosting answers a deep route). CONTROL=1 gives the parent twice: the
// noise control (what two runs of the SAME code differ by). Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis,
// firebaseinstallations) and so is every other host. No key is read or written here.
//
// Every sheet a phone screen opens is opened BY A TAP, on both sides in step, and closed each way it can be closed (its button, Escape, a tap outside, a drag
// down). After each step, on both sides: what the page says in the sheet layer (every element, attribute, text node and box), the focus, the lock on the page
// (the style of the body, its mark and the scroll: the page position before and after), a picture, the errors of the page, and the TIMELINE: when the sheet
// came, when it was marked as closing, when it left the page, when the page was held and given back, where the focus went, each in milliseconds from the cause
// (the last input before it). A difference is written with where it is. On the computer (1280, 900) the same flows run and prove that no sheet appears and
// nothing changed there.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import { PNG } from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const OUT = process.env.OUT || HERE
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || '1280'
const CONTROL = process.env.CONTROL === '1'
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const TAG = `${ENGINE_NAME}-${PROFILE}${CONTROL ? '-control' : ''}${process.env.RUN ? '-r' + process.env.RUN : ''}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const RAW = path.join(OUT, 'raw')
const SHOTS = path.join(OUT, 'figures')
fs.mkdirSync(RAW, { recursive: true })
fs.mkdirSync(SHOTS, { recursive: true })

const PROFILES = {
    1280: { phone: false, options: { viewport: { width: 1280, height: 900 } } },
    900: { phone: false, options: { viewport: { width: 900, height: 900 } } },
    899: { phone: true, touch: true, options: { viewport: { width: 899, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
    pixel: { phone: true, touch: true, options: { ...devices['Pixel 7'] } },
    iphone14: { phone: true, touch: true, options: { ...devices['iPhone 14'] } },
    se: { phone: true, touch: true, options: { ...devices['iPhone SE'] } }
}
const P = PROFILES[PROFILE]
if (!P) throw new Error(`unknown profile ${PROFILE}`)
const PHONE = P.phone
const FRAME = 20 // one frame (16.7 ms at 60 Hz) and what a page can tell of it

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
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(body)
    })
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
    return (element, withBoxes = true) => {
        const clone = element.cloneNode(true)
        const live = [...element.querySelectorAll('input')]
        ;[...clone.querySelectorAll('input')].forEach((input, index) => { input.setAttribute('data-typed', live[index].value) })
        const boxes = !withBoxes ? '' : [element, ...element.querySelectorAll('*')].map((n, i) => { const r = n.getBoundingClientRect(); return `${i}:${n.tagName}:${[r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',')}` }).join(';')
        return describe(clone).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim() + '\n' + texts(element) + '\n' + boxes
    }
}
const READ = `(${NORMALIZE.toString()})()`
const LAYERS = '.sheet, .app-modal, .rank-window, #spotify-export-modal, .modal-overlay'

/** The recorder: every thing the sheet does to the page, with its time (performance.now), and every input. Installed before the page loads, the same on both sides. */
const RECORDER = () => {
    window.__tl = []
    window.__inputs = []
    const log = (kind, detail) => window.__tl.push({ t: performance.now(), kind, detail })
    const ids = new WeakMap()
    let serial = 0
    const idOf = (el) => { if (!ids.has(el)) ids.set(el, ++serial); return ids.get(el) }
    const isSheet = (el) => el.nodeType === 1 && el.matches?.('.sheet')
    const isWindow = (el) => el.nodeType === 1 && el.matches?.('.app-modal, .rank-window, #spotify-export-modal, .modal-overlay')
    const watch = () => {
        new MutationObserver((records) => {
            for (const record of records) {
                if (record.type === 'childList') {
                    for (const node of record.addedNodes) { if (isSheet(node)) log('sheet+', `#${idOf(node)} ${node.className}`); else if (isWindow(node)) log('window+', node.id || node.className.split(' ')[0]) }
                    for (const node of record.removedNodes) { if (isSheet(node)) log('sheet-', `#${idOf(node)}`); else if (isWindow(node)) log('window-', node.id || node.className.split(' ')[0]) }
                } else if (record.type === 'attributes') {
                    const el = record.target
                    if (el === document.body) log('body', `${el.dataset.scrollLocked || 'free'} ${el.style.position || ''}`)
                    else if (isSheet(el) && record.attributeName === 'class') log('sheet-class', `#${idOf(el)} ${el.className}`)
                }
            }
        }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'data-scroll-locked'] })
    }
    if (document.documentElement) watch(); else document.addEventListener('DOMContentLoaded', watch)
    document.addEventListener('focusin', (event) => { const e = event.target; const on = document.querySelector('.sheet, .app-modal, .rank-window, #spotify-export-modal, .modal-overlay') ? 'window on' : 'window off'; log('focus', `${e && e.tagName ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') : '?'} [${on}]`) }, true)
    for (const type of ['pointerdown', 'touchstart', 'click', 'keydown']) document.addEventListener(type, () => window.__inputs.push(performance.now()), true)
    Date.prototype.toLocaleTimeString = () => '12:00:00 PM'
}

const browser = await ENGINE.launch()

// ---- the world
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>`)}`
const NAMES = ['Speak to Me', 'Breathe', 'On the Run', 'Time', 'The Great Gig in the Sky', 'Money', 'Us and Them', 'Any Colour You Like', 'Brain Damage', 'Eclipse']
const ARTISTS = ['Pink Floyd', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen']
const ITEMS = Array.from({ length: 24 }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`, title: `The Album ${i}`, artist: ARTISTS[i % ARTISTS.length], format: ['cd', 'vinyl', 'digital', null][i % 4], owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    purchasePrice: i % 2 === 0 ? 40 + i : null, currency: i % 4 === 0 ? 'BRL' : 'USD', notes: '',
    albumData: { id: `al-${i}`, title: `The Album ${i}`, artist: ARTISTS[i % ARTISTS.length], year: 1970 + i, coverUrl: cover(i * 29 % 360), tracks: NAMES.map((title, j) => ({ title, position: j + 1, duration: 60 + 31 * j })) },
    averages: { rating: 70 + i, popularity: 40 + i, ratedTracks: 7, popTracks: 7, tracks: 10 }, addedToInventory: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}T10:00:00.000Z`
}))
const ALBUMS_WORLD = `(async () => {
  const tracks = (j) => ${JSON.stringify(NAMES)}.map((t, i) => ({ title: t, position: i + 1, duration: 60 + 31 * i, rank: i % 2 ? undefined : i + 1, rating: i % 3 ? 70 + i : undefined, spotifyPopularity: i % 4 === 3 ? -1 : 25 + i * 6, userRank: undefined }))
  const make = (sid, j, artist, title) => ({ id: sid + '-' + j, title, artist, year: String(1970 + j), releaseDate: (1970 + j) + '-01-01', type: 'Album', coverUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(' + (j * 40) + ',45%,35%)"/></svg>'),
    tracks: tracks(j), hasUserRanking: false, bestEverAlbumId: null, spotifyId: null, seriesIds: [sid], getTracks: () => tracks(j) })
  const series = [{ id: 's0', name: 'Floyd', createdAt: new Date(2026, 0, 10), albumQueries: Array.from({ length: 8 }, (_, j) => ({ artist: 'Pink Floyd', title: 'Album ' + j })) }]
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
// the stand-in of MusicKit for the Start screen: one artist, fourteen albums
const FLOYD = ['The Piper at the Gates of Dawn', 'A Saucerful of Secrets', 'More', 'Ummagumma', 'Atom Heart Mother', 'Meddle', 'Obscured by Clouds', 'The Dark Side of the Moon', 'Wish You Were Here', 'Animals', 'The Wall', 'The Final Cut', 'A Momentary Lapse of Reason', 'The Division Bell']
    .map((name, i) => ({ id: `pf-${i}`, attributes: { name, artistName: 'Pink Floyd', releaseDate: `${1967 + i}-01-01`, trackCount: 9 + (i % 5), isSingle: false, isCompilation: false, url: `https://music.apple.com/pf-${i}`, artwork: { url: `https://is1-ssl.mzstatic.com/image/pf/{w}x{h}bb.jpg?c=${i}` } } }))
const MUSICKIT_STAND_IN = `(() => { const ALBUMS = ${JSON.stringify(FLOYD)}; const instance = { storefrontId: 'us', isAuthorized: false, musicUserToken: '', addEventListener() {}, removeEventListener() {}, api: { music: async (path, params) => {
  if (/\\/search$/.test(path)) return { data: { results: { artists: { data: /floyd/i.test(String(params && params.term)) ? [{ id: 'pf' }] : [] } } } }
  if (/\\/artists\\/pf\\/albums$/.test(path)) return { data: { data: ALBUMS } }
  return { data: { data: [] } } } } }; window.MusicKit = { configure: async () => {}, getInstance: () => instance } })()`

async function open(base, surface, options = {}) {
    const context = await browser.newContext({ ...P.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
    await context.route(url => !['127.0.0.1', 'js-cdn.music.apple.com'].includes(new URL(url).hostname) && !/mzstatic\.com/.test(url), route => route.abort())
    await context.route(BLOCKED, route => route.abort())
    await context.route(/mzstatic\.com/, (r) => { const c = Number(new URL(r.request().url()).searchParams.get('c') || 0); return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${(c * 47) % 360},45%,38%)"/></svg>` }) })
    await context.route(/\/api\/musickit-token/, (r) => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
    await context.route(/js-cdn\.music\.apple\.com/, (r) => r.fulfill({ contentType: 'application/javascript', body: MUSICKIT_STAND_IN }))
    await context.addInitScript(`(${RECORDER.toString()})()`)
    if (options.spotify) await context.addInitScript(() => { try { localStorage.setItem('spotify_access_token', 'proof-token'); localStorage.setItem('spotify_expires_at', String(Date.now() + 3600000)) } catch { /* none */ } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) })
    await page.goto(base + (options.url || '/start'), { waitUntil: 'load' })
    await page.waitForFunction(() => window.router && document.getElementById('app'), null, { timeout: 40000 })
    await page.waitForTimeout(Number(process.env.SETTLE) || 5600) // the notice of the blocked login comes seconds after the load and leaves after 4 s, on either side
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
        if (PHONE) { await page.locator('.saved-series-toggle').first().click(); await page.waitForTimeout(600) }
    },
    edit: async (page) => {
        await page.addScriptTag({ content: `window.__generated = ${GENERATED.toString()}` })
        await page.evaluate(() => { window.playlistsStore.setPlaylists(window.__generated(), 'sA'); window.playlistsStore.setBatchName('Mix'); window.router.navigate('/playlists') })
        await page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
        await page.waitForTimeout(1200)
    }
}

const TOP_BAR = 80
function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, top: 0, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, top = 0, delta = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    const scale = one.width / (P.options.viewport?.width || 1280)
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (!d) continue
        const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width)
        if (y < TOP_BAR * scale) { top++; continue }
        apart++; delta = Math.max(delta, d); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
    return { apart, top, delta, box: apart ? `x ${x0}-${x1}, y ${y0}-${y1}` : '' }
}

const layersNow = (page, only = LAYERS, boxes = true) => page.evaluate(`(() => { const read = ${READ}; return [...document.querySelectorAll('${only}')].map(el => read(el, ${boxes})).join('\\n#####\\n') })()`)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className).split(' ')[0]}` })
const lockNow = (page) => page.evaluate(() => `${document.body.getAttribute('style') || ''} | ${document.body.dataset.scrollLocked || 'free'} | scrollY ${Math.round(window.scrollY)}`)
const timelineNow = (page) => page.evaluate(() => { const raw = { events: window.__tl, inputs: window.__inputs }; window.__tl = []; window.__inputs = []; return raw })
/** What an event is measured from: the latest input before it (or the start of the step). That is the engine's own time, whatever the pace of the script between two inputs. */
function relative({ events, inputs }, begun) {
    const out = []
    for (const e of events) { const latest = inputs.filter(t => t <= e.t).pop(); out.push([Math.round((e.t - (latest ?? begun)) * 10) / 10, e.kind, e.detail]) }
    return out
}

/**
 * Does the step on both sides and compares what it left. `run(page, side, snap)` may take pictures of the moment with `snap(label, { shot })` (the layers, the
 * focus, the lock, and, with `shot`, the pixels of the page), each compared with the same one of the other side.
 */
async function step(label, sides, run, { wait = 600, shoot = true, frame = FRAME, goes = false } = {}) {
    const timelines = []
    for (const side of sides) {
        side.snaps = {}
        await side.page.evaluate(() => { window.__tl = []; window.__inputs = [] })
        const begun = await side.page.evaluate(() => performance.now())
        const snap = async (name, { shot = false, only = LAYERS, boxes = !/\(\d+ ms\)|opening|closing/.test(name) } = {}) => {
            side.snaps[name] = { layers: await layersNow(side.page, only, boxes), focus: await focusNow(side.page), lock: await lockNow(side.page), shot: shot ? await side.page.screenshot({ animations: 'disabled', caret: 'hide' }) : null }
        }
        await run(side.page, side, snap)
        await side.page.waitForTimeout(wait)
        await snap('end', { shot: shoot })
        timelines.push(relative(await timelineNow(side.page), begun))
    }
    const [a, b] = sides
    // What is compared in the order of events: the sheet coming, the class that marks it closing (a same-value write of the class twice is one), the sheet leaving, the page held and
    // given back (one line for a run of writes of the body's style). The focus is compared by the snapshots at each step (and its events differ in a way no eye sees: the hand-made
    // motor focused the panel and then the first control, each as its own event; the React one goes straight to the control).
    const keep = (events) => events.filter(([, kind, detail], i, all) => {
        if (kind === 'bar+' || kind === 'focus') return false
        // on purpose (the sheet goes with the part of the screen that opened it, with no slide): only the coming and the going of the sheet are compared
        if (goes && (kind === 'sheet-class' || kind === 'body')) return false
        if (kind === 'sheet-class' && !/sheet--closing/.test(detail)) return false
        const before = all.slice(0, i).filter(([, k]) => k !== 'focus').pop()
        return !(before && before[1] === kind && before[2] === detail && (kind === 'sheet-class' || kind === 'body'))
    })
    const kinds = (events) => keep(events).map(([, kind, detail]) => `${kind} ${detail}`)
    const [ka, kb] = [kinds(timelines[0]), kinds(timelines[1])]
    const same = JSON.stringify(ka) === JSON.stringify(kb)
    note(`${TAG} · ${label} · the timeline: what happened, in order`, same, same ? `${ka.length} events: ${ka.join(' → ').slice(0, 240)}` : `\n parent: ${ka.join(' → ')}\n mine:   ${kb.join(' → ')}`)
    if (same && ka.length) {
        const [ta, tb] = [keep(timelines[0]), keep(timelines[1])]
        const deltas = ta.map(([t], i) => Math.abs(t - tb[i][0]))
        const worst = Math.max(...deltas)
        const at = deltas.indexOf(worst)
        const within = deltas.filter(d => d <= frame).length
        note(`${TAG} · ${label} · the timeline: when (±1 frame, ${frame} ms)`, worst <= frame, `${within} of ${deltas.length} events within a frame, the worst ${worst.toFixed(1)} ms (${ta[at][1]} ${ta[at][2]}: ${ta[at][0]} against ${tb[at][0]})`)
        // the slide itself, from the close to the removal, told in numbers for the report
        const slide = (events) => { const c = events.find(([, k]) => k === 'sheet-class'); const r = events.find(([, k]) => k === 'sheet-'); return c && r ? Math.round((r[0] - c[0]) * 10) / 10 : null }
        const [sa, sb] = [slide(ta), slide(tb)]
        if (sa !== null) note(`${TAG} · ${label} · the slide, from «closing» to gone`, Math.abs(sa - sb) <= frame, `${sa} ms against ${sb} ms`)
    }
    for (const name of Object.keys(a.snaps)) {
        const [x, y] = [a.snaps[name], b.snaps[name]]
        const where = `${label} · ${name === 'end' ? 'at the end' : name}`
        note(`${TAG} · ${where} · the layers (sheets and windows: elements, text nodes, boxes)`, x.layers === y.layers, x.layers === y.layers ? `${x.layers.length} chars` : `\n parent: ${x.layers.slice(0, 500)}\n mine:   ${y.layers.slice(0, 500)}`)
        note(`${TAG} · ${where} · the focus`, x.focus === y.focus, `${x.focus} | ${y.focus}`)
        note(`${TAG} · ${where} · the page lock and the scroll`, x.lock === y.lock, x.lock === y.lock ? x.lock : `\n parent: ${x.lock}\n mine:   ${y.lock}`)
        if (x.shot && y.shot) {
            const diff = pixelsApart(x.shot, y.shot)
            note(`${TAG} · ${where} · the picture of the page (below the top bar)`, diff.apart === 0, `${diff.apart === 0 ? 'same pixels' : `${diff.apart} pixels apart, the most ${diff.delta}/255, in ${diff.box}`}; in the top bar: ${diff.top}`)
            if (diff.apart) { const stem = `${TAG}-${label}-${name}`.replace(/\W+/g, '-').slice(0, 90); fs.writeFileSync(path.join(SHOTS, `${stem}-parent.png`), x.shot); fs.writeFileSync(path.join(SHOTS, `${stem}-mine.png`), y.shot) }
        }
    }
    for (const side of sides) { const e = side.errors.splice(0); note(`${TAG} · ${label} · errors of the page (${side.name})`, e.length === 0, e.join(' | ')) }
}

const press = (locator) => (P.touch ? locator.tap() : locator.click())
const tap = (page, selector, index = 0) => press(page.locator(selector).nth(index))
const SCENARIOS = {}
const ABSENT = '.sheet'

/** A drag down on a bottom sheet's handle, with touch: through CDP in Chromium. WebKit has no way to send a touch drag: there it is not tried. */
async function dragDown(page, selector, distance, steps = 8) {
    const box = await page.locator(selector).first().boundingBox()
    const x = box.x + box.width / 2, y = box.y + box.height / 2
    const client = await page.context().newCDPSession(page)
    const send = (type, py) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: py, id: 1 }] })
    await send('touchStart', y)
    for (let i = 1; i <= steps; i++) { await send('touchMove', y + (distance * i) / steps); await page.waitForTimeout(16) }
    await send('touchEnd', y + distance)
    await client.detach()
}

/**
 * A sheet, every way: opened by a tap, closed by its button, by Escape, by a tap outside (a bottom one) and by a drag down (Chromium, a bottom one).
 * `open(page)` taps what opens it; `selector` is the sheet's element.
 */
function sheetScenario(name, surface, { open, bottom = true, selector = '.sheet', beforeEach = null, after = null, scroll = 0 }) {
    SCENARIOS[name] = async (mk) => {
        if (!PHONE) {
            const sides = await mk(surface)
            await step(`${name}: on the computer no sheet is opened by the flow (nothing changed there)`, sides, async (page, side, snap) => {
                await page.waitForTimeout(300)
                await snap('the page', { shot: true })
                note(`${TAG} · ${name} · no sheet on the computer (${side.name})`, (await page.locator(ABSENT).count()) === 0)
            }, { wait: 200 })
            return sides
        }
        const sides = await mk(surface)
        if (scroll) for (const side of sides) await side.page.evaluate((y) => window.scrollTo(0, y), scroll)
        await sides[0].page.waitForTimeout(400)
        const prepare = async (page) => { if (beforeEach) await beforeEach(page) }
        await step(`${name}: opens by a tap; the page behind is held and found at its place; closes by its button`, sides, async (page, side, snap) => {
            await prepare(page)
            await snap('before', { only: '.sheet' })
            await open(page)
            await page.waitForTimeout(80)
            await snap('opening (80 ms)')
            await page.waitForTimeout(500)
            await snap('open', { shot: true })
            await tap(page, `${selector} .sheet__close`)
            await page.waitForTimeout(100)
            await snap('closing (100 ms)')
            await page.waitForTimeout(500)
            await snap('closed', { shot: true })
        })
        await step(`${name}: closes on Escape`, sides, async (page, side, snap) => {
            await open(page)
            await page.waitForTimeout(500)
            await page.keyboard.press('Escape')
            await page.waitForTimeout(100)
            await snap('after Escape (100 ms)')
            await page.waitForTimeout(500)
            await snap('after Escape, gone', { shot: true })
        })
        if (bottom) {
            await step(`${name}: closes on a tap outside (the backdrop)`, sides, async (page, side, snap) => {
                await open(page)
                await page.waitForTimeout(500)
                const box = await page.locator(`${selector} .sheet__backdrop`).boundingBox()
                await page.touchscreen.tap(box.x + box.width / 2, Math.max(box.y + 20, 20))
                await page.waitForTimeout(100)
                await snap('after the tap (100 ms)')
                await page.waitForTimeout(500)
                await snap('gone', { shot: true })
            })
            if (ENGINE_NAME === 'chromium') {
                await step(`${name}: a drag down on the handle, first short (snaps back), then past 80 px (closes)`, sides, async (page, side, snap) => {
                    await open(page)
                    await page.waitForTimeout(500)
                    await dragDown(page, `${selector} .sheet__handle`, 50)
                    await page.waitForTimeout(100)
                    await snap('after a 50 px drag: still open, back in place', { shot: true })
                    await dragDown(page, `${selector} .sheet__handle`, 140)
                    await page.waitForTimeout(100)
                    await snap('after a 140 px drag (100 ms)')
                    await page.waitForTimeout(500)
                    await snap('gone', { shot: true })
                    await open(page)
                    await page.waitForTimeout(500)
                    await dragDown(page, `${selector} .sheet__header`, 100)
                    await page.waitForTimeout(600)
                    await snap('a 100 px drag on the header: gone')
                })
            } else {
                note(`${TAG} · ${name} · a drag down with the finger: WebKit has no way to send a touch drag (Playwright's touchscreen only taps): proven in Chromium and by the jsdom scenarios, NOT in WebKit`, true)
            }
        }
        if (after) await after(sides)
        return sides
    }
}

// ---- Start (Create): «What is a series?» and the series sheet from the bar
sheetScenario('start-what-is-a-series', 'start', {
    open: (page) => tap(page, '.home-what'), bottom: true, selector: '#whatIsASeries'
})
SCENARIOS.startSeriesSheet = async (mk) => {
    const sides = await mk('start')
    if (!PHONE) { note(`${TAG} · startSeriesSheet · the computer has no series sheet`, true); return sides }
    for (const side of sides) {
        await side.page.fill('#artistScanInput', 'Pink Floyd')
        await side.page.keyboard.press('Enter')
        await side.page.waitForSelector('#discographyGrid [data-action="pick-album"]', { timeout: 10000 })
        for (const n of [2, 4, 6]) await tap(side.page, `#discographyGrid [data-action="pick-album"]:nth-child(${n})`)
        await side.page.waitForTimeout(500)
    }
    await step('Start: the series sheet from the bar (full): the count in its title, «Done», Escape', sides, async (page, side, snap) => {
        await tap(page, '.home-dock__open')
        await page.waitForTimeout(80)
        await snap('opening (80 ms)')
        await page.waitForTimeout(500)
        await snap('open', { shot: true })
        await tap(page, '#homeSeriesSheet .sheet__close')
        await page.waitForTimeout(100)
        await snap('closing (100 ms)')
        await page.waitForTimeout(500)
        await snap('closed', { shot: true })
        await tap(page, '.home-dock__open')
        await page.waitForTimeout(500)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(600)
        await snap('closed by Escape', { shot: true })
    })
    return sides
}

// ---- Albums: an album's actions, the series' actions, the filters and order
sheetScenario('albums-album-actions', 'albums', { open: (page) => tap(page, '.album-more'), scroll: 120 })
sheetScenario('albums-filters-and-order', 'albums', { open: (page) => tap(page, '.filters-phone-button'), scroll: 0 })

// ---- Inventory: the actions of an item, the status, the filters and order, the actions of the collection, the jump
sheetScenario('inventory-item-actions', 'inventory', { open: (page) => tap(page, '.inv-row__more, .inv-tile__more'), scroll: 200 })
sheetScenario('inventory-status', 'inventory', { open: (page) => tap(page, '[data-phone-action="status"]'), scroll: 200 })
sheetScenario('inventory-filters-and-order', 'inventory', { open: (page) => tap(page, '[data-phone-action="filters"]') })
sheetScenario('inventory-collection-actions', 'inventory', { open: (page) => tap(page, '[data-phone-action="actions"]') })
sheetScenario('inventory-jump', 'inventory', { open: (page) => tap(page, '[data-phone-action="jump"]') })

// ---- Saved playlists: the actions of a batch (and the export window as a sheet), the filters
sheetScenario('saved-batch-actions', 'saved', { open: (page) => press(page.locator('[aria-label^="Actions for batch"]').first()) })
sheetScenario('saved-filters', 'saved', { open: (page) => tap(page, '.filters-phone-button') })
sheetScenario('saved-series-actions', 'saved', { open: (page) => press(page.locator('[aria-label^="Actions for series"]').first()) })
SCENARIOS.savedExport = async (mk) => {
    const sides = await mk('saved')
    if (!PHONE) { note(`${TAG} · savedExport · on the computer the export window is a window (proven by the golden of wave 8a)`, true); return sides }
    await step('Saved playlists: the batch sheet, then «Export» opens the export window as a sheet; closed by its button, then by Escape', sides, async (page, side, snap) => {
        await press(page.locator('[aria-label^="Actions for batch"]').first())
        await page.waitForTimeout(600)
        await snap('the batch sheet', { shot: true })
        await press(page.locator('.sheet button:has-text("Export")').first())
        await page.waitForTimeout(700)
        await snap('the export sheet', { shot: true })
        await tap(page, '.sheet .sheet__close')
        await page.waitForTimeout(600)
        await snap('closed by its button', { shot: true })
        await press(page.locator('[aria-label^="Actions for batch"]').first())
        await page.waitForTimeout(600)
        await press(page.locator('.sheet button:has-text("Export")').first())
        await page.waitForTimeout(700)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(600)
        await snap('closed by Escape', { shot: true })
    })
    return sides
}

// ---- Playlists (edit): a playlist's sheet, a track's sheet
sheetScenario('playlists-playlist-sheet', 'edit', { open: (page) => tap(page, '[data-phone-action="playlist-options"]') })
sheetScenario('playlists-track-sheet', 'edit', { open: (page) => tap(page, '[data-phone-action="track-options"]') })

// ---- the shell: the menu of the phone (and the question to clear the cache, opened from it)
sheetScenario('shell-menu', 'start', { open: (page) => tap(page, '#phoneMenuBtn'), bottom: false })
SCENARIOS.questionOverASheet = async (mk) => {
    const sides = await mk('start', { spotify: true })
    if (!PHONE) { note(`${TAG} · questionOverASheet · the computer has no phone menu sheet: its account panel is not a sheet`, true); return sides }
    await step('Shell: «Disconnect» Spotify from the menu sheet asks over the sheet: the question sits UNDER the sheet (z-index 50 against 1000) and the sheet hears Escape first (the defect kept)', sides, async (page, side, snap) => {
        await tap(page, '#phoneMenuBtn')
        await page.waitForTimeout(700)
        await tap(page, '[data-connection="spotify"] [data-action="disconnect"]:visible')
        await page.waitForTimeout(700)
        await snap('the question over the sheet', { shot: true })
        side.z = await page.evaluate(() => {
            const q = document.querySelector('#confirm-modal .app-modal__panel')
            const sheet = document.querySelector('.sheet')
            if (!q || !sheet) return { question: Boolean(q), sheet: Boolean(sheet) }
            const r = q.getBoundingClientRect()
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
            return { sheetZ: getComputedStyle(sheet).zIndex, questionZ: getComputedStyle(document.querySelector('#confirm-modal')).zIndex, whatIsAtTheQuestionsCentre: hit ? (hit.closest('.sheet') ? 'the sheet' : hit.closest('#confirm-modal') ? 'the question' : hit.tagName) : null }
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(600)
        await snap('after Escape: the sheet has gone, the question stays', { shot: true })
        side.afterEscape = await page.evaluate(() => ({ sheets: document.querySelectorAll('.sheet').length, questions: document.querySelectorAll('#confirm-modal').length }))
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        await snap('after a second Escape: the question answers «Cancel»')
    })
    note(`${TAG} · questionOverASheet · the stacking and what Escape did`, JSON.stringify([sides[0].z, sides[0].afterEscape]) === JSON.stringify([sides[1].z, sides[1].afterEscape]), `${JSON.stringify(sides[0].z)} ${JSON.stringify(sides[0].afterEscape)} | ${JSON.stringify(sides[1].z)} ${JSON.stringify(sides[1].afterEscape)}`)
    return sides
}

// ---- a turn of the phone: a sheet open when the screen stops being a phone closes
// the sheet of each screen, open when the window grows past the phone's line: it is closed by the motor (one element, slid away), never drawn again
const TURNS = {
    stopsBeingAPhoneInventory: ['inventory', (page) => tap(page, '[data-phone-action="filters"]')],
    stopsBeingAPhoneAlbums: ['albums', (page) => tap(page, '.album-more')],
    stopsBeingAPhoneSaved: ['saved', (page) => press(page.locator('[aria-label^="Actions for batch"]').first()), true],
    stopsBeingAPhonePlaylists: ['edit', (page) => tap(page, '[data-phone-action="playlist-options"]')],
    stopsBeingAPhoneStart: ['start', (page) => tap(page, '.home-what')],
    stopsBeingAPhoneMenu: ['start', (page) => tap(page, '#phoneMenuBtn'), true]
}
for (const [name, [surface, openIt, goes]] of Object.entries(TURNS)) {
    SCENARIOS[name] = async (mk) => {
        const sides = await mk(surface)
        if (!PHONE) { note(`${TAG} · ${name} · only the phone has a sheet to close`, true); return sides }
        await step(`${name}: a sheet is open and the window grows to 1100 px wide: the sheet closes, once, and the page is let go`, sides, async (page, side, snap) => {
            await openIt(page)
            await page.waitForTimeout(600)
            await snap('open')
            const size = page.viewportSize()
            await page.setViewportSize({ width: 1100, height: size.height })
            await page.waitForTimeout(600)
            await snap('after the window grew', {})
            await page.setViewportSize(size)
            await page.waitForTimeout(500)
        }, { shoot: false, frame: 45, goes: Boolean(goes) })
        return sides
    }
}

// ---- run
const oldSite = await serve(oldDist)
const newSite = await serve(CONTROL ? oldDist : newDist)
const names = Object.keys(SCENARIOS).filter(name => !ONLY.length || ONLY.includes(name))
for (const name of names) {
    console.log(`--- ${name}`)
    const opened = []
    const mk = async (surface, options = {}) => {
        const sides = [await open(oldSite.base, surface, options), await open(newSite.base, surface, options)]
        sides.forEach((side, i) => { side.name = ['parent', CONTROL ? 'parent again' : 'mine'][i] })
        opened.push(...sides)
        return sides
    }
    try { await SCENARIOS[name](mk) } catch (error) { note(`${TAG} · ${name} · the scenario ran to its end`, false, error.message.split('\n').slice(0, 5).join(' | ')) }
    for (const side of opened) await side.context?.close()
}
await browser.close()
oldSite.server.close(); newSite.server.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}${ONLY.length ? '-only-' + ONLY.join('+') : ''}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(0)
