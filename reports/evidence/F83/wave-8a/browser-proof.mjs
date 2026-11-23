// F83 wave 8a: the browser proof of the exports on the BUILT sites, the parent (160c702) against this branch.
//
//   SURFACE=edit|saved ENGINE=chromium|webkit PROFILE=1280|900|899|iphone14|se [CONTROL=1] [PART=apple|spotify|json|closing|all] \
//     node browser-proof.mjs <dist of the parent> <dist of this branch>
//
// Two builds are served by a small static server with the fallback to app.html (as the hosting answers a deep route). CONTROL=1 gives the parent twice:
// the noise control (what two runs of the SAME code differ by). Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis,
// firebaseinstallations) and so is every other host. No key is read or written here.
//
// The world the page is given (the same on both sides):
//  * MusicKit is the recorder of test/support/musicKitRecorder.js (the very function the golden of the export plays in jsdom), put at `window.MusicKit` before the
//    page loads, with the token route answered by its `fetch`: the SAME seam as the golden. Every call to it is written to window.__mk, in order.
//  * Spotify is a stand-in: api.spotify.com is answered by the script (a profile, a search that finds every track but those named «Nowhere», the creation of a
//    playlist, the adding of tracks) and every request it gets is written down, in order. A token is seeded in localStorage so the site thinks it is connected.
//  * The saved playlists store is reached by one line added to the END of the screen's file when it is served (the same line on both sides, nothing published):
//    the built site gives no other way to hand that screen a series with Firestore blocked.
// Each step is done on both sides, in step; after it the window (its DOM and every text node), the focus, the notices (text), what MusicKit was asked, what
// Spotify was asked, the file the browser was handed (its bytes) and the pixels of the window are compared. A difference is written with where it is.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import { PNG } from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { installMusicKitRecorder } from '../../../../test/support/musicKitRecorder.js'

const [oldDist, newDist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const SURFACE = process.env.SURFACE || 'edit'
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || '1280'
const CONTROL = process.env.CONTROL === '1'
const PART = process.env.PART || 'all'
const TAG = `${SURFACE}-${ENGINE_NAME}-${PROFILE}${CONTROL ? '-control' : ''}`
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

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 700) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 260) : ''}`) }

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
const SAVED_HOOK = (text) => {
    const klass = text.match(/class ([\w$]+)\{constructor\(\)\{this\.generation=0,this\.userId=null,this\.listStatus/)
    if (!klass) return null
    const store = text.match(new RegExp(`([\\w$]+)=new ${klass[1].replace('$', '\\$')}\\b`))
    const reader = store && text.match(new RegExp(`([\\w$]+)=new [\\w$]+\\(\\{store:${store[1].replace('$', '\\$')}[,}]`))
    return store && reader ? `;window.__saved={store:${store[1]},reader:${reader[1]}};` : null
}
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        let body = fs.readFileSync(file)
        if (/\/assets\/[^/]+\.js$/.test(url.pathname) && body.includes('setListFailed')) {
            const hook = SAVED_HOOK(body.toString('utf8'))
            if (hook) body = Buffer.concat([body, Buffer.from(hook)])
        }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        res.end(body)
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
    return (element) => {
        if (!element) return null
        const clone = element.cloneNode(true)
        const live = [...element.querySelectorAll('input')]
        ;[...clone.querySelectorAll('input')].forEach((input, index) => {
            input.removeAttribute('checked')
            if (live[index].type === 'radio' && live[index].checked) input.setAttribute('data-is-checked', 'true')
            if (live[index].type === 'text') input.setAttribute('data-typed', live[index].value)
            input.removeAttribute('value')
            if (live[index].type === 'radio') input.setAttribute('data-value', live[index].value)
        })
        const boxes = [...element.querySelectorAll('*')].map((n, i) => { const r = n.getBoundingClientRect(); return `${i}:${n.tagName}:${[r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',')}` }).join(';')
        return describe(clone).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim() + '\n' + texts(element) + '\n' + boxes
    }
}
const READ = `(${NORMALIZE.toString()})()`
const WINDOW = '#playlist-export-window, #spotify-export-modal, .sheet'

const browser = await ENGINE.launch()

// ---- the world
const FOLDERS = { folders: [{ id: 'f-1', name: 'Favorites' }, { id: 'f-2', name: 'Workout' }], none: [], error: [], many: Array.from({ length: 250 }, (_, i) => ({ id: `m${i + 1}`, name: i === 249 ? 'Road trip' : `Folder ${i + 1}` })) }
const GENERATED = () => {
    const track = (title, album, duration = 200) => ({ id: `t-${title}`, title, artist: 'Artist', album, duration })
    return [
        { id: 'g1', name: 'Greatest Hits', title: 'Greatest Hits', batchName: 'Mix', tracks: [track('One', 'A'), track('Two', 'A'), track('Three', 'B')] },
        { id: 'g2', name: 'Deep Cuts', title: 'Deep Cuts', batchName: 'Mix', tracks: [track('Four', 'C'), track('Nowhere Man', 'D')] }
    ]
}
const CATALOG = { One: '101', Two: '102', Three: '103', Four: '104' }

/** Spotify, answered by the script; every request is written down. */
function spotifyStandIn(spot) {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    return async (route) => {
        const request = route.request()
        if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return }
        const url = new URL(request.url())
        const api = url.pathname.replace(/^\/v1/, '')
        spot.calls.push([request.method(), api, decodeURIComponent(url.search), request.postData() || ''])
        const json = (body, status = 200) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
        if (spot.mode === 'fail' && request.method() === 'POST' && /\/playlists$/.test(api)) return json({ error: { status: 500, message: 'Server error' } }, 500)
        if (api === '/me') return json({ id: 'u1', display_name: 'Proof' })
        if (api === '/search') {
            const title = (url.searchParams.get('q') || '').match(/track:(.*?) artist:/)?.[1] || 'x'
            const items = /Nowhere/.test(title) ? [] : [{ uri: `spotify:track:${title.replace(/\W/g, '')}`, id: title.replace(/\W/g, ''), name: title, artists: [{ name: 'Artist' }] }]
            return json({ tracks: { items } })
        }
        if (/^\/users\/u1\/playlists$/.test(api)) { spot.made += 1; return json({ id: `pl-${spot.made}`, external_urls: { spotify: `https://open.spotify.com/playlist/pl-${spot.made}` } }, 201) }
        if (/\/playlists\/[^/]+\/tracks$/.test(api)) return json({ snapshot_id: 's1' }, 201)
        return json({}, 404)
    }
}

async function open(base, folders, spotifyMode) {
    const context = await browser.newContext({ ...P.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce', acceptDownloads: true })
    const spot = { calls: [], made: 0, mode: spotifyMode }
    await context.route(url => { const host = new URL(url).hostname; return host !== '127.0.0.1' && host !== 'api.spotify.com' }, route => route.abort())
    await context.route(BLOCKED, route => route.abort())
    await context.route(/api\.spotify\.com/, spotifyStandIn(spot))
    const recorder = `(${installMusicKitRecorder.toString()})`
    await context.addInitScript(({ recorder, behavior }) => {
        window.__mk = []
        // eslint-disable-next-line no-eval
        eval(recorder)(window, window.__mk, behavior)
        Date.prototype.toLocaleTimeString = () => '12:00:00 PM'
        try {
            localStorage.setItem('albumBlender.appleMusic.authorized', '1')
            localStorage.setItem('spotify_access_token', 'proof-token')
            localStorage.setItem('spotify_expires_at', String(Date.now() + 3600000))
        } catch { /* none */ }
    }, { recorder, behavior: { catalog: CATALOG, folders: FOLDERS[folders] || [], folderListFails: folders === 'error', pageSize: 100 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) })
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|identitytoolkit|auth\/|^Worker Error|Folder operation failed|Authentication issue|Folders unavailable|\[AppleMusic|Export failed|\[MusicKit|\[SpotifyService\]|\[SpotifyExport/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    const downloads = []
    page.on('download', async (download) => {
        const stream = await download.createReadStream()
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        const bytes = Buffer.concat(chunks)
        downloads.push(`${download.suggestedFilename()} ${bytes.length} B sha256 ${crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 16)}`)
    })
    const hide = `#toast-container, footer, .site-footer, [data-footer-clock], #footer-clock { visibility: hidden !important }`
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 40000 })
    await page.addStyleTag({ content: hide })
    await page.waitForTimeout(3000) // the notice the app gives when Firebase Auth is blocked comes some seconds after the load, on either side
    await page.evaluate(() => document.querySelectorAll('#toast-container .toast').forEach(toast => toast.remove()))
    return { context, page, errors, spot, downloads }
}

async function stage(base, folders, spotifyMode) {
    const side = await open(base, folders, spotifyMode)
    const page = side.page
    if (SURFACE === 'edit') {
        await page.addScriptTag({ content: `window.__generated = ${GENERATED.toString()}` })
        await page.evaluate(() => { window.playlistsStore.setPlaylists(window.__generated(), 'sA'); window.playlistsStore.setBatchName('Mix'); window.router.navigate('/playlists') })
        await page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
        await page.waitForTimeout(1200)
        return side
    }
    await page.evaluate(() => window.router.navigate('/saved-playlists'))
    await page.waitForSelector('#genericSearch', { timeout: 20000 })
    await page.waitForFunction(() => window.__saved, null, { timeout: 20000 })
    await page.evaluate(() => {
        window.__saved.reader.load = () => new Promise(() => {})
        window.__saved.reader.refreshSeries = () => Promise.resolve()
        const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
        const playlist = (id, batchName, tracks) => ({ id, name: `Playlist ${id}`, title: id === 'p1' ? 'Kashmir set' : undefined, batchName, savedAt: '2026-11-01T10:00:00Z', tracks })
        const playlists = [playlist('p1', 'Sunday mix', [track('One', 'Physical Graffiti', 510), track('Two', 'Led Zeppelin II', 275)]), playlist('p2', 'Sunday mix', [track('Three', 'Raising Sand', 200), track('Nowhere Man', 'Raising Sand', 190)]), playlist('p3', 'Sunday mix', [track('Four', 'Album')])]
        const entry = { seriesId: 's1abcdefghij', series: { id: 's1abcdefghij', name: 'Plant', updatedAt: '2026-11-01T00:00:00Z' }, status: 'ready', error: null, refreshing: false, thumbnails: [], playlists, batches: [{ name: 'Sunday mix', savedAt: '2026-11-01T10:00:00Z', playlists }] }
        window.__saved.store.begin(1, 'u1')
        window.__saved.store.setSeries([entry])
        window.__saved.store.flush()
    })
    await page.waitForTimeout(1500)
    if (PHONE) {
        await page.locator('.saved-series-toggle').first().click()
        await page.locator('.saved-phone-batch__main').first().click()
        await page.waitForTimeout(800)
    } else {
        await page.locator('.batch-header').first().click().catch(() => {})
        await page.waitForTimeout(800)
    }
    return side
}

function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, delta = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) { apart++; delta = Math.max(delta, d); const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    }
    return { apart, delta, y1, box: apart ? `x ${x0}-${x1}, y ${y0}-${y1}` : '' }
}

const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}[${e.dataset?.export || e.dataset?.appleExport || e.dataset?.folderBack || e.dataset?.phoneAction || e.dataset?.action || e.getAttribute('aria-label') || e.className}]` })
const mkNow = (page) => page.evaluate(() => JSON.stringify(window.__mk))
const toastsNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('#toast-container .toast')].map(e => e.textContent.trim().replace(/\s+/g, ' ')).filter(t => !/^Authentication issue/.test(t))))
const windowNow = (page) => page.evaluate(`(() => { const read = ${READ}; const w = document.querySelector('${WINDOW}'); return w ? read(w) : null })()`)
const clearToasts = (page) => page.evaluate(() => document.querySelectorAll('#toast-container .toast').forEach(toast => toast.remove()))

let shots = 0
/** Does the step on both sides, in step, and compares what it left. */
async function step(label, sides, run, { wait = 1100, shoot = false, soft = '' } = {}) {
    const [a, b] = sides
    for (const side of sides) { await run(side.page, side); await side.page.waitForTimeout(wait) }
    const [wa, wb] = [await windowNow(a.page), await windowNow(b.page)]
    note(`${TAG} · ${label} · the window (elements, text nodes, boxes)`, wa === wb, wa === wb ? `${(wa || 'none').length} chars` : `\n parent: ${String(wa).slice(0, 300)}\n mine:   ${String(wb).slice(0, 300)}`)
    const [fa, fb] = [await focusNow(a.page), await focusNow(b.page)]
    note(`${TAG} · ${label} · the focus`, fa === fb, `${fa} | ${fb}`)
    const [ma, mb] = [await mkNow(a.page), await mkNow(b.page)]
    note(`${TAG} · ${label} · what MusicKit was asked`, ma === mb, ma === mb ? `${JSON.parse(ma).length} calls` : `\n parent: ${ma.slice(0, 300)}\n mine:   ${mb.slice(0, 300)}`)
    const [sa, sb] = [JSON.stringify(a.spot.calls), JSON.stringify(b.spot.calls)]
    note(`${TAG} · ${label} · what Spotify was asked`, sa === sb, sa === sb ? `${a.spot.calls.length} requests` : `\n parent: ${sa.slice(0, 300)}\n mine:   ${sb.slice(0, 300)}`)
    const [da, db] = [a.downloads.join(' | '), b.downloads.join(' | ')]
    note(`${TAG} · ${label} · the file handed to the browser`, da === db, da === db ? (da || 'none') : `\n parent: ${da}\n mine:   ${db}`)
    const [ta, tb] = [await toastsNow(a.page), await toastsNow(b.page)]
    note(`${TAG} · ${label} · the notices (text)`, ta === tb, ta === tb ? ta.slice(0, 200) : `\n parent: ${ta}\n mine:   ${tb}`)
    if (wa && wb) {
        const pick = async (page) => (await page.locator(WINDOW).first().screenshot({ animations: 'disabled', caret: 'hide' }))
        const [pa, pb] = [await pick(a.page), await pick(b.page)]
        const { apart, delta, box, y1 } = pixelsApart(pa, pb)
        // the known noise of the top bar (the Apple Music button of the shell, a transition still running: lessons 14), seen in the control too: at most a few pixels, 1 or 2 of 255, inside the bar
        const noise = apart > 0 && apart <= 8 && delta <= 2 && y1 <= 60
        note(`${TAG} · ${label} · the pixels of the window${noise ? ' (NOISE of the top bar, as in the control)' : ''}`, apart === 0 || noise, apart === 0 ? '0 pixels apart' : `${apart} pixels apart (largest ${delta} of 255, ${box})`)
        if (shoot && shots < 6 && !CONTROL) {
            shots++
            const name = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)
            fs.writeFileSync(path.join(SHOTS, `${TAG}-${shots}-${name}-parent.png`), pa)
            fs.writeFileSync(path.join(SHOTS, `${TAG}-${shots}-${name}-mine.png`), pb)
        }
    }
    for (const side of sides) await clearToasts(side.page)
}

const press = (selector) => async (page) => { await page.locator(selector).first().click() }
const key = (name) => async (page) => { await page.keyboard.press(name) }
const pick = (mode, value) => async (page) => { await page.locator(`input[name="apple-folder"][data-mode="${mode}"]${value ? `[value="${value}"]` : ''}`).first().check({ force: true }) }
const typeName = (text) => async (page) => { await page.locator('[data-folder-name]').fill(text) }
const fillSpotify = (text) => async (page) => { await page.locator('#playlistNameInput').fill(text) }
const outside = async (page) => { await page.mouse.click(PHONE ? 195 : 8, PHONE ? 30 : 8) }
const none = async () => {}

/** How the window is opened on this screen and profile (the sheet or the window of the three ways out; the edit screen of the computer has a button for each). */
const OPENERS = {
    edit: PHONE ? { all: '[data-phone-action="export"]' } : { apple: '#exportAppleMusicBtn', spotify: '#exportSpotifyBtn', json: '#exportJsonBtn' },
    saved: PHONE ? { all: '.saved-phone-batch .phone-more' } : { all: '[aria-label^="Export batch"]' }
}[SURFACE]
const openAll = async (page) => {
    await page.locator(OPENERS.all).first().click()
    if (SURFACE === 'saved' && PHONE) { await page.waitForTimeout(500); await page.locator('.saved-phone-sheet .albums-sheet__row:nth-child(2)').first().click() }
}
const openFor = (which) => (OPENERS[which] ? press(OPENERS[which]) : async (page) => { await openAll(page); await page.waitForTimeout(600) })
const choose = (which) => async (page) => { if (OPENERS[which]) return; await page.locator(`[data-export="${which}"]`).first().click() }

async function appleFlow(sides, mode) {
    await step(`[${mode}] Apple Music: the window opened`, sides, async (page) => { await openFor('apple')(page); await choose('apple')(page) }, { wait: 1600, shoot: mode === 'folders' })
    if (mode === 'folders') {
        await step('a folder of the library picked', sides, pick('existing', 'Workout'), { shoot: true })
        await step('New folder, no name: asked for it', sides, async (page) => { await pick('new')(page); await page.locator('[data-apple-export]').click() })
        await step('New folder, a name typed', sides, typeName('Trip 2026'))
        await step('No folder', sides, pick('none'))
    }
    if (mode === 'many') await step('the folder of the series, on the last page of 250', sides, async () => {}, { shoot: true })
    await step(`[${mode}] Export pressed: what Apple Music is asked`, sides, press('[data-apple-export]'), { wait: 3500, shoot: true })
    await step(`[${mode}] Escape: the window goes, the focus goes back`, sides, key('Escape'), { wait: 800 })
}

async function spotifyFlow(sides, failing) {
    await step(`Spotify${failing ? ' (the creation fails)' : ''}: the window`, sides, async (page) => { await openFor('spotify')(page); await choose('spotify')(page) }, { wait: 1600, shoot: !failing })
    if (failing) {
        await step('Export pressed: it fails', sides, press('#startExportBtn'), { wait: 3500, shoot: true })
        await step('Try again', sides, press('#retryExportBtn'), { wait: 3500 })
        await step('Close on the report', sides, async (page) => { await page.locator('.close-modal-btn').last().click() }, { wait: 800 })
        return
    }
    await step('the mode: separate', sides, async (page) => { await page.locator('input[name="exportMode"][value="separate"]').check({ force: true }) })
    await step('a name typed', sides, fillSpotify('My blend'))
    await step('the backdrop closes the window', sides, async (page) => { await page.locator('.modal-backdrop').click({ position: { x: 4, y: 4 } }) }, { wait: 800 })
    await step('opened again', sides, async (page) => { await openFor('spotify')(page); await choose('spotify')(page) }, { wait: 1600 })
    await step('Export pressed: the playlists are created and the report is shown', sides, press('#startExportBtn'), { wait: 5000, shoot: true })
    await step('Escape does nothing', sides, key('Escape'), { wait: 600 })
    await step('Close on the report', sides, async (page) => { await page.locator('.close-modal-btn').last().click() }, { wait: 800 })
}

async function jsonFlow(sides) {
    await step('the file: asked for', sides, async (page) => { await openFor('json')(page); await choose('json')(page) }, { wait: 1500 })
}

async function closingFlow(sides) {
    const reopen = async (page) => { if (OPENERS.apple) await press(OPENERS.apple)(page); else await openAll(page) }
    await step('closing: opened', sides, reopen, { wait: 1200 })
    await step('closing: Escape', sides, key('Escape'), { wait: 800 })
    await step('closing: opened again', sides, reopen, { wait: 1200 })
    await step('closing: a press outside', sides, outside, { wait: 800 })
    await step('closing: opened a third time', sides, reopen, { wait: 1200 })
    await step('closing: the close button', sides, async (page) => { await page.locator('#playlist-export-window [aria-label="Close"], .sheet [aria-label="Close"], .sheet .sheet-close').first().click() }, { wait: 800 })
}

async function drive(label, folders, spotifyMode, run) {
    const [a, b] = [await serve(oldDist), await serve(CONTROL ? oldDist : newDist)]
    const sides = [await stage(a.base, folders, spotifyMode), await stage(b.base, folders, spotifyMode)]
    try { await run(sides) } catch (error) { note(`${TAG} · ${label} · the run itself`, false, error.message.split('\n')[0]) }
    for (const [index, side] of sides.entries()) note(`${TAG} · ${label} · no page error on ${index === 0 ? 'the parent' : 'this branch'}`, side.errors.length === 0, side.errors.join(' | '))
    for (const side of sides) await side.context.close()
    a.server.close(); b.server.close()
}

const want = (part) => PART === 'all' || PART === part
if (want('apple')) for (const mode of ['folders', 'none', 'error', 'many']) await drive(`apple ${mode}`, mode, 'ok', (sides) => appleFlow(sides, mode))
if (want('spotify')) { await drive('spotify', 'folders', 'ok', (sides) => spotifyFlow(sides, false)); await drive('spotify fails', 'folders', 'fail', (sides) => spotifyFlow(sides, true)) }
if (want('json')) await drive('json', 'folders', 'ok', jsonFlow)
if (want('closing')) await drive('closing', 'folders', 'ok', closingFlow)

await browser.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}-${PART}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
