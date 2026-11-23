// F83 wave 6b: the change on purpose of the wave, on the BUILT sites. The album window is opened on the albums screen and on the inventory, and the screen is
// left by the app's own router (the link of the top bar followed): the hand-made window (the parent, 315ae5f) stays over the next screen, the React one is
// taken off the page with the screen it belongs to.
//
//   ENGINE=webkit|chromium node leave-proof.mjs <dist of the parent> <dist of this branch>
import { chromium, webkit } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
const serve = (dist) => new Promise(resolve => {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }))
})

const SEAM = (text) => {
    const cls = /class (\w+)\{constructor\(\)\{this\.albums=\[\],this\.loading=!1/.exec(text)?.[1]
    const inst = cls && new RegExp(`(\\w+)=new ${cls}\\b`).exec(text)?.[1]
    return `${text}\n;window.__inv=${inst};`
}
const item = { id: 'inv-1', title: 'The Album', artist: 'Pink Floyd', format: 'cd', owned: true, albumData: { id: 'al-1', title: 'The Album', artist: 'Pink Floyd', tracks: [{ title: 'One', position: 1, duration: 100 }] } }

const side = async (label, base) => {
    const browser = await ENGINE.launch()
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    await context.route(BLOCKED, route => route.abort())
    await context.route(/\/assets\/main-[^/]*\.js$/, async route => { const response = await route.fetch(); await route.fulfill({ response, body: SEAM(await response.text()) }) })
    const page = await context.newPage()
    await page.goto(`${base}/inventory`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__inv, null, { timeout: 20000 })
    await page.evaluate((items) => window.__inv.setAlbums(items), [item])
    await page.waitForSelector('.inventory-card-wrapper')
    await page.waitForTimeout(1200)
    await page.locator('.inventory-card-wrapper [data-action="view-modal"]').first().click()
    await page.waitForSelector('.modal-overlay.album-window')
    const before = await page.locator('.modal-overlay.album-window').count()
    await page.evaluate(() => document.querySelector('a[href="/albums"]').click()) // the window covers the bar: the link is followed as the app follows it
    await page.waitForTimeout(1500)
    const after = await page.locator('.modal-overlay.album-window').count()
    console.log(`${label}: the window is open on the inventory (${before}); on the next screen (${new URL(page.url()).pathname}) there are ${after}`)
    await browser.close()
    return { before, after }
}

const [a, b] = await Promise.all([serve(oldDist), serve(newDist)])
const old = await side('the hand-made window', a.base)
const now = await side('the React window', b.base)
console.log(old.after === 1 && now.after === 0 ? 'EXPECTED: the hand-made window stays, the React one leaves with the screen' : 'UNEXPECTED')
a.server.close()
b.server.close()
