// F83 wave 7a: the browser proof that the panel «Reconfigure your Music Playlist Blend» of the playlists screen in React (this branch) is the hand-made panel of
// its parent (b29b552), on the BUILT sites, and that the hand-made Blend screen (untouched, wave 7b) is still the parent's. Two builds are served by a small static
// server with the fallback to app.html, as the hosting has it:
//
//   ENGINE=webkit|chromium PROFILE=1280|900|899|iphone14|se [OLD_AGAINST_OLD=1] [PART=panel|blend] node browser-proof.mjs <dist of the parent> <dist of this branch>
//
// What is driven, the same way on both sides (real mouse clicks, or taps on a phone profile; real keys): the playlists screen with a set of playlists put in the
// playlists store (the built site puts the store on `window`), the panel shut, open, each recipe chosen, each ingredient, the slider with the keyboard, the Tab
// order through the panel, «Regenerate Playlists» with no series (the failure: the toast) and with a series whose albums do not come (generating, then the failure);
// on a phone the «⋯» of a playlist -> «Reconfigure and regenerate» (the panel opens and the page scrolls to it), asked again while open. PART=blend drives the
// hand-made Blend screen (a series in the store, the series chosen, each recipe, an ingredient, the slider).
// For every step: the panel's elements (tag, attributes, classes as a set, text, the value of a field), the box of every element, where the focus is, the scroll,
// and two pictures (the panel, and the viewport) are compared, the old against the new; a difference is written with where it is. Firebase Auth and Firestore are
// BLOCKED (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations) and so is every other host (the pages get no font and no cover from outside:
// the same on both sides). The time in the foot of the page is fixed. Nothing here reads or writes a key.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import { PNG } from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'chromium' ? 'chromium' : 'webkit'
const ENGINE = ENGINE_NAME === 'chromium' ? chromium : webkit
const PROFILE = process.env.PROFILE || '1280'
const PART = process.env.PART || 'panel'
const OLD_ONLY = process.env.OLD_AGAINST_OLD === '1'
const TAG = `${PART}-${ENGINE_NAME}-${PROFILE}${OLD_ONLY ? '-old-vs-old' : ''}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const RAW = path.join(HERE, 'raw')
const DIFFS = path.join(HERE, 'diffs')
fs.mkdirSync(RAW, { recursive: true })
fs.mkdirSync(DIFFS, { recursive: true })

const PROFILES = {
    1280: { computer: true, options: { viewport: { width: 1280, height: 800 } } },
    900: { computer: true, options: { viewport: { width: 900, height: 800 } } },
    899: { computer: false, options: { viewport: { width: 899, height: 800 } } },
    iphone14: { computer: false, touch: true, options: { ...devices['iPhone 14'] } },
    se: { computer: false, touch: true, options: { ...devices['iPhone SE'] } }
}
const PROFILE_OF = PROFILES[PROFILE]
if (!PROFILE_OF) throw new Error(`unknown profile ${PROFILE}`)

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 600) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 240) : ''}`) }

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

// ---- the world
const track = (title, artist, album, duration, extra = {}) => ({ id: `t-${title}`, title, artist, album, duration, ...extra })
const META = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 3600 }
const PLAYLISTS = [
    { id: 'p1', name: 'Playlist 1', title: 'Greatest Hits', batchName: 'Proof batch', _meta: { ...META }, tracks: [track('Kashmir', 'Led Zeppelin', 'Physical Graffiti', 510, { rank: 1, rating: 94, spotifyRank: 2 }), track('Ramble On', 'Led Zeppelin', 'Led Zeppelin II', 275, { rank: 7, rating: 88, spotifyPopularity: 71 }), track('Time', 'Pink Floyd', 'The Dark Side of the Moon', 413, { spotifyRank: 5 })] },
    { id: 'p2', name: 'Playlist 2', batchName: 'Proof batch', _meta: { ...META }, tracks: [track('Gone Gone Gone', 'Plant & Krauss', 'Raising Sand', 200, { rank: 12 }), track('Money', 'Pink Floyd', 'The Dark Side of the Moon', 382)] },
    { id: 'p3', name: 'Playlist 3', batchName: 'Proof batch', _meta: { ...META }, tracks: [] }
]
const SERIES = { id: 'sProof', name: 'Proof series', albumQueries: [{ artist: 'Pink Floyd', album: 'The Wall' }, { artist: 'Led Zeppelin', album: 'IV' }], createdAt: new Date('2026-11-01T00:00:00Z'), updatedAt: new Date('2026-11-01T00:00:00Z') }
const BLEND_SERIES = [
    { id: 'bs1', name: 'Floyd and friends', albumQueries: [{ artist: 'Pink Floyd', album: 'The Wall' }, { artist: 'Pink Floyd', album: 'Animals' }, { artist: 'Led Zeppelin', album: 'IV' }] },
    { id: 'bs2', name: 'Rush & Friends', albumQueries: [{ artist: 'Rush', album: 'Moving Pictures' }] },
    { id: 'bs3', name: 'Empty one', albumQueries: [] }
]
const RECIPES = ['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user']

// ---- what is read from a page: the panel as elements, the boxes, the focus (the same text of code on both sides)
const READ = `(root) => {
  const el = document.querySelector(root)
  if (!el) return null
  const attrs = (n) => [...n.attributes].map(({ name, value }) => [name, name === 'class' ? value.split(/\\s+/).filter(Boolean).sort().join(' ') : value]).sort(([a], [b]) => a.localeCompare(b)).map(([n2, v]) => ' ' + n2 + '="' + v + '"').join('')
  const desc = (n) => {
    if (n.nodeType === 3) return n.textContent.replace(/\\s+/g, ' ')
    if (n.nodeType !== 1) return ''
    const tag = n.tagName.toLowerCase()
    const kids = [...n.childNodes].filter(c => c.nodeType === 1 || (c.nodeType === 3 && /\\S/.test(c.textContent)))
    const inner = kids.map(desc).map((part, i) => (i > 0 && kids[i].nodeType === 3 && kids[i - 1].nodeType === 3 ? '|' + part : part)).join('')
    const own = tag === 'input' ? ' value="' + n.value + '"' : ''
    return '<' + tag + attrs(n) + own + '>' + inner + '</' + tag + '>'
  }
  const boxes = []
  el.querySelectorAll('*').forEach((n, i) => { const r = n.getBoundingClientRect(); boxes.push(i + ':' + n.tagName + ':' + [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',')) })
  const toasts = [...document.querySelectorAll('[class*="toast"]')].map(t => t.textContent.replace(/\\s+/g, ' ').trim()).filter(t => t && !/^Authentication issue/.test(t)).join(' | ') // the notice of the blocked sign-in comes and goes with the time since the page opened: it is not the panel's
  const overlay = Boolean(document.querySelector('.loading-overlay'))
  const r = el.getBoundingClientRect()
  const a = document.activeElement
  const focus = !a || a === document.body ? 'body' : a.tagName.toLowerCase() + '#' + a.id + '.' + (a.dataset ? (a.dataset.action || a.dataset.recipeId || a.dataset.count || a.dataset.output || a.dataset.grouping || a.dataset.ranking || '') : '')
  return { dom: desc(el), boxes: boxes.join(';'), toasts, overlay, focus, scrollY: Math.round(window.scrollY * 100) / 100, scrollX: window.scrollX, overflowX: document.documentElement.scrollWidth > window.innerWidth, rect: { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height } }
}`

function diffPixels(a, b, ignoreTop = 0) {
    if (!a || !b) return { dims: false, count: -1 }
    const A = PNG.sync.read(a), B = PNG.sync.read(b)
    if (A.width !== B.width || A.height !== B.height) return { dims: false, count: -1, sizes: `${A.width}x${A.height} vs ${B.width}x${B.height}` }
    let count = 0, max = 0, top = 0
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]), Math.abs(A.data[i + 3] - B.data[i + 3]))
        const py0 = Math.floor(i / 4 / A.width)
        if (d > 0 && py0 < ignoreTop) { top++; continue }
        if (d > 0) {
            count++
            if (d > max) max = d
            const px = (i / 4) % A.width, py = Math.floor(i / 4 / A.width)
            if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py
        }
    }
    return { dims: true, count, top, max, box: count ? [x0, y0, x1, y1] : null, width: A.width, height: A.height }
}

/** A page of the proof: what it can do, and the steps it wrote down. */
async function open(browser, base, label) {
    const context = await browser.newContext({ ...PROFILE_OF.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'no-preference' })
    await context.route(url => { const host = new URL(url).hostname; return host !== '127.0.0.1' }, route => route.abort())
    await context.route(BLOCKED, route => route.abort())
    await context.addInitScript(() => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`.slice(0, 200)))
    page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource|net::ERR|blocked|CORS|Firebase|firestore|ERR_FAILED|MusicKit|token/i.test(message.text())) errors.push(`console: ${message.text()}`.slice(0, 200)) })
    const steps = {}
    const touch = Boolean(PROFILE_OF.touch)
    const settle = async (ms = 500) => {
        await page.waitForTimeout(ms)
        // the animations and transitions that end by themselves are let finish (a spinner never ends: the step that has one says so)
        await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(120)
    }
    const api = {
        page, label, steps, errors,
        async goto(route) { await page.goto(base + route); await settle(300) },
        async hit(selector, { text } = {}) {
            const target = text ? page.locator(selector, { hasText: text }).first() : page.locator(selector).first()
            try {
                await target.scrollIntoViewIfNeeded({ timeout: 8000 })
            } catch (error) {
                throw new Error(`${selector} ${text ?? ''}: ${error.message.split('\n')[0]}; ${await page.evaluate((sel) => { const e = document.querySelector(sel); const r = e && e.getBoundingClientRect(); return `${document.querySelectorAll(sel).length} found, first ${e ? JSON.stringify([r.x, r.y, r.width, r.height]) + ' display ' + getComputedStyle(e).display + ' sheet ' + document.querySelectorAll('.sheet').length : 'none'}` }, selector)}`)
            }
            if (touch) await target.tap(); else await target.click()
            if (!touch) await page.mouse.move(0, 0)
            await settle()
        },
        async key(selector, keys) { await page.focus(selector); for (const k of keys) await page.keyboard.press(k); await settle(300) },
        async snap(name, { root = '#regeneratePanelMount', spinner = false, views = true } = {}) {
            await settle(spinner ? 120 : 400)
            const read = await page.evaluate(`(${READ})(${JSON.stringify(root)})`)
            const step = { read, panel: null, view: null }
            if (read && views && read.rect.width > 0 && read.rect.height > 0) {
                const r = read.rect
                // the picture of the panel is taken without what is fixed to the window (the bars of the phone and the top bar, which are not the panel's and have
                // animated equalizers): they are hidden for the moment of the picture
                await page.evaluate(() => { document.querySelectorAll('body *').forEach(e => { if (getComputedStyle(e).position === 'fixed' && !e.closest('#regeneratePanelMount')) { e.dataset.proofHidden = e.style.visibility || 'x'; e.style.visibility = 'hidden' } }) })
                step.panel = await page.screenshot({ fullPage: true, animations: 'disabled', clip: { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width) + 1, height: Math.ceil(r.height) + 1 } }).catch(() => null)
                await page.evaluate(() => { document.querySelectorAll('[data-proof-hidden]').forEach(e => { e.style.visibility = e.dataset.proofHidden === 'x' ? '' : e.dataset.proofHidden; delete e.dataset.proofHidden }) })
                step.view = await page.screenshot({ animations: 'disabled' }).catch(() => null)
            }
            steps[name] = step
        },
        async tabs(from, count) {
            await page.focus(from)
            const order = []
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Tab')
                order.push(await page.evaluate(() => { const a = document.activeElement; return a === document.body ? 'body' : a.tagName.toLowerCase() + '#' + a.id + '.' + (a.dataset ? (a.dataset.action || a.dataset.recipeId || a.dataset.count || a.dataset.output || a.dataset.grouping || a.dataset.ranking || a.dataset.phoneAction || '') : '') }))
            }
            return order
        }
    }
    return { api, close: () => context.close() }
}

async function seed(api, { withSeries = false } = {}) {
    await api.goto('/start')
    await api.page.waitForFunction(() => window.playlistsStore && window.router && window.albumSeriesStore, null, { timeout: 30000 })
    await api.page.evaluate(({ playlists, series, withSeries: s }) => {
        if (s) window.albumSeriesStore.setSeries([series])
        window.playlistsStore.setPlaylists(JSON.parse(JSON.stringify(playlists)), 'sProof')
        window.router.navigate('/playlists')
    }, { playlists: PLAYLISTS, series: SERIES, withSeries })
    await api.page.waitForSelector('#regeneratePanelMount', { timeout: 15000, state: 'attached' }).catch(async (error) => {
        throw new Error(`${error.message.split('\n')[0]} at ${await api.page.evaluate(() => location.pathname + ' :: ' + document.body.innerText.slice(0, 1500).replace(/\s+/g, ' '))}`)
    })
    await api.page.waitForTimeout(800)
}

// ---- the flows
async function computerFlow(api) {
    await seed(api)
    await api.snap('closed')
    await api.hit('[data-action="toggle-regenerate-panel"]')
    await api.snap('open')
    for (const id of RECIPES) {
        await api.hit(`[data-recipe-id="${id}"]`)
        await api.snap(`recipe ${id}`)
    }
    // the last recipe is the own ranking one: the Top #, the grouping and the structure
    for (const n of [1, 10]) { await api.hit(`.blend-track-count-btn[data-count="${n}"]`); await api.snap(`Top ${n}`) }
    for (const value of ['by_album', 'flat_ranked', 'artist_rank', 'ranked_interleave', 'shuffle']) { await api.hit(`.blend-grouping-btn[data-grouping="${value}"]`); await api.snap(`grouping ${value}`) }
    for (const value of ['single', 'multiple', 'auto']) { await api.hit(`.blend-output-btn[data-output="${value}"]`); await api.snap(`structure ${value}`) }
    await api.hit('[data-recipe-id="mjrp-balanced-cascade"]')
    for (const value of ['spotify', 'bea', 'combined']) { await api.hit(`.blend-ranking-btn[data-ranking="${value}"]`); await api.snap(`source ${value}`) }
    await api.key('#blend-duration-slider', ['ArrowRight', 'ArrowRight', 'ArrowRight'])
    await api.snap('slider after three keys (the focus stays on it)')
    await api.key('#blend-duration-slider', ['End'])
    await api.snap('slider at the end')
    await api.hit('.blend-ranking-btn[data-ranking="bea"]')
    await api.snap('a button after the slider: the slider keeps its place')
    api.steps['tab order from the toggle'] = { order: await api.tabs('[data-action="toggle-regenerate-panel"]', 24) }
    await api.hit('[data-action="regenerate-playlists"]')
    await api.snap('Regenerate Playlists with no series (the failure)', { root: '.playlists-view' })
}

async function generatingFlow(api) {
    await seed(api, { withSeries: true })
    if (PROFILE_OF.computer) await api.hit('[data-action="toggle-regenerate-panel"]')
    else { await api.hit('[data-phone-action="playlist-options"]'); await api.hit('.phone-sheet-action', { text: 'Reconfigure and regenerate' }) }
    await api.hit('[data-recipe-id="top-n-popular"]')
    await api.page.locator('[data-action="regenerate-playlists"]').scrollIntoViewIfNeeded()
    if (PROFILE_OF.touch) await api.page.locator('[data-action="regenerate-playlists"]').tap(); else await api.page.locator('[data-action="regenerate-playlists"]').click()
    await api.page.waitForTimeout(400)
    await api.snap('generating or failed, 0.4 s after the press', { root: '.playlists-view', spinner: true })
    // the albums come from Apple Music, which the proof blocks: the generation ends by itself (how soon depends on the network stack, so the step waits for the end)
    await api.page.waitForSelector('.loading-overlay', { state: 'detached', timeout: 60000 }).catch(() => {})
    await api.snap('after the generation ended (the failure)', { root: '.playlists-view' })
}

async function phoneFlow(api) {
    await seed(api)
    await api.snap('closed')
    await api.hit('[data-phone-action="playlist-options"]')
    await api.snap('the sheet of a playlist', { root: '.sheet' })
    await api.hit('.phone-sheet-action', { text: 'Reconfigure and regenerate' })
    await api.snap('opened by the sheet, scrolled to the panel')
    await api.hit('[data-recipe-id="top-n-popular"]')
    await api.snap('recipe top-n-popular')
    await api.hit('.blend-track-count-btn[data-count="6"]')
    await api.hit('.blend-grouping-btn[data-grouping="shuffle"]')
    await api.hit('.blend-output-btn[data-output="single"]')
    await api.snap('Top 6, shuffle, single')
    await api.hit('[data-recipe-id="mjrp-balanced-cascade"]')
    await api.snap('the balanced recipe: the duration and the source')
    await api.key('#blend-duration-slider', ['ArrowRight', 'ArrowRight'])
    await api.snap('slider after two keys')
    await api.page.evaluate(() => window.scrollTo(0, 0))
    await api.page.waitForTimeout(300)
    await api.hit('[data-phone-action="playlist-options"]')
    await api.hit('.phone-sheet-action', { text: 'Reconfigure and regenerate' })
    await api.snap('asked again while open: it stays open, with what was chosen')
    await api.hit('[data-action="toggle-regenerate-panel"]')
    await api.snap('shut by the header (the whole panel goes off the phone)')
    await api.hit('[data-phone-action="playlist-options"]')
    await api.hit('.phone-sheet-action', { text: 'Reconfigure and regenerate' })
    await api.snap('asked again once shut: open again, with what was chosen')
    await api.hit('[data-action="regenerate-playlists"]')
    await api.snap('Regenerate Playlists with no series (the failure)', { root: '.playlists-view' })
}

async function blendFlow(api) {
    await api.goto('/start')
    await api.page.waitForFunction(() => window.albumSeriesStore && window.router, null, { timeout: 30000 })
    await api.page.evaluate((series) => { window.albumSeriesStore.setSeries(series); window.router.navigate('/blend') }, BLEND_SERIES)
    await api.page.waitForSelector('#app .container', { timeout: 15000 })
    await api.page.waitForTimeout(1500)
    const root = '#app'
    await api.snap('the Blend screen, no choice', { root })
    const card = '[data-series-id="bs1"]'
    const row = '#blend-series-pick'
    if (PROFILE_OF.computer) await api.hit(card); else await api.hit(row)
    if (!PROFILE_OF.computer) {
        await api.snap('the sheet of series', { root })
        await api.hit('[data-series-id="bs1"]')
    }
    await api.snap('a series chosen', { root })
    for (const id of RECIPES) { await api.hit(`[data-recipe-id="${id}"]`); await api.snap(`recipe ${id}`, { root }) }
    await api.hit('.blend-track-count-btn[data-count="5"]')
    await api.snap('Top 5', { root })
    await api.hit('.blend-output-btn[data-output="multiple"]')
    await api.snap('structure multiple', { root })
    await api.hit('[data-recipe-id="mjrp-balanced-cascade"]')
    await api.key('#blend-duration-slider', ['ArrowRight', 'ArrowRight'])
    await api.snap('slider after two keys', { root })
}

const FLOWS = {
    panel: [['panel', PROFILE_OF.computer ? computerFlow : phoneFlow], ['generating', generatingFlow]],
    blend: [['blend', blendFlow]]
}

async function runSide(browser, dist, label) {
    const { server, base } = await serve(dist)
    const sides = {}
    for (const [name, flow] of FLOWS[PART]) {
        const { api, close } = await open(browser, base, label)
        try { await flow(api) } catch (error) { api.errors.push(`FLOW ${name} STOPPED: ${error.message}`.slice(0, 300)) }
        sides[name] = { steps: api.steps, errors: api.errors }
        await close()
    }
    server.close()
    return sides
}

const browser = await ENGINE.launch()
const oldSide = await runSide(browser, oldDist, 'old')
const newSide = await runSide(browser, OLD_ONLY ? oldDist : newDist, 'new')
await browser.close()

let compared = 0
const diffsOut = []
for (const flow of Object.keys(oldSide)) {
    const O = oldSide[flow], N = newSide[flow]
    note(`${flow}: no stopped flow, no page error (old ${O.errors.length}, new ${N.errors.length})`, O.errors.length === N.errors.length && !O.errors.concat(N.errors).some(e => e.startsWith('FLOW') || e.startsWith('pageerror')), [...new Set(O.errors.concat(N.errors))].join(' | '))
    const names = [...new Set([...Object.keys(O.steps), ...Object.keys(N.steps)])]
    for (const name of names) {
        const a = O.steps[name], b = N.steps[name]
        if (!a || !b) { note(`${flow} · ${name}: the step exists on both sides`, false, `old ${Boolean(a)} new ${Boolean(b)}`); continue }
        if (a.order) { note(`${flow} · ${name}`, JSON.stringify(a.order) === JSON.stringify(b.order), JSON.stringify(a.order) === JSON.stringify(b.order) ? a.order.slice(0, 6).join(' ') : `old ${a.order.join(' ')}  new ${b.order.join(' ')}`); continue }
        compared++
        const ra = a.read, rb = b.read
        if (!ra || !rb) { note(`${flow} · ${name}: the page has the element`, Boolean(ra) === Boolean(rb), `old ${Boolean(ra)} new ${Boolean(rb)}`); continue }
        const at = (x, y) => { let i = 0; while (i < x.length && x[i] === y[i]) i++; return `at ${i}: old «${x.slice(Math.max(0, i - 50), i + 70)}» new «${y.slice(Math.max(0, i - 50), i + 70)}»` }
        note(`${flow} · ${name}: elements, attributes, classes, text and fields`, ra.dom === rb.dom, ra.dom === rb.dom ? `${ra.dom.length} chars` : at(ra.dom, rb.dom))
        note(`${flow} · ${name}: the notice and the overlay of generating`, ra.toasts === rb.toasts && ra.overlay === rb.overlay, `overlay ${ra.overlay} / ${rb.overlay}; notice «${ra.toasts.slice(0, 90)}» / «${rb.toasts.slice(0, 90)}»`)
        const boxDiff = () => { const A = ra.boxes.split(';'), B = rb.boxes.split(';'); if (A.length !== B.length) return `${A.length} elements against ${B.length}`; const out = []; A.forEach((x, i) => { if (x !== B[i]) out.push(`${x} -> ${B[i].split(':').slice(2).join(':')}`) }); return `${out.length} of ${A.length} differ: ${out.slice(0, 6).join(' | ')}` }
        note(`${flow} · ${name}: the box of every element`, ra.boxes === rb.boxes, ra.boxes === rb.boxes ? '' : boxDiff())
        note(`${flow} · ${name}: the focus, the scroll and the page's width`, ra.focus === rb.focus && ra.scrollY === rb.scrollY && ra.overflowX === rb.overflowX && ra.scrollX === rb.scrollX, `focus ${ra.focus} / ${rb.focus}; scrollY ${ra.scrollY} / ${rb.scrollY}; overflow-x ${ra.overflowX} / ${rb.overflowX}`)
        for (const kind of ['panel', 'view']) {
            // the top bar of the computer (the wordmark and the buttons of Apple Music and Spotify, with animated bars) is not the panel's: the viewport picture does not count its 80 px
            // (a computer profile only); what differs inside it is written apart, and the old against the old shows the same noise
            const d = diffPixels(a[kind], b[kind], kind === 'view' && PROFILE_OF.computer ? 80 : 0)
            const ok = d.dims && d.count === 0
            diffsOut.push({ flow, name, kind, ...d })
            note(`${flow} · ${name}: the picture of the ${kind === 'panel' ? 'panel' : 'viewport'}`, ok || d.count === -1 && !a[kind] && !b[kind], d.dims ? (d.count ? `${d.count} px differ, at most ${d.max}/255, in ${d.box.join(',')} of ${d.width}x${d.height}` : `0 px of ${d.width}x${d.height}${d.top ? `  (top bar, not counted: ${d.top} px)` : ''}`) : (d.sizes || 'no picture'))
            if (d.dims && d.count > 0) {
                const A = PNG.sync.read(a[kind]), B = PNG.sync.read(b[kind])
                const [x0, y0, x1, y1] = d.box
                const w = Math.min(x1 - x0 + 1, 600), h = Math.min(y1 - y0 + 1, 300)
                const out = new PNG({ width: w * 2, height: h })
                for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (const [k, S] of [[0, A], [1, B]]) { const s = ((y0 + y) * S.width + (x0 + x)) * 4, t = (y * w * 2 + k * w + x) * 4; out.data[t] = S.data[s]; out.data[t + 1] = S.data[s + 1]; out.data[t + 2] = S.data[s + 2]; out.data[t + 3] = 255 }
                fs.writeFileSync(path.join(DIFFS, `${TAG}-${flow}-${name.replace(/\W+/g, '_').slice(0, 40)}-${kind}.png`), PNG.sync.write(out))
            }
        }
    }
}
const failed = results.filter(r => !r.ok)
console.log(`\n${TAG}: ${results.length - failed.length} of ${results.length} comparisons equal (${compared} steps)`)
fs.writeFileSync(path.join(RAW, `${TAG}.json`), JSON.stringify({ tag: TAG, total: results.length, failed: failed.length, steps: compared, failures: failed, pictures: diffsOut.filter(d => d.count !== 0) }, null, 1))
process.exit(failed.length ? 1 : 0)
