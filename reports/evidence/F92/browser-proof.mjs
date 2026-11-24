// F92 (REQ-04, REQ-10): the browser proof of the Blend screen on the BUILT site: the two new recipe cards («Deep cuts», «Least played»)
// and the skip slider of «Deep cuts».
//
//   ENGINE=chromium|webkit WIDTH=1440|393 node reports/evidence/F92/browser-proof.mjs <dist>
//
// What the page is given:
//  * the built site, by a small static server on 127.0.0.1 (fallback to app.html, as the hosting answers a deep route);
//  * one series seeded in the store of series (no database: the production Firebase is blocked);
//  * every other host ABORTED: music.apple.com, itunes.apple.com, geo.music.apple.com, js-cdn.music.apple.com, api.music.apple.com,
//    open.spotify.com, accounts.spotify.com, the production Firebase and anything else; and any address that is not http(s) to 127.0.0.1
//    (music://, itms://, spotify:). No link that leaves the site is pressed. No key or password is read or typed.
// What it does not prove: a generation with real albums (the albums come from Apple Music, blocked here): the tracks the two recipes
// choose are proved in test/algorithms/blockRecipes.test.js. The Portuguese texts are proved in jsdom (the site opens in English).
import { chromium, webkit } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [dist] = process.argv.slice(2)
if (!dist || !fs.existsSync(path.join(dist, 'app.html'))) throw new Error('give the folder of the built site')
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const WIDTH = process.env.WIDTH === '393' ? 393 : 1440
const PHONE = WIDTH === 393
const TAG = `${ENGINE_NAME}-${WIDTH}`
const SHOTS = path.join(HERE, 'figures')
const RAW = path.join(HERE, 'raw')
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(RAW, { recursive: true })

const NEVER = /music\.apple\.com|itunes\.apple\.com|js-cdn\.music\.apple\.com|api\.music\.apple\.com|open\.spotify\.com|accounts\.spotify\.com|identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations|firebaseapp\.com|web\.app|firebaseio\.com/
const SCHEMES = /^(music|musics|itms|itms-apps|spotify):/i

const results = []
const note = (what, ok, detail = '') => {
    results.push({ what, ok, detail: String(detail).slice(0, 600) })
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${TAG} · ${what}${detail ? '  ' + String(detail).slice(0, 240) : ''}`)
}

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
function serve() {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        res.end(fs.readFileSync(file))
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const { server, base } = await serve()
const browser = await ENGINE.launch()
const context = await browser.newContext({
    viewport: { width: WIDTH, height: PHONE ? 852 : 900 },
    ...(PHONE ? { hasTouch: true, deviceScaleFactor: 2 } : {}),
    locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce'
})
const aborted = []
await context.route(() => true, (route) => {
    const url = route.request().url()
    let host = ''
    try { host = new URL(url).hostname } catch { /* not an address */ }
    if (/^https?:/.test(url) && host === '127.0.0.1' && !SCHEMES.test(url)) return route.continue()
    aborted.push(url.slice(0, 80))
    return route.abort()
})
await context.route(NEVER, route => { aborted.push(route.request().url().slice(0, 80)); return route.abort() })

const page = await context.newPage()
const errors = []
const left = []
page.on('framenavigated', (frame) => { if (frame === page.mainFrame() && !frame.url().startsWith(base) && frame.url() !== 'about:blank') left.push(frame.url()) })
page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) })
page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|identitytoolkit|auth\/|^Worker Error|Authentication issue|\[AppleMusic|\[MusicKit|access control checks|due to access control|Could not connect|was blocked|Load failed/i.test(m.text())) return
    errors.push(m.text().slice(0, 200))
})
const shoot = async (name) => { await page.screenshot({ path: path.join(SHOTS, `${TAG}-${name}.png`), animations: 'disabled', caret: 'hide', fullPage: !PHONE }) }

try {
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router && window.albumSeriesStore, null, { timeout: 40000 })
    await page.addStyleTag({ content: '#toast-container { visibility: hidden !important }' })
    await page.evaluate(() => {
        window.albumSeriesStore.setSeries([{ id: 'proof-series', name: 'Proof mix', albumQueries: [] }])
        window.router.navigate('/blend?seriesId=proof-series')
    })
    await page.waitForSelector('#blend-recipe-cards [data-recipe-id]', { timeout: 20000 })
    await page.waitForTimeout(600)

    const ids = await page.$$eval('#blend-recipe-cards [data-recipe-id]', cards => cards.map(card => card.getAttribute('data-recipe-id')))
    note('the six recipe cards, the two new ones last', JSON.stringify(ids) === JSON.stringify(['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user', 'deep-cuts', 'least-played']), ids.join(', '))
    const card = (id) => page.locator(`#blend-recipe-cards [data-recipe-id="${id}"]`)
    const deepText = (await card('deep-cuts').textContent()).replace(/\s+/g, ' ')
    const leastText = (await card('least-played').textContent()).replace(/\s+/g, ' ')
    note('«Deep cuts» card: name, SPOTIFY badge, what it does', /Deep cuts/.test(deepText) && /SPOTIFY/.test(deepText) && /Skips the most popular tracks/.test(deepText), deepText)
    note('«Least played» card: name, SPOTIFY badge, what it does', /Least played/.test(leastText) && /SPOTIFY/.test(leastText) && /least popular tracks/.test(leastText), leastText)
    note('the page does not scroll sideways', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 0.5))
    await card('deep-cuts').scrollIntoViewIfNeeded()
    await shoot('1-cards')

    // «Deep cuts»: the slider of the skip, from 3 to 10, at 3
    await card('deep-cuts').click()
    await page.waitForSelector('#blend-skip-slider', { timeout: 10000 })
    const slider = page.locator('#blend-skip-slider')
    const [min, max, value] = await slider.evaluate(input => [input.min, input.max, input.value])
    note('«Deep cuts» shows the skip slider: 3 to 10, at 3', min === '3' && max === '10' && value === '3', `${min}..${max} at ${value}`)
    const panel = (await page.locator('#blend-ingredients-panel').textContent()).replace(/\s+/g, ' ')
    note('the slider says what it does', /Skip the most popular/.test(panel) && /3 to start, up to 10/.test(panel), panel.slice(0, 300))
    note('«Deep cuts» shows no Top # and no shuffle', !/Choose your Top #/.test(panel) && (await page.locator('[data-grouping="shuffle"]').count()) === 0)
    await slider.scrollIntoViewIfNeeded()
    await shoot('2-deep-cuts-slider-at-3')

    // move it to 5 with the keyboard (two steps right), as a person can
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    const shown = await page.locator('#blend-skip-display').textContent()
    note('moved two steps, the slider says 5', shown.trim() === '5', shown)
    note('the slider keeps the focus while it moves', await page.evaluate(() => document.activeElement?.id === 'blend-skip-slider'))
    // to the end: it stops at 10
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    note('it stops at 10 (the limit for a take of 3)', (await page.locator('#blend-skip-display').textContent()).trim() === '10')
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(200)
    await shoot('3-deep-cuts-slider-at-5')

    // «Least played»: no slider
    await card('least-played').click()
    await page.waitForTimeout(400)
    note('«Least played» shows no skip slider', (await page.locator('#blend-skip-slider').count()) === 0)
    const summary = (await page.locator('#blend-generate-section').textContent().catch(() => '')).replace(/\s+/g, ' ')
    note('step 4 is ready with «Least played» on the series', /Least played/.test(summary) && /Proof mix/.test(summary), summary.slice(0, 200))
    await shoot('4-least-played')
} catch (error) {
    note('the run itself', false, error.message.split('\n')[0])
    await shoot('broken').catch(() => {})
}
note('no page error', errors.length === 0, errors.join(' | '))
note('the page never left the site', left.length === 0, left.join(' | '))

await browser.close()
server.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results, aborted: [...new Set(aborted)] }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
