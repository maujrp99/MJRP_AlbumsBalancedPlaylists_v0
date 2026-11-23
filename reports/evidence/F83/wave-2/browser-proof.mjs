// F83 wave 2, the browser proof of the playlists screen. Run from the repo root with two dev servers up:
//
//   node reports/evidence/F83/wave-2/browser-proof.mjs <the screen as it was: dev server on the parent of the wave's code commit> \
//        <the screen as it is: dev server of this branch>
//
// Signed out; the set of playlists is put in the store in the page (the existing seam: `playlistsStore` and the service are modules of the
// app; a save is replaced by a flag, so nothing is written to the database and nothing is read from it). The same steps are driven on
// both screens, at 1280 (a mouse) and at 393 (a touch screen), with real clicks, real keystrokes, a real mouse drag and a real touch
// drag (Input.dispatchTouchEvent). After each step #app (and what opens over the page) is compared, with the white space collapsed and
// attributes as in the unit proof, and a screenshot of each is compared pixel by pixel (the clock of the foot is frozen). After each
// drag the order of the tracks in the store is compared too, and on the new screen the page is checked against the store (React
// must hold the page it wrote). Then five visits to the screen and away: nothing left behind.
//
// It signs in nowhere, writes nothing, reads nothing from the database. Results: raw/browser-proof-results.json, captures/.
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
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }

/** What a piece of the page says, ready to compare: the function of test/support/savedPlaylistsScenarios.js (run in the page, on a copy). */
const NORMALIZE = () => {
    const fingerprint = (text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }
    const value = (el, name, v) => (name === 'style' ? el.style.cssText : name === 'class' ? v.split(/\s+/).filter(Boolean).sort().join(' ') : v)
    const attrs = (el) => [...el.attributes].map(({ name, value: v }) => [name, value(el, name, v)]).sort(([a], [b]) => a.localeCompare(b)).map(([n, v]) => ` ${n}="${v}"`).join('')
    const describe = (node) => {
        if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        const whole = `<${tag}${attrs(node)}>${[...node.childNodes].map(describe).join('')}</${tag}>`
        return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole)}"/>` : whole
    }
    return (el) => {
        if (!el) return null
        const copy = el.cloneNode(true)
        const live = el.querySelectorAll('input'); copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', live[i].value))
        return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').replace(/\bis-moved ?/g, '').replace(/ style=""/g, '').replace(/ draggable="false"/g, '').replace(/ style="[^"]*"( class="[^"]*sheet--closing)/g, '$1').trim()
    }
}
const READ = `(${NORMALIZE.toString()})()`

const browser = await chromium.launch()

const png = (buffer) => PNG.sync.read(buffer)
function pixelsApart(a, b) {
    const one = png(a), two = png(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0
    for (let i = 0; i < one.data.length; i += 4) if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) apart++
    return apart
}

const GENERATED = () => {
    const track = (title, artist, album, duration, extra = {}) => ({ id: `t-${title}`, title, artist, album, duration, ...extra })
    const meta = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' }
    return [
        { id: 'p1', name: 'Playlist 1', title: 'Greatest Hits', batchName: '', _meta: { ...meta }, tracks: [
            track('Kashmir', 'Led Zeppelin', 'Physical Graffiti', 510, { rank: 1, rating: 94, spotifyRank: 2 }),
            track('Ramble On', 'Led Zeppelin', 'Led Zeppelin II', 275, { rank: 7, rating: 88, spotifyPopularity: 71 }),
            track('Time', 'Pink Floyd', 'The Dark Side of the Moon', 413, { spotifyRank: 5 }),
            track('Money', 'Pink Floyd', 'The Dark Side of the Moon', 382),
            track('Us and Them', 'Pink Floyd', 'The Dark Side of the Moon', 469)
        ] },
        { id: 'p2', name: 'Playlist 2', batchName: '', _meta: { ...meta, rankingId: 'spotify' }, tracks: [
            track('Gone Gone Gone', 'Plant & Krauss', 'Raising Sand', 200, { rank: 12 }),
            track('Rich Woman', 'Plant & Krauss', 'Raising Sand', 190),
            track('Polly Come Home', 'Plant & Krauss', 'Raising Sand', 250)
        ] },
        { id: 'p3', name: 'Playlist 3', batchName: '', _meta: { ...meta }, tracks: [] }
    ]
}

async function open(base, width) {
    const phone = width < 768
    const context = await browser.newContext({ viewport: { width, height: phone ? 852 : 900 }, hasTouch: phone, isMobile: phone })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message.slice(0, 200)))
    page.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    await page.addInitScript(() => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM' })
    // NO_TRANSITIONS=1: the control run that tells a difference of drawing from a difference of transitions (the new screen keeps a button
    // and lets it fade between states; the old one drew it anew)
    if (process.env.NO_TRANSITIONS) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 30000 })
    return { context, page, errors, phone }
}

/** The set of the blend is put in the store, as the blend leaves it; a save is a flag. */
async function stage(base, width, { go = true } = {}) {
    const s = await open(base, width)
    await s.page.addScriptTag({ content: `window.__generated = ${GENERATED.toString()}` })
    await s.page.evaluate(async () => {
        const { getPlaylistsService } = await import('/js/services/playlists/playlistsWiring.js')
        const service = getPlaylistsService()
        service.saveCurrentBatch = async () => { window.__wrote = 'save' }
        service.initializeWithPlaylists(window.__generated(), null)
        window.__service = service
    })
    if (go) {
        await s.page.evaluate(() => window.router.navigate('/playlists'))
        await s.page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
        await s.page.waitForTimeout(800)
    }
    return s
}

const orderOf = (page) => page.evaluate(async () => (await import('/js/stores/playlists.js')).playlistsStore.getPlaylists().map(p => (p.tracks || []).map(t => t.title)))
/** What the page shows of the tracks: the titles of the rows, per list. */
const shownOrder = (page) => page.evaluate(() => [...document.querySelectorAll('.playlist-card, .phone-pl')].map(box => [...box.querySelectorAll('.track-row')].map(row => (row.querySelector('.font-medium, .phone-track__title') || {}).textContent)))

async function overlays(page) {
    return page.evaluate(`(() => { const read = (${NORMALIZE.toString()})(); return ['.sheet:not(.sheet--closing)', '.phone-undo', '.app-modal', '.modal-overlay'].map(s => [s, read(document.querySelector(s))]) })()`)
}

async function mouseDrag(page, from, to, below = true) {
    const a = await page.locator(from).first().boundingBox()
    const b = await page.locator(to).first().boundingBox()
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(a.x + a.width / 2 + 5, a.y + a.height / 2 + 5, { steps: 3 })
    await page.mouse.move(b.x + b.width / 2, b.y + (below ? b.height * 0.8 : b.height * 0.2), { steps: 14 })
    await page.waitForTimeout(250)
    await page.mouse.up()
    await page.waitForTimeout(500)
}

/** A finger: touch down on the handle, hold longer than the 100 ms of the delay, drag, lift. */
async function touchDrag(context, page, from, to, below = true) {
    const cdp = await context.newCDPSession(page)
    const a = await page.locator(from).first().boundingBox()
    const b = await page.locator(to).first().boundingBox()
    const point = (x, y) => [{ x, y, id: 1 }]
    const ax = a.x + a.width / 2, ay = a.y + a.height / 2
    const bx = b.x + b.width / 2, by = b.y + (below ? b.height * 0.8 : b.height * 0.2)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(ax, ay) })
    await page.waitForTimeout(220)
    const steps = 16
    for (let i = 1; i <= steps; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(ax + (bx - ax) * i / steps, ay + (by - ay) * i / steps) })
        await page.waitForTimeout(25)
    }
    await page.waitForTimeout(200)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(600)
    await cdp.detach()
}

const ROW = (list, n) => `.playlist-card[data-playlist-index="${list}"] .track-row:nth-child(${n})`
const PROW = (n) => `.phone-pl .track-row:nth-child(${n}) .phone-track__pos`

const STEPS = {
    1280: [
        ['the set from the blend', async () => {}],
        ['real keystrokes in the batch name: the field keeps the focus and the grid has the name', async (p, ctx) => {
            await p.click('#batchNameInput'); await p.keyboard.type('Road trip', { delay: 40 })
            ctx.field = await p.evaluate(() => ({ focused: document.activeElement?.id === 'batchNameInput', value: document.getElementById('batchNameInput').value, prefix: document.querySelector('.playlist-title-prefix').textContent }))
        }],
        ['the panel to generate again, open (real click)', (p) => p.click('[data-action="toggle-regenerate-panel"]')],
        ['the panel closed again', (p) => p.click('[data-action="toggle-regenerate-panel"]')],
        ['MOUSE DRAG: a track down inside its playlist', async (p, ctx) => { await mouseDrag(p, ROW(0, 1), ROW(0, 3)); ctx.order = await orderOf(p); ctx.shown = await shownOrder(p) }],
        ['MOUSE DRAG: a track to another playlist', async (p, ctx) => { await mouseDrag(p, ROW(0, 2), ROW(1, 2)); ctx.order = await orderOf(p); ctx.shown = await shownOrder(p) }],
        ['MOUSE DRAG: a track into the empty playlist', async (p, ctx) => { await mouseDrag(p, ROW(1, 1), '.playlist-card[data-playlist-index="2"] .playlist-tracks'); ctx.order = await orderOf(p); ctx.shown = await shownOrder(p) }],
        ['undo (real click): the drag is taken back', (p) => p.click('[data-action="undo-edit"]')],
        ['redo', (p) => p.click('[data-action="redo-edit"]')],
        ['a track removed (hover, then the X)', async (p) => { await p.hover(ROW(0, 1)); await p.click(`${ROW(0, 1)} [data-action="remove-track"]`) }],
        ['the title of a playlist typed over (real keystrokes, Enter)', async (p) => {
            await p.click('.playlist-card[data-playlist-index="1"] .playlist-name'); await p.keyboard.press('Control+A'); await p.keyboard.type('Best of Plant', { delay: 30 }); await p.keyboard.press('Enter')
        }],
        ['a playlist deleted', (p) => p.click('.playlist-card[data-playlist-index="2"] [data-action="delete-playlist"]')],
        ['the Spotify window (real click)', async (p) => { await p.click('#exportSpotifyBtn'); await p.waitForTimeout(900) }]
    ],
    393: [
        ['the set from the blend, on the phone', async () => {}],
        ['another chip', (p) => p.click('.phone-pl-chip:nth-child(2)')],
        ['back to the first', (p) => p.click('.phone-pl-chip:nth-child(1)')],
        ['the sheet of a track (real tap on ⋯)', async (p) => { await p.tap('.phone-track:nth-child(2) .phone-more'); await p.waitForTimeout(450) }],
        ['move down by the sheet: the notice with Undo', async (p) => { await p.tap('.sheet .phone-sheet-action:nth-child(2)'); await p.waitForTimeout(700) }],
        ['the notice taken back', async (p) => { await p.tap('.phone-undo__btn'); await p.waitForTimeout(500) }],
        ['TOUCH DRAG: a track by its position handle, inside its playlist', async (p, ctx) => { await touchDrag(p.context(), p, PROW(1), PROW(4)); ctx.order = await orderOf(p); ctx.shown = await shownOrder(p) }],
        ['a finger on a row but NOT on the handle scrolls and does not pick the row up', async (p, ctx) => {
            const before = await orderOf(p)
            const cdp = await p.context().newCDPSession(p)
            const b = await p.locator('.phone-track:nth-child(2) .phone-track__text').boundingBox()
            const x = b.x + 40, y = b.y + b.height / 2
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
            await p.waitForTimeout(250)
            for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + i * 12, id: 1 }] }); await p.waitForTimeout(20) }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
            await p.waitForTimeout(500)
            ctx.order = await orderOf(p); ctx.unchanged = JSON.stringify(before) === JSON.stringify(ctx.order)
        }],
        ['the sheet of a playlist (real tap on ⋯)', async (p) => { await p.tap('.phone-pl__head .phone-more'); await p.waitForTimeout(450) }],
        ['the question before deleting a playlist (Cancel)', async (p) => { await p.tap('.sheet .phone-sheet-action--danger'); await p.waitForTimeout(500); await p.click('[data-action="cancel"]').catch(() => {}); await p.waitForTimeout(400) }],
        ['the sheet of the exports', async (p) => { await p.tap('[data-phone-action="export"]'); await p.waitForTimeout(450) }],
        ['the sheet closed by Escape', async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(450) }]
    ]
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

// ───────────────────────────────────────── A. the states, old against new
for (const width of [1280, 393]) {
    const was = await stage(oldBase, width)
    const is = await stage(newBase, width)
    const ctxOld = {}, ctxNew = {}
    let n = 0
    for (const [label, step] of STEPS[width]) {
        n += 1
        await step(was.page, ctxOld)
        await step(is.page, ctxNew)
        // PARK_MOUSE=1: the pointer is taken off the page before the page is read, so a :hover state the old screen lost when it drew anew is not a difference
        if (process.env.PARK_MOUSE && width > 700) for (const p of [was.page, is.page]) await p.mouse.move(2, 2)
        for (const p of [was.page, is.page]) await p.waitForTimeout(350)
        const a = await is.page.evaluate(`${READ}(document.getElementById('app'))`)
        const b = await was.page.evaluate(`${READ}(document.getElementById('app'))`)
        const same = a === b && JSON.stringify(await overlays(is.page)) === JSON.stringify(await overlays(was.page))
        let where = ''
        if (!same && a && b) { const i = [...a].findIndex((c, k) => c !== b[k]); where = `\n new: …${a.slice(Math.max(0, i - 100), i + 160)}\n old: …${b.slice(Math.max(0, i - 100), i + 160)}` }
        note(`A ${width} · ${label}: #app and what opens over the page are the same`, same, same ? `${a.length} chars` : where)
        const shotNew = await is.page.screenshot({ animations: 'disabled', caret: 'hide' })
        const shotOld = await was.page.screenshot({ animations: 'disabled', caret: 'hide' })
        const apart = pixelsApart(shotNew, shotOld)
        const base = `A-${width}-${String(n).padStart(2, '0')}-${slug(label)}`
        if (apart > 0) { fs.writeFileSync(path.join(CAPTURES, `${base}-NEW.png`), shotNew); fs.writeFileSync(path.join(CAPTURES, `${base}-OLD.png`), shotOld) } else fs.writeFileSync(path.join(CAPTURES, `${base}.png`), shotNew)
        note(`A ${width} · ${label}: screenshot the same`, apart === 0, `${apart} pixels apart`)
        if (ctxNew.order && label.includes('DRAG')) {
            note(`A ${width} · ${label}: the order of the tracks in the store is the same as on the old screen`, JSON.stringify(ctxNew.order) === JSON.stringify(ctxOld.order), JSON.stringify({ new: ctxNew.order, old: ctxOld.order }))
            note(`A ${width} · ${label}: the page shows the order of the store (React holds the page it wrote)`, JSON.stringify(ctxNew.shown.map(l => l.filter(Boolean))) === JSON.stringify(ctxNew.order.slice(0, ctxNew.shown.length).map(l => l)) || width === 393, JSON.stringify({ shown: ctxNew.shown, store: ctxNew.order }))
            note(`A ${width} · ${label}: the order changed (the drag did something)`, JSON.stringify(ctxNew.order) !== JSON.stringify(GENERATED().map(p => p.tracks.map(t => t.title))), '')
        }
        if (label.startsWith('a finger on a row')) note(`A ${width} · ${label}: nothing moved (new and old)`, ctxNew.unchanged && ctxOld.unchanged, JSON.stringify({ new: ctxNew.unchanged, old: ctxOld.unchanged }))
        delete ctxNew.order; delete ctxOld.order; delete ctxNew.shown; delete ctxOld.shown
        if (ctxNew.field) {
            note(`A ${width}: typing: the field kept the focus and the name, the grid has it beside each title (new = old)`, JSON.stringify(ctxNew.field) === JSON.stringify(ctxOld.field) && ctxNew.field.focused && ctxNew.field.value === 'Road trip', JSON.stringify({ new: ctxNew.field, old: ctxOld.field }))
            delete ctxNew.field; delete ctxOld.field
        }
    }
    const wrote = await is.page.evaluate(() => window.__wrote ?? null)
    note(`A ${width}: nothing was saved or written`, wrote === null, String(wrote))
    note(`A ${width}: no page error on either`, is.errors.length === 0 && was.errors.length === 0, [...is.errors, ...was.errors].join(' | '))
    await was.context.close(); await is.context.close()
}

// ───────────────────────────────────────── B. the screen with nothing, a batch that was not found, and the edit address
for (const width of [1280, 393]) {
    const was = await stage(oldBase, width, { go: false })
    const is = await stage(newBase, width, { go: false })
    for (const [label, address, clear] of [['nothing here yet', '/playlists', true], ['a saved batch that was not found', '/playlists/edit?edit=Ghost%20batch&seriesId=s1', true]]) {
        for (const s of [was, is]) {
            if (clear) await s.page.evaluate(async () => { (await import('/js/stores/playlists.js')).playlistsStore.reset() })
            await s.page.evaluate((a) => window.router.navigate(a), address)
            await s.page.waitForSelector('.playlists-view', { timeout: 20000 })
            await s.page.waitForTimeout(1200)
        }
        const a = await is.page.evaluate(`${READ}(document.getElementById('app'))`)
        const b = await was.page.evaluate(`${READ}(document.getElementById('app'))`)
        note(`B ${width} · ${label}: #app is the same`, a === b, a === b ? `${a.length} chars` : `\n new: ${a?.slice(0, 300)}\n old: ${b?.slice(0, 300)}`)
        const apart = pixelsApart(await is.page.screenshot({ animations: 'disabled' }), await was.page.screenshot({ animations: 'disabled' }))
        note(`B ${width} · ${label}: screenshot the same`, apart === 0, `${apart} pixels apart`)
        fs.writeFileSync(path.join(CAPTURES, `B-${width}-${slug(label)}.png`), await is.page.screenshot({ animations: 'disabled' }))
    }
    note(`B ${width}: no page error on either`, is.errors.length === 0 && was.errors.length === 0, [...is.errors, ...was.errors].join(' | '))
    await was.context.close(); await is.context.close()
}

// ───────────────────────────────────────── C. leaving, five times; and the guard for unsaved changes
{
    const { context, page, errors } = await stage(newBase, 1280)
    const cdp = await context.newCDPSession(page)
    const windowListeners = async () => {
        const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' })
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })
        return listeners.length
    }
    await page.evaluate(() => { window.confirm = () => true })
    await page.evaluate(() => window.router.navigate('/start')); await page.waitForTimeout(800)
    const before = await windowListeners()
    const seen = []
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.__service.initializeWithPlaylists(window.__generated(), null))
        await page.evaluate(() => window.router.navigate('/playlists')); await page.waitForSelector('.playlist-card'); await page.waitForTimeout(300)
        await page.evaluate(() => window.router.navigate('/start')); await page.waitForTimeout(700)
        seen.push(await page.evaluate(() => ({ path: location.pathname, screens: document.querySelectorAll('#app .playlists-view').length, overlays: document.querySelectorAll('.sheet, .phone-undo').length, grabbing: document.body.classList.contains('grabbing') })))
    }
    const after = await windowListeners()
    note('C: five visits: no playlists screen left in #app, nothing left on the page', seen.every(s => s.screens === 0 && s.overlays === 0 && !s.grabbing && s.path === '/start'), JSON.stringify(seen))
    note('C: the listeners of window after five visits are the ones before', after <= before, `${before} -> ${after}`)
    // the guard: with a change not saved, leaving asks
    await page.evaluate(() => window.__service.initializeWithPlaylists(window.__generated(), null))
    await page.evaluate(() => window.router.navigate('/playlists')); await page.waitForSelector('.playlist-card')
    await page.evaluate(() => { window.__asked = 0; window.confirm = () => { window.__asked += 1; return false } })
    await page.hover(ROW(0, 1)); await page.click(`${ROW(0, 1)} [data-action="remove-track"]`); await page.waitForTimeout(300)
    await page.evaluate(() => window.router.navigate('/start')); await page.waitForTimeout(500)
    const stayed = await page.evaluate(() => ({ asked: window.__asked, path: location.pathname }))
    note('C: with a change not saved, leaving asks, and «stay» keeps the screen', stayed.asked === 1 && stayed.path === '/playlists', JSON.stringify(stayed))
    note('C: no page error', errors.length === 0, errors.join(' | '))
    await context.close()
}

await browser.close()
fs.writeFileSync(path.join(OUT, `raw/browser-proof-results${TAG}.json`), JSON.stringify(results, null, 2))
console.log(`\n${results.filter(r => r.ok).length} of ${results.length} passed`)
process.exit(results.every(r => r.ok) ? 0 : 1)
