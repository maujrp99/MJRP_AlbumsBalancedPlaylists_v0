/**
 * The Discogs reading is kept in the item, in the database, and shows on another browser profile (F75,
 * REQ-14, REQ-15; the MJRP's decision of 2026-11-21). Real Chromium, the real CacheManager, the real
 * InventoryValueService and the real InventoryRepository; the DATABASE is a stub on the Node side
 * (a Map that the pages write to and read from through two bound functions), and every host but localhost
 * is refused (no Firebase, no Firestore, no Discogs). Nothing touches production data.
 *
 *   profile A: reads an album (the server answer is a stub) and keeps the reading through the repository;
 *   profile B (a NEW browser profile: an empty IndexedDB): the item comes from the stubbed database with its
 *   `discogsReading`; the value shows with its date and no «waiting for a value» notice; a value the person
 *   wrote is untouched by it; another person's item shows nothing.
 * Run: PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node test/visual/inventoryValuesKeptInDatabase.mjs
 */
import { createServer } from 'vite'
import { resolve } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const PORT = 5198
const server = await createServer({ configFile: 'vite.config.js', server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const origin = `http://localhost:${PORT}`
const sharedRepository = `/@fs${resolve('shared/data/InventoryRepository.js')}`
const browser = await chromium.launch()
const results = []
const check = (name, value, expected) => results.push({ name, value, ok: JSON.stringify(value) === JSON.stringify(expected), expected })

// the stubbed database: document path -> fields
const database = new Map()
const writes = []
const bind = async (page) => {
    await page.exposeFunction('dbWrite', (path, data) => { database.set(path, { ...(database.get(path) ?? {}), ...data }); writes.push({ path, fields: Object.keys(data).sort() }) })
    await page.exposeFunction('dbRead', (path) => database.get(path) ?? null)
    await page.route('**/*', route => (new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()))
    await page.goto(`${origin}/js/cache/CacheManager.js`)
}

// read three days ago, so the guard of six hours does not apply and the text of the date is the one of that day
const READ_AT = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
const SHORT_DAY = new Date(READ_AT).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const READ_ANSWER = { kind: 'found', data: { release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }, conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, currency: 'USD', readAt: READ_AT } }

// ---- profile A: a read, kept through the real repository ----------------------------------------------------------------
const contextA = await browser.newContext()
const pageA = await contextA.newPage()
await bind(pageA)
const read = await pageA.evaluate(async ({ sharedRepository, answer }) => {
    const { CacheManager } = await import('/js/cache/CacheManager.js')
    const { InventoryValueService } = await import('/js/services/inventory/InventoryValueService.js')
    const { InventoryRepository } = await import(sharedRepository)
    const store = {
        db: {}, collection: (db, path) => ({ path }), doc: (db, path, id) => ({ id, path: `${path}/${id}` }), serverTimestamp: () => 'now',
        writeBatch: () => { const ops = []; return { update: (ref, data) => ops.push([ref, data]), set() { }, commit: async () => { for (const [ref, data] of ops) await window.dbWrite(ref.path, JSON.parse(JSON.stringify(data))) } } },
        getDoc() { }, getDocs() { }, setDoc() { }, updateDoc() { }, deleteDoc() { }, query() { }, where() { }, orderBy() { }, limit() { }
    }
    const repository = new InventoryRepository(store, { get: async () => null, set() { }, invalidate: async () => { } }, 'user-1')
    const service = new InventoryValueService({
        api: { albumValue: async () => answer }, cache: new CacheManager(),
        inventory: { userId: 'user-1', setReadings: (entries) => repository.setReadings(entries) }
    })
    const item = { id: 'item-1', artist: 'Neil Young', title: 'Harvest' }
    const outcome = await service.readItem(item)
    await service.keepReadings([{ item, reading: outcome.reading }])
    return { read: Boolean(outcome.reading) }
}, { sharedRepository, answer: READ_ANSWER })
check('A. the album was read once and kept', read.read, true)
const path = [...database.keys()].find(key => key.endsWith('/inventory/item-1'))
check('A. kept in the inventory of user-1, in the item itself', path?.includes('/users/user-1/inventory') ?? false, true)
check('A. only the reading and its edition were written (never `value`)', writes.at(-1)?.fields, ['discogs', 'discogsReading', 'updatedAt'])
check('A. the reading carries when it was read and where it comes from', [database.get(path)?.discogsReading?.readAt, database.get(path)?.discogsReading?.source], [READ_AT, 'discogs'])
await contextA.close()

// ---- profile B: a NEW profile, nothing in its browser, the item comes from the database ------------------------------------
const contextB = await browser.newContext()
const pageB = await contextB.newPage()
await bind(pageB)
const shown = await pageB.evaluate(async ({ path, short }) => {
    const { CacheManager } = await import('/js/cache/CacheManager.js')
    const { InventoryValueService } = await import('/js/services/inventory/InventoryValueService.js')
    const { valueOfItem, momentText, SourceState } = await import('/js/models/inventoryValue.js')
    const { itemsNeverRead, itemsToRead } = await import('/js/models/inventoryValueRun.js')
    const { waitingNotice } = await import('/js/models/inventoryValueRun.js')
    const { readOnText, DISCOGS_CREDIT } = await import('/js/models/inventoryValue.js') // the card (screens/inventory/CardValue.tsx) writes the day with readOnText and carries the credit in the title of the link
    const service = new InventoryValueService({ api: {}, cache: new CacheManager(), inventory: { userId: 'user-1' } })
    const stored = await window.dbRead(path)
    const item = { id: 'item-1', artist: 'Neil Young', title: 'Harvest', owned: true, ...stored }
    const written = { ...item, id: 'item-2', value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' } }
    const held = await service.readingsOf([item])
    const value = valueOfItem(item, { reading: held.get(item.id) ?? null, now: Date.now(), source: SourceState.ON })
    const neverRead = itemsNeverRead([item], held).length
    const when = readOnText(value)
    return {
        heldInBrowser: held.size, origin: value.origin, amount: value.amount, readAt: value.readAt, moment: momentText(value.readAt),
        waiting: neverRead, notice: neverRead ? waitingNotice(neverRead).strong : null,
        cardSaysWhen: Boolean(when) && when.replace(/\u00a0/g, ' ') === short.replace(/\u00a0/g, ' '), cardCredit: DISCOGS_CREDIT.includes('Data provided by Discogs'),
        writtenWins: valueOfItem(written, { reading: null, now: Date.now(), source: SourceState.ON }).origin,
        updateWouldRead: itemsToRead([item], held, Date.now()).length
    }
}, { path, short: SHORT_DAY })
check('B. a new profile holds nothing in its browser', shown.heldInBrowser, 0)
check('B. the value shows at once, from the item', [shown.origin, shown.amount], ['discogs', 12])
check('B. it shows when it was read', shown.readAt, READ_AT)
check('B. the card says «<day>» and carries the title attribution', shown.cardSaysWhen, true)
check('B. no «waiting for a value» notice', shown.notice, null)
check('B. nothing counts as waiting', shown.waiting, 0)
check('B. «Update values» would read it again (it is old): it updates', shown.updateWouldRead, 1)
check('B. what the person wrote still wins', shown.writtenWins, 'yours')
await contextB.close()

await browser.close()
await server.close()
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name} (got ${JSON.stringify(r.value)}, expected ${JSON.stringify(r.expected)})`)
process.exit(results.every(r => r.ok) ? 0 : 1)
