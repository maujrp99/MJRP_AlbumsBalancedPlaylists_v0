// F83 wave 1, the browser proof of the saved playlists screen. Run from the repo root with two dev servers up and production reachable:
//
//   node reports/evidence/F83/wave-1/browser-proof.mjs <the screen as it was: dev server on integrate/staging-2026-11-21 before wave 1> \
//        <the screen as it is: dev server of this branch> https://mjrp-playlist-generator.web.app
//
// A. Signed out, with what the network gives: /saved-playlists in production (the hand-made screen) and on this branch, at 1280 and
//    393, once the read is done (the anonymous session the app opens by itself reads nothing). #app is compared with the white
//    space collapsed, attributes and classes as sets, and a screenshot of each is compared pixel by pixel.
// B. Signed out, with data put in the store in the page (the existing seam: the store is a module of the app; nothing is read from
//    or written to the database: the reader of the page is replaced by a reader that never answers, and a delete that was
//    confirmed by mistake would only set a flag): the same states on the screen as it was and on the screen as it is, at 1280
//    and 393, driven the same way (real clicks and real keystrokes for search, focus and the field kept), #app and the windows
//    the screen opens over the page compared, and a screenshot of each compared pixel by pixel.
// C. Leaving: five visits, one screen in #app, no window left behind, the listeners of window the same after as before.
//
// It reads only. It signs in nowhere. Results: reports/evidence/F83/wave-1/raw/browser-proof-results.json, captures/.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [oldBase, newBase, production] = process.argv.slice(2)
const OUT = path.dirname(new URL(import.meta.url).pathname)
const CAPTURES = path.join(OUT, 'captures')
fs.mkdirSync(CAPTURES, { recursive: true })
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + detail : ''}`) }

/** What a piece of the page says, ready to compare: the same function as test/support/savedPlaylistsScenarios.js (run in the page). */
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
    return (el) => { if (!el) return null; el.normalize(); return describe(el).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim() }
}
const READ = `(${NORMALIZE.toString()})()`

const browser = await chromium.launch()
const errorsOf = new Map()

async function open(base, route, width) {
    const context = await browser.newContext({ viewport: { width, height: width > 700 ? 900 : 852 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message.slice(0, 200)))
    page.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    errorsOf.set(page, errors)
    await page.goto(base + route, { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0, null, { timeout: 30000 })
    return { context, page, errors }
}

const png = (buffer) => PNG.sync.read(buffer)
function pixelsApart(a, b) {
    const one = png(a), two = png(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0
    for (let i = 0; i < one.data.length; i += 4) if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) apart++
    return apart
}

// ───────────────────────────────────────── A. production, signed out
for (const width of [1280, 393]) {
    const theirs = await open(production, '/saved-playlists', width)
    const mine = await open(newBase, '/saved-playlists', width)
    for (const p of [theirs.page, mine.page]) await p.waitForSelector('.empty-state, .list-failed, .series-group', { timeout: 40000 }).catch(() => {})
    for (const p of [theirs.page, mine.page]) await p.waitForTimeout(1500)
    const a = await mine.page.evaluate(`${READ}(document.getElementById('app'))`)
    const b = await theirs.page.evaluate(`${READ}(document.getElementById('app'))`)
    const stateOf = await mine.page.evaluate(() => document.querySelector('.empty-state') ? 'empty state' : document.querySelector('.list-failed') ? 'list failed' : 'other')
    const shotA = await mine.page.screenshot({ animations: 'disabled', caret: 'hide' })
    const shotB = await theirs.page.screenshot({ animations: 'disabled', caret: 'hide' })
    fs.writeFileSync(path.join(CAPTURES, `A-${width}-production-new.png`), shotA)
    fs.writeFileSync(path.join(CAPTURES, `A-${width}-production-old.png`), shotB)
    note(`A ${width}: #app of /saved-playlists signed out (${stateOf}): this branch = production`, a === b, a === b ? `${a.length} chars` : `\n new: ${a?.slice(0, 300)}\n prod: ${b?.slice(0, 300)}`)
    const apart = pixelsApart(shotA, shotB)
    note(`A ${width}: screenshot signed out: this branch = production`, apart === 0, `${apart} pixels apart`)
    note(`A ${width}: no page error on this branch`, mine.errors.length === 0, mine.errors.join(' | '))
    await mine.context.close(); await theirs.context.close()
}

// ───────────────────────────────────────── B. staged data, the screen as it was against the screen as it is
const STAGE = async () => {
    const models = await import('/js/models/savedPlaylists.js')
    const { savedPlaylistsStore: store } = await import('/js/stores/savedPlaylists.js')
    const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="hsl(${hue},60%,40%)"/></svg>`)}`
    const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
    const playlist = (id, batchName, tracks, savedAt = '2026-11-01T10:00:00Z') => ({ id, name: `Playlist ${id}`, batchName, savedAt, tracks })
    const entry = (id, name, status, playlists, extra = {}) => ({ seriesId: id, series: { id, name, updatedAt: '2026-11-01T00:00:00Z' }, status, playlists, batches: models.groupIntoBatches(playlists || []), thumbnails: [], error: null, refreshing: false, ...extra })
    const plant = entry('s1abcdefghij', 'Plant', 'ready', [
        playlist('p1', 'Sunday mix', [track('Kashmir', 'Physical Graffiti', 510), track('Ramble On', 'Led Zeppelin II', 275)]),
        playlist('p2', 'Sunday mix', [track('Gone Gone Gone', 'Raising Sand', 200)]),
        playlist('p3', 'TheAlbumBlender Playlist 2026-11-20 23:21', [track('Song', 'Album')], '2026-11-20T23:21:00Z')
    ], { thumbnails: [cover(20), cover(120), cover(220)] })
    const floyd = entry('s2klmnopqrst', 'Floyd', 'ready', [playlist('p4', 'Batch B', [track('Time', 'The Dark Side of the Moon', 413)]), playlist('p5', 'Batch B', [])])
    return { models, store, plant, floyd, entry, playlist, track }
}

async function stage(base, width) {
    const { context, page, errors } = await open(base, '/start', width)
    await page.addScriptTag({ content: `window.__stage = ${STAGE.toString()}` }) // an inline script: the page's policy allows it, not eval
    await page.evaluate(async () => {
        const reading = await import('/js/services/playlists/savedPlaylistsReading.js')
        reading.savedPlaylistsReader.load = () => new Promise(() => {})
        reading.savedPlaylistsReader.refreshSeries = () => Promise.resolve()
        reading.savedPlaylistsReader.removeBatch = async () => { window.__wroteSomething = 'removeBatch' }
        reading.savedPlaylistsReader.removeAll = async () => { window.__wroteSomething = 'removeAll' }
    })
    await page.evaluate(() => window.router.navigate('/saved-playlists'))
    await page.waitForSelector('#genericSearch', { timeout: 20000 })
    await page.waitForTimeout(500)
    return { context, page, errors }
}

const put = (page, kind) => page.evaluate(async (kind) => {
    const { store, plant, floyd, entry, playlist, track } = await window.__stage()
    store.begin(1, 'u1')
    if (kind === 'two') store.setSeries([plant, floyd])
    if (kind === 'failed') store.setSeries([entry('s1', 'Plant', 'failed', null, { error: 'offline' }), entry('s2', 'Floyd', 'failed', [playlist('p2', 'B', [track('T', 'A')])], { error: 'offline' })])
    if (kind === 'empty') store.setSeries([entry('s1', 'Plant', 'empty', [])])
    if (kind === 'listFailed') store.setListFailed('unavailable')
    store.flush()
    await new Promise(r => setTimeout(r, 400))
}, kind)

/** Page-level things the screen opens besides #app: a sheet, the window of a playlist, a question. */
const overlays = (page) => page.evaluate(`(() => { const read = (${NORMALIZE.toString()})(); return ['.sheet:not(.sheet--closing)', '#playlist-modal', '.app-modal:not(#playlist-modal)'].map(s => [s, read(document.querySelector(s))]) })()`)

const STEPS = {
    1280: [
        ['first load, waiting for the list', async () => {}],
        ['two series, closed', (p) => put(p, 'two')],
        ['a batch open', (p) => p.click('.series-group .batch-header')],
        ['a playlist open, its tracks drawn', (p) => p.click('.playlist-row')],
        ['the window of a playlist (real click on the Eye)', async (p) => { await p.hover('.playlist-row'); await p.click('.playlist-row .playlist-row-buttons button') }],
        ['the window closed', (p) => p.click('#playlist-modal .btn-secondary')],
        ['search: real keystrokes, the field is the same element and keeps the focus', async (p, ctx) => {
            await p.evaluate(() => { document.getElementById('genericSearch').__mark = 'same' })
            await p.click('#genericSearch'); await p.keyboard.type('floyd', { delay: 40 })
            ctx.field = await p.evaluate(() => ({ same: document.getElementById('genericSearch').__mark === 'same', focused: document.activeElement?.id === 'genericSearch', value: document.getElementById('genericSearch').value }))
        }],
        ['no match', async (p) => { await p.fill('#genericSearch', 'zeppelin') }],
        ['search cleared, one series by the filter', async (p) => { await p.fill('#genericSearch', ''); await p.selectOption('#filter-series', 's2klmnopqrst') }],
        ['the order by name, backwards', async (p) => { await p.selectOption('#filter-series', 'all'); await p.selectOption('#genericSort', 'name_desc') }],
        ['the question before deleting a batch (Cancel, nothing is deleted)', async (p) => {
            await p.selectOption('#genericSort', 'updated_desc')
            await p.click('.series-group .batch-card-buttons .btn-ghost'); await p.waitForTimeout(300)
        }],
        ['the question before deleting all playlists of a series', async (p) => {
            await p.click('[data-action="cancel"]'); await p.waitForTimeout(300)
            await p.click('.series-group .group-header .btn-ghost'); await p.waitForTimeout(300)
        }],
        ['two series failed', async (p) => { await p.click('[data-action="cancel"]'); await p.waitForTimeout(200); await put(p, 'failed') }],
        ['the list failed', (p) => put(p, 'listFailed')],
        ['empty state', (p) => put(p, 'empty')]
    ],
    393: [
        ['two series on the phone, closed', (p) => put(p, 'two')],
        ['a series open', (p) => p.click('.saved-series-toggle')],
        ['a batch open', (p) => p.click('.saved-phone-batch__main')],
        ['the sheet of a series (real tap on ⋯)', async (p) => { await p.click('.saved-phone-series__head .phone-more'); await p.waitForTimeout(400) }],
        ['the sheet closed by Escape', async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(400) }],
        ['the sheet of a batch', async (p) => { await p.click('.saved-phone-batch .phone-more'); await p.waitForTimeout(400) }],
        ['the sheet of a batch closed by its X', async (p) => { await p.click('.sheet__close'); await p.waitForTimeout(400) }],
        ['one filter on (chip), the filters button', async (p) => { await p.evaluate(() => { const s = document.getElementById('filter-series'); s.value = 's2klmnopqrst'; s.dispatchEvent(new Event('change', { bubbles: true })) }); await p.waitForTimeout(300) }],
        ['the sheet of the filters', async (p) => { await p.click('.filters-phone-button'); await p.waitForTimeout(400) }],
        ['the sheet of the filters closed with «Show series»', async (p) => { await p.click('.filter-sheet-window .btn-primary'); await p.waitForTimeout(400) }],
        ['a failure on the phone', (p) => put(p, 'failed')]
    ]
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

for (const width of [1280, 393]) {
    const was = await stage(oldBase, width)
    const is = await stage(newBase, width)
    const ctxOld = {}, ctxNew = {}
    let n = 0
    for (const [label, step] of STEPS[width]) {
        n += 1
        await step(was.page, ctxOld)
        await step(is.page, ctxNew)
        for (const p of [was.page, is.page]) await p.waitForTimeout(350)
        const a = await is.page.evaluate(`${READ}(document.getElementById('app'))`)
        const b = await was.page.evaluate(`${READ}(document.getElementById('app'))`)
        const oa = await overlays(is.page)
        const ob = await overlays(was.page)
        const same = a === b && JSON.stringify(oa) === JSON.stringify(ob)
        note(`B ${width} · ${label}: #app and what opens over the page are the same`, same, same ? `${a.length} chars` : `\n new: ${(a || '').slice(0, 240)}\n old: ${(b || '').slice(0, 240)}`)
        const shotNew = await is.page.screenshot({ animations: 'disabled', caret: 'hide' })
        const shotOld = await was.page.screenshot({ animations: 'disabled', caret: 'hide' })
        const apart = pixelsApart(shotNew, shotOld)
        const base = `B-${width}-${String(n).padStart(2, '0')}-${slug(label)}`
        if (apart > 0) { fs.writeFileSync(path.join(CAPTURES, `${base}-NEW.png`), shotNew); fs.writeFileSync(path.join(CAPTURES, `${base}-OLD.png`), shotOld) } else fs.writeFileSync(path.join(CAPTURES, `${base}.png`), shotNew)
        note(`B ${width} · ${label}: screenshot the same`, apart === 0, `${apart} pixels apart`)
    }
    if (ctxNew.field) note(`B ${width}: typing: the search field stayed the same element and kept the focus, as before`, ctxNew.field.same && ctxNew.field.focused && ctxNew.field.value === 'floyd' && ctxOld.field.same && ctxOld.field.focused, JSON.stringify({ new: ctxNew.field, old: ctxOld.field }))
    const wrote = await is.page.evaluate(() => window.__wroteSomething ?? null)
    note(`B ${width}: nothing was deleted or written`, wrote === null, String(wrote))
    note(`B ${width}: no page error on either`, is.errors.length === 0 && was.errors.length === 0, [...is.errors, ...was.errors].join(' | '))
    await was.context.close(); await is.context.close()
}

// ───────────────────────────────────────── C. leaving, five times
{
    const { context, page, errors } = await stage(newBase, 1280)
    await put(page, 'two')
    const cdp = await context.newCDPSession(page)
    const windowListeners = async () => {
        const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' })
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })
        return listeners.length
    }
    await page.evaluate(() => window.router.navigate('/start')); await page.waitForTimeout(800)
    const before = await windowListeners()
    const seen = []
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.router.navigate('/saved-playlists')); await page.waitForSelector('#genericSearch'); await page.waitForTimeout(300)
        await page.click('.filters-phone-button').catch(() => {})
        await page.evaluate(() => window.router.navigate('/start')); await page.waitForTimeout(700)
        seen.push(await page.evaluate(() => ({ path: location.pathname, savedScreens: document.querySelectorAll('#app .saved-playlists-view').length, overlays: document.querySelectorAll('.sheet, #playlist-modal').length })))
    }
    const after = await windowListeners()
    note('C: five visits: no saved-playlists screen left in #app, no window left on the page', seen.every(s => s.savedScreens === 0 && s.overlays === 0 && s.path === '/start'), JSON.stringify(seen))
    note('C: the listeners of window after five visits are the ones before (the fixed ones of the bridge are on the stores, not on window)', after <= before, `${before} -> ${after}`)
    note('C: no page error', errors.length === 0, errors.join(' | '))
    await page.goBack(); await page.waitForTimeout(500)
    await context.close()
}

await browser.close()
fs.writeFileSync(path.join(OUT, 'raw/browser-proof-results.json'), JSON.stringify(results, null, 2))
console.log(`\n${results.filter(r => r.ok).length} of ${results.length} passed`)
process.exit(results.every(r => r.ok) ? 0 : 1)
