// F83 wave 5b, the browser proof of the windows of the albums screen (edit a series with its album picker, delete a series, rank the tracks).
// Run from the repo root with two servers up (dev servers, or `vite preview` of two builds):
//
//   node reports/evidence/F83/wave-5b/browser-proof.mjs <the windows as they were: the tree before the wave> <the windows as they are>
//
// The albums are put in the stores (what the answers of Apple Music would have made), and what is OUTSIDE the windows is replaced in the page, on
// both sides alike, by stand-ins that write down every call (window.__calls): the catalog scan (`albumSearchService.scanArtist`), the series
// service (`updateSeries`, `deleteSeries`, `countSavedPlaylists`: the prototype, so the real service object is still the one the windows reach) and
// the ranking REPOSITORY (`userRankingRepository.saveRanking`), so the ranking goes the whole way a real one goes (window, screen, controller,
// ranking service) and stops at the repository, where what would be written to the person's own data is compared old against new. The real
// catalog (MusicKit needs the developer token of the server and the catalog of Apple) is NOT exercised. Firebase Auth and Firestore are BLOCKED
// (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations are aborted before the page loads).
// The same steps are driven on both pages at 1280 (a mouse: the drag is a real press, move and release) and 393 (a touch screen: taps, and the drag
// by CDP touch events, by the handle and off the handle); after each step the windows over the page are compared as in the unit proof (elements,
// attributes, the classes as a set), where the focus is, the calls, the order of the rows of the ranking, and a screenshot of the window of each side
// pixel by pixel. RESULT_TAG, NO_TRANSITIONS=1, OLD_AGAINST_OLD=1 (both sides the old one) are the controls of waves 2 to 5a.
// ENGINE=webkit: the engine of Safari with the profile of an iPhone for the phone, on the BUILT site (no CDP there: the drag by touch is not done in WebKit).
import { chromium, webkit, devices } from '@playwright/test'
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
const WEBKIT = process.env.ENGINE === 'webkit'
const BUILT = process.env.BUILT === '1' // the built site: modules are bundled, so the stand-ins are put in by the page's own globals (see STUBS)

const results = []
const pixels = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 500) : ''}`) }

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
        // the drag library leaves `draggable="false"` on a row it touched; the old list was made again at some moments (a Reset, a move by a button), a row of React is kept: not a difference a person sees
        copy.querySelectorAll('[draggable]').forEach(row => row.removeAttribute('draggable'))
        const typed = el.querySelectorAll('input')
        copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
        return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').replace(/ style=""/g, '').replace(/ style="[^"]*"( class="[^"]*sheet--closing)/g, '$1').trim()
    }
}
const READ = `(${NORMALIZE.toString()})()`
const LAYERS = ['.app-modal', '.rank-window', '.sheet:not(.sheet--closing)', '.rank-toast']
const read = (page, selectors) => page.evaluate(`(() => { const read = ${READ}; return ${JSON.stringify(selectors)}.map(s => [s, [...document.querySelectorAll(s)].map(read).join('')]) })()`)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].join('.')}${e.dataset.id ? '[' + e.dataset.id + ']' : ''}` })
/** The words of the notices of the app (a toast is in the middle of its slide when the page is read, so only its words are compared). */
const toastsNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('#toast-container .toast')].map(e => e.textContent.trim())))
const callsNow = (page) => page.evaluate(() => JSON.stringify(window.__calls || []))
const rowsNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('#rank-track-list [data-track-id]')].map(e => [e.dataset.trackId, e.querySelector('[data-role="rank-number"]')?.textContent])))
const scrollNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('.rank-phone__body, #rank-track-list')].map(e => e.scrollTop)))

const browser = await (WEBKIT ? webkit : chromium).launch()
const WIDTHS = (process.env.WIDTHS || '1280,393').split(',').map(Number)
let lastBox = ''
function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, delta = 0
    for (let i = 0; i < one.data.length; i += 4) {
        if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) {
            apart++
            delta = Math.max(delta, Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
            const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width)
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
        }
    }
    lastBox = apart ? `box x ${x0}-${x1}, y ${y0}-${y1}, largest difference ${delta} of 255` : ''
    return apart
}

/** What the page puts in the stores, as the answers of Apple Music would have made it: five series (one of 14 albums, one failed). */
const WORLD = `(async () => {
  const names = ['The Wall', 'Animals', 'Meddle', 'Obscured by Clouds', 'Houses of the Holy', 'Physical Graffiti', 'Presence', 'Machine Head', 'In Rock', 'Fireball']
  const make = (sid, j, artist, title) => ({ id: sid + '-' + j, title, artist, year: String(1970 + j), releaseDate: (1970 + j) + '-01-01', type: 'Album', coverUrl: 'https://is1-ssl.mzstatic.com/image/' + sid + '-' + j + '.jpg',
    tracks: ['Speak to Me', 'Breathe', 'Time', 'Money', 'Us and Them', 'Eclipse'].map((t, i) => ({ title: t, position: i + 1, duration: 200 + i * 20, rank: i % 2 ? undefined : i + 1, spotifyRank: i % 3 ? undefined : i + 2, userRank: j === 0 && i === 2 ? 1 : undefined })),
    hasUserRanking: j % 3 === 0, bestEverAlbumId: j % 2 === 0 ? String(100 + j) : null, spotifyId: j % 4 === 0 ? 'sp' + j : null, seriesIds: [sid],
    getTracks: (kind) => ['Speak to Me', 'Breathe', 'Time', 'Money', 'Us and Them', 'Eclipse'].map((t, i) => kind === 'acclaim' ? { title: t, rank: i + 1, rating: 90 - i } : { title: t, position: i + 1, duration: 200 + i * 20, userRank: j === 0 && i === 2 ? 1 : undefined }) })
  const spec = [['s0', 'Floyd', 'Pink Floyd', 4], ['s1', 'Zeppelin', 'Led Zeppelin', 3], ['s2', 'Big', 'Big Band', 14]]
  const series = spec.map(([id, name, artist, count], i) => ({ id, name: name + (id === 's0' ? ' &amp; Co' : ''), createdAt: new Date(2026, 0, 10 - i), albumQueries: Array.from({ length: count }, (_, j) => ({ artist, title: id === 's2' ? 'Big Album ' + (j + 1) : names[(j + i) % names.length] })) }))
  window.albumLoadService.load = () => {}
  window.albumLoadService.refreshSource = () => {}
  window.albumSeriesStore.setSeries(series)
  window.albumLoadStore.setSeriesOrder(series.map(s => s.id))
  const all = []
  series.forEach((s) => {
    window.albumLoadStore.setSeriesEntries(s.id, s.albumQueries.map((q, j) => {
      const key = (q.artist + ' - ' + q.title).toLowerCase()
      const album = make(s.id, j, q.artist, q.title); all.push(album)
      return { key, seriesId: s.id, query: q, status: 'found', error: null, album, enrichment: { acclaim: 'done', popularity: 'empty', userRanking: 'not-connected' } }
    }))
  })
  window.albumsStore.setAlbumsBySeries({ ALL_SERIES_VIEW: all })
  window.albumLoadStore.flush()
})()`

/** What is outside the windows, replaced alike on both sides (the dev servers serve the modules by their paths, so the page reaches the very objects the windows use). */
const STUBS = `(async () => {
  window.__calls = []
  const note = (...a) => window.__calls.push(a)
  const A = (title, type = 'Album', date = '2015-03-15') => ({ id: 'id-' + title, title, artist: 'Kendrick Lamar', year: date.slice(0, 4), type, releaseDate: date, coverUrl: 'https://is1-ssl.mzstatic.com/image/{w}x{h}.jpg' })
  const search = await import('/js/services/album-search/AlbumSearchService.js')
  search.albumSearchService.scanArtist = async (text) => { note('scanArtist', text); return { albums: [A('good kid, m.A.A.d city (Deluxe Version)', 'Album', '2012-10-22'), A('To Pimp a Butterfly'), A('The Heart Part 5 - Single', 'Single', '2022-05-08'), A('Black Panther: The Album', 'Compilation', '2018-02-09'), A('DAMN.', 'Album', '2017-04-14')], reclassified: null } }
  const svc = await import('/js/services/SeriesService.js')
  svc.SeriesService.prototype.updateSeries = async function (id, data) { note('updateSeries', id, JSON.stringify(data)); if (window.__fail) throw new Error('write failed') }
  svc.SeriesService.prototype.deleteSeries = async function (id) { note('deleteSeries', id) }
  svc.SeriesService.prototype.countSavedPlaylists = async function (id) { note('countSavedPlaylists', id); return { playlists: 2, batches: 1 } }
  const repo = await import('/js/repositories/userRankings.js')
  repo.userRankingRepository.saveRanking = async (userId, albumId, data) => { note('repository.saveRanking', userId, albumId, JSON.stringify(data)); return true }
  repo.userRankingRepository.getAllRankings = async () => []
  window.albumSeriesStore.setDb({ stub: true })
  window.albumSeriesStore.setUserId('u1')
})()`

async function open(base, width) {
    const phone = width < 768
    const context = await browser.newContext(WEBKIT && phone ? { ...devices['iPhone 14 Pro'] } : { viewport: { width, height: phone ? 852 : 900 }, hasTouch: phone, isMobile: phone })
    const page = await context.newPage()
    const errors = []
    const blocked = []
    await page.route(BLOCKED, (route) => { blocked.push(route.request().url().slice(0, 60)); return route.abort() })
    await page.route(/mzstatic\.com/, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|api\/|ERR_|identitytoolkit|auth\/|Failed to load series data|Update failed|Could not count/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    if (process.env.NO_TRANSITIONS) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    await page.addInitScript(() => { try { localStorage.setItem('albumsPageSize', '10') } catch { /* none */ } })
    if (process.env.DEBUG_FOCUS) await page.addInitScript(() => { window.__focusLog = []; const d = (e) => (e ? e.tagName + '.' + String(e.dataset?.action || e.className).slice(0, 30) : 'null'); document.addEventListener('DOMContentLoaded', () => { document.addEventListener('focusin', (e) => window.__focusLog.push('in ' + d(e.target)), true); document.addEventListener('focusout', (e) => window.__focusLog.push('out ' + d(e.target) + ' -> ' + d(e.relatedTarget)), true) }) })
    await page.goto(base + '/albums', { waitUntil: 'load' })
    await page.waitForFunction(() => window.albumLoadService && window.albumLoadStore && window.albumSeriesStore && window.albumsStore && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
    await page.waitForTimeout(1200)
    await page.evaluate(WORLD)
    await page.waitForTimeout(700)
    if (!BUILT) await page.evaluate(STUBS)
    await page.waitForTimeout(1800) // the controller draws the screen again some time after the user id is set: let it finish before the first press
    return { context, page, errors, blocked, phone, width }
}

/** The window of a side, as a picture (the page under it carries the known noise of the top bar and the footer clock, so only the window is compared). */
const WINDOW_SHOT = ['.app-modal__panel', '.rank-phone', '.rank-window > div', '.sheet__panel']
async function shotOfWindow(page) {
    for (const selector of WINDOW_SHOT) {
        const handle = page.locator(selector).last()
        if (await handle.count()) { try { return await handle.screenshot() } catch { return null } }
    }
    return null
}

/** Runs one step on both sides and compares: the windows, where the focus is, the calls to what is outside, the rows of the ranking, the picture. */
async function step(label, sides, action, { shot = true, wait = Number(process.env.WAIT_MS) || 450 } = {}) {
    const taken = []
    for (const side of sides) {
        await action(side.page, side)
        await side.page.waitForTimeout(wait)
        if (process.env.DEBUG_FOCUS) console.log('  focus log', JSON.stringify(await side.page.evaluate(() => window.__focusLog.splice(0))))
        taken.push({ dom: await read(side.page, LAYERS), focus: await focusNow(side.page), calls: await callsNow(side.page), toasts: await toastsNow(side.page), rows: await rowsNow(side.page), scroll: await scrollNow(side.page), shot: shot ? await shotOfWindow(side.page) : null })
    }
    const [before, after] = taken
    const domOk = JSON.stringify(before.dom) === JSON.stringify(after.dom)
    const where = (one, two) => { let i = 0; while (i < one.length && one[i] === two[i]) i++; return `old …${one.slice(Math.max(0, i - 60), i + 120)} // new …${two.slice(Math.max(0, i - 60), i + 120)}` }
    note(`${label} · the windows`, domOk, domOk ? '' : `differs in ${before.dom.map(([s, v], i) => (v !== after.dom[i][1] ? s + ' ' + where(v, after.dom[i][1]) : null)).filter(Boolean).join(', ')}`)
    note(`${label} · focus`, before.focus === after.focus, `${before.focus} / ${after.focus}`)
    note(`${label} · the calls to what is outside`, before.calls === after.calls, before.calls === after.calls ? '' : `old ${before.calls.slice(-300)} // new ${after.calls.slice(-300)}`)
    note(`${label} · the notices of the app`, before.toasts === after.toasts, before.toasts === after.toasts ? '' : `old ${before.toasts} // new ${after.toasts}`)
    note(`${label} · the rows of the ranking`, before.rows === after.rows, before.rows === after.rows ? (before.rows === '[]' ? '' : `both ${before.rows}`) : `old ${before.rows} // new ${after.rows}`)
    if (shot && before.shot && after.shot) {
        const apart = pixelsApart(before.shot, after.shot)
        const name = label.replace(/\W+/g, '_').slice(0, 80)
        fs.writeFileSync(path.join(CAPTURES, `${name}.old.png`), before.shot)
        fs.writeFileSync(path.join(CAPTURES, `${name}.new.png`), after.shot)
        pixels.push({ label, apart })
        note(`${label} · pixels of the window`, apart === 0, apart === Infinity ? 'different sizes' : `${apart} px apart${lastBox ? ' · ' + lastBox : ''}`)
    }
    if (process.env.STOP_AFTER && label.endsWith(process.env.STOP_AFTER)) { await browser.close(); console.log('stopped after', label); process.exit(0) }
    return taken
}

const both = async (width) => [await open(oldBase, width), await open(process.env.OLD_AGAINST_OLD ? oldBase : newBase, width)]
const close = async (sides) => { for (const s of sides) await s.context.close() }
const noErrors = (sides, what) => note(`${what} · no error of the page on either side`, sides.every(s => s.errors.length === 0), sides.map((s, i) => `${i ? 'new' : 'old'}: ${s.errors.join(' | ')}`).join(' // '))

/** A real drag with the mouse: press on a row, move in steps, release. */
async function mouseDrag(page, fromSelector, fromIndex, toIndex) {
    const rows = page.locator(fromSelector)
    const a = await rows.nth(fromIndex).boundingBox()
    const b = await rows.nth(toIndex).boundingBox()
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    const targetY = b.y + b.height / 2 + (toIndex > fromIndex ? 6 : -6)
    for (let i = 1; i <= 14; i++) await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + ((targetY - (a.y + a.height / 2)) * i) / 14)
    await page.waitForTimeout(200)
    await page.mouse.up()
}

/** A real drag with a finger (CDP touch events): by a point of a row to a point of another. */
async function touchDrag(page, fromBox, toY, { x } = {}) {
    const cdp = await page.context().newCDPSession(page)
    const startX = x ?? fromBox.x + fromBox.width / 2
    const startY = fromBox.y + fromBox.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY }] })
    for (let i = 1; i <= 16; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX, y: startY + ((toY - startY) * i) / 16 }] })
    await page.waitForTimeout(200)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

const tapOrClick = (phone) => (page, selector, options) => (phone ? page.tap(selector, options) : page.click(selector, options))

for (const width of WIDTHS) {
    const phone = width < 768
    const tag = `${phone ? 'P' : 'A'} ${width}`
    const press = tapOrClick(phone)
    const sides = await both(width)
    const openEdit = async (page) => {
        if (!phone) {
            if (process.env.DEBUG_FOCUS) await page.evaluate(() => { window.__btn = document.querySelector('[data-action="edit-series"][data-series-id="s0"]'); new MutationObserver((l) => { for (const m of l) for (const n of m.removedNodes) if (n.contains && n.contains(window.__btn)) window.__focusLog.push('REMOVED ' + n.tagName + '.' + String(n.className).slice(0, 40)) }).observe(document.body, { childList: true, subtree: true }) })
            return page.click('[data-action="edit-series"][data-series-id="s0"]')
        }
        await page.tap('.series-more[data-series-id="s0"]')
        await page.waitForTimeout(500)
        await page.tap('.sheet button:has-text("Edit series")')
    }

    // ----- the window to edit a series
    await step(`${tag} · edit: the window opens`, sides, openEdit)
    if (process.env.ONLY_FIRST) { await close(sides); break }
    await step(`${tag} · edit: Scan with no text (a notice)`, sides, (page) => press(page, '[data-action="scan-artist"]'))
    await step(`${tag} · edit: a filter turned on and off with no results`, sides, async (page) => { await press(page, '[data-album-picker] [data-filter="singles"]'); await press(page, '[data-album-picker] [data-filter="singles"]') })
    if (!BUILT) {
        await step(`${tag} · edit: the artist typed with real keys, Enter scans`, sides, async (page) => { await page.click('[data-album-picker] input'); await page.keyboard.type('kendrick lamar'); await page.keyboard.press('Enter') }, { wait: 700 })
        await step(`${tag} · edit: a filter`, sides, (page) => press(page, '[data-album-picker] [data-filter="singles"]'))
        await step(`${tag} · edit: an album picked`, sides, (page) => press(page, '[data-picker-grid] [data-action="pick-album"]'))
        await step(`${tag} · edit: the same album picked again (a notice)`, sides, (page) => press(page, '[data-picker-grid] [data-action="pick-album"]'))
    }
    await step(`${tag} · edit: the first album taken out`, sides, (page) => press(page, '[data-series-albums] [data-action="remove-album"]'))
    if (phone) {
        await step(`${tag} · edit: an album moved down by a tap`, sides, (page) => page.tap('[data-series-albums] [data-action="move-down"]'))
        await step(`${tag} · edit: an album moved up by a tap`, sides, (page) => page.tap('[data-series-albums] [data-album-row]:nth-child(2) [data-action="move-up"]'))
    }
    await step(`${tag} · edit: the name changed with real keys`, sides, async (page) => { await page.click('#edit-series-modal input[placeholder="Series Name"]'); await page.keyboard.press('End'); await page.keyboard.type(' II') })
    if (BUILT) await step(`${tag} · edit: Save with no database (a visitor): the message, the window stays`, sides, (page) => press(page, '[data-action="save-series"]'), { wait: 700 })
    if (BUILT) await step(`${tag} · edit: Cancel after the refused save`, sides, (page) => press(page, '#edit-series-modal [data-action="close-modal"] >> nth=1'))
    else {
        await step(`${tag} · edit: Save fails (the write is refused): the message, the window stays`, sides, async (page) => { await page.evaluate(() => { window.__fail = true }); await press(page, '[data-action="save-series"]') }, { wait: 700 })
        await step(`${tag} · edit: Save again, it works: closed, the notice`, sides, async (page) => { await page.evaluate(() => { window.__fail = false }); await press(page, '[data-action="save-series"]') }, { wait: 900 })
    }
    await step(`${tag} · edit: opened again, Cancel`, sides, async (page) => { await openEdit(page); await page.waitForTimeout(400); await press(page, '#edit-series-modal [data-action="close-modal"] >> nth=1') })
    await step(`${tag} · edit: opened again, the cross`, sides, async (page) => { await openEdit(page); await page.waitForTimeout(400); await press(page, '#edit-series-modal .app-modal__close') })
    await step(`${tag} · edit: opened again, Escape does nothing (and nothing is lost)`, sides, async (page) => { await openEdit(page); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.click('#edit-series-modal', { position: { x: 4, y: 4 } }) })
    for (const s of sides) await s.page.evaluate(() => document.querySelector('#edit-series-modal')?.remove())

    // ----- the question to delete a series
    const openDelete = async (page) => {
        if (!phone) return page.click('[data-action="delete-series"][data-series-id="s1"]')
        await page.tap('.series-more[data-series-id="s1"]')
        await page.waitForTimeout(500)
        await page.tap('.sheet button:has-text("Delete series")')
    }
    if (BUILT) await step(`${tag} · delete: with no database (a visitor): the notice, no question`, sides, openDelete, { wait: 700 })
    else {
        await step(`${tag} · delete: the question, with the saved playlists said`, sides, openDelete, { wait: 700 })
        await step(`${tag} · delete: Escape is Cancel`, sides, (page) => page.keyboard.press('Escape'))
        await step(`${tag} · delete: asked again and confirmed: the calls, the notice`, sides, async (page) => { await openDelete(page); await page.waitForTimeout(500); await press(page, '#confirm-modal [data-action="confirm"]') }, { wait: 800 })
    }

    // ----- the window to rank the tracks
    const openRank = async (page) => {
        if (!phone) { await page.click('[data-action="rank-album"][data-id="s0-0"]'); return }
        await page.tap('.album-more >> nth=0')
        await page.waitForTimeout(500)
        await page.tap('.sheet button:has-text("Rank the tracks"), .sheet button:has-text("Edit my ranking")')
    }
    await step(`${tag} · rank: the window opens (the saved order first, the rest after)`, sides, openRank, { wait: 700 })
    if (!phone) {
        await step(`${tag} · rank: a track dragged with the mouse, from the bottom to the top`, sides, (page) => mouseDrag(page, '#rank-track-list > div', 5, 0), { wait: 600 })
        await step(`${tag} · rank: a track dragged a little down`, sides, (page) => mouseDrag(page, '#rank-track-list > div', 0, 2), { wait: 600 })
        await step(`${tag} · rank: Reset`, sides, (page) => page.click('.rank-window button:has-text("Reset")'))
        await step(`${tag} · rank: one track moved and the rest left (a partial ranking)`, sides, (page) => mouseDrag(page, '#rank-track-list > div', 3, 1), { wait: 600 })
        await step(`${tag} · rank: Back with a change asks`, sides, (page) => page.click('.rank-window button:has-text("Back")'))
        await step(`${tag} · rank: Escape in the question is Keep editing`, sides, (page) => page.keyboard.press('Escape'))
        await step(`${tag} · rank: Save: ${BUILT ? 'a visitor has no ranking to save: the notice, the window stays' : 'the ranking reaches the repository, the notice, the window closes'}`, sides, (page) => page.click('.rank-window button:has-text("Save")'), { wait: 1000 })
        if (BUILT) await step(`${tag} · rank: Back and Discard`, sides, async (page) => { await page.click('.rank-window button:has-text("Back")'); await page.waitForTimeout(400); await page.click('#confirm-modal [data-action="confirm"]') }, { wait: 700 })
        await step(`${tag} · rank: opened again, Escape with nothing changed closes it`, sides, async (page) => { await openRank(page); await page.waitForTimeout(500); await page.keyboard.press('Escape') })
        await step(`${tag} · rank: opened again, a click outside the window closes it`, sides, async (page) => { await openRank(page); await page.waitForTimeout(500); await page.mouse.click(8, 450) })
    } else {
        const handleBox = (page, index) => page.locator('.rank-row__handle').nth(index).boundingBox()
        const rowBox = (page, index) => page.locator('.rank-row').nth(index).boundingBox()
        if (!WEBKIT) { // the finger's drag goes through CDP touch events, which WebKit does not have
            await step(`${tag} · rank: a track dragged by its handle with a finger, to the top`, sides, async (page) => { const handle = await handleBox(page, 4); const top = await rowBox(page, 0); await touchDrag(page, handle, top.y + 4) }, { wait: 700 })
            await step(`${tag} · rank: a finger moved over the text of a row, off the handle: the order does not change`, sides, async (page) => { const row = await page.locator('.rank-row__pick').nth(2).boundingBox(); const to = await rowBox(page, 0); await touchDrag(page, row, to.y + 4, { x: row.x + 40 }) }, { wait: 700 })
        }
        await step(`${tag} · rank: a track picked`, sides, (page) => page.tap('.rank-row__pick >> nth=3'))
        await step(`${tag} · rank: Up`, sides, (page) => page.tap('.rank-phone__mover [aria-label="Move up"]'))
        await step(`${tag} · rank: Move to… (the sheet)`, sides, (page) => page.tap('.rank-phone__mover button:has-text("Move to")'), { wait: 700 })
        await step(`${tag} · rank: a number chosen in the sheet`, sides, (page) => page.tap('.rank-moveto__number >> nth=0'), { wait: 700 })
        await step(`${tag} · rank: Done`, sides, (page) => page.tap('.rank-phone__mover button:has-text("Done")'))
        await step(`${tag} · rank: Reset, the notice with Undo`, sides, (page) => page.tap('.rank-phone__reset'))
        await step(`${tag} · rank: Undo`, sides, (page) => page.tap('.rank-toast__action'))
        await step(`${tag} · rank: Back with a change asks (the sheet)`, sides, (page) => page.tap('.rank-phone__back'), { wait: 700 })
        await step(`${tag} · rank: Keep editing`, sides, (page) => page.tap('.rank-discard__keep'), { wait: 700 })
        await step(`${tag} · rank: Save: ${BUILT ? 'a visitor has no ranking to save: the notice, the window stays' : 'the ranking reaches the repository, the window closes'}`, sides, (page) => page.tap('.rank-phone__save'), { wait: 1000 })
        if (BUILT) await step(`${tag} · rank: Back and Discard`, sides, async (page) => { await page.tap('.rank-phone__back'); await page.waitForTimeout(500); await page.tap('.rank-discard__discard') }, { wait: 900 })
        await step(`${tag} · rank: opened again, Back with nothing changed closes it`, sides, async (page) => { await openRank(page); await page.waitForTimeout(500); await page.tap('.rank-phone__back') })
    }
    noErrors(sides, tag)
    await close(sides)
}

await browser.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'raw', `browser-proof-results${TAG}.json`), JSON.stringify({ oldBase, newBase, engine: WEBKIT ? 'webkit' : 'chromium', firebaseBlocked: BLOCKED.source, passed: results.length - failed.length, failed: failed.length, results, maxPixelsApart: Math.max(0, ...pixels.map(p => p.apart)) }, null, 1))
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed of ${results.length}; max pixels apart ${Math.max(0, ...pixels.map(p => p.apart))}`)
process.exit(0)
