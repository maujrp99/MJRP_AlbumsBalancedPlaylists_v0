// What a cold first screen downloads (scripts and styles under /assets), per side and route, with every external host blocked.
// node requests.mjs  -> prints, per route, the list of each side and whether new == old
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/' || url.pathname === '/home') file = path.join(dist, 'index.html')
        else if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = url.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
        if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}
const norm = (p) => p.replace(/-[A-Za-z0-9_-]{8}\.(js|css)$/, '.$1')
const browser = await chromium.launch()
const out = {}
for (const route of ['/', '/start', '/albums']) {
    for (const side of ['old', 'unfixed', 'new']) {
        const { server, base } = await serve(path.join(HERE, side, 'dist'))
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-US', serviceWorkers: 'block' })
        await ctx.route(() => true, (r) => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort())
        const page = await ctx.newPage()
        const atLoad = new Set(); const later = new Set(); let loaded = false; const order = []; const t0 = Date.now()
        page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname === '127.0.0.1' && /^\/assets\/.*\.(js|css)$/.test(u.pathname)) { (loaded ? later : atLoad).add(norm(u.pathname)); order.push(`${Date.now() - t0}ms ${norm(u.pathname)}`) } })
        await page.goto(base + route, { waitUntil: 'load' })
        await page.waitForTimeout(700); loaded = true // what comes in the first 700 ms after load is the first screen; the rest is the idle prefetch
        await page.waitForTimeout(6000)
        out[`${route} ${side}`] = { order, first: [...atLoad].sort(), prefetch: [...later].filter(x => !atLoad.has(x)).sort() }
        await ctx.close(); server.close()
    }
}
await browser.close()
for (const route of ['/', '/start', '/albums']) {
    const o = out[`${route} old`], n = out[`${route} new`], u = out[`${route} unfixed`]
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    console.log(`${route}: first screen new == old ? ${eq(o.first, n.first)} (old ${o.first.length}, new ${n.first.length}); unfixed == old ? ${eq(o.first, u.first)}`)
    console.log(`  only in new: ${JSON.stringify(n.first.filter(x => !o.first.includes(x)))}   only in old: ${JSON.stringify(o.first.filter(x => !n.first.includes(x)))}`)
    console.log(`  only in unfixed: ${JSON.stringify(u.first.filter(x => !o.first.includes(x)))}`)
    console.log(`  after the first screen (idle prefetch), old: ${o.prefetch.length} files, new: ${n.prefetch.length} files; only in new: ${JSON.stringify(n.prefetch.filter(x => !o.prefetch.includes(x)))}; only in old: ${JSON.stringify(o.prefetch.filter(x => !n.prefetch.includes(x)))}`)
}
for (const side of ['old','new']) console.log(`/albums order ${side}:\n  ` + out[`/albums ${side}`].order.join('\n  '))
fs.writeFileSync(path.join(HERE, 'requests.json'), JSON.stringify(out, null, 1))
