// After the merge of the 3D crate's fix into the caption branch: a look, on the BUILT site at 1280 x 800 (Chromium), that the caption (album and year) and
// the crate's fixed poses live together. Nothing is clicked; music hosts and every host outside the page's four static ones are aborted; server closed.
//   DIST=<dist> OUT=<folder> node look.mjs
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const OUT = process.env.OUT; const DIST = process.env.DIST
const NEVER = ['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com']
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x'); let file = path.join(DIST, decodeURIComponent(url.pathname))
    if (url.pathname === '/') file = path.join(DIST, 'index.html')
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const lines = []
try {
    const browser = await chromium.launch()
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const blocked = new Set()
    await context.route('**/*', (route) => { const host = new URL(route.request().url()).hostname; if (NEVER.includes(host) || !ALLOWED.has(host)) { blocked.add(host); return route.abort() } return route.continue() })
    const page = await context.newPage()
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) }); page.on('pageerror', e => errors.push(e.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' })
    await page.waitForTimeout(3500) // the 3D crate loads after the page
    for (const track of ['a1', 'start', 'blend', 'playlists']) {
        await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), track)
        await page.waitForTimeout(1800)
        const read = await page.evaluate(() => ({ who: document.getElementById('who').innerText.replace(/\s+/g, ' | ').trim(), label: document.getElementById('am').getAttribute('aria-label'), canvas: !!document.querySelector('#scene canvas'), mode: document.documentElement.className }))
        lines.push(`${track}: caption «${read.who}»; button «${read.label}»; 3D canvas ${read.canvas}; html class «${read.mode}»`)
        await page.locator('.stage-col').screenshot({ path: path.join(OUT, `merged-1280-stage-${track}.jpg`), type: 'jpeg', quality: 80 })
    }
    lines.push(`console errors: ${errors.length ? errors.join(' | ') : 'none'}; hosts aborted: ${[...blocked].join(', ') || 'none'}`)
    await browser.close()
} finally { await new Promise(r => server.close(r)) }
fs.writeFileSync(path.join(OUT, 'merged-1280-look.txt'), lines.join('\n') + '\n')
console.log(lines.join('\n'))
