// F83 sync 4: the browser proof of «Create» in place of «Start» (F91) and of the shared files that came with `main`, on the BUILT sites:
// the React line (this branch) against `main`'s hand-made build (336385a), and the noise control (`main` against itself).
//
//   WORK=<folder> ENGINE=chromium|webkit PROFILE=1280|iphone14|se A=<dist of A> B=<dist of B> TAG=<name> node main-vs-react.mjs
//
// Two builds are served by a small static server that answers a deep route with app.html (as the hosting does) and `/` and `/home` with index.html.
// Firebase Auth, Firestore and EVERY host that is not 127.0.0.1 are BLOCKED (the page cannot reach Google Fonts either, so the computer menu is drawn in
// the fallback face on both sides; what is compared is what the stylesheet asks for: the computed font of each stop). Nobody is made anonymous; no key is
// read or written here. The motion is asked off and Math.random is seeded so the pictures can be compared.
//
// PART=menu      the menu of the computer / the bottom bar and the top bar of the phone, the breadcrumb, the footer, on five routes: the words, the
//                icon, the active state, the font of each stop, the box of every element of the header and the footer, and a picture of each.
// PART=empty     the albums screen with nothing in the library: the button's words and the page.
// PART=home      the entry page (/home), signed out and signed in (the class `in` forced, as main's tests do), in Portuguese and in English.
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
const PART = process.env.PART || 'menu'
const TAG = `${PART}-${ENGINE_NAME}-${PROFILE}-${process.env.TAG || 'run'}`
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true })
const PROFILES = {
    1280: { computer: true, options: { viewport: { width: 1280, height: 800 } } },
    iphone14: { computer: false, touch: true, options: { ...devices['iPhone 14'] } },
    se: { computer: false, touch: true, options: { ...devices['iPhone SE'] } }
}
const P = PROFILES[PROFILE]

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
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

async function open(browser, base, init = {}) {
    const context = await browser.newContext({ ...P.options, locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce' })
    const blocked = new Set()
    await context.route(() => true, (route) => {
        const url = new URL(route.request().url())
        if (url.hostname !== '127.0.0.1') { blocked.add(url.hostname); return route.abort() }
        return route.continue()
    })
    await context.addInitScript(() => { let seed = 42; Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 } })
    await context.addInitScript(() => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM'; Date.prototype.toLocaleString = () => '11/22/2026, 12:00:00 PM' })
    if (init.lang) await context.addInitScript((lang) => { try { localStorage.setItem('albumblender:lang', lang) } catch {} }, init.lang)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)))
    const settle = async (ms = 1200) => {
        await page.waitForTimeout(ms)
        await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(150)
    }
    return { page, errors, blocked, settle, close: () => context.close() }
}

// what a page says about the menu, the breadcrumb and the footer (all read in the page)
const READ_CHROME = () => {
    const r = (n) => { const b = n.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(v => Math.round(v * 100) / 100).join(',') }
    const attrs = (n) => [...n.attributes].filter(a => a.name !== 'style').map(a => `${a.name}=${a.name === 'class' ? a.value.split(/\s+/).filter(Boolean).sort().join(' ') : a.value}`).sort().join(' ')
    const stops = [...document.querySelectorAll('nav.ms a.stop')].map(a => {
        const cs = getComputedStyle(a)
        const svg = a.querySelector('svg')
        return {
            text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), cur: a.classList.contains('cur'), ariaCurrent: a.getAttribute('aria-current'), box: r(a),
            font: `${cs.fontFamily} | ${cs.fontWeight} | ${cs.fontSize} | ${cs.lineHeight} | ${cs.color}`,
            icon: svg ? [...svg.children].map(c => c.tagName + ':' + ['x1', 'x2', 'y1', 'y2', 'd', 'cx', 'cy', 'r'].map(k => c.getAttribute(k)).filter(v => v !== null).join('/')).join(';') : null
        }
    })
    const header = document.querySelector('#header-container, #top-menu-bar')
    const headerBoxes = header ? [...header.querySelectorAll('*')].map((n, i) => `${i}:${n.tagName}:${r(n)}`).join(';') : null
    const footerEl = document.querySelector('#footer-container')
    const footerBoxes = footerEl ? [...footerEl.querySelectorAll('*')].map((n, i) => `${i}:${n.tagName}:${r(n)}`).join(';') : null
    const tab = document.getElementById('phone-tabbar')
    const tabBoxes = tab ? [...tab.querySelectorAll('*')].map((n, i) => `${i}:${n.tagName}:${r(n)}`).join(';') : null
    const top = document.getElementById('phone-topbar')
    const topBoxes = top ? [...top.querySelectorAll('*')].map((n, i) => `${i}:${n.tagName}:${r(n)}`).join(';') : null
    const title = document.querySelector('.phone-topbar__title')
    return {
        stops, headerBoxes, footerBoxes, tabBoxes, topBoxes, topTitle: title ? title.textContent.trim() : null,
        crumb: [...document.querySelectorAll('.breadcrumb')].map(n => n.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
        footerLinks: [...document.querySelectorAll('#footer-container .footer-links a')].map(a => `${a.textContent.trim()}->${a.getAttribute('href')}`).join(' | '),
        footerText: footerEl ? footerEl.innerText.replace(/\s+/g, ' ').trim() : null,
        headerText: header ? header.innerText.replace(/\s+/g, ' ').trim() : null,
        headerAttrs: header ? [...header.querySelectorAll('*')].map(attrs).join(' / ') : null,
        syneAsked: document.fonts ? [...document.fonts].map(f => f.family).filter((v, i, all) => all.indexOf(v) === i).join(',') : null
    }
}
const READ_PAGE = () => ({ text: document.body.innerText.replace(/\s+/g, ' ').trim(), title: document.title, lang: document.documentElement.lang, h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth })

function diffPixels(a, b) {
    if (!a || !b) return { dims: false, count: -1 }
    const A = PNG.sync.read(a), B = PNG.sync.read(b)
    if (A.width !== B.width || A.height !== B.height) return { dims: false, count: -1, sizes: `${A.width}x${A.height} vs ${B.width}x${B.height}` }
    let count = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]))
        if (d > 0) { count++; if (d > max) max = d; const px = (i / 4) % A.width, py = Math.floor(i / 4 / A.width); if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py }
    }
    return { dims: true, count, max, box: count ? [x0, y0, x1, y1] : null }
}

const ROUTES = ['/start', '/albums', '/blend', '/saved-playlists', '/inventory']

async function menuFlow(api) {
    const steps = {}
    for (const route of ROUTES) {
        await api.page.goto(api.base + route); await api.settle(2500)
        steps[`route ${route}`] = { read: await api.page.evaluate(READ_CHROME), pics: [await api.page.screenshot({ animations: 'disabled' })] }
    }
    return steps
}
async function emptyFlow(api) {
    const steps = {}
    await api.page.goto(api.base + '/albums'); await api.settle(3500)
    const cta = await api.page.evaluate(() => {
        const host = document.querySelector('#emptyStateContainer') || document.querySelector('#app')
        const button = host.querySelector('button, a[href="/start"]')
        const r = button ? button.getBoundingClientRect() : null
        return { present: Boolean(document.querySelector('#emptyStateContainer')), text: button ? button.textContent.replace(/\s+/g, ' ').trim() : null, tag: button ? button.tagName : null, href: button ? button.getAttribute('href') : null, box: r ? [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',') : null, page: document.getElementById('app').innerText.replace(/\s+/g, ' ').trim().slice(0, 400) }
    })
    steps['albums with nothing'] = { read: { cta, ...(await api.page.evaluate(READ_PAGE)) }, pics: [await api.page.screenshot({ animations: 'disabled' })] }
    if (cta.text) {
        await api.page.locator('#emptyStateContainer button, #emptyStateContainer a').first().click(); await api.settle(1500)
        steps['after the button'] = { read: { url: await api.page.evaluate(() => location.pathname) }, pics: [] }
    }
    return steps
}
async function homeFlow(api, init) {
    const steps = {}
    await api.page.goto(api.base + '/home'); await api.settle(2500)
    if (init.signedIn) { await api.page.evaluate(() => document.documentElement.classList.add('in')); await api.settle(800) } // the way main's tests force an account: the class `in`
    const read = await api.page.evaluate(READ_PAGE)
    const nav = await api.page.evaluate(() => {
        const r = (n) => { const b = n.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(v => Math.round(v * 100) / 100).join(',') }
        const stops = [...document.querySelectorAll('nav.ms a.stop, .top nav a.stop')].map(a => { const cs = getComputedStyle(a); return `${a.textContent.trim()}|${a.getAttribute('href')}|${r(a)}|${cs.fontFamily}|${cs.fontWeight}|${cs.fontSize}|${[...(a.querySelector('svg') || { children: [] }).children].map(c => c.outerHTML).join('')}` })
        const only = [...document.querySelectorAll('.hero h1, .hero .kicker, .hero .h-sub, .hero p, .hero .ctas a, .top .btn-start')].map(n => `${n.className}|${n.innerText.replace(/\s+/g, ' ').trim()}|${r(n)}|${getComputedStyle(n).display}`)
        return { stops, only: only.join('\n'), htmlClass: document.documentElement.className }
    })
    steps[`home ${init.name}`] = { read: { ...read, ...nav }, pics: [await api.page.screenshot({ animations: 'disabled' }), await api.page.screenshot({ fullPage: true, animations: 'disabled' })] }
    return steps
}

const browser = await ENGINE.launch()
async function runSide(dist, flow, init) {
    const { server, base } = await serve(dist)
    const api = await open(browser, base, init)
    api.base = base
    let steps = {}
    try { steps = await flow(api, init) } catch (e) { api.errors.push('FLOW: ' + e.message.split('\n')[0]) }
    await api.close(); server.close()
    return { steps, errors: api.errors, blocked: [...api.blocked] }
}

const sidesA = process.env.A, sidesB = process.env.B
const results = []
const note = (what, ok, detail = '') => results.push({ what, ok, detail: String(detail).slice(0, 700) })
const firstDiff = (a, b) => { a = String(a); b = String(b); let i = 0; while (i < a.length && a[i] === b[i]) i++; return `@${i}: A«${a.slice(Math.max(0, i - 80), i + 120)}» B«${b.slice(Math.max(0, i - 80), i + 120)}»` }
const observed = {}

const runs = []
if (PART === 'menu') runs.push({ flow: menuFlow, init: { name: 'menu' } })
if (PART === 'empty') runs.push({ flow: emptyFlow, init: { name: 'empty' } })
if (PART === 'home') for (const lang of ['pt', 'en']) for (const signedIn of [false, true]) runs.push({ flow: homeFlow, init: { lang, signedIn, name: `${lang} ${signedIn ? 'signed in' : 'signed out'}` } })

let pictures = 0, maxPx = 0
for (const { flow, init } of runs) {
    const A = await runSide(sidesA, flow, init), B = await runSide(sidesB, flow, init)
    for (const name of new Set([...Object.keys(A.steps), ...Object.keys(B.steps)])) {
        const a = A.steps[name], b = B.steps[name]
        if (!a || !b) { note(`${name}: present on both`, false, `A ${Boolean(a)} B ${Boolean(b)}`); continue }
        for (const k of Object.keys(a.read)) {
            const x = JSON.stringify(a.read[k]), y = JSON.stringify(b.read[k])
            note(`${name} ${k}`, x === y, x === y ? '' : firstDiff(x, y))
        }
        observed[name] = { A: summarize(a.read), B: summarize(b.read) }
        for (let i = 0; i < Math.max(a.pics.length, b.pics.length); i++) {
            const d = diffPixels(a.pics[i], b.pics[i])
            pictures++; if (d.count > maxPx) maxPx = d.count
            note(`${name} picture ${i}`, d.dims && d.count === 0, JSON.stringify(d))
            if (!(d.dims && d.count === 0) && d.dims && process.env.KEEP) { fs.writeFileSync(path.join(OUT, `${TAG}-${name}-${i}-A.png`.replace(/[^\w.-]+/g, '_')), a.pics[i]); fs.writeFileSync(path.join(OUT, `${TAG}-${name}-${i}-B.png`.replace(/[^\w.-]+/g, '_')), b.pics[i]) }
        }
    }
    note(`page errors A (${init.name})`, A.errors.length === 0, A.errors.join(' | '))
    note(`page errors B (${init.name})`, B.errors.length === 0, B.errors.join(' | '))
    observed[`hosts blocked ${init.name}`] = { A: A.blocked.sort().join(','), B: B.blocked.sort().join(',') }
}
await browser.close()

function summarize(read) {
    if (read.stops && typeof read.stops[0] === 'object') return { stops: read.stops.map(s => `${s.text}${s.cur ? '*' : ''}`).join(' · '), icon0: read.stops[0]?.icon ?? null, font0: read.stops[0]?.font ?? null, crumb: read.crumb, footerLinks: read.footerLinks, topTitle: read.topTitle }
    if (read.cta) return { cta: read.cta.text, ctaBox: read.cta.box, title: read.title }
    if (read.only) return { stops: read.stops.map(x => x.split('|').slice(0, 2).join('|')).join(' · '), font: read.stops[0]?.split('|').slice(3, 6).join('|'), title: read.title, lang: read.lang, htmlClass: read.htmlClass, first: read.only.split('\n').slice(0, 4) }
    return read
}

const failed = results.filter(r => !r.ok)
const summary = { tag: TAG, checks: results.length, failed: failed.length, pictures, maxPx }
fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify({ summary, observed, failed, results: results.filter(r => r.ok).length }, null, 1))
console.log(JSON.stringify(summary))
for (const f of failed) console.log('FAIL', f.what, '::', f.detail.slice(0, 330))
