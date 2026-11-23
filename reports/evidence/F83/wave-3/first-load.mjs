// F83 wave 3: what moving the shell to React costs the first load. Run from the repo root with the two publishable builds (no keys) on disk:
//
//   node reports/evidence/F83/wave-3/first-load.mjs <dist of the wave 2 tip> <dist of this branch> [runs]
//
// Each dist/ is served from a small static server that answers the way Firebase Hosting does for the app (gzip, /start and the other addresses of
// the app answered by app.html). A fresh browser context for each run (nothing cached), a slow network (150 ms of round trip, 1.6 Mbit/s down: the
// «Fast 3G» of the devtools) and a CPU four times slower. Measured: the bytes that crossed the network (JS and CSS, as sent), when the first paint
// came, when the top bar was drawn, and when the first screen had its content. The median of the runs, and every run.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { chromium } from '@playwright/test'

const [oldDist, newDist, runsArg] = process.argv.slice(2)
const RUNS = Number(runsArg || 5)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' }

function serve(dist, port) {
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'app.html')
        const body = fs.readFileSync(file)
        const type = TYPES[path.extname(file)] || 'application/octet-stream'
        const gz = /\.(html|js|css|json|svg|webmanifest)$/.test(file) && /gzip/.test(request.headers['accept-encoding'] || '')
        response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', ...(gz ? { 'content-encoding': 'gzip' } : {}) })
        response.end(gz ? zlib.gzipSync(body) : body)
    })
    return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)))
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

async function once(browser, base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    let bytes = 0
    const kinds = new Map()
    cdp.on('Network.responseReceived', (e) => kinds.set(e.requestId, e.response.url))
    cdp.on('Network.loadingFinished', (e) => { const url = kinds.get(e.requestId) || ''; if (/\.(js|css)(\?|$)/.test(url) && url.startsWith(base)) bytes += e.encodedDataLength })
    await page.addInitScript(() => {
        window.__t = {}
        const watch = () => {
            const now = Math.round(performance.now())
            if (!window.__t.bar && document.querySelector('#header-container nav')) window.__t.bar = now
            const app = document.getElementById('app')
            if (!window.__t.screen && app && app.children.length > 0 && !/^Loading/.test(app.textContent || '')) window.__t.screen = now
            if (!(window.__t.bar && window.__t.screen)) requestAnimationFrame(watch)
        }
        document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(watch))
    })
    await page.goto(base + '/start', { waitUntil: 'commit' })
    await page.waitForFunction(() => window.__t && window.__t.bar && window.__t.screen, null, { timeout: 120000 })
    await page.waitForTimeout(500)
    const t = await page.evaluate(() => ({ ...window.__t, paint: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || { startTime: 0 }).startTime) }))
    await context.close()
    return { ...t, bytes }
}

const browser = await chromium.launch()
const sides = [['wave 2 tip (shell hand-made)', oldDist, 5051], ['this branch (shell in React)', newDist, 5052]]
const report = {}
for (const [label, dist, port] of sides) {
    const server = await serve(path.resolve(dist), port)
    const runs = []
    for (let i = 0; i < RUNS; i++) runs.push(await once(browser, `http://127.0.0.1:${port}`))
    server.close()
    report[label] = { runs, median: { bytes: median(runs.map(r => r.bytes)), paint: median(runs.map(r => r.paint)), bar: median(runs.map(r => r.bar)), screen: median(runs.map(r => r.screen)) } }
    console.log(label, JSON.stringify(report[label].median), '\n   runs', JSON.stringify(runs))
}
await browser.close()
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'raw', 'first-load.json'), JSON.stringify(report, null, 2))
