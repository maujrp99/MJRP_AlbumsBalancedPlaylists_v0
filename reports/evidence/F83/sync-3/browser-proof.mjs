// F83 sync 3: the browser proof that the lean Start screen in React (this branch) is the lean Start of `main` (hand-made, b8947e0, F79 / UAT-281),
// on the BUILT sites. Run from the repo root with `vite preview` servers over three builds (the build of `main`, the build of this branch, and the
// build of this branch's parent, b143b4f, for the computer):
//
//   ENGINE=webkit PROFILE=393x852 node reports/evidence/F83/sync-3/browser-proof.mjs <base of main> <base of the branch>   (the computer: <base of the parent> <base of the branch>)
//
// ENGINE=webkit|chromium · PROFILE=393x852 | 375x667 (the phone: WebKit with the iPhone profile, the window of the size named) | 1280 (the computer)
// ACCOUNT=1 draws the page for a signed-in person (see below) · OLD_AGAINST_OLD=1 compares the build of `main` with itself (the control of noise)
// RESULT_TAG names the result file and the captures folder · OUT_DIR is where the pictures go (default: captures<TAG> beside this file).
//
// Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations are aborted before the page loads):
// nobody is made anonymous in production by this proof. The catalog is a stand-in: the script of MusicKit is answered by a small one whose
// `api.music` knows one artist («Pink Floyd», 14 albums) and nothing else (so «Nobody» is «not found»), and the covers (mzstatic) are plain pictures.
// The REAL MusicKit (the developer token of the server, the catalog of Apple) is NOT exercised. A visitor is the page as it comes (Firebase blocked,
// nobody signed in). A signed-in person (ACCOUNT=1) is made the way Firebase restores one without the network: a user saved in the page's IndexedDB
// before the page loads (the reload of the user, which asks securetoken, is blocked and fails as a network error, which Firebase takes as «offline»
// and keeps the user). The motion is asked off (prefers-reduced-motion) so the equalizer stands still and the pixels can be compared.
//
// For every state each side is photographed (the whole window) and compared pixel by pixel; the visible text, the place of the main boxes, where the focus is,
// the height of the page and the bottom padding of the page are compared too. Results: raw/results<TAG>.json, captures<TAG>/.
import { chromium, webkit, devices } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [oldBase, newBase] = process.argv.slice(2) // for the computer, oldBase is the parent of this branch (b143b4f) and newBase this branch
const HERE = path.dirname(new URL(import.meta.url).pathname)
const TAG = process.env.RESULT_TAG || ''
const CAPTURES = process.env.OUT_DIR || path.join(HERE, 'captures' + TAG)
fs.mkdirSync(CAPTURES, { recursive: true })
fs.mkdirSync(path.join(HERE, 'raw'), { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const ENGINE = process.env.ENGINE === 'chromium' ? chromium : webkit
const PROFILE = process.env.PROFILE || '393x852'
const COMPUTER = PROFILE === '1280'
const ACCOUNT = process.env.ACCOUNT === '1'
const API_KEY = process.env.API_KEY || 'AIzaSyA8x-II628CK3qQmmfr-WJE13LXdu7nAxs' // the public key of the web app (public/js/firebase-config.js)

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 600) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }

const contextOptions = () => {
    if (COMPUTER) return { reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } }
    const [width, height] = PROFILE.split('x').map(Number)
    return { ...devices['iPhone 14'], viewport: { width, height }, reducedMotion: 'reduce' }
}

// ---- the stand-in of MusicKit: one artist, fourteen albums, the rest «not found»
const ALBUMS = [
    ['The Piper at the Gates of Dawn', '1967-08-05'], ['A Saucerful of Secrets', '1968-06-29'], ['More', '1969-06-13'], ['Ummagumma', '1969-11-07'],
    ['Atom Heart Mother', '1970-10-02'], ['Meddle', '1971-10-30'], ['Obscured by Clouds', '1972-06-02'], ['The Dark Side of the Moon', '1973-03-01'],
    ['Wish You Were Here', '1975-09-12'], ['Animals', '1977-01-23'], ['The Wall', '1979-11-30'], ['The Final Cut', '1983-03-21'],
    ['A Momentary Lapse of Reason', '1987-09-07'], ['The Division Bell', '1994-03-28']
].map(([name, releaseDate], i) => ({
    id: `pf-${i}`,
    attributes: { name, artistName: 'Pink Floyd', releaseDate, trackCount: 9 + (i % 5), isSingle: false, isCompilation: false, url: `https://music.apple.com/pf-${i}`, artwork: { url: `https://is1-ssl.mzstatic.com/image/pf/{w}x{h}bb.jpg?c=${i}` } }
}))
const MUSICKIT_STAND_IN = `
(() => {
  const ALBUMS = ${JSON.stringify(ALBUMS)}
  const instance = {
    storefrontId: 'us', isAuthorized: false, musicUserToken: '', addEventListener() {}, removeEventListener() {},
    api: { music: async (path, params) => {
      if (/\\/search$/.test(path)) return { data: { results: { artists: { data: /floyd/i.test(String(params && params.term)) ? [{ id: 'pf' }] : [] } } } }
      if (/\\/artists\\/pf\\/albums$/.test(path)) return { data: { data: ALBUMS } }
      return { data: { data: [] } }
    } }
  }
  window.MusicKit = { configure: async () => {}, getInstance: () => instance }
})()`

async function open(base, route, size) {
    const context = await browser.newContext({ ...contextOptions(), ...(size ? { viewport: size } : {}) })
    const page = await context.newPage()
    await page.route(BLOCKED, (r) => r.abort())
    await page.route(/mzstatic\.com/, (r) => {
        const c = Number(new URL(r.request().url()).searchParams.get('c') || 0)
        const hue = (c * 47) % 360
        return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${hue},45%,38%)"/></svg>` })
    })
    await page.route(/\/api\/musickit-token/, (r) => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
    await page.route(/js-cdn\.music\.apple\.com/, (r) => r.fulfill({ contentType: 'application/javascript', body: MUSICKIT_STAND_IN }))
    if (ACCOUNT) {
        await page.addInitScript((apiKey) => {
            const user = { uid: 'proof-user', email: 'proof@example.test', emailVerified: true, displayName: 'Proof', isAnonymous: false, providerData: [{ providerId: 'google.com', uid: 'proof', displayName: 'Proof', email: 'proof@example.test', phoneNumber: null, photoURL: null }], stsTokenManager: { refreshToken: 'r', accessToken: 'a', expirationTime: Date.now() + 3600e3 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' }
            const open = indexedDB.open('firebaseLocalStorageDb', 1)
            open.onupgradeneeded = () => { open.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }
            open.onsuccess = () => { const tx = open.result.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: user }) }
        }, API_KEY)
    }
    await page.goto(base + route, { waitUntil: 'load' })
    await page.waitForTimeout(2200)
    return { context, page }
}

function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, delta = 0
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) {
            apart++; delta = Math.max(delta, d)
            const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width)
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
        }
    }
    return { apart, delta, y1, scale: one.width, box: apart ? `box x ${x0}-${x1}, y ${y0}-${y1}, largest difference ${delta} of 255` : '' }
}

const slug = (text) => text.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 70)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' && !e.id ? '.' + e.className.split(' ').join('.') : ''}:${(e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)}` })

/** What a person sees and the boxes that decide how it looks: compared as numbers (rounded to a tenth of a pixel). */
const FACTS = () => {
    const visible = (el) => { if (!el) return false; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[hidden]') }
    const box = (selector) => { const el = document.querySelector(selector); if (!visible(el)) return null; const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10) }
    const text = (selector) => { const el = document.querySelector(selector); return visible(el) ? el.innerText.replace(/\s+/g, ' ').trim() : null }
    const page = document.querySelector('#home-page')
    const style = (el, name) => (el ? getComputedStyle(el)[name] : null)
    const h1 = document.querySelector('.home-hero h1')
    const field = document.querySelector('#artistScanInput')
    return {
        title: text('.home-hero h1'), titleSize: visible(h1) ? style(h1, 'fontSize') : null,
        whatLink: text('.home-what'), sentence: text('.home-hero p'), steps: text('#homeHow'),
        placeholder: visible(field) ? field.placeholder : null, ariaLabel: field ? field.getAttribute('aria-label') : null,
        hint: text('#homeHint'), hintBox: box('#homeHint'), guest: text('#homeGuestStage'), message: text('#homeMessage'),
        dockBar: visible(document.querySelector('.home-dock.phone-action-bar')), undo: text('.home-undo'),
        pagePaddingBottom: style(page, 'paddingBottom'), pageHeight: document.documentElement.scrollHeight,
        boxes: { h1: box('.home-hero h1'), what: box('.home-what'), field: box('#homeField'), hint: box('#homeHint'), guest: box('#homeGuestStage'), paste: box('#homePaste'), grid: box('#discographyGrid'), bar: box('.home-dock.phone-action-bar'), undoBox: box('.home-undo'), dockwrap: box('.home-dockwrap') },
        sheet: text('.sheet'), sheetBox: box('.sheet'), sheetId: document.querySelector('.sheet')?.id || null,
        scrollY: Math.round(window.scrollY)
    }
}

const browser = await ENGINE.launch()
const bases = [oldBase, process.env.OLD_AGAINST_OLD === '1' ? oldBase : newBase]
const pair = (route, size) => Promise.all(bases.map(base => open(base, route, size)))
const close = (opened) => Promise.all(opened.map(({ context }) => context.close()))
const pages = (opened) => opened.map(({ page }) => page)
let shots = 0

async function state(label, opened, { skipPixels = false } = {}) {
    const ps = pages(opened)
    await ps[0].waitForTimeout(350)
    const [fa, fb] = await Promise.all(ps.map(p => p.evaluate(`(${FACTS.toString()})()`)))
    const factsAlike = JSON.stringify(fa) === JSON.stringify(fb)
    let detail = ''
    if (!factsAlike) detail = Object.keys(fa).filter(k => JSON.stringify(fa[k]) !== JSON.stringify(fb[k])).map(k => `${k}: old ${JSON.stringify(fa[k])} · new ${JSON.stringify(fb[k])}`).join(' || ')
    note(`${label}: facts (text, boxes, padding, height)`, factsAlike, detail)
    const [fo, fn] = await Promise.all(ps.map(focusNow))
    note(`${label}: focus`, fo === fn, fo === fn ? fo : `old ${fo} · new ${fn}`)
    if (skipPixels) return
    let [imgA, imgB] = await Promise.all(ps.map(p => p.screenshot()))
    let { apart, delta, box, y1, scale } = pixelsApart(imgA, imgB)
    // A difference that sits wholly inside the bar of the top (the first 80 px of the window: the menu of the shell, which this port does not touch) may be
    // a transition of the bar still running (the bar's buttons fade): the pictures are taken again after a pause, and what the second pair says is noted too.
    // The same goes for a difference of at most 4 of 255 on a pixel: the ring of the focused field fades in (a transition of 0.15 s on `.home-field`), and the
    // control that compares `main` with `main` shows the same sort of sobra (first round: 11,488 pixels, at most 4 of 255, around the field).
    const inTheBar = apart > 0 && Number.isFinite(y1) && (y1 < 80 * (scale / ps[0].viewportSize().width) || delta <= 4)
    let settled = ''
    if (inTheBar) {
        await ps[0].waitForTimeout(1500);
        [imgA, imgB] = await Promise.all(ps.map(p => p.screenshot()))
        const again = pixelsApart(imgA, imgB)
        settled = `; first shot: ${apart} pixels apart, ${box}, all inside the top bar or at most 4 of 255; after 1.5 s: ${again.apart === 0 ? '0 pixels apart' : `${again.apart} pixels apart, ${again.box}`}`
        if (again.apart === 0) { apart = 0; box = '' }
    }
    note(`${label}: pixels`, apart === 0, apart === 0 ? `0 pixels apart${settled}` : `${apart} pixels apart, ${box}${settled}`)
    if (shots < 40 && (apart > 0 || /first visit|chosen|results|sheet/.test(label))) {
        fs.writeFileSync(path.join(CAPTURES, `${slug(label)}-old.png`), imgA)
        fs.writeFileSync(path.join(CAPTURES, `${slug(label)}-new.png`), imgB)
        shots++
    }
}

const everywhere = async (opened, fn) => { await Promise.all(pages(opened).map(fn)); await pages(opened)[0].waitForTimeout(500) }
// The search is made with Enter in the field: a mouse click on «Search» while the field has the focus is lost on `main` in WebKit (the hand-made stage
// writes the text of the button again when the field loses the focus, which happens between the press and the release, and WebKit then sends no click);
// the React button is not touched by that and takes the click (the one deliberate difference, tried by itself at the end of the run).
const search = (opened, text) => everywhere(opened, async (p) => { await p.fill('#artistScanInput', text); await p.keyboard.press('Enter') })
const cover = (n) => `#discographyGrid [data-action="pick-album"]:nth-child(${n})`
const pick = (opened, ...ns) => (async () => { for (const n of ns) await everywhere(opened, (p) => p.click(cover(n))) })()
const SIZE = COMPUTER ? '1280' : PROFILE
const tag = ACCOUNT ? `${SIZE}, signed in` : `${SIZE}, visitor`

// ---- first visit; typing; results; chosen; the last one removed
{
    const opened = await pair('/start')
    await state(`${tag} · first visit`, opened)
    await everywhere(opened, (p) => p.focus('#artistScanInput'))
    await everywhere(opened, (p) => p.keyboard.type('Pink Fl'))
    await state(`${tag} · typing`, opened)
    await everywhere(opened, (p) => p.fill('#artistScanInput', ''))
    await search(opened, 'Pink Floyd')
    await state(`${tag} · results`, opened)
    const noticeOf = () => Promise.all(pages(opened).map(p => p.evaluate(() => { const g = document.querySelector('#homeGuestStage'); return g && !g.hidden ? g.innerText.trim() : null })))
    if (!COMPUTER) { const n = await noticeOf(); note(`${tag} · results, nothing chosen: no visitor notice on either side`, n[0] === null && n[1] === null, JSON.stringify(n)) }
    await pick(opened, 1, 3, 5)
    await state(`${tag} · three chosen`, opened)
    if (!COMPUTER) { const n = await noticeOf(); const want = ACCOUNT ? [null, null] : [n[0], n[0]]; note(`${tag} · three chosen: the visitor notice ${ACCOUNT ? 'is absent for a signed-in person' : 'shows for a visitor'}, on both sides`, JSON.stringify(n) === JSON.stringify(want) && (ACCOUNT ? true : /not signed in/.test(n[0] || '')), JSON.stringify(n)) }
    await pick(opened, 5, 3)
    await state(`${tag} · one left`, opened)
    await pick(opened, 1)
    await state(`${tag} · last album removed (Undo strip only)`, opened)
    await close(opened)
}
// ---- paste; and back
{
    const opened = await pair('/start')
    await everywhere(opened, (p) => p.click('#homeHint [data-home-mode="paste"]'))
    await state(`${tag} · paste`, opened)
    await everywhere(opened, (p) => p.click('#homeHint [data-home-mode="artist"]'))
    await state(`${tag} · back from the paste`, opened)
    await close(opened)
}
// ---- not found
{
    const opened = await pair('/start')
    await search(opened, 'Nobody Xyz')
    await state(`${tag} · not found`, opened)
    await everywhere(opened, (p) => p.click('#homeMessage [data-home-mode="paste"]'))
    await state(`${tag} · the list opened from the message`, opened)
    await close(opened)
}
// ---- «What is a series?» (the phone) and the sheet; closed by its button and by Escape
if (!COMPUTER) {
    const opened = await pair('/start')
    await everywhere(opened, (p) => p.click('.home-what'))
    await opened[0].page.waitForTimeout(500)
    await state(`${tag} · sheet open: What is a series?`, opened)
    await everywhere(opened, (p) => p.click('#whatIsASeries .sheet__close'))
    await opened[0].page.waitForTimeout(500)
    await state(`${tag} · sheet closed by its button`, opened)
    await everywhere(opened, (p) => p.click('.home-what'))
    await everywhere(opened, (p) => p.keyboard.press('Escape'))
    await opened[0].page.waitForTimeout(500)
    await state(`${tag} · sheet closed by Escape`, opened)
    // the series sheet still opens from the bar after a cover is chosen
    await search(opened, 'Pink Floyd')
    await pick(opened, 2, 4)
    await everywhere(opened, (p) => p.click('.home-dock__open'))
    await opened[0].page.waitForTimeout(500)
    await state(`${tag} · the series sheet from the bar`, opened)
    await close(opened)
}
// ---- the button «Search» pressed by the mouse with the field focused: does the search start?
{
    const opened = await pair('/start')
    await everywhere(opened, async (p) => { await p.fill('#artistScanInput', 'Pink Floyd'); await p.click('#btnScanArtist') })
    await opened[0].page.waitForTimeout(800)
    const started = await Promise.all(pages(opened).map(p => p.evaluate(() => !!document.querySelector('#discographyGrid [data-action="pick-album"]'))))
    note(`${tag} · a click on «Search» with the field focused starts the search (the branch must; UAT-282 is the hand-made button on main in WebKit)`, started[1] === true, `main: ${started[0]} · branch: ${started[1]}`)
    await close(opened)
}

fs.writeFileSync(path.join(HERE, 'raw', `results${TAG}.json`), JSON.stringify(results, null, 1))
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length} of ${results.length} comparisons passed`)
await browser.close()
process.exit(0)
