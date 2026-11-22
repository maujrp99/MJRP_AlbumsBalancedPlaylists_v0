// F75 (REQ-14, REQ-16) harness: the REAL inventory screen (InventoryView, its controller, the card
// renderer, the album window, the phone shell and every stylesheet of the app) in a browser PROFILE
// WITH NOTHING IN IT: no reading in the browser cache. The readings come only from the items, as a
// stubbed database gives them (`discogsReading`, kept three days ago). Only the network is replaced:
// no Firebase, no Firestore, no server, no Discogs.
// ?s=cards | window | window-lowest | window-none | notice
import '/public/css/index.css'
import '/public/css/tailwind.css'
import '/public/css/mobile.css'
import '/public/css/mobile/screens.css'
import '/public/css/safe-area.css'
import { inventoryStore } from '/public/js/stores/inventory.js'
import { InventoryView } from '/public/js/views/InventoryView.js'
import { startPhoneShell } from '/public/js/components/navigation/PhoneShell.js'

const scenario = new URLSearchParams(location.search).get('s') || 'cards'
const DAY = 24 * 60 * 60 * 1000
const kept = (days, extra) => ({
    source: 'discogs', kind: 'found', basis: null, lowest: null, forSale: null, currency: 'USD',
    release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
    conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 },
    readAt: new Date(Date.now() - days * DAY).toISOString(),
    ...extra
})
const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},60%,18%)"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/></svg>`)}`
const item = (id, artist, title, hue, extra = {}) => ({
    id, artist, title, format: 'cd', owned: true, purchasePrice: null, currency: 'BRL', notes: '', addedAt: '2026-01-01T00:00:00Z',
    albumData: { id: `album-${id}`, title, artist, coverUrl: cover(hue) },
    averages: { rating: 78.4, popularity: 42.6, ratedTracks: 9, popTracks: 10, tracks: 10 },
    ...extra
})

// What the stubbed database returns: readings kept by an earlier read, on another device
const fixtures = [
    item('a', 'Neil Young', 'Harvest', 30, { discogsReading: kept(3) }),
    item('b', 'Pink Floyd', 'Animals', 200, { discogsReading: kept(3, { conditions: { mint: 24, nearMint: 19, veryGoodPlus: 14 } }) }),
    item('c', 'Joni Mitchell', 'Hejira', 120, { owned: null, discogsReading: kept(3, { conditions: null, basis: 'lowest_for_sale', lowest: { value: 12.93, currency: 'USD' }, forSale: 37 }) }),
    item('d', 'Yes', 'Fragile', 300, { owned: false, discogsReading: { source: 'discogs', kind: 'not_found', readAt: new Date(Date.now() - 3 * DAY).toISOString() } }),
    item('e', 'Radiohead', 'OK Computer', 60, { value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, discogsReading: kept(3) }),
    item('f', 'Caravan', 'In the Land of Grey and Pink', 250, scenario === 'window-none' || scenario === 'notice' ? {} : { discogsReading: kept(40) })
]

const service = {
    userId: 'harness',
    sourceState: async () => 'on',
    sellerSettingsMissing: () => false,
    rates: async () => ({ rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }),
    readingsOf: async () => new Map(), // a new browser profile: nothing held
    readItem: async () => ({ failure: 'other', waitMs: null, stops: false }),
    readMany: async (list) => ({ total: list.length, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false }),
    keepReadings: async () => { }
}

const fakeRouter = { afterNavigate() { } }
const fakeUser = { subscribe() { return () => { } }, getState: () => ({ currentUser: null }) }
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    try { localStorage.clear() } catch { /* nothing kept */ }
    history.replaceState(null, '', `/inventory?s=${scenario}`)
    startPhoneShell({ router: fakeRouter, userStore: fakeUser, clearCaches() { } })
    inventoryStore.setAlbums(fixtures)
    const view = new InventoryView()
    view.controller.values.service = service
    const app = document.getElementById('app')
    app.textContent = ''
    app.appendChild(await view.render({}))
    await view.mount()
    await view.controller.valuesOpened
    await wait(300)
    if (scenario.startsWith('window')) {
        const which = { window: 'a', 'window-none': 'f', 'window-lowest': 'c' }[scenario]
        await view.handleViewWithModal(which)
        await wait(400)
    }
    document.body.dataset.ready = 'true'
}

main().catch(error => {
    console.error(error)
    document.body.dataset.ready = 'error'
})
