// F83 wave 8d: the tab title on every route, the parent (66cb1ee) against this branch, on the BUILT sites.
//   ENGINE=chromium|webkit PROFILE=1280|iphone14 node titles.mjs <dist of the parent> <dist of this branch>
// Own static server (a deep route answers app.html, as the hosting does). Firebase Auth/Firestore/Installations and every external host are blocked.
// After each load the page is given 1.5 s (the screen is lazy and sets its title when it mounts). Prints one JSON line: the titles of both sides, and the
// routes where they differ (the answer must be none). The final address is read too: a deviation (/home, /series ...) must land where the parent landed.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [oldDist, newDist] = process.argv.slice(2)
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium
const OPTIONS = process.env.PROFILE === 'iphone14' ? { ...devices['iPhone 14'] } : { viewport: { width: 1280, height: 800 } }
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
const ROUTES = ['/start', '/albums', '/albums/some-series', '/inventory', '/blend', '/blend?seriesId=abc', '/playlists', '/playlists/edit', '/saved-playlists', '/artists', '/genres', '/tracks', '/home', '/album-series', '/series', '/playlist-series', '/callback', '/no-such-route']

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

async function titles(browser, dist) {
    const { server, base } = await serve(dist)
    const out = {}
    for (const route of ROUTES) {
        const context = await browser.newContext(OPTIONS)
        await context.route('**/*', r => {
            const url = r.request().url()
            if (url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')) return BLOCKED.test(url) ? r.abort() : r.continue()
            return r.abort()
        })
        const page = await context.newPage()
        await page.goto(base + route, { waitUntil: 'load' }).catch(() => {})
        await page.waitForTimeout(1500)
        out[route] = { title: await page.title(), landed: new URL(page.url()).pathname + new URL(page.url()).search }
        await context.close()
    }
    server.close()
    return out
}

const browser = await ENGINE.launch()
const a = await titles(browser, oldDist)
const b = await titles(browser, newDist)
await browser.close()
const differ = ROUTES.filter(route => JSON.stringify(a[route]) !== JSON.stringify(b[route]))
console.log(JSON.stringify({ engine: process.env.ENGINE || 'chromium', profile: process.env.PROFILE || '1280', routes: ROUTES.length, differ, parent: a, branch: b }))
