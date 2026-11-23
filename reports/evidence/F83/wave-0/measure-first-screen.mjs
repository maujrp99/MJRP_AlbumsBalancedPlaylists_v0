// usage: node f83_first_screen.mjs <dist dir> <path> [runs] [slow]
// Serves dist/ (like firebase.json: / and /home are the entry page, any other path without an extension is app.html), opens the
// path in Chromium with an empty cache, and reports: when #app first has content, DOMContentLoaded, the bytes of the scripts
// downloaded before that, and which scripts came. `slow` = 1.6 Mbps down, 150 ms latency (Slow 4G).
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { chromium } from '@playwright/test'

const [dist, route, runsArg = '5', slow = '0'] = process.argv.slice(2)
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp' }

const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://x')
    let file = decodeURIComponent(url.pathname)
    if (file === '/' || file === '/home') file = '/index.html'
    else if (!path.extname(file)) file = '/app.html'
    const full = path.join(dist, file)
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { response.writeHead(404); response.end('nf'); return }
    const body = fs.readFileSync(full)
    const type = TYPES[path.extname(full)] || 'application/octet-stream'
    const gz = /gzip/.test(request.headers['accept-encoding'] || '') && /^(text|application\/json|image\/svg)/.test(type)
    response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', ...(gz ? { 'content-encoding': 'gzip' } : {}) })
    response.end(gz ? zlib.gzipSync(body) : body)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
const results = []
for (let run = 0; run < Number(runsArg); run++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    if (slow === '1') {
        const cdp = await context.newCDPSession(page)
        await cdp.send('Network.enable')
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    }
    await page.addInitScript(() => {
        window.__firstApp = null
        const watch = () => {
            const app = document.getElementById('app')
            if (!app) return
            new MutationObserver(() => { if (window.__firstApp === null && app.children.length) window.__firstApp = performance.now() }).observe(app, { childList: true, subtree: true })
        }
        document.addEventListener('DOMContentLoaded', watch)
    })
    const scripts = []
    page.on('response', async (response) => {
        const u = response.url()
        if (u.startsWith(base) && u.endsWith('.js')) {
            const body = await response.body().catch(() => null)
            scripts.push({ name: path.basename(u), gzip: body ? zlib.gzipSync(body).length : 0, at: Date.now() })
        }
    })
    await page.goto(base + route, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__firstApp !== null, null, { timeout: 30000 }).catch(() => {})
    const first = await page.evaluate(() => ({ firstApp: window.__firstApp, dcl: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd }))
    results.push({ ...first, scripts: scripts.map(s => s.name) })
    await context.close()
}
await browser.close()
server.close()
const med = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)]
console.log(JSON.stringify({ route, slow, runs: results.length, firstAppMs: results.map(r => Math.round(r.firstApp ?? -1)), median: Math.round(med(results.map(r => r.firstApp ?? 0))), dclMedian: Math.round(med(results.map(r => r.dcl))), scripts: results[0].scripts }, null, 1))
