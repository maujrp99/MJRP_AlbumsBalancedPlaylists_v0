// F83 sync 2, the browser proof of the export window (F90) in the two React screens, against the hand-made one of `main`.
//
//   SURFACE=edit|saved  ENGINE=chromium|webkit  PROFILE=desktop|"iPhone 14"  [BUILT=1] [CONTROL=1] [TAG=name] \
//     node reports/evidence/F83/sync-2/browser-proof.mjs <base of main> <base of this branch>
//
// Two servers are up (dev servers, or `vite preview` of two builds with BUILT=1): the tree of `main` (hand-made) and this branch (React).
// CONTROL=1 gives the base of `main` twice: main against main, the noise control (what two runs of the SAME code differ by).
// Firebase Auth and Firestore are blocked; MusicKit is a stand-in the test answers (the token route and musickit.js): its library has folders
// ('folders'), none ('none') or fails reading them ('error'); everything the export asks of it is written to window.__apple.calls, so the
// two sides are compared by what they ASKED. No Apple Music or Spotify is ever called; nothing is read from or written to a database.
//
// Each step is done on both sides, in step; after it the window (its DOM, with a field compared by its state), what has the focus, the notices,
// what MusicKit was asked and the pixels of the window are compared. SURFACE=edit drives /playlists (the set is put in the store in the page:
// built or not, `playlistsStore` is on `window`); SURFACE=saved drives /saved-playlists and needs the dev servers (the store of the saved
// playlists is a module, not a global: the built site has no way to be given series with Firestore blocked).
import { chromium, webkit, devices } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [mainBase, mineBase] = process.argv.slice(2)
const SURFACE = process.env.SURFACE || 'edit'
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || 'desktop'
const PHONE = PROFILE !== 'desktop'
const CONTROL = process.env.CONTROL === '1'
const BUILT = process.env.BUILT === '1'
const TAG = process.env.TAG || `${SURFACE}-${process.env.ENGINE || 'chromium'}-${PHONE ? PROFILE.replace(/\s/g, '') : 'desktop'}${BUILT ? '-built' : ''}${CONTROL ? '-control' : ''}`
const OUT = path.dirname(new URL(import.meta.url).pathname)
const CAPTURES = path.join(OUT, 'captures')
fs.mkdirSync(CAPTURES, { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }

const APPLE_STAND_IN = `
  (() => {
    const A = window.__apple
    const folders = [{ id: 'f-1', attributes: { name: 'Favorites' } }, { id: 'f-2', attributes: { name: 'Workout' } }]
    const instance = { get isAuthorized() { return A.authorized }, musicUserToken: 'u',
      authorize: async () => { A.authorized = true; return 'u' }, unauthorize: async () => { A.authorized = false }, addEventListener() {}, removeEventListener() {},
      api: { music: async (path, params, options) => {
        const method = options?.fetchOptions?.method || 'GET'
        A.calls.push([method, path, JSON.stringify(params ?? null), options?.fetchOptions?.body ?? null])
        if (path.includes('playlist-folders') && method === 'GET') {
          if (A.mode === 'error') throw new Error('the library cannot be read')
          return { data: { data: A.mode === 'none' ? [] : folders } }
        }
        if (path.includes('playlist-folders')) return { data: { data: [{ id: 'f-new' }] } }
        if (path.includes('/catalog')) return { data: { results: { songs: { data: [] }, albums: { data: [] } }, data: [] } }
        return { data: { data: [{ id: 'p-new' }] } }
      } } }
    window.MusicKit = { configure: async () => {}, getInstance: () => instance }
  })()`

const contextOptions = () => {
    const base = { reducedMotion: 'reduce' }
    if (!PHONE) return { ...base, viewport: { width: 1280, height: 900 } }
    return { ...base, ...devices[PROFILE] }
}

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
    return (element) => {
        if (!element) return null
        const clone = element.cloneNode(true)
        const live = [...element.querySelectorAll('input')]
        ;[...clone.querySelectorAll('input')].forEach((input, index) => {
            input.removeAttribute('checked')
            if (live[index].type === 'radio' && live[index].checked) input.setAttribute('data-is-checked', 'true')
            if (live[index].type === 'text') input.setAttribute('data-typed', live[index].value)
            input.removeAttribute('value')
            if (live[index].type === 'radio') input.setAttribute('data-value', live[index].value)
        })
        return describe(clone).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim()
    }
}
const READ = `(${NORMALIZE.toString()})()`
const WINDOW = '#playlist-export-window'

const browser = await ENGINE.launch()

async function open(base, apple) {
    const context = await browser.newContext(contextOptions())
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) }) // the search worker asks for a file the preview of a build does not serve: on both sides
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|identitytoolkit|auth\/|^Worker Error/i.test(m.text()) && !(apple === 'error' && /Folder operation failed/.test(m.text()))) errors.push(m.text().slice(0, 200)) }) // an unreadable library is the state asked for: the app says so in the console on both sides
    await page.route(BLOCKED, (r) => r.abort())
    await page.route(/mzstatic\.com/, (r) => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    await page.route(/\/api\/musickit-token/, (r) => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
    await page.route(/js-cdn\.music\.apple\.com/, (r) => r.fulfill({ contentType: 'application/javascript', body: APPLE_STAND_IN }))
    await page.addInitScript((mode) => {
        window.__apple = { authorized: true, mode, calls: [] }
        Date.prototype.toLocaleTimeString = () => '12:00:00 PM'
        try { localStorage.setItem('albumBlender.appleMusic.authorized', '1') } catch { /* none */ }
    }, apple)
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 40000 })
    await page.waitForTimeout(3000) // the notice the app gives when Firebase Auth is blocked comes some seconds after the load, on either side: wait for it
    await page.evaluate(() => document.querySelectorAll('#toast-container .toast').forEach(toast => toast.remove()))
    return { context, page, errors }
}

const GENERATED = () => {
    const track = (title, album, duration = 200) => ({ id: `t-${title}`, title, artist: 'Artist', album, duration })
    return [
        { id: 'g1', name: 'Greatest Hits', title: 'Greatest Hits', batchName: 'Mix', tracks: [track('One', 'A'), track('Two', 'A'), track('Three', 'B')] },
        { id: 'g2', name: 'Deep Cuts', title: 'Deep Cuts', batchName: 'Mix', tracks: [track('Four', 'C'), track('Five', 'D')] }
    ]
}

async function stageEdit(base, apple) {
    const s = await open(base, apple)
    await s.page.addScriptTag({ content: `window.__generated = ${GENERATED.toString()}` })
    await s.page.evaluate(() => { window.playlistsStore.setPlaylists(window.__generated(), 'sA'); window.router.navigate('/playlists') })
    await s.page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
    await s.page.waitForTimeout(800)
    return s
}

const STAGE_SAVED = async () => {
    const models = await import('/js/models/savedPlaylists.js')
    const { savedPlaylistsStore: store } = await import('/js/stores/savedPlaylists.js')
    const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
    const playlist = (id, batchName, tracks, savedAt = '2026-11-01T10:00:00Z') => ({ id, name: `Playlist ${id}`, batchName, savedAt, tracks })
    const plant = { seriesId: 's1abcdefghij', series: { id: 's1abcdefghij', name: 'Plant', updatedAt: '2026-11-01T00:00:00Z' }, status: 'ready', error: null, refreshing: false, thumbnails: [],
        playlists: [playlist('p1', 'Sunday mix', [track('Kashmir', 'Physical Graffiti', 510), track('Ramble On', 'Led Zeppelin II', 275)]), playlist('p2', 'Sunday mix', [track('Gone Gone Gone', 'Raising Sand', 200)]), playlist('p3', 'Sunday mix', [track('Song', 'Album')])] }
    plant.batches = models.groupIntoBatches(plant.playlists)
    store.begin(1, 'u1')
    store.setSeries([plant])
    store.flush()
}

async function stageSaved(base, apple) {
    const s = await open(base, apple)
    await s.page.addScriptTag({ content: `window.__stageSaved = ${STAGE_SAVED.toString()}` })
    await s.page.evaluate(async () => {
        const reading = await import('/js/services/playlists/savedPlaylistsReading.js')
        reading.savedPlaylistsReader.load = () => new Promise(() => {})
        reading.savedPlaylistsReader.refreshSeries = () => Promise.resolve()
        reading.savedPlaylistsReader.removeBatch = async () => { window.__wroteSomething = 'removeBatch' }
        reading.savedPlaylistsReader.removeAll = async () => { window.__wroteSomething = 'removeAll' }
    })
    await s.page.evaluate(() => window.router.navigate('/saved-playlists'))
    await s.page.waitForSelector('#genericSearch', { timeout: 20000 })
    await s.page.waitForTimeout(500)
    await s.page.evaluate(() => window.__stageSaved())
    await s.page.waitForTimeout(700)
    return s
}

function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, delta: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, delta = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) { apart++; delta = Math.max(delta, d); const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    }
    return { apart, delta, box: apart ? `x ${x0}-${x1}, y ${y0}-${y1}` : '' }
}

const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}[${e.dataset?.export || e.dataset?.appleExport || e.dataset?.folderBack || (e.dataset?.mode ? e.dataset.mode + ':' + e.value : '') || e.getAttribute('aria-label') || ''}]` })
const callsNow = (page) => page.evaluate(() => JSON.stringify(window.__apple.calls))
const toastsNow = (page) => page.evaluate(() => JSON.stringify([...document.querySelectorAll('#toast-container .toast')].map(e => e.textContent.trim())))
const windowNow = (page) => page.evaluate(`(() => { const read = ${READ}; const w = document.querySelector('${WINDOW}'); return w ? read(w) : null })()`)

let shots = 0
/** Does the step on both sides, in step, and compares what it left. */
async function step(label, sides, run, { wait = 500, shoot = false } = {}) {
    const [a, b] = sides
    for (const side of sides) { await run(side.page, side); await side.page.waitForTimeout(wait) }
    const [wa, wb] = [await windowNow(a.page), await windowNow(b.page)]
    note(`${TAG} · ${label} · the window`, wa === wb, wa === wb ? `${(wa || 'none').length} chars` : `\n main: ${String(wa).slice(0, 260)}\n mine: ${String(wb).slice(0, 260)}`)
    const [fa, fb] = [await focusNow(a.page), await focusNow(b.page)]
    // KNOWN, the only difference of the window: after «Export» is pressed the hand-made button was disabled and its text written over by hand, and
    // Chromium moved the focus to the page; the button of the React window keeps it (it is the same button, given back at the end). Kept on purpose.
    const known = /Export pressed/.test(label) && fa === 'body' && /\[true\]$/.test(fb)
    note(`${TAG} · ${label} · the focus${known ? ' (KNOWN difference: the React button keeps the focus)' : ''}`, fa === fb || known, `${fa} | ${fb}`)
    const [ca, cb] = [await callsNow(a.page), await callsNow(b.page)]
    note(`${TAG} · ${label} · what MusicKit was asked`, ca === cb, ca === cb ? `${JSON.parse(ca).length} calls` : `\n main: ${ca.slice(0, 300)}\n mine: ${cb.slice(0, 300)}`)
    const [ta, tb] = [await toastsNow(a.page), await toastsNow(b.page)]
    note(`${TAG} · ${label} · the notices`, ta === tb, ta === tb ? ta : `\n main: ${ta}\n mine: ${tb}`)
    if (wa && wb) {
        const [sa, sb] = [await a.page.locator(WINDOW).first().screenshot({ animations: 'disabled', caret: 'hide' }), await b.page.locator(WINDOW).first().screenshot({ animations: 'disabled', caret: 'hide' })]
        const { apart, delta, box } = pixelsApart(sa, sb)
        note(`${TAG} · ${label} · the pixels of the window`, apart === 0, apart === 0 ? '0 pixels apart' : `${apart} pixels apart (largest ${delta} of 255, ${box})`)
        if (shoot && shots < 8) {
            // a crop of the panel of the window (its pixels were compared above over the whole window): this branch's, and main's beside it
            shots++
            const name = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
            const panel = `${WINDOW} [role="dialog"]`
            fs.writeFileSync(path.join(CAPTURES, `${TAG}-${shots}-${name}-main.png`), await a.page.locator(panel).first().screenshot({ animations: 'disabled', caret: 'hide' }))
            fs.writeFileSync(path.join(CAPTURES, `${TAG}-${shots}-${name}-mine.png`), await b.page.locator(panel).first().screenshot({ animations: 'disabled', caret: 'hide' }))
        }
    }
}

const press = (selector) => async (page) => { await page.locator(selector).first().click() }
const tap = (selector) => async (page) => { await page.locator(selector).first().click() }
const key = (name) => async (page) => { await page.keyboard.press(name) }
const pick = (mode, value) => async (page) => { await page.locator(`input[name="apple-folder"][data-mode="${mode}"]${value ? `[value="${value}"]` : ''}`).first().check({ force: true }) }
const typeName = (text) => async (page) => { await page.locator('[data-folder-name]').fill(text) }

async function drive(apple, stage, steps) {
    const sides = [await stage(mainBase, apple), await stage(CONTROL ? mainBase : mineBase, apple)]
    await steps(sides)
    for (const [index, side] of sides.entries()) note(`${TAG} · no page error on ${index === 0 ? 'main' : 'this branch'}`, side.errors.length === 0, side.errors.join(' | '))
    for (const side of sides) await side.context.close()
}

const opener = {
    edit: PHONE ? '[data-phone-action="export"]' : '#exportAppleMusicBtn',
    batch: '[aria-label^="Export batch"]',
    playlist: '.playlist-row [aria-label^="Export "], .saved-phone-playlist-head [aria-label^="Export "]'
}

/** The window of the edit screen, from «Apple Music» (the computer) or «Export» (the phone), in the three states of the library. */
async function editSteps(sides) {
    await step('Export opened', sides, press(opener.edit), { shoot: true })
    if (PHONE) await step('Apple Music chosen', sides, tap('[data-export="apple"]'), { wait: 900, shoot: true })
    else await step('the folders have been read', sides, async () => {}, { wait: 900, shoot: true })
    await step('a folder of the library picked', sides, pick('existing', 'Workout'), { shoot: true })
    await step('New folder, no name: asked for it', sides, async (page) => { await pick('new')(page); await page.locator('[data-apple-export]').click() }, { shoot: true })
    await step('New folder, a name typed', sides, typeName('Trip 2026'), { shoot: true })
    await step('No folder', sides, pick('none'))
    await step('Export pressed: what Apple Music is asked', sides, press('[data-apple-export]'), { wait: 3000, shoot: true })
    await step('Back to the destinations', sides, press('[data-folder-back]'), { shoot: true })
    await step('Apple Music again: the last choice is remembered', sides, tap('[data-export="apple"]'), { wait: 900, shoot: true })
    await step('Escape: the window goes, the focus goes back', sides, key('Escape'), { wait: 600 })
}

async function savedSteps(sides) {
    if (PHONE) {
        await step('the series opens', sides, press('.saved-series-toggle'))
        await step('the batch opens', sides, press('.saved-phone-batch__main'))
        await step('the export beside a playlist', sides, press('.saved-phone-playlist-head .phone-more'), { wait: 700, shoot: true })
        await step('Escape', sides, key('Escape'), { wait: 600 })
        await step('the «⋯» of the batch', sides, press('.saved-phone-batch .phone-more'), { wait: 500, shoot: true })
        await step('Export in the sheet of the batch', sides, press('.saved-phone-sheet .albums-sheet__row:nth-child(2)'), { wait: 700, shoot: true })
    } else {
        await step('Export on the batch', sides, press(opener.batch), { shoot: true })
        await step('Escape', sides, key('Escape'), { wait: 400 })
        await step('the batch opens', sides, press('.batch-header'))
        await step('Export on a playlist', sides, press('.playlist-row [aria-label^="Export "]'), { shoot: true })
    }
    await step('Apple Music chosen', sides, tap('[data-export="apple"]'), { wait: 900, shoot: true })
    await step('a folder picked', sides, pick('existing', 'Favorites'), { shoot: true })
    await step('Export pressed: what Apple Music is asked', sides, press('[data-apple-export]'), { wait: 3000, shoot: true })
    await step('Escape', sides, key('Escape'), { wait: 600 })
}

const steps = SURFACE === 'saved' ? savedSteps : editSteps
const stage = SURFACE === 'saved' ? stageSaved : stageEdit
for (const apple of ['folders', 'none', 'error']) {
    const mode = apple
    await drive(mode, stage, async (sides) => {
        if (mode === 'folders') await steps(sides)
        else {
            // the other states of the library: only the step that reads it
            await step(`[${mode}] the export opened`, sides, SURFACE === 'saved' ? (PHONE ? async () => {} : press(opener.batch)) : press(opener.edit), { shoot: false })
            if (SURFACE === 'saved' && PHONE) {
                await step(`[${mode}] the series and the batch open`, sides, async (page) => { await page.locator('.saved-series-toggle').first().click(); await page.locator('.saved-phone-batch__main').first().click(); await page.locator('.saved-phone-playlist-head .phone-more').first().click() }, { wait: 600 })
            }
            if (SURFACE === 'edit' && PHONE) await step(`[${mode}] Apple Music chosen`, sides, tap('[data-export="apple"]'), { wait: 900, shoot: true })
            else if (SURFACE === 'edit') await step(`[${mode}] the folders have been read`, sides, async () => {}, { wait: 900, shoot: true })
            else await step(`[${mode}] Apple Music chosen`, sides, tap('[data-export="apple"]'), { wait: 900, shoot: true })
            await step(`[${mode}] Export pressed with the series folder`, sides, press('[data-apple-export]'), { wait: 3000 })
        }
    })
}

await browser.close()
const failed = results.filter(r => !r.ok)
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
fs.writeFileSync(path.join(OUT, 'raw', `browser-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
