// UAT-293 (F80): the phone's crate seen on a diagonal, as on the computer. What it costs, measured before anything is built.
//
//   TODAY=<built site as it is> TRIAL=<the same site, the 3D crate allowed on the phone> OUT=<this folder> node measure.mjs
//
// Both builds are publication-shaped (`node scripts/publication-budget.mjs --out <dist>`, stand-in keys from the environment, the real covers); the
// trial differs by one condition (the 3D crate is not held back on a phone) and is NOT in the branch: it exists to be measured. Served by this
// script's own static server on 127.0.0.1, closed at the end. The music hosts are aborted first, by name; any host besides the four static ones the
// page names is blocked. Nothing is typed; the only click is on the page's own pause icon.
//
// Measured, on each build: what the first visit weighs (bytes on the wire, by host), when the first text is painted, how long the main thread is
// held (long tasks), and the frames while the first screen scrolls. Chromium as a phone 390 px wide with the processor held back 4 times; WebKit
// as an iPhone 14 (390) and at 375 (WebKit has no processor brake: its numbers are this Mac's). Photographs: the crate's block, at 390 and 375.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.env.OUT
const DISTS = { today: process.env.TODAY, trial: process.env.TRIAL }
fs.mkdirSync(OUT, { recursive: true })
const MUSIC = new Set(['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com'])
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' }

function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/') file = path.join(dist, 'index.html')
        if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const iphone = devices['iPhone 14']
const PROFILES = [
    { name: 'webkit-iphone14-390', engine: webkit, context: { ...iphone } },
    { name: 'webkit-375', engine: webkit, context: { ...iphone, viewport: { width: 375, height: 667 } } },
    { name: 'chromium-390-cpu4x', engine: chromium, brake: 4, context: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: iphone.userAgent } }
]
const out = {}
const lines = []
const say = (line) => { lines.push(line); console.log(line) }

/** The gaps between frames while something runs, in milliseconds. Runs in the page. */
const framesFor = (ms) => new Promise((resolve) => {
    const gaps = []
    let last = performance.now()
    const t0 = last
    const tick = (now) => { gaps.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(tick); else resolve(gaps) }
    requestAnimationFrame(tick)
})
const summary = (gaps) => {
    const s = [...gaps].sort((a, b) => a - b)
    const at = (q) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * q))] * 10) / 10
    return { frames: s.length, median: at(0.5), p95: at(0.95), worst: at(1), over33ms: s.filter(g => g > 33.4).length, over50ms: s.filter(g => g > 50).length }
}

async function visit(browser, profile, side, base, options = {}) {
    const context = await browser.newContext({ ...profile.context, ...options })
    const blocked = []
    const wire = {}
    await context.route('**/*', (route) => {
        const url = new URL(route.request().url())
        if (MUSIC.has(url.hostname)) { blocked.push(`MUSIC ${url.hostname}`); return route.abort() }
        if (!ALLOWED.has(url.hostname)) { blocked.push(url.hostname); return route.abort() }
        return route.continue()
    })
    const page = await context.newPage()
    page.on('requestfinished', async (request) => {
        try {
            const host = new URL(request.url()).hostname
            const sizes = await request.sizes()
            wire[host] = (wire[host] || 0) + sizes.responseBodySize + sizes.responseHeadersSize
        } catch { /* the page went away */ }
    })
    let cdp = null
    if (profile.brake) {
        cdp = await context.newCDPSession(page)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.brake })
    }
    await page.addInitScript(() => {
        globalThis.__long = []
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) globalThis.__long.push(Math.round(e.duration)) }).observe({ type: 'longtask', buffered: true }) } catch { /* WebKit has none */ }
    })
    await page.goto(base + '/', { waitUntil: 'load' })
    return { context, page, blocked, wire }
}

async function run() {
    for (const side of ['today', 'trial']) {
        if (!DISTS[side]) continue
        const { server, base } = await serve(path.resolve(DISTS[side]))
        try {
            for (const profile of PROFILES) {
                const args = profile.engine === chromium ? ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] : []
                const browser = await profile.engine.launch({ args })
                const tag = `${profile.name} ${side}`
                try {
                    const { context, page, blocked, wire } = await visit(browser, profile, side, base)
                    // the page at rest: the 3D drawn if it is coming at all
                    await page.waitForFunction(() => document.getElementById('stage').classList.contains('live'), null, { timeout: 12000 }).catch(() => {})
                    await page.waitForTimeout(1500)
                    const state = await page.evaluate(() => ({
                        live: document.getElementById('stage').classList.contains('live'),
                        canvas: Boolean(document.querySelector('canvas.gl')),
                        paint: Object.fromEntries(performance.getEntriesByType('paint').map(e => [e.name, Math.round(e.startTime)])),
                        long: globalThis.__long,
                        width: document.documentElement.scrollWidth,
                        pause: (() => { const b = document.getElementById('motion'); const r = b.getBoundingClientRect(); return { hidden: b.hidden, w: Math.round(r.width), h: Math.round(r.height) } })()
                    }))
                    await page.locator('#stage').scrollIntoViewIfNeeded()
                    await page.waitForTimeout(900)
                    await page.locator('#stage').screenshot({ path: path.join(OUT, `${side}-${profile.name}.png`) })
                    // frames while the first screens scroll (the crate in sight, then leaving)
                    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
                    await page.waitForTimeout(300)
                    const measuring = page.evaluate(`(${framesFor.toString()})(5000)`)
                    for (let i = 0; i < 45; i++) { await page.evaluate(() => scrollBy({ top: 14, behavior: 'instant' })); await page.waitForTimeout(100) }
                    const frames = summary(await measuring)
                    // the pause icon still stops and starts the motion
                    let pause = 'hidden'
                    if (!state.pause.hidden) {
                        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
                        await page.locator('#motion').click()
                        const paused = await page.evaluate(() => document.documentElement.classList.contains('paused'))
                        await page.locator('#motion').click()
                        const back = await page.evaluate(() => !document.documentElement.classList.contains('paused'))
                        pause = paused && back ? 'stops and starts' : 'BROKEN'
                    }
                    const total = Object.values(wire).reduce((a, b) => a + b, 0)
                    const music = blocked.filter(b => b.startsWith('MUSIC')).length
                    out[tag] = { ...state, wire, total, frames, pauseWorks: pause, musicRequests: music }
                    say(`${tag}: 3D ${state.live ? 'drawn' : 'not drawn'} · on the wire ${Math.round(total / 1024)} KB (3D library ${Math.round((wire['cdn.jsdelivr.net'] || 0) / 1024)} KB) · first text ${state.paint['first-contentful-paint'] ?? 'n/a'} ms · long tasks ${state.long.length} (${state.long.reduce((a, b) => a + b, 0)} ms, worst ${Math.max(0, ...state.long)} ms) · frames ${frames.frames} in 5 s, median ${frames.median} ms, p95 ${frames.p95} ms, worst ${frames.worst} ms, over 33 ms ${frames.over33ms}, over 50 ms ${frames.over50ms} · page ${state.width} px wide · pause ${pause} · music requests ${music}`)
                    await context.close()
                    // less motion asked
                    const calm = await visit(browser, profile, side, base, { reducedMotion: 'reduce' })
                    await calm.page.waitForTimeout(2500)
                    const calmState = await calm.page.evaluate(() => ({ canvas: Boolean(document.querySelector('canvas.gl')), live: document.getElementById('stage').classList.contains('live') }))
                    out[tag].reducedMotion = { ...calmState, library: Boolean(calm.wire['cdn.jsdelivr.net']) }
                    say(`${tag} · less motion asked: 3D canvas ${calmState.canvas ? 'PRESENT' : 'absent'}, 3D library ${calm.wire['cdn.jsdelivr.net'] ? 'FETCHED' : 'not fetched'}`)
                    await calm.context.close()
                } finally {
                    await browser.close()
                }
            }
        } finally {
            await new Promise(resolve => server.close(resolve))
        }
    }
    fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(out, null, 1) + '\n')
    fs.writeFileSync(path.join(OUT, 'results.txt'), lines.join('\n') + '\n')
}

run().catch((e) => { console.error(e); process.exit(2) })
