// F83 REQ-10: lost network -> «No connection» -> network back -> «Try again» -> the screen draws, WITHOUT loading the app again.
//   node reports/evidence/F83/wave-0/browser-offline-retry.mjs http://127.0.0.1:5733        (a dev server)
//   node reports/evidence/F83/wave-0/browser-offline-retry.mjs --dist dist                  (the production build, served from dist/)
// «Not loaded again» is checked three ways: a marker on window, performance.timeOrigin (the page's own clock start), and that
// the page fired no new `load` after the first one.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
let base = args[0]
let server = null
if (args[0] === '--dist') {
    const dist = path.resolve(args[1])
    const T = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' }
    server = http.createServer((q, r) => {
        let f = new URL(q.url, 'http://x').pathname
        if (f === '/' || f === '/home') f = '/index.html'; else if (!path.extname(f)) f = '/app.html'
        const full = path.join(dist, f)
        if (!fs.existsSync(full)) { r.writeHead(404); r.end(); return }
        r.writeHead(200, { 'content-type': T[path.extname(full)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(fs.readFileSync(full))
    })
    await new Promise(res => server.listen(0, '127.0.0.1', res))
    base = `http://127.0.0.1:${server.address().port}`
}

let failed = false
const say = (what, ok, detail = '') => { if (!ok) failed = true; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + detail : ''}`) }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
let loads = 0
page.on('load', () => { loads += 1 })
await page.goto(base + '/start', { waitUntil: 'load' })
await page.waitForFunction(() => document.getElementById('app')?.children.length > 0, null, { timeout: 30000 })
await page.waitForTimeout(1500)
const before = await page.evaluate(() => { window.__same_page = 'yes'; return { origin: performance.timeOrigin, marker: window.__same_page } })

for (const route of ['/artists']) { // one file serves the three addresses: after the retry it is kept
    await context.setOffline(true)
    await page.evaluate((to) => window.router.navigate(to), route)
    await page.waitForFunction(() => document.querySelector('[data-action="retry-screen"]'), null, { timeout: 25000 })
    say(`${route} offline: «No connection» with «Try again»`, (await page.evaluate(() => document.getElementById('app').innerText)).includes('No connection'))
    await context.setOffline(false)
    await page.click('[data-action="retry-screen"]')
    await page.waitForFunction(() => document.querySelector('#app h1'), null, { timeout: 25000 })
    const after = await page.evaluate(() => ({ origin: performance.timeOrigin, marker: window.__same_page, h1: document.querySelector('#app h1').textContent }))
    say(`${route} online, «Try again»: the screen draws (${after.h1})`, /Series/.test(after.h1))
    say(`${route}: the page was not loaded again (marker, timeOrigin)`, after.marker === before.marker && after.origin === before.origin)
    await page.evaluate(() => window.router.navigate('/start'))
    await page.waitForTimeout(800)
}
say('no new load event of the page during the whole run', loads === 1, `loads=${loads}`)
await page.evaluate(() => window.router.navigate('/artists'))
await page.waitForTimeout(800)
say('visiting the screen again later draws it at once (the module is kept)', (await page.evaluate(() => document.querySelector('#app h1')?.textContent)) === 'Artist Series')
await browser.close()
server?.close()
process.exit(failed ? 1 : 0)
