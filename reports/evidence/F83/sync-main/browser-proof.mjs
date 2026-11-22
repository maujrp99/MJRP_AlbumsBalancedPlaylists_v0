// F83, sync of main: the browser proof that the menu in React is the menu of `main` (F88), on the BUILT sites.
// Run from the repo root with two `vite preview` servers up, one over the build of `main` (the hand-made menu, in production) and one over this branch:
//
//   node reports/evidence/F83/sync-main/browser-proof.mjs <base of main> <base of the branch>
//
// ENGINE=chromium|webkit · PROFILE=desktop (1280 x 900) | tablet (800: the range 768-899 that now runs the phone's layout) | 'iPhone 14' | 'iPhone SE'
// OLD_AGAINST_OLD=1 compares the build of `main` with itself (the control for noise); RESULT_TAG names the result file and the captures folder.
//
// Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations are aborted before the page loads),
// and the motion is asked off (prefers-reduced-motion) so the equalizer bars stand still and the pixels can be compared. Apple Music is a stand-in script
// in place of Apple's (the token route and musickit.js are answered by the test, `window.__apple` says if the person has authorized): the REAL MusicKit
// needs the developer token of the server and the catalog of Apple and is NOT exercised. Nobody is signed in on these pages (Firebase is blocked): the
// signed-in states are proved by test/shell/Shell.sameAsBefore.test.tsx.
// For every state each side is photographed (the part of the page that holds the menu) and compared pixel by pixel; the order of Tab, the focus after
// Escape / ArrowDown and the rectangles of the labels against the row of bars are compared too.
import { chromium, webkit, devices } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [oldBase, newBase] = process.argv.slice(2)
const OUT = path.dirname(new URL(import.meta.url).pathname)
const TAG = process.env.RESULT_TAG || ''
const CAPTURES = path.join(OUT, `captures-${process.env.ENGINE || 'chromium'}-${(process.env.PROFILE || 'desktop').replace(/\s+/g, '')}${TAG}`)
fs.mkdirSync(CAPTURES, { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || 'desktop'
const PHONE = PROFILE !== 'desktop'
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }

const contextOptions = () => {
    const base = { reducedMotion: 'reduce' }
    if (PROFILE === 'desktop') return { ...base, viewport: { width: 1280, height: 900 } }
    if (PROFILE === 'tablet') return { ...base, viewport: { width: 800, height: 1000 }, hasTouch: true }
    return { ...base, ...devices[PROFILE] }
}

const APPLE_STAND_IN = `
  (() => {
    const instance = { get isAuthorized() { return window.__apple.authorized }, musicUserToken: 'u',
      authorize: async () => { window.__apple.asked.push('authorize'); window.__apple.authorized = true; return 'u' },
      unauthorize: async () => { window.__apple.asked.push('unauthorize'); window.__apple.authorized = false }, addEventListener() {}, removeEventListener() {} }
    window.MusicKit = { configure: async () => { window.__apple.asked.push('configure') }, getInstance: () => instance }
  })()`

async function open(base, route, { apple = 'off', signOfApple = false, wait = 1500 } = {}) {
    const context = await browser.newContext(contextOptions())
    const page = await context.newPage()
    await page.route(BLOCKED, (r) => r.abort())
    await page.route(/mzstatic\.com/, (r) => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    if (apple === 'blocked') {
        await page.route(/js-cdn\.music\.apple\.com/, (r) => r.abort())
        await page.route(/\/api\/musickit-token/, (r) => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
    } else {
        await page.route(/\/api\/musickit-token/, (r) => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
        await page.route(/js-cdn\.music\.apple\.com/, (r) => r.fulfill({ contentType: 'application/javascript', body: APPLE_STAND_IN }))
    }
    await page.addInitScript(({ authorized, sign }) => {
        window.__apple = { authorized, asked: [] }
        if (sign) { try { localStorage.setItem('albumBlender.appleMusic.authorized', '1') } catch { /* none */ } }
    }, { authorized: apple === 'on', sign: signOfApple })
    await page.goto(base + route, { waitUntil: 'load' })
    await page.waitForTimeout(wait)
    return { context, page }
}

function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, delta = 0
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) {
            apart++; delta = Math.max(delta, d)
            const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width)
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
        }
    }
    return { apart, delta, box: apart ? `box x ${x0}-${x1}, y ${y0}-${y1}, largest difference ${delta} of 255` : '' }
}

const slug = (text) => text.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 80)
let shots = 0
/** Photographs the same part of the page on both sides and compares them. `clip` is a function of the page's viewport. */
async function compare(label, pages, clipOf) {
    const [a, b] = pages
    const sizeA = a.viewportSize()
    const clip = clipOf(sizeA)
    const [imgA, imgB] = await Promise.all([a.screenshot({ clip }), b.screenshot({ clip })])
    const { apart, delta, box } = pixelsApart(imgA, imgB)
    note(`${label}: pixels`, apart === 0, apart === 0 ? '0 pixels apart' : `${apart} pixels apart, ${box}`)
    // the pictures are kept when they differ by more than the noise (1 of 255 on a pixel), and for the first three of each run (small crops)
    if (delta > 1 || shots < 3) {
        fs.writeFileSync(path.join(CAPTURES, `${slug(label)}-old.png`), imgA)
        fs.writeFileSync(path.join(CAPTURES, `${slug(label)}-new.png`), imgB)
    }
    shots++
}

const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.dataset?.tab ? '[' + e.dataset.tab + ']' : ''}${e.dataset?.action ? '[' + e.dataset.action + ']' : ''}:${e.tagName === 'SELECT' ? '' : (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)}` })
const same = (label, x, y) => note(label, JSON.stringify(x) === JSON.stringify(y), JSON.stringify(x) === JSON.stringify(y) ? '' : `old ${JSON.stringify(x).slice(0, 200)} · new ${JSON.stringify(y).slice(0, 200)}`)

const browser = await ENGINE.launch()
const bases = [oldBase, process.env.OLD_AGAINST_OLD === '1' ? oldBase : newBase]
const pair = async (route, options) => { const opened = await Promise.all(bases.map(base => open(base, route, options))); return opened }
const close = (opened) => Promise.all(opened.map(({ context }) => context.close()))
const pages = (opened) => opened.map(({ page }) => page)

const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(',') : ['/start', '/albums', '/blend', '/saved-playlists', '/playlist-series', '/playlists', '/inventory', '/artists', '/genres', '/tracks']

if (!PHONE) {
    // ---- the computer: the bar on each route (the current stop and the line under it)
    for (const route of ROUTES) {
        const opened = await pair(route)
        await compare(`computer, ${route}: the bar`, pages(opened), ({ width }) => ({ x: 0, y: 0, width, height: 170 }))
        await close(opened)
    }
    // ---- the account panel: nobody signed in; Apple Music in each state, asked when the panel opens
    for (const [state, options] of [['not asked: the script of Apple cannot be reached', { apple: 'blocked', signOfApple: false }], ['authorized (it asked in the background)', { apple: 'on', signOfApple: true }], ['not authorized, a sign of an earlier visit', { apple: 'off', signOfApple: true }], ['not authorized, no sign', { apple: 'off', signOfApple: false }]]) {
        const opened = await pair('/albums', options)
        await compare(`computer, Apple Music ${state}: the closed button`, pages(opened), ({ width }) => ({ x: 0, y: 0, width, height: 170 }))
        await Promise.all(pages(opened).map(p => p.click('#userMenuBtn')))
        await pages(opened)[0].waitForTimeout(1500)
        await compare(`computer, Apple Music ${state}: the panel open`, pages(opened), ({ width }) => ({ x: width - 560, y: 0, width: 560, height: 520 }))
        same(`computer, Apple Music ${state}: what Apple's script was asked`, ...await Promise.all(pages(opened).map(p => p.evaluate(() => window.__apple.asked))))
        // the keyboard: Escape gives the focus back to the button, Tab goes through the panel
        await Promise.all(pages(opened).map(p => p.keyboard.press('Escape')))
        same(`computer, Apple Music ${state}: focus after Escape`, ...await Promise.all(pages(opened).map(focusNow)))
        await Promise.all(pages(opened).map(p => p.keyboard.press('ArrowDown')))
        same(`computer, Apple Music ${state}: focus after ArrowDown on the button`, ...await Promise.all(pages(opened).map(focusNow)))
        const orders = [[], []]
        for (let i = 0; i < 6; i++) {
            await Promise.all(pages(opened).map(p => p.keyboard.press('Tab')))
            const seen = await Promise.all(pages(opened).map(focusNow))
            orders[0].push(seen[0]); orders[1].push(seen[1])
        }
        same(`computer, Apple Music ${state}: the order of Tab inside the panel`, orders[0], orders[1])
        await close(opened)
    }
    // ---- Apple Music connects and disconnects from the panel
    {
        const opened = await pair('/albums', { apple: 'off', signOfApple: true })
        await Promise.all(pages(opened).map(p => p.click('#userMenuBtn')))
        await pages(opened)[0].waitForTimeout(1200)
        await Promise.all(pages(opened).map(p => p.click('[data-connection="apple"] button')))
        await pages(opened)[0].waitForTimeout(1200)
        // `main` closes the panel when the row is redrawn inside the click (the known difference); open it again to compare what the row says
        for (const p of pages(opened)) if (!(await p.evaluate(() => document.getElementById('userMenuBtn').getAttribute('aria-expanded') === 'true'))) await p.click('#userMenuBtn')
        await pages(opened)[0].waitForTimeout(500)
        await compare('computer, Apple Music connected by the button: the panel and the dots', pages(opened), ({ width }) => ({ x: width - 560, y: 0, width: 560, height: 520 }))
        same('computer, Apple Music connected by the button: what Apple\'s script was asked', ...await Promise.all(pages(opened).map(p => p.evaluate(() => window.__apple.asked))))
        await close(opened)
    }
    // ---- the focus: the bar is drawn again when the screen changes (a click on a stop of the bar)
    {
        const opened = await pair('/start')
        await Promise.all(pages(opened).map(p => p.focus('#top-menu-bar a[data-tab="blend"]')))
        await Promise.all(pages(opened).map(p => p.click('#top-menu-bar a[data-tab="blend"]')))
        await pages(opened)[0].waitForTimeout(1200)
        same('computer, a click on a stop: the address', ...await Promise.all(pages(opened).map(p => p.evaluate(() => location.pathname))))
        same('computer, a click on a stop: where the focus is', ...await Promise.all(pages(opened).map(focusNow)))
        await compare('computer, after the click on Blend: the bar', pages(opened), ({ width }) => ({ x: 0, y: 0, width, height: 170 }))
        await close(opened)
    }
} else {
    // ---- the phone (and the range 768-899): the bottom menu on each route, the top bar, the Menu sheet
    for (const route of ROUTES.slice(0, 8)) {
        const opened = await pair(route)
        await compare(`${PROFILE}, ${route}: the bottom menu`, pages(opened), ({ width, height }) => ({ x: 0, y: height - 120, width, height: 120 }))
        await compare(`${PROFILE}, ${route}: the top bar`, pages(opened), ({ width }) => ({ x: 0, y: 0, width, height: 70 }))
        const over = await Promise.all(pages(opened).map(p => p.evaluate(() => {
            const bars = document.querySelector('.pbar .eqbar')?.getBoundingClientRect()
            return [...document.querySelectorAll('.pbar .lb')].filter((l) => { const r = l.getBoundingClientRect(); return bars && !(r.bottom <= bars.top + 0.5 || r.top >= bars.bottom - 0.5) }).length
        })))
        note(`${PROFILE}, ${route}: no label sits over the row of bars`, over[0] === 0 && over[1] === 0, `labels over the bars: old ${over[0]}, new ${over[1]}`)
        await close(opened)
    }
    // the Menu sheet, signed out, with Apple Music in each state
    for (const [state, options] of [['authorized', { apple: 'on', signOfApple: true }], ['not authorized', { apple: 'off', signOfApple: true }], ['script unreachable', { apple: 'blocked', signOfApple: false }]]) {
        const opened = await pair('/albums', options)
        await Promise.all(pages(opened).map(p => p.click('#phoneMenuBtn')))
        await pages(opened)[0].waitForTimeout(1500)
        await compare(`${PROFILE}, the Menu sheet, Apple Music ${state}`, pages(opened), ({ width, height }) => ({ x: 0, y: 0, width, height }))
        same(`${PROFILE}, the Menu sheet, Apple Music ${state}: focus`, ...await Promise.all(pages(opened).map(focusNow)))
        same(`${PROFILE}, the Menu sheet, Apple Music ${state}: what Apple's script was asked`, ...await Promise.all(pages(opened).map(p => p.evaluate(() => window.__apple.asked))))
        await close(opened)
    }
    // larger text: the root font is 130 %, the labels still stay off the bars
    {
        const opened = await pair('/blend')
        await Promise.all(pages(opened).map(p => p.addStyleTag({ content: 'html{font-size:130% !important}' })))
        await pages(opened)[0].waitForTimeout(600)
        await compare(`${PROFILE}, larger text: the bottom menu`, pages(opened), ({ width, height }) => ({ x: 0, y: height - 140, width, height: 140 }))
        const over = await Promise.all(pages(opened).map(p => p.evaluate(() => {
            const bars = document.querySelector('.pbar .eqbar')?.getBoundingClientRect()
            return [...document.querySelectorAll('.pbar .lb')].filter((l) => { const r = l.getBoundingClientRect(); return bars && !(r.bottom <= bars.top + 0.5 || r.top >= bars.bottom - 0.5) }).length
        })))
        note(`${PROFILE}, larger text: no label sits over the row of bars`, over[0] === 0 && over[1] === 0, `old ${over[0]}, new ${over[1]}`)
        await close(opened)
    }
    // the passage from the home to the app: the entry page, then a tap on a stop of its bottom menu
    {
        const opened = await pair('/home', { wait: 2500 })
        const hasMenu = await Promise.all(pages(opened).map(p => p.evaluate(() => Boolean(document.querySelector('.pbar .stop[data-for="albums"]')))))
        note(`${PROFILE}, the home has its bottom menu`, hasMenu[0] && hasMenu[1])
        if (hasMenu[0] && hasMenu[1]) {
            await compare(`${PROFILE}, the home: the bottom menu`, pages(opened), ({ width, height }) => ({ x: 0, y: height - 120, width, height: 120 }))
            await Promise.all(pages(opened).map(p => p.click('.pbar .stop[data-for="albums"]')))
            await pages(opened)[0].waitForTimeout(2500)
            same(`${PROFILE}, the passage home to app: the address`, ...await Promise.all(pages(opened).map(p => p.evaluate(() => location.pathname))))
            await compare(`${PROFILE}, the passage home to app: the bottom menu in the app`, pages(opened), ({ width, height }) => ({ x: 0, y: height - 120, width, height: 120 }))
        }
        await close(opened)
    }
    // the focus: a tap on a stop draws the bar again, the focus goes back to the page, in both
    {
        const opened = await pair('/start')
        await Promise.all(pages(opened).map(p => p.click('#phone-tabbar a[data-tab="blend"]')))
        await pages(opened)[0].waitForTimeout(1200)
        same(`${PROFILE}, a tap on a stop: the address and the focus`, ...await Promise.all(pages(opened).map(async p => [await p.evaluate(() => location.pathname), await focusNow(p)])))
        await close(opened)
    }
}

await browser.close()
const failed = results.filter(r => !r.ok)
const resultFile = path.join(OUT, `browser-proof-results-${(process.env.ENGINE || 'chromium')}-${PROFILE.replace(/\s+/g, '')}${TAG}.json`)
fs.writeFileSync(resultFile, JSON.stringify(results, null, 2))
console.log(`\n${results.length} checks, ${failed.length} failed (${path.basename(resultFile)})`)
process.exit(0)
