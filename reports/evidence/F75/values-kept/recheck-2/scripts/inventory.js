// Judge harness (F75 values kept): the REAL inventory screen, controller, InventoryService,
// InventoryRepository (its validation included), InventoryValueService and the app's browser cache.
// Replaced: Firebase (empty module), the Firestore functions (an in-memory store keyed by path), and
// the server's value calls (valueSources, exchangeRates, albumValue). Nothing leaves 127.0.0.1.
import '/public/css/index.css'
import '/public/css/tailwind.css'
import '/public/css/mobile.css'
import '/public/css/mobile/screens.css'
import '/public/css/safe-area.css'
import { InventoryView } from '/public/js/views/InventoryView.js'
import { startPhoneShell } from '/public/js/components/navigation/PhoneShell.js'
import { inventoryService } from '/public/js/services/inventory/inventoryWiring.js'
import { inventoryValues } from '/public/js/services/inventory/inventoryValueWiring.js'
import { InventoryRepository } from '/shared/data/InventoryRepository.js'

const H = (window.__h = { writes: [], failed: [], asks: 0, mode: window.__MODE || 'ok' })
const READ_AT = '2026-11-18T14:05:00.000Z'
const kept = (extra = {}) => ({
    source: 'discogs', kind: 'found', basis: null, lowest: null, forSale: null, currency: 'USD',
    release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
    conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, readAt: READ_AT, ...extra
})
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue},50%,35%)"/></svg>`)}`
const item = (id, artist, title, hue, extra = {}) => ({
    id, artist, title, format: 'cd', owned: true, purchasePrice: null, currency: 'BRL', notes: 'keep me', addedAt: '2026-01-01T00:00:00Z', _schemaVersion: 1,
    albumData: { id: `album-${id}`, title, artist, coverUrl: cover(hue) },
    averages: { rating: 78.4, popularity: 42.6, ratedTracks: 9, popTracks: 10, tracks: 10 }, ...extra
})
const SEEDS = {
    kept: () => [
        item('a', 'Neil Young', 'Harvest', 30, { discogsReading: kept() }),
        item('b', 'Pink Floyd', 'Animals', 200, { discogsReading: kept({ conditions: { mint: 24, nearMint: 19, veryGoodPlus: 14 } }) }),
        item('c', 'Joni Mitchell', 'Hejira', 120, { owned: null, discogsReading: kept({ conditions: null, basis: 'lowest_for_sale', lowest: { value: 12.93, currency: 'USD' }, forSale: 37 }) }),
        item('d', 'Yes', 'Fragile', 300, { owned: false, discogsReading: { source: 'discogs', kind: 'not_found', basis: null, conditions: null, lowest: null, forSale: null, currency: null, release: null, readAt: READ_AT } }),
        item('e', 'Radiohead', 'OK Computer', 60, { value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, discogsReading: kept() }),
        item('f', 'Caravan', 'In the Land of Grey and Pink', 250),
        item('g', 'Genesis', 'Selling England by the Pound', 330)
    ],
    allKept: () => SEEDS.kept().map(d => (d.discogsReading || d.value ? d : { ...d, discogsReading: kept() })),
    // no Discogs field at all: what main and the branch must draw the same
    plain: () => [
        item('a', 'Neil Young', 'Harvest', 30),
        item('b', 'Pink Floyd', 'Animals', 200),
        item('c', 'Joni Mitchell', 'Hejira', 120, { owned: null }),
        item('e', 'Radiohead', 'OK Computer', 60, { value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' } }),
        item('f', 'Caravan', 'In the Land of Grey and Pink', 250)
    ]
}
const seedName = window.__SEED || 'kept'
const ANON = 'anonymous-user'
const docs = new Map() // full path -> data
const pathOf = (ref) => `${ref.path}/${ref.id}`
SEEDS[seedName]().forEach(d => docs.set(`artifacts/mjrp-albums/users/${ANON}/inventory/${d.id}`, d))
H.docs = docs
H.dump = () => Object.fromEntries([...docs].map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]))
let n = 0
const store = {
    db: {},
    collection: (db, path) => ({ path, kind: 'collection' }),
    doc: (a, b, c) => (c !== undefined ? { path: b, id: c } : { path: a.path, id: `new${++n}` }),
    getDoc: async (ref) => ({ id: ref.id, exists: () => docs.has(pathOf(ref)), data: () => docs.get(pathOf(ref)) }),
    getDocs: async (q) => {
        const base = (q && q.path) || q
        const list = [...docs].filter(([k]) => k.startsWith(`${base}/`) && !k.slice(base.length + 1).includes('/'))
        return { docs: list.map(([k, v]) => ({ id: k.split('/').pop(), data: () => v })), size: list.length, empty: list.length === 0 }
    },
    setDoc: async (ref, data, opt) => { docs.set(pathOf(ref), opt?.merge ? { ...(docs.get(pathOf(ref)) || {}), ...data } : { ...data }); H.writes.push({ op: 'set', path: pathOf(ref), keys: Object.keys(data) }) },
    updateDoc: async (ref, data) => {
        if (!docs.has(pathOf(ref))) throw new Error('not-found')
        docs.set(pathOf(ref), { ...docs.get(pathOf(ref)), ...data }); H.writes.push({ op: 'update', path: pathOf(ref), keys: Object.keys(data) })
    },
    deleteDoc: async (ref) => { docs.delete(pathOf(ref)) },
    query: (c) => c, where: () => ({}), orderBy: () => ({}), limit: () => ({}),
    writeBatch: () => {
        const ops = []
        return {
            update: (ref, data) => ops.push(['update', ref, data]),
            set: (ref, data, opt) => ops.push(['set', ref, data, opt]),
            delete: (ref) => ops.push(['delete', ref]),
            commit: async () => {
                await new Promise(r => setTimeout(r, H.commitDelay || 0))
                if (H.failCommit) { H.failed.push(ops.length); throw new Error('commit refused (harness)') }
                for (const [op, ref] of ops) if (op === 'update' && !docs.has(pathOf(ref))) throw new Error(`not-found ${pathOf(ref)}`)
                for (const [op, ref, data, opt] of ops) {
                    if (op === 'update') docs.set(pathOf(ref), { ...docs.get(pathOf(ref)), ...data })
                    if (op === 'set') docs.set(pathOf(ref), opt?.merge ? { ...(docs.get(pathOf(ref)) || {}), ...data } : { ...data })
                    if (op === 'delete') docs.delete(pathOf(ref))
                    H.writes.push({ op: `batch-${op}`, path: pathOf(ref), keys: Object.keys(data || {}) })
                }
            }
        }
    },
    serverTimestamp: () => 'SERVER_TS'
}
inventoryService.createRepository = (uid) => new InventoryRepository(store, null, uid)
inventoryService.repository = null

let seq = 0
const sleep = (ms, signal) => new Promise(resolve => { const t = setTimeout(() => resolve(true), ms); signal?.addEventListener('abort', () => { clearTimeout(t); resolve(false) }) })
inventoryValues.mayAsk = () => true
inventoryValues.api = {
    valueSources: async () => ({ kind: 'found', data: { discogs: 'on' } }),
    exchangeRates: async () => ({ kind: 'found', data: { rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' } }),
    albumValue: async (ask, { signal } = {}) => {
        H.asks++
        const i = ++seq
        const ok = await sleep(H.mode === 'slow' ? 1500 : 250, signal)
        if (!ok) return { kind: 'failed', code: 'dropped' }
        if (H.mode === 'fail' || (H.mode === 'failAfter1' && i > 1)) return { kind: 'failed', code: 'upstream_failed' }
        if (H.mode === 'tokenAfter1' && i > 1) return { kind: 'failed', code: 'upstream_unauthorized' }
        if (H.mode === 'invalid1' && i === 1) return { kind: 'found', data: { release: { id: 'bad-id', title: ask.title, url: 'https://www.discogs.com/release/1' }, conditions: { mint: 30, nearMint: 26, veryGoodPlus: 20 }, currency: 'USD' } }
        if (H.mode === 'lowest') return { kind: 'found', data: { kind: 'lowest_for_sale', release: { id: 7000 + i, title: ask.title, url: 'https://www.discogs.com/release/' + (7000 + i) }, lowest: { value: 11.5, currency: 'USD' }, forSale: 12 } }
        return { kind: 'found', data: { release: { id: 7000 + i, title: `${ask.title} CD`, url: `https://www.discogs.com/release/${7000 + i}` }, conditions: { mint: 30, nearMint: 26, veryGoodPlus: 20 }, currency: 'USD' } }
    }
}
H.inventoryService = inventoryService
H.inventoryValues = inventoryValues

const fakeRouter = { afterNavigate() { } }
const fakeUser = { subscribe() { return () => { } }, getState: () => ({ currentUser: null }) }
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    try { localStorage.clear() } catch { /* nothing */ }
    history.replaceState(null, '', '/inventory')
    startPhoneShell({ router: fakeRouter, userStore: fakeUser, clearCaches() { } })
    await inventoryService.loadAlbums()
    const view = new InventoryView()
    H.view = view
    const app = document.getElementById('app')
    app.textContent = ''
    app.appendChild(await view.render({}))
    await view.mount()
    await view.controller.valuesOpened
    await wait(400)
    document.body.dataset.ready = 'true'
}
main().catch(error => { console.error(error); document.body.dataset.ready = 'error' })
