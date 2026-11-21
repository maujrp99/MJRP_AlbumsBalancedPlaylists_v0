// F83 wave 4, the browser proof of the Start screen (the old Home). Run from the repo root with two dev servers up:
//
//   node reports/evidence/F83/wave-4/browser-proof.mjs <the screen as it was: dev server on the tree before the wave (c343830)> <the screen as it is: dev server of this branch>
//
// The catalog and the writing of the series are the seams of the visual sensor of F84 (`window.controller`: `picker.service`,
// `albumSearchService`, `writeSeries`), so nothing is asked of Apple Music and nothing is written to a database: the MusicKit of the real catalog
// is NOT exercised here (it needs the developer token of the server and an account); what is exercised is everything the screen does with what the
// catalog answers. Firebase Auth and Firestore are BLOCKED (requests to identitytoolkit, securetoken, firestore.googleapis and
// firebaseinstallations are aborted before the page loads): no anonymous account is made in production by this proof, and the page is a visitor.
// The same steps are driven on both pages at 1280 (a mouse) and 393 (a touch screen), with real clicks, keys and taps; after each step the page
// (`#app`, and the sheet of the phone) is compared as in the unit proof (hidden blocks by their attributes only), where the focus is, and a
// screenshot of each side pixel by pixel. RESULT_TAG, NO_TRANSITIONS=1, OLD_AGAINST_OLD=1 (both sides the old one) are the controls of waves 2 and 3.
// Results: raw/browser-proof-results<TAG>.json, captures<TAG>/.
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
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/

const results = []
const pixels = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }

/** What a piece of the page says, ready to compare (run in the page, on a copy). */
const NORMALIZE = () => {
    const fingerprint = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }
    const value = (el, name, v) => (name === 'style' ? el.style.cssText : name === 'class' ? v.split(/\s+/).filter(Boolean).sort().join(' ') : v)
    const attrs = (el) => [...el.attributes].map(({ name, value: v }) => [name, value(el, name, v)]).sort(([a], [b]) => a.localeCompare(b)).map(([n, v]) => ` ${n}="${v}"`).join('')
    const describe = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        if (tag === 'svg') { const classes = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).sort().join(' '); return `<svg class="${classes}" shape="${fingerprint([...node.children].map(c => c.outerHTML).join(''))}"/>` }
        return `<${tag}${attrs(node)}>${[...node.childNodes].map(describe).join('')}</${tag}>`
    }
    return (el) => {
        if (!el) return null
        const copy = el.cloneNode(true)
        const typed = el.querySelectorAll('input')
        copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
        copy.querySelectorAll('[hidden]').forEach(block => block.replaceChildren())
        return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').replace(/ style=""/g, '').replace(/ style="[^"]*"( class="[^"]*sheet--closing)/g, '$1').trim()
    }
}
const READ = `(${NORMALIZE.toString()})()`
const read = (page, selectors) => page.evaluate(`(() => { const read = ${READ}; return ${JSON.stringify(selectors)}.map(s => [s, [...document.querySelectorAll(s)].map(read).join('')]) })()`)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.dataset.dock ? '[' + e.dataset.dock + ']' : ''}${!e.id && e.className ? '.' + String(e.className).split(' ').join('.') : ''}` })
const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY))

const browser = await chromium.launch()
const png = (buffer) => PNG.sync.read(buffer)
function pixelsApart(a, b) {
    const one = png(a), two = png(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0
    for (let i = 0; i < one.data.length; i += 4) if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) apart++
    return apart
}

// The Pink Floyd scan of the prototype's capture (design/proposals/f79-home/build/capture.json), plus a few of each other type
const capture = JSON.parse(fs.readFileSync('design/proposals/f79-home/build/capture.json', 'utf8'))
const FIXTURE = capture.albums.map((a) => ({ id: a.id, title: a.title, artist: 'Pink Floyd', year: a.year, releaseDate: `${a.year}-06-01`, type: 'Album', coverUrl: a.cover.replace('300x300bb', '{w}x{h}bb') }))
;[['Single', 15], ['Live', 5], ['Compilation', 15]].forEach(([k, n]) => { for (let j = 0; j < n; j += 1) FIXTURE.push({ id: `x-${k}-${j}`, title: `${k} ${j + 1}`, artist: 'Pink Floyd', year: '2000', releaseDate: '2000-01-01', type: k, coverUrl: null }) })
const FOUR = [0, 2, 3, 5].map((i) => FIXTURE[i].id)
const PASTE = 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk'

async function open(base, width) {
    const phone = width < 768
    const context = await browser.newContext({ viewport: { width, height: phone ? 852 : 900 }, hasTouch: phone, isMobile: phone })
    const page = await context.newPage()
    const errors = []
    const blocked = []
    await page.route(BLOCKED, (route) => { blocked.push(route.request().url().slice(0, 60)); return route.abort() })
    // the covers of the catalog (Apple's image host) are answered with a plain picture: the same bytes on both sides
    await page.route(/mzstatic\.com/, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|api\/|ERR_|identitytoolkit|auth\//i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    if (process.env.NO_TRANSITIONS) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    const started = Date.now()
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => window.controller && window.controller.picker && document.querySelector('#homeStage'), null, { timeout: 40000 })
    const shown = Date.now() - started
    await page.evaluate(`(async () => {
      const c = window.controller, list = ${JSON.stringify(FIXTURE)};
      c.picker.service = { scanArtist: async (q) => (/floydd/i.test(q) ? { albums: [], reclassified: null } : { albums: list, reclassified: null }) };
      c.albumSearchService = { search: async (artist, title) => (/Pinkk$/.test(title) ? [] : [{ id: 'x-' + title, title, artist, year: 1976, coverUrl: null }]) };
      c.writeSeries = async () => ({ id: 'proof-only-not-saved' });
      window.__guest = (on) => { c.state.guest = on; c.redraw(); };
      window.__guest(false);
      window.__search = (q) => { document.querySelector('#artistScanInput').value = q; return c.search(q); };
    })()`)
    await page.waitForTimeout(900)
    return { context, page, errors, blocked, phone, width, shown }
}

const SELECTORS = ['#app', '.sheet:not(.sheet--closing)']

/** Runs one step on both sides and compares: the page, where the focus is, and the screenshot. */
async function step(label, sides, action, { shot = true, extra = null, wait = 500, selectors = SELECTORS } = {}) {
    const taken = []
    for (const side of sides) {
        await action(side.page, side)
        await side.page.waitForTimeout(wait)
        taken.push({ dom: await read(side.page, selectors), focus: await focusNow(side.page), extra: extra ? await extra(side.page) : null, shot: shot ? await side.page.screenshot() : null })
    }
    const [before, after] = taken
    const domOk = JSON.stringify(before.dom) === JSON.stringify(after.dom)
    note(`${label} · the page`, domOk, domOk ? '' : `differs in ${before.dom.map(([s, v], i) => (v !== after.dom[i][1] ? s : null)).filter(Boolean).join(', ')}`)
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

const both = async (width) => [await open(oldBase, width), await open(process.env.OLD_AGAINST_OLD ? oldBase : newBase, width)]
const close = async (sides) => { for (const s of sides) await s.context.close() }
const noErrors = (sides, what) => note(`${what} · no error of the page on either side`, sides.every(s => s.errors.length === 0), sides.map((s, i) => `${i ? 'new' : 'old'}: ${s.errors.join(' | ')}`).join(' // '))
const eachPage = (fn) => (page) => page.evaluate(fn)
const search = (q = 'Pink Floyd') => (page) => page.evaluate((text) => window.__search(text), q)
const pickFour = (page) => page.evaluate((ids) => ids.forEach((i) => window.controller.clickCard(i)), FOUR)

for (const width of [1280, 393]) {
    const phone = width < 768
    const sides = await both(width)
    const tag = `${phone ? 'P' : 'A'} ${width}`
    await step(`${tag} · first visit`, sides, async () => {})
    await step(`${tag} · typing: the hint points to Enter (real keys)`, sides, async (page) => { await page.click('#artistScanInput'); await page.keyboard.type('Pink Fl') })
    await step(`${tag} · searching (the catalog held back)`, sides, (page) => page.evaluate(() => { window.controller.picker.service = { scanArtist: () => new Promise(() => {}) }; window.__search('Pink Floyd') }))
    await close(sides)
}

for (const width of [1280, 393]) {
    const phone = width < 768
    const sides = await both(width)
    const tag = `${phone ? 'P' : 'A'} ${width}`
    const press = phone ? (page, selector) => page.tap(selector) : (page, selector) => page.click(selector)
    await step(`${tag} · the discography`, sides, search())
    await step(`${tag} · a filter pressed (EPs and Singles on)`, sides, async (page) => { await press(page, '#btnFilterEPs'); await press(page, '#btnFilterSingles') })
    await step(`${tag} · …and off`, sides, async (page) => { await press(page, '#btnFilterEPs'); await press(page, '#btnFilterSingles') })
    await step(`${tag} · a cover pressed: the ring, the number, the dock`, sides, (page) => press(page, `#discographyGrid [data-id="${FOUR[0]}"]`))
    await step(`${tag} · three more covers`, sides, async (page) => { for (const id of FOUR.slice(1)) await press(page, `#discographyGrid [data-id="${id}"]`) })
    await step(`${tag} · a cover taken out: Undo`, sides, (page) => press(page, `#discographyGrid [data-id="${FOUR[1]}"]`))
    await step(`${tag} · Undo pressed`, sides, (page) => press(page, '[data-dock="undo"]'))
    await step(`${tag} · «Add all»`, sides, (page) => press(page, '#btnAddAll'))
    await step(`${tag} · Undo of «Add all»`, sides, (page) => press(page, '[data-dock="undo"]'))
    if (!phone) {
        await step(`${tag} · Edit order: the panel`, sides, (page) => press(page, '#btnEditOrder'))
        await step(`${tag} · a row moved up (real click)`, sides, (page) => press(page, '.home-rows li:nth-child(3) .home-rbtn__up'))
        await step(`${tag} · the next Tab after a move (the focus kept by the dock)`, sides, (page) => page.keyboard.press('Tab'))
        await step(`${tag} · a row removed`, sides, (page) => press(page, '.home-rows li:nth-child(2) .home-rbtn__remove'))
        await step(`${tag} · Done`, sides, (page) => press(page, '[data-dock="close"]'))
        await step(`${tag} · the name typed with real keys`, sides, async (page) => { await page.click('#seriesNameInput'); await page.keyboard.press('Control+A'); await page.keyboard.type('Late nights') })
        await step(`${tag} · the name emptied, «Create series»: it asks for a name, focus on the field`, sides, async (page) => { await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.keyboard.press('Enter') })
        await step(`${tag} · «Use …»`, sides, (page) => press(page, '[data-dock="use-name"]'))
    } else {
        await step(`${tag} · the bar is tapped: the sheet`, sides, (page) => press(page, '.home-dock__open'))
        await step(`${tag} · a row moved down in the sheet`, sides, (page) => press(page, '#homeSeriesSheet .home-rows li:nth-child(1) .home-rbtn__down'))
        await step(`${tag} · a row removed in the sheet: Undo is in the sheet`, sides, (page) => press(page, '#homeSeriesSheet .home-rows li:nth-child(2) .home-rbtn__remove'))
        await step(`${tag} · the name typed in the sheet with real keys`, sides, async (page) => { await page.tap('#homeChosenName'); await page.keyboard.press('Control+A'); await page.keyboard.type('Late nights') })
        await step(`${tag} · the sheet closed`, sides, (page) => press(page, '#homeSeriesSheet .sheet__close'), { wait: 700 })
    }
    await step(`${tag} · creating (the writing held back)`, sides, (page) => page.evaluate(() => { window.controller.writeSeries = () => new Promise(() => {}); window.controller.createSeries() }))
    await close(sides)
}

for (const width of [1280, 393]) {
    const phone = width < 768
    const sides = await both(width)
    const tag = `${phone ? 'P' : 'A'} ${width}`
    await step(`${tag} · created`, sides, async (page) => { await search()(page); await pickFour(page); await page.evaluate(() => window.controller.createSeries()) })
    await step(`${tag} · another series started`, sides, (page) => page.evaluate(() => window.controller.startAnother()))
    await step(`${tag} · the series not saved`, sides, async (page) => { await pickFour(page); await page.evaluate(() => { window.controller.writeSeries = async () => { throw Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }) }; return window.controller.createSeries() }) })
    await step(`${tag} · artist not found`, sides, async (page) => { await page.evaluate(() => window.__search('Pink Floydd Qxz')) })
    await step(`${tag} · the catalog did not answer`, sides, async (page) => { await page.evaluate(() => { window.controller.picker.service = { scanArtist: async () => { throw Object.assign(new Error('deadline'), { code: 'deadline' }) } }; return window.__search('Pink Floyd') }) })
    await step(`${tag} · the list`, sides, (page) => page.evaluate((text) => window.controller.setMode('paste', text), PASTE))
    await step(`${tag} · the list added: a line left to fix`, sides, (page) => page.evaluate(() => window.controller.addPastedList(window.controller.view.pasteList.value())))
    await step(`${tag} · a visitor`, sides, (page) => page.evaluate(() => window.__guest(true)))
    noErrors(sides, tag)
    await close(sides)
}

// the speed of the first screen: the time from the request to the stage on the page, three loads each (a dev server: the numbers are a comparison, not a measure of production)
{
    const times = { old: [], new: [] }
    for (let i = 0; i < 3; i += 1) {
        for (const [name, base] of [['old', oldBase], ['new', process.env.OLD_AGAINST_OLD ? oldBase : newBase]]) {
            const s = await open(base, 1280)
            times[name].push(s.shown)
            await s.context.close()
        }
    }
    note('time to the stage, ms (old / new, three loads each, dev server)', true, JSON.stringify(times))
}

await browser.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'raw', `browser-proof-results${TAG}.json`), JSON.stringify({ oldBase, newBase, firebaseBlocked: BLOCKED.source, passed: results.length - failed.length, failed: failed.length, results, pixels }, null, 2))
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed of ${results.length}; max pixels apart ${Math.max(0, ...pixels.map(p => p.apart))}`)
process.exit(0)
