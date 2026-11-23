// F83 sync 2: the inventory (hand-made, with F89's gallery on the phone and F75's kept values and two-line origin) drawn inside the React shell.
//
//   ENGINE=chromium|webkit PROFILE=desktop|tablet|"iPhone 14" node reports/evidence/F83/sync-2/inventory-proof.mjs <base of main> <base of this branch>
//
// Both sides are dev servers (the inventory's store is a module, not a global of the built site). Firebase Auth and Firestore are blocked; the items are put in
// the store in the page (nothing is read from or written to a database). `main` draws the inventory in its own hand-made shell, this branch in the shell in
// React: the shell was proved equal in the first sync, so what is compared here is the whole page (the shell, then #app) at 393 (iPhone 14, WebKit), 820 and 1280
// (Chromium): the DOM of #app, and the pixels of the page. Crops of this branch are kept in captures-inventory/.
import { chromium, webkit, devices } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [mainBase, mineBase] = process.argv.slice(2)
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium
const PROFILE = process.env.PROFILE || 'desktop'
const OUT = path.dirname(new URL(import.meta.url).pathname)
const CAPTURES = path.join(OUT, 'captures-inventory')
fs.mkdirSync(CAPTURES, { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 300) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 260) : ''}`) }
const VIEW = process.env.VIEW || 'list' // the phone's two views: the list, or the gallery of covers (F89)
const CONTROL = process.env.CONTROL === '1' // main against main: the noise of two runs of the same code
const TAG = `${(process.env.ENGINE || 'chromium')}-${PROFILE.replace(/\s/g, '')}-${VIEW}${CONTROL ? '-control' : ''}`

const contextOptions = () => {
    if (PROFILE === 'desktop') return { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }
    if (PROFILE === 'tablet') return { viewport: { width: 820, height: 1100 }, hasTouch: true, reducedMotion: 'reduce' }
    return { ...devices[PROFILE], reducedMotion: 'reduce' }
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
    return (el) => (el ? describe(el).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim() : null)
}

const STAGE = async () => {
    const { inventoryStore } = await import('/js/stores/inventory.js')
    const DAY = 24 * 60 * 60 * 1000
    const kept = (days, extra) => ({ source: 'discogs', kind: 'found', basis: null, lowest: null, forSale: null, currency: 'USD', release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }, conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, readAt: new Date(Date.now() - days * DAY).toISOString(), ...extra })
    const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue},55%,38%)"/></svg>`)}`
    const item = (id, artist, title, hue, extra = {}) => ({ id, artist, title, format: 'cd', owned: true, purchasePrice: null, currency: 'BRL', notes: '', addedAt: '2026-01-01T00:00:00Z', albumData: { id: `album-${id}`, title, artist, coverUrl: cover(hue) }, averages: { rating: 78.4, popularity: 42.6, ratedTracks: 9, popTracks: 10, tracks: 10 }, ...extra })
    inventoryStore.setAlbums([
        item('a', 'Neil Young', 'Harvest', 30, { discogsReading: kept(3) }),
        item('b', 'Pink Floyd', 'Animals', 200, { discogsReading: kept(3, { conditions: { mint: 24, nearMint: 19, veryGoodPlus: 14 } }) }),
        item('c', 'Joni Mitchell', 'Hejira', 120, { owned: null, discogsReading: kept(3, { conditions: null, basis: 'lowest_for_sale', lowest: { value: 12.93, currency: 'USD' }, forSale: 37 }) }),
        item('d', 'Yes', 'Fragile', 300, { owned: false, discogsReading: { source: 'discogs', kind: 'not_found', readAt: new Date(Date.now() - 3 * DAY).toISOString() } }),
        item('e', 'Radiohead', 'OK Computer', 60, { value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, discogsReading: kept(3) }),
        item('f', 'Caravan', 'In the Land of Grey and Pink', 250, {})
    ])
}

const browser = await ENGINE.launch()

async function open(base) {
    const context = await browser.newContext(contextOptions())
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|identitytoolkit|auth\/|inventory|Failed to load/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
    await page.route(BLOCKED, (r) => r.abort())
    await page.route(/mzstatic\.com|discogs\.com/, (r) => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    await page.addInitScript((view) => { Date.prototype.toLocaleTimeString = () => '12:00:00 PM'; try { localStorage.clear(); localStorage.setItem('mjrp_inventory_view_mode', view) } catch { /* none */ } }, VIEW)
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 40000 })
    await page.waitForTimeout(2500)
    await page.addScriptTag({ content: `window.__stage = ${STAGE.toString()}` })
    await page.evaluate(() => window.router.navigate('/inventory'))
    await page.waitForTimeout(2500)
    await page.evaluate(() => window.__stage())
    await page.waitForTimeout(1500)
    await page.evaluate(() => document.querySelectorAll('#toast-container .toast').forEach(toast => toast.remove()))
    return { context, page, errors }
}

function pixelsApart(a, b) {
    const one = PNG.sync.read(a), two = PNG.sync.read(b)
    if (one.width !== two.width || one.height !== two.height) return { apart: Infinity, box: `size ${one.width}x${one.height} against ${two.width}x${two.height}` }
    let apart = 0, delta = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
    for (let i = 0; i < one.data.length; i += 4) {
        const d = Math.max(Math.abs(one.data[i] - two.data[i]), Math.abs(one.data[i + 1] - two.data[i + 1]), Math.abs(one.data[i + 2] - two.data[i + 2]))
        if (d) { apart++; delta = Math.max(delta, d); const x = (i / 4) % one.width, y = Math.floor(i / 4 / one.width); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    }
    return { apart, delta, box: apart ? `x ${x0}-${x1}, y ${y0}-${y1}` : '' }
}

const main = await open(mainBase)
const mine = await open(CONTROL ? mainBase : mineBase)
const read = (page) => page.evaluate(`(${NORMALIZE.toString()})()(document.getElementById('app'))`)
const [a, b] = [await read(main.page), await read(mine.page)]
note(`${TAG} · the inventory in #app: ${CONTROL ? 'main = main (control)' : 'this branch (the shell in React) = main'}`, a === b, a === b ? `${a.length} chars` : `\n main: ${a?.slice(0, 300)}\n mine: ${b?.slice(0, 300)}`)
const cards = await mine.page.evaluate(() => ({ items: document.querySelectorAll('.inv-tile, .inv-row, .inventory-card, [data-album-id], .album-card').length, text: document.getElementById('app').innerText.replace(/\s+/g, ' ').slice(0, 160) }))
note(`${TAG} · the inventory is drawn (cards, tiles or rows are on the page)`, cards.items > 0, `${cards.items} items · ${cards.text}`)
const [sa, sb] = [await main.page.screenshot({ animations: 'disabled', caret: 'hide' }), await mine.page.screenshot({ animations: 'disabled', caret: 'hide' })]
const { apart, delta, box } = pixelsApart(sa, sb)
note(`${TAG} · the pixels of the page`, apart === 0, apart === 0 ? '0 pixels apart' : `${apart} pixels apart (largest ${delta} of 255, ${box})`)
if (!CONTROL) {
    // this branch's page, cut to its first 1400 px (the whole page was compared above)
    const image = PNG.sync.read(sb)
    const height = Math.min(image.height, 1400)
    const cut = new PNG({ width: image.width, height })
    PNG.bitblt(image, cut, 0, 0, image.width, height, 0, 0)
    fs.writeFileSync(path.join(CAPTURES, `inventory-${TAG}.png`), PNG.sync.write(cut, { colorType: 2 }))
}
note(`${TAG} · no page error on this branch`, mine.errors.length === 0, mine.errors.join(' | '))
await browser.close()
const failed = results.filter(r => !r.ok)
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
fs.writeFileSync(path.join(OUT, 'raw', `inventory-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
