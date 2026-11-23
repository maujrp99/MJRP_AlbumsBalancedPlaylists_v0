// Independent judge, F83 wave 7b (the Blend screen). Built sites, old (ace99a9) against new (160c702), and old against old for noise.
// ENGINE=chromium|webkit PROFILE=1280|900|899|iphone14|se|ciphone14 PART=blend|many|covers|address|leave|sweep|first [A=old] [B=new] [RUN=label] node judge.mjs
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import pngjs from 'pngjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const { PNG } = pngjs

const HERE = process.env.WORK || path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || '1280'
const PART = process.env.PART || 'blend'
const SIDE_A = process.env.A || 'old', SIDE_B = process.env.B || 'new'
const RUN = process.env.RUN || ''
const DIST = process.env.DIST || 'dist'
const TAG = `${PART}-${ENGINE_NAME}-${PROFILE}-${SIDE_A}-vs-${SIDE_B}${RUN ? '-' + RUN : ''}`
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true })
const CAP = path.join(HERE, 'captures'); fs.mkdirSync(CAP, { recursive: true })

const PROFILES = {
    1280: { computer: true, options: { viewport: { width: 1280, height: 800 } } },
    3200: { computer: true, options: { viewport: { width: 1280, height: 3200 } } },
    900: { computer: true, options: { viewport: { width: 900, height: 800 } } },
    899: { computer: false, options: { viewport: { width: 899, height: 800 } } },
    iphone14: { computer: false, touch: true, options: { ...devices['iPhone 14'] } },
    ciphone14: { computer: false, touch: true, options: { ...devices['iPhone 14'] } },
    se: { computer: false, touch: true, options: { ...devices['iPhone SE'] } }
}
const P = PROFILES[PROFILE]

// ---------- the world: series, the local set of albums (a small fixture), covers made here ----------
const q = (artist, album) => `${artist} - ${album}`
const FEW = [
    { id: 'bs1', name: 'Floyd and friends', albumQueries: [q('Pink Floyd', 'The Wall'), q('Led Zeppelin', 'IV'), q('Rush', 'Moving Pictures'), q('Yes', 'Fragile')] },
    { id: 'bs2', name: 'Rush &amp; Friends', albumQueries: [q('Rush', '2112')] },
    { id: 'bs3', name: 'Nothing found here', albumQueries: [q('Nobody', 'Nothing')] }
]
const MANY = Array.from({ length: 14 }, (_, i) => ({ id: `m${i + 1}`, name: `Judge series ${String(i + 1).padStart(2, '0')}${i === 4 ? ' &amp; more' : ''}`, albumQueries: [q('Pink Floyd', 'The Wall'), q('Rush', '2112'), q('Yes', 'Fragile')].slice(0, (i % 3) + 1) }))
const DATASET = [['Pink Floyd', 'The Wall', '1979', 'a1'], ['Led Zeppelin', 'IV', '1971', 'a2'], ['Rush', 'Moving Pictures', '1981', 'a3'], ['Yes', 'Fragile', '1971', 'a4'], ['Rush', '2112', '1976', 'a5']]
const COLORS = [[200, 60, 60], [60, 160, 80], [70, 90, 200], [210, 170, 40], [150, 70, 180]]
function coverPng(i) { const p = new PNG({ width: 100, height: 100 }); const [r, g, b] = COLORS[i % COLORS.length]; for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) { const k = (y * 100 + x) * 4; const s = (x + y) % 20 < 10 ? 1 : 0.8; p.data[k] = r * s; p.data[k + 1] = g * s; p.data[k + 2] = b * s; p.data[k + 3] = 255 } return PNG.sync.write(p) }
const COVERS = DATASET.map((_, i) => coverPng(i))

function serve(dist) {
    const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/judge-cover/')) { const i = Number(url.pathname.split('/').pop().replace('.png', '')); res.writeHead(200, { 'content-type': 'image/png' }); res.end(COVERS[i] || COVERS[0]); return }
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/' || url.pathname === '/home') file = path.join(dist, 'index.html')
        else if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = url.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
        if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const READ = `(root) => {
  const el = document.querySelector(root)
  if (!el) return null
  const attrs = (n) => [...n.attributes].filter(a => !(a.name === 'style' && !a.value.trim())).map(({ name, value }) => [name, name === 'class' ? value.split(/\\s+/).filter(Boolean).sort().join(' ') : value]).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ' ' + k + '="' + v + '"').join('')
  const desc = (n) => {
    if (n.nodeType === 3) return n.textContent.replace(/\\s+/g, ' ')
    if (n.nodeType !== 1) return ''
    const tag = n.tagName.toLowerCase()
    const kids = [...n.childNodes].filter(c => c.nodeType === 1 || (c.nodeType === 3 && /\\S/.test(c.textContent)))
    const own = (tag === 'input' || tag === 'select') ? ' [value=' + n.value + '][disabled=' + n.disabled + ']' : (tag === 'button' ? ' [disabled=' + n.disabled + ']' : '')
    return '<' + tag + attrs(n) + own + '>' + kids.map(desc).join('') + '</' + tag + '>'
  }
  const boxes = []
  el.querySelectorAll('*').forEach((n, i) => { const r = n.getBoundingClientRect(); boxes.push(i + ':' + n.tagName + ':' + [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',')) })
  const toasts = [...document.querySelectorAll('#toast-container > *')].map(t => t.textContent.replace(/\\s+/g, ' ').trim()).filter(Boolean)
  const a = document.activeElement
  const focus = !a || a === document.body ? 'body' : a.tagName.toLowerCase() + '#' + a.id + '.' + [...a.classList].slice(0, 2).join('.') + '[' + (a.dataset.action || a.dataset.recipeId || a.dataset.seriesId || a.dataset.count || a.dataset.output || a.dataset.grouping || a.dataset.ranking || '') + ']'
  const s = document.getElementById('blend-duration-slider'), d = document.getElementById('blend-duration-display')
  const slider = s ? { prop: s.value, attr: s.getAttribute('value'), display: d && d.textContent.trim(), valueAsNumber: s.valueAsNumber } : null
  const list = document.querySelector('#blend-series-selector .overflow-y-auto')
  const bar = document.getElementById('blend-bar-btn')
  const r = el.getBoundingClientRect()
  return { dom: desc(el), inner: el.innerText, boxes: boxes.join(';'), toasts, focus, slider, url: location.pathname + location.search, scrollY: Math.round(window.scrollY), scrollW: document.documentElement.scrollWidth, listTop: list ? list.scrollTop : null, barHover: bar ? bar.matches(':hover') : null, barDisabled: bar ? bar.disabled : null, sheetOpen: Boolean(document.querySelector('.sheet')), docH: document.documentElement.scrollHeight, rect: { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height } }
}`

function diffPixels(a, b) {
    if (!a || !b) return { dims: false, count: -1 }
    const A = PNG.sync.read(a), B = PNG.sync.read(b)
    if (A.width !== B.width || A.height !== B.height) return { dims: false, count: -1, sizes: `${A.width}x${A.height} vs ${B.width}x${B.height}` }
    let count = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]))
        if (d > 0) { count++; if (d > max) max = d; const px = (i / 4) % A.width, py = Math.floor(i / 4 / A.width); if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py }
    }
    return { dims: true, count, max, box: count ? [x0, y0, x1, y1] : null, width: A.width, height: A.height }
}

// The seams, the same text on both sides: the configuration handed to the generation is recorded; the albums can be handed by the judge
function seam(body) {
    body = body.replace(/async generateFromSeries\(([\w$]+),([\w$]+),([\w$]+)=\{\}\)\{/, (m, a, b) => `${m}window.__cfgs=(window.__cfgs||[]).concat([JSON.stringify({series:${a},cfg:Object.fromEntries(Object.entries(${b}).sort(([x],[y])=>x<y?-1:1)),order:Object.keys(${b}).join(',')})]);`)
    body = body.replace(/async regenerate\(([\w$]+),([\w$]+)=\{\}\)\{/, (m, a) => `${m}window.__cfgs=(window.__cfgs||[]).concat([JSON.stringify({regenerate:true,cfg:Object.fromEntries(Object.entries(${a}).sort(([x],[y])=>x<y?-1:1))})]);`)
    const i = body.indexOf('async _albumsFor(')
    if (i >= 0) {
        const end = body.indexOf('){', i) + 2
        const [, a, b] = body.slice(i).match(/^async _albumsFor\(([\w$]+),([\w$]+),/)
        body = body.slice(0, end) + `if(window.__judgeAlbums)return window.__judgeAlbums(${a},${b},arguments[2]||{});` + body.slice(end)
    }
    return body
}

async function open(browser, base, { coverDelay = 0 } = {}) {
    const context = await browser.newContext({ ...P.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
    const requests = []
    await context.route(() => true, async (route) => {
        const url = new URL(route.request().url())
        if (url.hostname !== '127.0.0.1') { requests.push('BLOCKED ' + url.hostname); return route.abort() } // Firebase, MusicKit, Spotify and every other host
        requests.push(url.pathname)
        if (url.pathname === '/assets/data/albums-autocomplete.json') {
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DATASET.map(([a, b, c, d], i) => ({ a, b, c, d, e: `/judge-cover/{w}x{h}/${i}.png` }))) })
        }
        if (url.pathname.endsWith('.js') && url.pathname.startsWith('/assets/')) {
            const response = await route.fetch()
            let body = await response.text()
            if (/search\.worker/.test(url.pathname) && coverDelay) {
                // the answers of the search come late (the covers arrive after the person moved): the same line on both sides
                body += `\n;(()=>{const o=self.onmessage;self.onmessage=(e)=>{if(e.data&&e.data.type==='SEARCH')setTimeout(()=>o(e),${coverDelay});else o(e)}})();`
            } else body = seam(body)
            return route.fulfill({ response, body })
        }
        return route.continue()
    })
    await context.addInitScript(() => { let seed = 42; window.__reseed = () => { seed = 42 }; Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 } })
    await context.addInitScript(() => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM'; Date.prototype.toLocaleString = () => '11/22/2026, 12:00:00 PM' })
    if (process.env.CSS) await context.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st) }) }, process.env.CSS)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)))
    const steps = {}
    const touch = Boolean(P.touch)
    const settle = async (ms = 1000) => {
        await page.waitForTimeout(ms)
        await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(150)
    }
    const api = {
        page, steps, errors, requests, settle, touch,
        async hit(selector, { text, nth = 0, wait = 300 } = {}) {
            const target = text ? page.locator(selector, { hasText: text }).nth(nth) : page.locator(selector).nth(nth)
            await target.scrollIntoViewIfNeeded({ timeout: 8000 })
            if (touch) await target.tap(); else await target.click()
            if (!touch) await page.mouse.move(0, 0)
            await settle(wait)
        },
        async snap(name, { roots = ['#app'], pictures = true, extra = null, wait = 1000 } = {}) {
            await settle(wait)
            const step = { reads: {}, aria: {}, pages: [] }
            for (const root of roots) {
                step.reads[root] = await page.evaluate(`(${READ})(${JSON.stringify(root)})`)
                try { step.aria[root] = await page.locator(root).first().ariaSnapshot({ timeout: 3000 }) } catch { step.aria[root] = 'n/a' }
            }
            step.cfgs = await page.evaluate(() => (window.__cfgs || []).slice())
            if (extra) step.extra = await extra()
            if (pictures) {
                // the window, page by page (never a full-page picture: on a phone width it fires the phone media query); toasts and the clock hidden
                await page.evaluate(() => { for (const e of document.querySelectorAll('#toast-container, .last-update')) { e.dataset.jh = '1'; e.style.visibility = 'hidden' } })
                if (process.env.REPAINT) await page.evaluate(() => new Promise(res => { document.body.style.transform = 'translateX(0.01px)'; requestAnimationFrame(() => requestAnimationFrame(() => { document.body.style.transform = ''; requestAnimationFrame(() => requestAnimationFrame(res)) })) }))
                const y0 = await page.evaluate(() => window.scrollY)
                const h = P.options.viewport.height
                const total = await page.evaluate(() => document.documentElement.scrollHeight)
                const n = Math.min(5, Math.ceil(total / h))
                for (let k = 0; k < n; k++) {
                    if (n > 1) { await page.evaluate(y => window.scrollTo(0, y), k * h); await page.waitForTimeout(250) }
                    step.pages.push(await page.screenshot({ animations: 'disabled' }).catch(() => null))
                }
                if (n > 1) { await page.evaluate(y => window.scrollTo(0, y), y0); await page.waitForTimeout(200) }
                await page.evaluate(() => document.querySelectorAll('[data-jh]').forEach(e => { e.style.visibility = ''; delete e.dataset.jh }))
            }
            steps[name] = step
        },
        async tabs(name, count, from = null) {
            if (from) await page.focus(from); else { await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) }); }
            const order = []
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Tab')
                order.push(await page.evaluate(() => { const a = document.activeElement; return a === document.body ? 'body' : a.tagName.toLowerCase() + '#' + a.id + '[' + (a.dataset.recipeId || a.dataset.seriesId || a.dataset.count || a.dataset.output || a.dataset.grouping || a.dataset.ranking || a.textContent.trim().slice(0, 24)) + ']@' + Math.round(window.scrollY) }))
            }
            steps[`tab order: ${name}`] = { order }
        }
    }
    return { api, close: () => context.close() }
}

async function seed(api, series, route = '/blend') {
    await api.page.goto(api.base + '/start')
    await api.page.waitForFunction(() => window.albumSeriesStore && window.router, null, { timeout: 30000 })
    await api.settle(500)
    await api.page.evaluate(({ s, r }) => { window.albumSeriesStore.setSeries(JSON.parse(JSON.stringify(s))); window.router.navigate(r) }, { s: series, r: route })
    await api.page.waitForSelector('#blend-series-selector', { timeout: 15000, state: 'attached' })
    await api.settle(1200)
}

// the generation: 'stop' fails at once with a message of the judge; 'ok' hands two albums; 'hold' waits for __release or the abort
const FAKE = `window.__judge = (mode, delay = 0) => {
  window.__aborted = false
  if (!mode) { delete window.__judgeAlbums; return }
  const tracks = (id, rows) => rows.map(([title, min, pop, rating], i) => ({ id: id + '-' + (i + 1), title, artist: id === 'rock' ? 'Zed' : 'Abba', album: 'Album ' + id, duration: min * 60, spotifyPopularity: pop, rating, rank: i + 1, position: i + 1 }))
  const albums = () => [
    { id: 'rock', title: 'Album rock', artist: 'Zed', year: 1979, tracks: tracks('rock', [['R-one', 4, 10, 90], ['R-two', 4, 80, 70], ['R-three', 4, 50, 80], ['R-four', 4, 30, 60]]) },
    { id: 'jazz', title: 'Album jazz', artist: 'Abba', year: 1975, tracks: tracks('jazz', [['J-one', 5, 20, 50], ['J-two', 5, 90, 95], ['J-three', 5, 60, 40]]) }]
  window.__judgeAlbums = (series, config, options) => new Promise((resolve, reject) => {
    options.onProgress && options.onProgress('Judge: loading 1 of 2 albums...')
    options.signal && options.signal.addEventListener('abort', () => { window.__aborted = true; const e = new Error('The blend was cancelled'); e.name = 'BlendCancelledError'; reject(e) })
    const done = () => (window.__reseed(), mode === 'stop') ? reject(new Error('Judge stop: <b>none</b> & nothing')) : resolve({ albums: albums(), result: { total: 2 }, notices: ['Judge notice: 1 album left out'] })
    if (mode === 'hold') window.__release = done
    else setTimeout(done, delay)
  })
}`

const RECIPES = ['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user']

async function slider(api, how) {
    const box = await api.page.locator('#blend-duration-slider').boundingBox()
    const y = box.y + box.height / 2
    if (how.keys) { await api.page.focus('#blend-duration-slider'); for (const k of how.keys) await api.page.keyboard.press(k) }
    else if (how.tap !== undefined) { if (api.touch) await api.page.touchscreen.tap(box.x + box.width * how.tap, y); else { await api.page.mouse.click(box.x + box.width * how.tap, y); await api.page.mouse.move(0, 0) } }
    else if (how.drag) { const [from, to] = how.drag; await api.page.mouse.move(box.x + box.width * from, y); await api.page.mouse.down(); for (let i = 1; i <= 8; i++) await api.page.mouse.move(box.x + box.width * (from + (to - from) * i / 8), y); await api.page.mouse.up(); await api.page.mouse.move(0, 0) }
    await api.settle(300)
}

const generateSel = () => P.computer ? '#blend-generate-btn' : '#blend-bar-btn'

async function blendFlow(api) {
    await seed(api, FEW)
    await api.page.evaluate(FAKE)
    await api.snap('no choice')
    if (!P.computer) {
        await api.hit('#blend-series-pick'); await api.snap('sheet open', { roots: ['#app', '.sheet'], wait: 1200 })
        await api.page.fill('.blend-sheet__search', 'rush'); await api.snap('sheet search rush', { roots: ['#app', '.sheet'] })
        await api.page.fill('.blend-sheet__search', 'zzz'); await api.snap('sheet search none', { roots: ['#app', '.sheet'] })
        await api.page.fill('.blend-sheet__search', ''); await api.snap('sheet search cleared', { roots: ['#app', '.sheet'] })
        await api.hit('.blend-sheet__row[data-series-id="bs1"]', { wait: 1200 }); await api.snap('series chosen by the sheet', { wait: 1200 })
    } else {
        await api.hit('.blend-series-card[data-series-id="bs1"]'); await api.snap('series chosen')
    }
    for (const id of RECIPES) { await api.hit(`[data-recipe-id="${id}"]`); await api.snap(`recipe ${id}`) }
    await api.hit('[data-recipe-id="top-n-popular"]')
    for (const c of ['1', '10']) { if (await api.page.locator(`[data-count="${c}"]`).count()) { await api.hit(`[data-count="${c}"]`); await api.snap(`top ${c}`) } }
    for (const g of await api.page.$$eval('[data-grouping]', l => l.map(e => e.dataset.grouping))) { await api.hit(`[data-grouping="${g}"]`); await api.snap(`grouping ${g}`) }
    for (const o of await api.page.$$eval('[data-output]', l => l.map(e => e.dataset.output))) { await api.hit(`[data-output="${o}"]`); await api.snap(`structure ${o}`) }
    await api.hit('[data-recipe-id="mjrp-balanced-cascade"]')
    for (const r of await api.page.$$eval('[data-ranking]', l => l.map(e => e.dataset.ranking))) { await api.hit(`[data-ranking="${r}"]`); await api.snap(`source ${r}`) }
    await slider(api, { keys: ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowRight'] }); await api.snap('slider keys')
    await slider(api, { keys: ['End'] }); await api.snap('slider End')
    await slider(api, { keys: ['Home'] }); await api.snap('slider Home')
    await slider(api, { tap: 0.75 }); await api.snap('slider tap 75%')
    if (!api.touch) { await slider(api, { drag: [0.75, 0.3] }); await api.snap('slider drag to 30%') }
    const g = (await api.page.$$eval('[data-grouping]', l => l.map(e => e.dataset.grouping)))[0]
    if (g) { await api.hit(`[data-grouping="${g}"]`); await api.snap('a button after the slider') }
    await api.tabs('from the top', P.computer ? 34 : 30)
    // the configuration of each recipe: «stop» answers at once with a failure of the judge (the red panel), after the configuration is recorded
    await api.page.evaluate(() => window.__judge('stop'))
    for (const id of RECIPES) { await api.hit(`[data-recipe-id="${id}"]`); await api.hit(generateSel(), { wait: 600 }); await api.snap(`generate fails (judge): ${id}`) }
    await api.hit('[data-output="single"]'); await api.hit(generateSel(), { wait: 600 }); await api.snap('generate fails (judge): single')
    // the real path: the albums cannot be loaded (Apple Music and the rest are blocked)
    await api.page.evaluate(() => window.__judge(null))
    await api.hit('[data-recipe-id="top-n-acclaimed"]'); await api.hit(generateSel(), { wait: 300 })
    await api.page.waitForTimeout(8000)
    await api.snap('generate fails (real, sources blocked)')
    // generating, then a success: the hand-over to the playlists screen
    await api.page.evaluate(() => window.__judge('hold'))
    await api.hit('[data-recipe-id="top-n-popular"]')
    if (api.touch) { // two quick taps on the bar button: one generation only
        const b = api.page.locator(generateSel()); await b.scrollIntoViewIfNeeded(); const box = await b.boundingBox()
        await api.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await api.page.waitForTimeout(60); await api.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
        await api.page.waitForTimeout(300)
    } else { await api.page.locator(generateSel()).click(); await api.page.waitForTimeout(300) }
    await api.snap('generating', { wait: 300, extra: () => api.page.evaluate(() => ({ calls: (window.__cfgs || []).length })) })
    await api.page.evaluate(() => window.__release())
    await api.page.waitForURL(/\/playlists/, { timeout: 10000 }).catch(() => {})
    await api.snap('after a successful generation', { wait: 1500, extra: () => api.page.evaluate(() => ({ url: location.pathname + location.search, calls: (window.__cfgs || []).length, title: document.title })) })
}

async function manyFlow(api) {
    await seed(api, MANY)
    await api.snap('many: none chosen')
    if (P.computer) {
        await api.page.evaluate(() => { document.querySelector('#blend-series-selector .overflow-y-auto').scrollTop = 120 })
        await api.snap('many: list scrolled')
        await api.hit('.blend-series-card[data-series-id="m9"]'); await api.snap('many: m9 chosen (list scrolled)')
        await api.page.focus('.blend-series-card[data-series-id="m3"]'); await api.page.keyboard.press('Enter'); await api.settle(300); await api.snap('many: m3 by Enter')
        await api.page.focus('.blend-series-card[data-series-id="m4"]'); await api.page.keyboard.press(' '); await api.settle(300); await api.snap('many: m4 by Space')
    } else {
        await api.hit('#blend-series-pick'); await api.snap('many: sheet', { roots: ['#app', '.sheet'], wait: 1200 })
        await api.page.fill('.blend-sheet__search', 'more'); await api.snap('many: search «more»', { roots: ['#app', '.sheet'] })
        await api.page.fill('.blend-sheet__search', '1'); await api.snap('many: search «1»', { roots: ['#app', '.sheet'] })
        await api.hit('.blend-sheet__row[data-series-id="m12"]', { wait: 1200 }); await api.snap('many: m12 chosen', { wait: 1200 })
        await api.hit('#blend-series-pick'); await api.snap('many: sheet again, m12 marked', { roots: ['#app', '.sheet'], wait: 1200 })
        await api.hit('.sheet__close', { wait: 1200 }); await api.snap('many: sheet closed by X', { wait: 1200 })
    }
    await api.page.evaluate(() => { window.albumSeriesStore.setSeries([]); window.router.navigate('/albums') }); await api.settle(800)
    await api.page.evaluate(() => window.router.navigate('/blend')); await api.page.waitForSelector('#blend-series-selector', { state: 'attached' }); await api.snap('none: no series')
}

async function addressFlow(api) {
    await seed(api, MANY, '/blend?seriesId=m13')
    await api.snap('address: m13 chosen')
    await api.page.evaluate(() => window.router.navigate('/blend?seriesId=nope')); await api.page.waitForSelector('#blend-series-selector', { state: 'attached' }); await api.snap('address: unknown id')
    // Back and Forward
    await api.page.evaluate(() => window.router.navigate('/blend')); await api.page.waitForSelector('#blend-series-selector', { state: 'attached' }); await api.settle(800)
    await api.hit('.blend-series-card[data-series-id="m1"], #blend-series-pick')
    if (!P.computer) await api.hit('.blend-sheet__row[data-series-id="m1"]', { wait: 1200 })
    await api.page.evaluate(() => window.router.navigate('/albums')); await api.settle(1500)
    await api.page.goBack(); await api.page.waitForSelector('#blend-series-selector', { state: 'attached' }); await api.snap('back: the blend again')
    await api.page.goForward(); await api.settle(1500); await api.snap('forward', { pictures: false })
    // leave while the albums load: nothing said, no error, the load aborted
    await api.page.evaluate(FAKE)
    await api.page.evaluate(() => window.router.navigate('/blend')); await api.page.waitForSelector('#blend-series-selector', { state: 'attached' }); await api.settle(800)
    if (P.computer) await api.hit('.blend-series-card[data-series-id="m2"]'); else { await api.hit('#blend-series-pick'); await api.hit('.blend-sheet__row[data-series-id="m2"]', { wait: 1200 }) }
    await api.hit('[data-recipe-id="top-n-user"]')
    await api.page.evaluate(() => window.__judge('hold'))
    await api.hit(generateSel(), { wait: 300 })
    await api.page.evaluate(() => window.router.navigate('/albums')); await api.settle(1500)
    await api.snap('left while loading', { pictures: false, extra: () => api.page.evaluate(() => ({ aborted: window.__aborted, url: location.pathname })) })
    await api.page.waitForTimeout(1500)
    await api.snap('left while loading, 1.5 s later', { pictures: false, extra: () => api.page.evaluate(() => ({ aborted: window.__aborted, url: location.pathname })) })
}

async function coversFlow(api) {
    await seed(api, MANY)
    // covers late (the search answers after 6 s): focus a card, scroll the page and the list, then wait for the covers
    const sel = P.computer ? '.blend-series-card[data-series-id="m6"]' : '#blend-series-pick'
    await api.page.focus(sel)
    await api.page.evaluate(() => { const l = document.querySelector('#blend-series-selector .overflow-y-auto'); if (l) l.scrollTop = 100; window.scrollTo(0, 120) })
    await api.page.waitForTimeout(200)
    await api.snap('covers: before they arrive', { pictures: false })
    await api.page.waitForTimeout(9000)
    await api.snap('covers: after they arrive', { pictures: true, wait: 500, extra: () => api.page.evaluate(() => ({ imgs: [...document.querySelectorAll('#blend-series-selector img')].map(i => i.getAttribute('src')).filter(Boolean).length })) })
}

async function sweepFlow(api) {
    const routes = ['/start', '/albums', '/inventory', '/saved-playlists', '/artists']
    for (const r of routes) { await api.page.goto(api.base + r); await api.settle(2500); await api.snap(`route ${r}`) }
    // the playlists screen with playlists, and its panel to generate again (it shares the recipe pieces)
    await api.page.waitForFunction(() => window.playlistsStore && window.router && window.albumSeriesStore, null, { timeout: 30000 })
    await api.page.evaluate(FAKE)
    const track = (title, artist, album, duration) => ({ id: `t-${title}`, title, artist, album, duration })
    const META = { algorithmId: 'top-n-acclaimed', rankingId: 'bea', targetDuration: 4500, outputMode: 'multiple', groupingStrategy: 'flat_ranked', trackCount: 4 }
    const PL = [{ id: 'j1', name: 'Judge 1', batchName: 'Judge batch', _meta: META, tracks: [track('Kashmir', 'Led Zeppelin', 'Physical Graffiti', 510), track('Time', 'Pink Floyd', 'DSOTM', 413)] }]
    await api.page.evaluate(({ PL, S }) => { window.albumSeriesStore.setSeries(S); window.playlistsStore.setPlaylists(PL, 'bs1'); window.router.navigate('/playlists') }, { PL, S: FEW })
    await api.page.waitForSelector('#regeneratePanelMount', { state: 'attached', timeout: 15000 }); await api.settle(1200)
    await api.snap('playlists with a set')
    const toggle = api.page.locator('[data-action="toggle-regenerate-panel"]')
    if (await toggle.count() && await toggle.first().isVisible()) {
        await api.hit('[data-action="toggle-regenerate-panel"]'); await api.snap('regenerate panel open')
        await api.hit('[data-recipe-id="top-n-popular"]'); await api.hit('[data-count="7"]'); await api.snap('regenerate: popular, top 7')
        await slider(api, { keys: ['ArrowLeft', 'ArrowLeft'] }); await api.snap('regenerate: slider -10')
        await api.page.evaluate(() => window.__judge('ok', 200))
        await api.hit('[data-action="regenerate-playlists"]', { wait: 2000 }); await api.snap('regenerate: done (judge albums)', { wait: 1500 })
    }
}

async function firstFlow(api) {
    // what the first screen fetches, and when the Blend's file comes
    const t0 = Date.now(); const seen = []
    api.page.on('request', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/assets/') && u.pathname.endsWith('.js')) seen.push(`${Date.now() - t0}ms ${u.pathname.replace(/-[\w-]{8}\.js$/, '')}`) })
    let firstPaintAt = null
    api.page.on('load', () => { firstPaintAt = Date.now() - t0 })
    await api.page.goto(api.base + '/albums'); await api.settle(6000)
    api.steps["first screen /albums: scripts in order"] = { order: seen.slice(), load: firstPaintAt }; console.error(JSON.stringify({ load: firstPaintAt, seen }))
}


async function scrollFlow(api) {
    await seed(api, FEW); await api.page.evaluate(FAKE)
    const log = []
    const at = async (what) => log.push(what + ' ' + JSON.stringify(await api.page.evaluate(() => ({ y: Math.round(scrollY), h: document.documentElement.scrollHeight, f: document.activeElement === document.body ? 'body' : document.activeElement.id || document.activeElement.className.slice(0, 30), res: document.getElementById('blend-results')?.className }))))
    await api.hit('.blend-series-card[data-series-id="bs1"]'); await at('series')
    await api.hit('[data-recipe-id="top-n-user"]'); await at('recipe')
    await api.page.evaluate(() => window.__judge('stop'))
    await api.hit(generateSel(), { wait: 600 }); await at('generate failed')
    const single = api.page.locator('[data-output="single"]')
    await single.scrollIntoViewIfNeeded(); await api.page.waitForTimeout(300); await at('single scrolled into view')
    await single.click(); await api.page.waitForTimeout(50); await at('single clicked +50ms')
    await api.page.mouse.move(0, 0); await api.settle(300); await at('single settled')
    const gen = api.page.locator(generateSel())
    await gen.scrollIntoViewIfNeeded(); await api.page.waitForTimeout(300); await at('generate scrolled into view')
    await gen.click(); await api.page.waitForTimeout(50); await at('generate clicked +50ms')
    await api.settle(600); await at('generate settled')
    api.steps['scroll sequence'] = { order: log }
}

async function miniFlow(api) {
    await seed(api, FEW); await api.page.evaluate(FAKE)
    await api.hit('.blend-series-card[data-series-id="bs1"]'); await api.snap('s series')
    for (const id of ['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user']) { await api.hit(`[data-recipe-id="${id}"]`); await api.snap('r ' + id) }
    await api.hit('[data-count="5"]'); await api.snap('t top5')
}

async function scroll2Flow(api) {
    await seed(api, FEW); await api.page.evaluate(FAKE)
    const log = []
    const at = async (what) => log.push(what + ' ' + JSON.stringify(await api.page.evaluate(() => { const b = document.querySelector('[data-output="single"]'); const g = document.getElementById('blend-generate-btn'); const bb = document.getElementById('blend-bar-btn'); return { bar: bb && Math.round(bb.getBoundingClientRect().top), y: Math.round(scrollY), h: document.documentElement.scrollHeight, singleTop: b && Math.round(b.getBoundingClientRect().top), genTop: g && Math.round(g.getBoundingClientRect().top), anchor: getComputedStyle(document.documentElement).overflowAnchor } })))
    if (P.computer) await api.hit('.blend-series-card[data-series-id="bs1"]'); else { await api.hit('#blend-series-pick', { wait: 1200 }); await api.hit('.blend-sheet__row[data-series-id="bs1"]', { wait: 1200 }) }
    await api.hit('[data-recipe-id="top-n-user"]')
    // A: no failure panel, the page at the bottom, then «single»
    await api.page.evaluate(() => window.scrollTo(0, 99999)); await api.page.waitForTimeout(300); await at('A bottom, before single')
    { const b = api.page.locator('[data-output="single"]'); if (api.touch) await b.tap(); else await b.click() } await api.page.mouse.move(0,0); await api.settle(300); await at('A after single')
    await api.page.locator('[data-output="multiple"]').click(); await api.page.mouse.move(0,0); await api.settle(300); await at('A after multiple')
    // B: the page in the middle (the structure row near the top of the window)
    await api.page.evaluate(() => { const b = document.querySelector('[data-output="single"]'); window.scrollTo(0, scrollY + b.getBoundingClientRect().top - 100) }); await api.page.waitForTimeout(300); await at('B middle, before single')
    await api.page.locator('[data-output="single"]').click(); await api.page.mouse.move(0,0); await api.settle(300); await at('B after single')
    await api.page.locator('[data-output="auto"]').click(); await api.page.mouse.move(0,0); await api.settle(300); await at('B after auto')
    // D: the page at the bottom, a grouping button, a Top button and a source button (no height change)
    for (const sel of ['[data-grouping]:not(.active)', '[data-count="5"]', '[data-count="10"]']) {
        await api.page.evaluate(() => window.scrollTo(0, 99999)); await api.page.waitForTimeout(300); await at('D bottom, before ' + sel)
        const b = api.page.locator(sel).last(); if (api.touch) await b.tap(); else await b.click(); await api.page.mouse.move(0,0); await api.settle(300); await at('D after ' + sel)
    }
    // C: the failure panel shown, the page at the bottom, then «single»
    await api.page.locator('[data-output="multiple"]').click(); await api.page.mouse.move(0,0); await api.settle(300)
    await api.page.evaluate(() => window.__judge('stop')); await api.page.locator(generateSel()).click(); await api.page.mouse.move(0,0); await api.settle(600)
    await api.page.evaluate(() => window.scrollTo(0, 99999)); await api.page.waitForTimeout(300); await at('C failure shown, bottom, before single')
    await api.snap('C before single', { pictures: true, wait: 200 })
    await api.page.locator('[data-output="single"]').click(); await api.page.mouse.move(0,0); await api.settle(300); await at('C after single')
    await api.snap('C after single', { pictures: true, wait: 200 })
    api.steps["scroll sequence 2"] = { order: log }; console.error(api.base, JSON.stringify(log, null, 0))
}

async function tap2Flow(api) {
    await seed(api, FEW); await api.page.evaluate(FAKE)
    await api.hit('#blend-series-pick', { wait: 1200 }); await api.hit('.blend-sheet__row[data-series-id="bs1"]', { wait: 1200 })
    await api.hit('[data-recipe-id="top-n-popular"]')
    const center = async () => { const b = api.page.locator('#blend-bar-btn'); const box = await b.boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2] }
    const state = () => api.page.evaluate(() => { const b = document.getElementById('blend-bar-btn'); const a = document.activeElement; return { calls: (window.__cfgs || []).length, disabled: b.disabled, hover: b.matches(':hover'), busy: b.getAttribute('aria-busy'), text: b.textContent.trim(), focus: a === document.body ? 'body' : a.id || a.className.slice(0, 20) } })
    const log = []
    // one tap that fails at once (judge stop): the button is usable again, is it left hovered?
    await api.page.evaluate(() => window.__judge('stop'))
    let [x, y] = await center(); await api.page.touchscreen.tap(x, y); await api.settle(600); log.push('one tap, failed: ' + JSON.stringify(await state()))
    ;[x, y] = await center(); await api.page.touchscreen.tap(x, y); await api.settle(600); log.push('tap again, failed: ' + JSON.stringify(await state()))
    // two quick taps while the albums load (judge hold): one generation only
    await api.page.evaluate(() => window.__judge('hold'))
    ;[x, y] = await center(); await api.page.touchscreen.tap(x, y); await api.page.waitForTimeout(80); await api.page.touchscreen.tap(x, y); await api.page.waitForTimeout(400)
    log.push('two quick taps, loading: ' + JSON.stringify(await state()))
    await api.page.evaluate(() => window.__release()); await api.page.waitForURL(/playlists/, { timeout: 8000 }).catch(() => {}); await api.settle(800)
    log.push('released: ' + JSON.stringify(await api.page.evaluate(() => ({ url: location.pathname + location.search, calls: (window.__cfgs || []).length, toasts: [...document.querySelectorAll('#toast-container > *')].map(t => t.textContent.trim()) }))))
    api.steps['bar button taps'] = { order: log }
    console.error(JSON.stringify(log))
}

const browser = await ENGINE.launch()
async function runSide(side, flow, opts) {
    const { server, base } = await serve(path.join(HERE, side, DIST))
    const { api, close } = await open(browser, base, opts)
    api.base = base
    try { await flow(api) } catch (e) { api.errors.push('FLOW: ' + e.message.split('\n')[0]) }
    await close(); server.close()
    return api
}
const FLOWS = { mini: miniFlow, tap2: tap2Flow, scroll2: scroll2Flow, scroll: scrollFlow, blend: blendFlow, many: manyFlow, address: addressFlow, covers: coversFlow, sweep: sweepFlow, first: firstFlow }
const opts = PART === 'covers' ? { coverDelay: 6000 } : {}
const A = await runSide(SIDE_A, FLOWS[PART], opts)
const B = await runSide(SIDE_B, FLOWS[PART], opts)
await browser.close()

const results = []
const note = (what, ok, detail = '') => results.push({ what, ok, detail: String(detail).slice(0, 900) })
const firstDiff = (a, b) => { a = String(a); b = String(b); let i = 0; while (i < a.length && a[i] === b[i]) i++; return `@${i}: A«${a.slice(Math.max(0, i - 120), i + 160)}» B«${b.slice(Math.max(0, i - 120), i + 160)}»` }
const pics = []
for (const name of new Set([...Object.keys(A.steps), ...Object.keys(B.steps)])) {
    const a = A.steps[name], b = B.steps[name]
    if (!a || !b) { note(`${name}: present on both`, false, `A ${Boolean(a)} B ${Boolean(b)}`); continue }
    if (a.order) { note(`${name}`, JSON.stringify(a.order) === JSON.stringify(b.order), firstDiff(JSON.stringify(a.order), JSON.stringify(b.order))); continue }
    for (const root of Object.keys(a.reads)) {
        const ra = a.reads[root], rb = b.reads[root]
        if (!ra || !rb) { note(`${name} ${root}: exists`, ra === rb, `A ${Boolean(ra)} B ${Boolean(rb)}`); continue }
        for (const k of ['dom', 'inner', 'boxes', 'toasts', 'focus', 'slider', 'url', 'scrollY', 'scrollW', 'listTop', 'barHover', 'barDisabled', 'sheetOpen', 'docH']) {
            const x = JSON.stringify(ra[k]), y = JSON.stringify(rb[k])
            note(`${name} ${root} ${k}`, x === y, x === y ? (['focus', 'toasts', 'url', 'scrollY', 'listTop', 'barHover'].includes(k) ? x : '') : firstDiff(x, y))
        }
        note(`${name} ${root} aria`, a.aria[root] === b.aria[root], firstDiff(a.aria[root], b.aria[root]))
    }
    note(`${name} cfgs`, JSON.stringify(a.cfgs) === JSON.stringify(b.cfgs), JSON.stringify(a.cfgs) === JSON.stringify(b.cfgs) ? (a.cfgs || []).slice(-1).join('') : firstDiff(JSON.stringify(a.cfgs), JSON.stringify(b.cfgs)))
    if (a.extra || b.extra) note(`${name} extra`, JSON.stringify(a.extra) === JSON.stringify(b.extra), `A ${JSON.stringify(a.extra)} B ${JSON.stringify(b.extra)}`)
    const n = Math.max(a.pages.length, b.pages.length)
    for (let k = 0; k < n; k++) {
        const d = diffPixels(a.pages[k], b.pages[k])
        const ok = d.dims && d.count === 0
        note(`${name} picture ${k}`, ok, JSON.stringify(d))
        if (!ok && d.dims) pics.push({ name, k, d })
        if (!ok && d.dims && pics.length <= 6) {
            const safe = `${TAG}-${name}-${k}`.replace(/[^\w.-]+/g, '_').slice(0, 120)
            fs.writeFileSync(path.join(OUT, safe + '-A.png'), a.pages[k]); fs.writeFileSync(path.join(OUT, safe + '-B.png'), b.pages[k])
        }
    }
}
note('page errors A', A.errors.length === 0, A.errors.join(' | '))
note('page errors B', B.errors.length === 0, B.errors.join(' | '))
const failed = results.filter(r => !r.ok)
const summary = { tag: TAG, steps: Object.keys(A.steps).length, checks: results.length, failed: failed.length, picturesDiffer: pics.length, maxPx: Math.max(0, ...pics.map(p => p.d.count)), maxIntensity: Math.max(0, ...pics.map(p => p.d.max)) }
fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify({ summary, failed, results }, null, 1))
console.log(JSON.stringify(summary))
for (const f of failed) console.log('FAIL', f.what, '::', f.detail.slice(0, 300))
