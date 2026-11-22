// F83 wave 5a, the browser proof of the albums screen. Run from the repo root with two servers up (dev servers, or `vite preview` of two builds):
//
//   node reports/evidence/F83/wave-5a/browser-proof.mjs <the screen as it was: the tree before the wave (8e685cd)> <the screen as it is>
//
// The load of the albums is silenced (`albumLoadService.load` does nothing) and the stores are filled with what Apple Music's answer would have
// made (found albums, a series where every album failed, one where some did), so nothing is asked of any catalog; the MusicKit of the real
// catalog and the real Spotify enrichment are NOT exercised here (they need the developer token of the server and an account); what is exercised
// is everything the screen does with what the catalog answers. Firebase Auth and Firestore are BLOCKED (identitytoolkit, securetoken,
// firestore.googleapis, firebaseinstallations are aborted before the page loads): no anonymous account is made in production, the page is a
// visitor. The same steps are driven on both pages at 1280 (a mouse) and 393 (a touch screen), with real clicks, keys and taps; after each step the
// page (`#app` and the sheet of the phone) is compared as in the unit proof, where the focus is, and a screenshot of each side pixel by pixel.
// RESULT_TAG, NO_TRANSITIONS=1, OLD_AGAINST_OLD=1 (both sides the old one) are the controls of waves 2 to 4. Results: raw/browser-proof-results<TAG>.json, captures<TAG>/.
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

const results = []
const pixels = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }

/** What a piece of the page says, ready to compare (run in the page, on a copy): as the unit proof reads it (options trimmed, the chosen one by its value). */
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
        const chosen = el.querySelectorAll('select')
        copy.querySelectorAll('select').forEach((select, i) => select.setAttribute('data-value', chosen[i].value))
        copy.querySelectorAll('option').forEach(option => { option.removeAttribute('selected'); option.textContent = option.textContent.trim() })
        copy.querySelectorAll('[data-legacy-host]').forEach(host => host.replaceWith(...host.childNodes))
        copy.querySelectorAll('.last-update').forEach(p => p.replaceChildren()) // the time the screen opened
        return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').replace(/ style=""/g, '').replace(/ style="[^"]*"( class="[^"]*sheet--closing)/g, '$1').trim()
    }
}
const READ = `(${NORMALIZE.toString()})()`
const read = (page, selectors) => page.evaluate(`(() => { const read = ${READ}; return ${JSON.stringify(selectors)}.map(s => [s, [...document.querySelectorAll(s)].map(read).join('')]) })()`)
const focusNow = (page) => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'body' : `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].join('.')}${e.dataset.id ? '[' + e.dataset.id + ']' : ''}` })

// ENGINE=webkit: the engine of Safari, with the profile of an iPhone for the phone (the built site: the order of the style sheets is what once broke only there)
const WEBKIT = process.env.ENGINE === 'webkit'
const browser = await (WEBKIT ? webkit : chromium).launch()
const WIDTHS = (process.env.WIDTHS || '1280,393').split(',').map(Number)
const png = (buffer) => PNG.sync.read(buffer)
let lastBox = ''
function pixelsApart(a, b) {
    const one = png(a), two = png(b)
    if (one.width !== two.width || one.height !== two.height) return Infinity
    let apart = 0
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, delta = 0
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

/** What the page puts in the stores: what the answers of Apple Music would have made. Four series, one of them with 14 albums, one failed, one half failed. */
const WORLD = `(async () => {
  const names = ['The Wall', 'Animals', 'Meddle', 'Obscured by Clouds', 'Houses of the Holy', 'Physical Graffiti', 'Presence', 'Machine Head', 'In Rock', 'Fireball']
  const make = (sid, j, artist, title) => ({ id: sid + '-' + j, title, artist, year: String(1970 + j), releaseDate: (1970 + j) + '-01-01', type: 'Album', coverUrl: 'https://is1-ssl.mzstatic.com/image/' + sid + '-' + j + '.jpg',
    hasUserRanking: j % 3 === 0, bestEverAlbumId: j % 2 === 0 ? String(100 + j) : null, spotifyId: j % 4 === 0 ? 'sp' + j : null, seriesIds: [sid],
    getTracks: (kind) => ['Speak to Me', 'Breathe', 'Time', 'Money'].map((t, i) => kind === 'acclaim' ? { title: t, rank: i + 1, rating: 90 - i } : { title: t, position: i + 1, duration: 200 + i * 20 }) })
  const spec = [['s0', 'Floyd', 'Pink Floyd', 4, 'found'], ['s1', 'Zeppelin', 'Led Zeppelin', 3, 'found'], ['s2', 'Big', 'Big Band', 14, 'found'], ['s3', 'Lost', 'Nobody', 2, 'failed'], ['s4', 'Purple', 'Deep Purple', 3, 'some-failed']]
  const series = spec.map(([id, name, artist, count], i) => ({ id, name, createdAt: new Date(2026, 0, 10 - i), albumQueries: Array.from({ length: count }, (_, j) => ({ artist, title: id === 's2' ? 'Big Album ' + (j + 1) : names[(j + i) % names.length] })) }))
  window.albumLoadService.load = () => {}
  window.albumLoadService.refreshSource = () => {}
  window.albumSeriesStore.setSeries(series)
  window.albumLoadStore.setSeriesOrder(series.map(s => s.id))
  const all = []
  series.forEach((s, i) => {
    const state = spec[i][4]
    window.albumLoadStore.setSeriesEntries(s.id, s.albumQueries.map((q, j) => {
      const key = (q.artist + ' - ' + q.title).toLowerCase()
      const failed = state === 'failed' || (state === 'some-failed' && j === s.albumQueries.length - 1)
      if (failed) return { key, seriesId: s.id, query: q, status: 'failed', error: { reason: 'not-found', message: 'not found' }, album: null, enrichment: { acclaim: 'pending', popularity: 'pending', userRanking: 'pending' } }
      const album = make(s.id, j, q.artist, q.title); all.push(album)
      return { key, seriesId: s.id, query: q, status: 'found', error: null, album, enrichment: { acclaim: 'done', popularity: 'empty', userRanking: 'not-connected' } }
    }))
  })
  window.albumsStore.setAlbumsBySeries({ ALL_SERIES_VIEW: all })
  window.albumLoadStore.flush()
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
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|api\/|ERR_|identitytoolkit|auth\/|Failed to load series data/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    if (process.env.NO_TRANSITIONS) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    await page.addInitScript(() => { try { localStorage.setItem('albumsPageSize', '10') } catch { /* none */ } })
    await page.goto(base + '/albums', { waitUntil: 'load' })
    await page.waitForFunction(() => window.albumLoadService && window.albumLoadStore && window.albumSeriesStore && window.albumsStore && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
    await page.waitForTimeout(1200)
    await page.evaluate(WORLD)
    await page.waitForTimeout(900)
    return { context, page, errors, blocked, phone, width }
}

const SELECTORS = ['#app', '.sheet:not(.sheet--closing)']

/** Runs one step on both sides and compares: the page, where the focus is, and the screenshot. */
async function step(label, sides, action, { shot = true, wait = 500, selectors = SELECTORS } = {}) {
    const taken = []
    for (const side of sides) {
        await action(side.page, side)
        await side.page.waitForTimeout(wait)
        taken.push({ dom: await read(side.page, selectors), focus: await focusNow(side.page), shot: shot ? await side.page.screenshot() : null })
    }
    const [before, after] = taken
    const domOk = JSON.stringify(before.dom) === JSON.stringify(after.dom)
    const where = (one, two) => { let i = 0; while (i < one.length && one[i] === two[i]) i++; return `old …${one.slice(Math.max(0, i - 60), i + 120)} // new …${two.slice(Math.max(0, i - 60), i + 120)}` }
    note(`${label} · the page`, domOk, domOk ? '' : `differs in ${before.dom.map(([s, v], i) => (v !== after.dom[i][1] ? s + ' ' + where(v, after.dom[i][1]) : null)).filter(Boolean).join(', ')}`)
    note(`${label} · focus`, before.focus === after.focus, `${before.focus} / ${after.focus}`)
    if (shot) {
        const apart = pixelsApart(before.shot, after.shot)
        const name = label.replace(/\W+/g, '_').slice(0, 80)
        fs.writeFileSync(path.join(CAPTURES, `${name}.old.png`), before.shot)
        fs.writeFileSync(path.join(CAPTURES, `${name}.new.png`), after.shot)
        pixels.push({ label, apart })
        note(`${label} · pixels`, apart === 0, apart === Infinity ? 'different sizes' : `${apart} px apart${lastBox ? ' · ' + lastBox : ''}`)
    }
}

const both = async (width) => [await open(oldBase, width), await open(process.env.OLD_AGAINST_OLD ? oldBase : newBase, width)]
const close = async (sides) => { for (const s of sides) await s.context.close() }
const noErrors = (sides, what) => note(`${what} · no error of the page on either side`, sides.every(s => s.errors.length === 0), sides.map((s, i) => `${i ? 'new' : 'old'}: ${s.errors.join(' | ')}`).join(' // '))

for (const width of WIDTHS) {
    const phone = width < 768
    const sides = await both(width)
    const tag = `${phone ? 'P' : 'A'} ${width}`
    const press = phone ? (page, selector) => page.tap(selector) : (page, selector) => page.click(selector)
    await step(`${tag} · the first page: groups, a failed series, a half failed one`, sides, async () => {})
    await step(`${tag} · typing in the search with real keys`, sides, async (page) => { await page.click('#genericSearch'); await page.keyboard.type('wall') })
    await step(`${tag} · the search emptied`, sides, async (page) => { await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.press('Delete') })
    if (!phone) {
        await step(`${tag} · the artist filter (a real selection)`, sides, (page) => page.selectOption('#filter-artist', 'Pink Floyd'))
        await step(`${tag} · the filter off`, sides, (page) => page.selectOption('#filter-artist', 'all'))
        await step(`${tag} · another order`, sides, (page) => page.selectOption('#genericSort', 'alpha'))
        await step(`${tag} · Load more albums of the big series`, sides, async (page) => { await page.selectOption('#genericSort', 'count_desc'); await page.click('[data-action="load-more-series"]') })
        await step(`${tag} · the list view`, sides, (page) => page.click('#viewModeList'))
        await step(`${tag} · a column of a track table pressed`, sides, (page) => page.click('.expanded-album-card [data-sort="title"]'))
    } else {
        await step(`${tag} · the sheet of the filters`, sides, (page) => press(page, '.filters-phone-button'), { wait: 700 })
        await step(`${tag} · a filter chosen in the sheet`, sides, async (page) => { await page.focus('#sheetFilter_artist'); await page.selectOption('#sheetFilter_artist', 'Pink Floyd') })
        await step(`${tag} · the sheet closed: the chip`, sides, async (page) => { await press(page, '.sheet .btn-primary'); }, { wait: 800 })
        await step(`${tag} · the chip taken out`, sides, (page) => press(page, '.filters-chip'))
        await step(`${tag} · the sheet of an album`, sides, (page) => press(page, '.album-more'), { wait: 700 })
        await step(`${tag} · the sheet closed`, sides, (page) => press(page, '.sheet .sheet__close'), { wait: 800 })
        await step(`${tag} · the sheet of a series`, sides, (page) => press(page, '.series-more'), { wait: 700 })
        await step(`${tag} · the sheet closed again`, sides, (page) => press(page, '.sheet .sheet__close'), { wait: 800 })
        await step(`${tag} · the list view, in the sheet`, sides, async (page) => { await press(page, '.filters-phone-button'); await page.waitForTimeout(600); await press(page, '.sheet [data-view-mode="expanded"]'); await press(page, '.sheet .sheet__close') }, { wait: 900 })
    }
    noErrors(sides, tag)
    await close(sides)
}

// one series alone (the address), and the empty state of a visitor with no series
for (const width of WIDTHS) {
    const phone = width < 768
    const tag = `${phone ? 'P' : 'A'} ${width}`
    const sides = [await open(oldBase, width), await open(process.env.OLD_AGAINST_OLD ? oldBase : newBase, width)]
    await step(`${tag} · one series by the filter`, sides, (page) => page.evaluate(() => window.router.navigate('/albums/s1')), { wait: 1500 })
    await close(sides)
}

await browser.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'raw', `browser-proof-results${TAG}.json`), JSON.stringify({ oldBase, newBase, firebaseBlocked: BLOCKED.source, passed: results.length - failed.length, failed: failed.length, results, maxPixelsApart: Math.max(0, ...pixels.map(p => p.apart)) }, null, 1))
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed of ${results.length}; max pixels apart ${Math.max(0, ...pixels.map(p => p.apart))}`)
process.exit(0)
