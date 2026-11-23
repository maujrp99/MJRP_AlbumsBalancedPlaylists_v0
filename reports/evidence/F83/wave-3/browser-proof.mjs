// F83 wave 3, the browser proof of the shell (the top bar and the footer of the computer, the shell of the phone, the menu, the window to sign in).
// Run from the repo root with two dev servers up:
//
//   node reports/evidence/F83/wave-3/browser-proof.mjs <the shell as it was: dev server on the wave 2 tip (610fc1b)> <the shell as it is: dev server of this branch>
//
// Signed out; nobody is signed in anywhere: a person is put in the user store in the page when a step needs one (the existing seam: `userStore` is
// a module of the app), and Spotify is a session in the page's storage with the account's name answered by the browser's own route stub. Nothing is
// written to a database, nothing is read from one, and no sign-in provider is called (the window to sign in is opened and cancelled; «Sign Out» is
// not pressed: it would call the login and reload the app). The same steps are driven on both pages at 1280 (a mouse), 900 (the middle screen
// with the drawer) and 393 (a touch screen), with real clicks, real keystrokes and real taps. After each step the pieces of the shell are compared
// (the DOM, with the white space between tags and the order of the classes taken out, as in the unit proof) and a screenshot of each is compared pixel
// by pixel (the clock of the footer is frozen). Where the old shell had a difference that the new one fixed on purpose, the step says so.
//
// RESULT_TAG, NO_TRANSITIONS=1, PARK_MOUSE=1 are the controls of wave 2: a second run with old against old tells the noise of the browser from a difference.
// Results: raw/browser-proof-results.json, captures/.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [oldBase, newBase] = process.argv.slice(2)
const OUT = path.dirname(new URL(import.meta.url).pathname)
const TAG = process.env.RESULT_TAG || ''
const CAPTURES = path.join(OUT, 'captures' + TAG)
fs.mkdirSync(CAPTURES, { recursive: true })
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })

const results = []
const pixels = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }

/** What a piece of the page says, ready to compare (run in the page, on a copy). */
const NORMALIZE = (mask) => {
    const fingerprint = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }
    const value = (el, name, v) => (name === 'style' ? el.style.cssText : name === 'class' ? v.split(/\s+/).filter(Boolean).sort().join(' ') : v)
    const attrs = (el) => [...el.attributes].map(({ name, value: v }) => [name, value(el, name, v)]).sort(([a], [b]) => a.localeCompare(b)).map(([n, v]) => ` ${n}="${v}"`).join('')
    const describe = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        const whole = `<${tag}${attrs(node)}>${[...node.childNodes].map(describe).join('')}</${tag}>`
        // an icon is its sorted classes and the fingerprint of its shapes (the classes of the icon itself, as a set)
        if (tag === 'svg') { const classes = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).sort().join(' '); return `<svg class="${classes}" shape="${fingerprint([...node.children].map(c => c.outerHTML).join(''))}"/>` }
        return whole
    }
    return (el) => {
        if (!el) return null
        const copy = el.cloneNode(true)
        if (mask) copy.querySelectorAll(mask).forEach(node => node.remove())
        return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').replace(/ style=""/g, '').replace(/ style="[^"]*"( class="[^"]*sheet--closing)/g, '$1').trim()
    }
}
const READ = (mask) => `(${NORMALIZE.toString()})(${JSON.stringify(mask || '')})`

const browser = await chromium.launch()

const png = (buffer) => PNG.sync.read(buffer)
function pixelsApart(a, b) {
    const one = png(a), two = png(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0
    for (let i = 0; i < one.data.length; i += 4) if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) apart++
    return apart
}

const GOOGLE = { uid: 'u1', isAnonymous: false, displayName: 'Proof Person', email: 'proof@example.test', photoURL: '/assets/images/logo.png', providerData: [{ providerId: 'google.com' }] }
const APPLE = { uid: 'u2', isAnonymous: false, displayName: 'Apple Proof', email: 'apple@example.test', photoURL: null, providerData: [{ providerId: 'apple.com' }] }

async function open(base, width, { spotify = false } = {}) {
    const phone = width < 768
    const context = await browser.newContext({ viewport: { width, height: phone ? 852 : 900 }, hasTouch: phone, isMobile: phone })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message.slice(0, 200)))
    page.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|api\/|ERR_/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    await page.addInitScript(() => { Date.prototype.toLocaleString = () => '21/11/2026, 12:00:00' })
    if (process.env.NO_TRANSITIONS) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    if (spotify) {
        await page.addInitScript(() => { localStorage.setItem('spotify_access_token', 'proof'); localStorage.setItem('spotify_expires_at', String(Date.now() + 3600e3)); localStorage.setItem('spotify_refresh_token', 'proof') })
        await page.route('https://api.spotify.com/v1/me', route => route.fulfill({ json: { display_name: 'Spotty Proof' } }))
    }
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 30000 })
    await page.waitForTimeout(1200) // the login answers, the bar is drawn again
    return { context, page, errors, phone, width }
}

const signIn = (page, user) => page.evaluate(async (u) => { (await import('/js/stores/UserStore.js')).userStore.setUser(u) }, user)
const signOutStore = (page) => page.evaluate(async () => { (await import('/js/stores/UserStore.js')).userStore.setUser(null) })
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.dataset.tab ? '[' + e.dataset.tab + ']' : ''}` })
const read = (page, selectors, mask) => page.evaluate(`(() => { const read = ${READ(mask)}; return ${JSON.stringify(selectors)}.map(s => [s, [...document.querySelectorAll(s)].map(read).join('')]) })()`)
const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY))
const body = (page) => page.evaluate(() => [...document.body.children].map(c => c.id || c.className || c.tagName).join(' | '))

/** The pieces of the shell that a step compares. */
const SHELL = ['#header-container', '#footer-container', '#phone-topbar', '#phone-tabbar', '.phone-to-top', '.sheet:not(.sheet--closing)', '.modal-overlay']

/**
 * Runs one step on both sides and compares: the shell's DOM, where the focus is, and the screenshot.
 * `mask` (a selector) takes those nodes out of both sides before comparing: for a difference on purpose, which the step then asserts on its own.
 */
async function step(label, sides, action, { selectors = SHELL, shot = true, mask = null, extra = null, wait = 450 } = {}) {
    const read1 = []
    for (const side of sides) {
        await action(side.page, side)
        await side.page.waitForTimeout(wait)
        if (process.env.PARK_MOUSE) await side.page.mouse.move(1, 1)
        read1.push({ dom: await read(side.page, selectors, mask), focus: await focusNow(side.page), extra: extra ? await extra(side.page) : null, shot: shot ? await side.page.screenshot() : null })
    }
    const [before, after] = read1
    const domOk = JSON.stringify(before.dom) === JSON.stringify(after.dom)
    const diff = !domOk ? before.dom.map(([s, v], i) => (v !== after.dom[i][1] ? s : null)).filter(Boolean).join(', ') : ''
    note(`${label} · the shell's DOM${mask ? ' (without ' + mask + ')' : ''}`, domOk, domOk ? '' : `differs in ${diff}`)
    note(`${label} · focus and what the page says besides`, before.focus === after.focus && JSON.stringify(before.extra) === JSON.stringify(after.extra), `${before.focus} / ${after.focus}${extra ? ' · ' + JSON.stringify([before.extra, after.extra]) : ''}`)
    if (shot) {
        const apart = pixelsApart(before.shot, after.shot)
        const name = label.replace(/\W+/g, '_').slice(0, 80)
        fs.writeFileSync(path.join(CAPTURES, `${name}.old.png`), before.shot)
        fs.writeFileSync(path.join(CAPTURES, `${name}.new.png`), after.shot)
        pixels.push({ label, apart })
        note(`${label} · pixels`, apart === 0, apart === Infinity ? 'different sizes' : `${apart} px apart`)
    }
}

async function both(width, options) {
    const sides = [await open(oldBase, width, options), await open(newBase, width, options)]
    return sides
}
const close = async (sides) => { for (const s of sides) await s.context.close() }
const noErrors = (sides, what) => note(`${what} · no error of the page on either side`, sides.every(s => s.errors.length === 0), sides.map((s, i) => `${i ? 'new' : 'old'}: ${s.errors.join(' | ')}`).join(' // '))

// ---- the computer, 1280 (a mouse)
{
    const sides = await both(1280)
    await step('A 1280 · the shell at the start, signed out', sides, async () => {})
    await step('A 1280 · a person signed in (Google): the bar is drawn again', sides, (page) => signIn(page, GOOGLE))
    await step('A 1280 · the account menu opened by a real click', sides, (page) => page.click('#userMenuBtn'))
    await step('A 1280 · the account menu closed by a real click outside', sides, (page) => page.mouse.click(640, 700))
    await step('A 1280 · the account menu opened by the keyboard (arrow down on the avatar)', sides, async (page) => { await page.focus('#userMenuBtn'); await page.keyboard.press('ArrowDown') })
    await step('A 1280 · the account menu closed by Escape: the focus goes back to the avatar', sides, (page) => page.keyboard.press('Escape'))
    await step('A 1280 · the menu of series opened by a real click', sides, (page) => page.click('#seriesDropdownBtn'))
    await step('A 1280 · the menu of series: «Soon» does nothing', sides, (page) => page.click('#seriesDropdownMenu [aria-disabled="true"]', { force: true }), { extra: (page) => page.evaluate(() => location.pathname) })
    await step('A 1280 · the menu of series closed by a click outside', sides, (page) => page.mouse.click(640, 700))
    await step('A 1280 · Apple: the avatar of an Apple sign-in', sides, (page) => signIn(page, APPLE))
    await step('A 1280 · nobody again: Sign In', sides, (page) => signOutStore(page))
    await step('A 1280 · the window to sign in opened by a real click', sides, (page) => page.click('#loginBtn'))
    await step('A 1280 · the window closed by «Continue as Guest»', sides, (page) => page.click('[data-action="cancel"]'))
    await step('A 1280 · the window opened and closed by a click on the background', sides, async (page) => { await page.click('#loginBtn'); await page.mouse.click(8, 8) })
    // a link of the bar moves the router once
    // the router moves once (one entry in the history); the bar then follows the address on the new side (the old bar kept the highlight where it first was drawn)
    await step('A 1280 · a link of the bar: Inventory: the router moves once', sides, (page) => page.click('#header-container a[href="/inventory"]'), { selectors: ['#footer-container'], shot: false, extra: (page) => page.evaluate(() => location.pathname + ' ' + history.length) })
    {
        const current = await Promise.all(sides.map(side => side.page.evaluate(() => [...document.querySelectorAll('#header-container nav > div.hidden > a')].filter(a => a.classList.contains('text-accent-primary')).map(a => a.getAttribute('href')))))
        note('A 1280 · after the move the old bar still marks «Start» and the new one marks «Inventory» (decided, revisable: the highlight follows the address)', JSON.stringify(current) === JSON.stringify([['/start'], ['/inventory']]), JSON.stringify(current))
    }
    // where the focus goes when the bar is drawn again (the old bar drew itself anew: the focus is the page)
    await step('A 1280 · the bar drawn again while a button holds the focus: the focus is the page, the next Tab starts at the top', sides, async (page) => { await page.focus('#loginBtn'); await signIn(page, GOOGLE) }, { selectors: ['#header-container'], shot: false })
    await step('A 1280 · …and the next Tab', sides, (page) => page.keyboard.press('Tab'), { selectors: ['#header-container'], shot: false })
    noErrors(sides, 'A 1280')
    await close(sides)
}

// ---- Spotify on the computer (an account answered by the browser's stub)
{
    const sides = await both(1280, { spotify: true })
    await step('S 1280 · Spotify connected: the pill with the account name', sides, async () => {}, { selectors: ['#spotify-connect-desktop', '#spotify-connect-mobile'] })
    await step('S 1280 · the X asks first (the app\'s own question)', sides, (page) => page.click('#spotify-connect-desktop #spotifyLogoutBtn'), { selectors: ['#spotify-connect-desktop', '.app-modal', '.modal-overlay'] })
    await step('S 1280 · the question answered No: still connected', sides, async (page) => { await page.keyboard.press('Escape') }, { selectors: ['#spotify-connect-desktop', '.app-modal', '.modal-overlay'] })
    noErrors(sides, 'S 1280')
    await close(sides)
}

// ---- the footer
{
    const sides = await both(1280)
    await step('F 1280 · the footer and the notice of the Discogs API hidden', sides, async () => {}, { selectors: ['#footer-container'] })
    await step('F 1280 · the notice of the Discogs API turned on by a screen', sides, async (page) => {
        await page.evaluate(async () => { (await import('/js/stores/discogsNotice.js').catch(() => import('/js/components/Footer.js'))).showDiscogsNotice(true) })
    }, { selectors: ['#footer-container'] })
    await close(sides)
}

// ---- the middle screen, 900: the drawer
{
    const sides = await both(900)
    await step('M 900 · the drawer closed', sides, async () => {}, { selectors: ['#header-container'] })
    await step('M 900 · the drawer opened by a real click: the page is held', sides, (page) => page.click('#mobileMenuBtn'), { selectors: ['#header-container'], extra: (page) => page.evaluate(() => document.body.style.overflow) })
    await step('M 900 · the series of the drawer opened (the icons of that button are masked: the old drawer turned the music note, the new one turns the chevron)', sides, (page) => page.click('#mobileSeriesToggle'), { selectors: ['#header-container'], mask: '#mobileSeriesToggle svg', shot: false })
    {
        const turned = await Promise.all(sides.map(side => side.page.evaluate(() => [...document.querySelectorAll('#mobileSeriesToggle svg')].map(svg => svg.classList.contains('rotate-180')))))
        note('M 900 · which icon of «Music Series» turned: the old turned the note, the new turns the chevron', JSON.stringify(turned) === JSON.stringify([[true, false], [false, true]]), JSON.stringify(turned))
    }
    // (a real click on the page beside the drawer does not reach the background on either side: the bar's glass makes the box of the background the size of the bar)
    await step('M 900 · the drawer closed by the background (the click is sent to the background itself)', sides, (page) => page.dispatchEvent('#mobileMenuOverlay', 'click'), { selectors: ['#header-container'], mask: '#mobileSeriesToggle svg', extra: (page) => page.evaluate(() => document.body.style.overflow) })
    // the link moves the router once and the drawer closes; the bar then follows the address on the new side (the links of the bar and of the drawer that mark the current place are masked here: the old bar did not follow)
    await step('M 900 · the drawer opened, then closed by a link', sides, async (page) => { await page.click('#mobileMenuBtn'); await page.click('#mobileMenu a[href="/saved-playlists"]') }, { selectors: ['#footer-container'], shot: false, extra: (page) => page.evaluate(() => location.pathname + ' ' + document.body.style.overflow) })
    await step('M 900 · signed in: the foot of the drawer', sides, async (page) => { await signIn(page, GOOGLE); await page.click('#mobileMenuBtn') }, { selectors: ['#mobileMenu'], mask: '#mobileSeriesToggle svg' })
    noErrors(sides, 'M 900')
    await close(sides)
}

// ---- the phone, 393 (a touch screen)
{
    const sides = await both(393)
    await step('P 393 · the shell of the phone at the start', sides, async () => {})
    await step('P 393 · the menu opened by a real tap on the top bar', sides, (page) => page.tap('#phoneMenuBtn'))
    await step('P 393 · the menu closed by Escape', sides, (page) => page.keyboard.press('Escape'))
    await step('P 393 · the question before clearing the cache: Cancel', sides, async (page) => { await page.tap('#phoneMenuBtn'); await page.locator('.phone-menu__row', { hasText: 'Clear album cache' }).tap(); await page.waitForTimeout(300) })
    await step('P 393 · …cancelled', sides, (page) => page.locator('#phone-clear-cache .btn-secondary').tap())
    await step('P 393 · the window to sign in, from the menu', sides, async (page) => { await page.tap('#phoneMenuBtn'); await page.tap('.phone-menu__sign-in') })
    await step('P 393 · the window closed', sides, (page) => page.tap('[data-action="cancel"]'))
    const PHONE = ['#phone-topbar', '#phone-tabbar', '.phone-to-top', '.sheet:not(.sheet--closing)', '.modal-overlay', '#footer-container']
    await step('P 393 · a tap on a tab goes there: Playlists', sides, (page) => page.tap('#phone-tabbar a[data-tab="playlists"]'), { selectors: PHONE, extra: (page) => page.evaluate(() => location.pathname) })
    await step('P 393 · a tap on the tab of the screen the person is on stays and goes to the top', sides, (page) => page.tap('#phone-tabbar a[data-tab="playlists"]'), { selectors: PHONE, extra: (page) => page.evaluate(() => location.pathname + ' ' + history.length) })
    await step('P 393 · a screen names itself in the top bar', sides, (page) => page.evaluate(async () => { (await import('/js/stores/screenName.js').catch(() => import('/js/components/navigation/PhoneShell.js'))).nameThisScreen('Prog Rock <70s>') }), { selectors: ['#phone-topbar'], shot: false })
    await step('P 393 · signed in: the initial and the menu with Sign Out', sides, async (page) => { await signIn(page, GOOGLE); await page.tap('#phoneMenuBtn') }, { selectors: PHONE })
    await step('P 393 · …closed', sides, (page) => page.keyboard.press('Escape'), { selectors: PHONE })
    await step('P 393 · the tab drawn again while it holds the focus: the focus is the page', sides, async (page) => { await page.focus('#phone-tabbar a[data-tab="blend"]'); await page.evaluate(() => window.router.navigate('/blend')) }, { selectors: ['#phone-tabbar'], shot: false })
    // «back to top»
    await step('P 393 · «back to top» appears after two screens of scroll', sides, async (page) => { await page.evaluate(() => { const s = document.createElement('div'); s.id = 'proof-tall'; s.style.height = '3000px'; document.getElementById('app').appendChild(s); window.scrollTo(0, 2000) }) }, { selectors: ['.phone-to-top'], extra: scrollY })
    await step('P 393 · «back to top» tapped', sides, (page) => page.tap('.phone-to-top'), { selectors: ['.phone-to-top'], extra: scrollY, wait: 1500 })
    await step('P 393 · a screen on a phone turned to a computer and back (the viewport)', sides, async (page) => { await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(300); }, { selectors: PHONE, shot: false, extra: body })
    await step('P 393 · …a phone again', sides, async (page) => { await page.setViewportSize({ width: 393, height: 852 }) }, { selectors: PHONE, shot: false, extra: body })
    noErrors(sides, 'P 393')
    await close(sides)
}

// ---- five visits: the shell can be stopped and started again with nothing left behind (new side only; the old one had no stop; skipped when both sides are the old one)
if (newBase !== oldBase) {
    const s = await open(newBase, 393)
    const left = await s.page.evaluate(async () => {
        const { startShell } = await import('/js/shell/Shell.tsx')
        const { userStore } = await import('/js/stores/UserStore.js')
        const before = { header: document.getElementById('header-container').innerHTML.length, body: document.body.children.length }
        const stops = []
        for (let i = 0; i < 5; i++) {
            stops.push(startShell({ router: { afterNavigate: () => () => {} }, userStore, clearCaches: async () => {} }))
        }
        stops.forEach(stop => stop())
        await new Promise(r => setTimeout(r, 300))
        return { before, after: { header: document.getElementById('header-container').innerHTML.length, body: document.body.children.length } }
    })
    note('five more shells started on the page and stopped: what they put in the body is gone', left.after.body === left.before.body, JSON.stringify(left))
    await s.context.close()
}

await browser.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'raw', `browser-proof-results${TAG}.json`), JSON.stringify({ oldBase, newBase, passed: results.length - failed.length, failed: failed.length, results, pixels }, null, 2))
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed of ${results.length}; max pixels apart ${Math.max(0, ...pixels.map(p => p.apart))}`)
process.exit(0)
