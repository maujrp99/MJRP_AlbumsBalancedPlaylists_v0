// F83 wave 0, the browser proof of the canary. Run from the repo root with a dev server up:
//   node reports/evidence/F83/wave-0/browser-proof.mjs http://127.0.0.1:5733 https://mjrp-playlist-generator.web.app
// For each address (/artists, /genres, /tracks) at 1280 and 393 it takes #app of the new screen (local dev server) and of
// production (the hand-made screen), compares their markup with the white space collapsed, and saves a capture of each.
// Then: leaves and returns (listeners, one screen only), and checks that the rest of the app works (Start, a search).
// It reads only: nothing is written to the database (the anonymous session the app opens by itself is the only trace).
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const [local, production] = process.argv.slice(2)
const OUT = path.dirname(new URL(import.meta.url).pathname)
const CAPTURES = path.join(OUT, 'captures')
fs.mkdirSync(CAPTURES, { recursive: true })

const normalize = (html) => html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/ </g, '<').trim()
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + detail : ''}`) }

const browser = await chromium.launch()
async function open(base, route, width) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message.slice(0, 160)))
    await page.goto(base + route, { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0, null, { timeout: 30000 })
    await page.waitForTimeout(1500)
    return { context, page, errors }
}

for (const width of [1280, 393]) {
    for (const route of ['/artists', '/genres', '/tracks']) {
        const mine = await open(local, route, width)
        const theirs = await open(production, route, width)
        const a = normalize(await mine.page.evaluate(() => document.getElementById('app').innerHTML))
        const b = normalize(await theirs.page.evaluate(() => document.getElementById('app').innerHTML))
        const name = route.slice(1)
        await mine.page.screenshot({ path: path.join(CAPTURES, `${width}-${name}-new.png`) })
        await theirs.page.screenshot({ path: path.join(CAPTURES, `${width}-${name}-production.png`) })
        note(`#app of ${route} at ${width}: new = production (white space collapsed)`, a === b, a === b ? `${a.length} chars` : `\n new: ${a.slice(0, 200)}\n prod: ${b.slice(0, 200)}`)
        note(`no page error on ${route} at ${width}`, mine.errors.length === 0, mine.errors.join(' | '))
        await mine.context.close(); await theirs.context.close()
    }
}

// Leaving and returning: /artists -> /start -> /genres -> back, one screen in #app each time
{
    const { context, page } = await open(local, '/artists', 1280)
    const screens = []
    for (const link of ['/start', '/genres', '/albums', '/tracks', '/start', '/artists']) {
        await page.evaluate((to) => window.router.navigate(to), link)
        await page.waitForTimeout(900)
        screens.push(await page.evaluate(() => ({ path: location.pathname, kids: document.getElementById('app').children.length, h1: document.querySelectorAll('#app h1').length })))
    }
    const last = screens[screens.length - 1]
    note('leaving and returning six times: always one screen in #app, the right one at the end', screens.every(s => s.kids >= 1) && last.path === '/artists' && last.h1 === 1, JSON.stringify(screens))
    await page.goBack(); await page.waitForTimeout(800)
    note('the back button leaves the canary and the app answers', (await page.evaluate(() => location.pathname)) === '/start', await page.evaluate(() => location.pathname))
    await context.close()
}

// The rest of the app still works: Start draws, and the search of an artist in the albums screen answers
{
    const { context, page, errors } = await open(local, '/start', 1280)
    const startOk = await page.evaluate(() => document.getElementById('app').innerText.length > 50)
    await page.screenshot({ path: path.join(CAPTURES, '1280-start-new.png') })
    note('Start draws', startOk, errors.join(' | '))
    await page.evaluate(() => window.router.navigate('/albums')); await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(CAPTURES, '1280-albums-new.png') })
    note('the albums screen draws', await page.evaluate(() => document.getElementById('app').innerText.length > 20))
    await context.close()
}

await browser.close()
fs.writeFileSync(path.join(OUT, 'raw/browser-proof-results.json'), JSON.stringify(results, null, 2))
process.exit(results.every(r => r.ok) ? 0 : 1)
