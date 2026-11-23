// F83 sync 5: the browser proof, on BUILT sites, of A (the lean «Create» screen on the computer), B (no orange line while the series are read)
// and C (the Albums screen says it is loading), the React line against `main`'s hand-made build; and a regression sweep against the parent.
//
//   WORK=<scratch> OUT=<result folder> ENGINE=chromium|webkit PROFILE=1280x800|1440x900|1920x1080|1366x768|1280x720|iphone393|iphone375
//   PART=create|read|sweep|routerbar A=<dist of A> B=<dist of B> TAG=<name> [ACCOUNT=1] node proof.mjs
//
// Each build is served by this script's own small static server on 127.0.0.1 (a deep route answers with app.html, as the hosting does; `/` and `/home` with
// index.html). Firebase Auth/Firestore and EVERY host that is not 127.0.0.1 are BLOCKED; the catalog (MusicKit) is a stand-in; nobody is made anonymous; no key
// is read into any file (the web key needed to restore a test account without the network is read at run time from the BUILD's js/firebase-config.js and
// kept in memory only). Motion is asked off. Both sides are driven in lockstep and photographed; the noise control is the same build against itself.
//
// The seam of the judges (PART=read): the built scripts' `getDocs:(...e)=>X(...e)` of the data store is rewritten, on both sides alike, to call
// `window.__proofGetDocs`, which waits HOLD ms and returns two series with albums (the series path) or nothing (any other path).
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import pngjs from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const { PNG } = pngjs

const WORK = process.env.WORK
const OUT = process.env.OUT
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || '1280x800'
const PART = process.env.PART || 'create'
const TAG = process.env.TAG || 'run'
const ACCOUNT = process.env.ACCOUNT === '1'
const HOLD = Number(process.env.HOLD || 1500)
const [A_DIST, B_DIST] = [process.env.A, process.env.B]
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true })
const PHONE = /^iphone/.test(PROFILE)
const SIZES = { iphone393: [393, 852], iphone375: [375, 667] }
const [VW, VH] = SIZES[PROFILE] || PROFILE.split('x').map(Number)
const contextOptions = () => (PHONE
    ? { ...devices['iPhone 14'], viewport: { width: VW, height: VH }, reducedMotion: 'reduce' }
    : { viewport: { width: VW, height: VH }, reducedMotion: 'reduce' })

// ---------------------------------------------------------------------------------------------------------------- results
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 700) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 260) : ''}`) }
const facts = {}

// ---------------------------------------------------------------------------------------------------------------- servers
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' }
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/' || url.pathname === '/home') file = path.join(dist, 'index.html')
        else if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = url.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
        if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}`, dist })))
}

// ---------------------------------------------------------------------------------------------------------------- the stand-ins
const ALBUMS = [['The Piper at the Gates of Dawn', '1967-08-05'], ['A Saucerful of Secrets', '1968-06-29'], ['More', '1969-06-13'], ['Ummagumma', '1969-11-07'], ['Atom Heart Mother', '1970-10-02'], ['Meddle', '1971-10-30'], ['Obscured by Clouds', '1972-06-02'], ['The Dark Side of the Moon', '1973-03-01'], ['Wish You Were Here', '1975-09-12'], ['Animals', '1977-01-23'], ['The Wall', '1979-11-30'], ['The Final Cut', '1983-03-21'], ['A Momentary Lapse of Reason', '1987-09-07'], ['The Division Bell', '1994-03-28']].map(([name, releaseDate], i) => ({ id: `pf-${i}`, attributes: { name, artistName: 'Pink Floyd', releaseDate, trackCount: 9 + (i % 5), isSingle: false, isCompilation: false, url: `https://music.apple.com/pf-${i}`, artwork: { url: `https://is1-ssl.mzstatic.com/image/pf/{w}x{h}bb.jpg?c=${i}` } } }))
const MUSICKIT_STAND_IN = `
(() => {
  const ALBUMS = ${JSON.stringify(ALBUMS)}
  const make = (name, artist, n) => ({ id: 'al-' + n, attributes: { name, artistName: artist, releaseDate: (1990 + (n % 30)) + '-03-01', trackCount: 3, isSingle: false, isCompilation: false, url: 'https://music.apple.com/al-' + n, artwork: { url: 'https://is1-ssl.mzstatic.com/image/al/{w}x{h}bb.jpg?c=' + n } }, relationships: { tracks: { data: [1, 2, 3].map(t => ({ id: 't-' + n + '-' + t, attributes: { name: 'Track ' + t, durationInMillis: 180000 + t * 7000, trackNumber: t, discNumber: 1, artistName: artist } })) } } })
  let counter = 0
  const byId = {}
  const instance = {
    storefrontId: 'us', isAuthorized: false, musicUserToken: '', addEventListener() {}, removeEventListener() {},
    api: { music: async (path, params) => {
      if (/\\/search$/.test(path)) {
        const term = String(params && params.term)
        if (params && params.types === 'albums') { const n = ++counter; const album = make(term.replace(/^(Radiohead|Pink Floyd|Miles Davis|Nina Simone)\\s+/, ''), (term.match(/^(Radiohead|Pink Floyd|Miles Davis|Nina Simone)/) || ['Artist'])[0], n); byId[album.id] = album; return { data: { results: { albums: { data: [album] } } } } }
        return { data: { results: { artists: { data: /floyd/i.test(term) ? [{ id: 'pf' }] : [] } } } }
      }
      if (/\\/artists\\/pf\\/albums$/.test(path)) return { data: { data: ALBUMS } }
      const m = /\\/albums\\/([^/]+)$/.exec(path)
      if (m && byId[m[1]]) return { data: { data: [byId[m[1]]] } }
      return { data: { data: [] } }
    } }
  }
  window.MusicKit = { configure: async () => {}, getInstance: () => instance }
})()`
const SERIES = [
    { id: 'sA', data: { name: 'Radiohead, the early years', albumQueries: [{ artist: 'Radiohead', title: 'Pablo Honey' }, { artist: 'Radiohead', title: 'The Bends' }, { artist: 'Radiohead', title: 'OK Computer' }], createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-02T10:00:00Z' } },
    { id: 'sB', data: { name: 'Floyd, the seventies', albumQueries: [{ artist: 'Pink Floyd', title: 'The Dark Side of the Moon' }, { artist: 'Pink Floyd', title: 'Animals' }], createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-02T10:00:00Z' } }
]
const readKey = (dist) => { // the public web key of the BUILD's own configuration, kept in memory only (restoring a test account with no network)
    try { return /apiKey:\s*["']([^"']+)["']/.exec(fs.readFileSync(path.join(dist, 'js/firebase-config.js'), 'utf8'))?.[1] || '' } catch { return '' }
}

const browser = await ENGINE.launch()
const bar = new Map() // per context: what the page asked of the network

async function open(side, route, { hold = null, account = ACCOUNT, series = SERIES, delayScreens = 0 } = {}) {
    const context = await browser.newContext({ ...contextOptions(), locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
    const blocked = new Set()
    const seen = []
    let screenDelay = delayScreens
    await context.route(() => true, async (r) => {
        const url = new URL(r.request().url())
        if (/js-cdn\.music\.apple\.com/.test(url.href)) return r.fulfill({ contentType: 'application/javascript', body: MUSICKIT_STAND_IN })
        if (/mzstatic\.com/.test(url.hostname)) {
            const c = Number(url.searchParams.get('c') || 0)
            return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${(c * 47) % 360},45%,38%)"/></svg>` })
        }
        if (url.hostname !== '127.0.0.1') { blocked.add(url.hostname); return r.abort() }
        if (/\/api\/musickit-token/.test(url.pathname)) return r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' })
        if (/\/assets\/.*\.js$/.test(url.pathname)) {
            seen.push(url.pathname)
            if (screenDelay && window_loaded.get(context)) await new Promise(res => setTimeout(res, screenDelay))
            if (hold !== null) {
                const res = await r.fetch()
                let body = await res.text()
                body = body.replace(/getDocs:\(\.\.\.(\w+)\)=>\w+\(\.\.\.\1\)/, 'getDocs:(...$1)=>window.__proofGetDocs(...$1)')
                return r.fulfill({ response: res, body })
            }
        }
        return r.continue()
    })
    window_loaded.set(context, false)
    await context.addInitScript(() => { let seed = 42; Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 } })
    await context.addInitScript(() => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM'; Date.prototype.toLocaleString = () => '11/22/2026, 12:00:00 PM' })
    await context.addInitScript(() => { // layout shifts (Chromium has the API; WebKit does not), the orange line, and the loading content, sampled on the page
        window.__shifts = []
        try { new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shifts.push({ value: e.value, t: Math.round(e.startTime), sources: (e.sources || []).slice(0, 3).map(s => { const n = s.node; const d = n ? `${n.nodeName}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0, 2).join('.') : ''}` : '?'; const q = (r) => [r.x, r.y, r.width, r.height].map(v => Math.round(v)); return `${d} ${q(s.previousRect)} -> ${q(s.currentRect)}` }) }) }).observe({ type: 'layout-shift', buffered: true }) } catch (e) { window.__noLayoutShift = true }
    })
    if (hold !== null) {
        await context.addInitScript(({ holdMs, series: list }) => {
            window.__paths = []
            window.__proofGetDocs = async (q) => {
                const p = String((q && q._query && q._query.path && q._query.path.canonicalString && q._query.path.canonicalString()) || (q && q.path) || '')
                window.__paths.push(p)
                if (!/\/series$/.test(p)) return { docs: [] }
                await new Promise(resolve => setTimeout(resolve, holdMs))
                window.__readEnded = Math.round(performance.now())
                return { docs: list.map(s => ({ id: s.id, data: () => ({ ...s.data }) })) }
            }
        }, { holdMs: hold, series })
    }
    if (account) {
        const apiKey = readKey(side.dist)
        await context.addInitScript((key) => {
            const user = { uid: 'proof-user', email: 'proof@example.test', emailVerified: true, displayName: 'Proof', isAnonymous: false, providerData: [{ providerId: 'google.com', uid: 'proof', displayName: 'Proof', email: 'proof@example.test', phoneNumber: null, photoURL: null }], stsTokenManager: { refreshToken: 'r', accessToken: 'a', expirationTime: Date.now() + 3600e3 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey: key, appName: '[DEFAULT]' }
            const request = indexedDB.open('firebaseLocalStorageDb', 1)
            request.onupgradeneeded = () => { request.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }
            request.onsuccess = () => { const tx = request.result.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${key}:[DEFAULT]`, value: user }) }
        }, apiKey)
    }
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)))
    const t0 = Date.now()
    await page.goto(side.base + route, { waitUntil: 'load' })
    window_loaded.set(context, true)
    return { page, context, errors, blocked, seen, t0, setScreenDelay: (ms) => { screenDelay = ms }, close: async () => { await context.unrouteAll({ behavior: 'ignoreErrors' }); await context.close() } }
}
const window_loaded = new WeakMap()

// ---------------------------------------------------------------------------------------------------------------- pictures
function pixelsApart(a, b, mask = null) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: -1, note: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    const scale = one.width / VW
    let apart = 0, delta = 0, y0 = Infinity, y1 = -1
    for (let i = 0; i < one.data.length; i += 4) {
        const p = i / 4, x = p % one.width, y = Math.floor(p / one.width)
        if (mask && x >= mask[0] * scale && x <= (mask[0] + mask[2]) * scale && y >= mask[1] * scale && y <= (mask[1] + mask[3]) * scale) continue
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) { apart++; delta = Math.max(delta, d); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    }
    return { apart, delta, rows: apart ? `${Math.round(y0 / scale)}-${Math.round(y1 / scale)}` : '' }
}
/** A side-by-side thumbnail (left A, right B) at 1/f of the size, as a PNG: the evidence stays small. */
function pair(a, b, f = 3, name) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    const w = Math.floor(one.width / f), h = Math.floor(one.height / f)
    const out = new PNG({ width: w * 2 + 4, height: h })
    for (let y = 0; y < h; y++) for (let k = 0; k < 2; k++) {
        const src = k ? two : one
        for (let x = 0; x < w; x++) {
            const sx = x * f, sy = y * f
            const di = (y * out.width + x + k * (w + 4)) * 4, si = (sy * src.width + sx) * 4
            out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 255
        }
    }
    fs.writeFileSync(path.join(OUT, 'img', `${name}.png`), PNG.sync.write(out, { colorType: 2 }))
}
const slug = (t) => t.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 60)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' && !e.id ? '.' + e.className.split(' ').join('.') : ''}` })

// ---------------------------------------------------------------------------------------------------------------- PART=create
const CREATE_FACTS = () => {
    const visible = (el) => { if (!el) return false; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[hidden]') }
    const box = (sel) => { const el = document.querySelector(sel); if (!visible(el)) return null; const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10) }
    const text = (sel) => { const el = document.querySelector(sel); return visible(el) ? el.innerText.replace(/\s+/g, ' ').trim() : null }
    const what = document.querySelector('.home-what')
    const field = document.querySelector('#artistScanInput')
    return {
        title: text('.home-hero h1'), what: text('.home-what'), whatAttrs: what ? ['aria-expanded', 'aria-controls', 'aria-haspopup'].map(a => `${a}=${what.getAttribute(a)}`).join(' ') : null,
        sentence: text('#homeWhatText'), sentenceHidden: document.querySelector('#homeWhatText') ? document.querySelector('#homeWhatText').hidden : null,
        placeholder: field ? field.placeholder : null, hint: text('#homeHint'), steps: text('#homeHow'), guest: text('#homeGuestStage'),
        message: text('#homeMessage'), dock: text('.home-dock'), dockwrap: !!document.querySelector('.home-dockwrap.is-barless'), undo: text('.home-undo'),
        calm: document.querySelector('#homeStage') ? document.querySelector('#homeStage').classList.contains('is-calm') : null,
        pageBarless: document.querySelector('#home-page') ? document.querySelector('#home-page').classList.contains('is-barless') : null,
        sheet: text('.sheet'), menuOpen: !!document.querySelector('#userMenu') && visible(document.querySelector('#userMenu')),
        boxes: { h1: box('.home-hero h1'), what: box('.home-what'), field: box('#homeField'), hint: box('#homeHint'), paste: box('#homePaste'), grid: box('#discographyGrid'), dock: box('.home-dock'), stage: box('#homeStage') },
        height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth
    }
}

async function createPart() {
    const sides = await Promise.all([A_DIST, B_DIST].map(serve))
    const opened = await Promise.all(sides.map(side => open(side, '/start')))
    const pages = opened.map(o => o.page)
    await pages[0].waitForTimeout(2300)
    let step = 0
    const state = async (label, { text = false } = {}) => {
        await pages[0].waitForTimeout(450)
        const [fa, fb] = await Promise.all(pages.map(p => p.evaluate(`(${CREATE_FACTS.toString()})()`)))
        const keys = Object.keys(fa).filter(k => JSON.stringify(fa[k]) !== JSON.stringify(fb[k]))
        facts[`${++step}. ${label}`] = { a: fa, differs: keys }
        note(`${label}: facts`, keys.length === 0, keys.map(k => `${k}: A ${JSON.stringify(fa[k])} · B ${JSON.stringify(fb[k])}`).join(' || '))
        const [oa, ob] = await Promise.all(pages.map(focusNow))
        note(`${label}: focus`, oa === ob, oa === ob ? oa : `A ${oa} · B ${ob}`)
        const [ia, ib] = await Promise.all(pages.map(p => p.screenshot()))
        const eq = await pages[0].evaluate(() => { const e = document.querySelector('.home-eq'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x - 4, r.y - 4, r.width + 8, r.height + 8] })
        const raw = pixelsApart(ia, ib), masked = pixelsApart(ia, ib, eq)
        note(`${label}: pixels`, masked.apart === 0, `${raw.apart} apart, ${masked.apart} without the equalizer box${masked.apart ? ` (max ${masked.delta}/255, rows ${masked.rows})` : ''}`)
        if (masked.apart > 0 || step <= 3 || /last removed|chosen|sentence open by mouse/.test(label)) pair(ia, ib, 3, `${TAG}-${String(step).padStart(2, '0')}-${slug(label)}`)
    }
    const all = (fn) => Promise.all(pages.map(fn))
    const lock = async (fn) => { await all(fn); await pages[0].waitForTimeout(250) }
    const search = (text) => lock(async (p) => { await p.fill('#artistScanInput', text); await p.keyboard.press('Enter') })
    const cover = (n) => `#discographyGrid [data-action="pick-album"]:nth-child(${n})`
    const tag = `${PROFILE} ${ACCOUNT ? 'signed in' : 'visitor'}`

    await state(`${tag} · first visit`)
    if (PHONE) {
        // the phone opens the sheet (a dialog); Escape closes it
        await lock(p => p.click('.home-what'))
        await pages[0].waitForTimeout(1400) // the sheet slides in: the pictures are taken when it has stopped
        await state(`${tag} · sentence sheet open by touch`)
        await lock(p => p.keyboard.press('Escape'))
        await pages[0].waitForTimeout(500)
        await state(`${tag} · sentence sheet closed with Escape`)
    } else {
        await lock(p => p.click('.home-what'))
        await state(`${tag} · sentence open by mouse`)
        await lock(p => p.click('.home-what'))
        await state(`${tag} · sentence closed by a second click`)
        // the keyboard: Enter on the link opens and closes; Escape on the link closes; Escape in the field leaves it open
        await lock(p => p.focus('.home-what'))
        await lock(p => p.keyboard.press('Enter'))
        await state(`${tag} · sentence open by Enter`)
        await lock(p => p.keyboard.press('Enter'))
        await state(`${tag} · sentence closed by Enter`)
        await lock(p => p.keyboard.press('Enter'))
        await lock(p => p.keyboard.press('Escape'))
        await state(`${tag} · Escape on the link closes the sentence`)
        await lock(p => p.click('.home-what'))
        await lock(p => p.focus('#artistScanInput'))
        await lock(p => p.keyboard.press('Escape'))
        await state(`${tag} · Escape in the field leaves the sentence open`)
        if (ACCOUNT) {
            await lock(p => p.click('#userMenuBtn'))
            await lock(p => p.focus('.home-what'))
            await lock(p => p.keyboard.press('Escape'))
            await state(`${tag} · menu open and focus on the link: one Escape closes only the menu`)
        }
    }
    await lock(async (p) => { await p.reload({ waitUntil: 'load' }) })
    await pages[0].waitForTimeout(2300)
    await lock(p => p.focus('#artistScanInput'))
    await lock(p => p.keyboard.type('Pink Fl'))
    await state(`${tag} · typing`)
    await lock(p => p.fill('#artistScanInput', ''))
    await search('Pink Floyd')
    await pages[0].waitForTimeout(500)
    await state(`${tag} · results`)
    await lock(p => p.click(cover(1)))
    await lock(p => p.click(cover(3)))
    await state(`${tag} · two chosen`)
    await lock(p => p.click(cover(1)))
    await lock(p => p.click(cover(3)))
    await state(`${tag} · last removed (no bar, the strip to undo)`)
    await lock(p => p.click('[data-home-mode="paste"]'))
    await state(`${tag} · paste`)
    await lock(p => p.click('[data-home-mode="artist"]'))
    await search('Nobody')
    await pages[0].waitForTimeout(500)
    await state(`${tag} · not found`)
    note(`${tag}: no horizontal scroll, no page error`, opened.every(o => o.errors.length === 0) && (await all(p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))).every(Boolean), opened.map(o => o.errors.join('|')).join(' / '))
    await Promise.all(opened.map(o => o.close()))
    sides.forEach(s => s.server.close())
}

// ---------------------------------------------------------------------------------------------------------------- PART=read
const READ_PROBE = (kind) => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, bottom: Math.round(b.bottom * 10) / 10 } }
    const bar = document.getElementById('globalProgress')
    const barShown = !!bar && getComputedStyle(bar).display !== 'none' && bar.getBoundingClientRect().height > 0
    // any fixed element thin and at the top (the orange line, whatever it is called)
    const thin = [...document.querySelectorAll('body *')].filter(el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.position === 'fixed' && b.top <= 1 && b.height > 0 && b.height <= 8 && b.width >= window.innerWidth * 0.9 && s.display !== 'none' }).length
    const spin = document.querySelector('.animate-spin')
    const loadingText = [...document.querySelectorAll('p')].find(p => /Loading your series/.test(p.textContent))
    const content = document.querySelector('[data-testid="series-loading-content"], [data-testid="series-loading"]')
    const empty = document.querySelector('.empty-state')
    const toolbar = document.querySelector('#series-toolbar-mount') || document.querySelector('#blend-series-selector')
    const footer = document.querySelector('.view-footer')
    return {
        barShown, thin, spinner: r(spin), words: r(loadingText), content: r(content), empty: !!empty, emptyText: empty ? empty.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) : null,
        header: r(document.querySelector('#series-header-mount')), pagerTop: r(document.querySelector('#series-pager-top-mount')), pagerTopText: (document.querySelector('#series-pager-top-mount') || {}).innerText, gridMount: r(document.querySelector('#series-grid-mount')), gridInner: r(document.querySelector('#series-grid-inner')),
        toolbar: r(toolbar), footerY: footer ? Math.round(footer.getBoundingClientRect().top + window.scrollY) : null, pageHeight: document.documentElement.scrollHeight,
        cards: document.querySelectorAll('.albums-grid > [data-id]').length, groups: document.querySelectorAll('.series-group').length, noMatch: /No albums match/.test(document.body.innerText),
        gridHidden: (() => { const m = document.querySelector('#series-grid-mount'); const i = document.querySelector('#series-grid-inner'); return !!((m && m.style.visibility === 'hidden') || (i && i.style.visibility === 'hidden')) })(),
        viewport: [window.innerWidth, window.innerHeight], blendCards: document.querySelectorAll('.blend-series-card').length, blendSpinner: !!document.querySelector('#blend-series-selector .animate-spin'),
        blendMeta: document.querySelector('.blend-pick__meta') ? document.querySelector('.blend-pick__meta').textContent.trim() : null
    }
}
const shiftSum = (page) => page.evaluate(() => {
    const round = (v) => Math.round(v * 10000) / 10000
    const ended = window.__readEnded || 0
    return { total: round(window.__shifts.reduce((s, e) => s + e.value, 0)), beforeTheSwap: round(window.__shifts.filter(e => e.t < ended).reduce((s, e) => s + e.value, 0)), atTheSwap: round(window.__shifts.filter(e => e.t >= ended).reduce((s, e) => s + e.value, 0)), readEnded: ended, list: window.__shifts.slice(0, 8), none: !!window.__noLayoutShift }
})

async function readPart() {
    const SAMPLES = [250, 600, 1000, 1400]
    const sides = await Promise.all([A_DIST, B_DIST].map(serve))
    for (const screen of ['/albums', '/blend']) for (const entry of ['direct', 'menu']) {
        const row = { screen, entry, profile: PROFILE, engine: ENGINE_NAME }
        for (const [k, side] of ['A', 'B'].map((k, i) => [k, sides[i]])) {
            const o = await open(side, entry === 'direct' ? screen : '/start', { hold: HOLD, account: true })
            const { page } = o
            if (entry === 'menu') {
                await page.waitForTimeout(2200)
                const target = screen.slice(1)
                const t0 = Date.now()
                // the menu of the computer, or the bottom bar of the phone; the link to the screen
                await page.evaluate((t) => { const links = [...document.querySelectorAll(`a[href="/${t}"], [data-path="/${t}"]`)].filter(a => a.getBoundingClientRect().width > 0); (links[0] || document.querySelector(`a[href="/${t}"]`)).click() }, target)
                row[`${k}_menuClickAt`] = Date.now() - t0
            }
            const t1 = Date.now()
            const probes = []
            for (const at of SAMPLES) {
                const wait = at - (Date.now() - t1)
                if (wait > 0) await page.waitForTimeout(wait)
                probes.push({ at, ...(await page.evaluate(`(${READ_PROBE.toString()})()`)) })
            }
            row[`${k}_probes`] = probes
            row[`${k}_paths`] = await page.evaluate(() => window.__paths)
            await page.waitForTimeout(Math.max(0, HOLD + 2500 - (Date.now() - t1)))
            row[`${k}_settled`] = await page.evaluate(`(${READ_PROBE.toString()})()`)
            row[`${k}_shift`] = await shiftSum(page)
            row[`${k}_png`] = (await page.screenshot()).toString('base64')
            row[`${k}_errors`] = o.errors
            await o.close()
        }
        const apart = pixelsApart(Buffer.from(row.A_png, 'base64'), Buffer.from(row.B_png, 'base64'))
        row.settledPixelsApart = apart.apart
        if (screen === '/albums' && entry === 'direct') pair(Buffer.from(row.A_png, 'base64'), Buffer.from(row.B_png, 'base64'), 3, `${TAG}-settled`)
        delete row.A_png; delete row.B_png
        facts[`${screen} ${entry}`] = row
        const a = row.A_probes.at(1), b = row.B_probes.at(1)
        note(`${screen} ${entry} ${PROFILE} ${ENGINE_NAME}: the orange line during the read (250-1400 ms)`, true, `A (${A_DIST.split('dist-')[1]}) shown at ${row.A_probes.filter(p => p.barShown || p.thin).map(p => p.at).join(',') || 'never'}; B (${B_DIST.split('dist-')[1]}) shown at ${row.B_probes.filter(p => p.barShown || p.thin).map(p => p.at).join(',') || 'never'}`)
        note(`${screen} ${entry} ${PROFILE} ${ENGINE_NAME}: settled screens equal`, apart.apart === 0, `${apart.apart} px apart${apart.apart ? ' rows ' + apart.rows + ', max ' + apart.delta + '/255' : ''}`)
        void a; void b
    }
    sides.forEach(s => s.server.close())
}

// ---------------------------------------------------------------------------------------------------------------- PART=sweep
const SWEEP_ROUTES = ['/start', '/albums', '/blend', '/playlists', '/saved-playlists', '/inventory', '/artists', '/genres', '/tracks']
async function sweepPart() {
    const sides = await Promise.all([A_DIST, B_DIST].map(serve))
    for (const route of SWEEP_ROUTES) {
        const opened = []
        for (const side of sides) opened.push(await open(side, route, { hold: 0, account: true }))
        await opened[0].page.waitForTimeout(3500)
        await opened[1].page.waitForTimeout(100)
        const reads = await Promise.all(opened.map(o => o.page.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' ').trim(), height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, title: document.title, boxes: [...document.querySelectorAll('#app *')].slice(0, 400).map(e => { const b = e.getBoundingClientRect(); return `${e.tagName}:${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)}` }).join(';').length }))))
        const [ia, ib] = await Promise.all(opened.map(o => o.page.screenshot()))
        const apart = pixelsApart(ia, ib)
        const textSame = reads[0].text === reads[1].text
        note(`${route} ${PROFILE} ${ENGINE_NAME}: text, height, picture`, textSame && reads[0].height === reads[1].height && apart.apart === 0, `text ${textSame ? 'same' : 'differs'}; height ${reads[0].height}/${reads[1].height}; ${apart.apart} px apart${apart.apart ? ` (max ${apart.delta}/255, rows ${apart.rows})` : ''}`)
        facts[route] = { textSame, heights: [reads[0].height, reads[1].height], apart: apart.apart, delta: apart.delta, rows: apart.rows }
        if (apart.apart > 0) pair(ia, ib, 3, `${TAG}-${slug(route)}`)
        await Promise.all(opened.map(o => o.close()))
    }
    sides.forEach(s => s.server.close())
}

// ---------------------------------------------------------------------------------------------------------------- PART=routerbar
async function routerBarPart() {
    const sides = await Promise.all([A_DIST, B_DIST].map(serve))
    for (const [k, side] of ['A', 'B'].map((k, i) => [k, sides[i]])) {
        const o = await open(side, '/start', { hold: 0, account: true })
        const { page } = o
        o.setScreenDelay(2000) // from now on every script file the page asks for waits 2 s; the click comes at once, before the screens of the menu are fetched in the background
        await page.waitForTimeout(150)
        const target = PHONE ? '/blend' : '/blend'
        await page.evaluate((t) => { const links = [...document.querySelectorAll(`a[href="${t}"], [data-path="${t}"]`)].filter(a => a.getBoundingClientRect().width > 0); (links[0] || document.querySelector(`a[href="${t}"]`)).click() }, target)
        const samples = []
        for (const at of [300, 800, 1200, 1700]) { await page.waitForTimeout(at - (samples.at(-1)?.at ?? 0)); samples.push({ at, ...(await page.evaluate(`(${READ_PROBE.toString()})()`)) }) }
        await page.waitForTimeout(3500)
        const after = await page.evaluate(`(${READ_PROBE.toString()})()`)
        facts[`${k} ${side.dist.split('dist-')[1]}`] = { shown: samples.map(s => ({ at: s.at, bar: s.barShown, thin: s.thin })), afterBar: after.barShown, scriptsHeld: o.seen.length }
        note(`router bar for a slow screen file (${side.dist.split('dist-')[1]}, ${PROFILE} ${ENGINE_NAME})`, samples.filter(s => s.at >= 800).every(s => s.barShown) && !after.barShown, JSON.stringify(facts[`${k} ${side.dist.split('dist-')[1]}`]))
        await o.close()
    }
    sides.forEach(s => s.server.close())
}

try {
    if (PART === 'create') await createPart()
    else if (PART === 'read') await readPart()
    else if (PART === 'sweep') await sweepPart()
    else if (PART === 'routerbar') await routerBarPart()
} finally {
    fs.writeFileSync(path.join(OUT, 'raw', `${TAG}.json`), JSON.stringify({ tag: TAG, part: PART, engine: ENGINE_NAME, profile: PROFILE, account: ACCOUNT, results, facts }))
    await browser.close()
}
const failed = results.filter(r => !r.ok).length
console.log(`\n${PART} ${ENGINE_NAME} ${PROFILE} ${ACCOUNT ? 'account' : 'visitor'}: ${results.length} checks, ${failed} failed`)
