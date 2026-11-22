// F83 sync 4: the first tab of the phone's bottom bar on /start, in WebKit with the iPhone 14 profile, `main` against this branch:
// the label, the active state, the strokes of the icon and the name in the top bar.
//   node phone-icon-check.mjs <dist of main> <dist of this branch>
import { webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' }
const out = []
for (const dist of process.argv.slice(2)) {
    const server = http.createServer((req, res) => {
        const u = new URL(req.url, 'http://x')
        let f = path.join(dist, decodeURIComponent(u.pathname))
        if (u.pathname === '/' || u.pathname === '/home') f = path.join(dist, 'index.html')
        else if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = u.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
        if (!f || !fs.existsSync(f)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' })
        fs.createReadStream(f).pipe(res)
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const browser = await webkit.launch()
    const ctx = await browser.newContext({ ...devices['iPhone 14'] })
    await ctx.route(() => true, r => (new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort()))
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:${server.address().port}/start`)
    await page.waitForTimeout(2500)
    out.push(await page.evaluate(() => {
        const a = document.querySelector('#phone-tabbar a[data-tab="home"]')
        return { label: a.querySelector('.lb').textContent, cur: a.classList.contains('cur'), ariaCurrent: a.getAttribute('aria-current'), icon: a.querySelector('svg').innerHTML, topBarName: document.querySelector('.phone-topbar__title').textContent }
    }))
    await browser.close()
    server.close()
}
console.log(JSON.stringify(out, null, 1))
console.log('same:', JSON.stringify(out[0]) === JSON.stringify(out[1]))
