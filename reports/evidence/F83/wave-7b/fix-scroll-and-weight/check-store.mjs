// window.playlistsStore is there after a cold /start (the idle prefetch loads the shared controller), on the final build
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const HERE = path.dirname(new URL(import.meta.url).pathname)
const dist = path.join(HERE, 'new', 'dist')
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' }
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    let file = path.join(dist, decodeURIComponent(url.pathname))
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = url.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
    if (!file) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const browser = await chromium.launch()
const ctx = await browser.newContext({ serviceWorkers: 'block' })
await ctx.route(() => true, r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort())
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${server.address().port}/start`)
const ok = await page.waitForFunction(() => Boolean(window.playlistsStore && window.router && window.albumSeriesStore), null, { timeout: 15000 }).then(() => true, () => false)
console.log('window.playlistsStore, router and albumSeriesStore present after a cold /start:', ok)
await browser.close(); server.close()
