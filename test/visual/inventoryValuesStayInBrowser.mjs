/**
 * Where a read Discogs value lives in the browser, and for how long (F75, investigation 2026-11-21).
 * Real Chromium, the real CacheManager (memory + IndexedDB) and the real InventoryValueService; only
 * the server call is a stub, and every host but localhost is refused (no Firebase, no Firestore, no Discogs).
 * Also (UAT-267): "Clear Cache" clears the album caches by name and keeps the readings and the rates.
 * Run: PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node test/visual/inventoryValuesStayInBrowser.mjs
 */
import { createServer } from 'vite'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const server = await createServer({ configFile: 'vite.config.js', server: { port: 5199, strictPort: true }, logLevel: 'error' })
await server.listen()
const origin = 'http://localhost:5199'
const browser = await chromium.launch()
const results = []
const check = (name, value, expected) => results.push({ name, value, ok: value === expected, expected })

const open = async (context) => {
    const page = await context.newPage()
    await page.route('**/*', route => (new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()))
    await page.goto(`${origin}/js/cache/CacheManager.js`)
    return page
}

/** Builds the real service on the page; `at` moves its clock, `user` is who is signed in. */
const probe = (page, { at = 0, user = 'user-1', action }) => page.evaluate(async ({ at, user, action }) => {
    const { CacheManager } = await import('/js/cache/CacheManager.js')
    const { InventoryValueService } = await import('/js/services/inventory/InventoryValueService.js')
    const { clearAlbumCaches } = await import('/js/services/albums/clearAlbumCaches.js')
    let calls = 0
    const api = { albumValue: async () => { calls++; return { kind: 'found', data: { release: { id: 1, title: 'R', url: 'u' }, conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, currency: 'USD' } } } }
    const cache = new CacheManager()
    const service = new InventoryValueService({ api, cache, inventory: { userId: user }, now: () => Date.now() + at })
    const item = { id: 'item-1', artist: 'A', title: 'T' }
    if (action === 'read') await service.readItem(item)
    const albumKeys = ['albumload:v1:q', 'userRanking:user-1:album-1', 'artifacts/app/users/user-1/inventory:album_1', 'spotify_enrichment:a-b']
    if (action === 'seed-albums') {
        for (const key of albumKeys) await cache.set(key, { kept: true })
        await cache.set('exchangerates:v1', { day: 'today', data: { rates: { BRL: 5 }, date: 'today' } })
    }
    if (action === 'clear') await clearAlbumCaches({ loadService: { stop() { } }, cache, storage: localStorage })
    const kept = await service.readingsOf([item])
    // what the inventory screen would show and ask for: the value of the item, and the "waiting for a value" notice
    const { valueOfItem, SourceState } = await import('/js/models/inventoryValue.js')
    const { itemsToRead, waitingNotice } = await import('/js/models/inventoryValueRun.js')
    const now = Date.now() + at
    const shown = valueOfItem(item, { reading: kept.get(item.id) ?? null, now, source: SourceState.ON })
    const waiting = itemsToRead([item], kept, now).length
    const albumsLeft = []
    for (const key of albumKeys) if ((await cache.peek(key)) !== null) albumsLeft.push(key)
    return {
        found: kept.size, calls, storage: localStorage.length + sessionStorage.length,
        shownOrigin: shown.origin, waiting, notice: waiting ? waitingNotice(waiting).strong : null,
        albumsLeft: albumsLeft.length, rates: (await cache.peek('exchangerates:v1')) !== null
    }
}, { at, user, action })

const HOUR = 3600 * 1000
const context = await browser.newContext()
let page = await open(context)
check('a. read once: stored, 1 call', (await probe(page, { action: 'read' })).found, 1)
await page.reload()
const afterReload = await probe(page, {})
check('a. after a reload of the page: still found', afterReload.found, 1)
check('a. nothing in localStorage/sessionStorage (it is IndexedDB)', afterReload.storage, 0)
await page.close()
page = await open(context)
check('a. tab closed, a new tab in the same browser: still found', (await probe(page, {})).found, 1)
check('a. 5h59 later: still found', (await probe(page, { at: 5 * HOUR + 59 * 60000 })).found, 1)
check('b. other person on the same browser: not found', (await probe(page, { user: 'user-2' })).found, 0)
check('a. 6h01 later: gone', (await probe(page, { at: 6 * HOUR + 60000 })).found, 0)
await page.close()
const other = await browser.newContext()
const otherPage = await open(other)
check('d. another browser/device (a new profile): nothing', (await probe(otherPage, {})).found, 0)
await otherPage.close()
page = await open(context)
await probe(page, { action: 'read' })
await probe(page, { action: 'seed-albums' })
const cleared = await probe(page, { action: 'clear' })
check('F75. after the footer "Clear Cache": the read value is still there', cleared.found, 1)
check('F75. after "Clear Cache": the album, ranking, Spotify and repository caches are cleared', cleared.albumsLeft, 0)
check('F75. after "Clear Cache": the exchange rates stay', cleared.rates, true)
await page.reload()
const afterClear = await probe(page, {})
check('F75. Clear Cache then reload: the value is still shown', afterClear.shownOrigin, 'discogs')
check('F75. Clear Cache then reload: no "waiting for a value" notice', afterClear.notice, null)
check('F75. Clear Cache then reload: nothing waits to be read', afterClear.waiting, 0)
check('F75. the kept value still expires by itself at six hours', (await probe(page, { at: 6 * HOUR + 60000 })).found, 0)

await browser.close()
await server.close()
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name} (got ${r.value}, expected ${r.expected})`)
process.exit(results.every(r => r.ok) ? 0 : 1)
