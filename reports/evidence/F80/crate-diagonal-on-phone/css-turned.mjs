// UAT-293 (F80), option C: today's CSS crate of the phone, turned as the computer's CSS crate is (the `--yaw` the page already has), photographed
// for the owner to compare. Nothing is built: the one CSS value is set on the served page of today.   TODAY=<dist> OUT=<folder> node css-turned.mjs
// The music hosts are aborted by name; any host besides the page's own static ones is blocked; nothing is clicked.
import { webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve(process.env.TODAY), OUT = process.env.OUT
const MUSIC = new Set(['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com'])
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    const file = url.pathname === '/' ? path.join(DIST, 'index.html') : path.join(DIST, decodeURIComponent(url.pathname))
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await webkit.launch()
try {
    for (const [name, viewport] of [['390', devices['iPhone 14'].viewport], ['375', { width: 375, height: 667 }]]) {
        const context = await browser.newContext({ ...devices['iPhone 14'], viewport })
        await context.route('**/*', (route) => { const h = new URL(route.request().url()).hostname; return MUSIC.has(h) || !ALLOWED.has(h) ? route.abort() : route.continue() })
        const page = await context.newPage()
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' })
        await page.waitForTimeout(1200)
        for (const yaw of [-15, -30]) {
            await page.evaluate((yaw) => document.getElementById('crate-css').style.setProperty('--yaw', `${yaw}deg`), yaw)
            await page.locator('#scene').scrollIntoViewIfNeeded()
            await page.waitForTimeout(900)
            await page.locator('#scene').screenshot({ path: path.join(OUT, `option-css-turned-${-yaw}deg-webkit-${name}.png`) })
        }
        await context.close()
    }
} finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
}
