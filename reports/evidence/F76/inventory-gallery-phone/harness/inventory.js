// F89 harness: the REAL inventory screen (InventoryView, its controller, the renderers, the sheets, the phone shell and the
// stylesheets of the app, imported in the order app.js imports them) with fixture items, the Discogs values on and the rates of a
// day. Only the network is replaced: no Firebase, no server (standInWiring.js, fakeFirebase.js). Built with `vite build`
// (vite.build.config.mjs) so the stylesheets come in the order of the built site.
//   ?n=<items>          how many items (default 60)
//   ?view=none|grid|list  the choice kept in the browser before the screen opens (none: nothing kept)
//   ?keep=1             open with what the browser kept (to prove a choice survives a reload)
//   ?s=<scenario>       what is done after the screen opens: switch | status | more | search | wishlist
import '/public/css/index.css'
import '/public/css/tailwind.css'
import '/public/splash/bar-menu.css'
import '/public/css/top-menu.css'
import '/public/css/mobile.css'
import '/public/css/mobile/screens.css'
import '/public/css/safe-area.css'
import { inventoryStore } from '/public/js/stores/inventory.js'
import { InventoryView } from '/public/js/views/InventoryView.js'
import { startPhoneShell } from '/public/js/components/navigation/PhoneShell.js'

const params = new URLSearchParams(location.search)
const scenario = params.get('s') || ''
const count = Number(params.get('n') || 60)
const view = params.get('view') || 'none'
const keep = params.get('keep') === '1' // keep what the browser kept (a reload): nothing is cleared or set

const ARTISTS = ['ABBA', 'AC/DC', 'Aerosmith', 'Alice in Chains', 'Arctic Monkeys', 'Bad Company', 'Beastie Boys', 'Björk', 'Black Sabbath', 'Blur', 'Bob Dylan', 'Boston', 'Cream', 'David Bowie', 'Deep Purple', 'Genesis', 'Pink Floyd', 'Queen', 'Radiohead', 'Rush', 'The Beatles', 'U2', 'Yes']
const TITLES = ['Ten', 'Core', 'Purple', 'Moving Pictures', 'Rumours', 'Hounds of Love', 'Brothers in Arms', 'OK Computer', 'Disraeli Gears', 'The Dark Side of the Moon', 'Back in Black', 'Remain in Light', 'Physical Graffiti', 'Aja', 'Mezzanine', 'Dummy', 'Superunknown', 'Nevermind', 'Blue', 'Harvest', 'London Calling', 'Close to the Edge', 'Crime of the Century', 'Wish You Were Here']
const LONG_TITLE = 'In the Court of the Crimson King (An Observation by King Crimson) [Expanded and Remastered Edition]'

/** A cover drawn as an image: two colours of the album, no network. */
function cover(index) {
    const hue = (index * 47) % 360
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},60%,18%)"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="${20 + (index % 5) * 6}" cy="${24 + (index % 4) * 5}" r="${8 + (index % 3) * 4}" fill="rgba(255,255,255,.18)"/></svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Items in the order by artist. Item 0 has a long title and an artist of the same kind, item 1 has no cover, item 2 is a wishlist item. */
function items() {
    const list = []
    for (let i = 0; i < count; i++) {
        const artist = i === 0 ? 'ABBA and the Friends of the Court of the Crimson King (Live in Concert)' : ARTISTS[Math.floor(i * ARTISTS.length / count)]
        const title = i === 0 ? LONG_TITLE : TITLES[(i * 7) % TITLES.length]
        const owned = i === 2 || i % 11 === 3 ? false : (i % 6 === 1 ? null : true)
        list.push({
            id: `inv-${i}`, title, artist, format: i % 9 === 0 ? 'vinyl' : 'cd', owned,
            purchasePrice: null, currency: 'BRL', notes: '', addedAt: new Date(2025, 0, 1 + i).toISOString(),
            albumData: { id: `album-${i}`, title, artist, coverUrl: i === 1 ? null : cover(i) },
            averages: i % 8 === 7 ? null : { rating: 60 + ((i * 13) % 380) / 10, popularity: 20 + ((i * 17) % 600) / 10, ratedTracks: 9, popTracks: 10, tracks: 10 },
            ...(i % 13 === 4 ? { value: { amount: 18 + (i % 7), currency: 'USD', at: '2026-10-12T10:00:00Z' } } : {})
        })
    }
    return list
}

const fixtures = items()
window.__memory = fixtures.map(item => ({ ...item }))
window.__series = []

/** What the browser keeps of the Discogs readings: most albums, fresh; every fifth waits for a value. */
const readings = new Map(fixtures.filter((item, i) => i % 5 !== 2).map((item, i) => [item.id, {
    kind: 'found',
    release: { id: 5000000 + i, title: `${item.title}, Europe`, url: `https://www.discogs.com/release/${5000000 + i}` },
    conditions: { mint: 14 + (i % 9) * 1.5, nearMint: 11 + (i % 7), veryGoodPlus: 7 + (i % 5) },
    currency: 'USD',
    readAt: new Date().toISOString()
}]))

const service = {
    userId: 'harness',
    sourceState: async () => 'on',
    sellerSettingsMissing: () => false,
    rates: async () => ({ rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }),
    readingsOf: async (list) => new Map(list.filter(item => readings.has(item.id)).map(item => [item.id, readings.get(item.id)])),
    readItem: async () => ({ failure: 'other', waitMs: null, stops: false }),
    readMany: async (list) => ({ total: list.length, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false }),
    keepEditions: async () => { }
}

const fakeRouter = { afterNavigate() { } }
const fakeUser = { subscribe() { return () => { } }, getState: () => ({ currentUser: null }) }
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const click = (selector) => document.querySelector(selector)?.click()

const SCENARIOS = {
    switch: async () => { click('[data-phone-action="filters"]'); await wait(450) },
    status: async () => { click('.inv-tile__status, .inv-row__status'); await wait(450) },
    more: async () => { click('.inv-tile__more, .inv-row__more'); await wait(450) },
    search: async (screen) => { screen.controller.handleFilterChange('search', 'pink'); await wait(200) },
    wishlist: async (screen) => { screen.controller.handleStatusCount('wishlist'); await wait(200) }
}

async function main() {
    if (!keep) {
        try { localStorage.clear() } catch { /* nothing kept */ }
        if (view !== 'none') localStorage.setItem('mjrp_inventory_view_mode', view)
    }
    history.replaceState(null, '', `/inventory?s=${scenario}`)
    startPhoneShell({ router: fakeRouter, userStore: fakeUser, clearCaches() { } })
    inventoryStore.setAlbums(fixtures)
    const screen = new InventoryView()
    screen.controller.values.service = service
    window.inventoryView = screen
    const app = document.getElementById('app')
    app.textContent = ''
    app.appendChild(await screen.render({}))
    await screen.mount()
    await screen.controller.valuesOpened
    await wait(300)
    await SCENARIOS[scenario]?.(screen)
    document.body.dataset.ready = 'true'
}

main().catch(error => {
    console.error(error)
    document.body.dataset.ready = 'error'
})
