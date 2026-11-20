// F76 TASK-07 harness: the REAL inventory screen (InventoryView, its controller, the renderers,
// the sheets, the phone shell and every stylesheet of the app) with 211 fixture items, the Discogs
// values on and the rates of a day. Only the network is replaced: no Firebase, no server.
// ?s=list | empty | filtered | loading | reading | status | item | filters | actions | jump | edit
import '/public/css/index.css'
import '/public/css/tailwind.css'
import '/public/css/mobile.css'
import '/public/css/mobile/screens.css'
import '/public/css/safe-area.css'
import { inventoryStore } from '/public/js/stores/inventory.js'
import { InventoryView } from '/public/js/views/InventoryView.js'
import { startPhoneShell } from '/public/js/components/navigation/PhoneShell.js'

const scenario = new URLSearchParams(location.search).get('s') || 'list'

const ARTISTS = ['ABBA', 'AC/DC', 'Aerosmith', 'Alice in Chains', 'Arctic Monkeys', 'Bad Company', 'Beastie Boys', 'Björk', 'Black Sabbath', 'Blur', 'Bob Dylan', 'Boston', 'Bruce Springsteen', 'Cream', 'Creedence Clearwater Revival', 'David Bowie', 'Deep Purple', 'Depeche Mode', 'Dire Straits', 'Elton John', 'Elvis Costello', 'Fleetwood Mac', 'Foo Fighters', 'Genesis', 'Godspeed You! Black Emperor', 'Guns N\' Roses', 'Heart', 'Iron Maiden', 'Jethro Tull', 'Joni Mitchell', 'Kate Bush', 'King Crimson', 'Kiss', 'Led Zeppelin', 'Lynyrd Skynyrd', 'Massive Attack', 'Metallica', 'Neil Young', 'Nirvana', 'Oasis', 'Pearl Jam', 'Pink Floyd', 'Portishead', 'Queen', 'Radiohead', 'Rush', 'Soundgarden', 'Steely Dan', 'Stone Temple Pilots', 'Supertramp', 'Talking Heads', 'The Beatles', 'The Clash', 'The Cure', 'The Doors', 'The Police', 'The Rolling Stones', 'The Smiths', 'The Who', 'Tom Petty and the Heartbreakers', 'U2', 'Van Halen', 'Velvet Underground', 'Weezer', 'Yes', 'ZZ Top']
const TITLES = ['Ten', 'Core', 'Purple', 'Moving Pictures', 'Rumours', 'Hounds of Love', 'In the Court of the Crimson King (An Observation by King Crimson)', 'Brothers in Arms', 'OK Computer', 'Disraeli Gears', 'The Dark Side of the Moon', 'Back in Black', 'Remain in Light', 'Lift Your Skinny Fists Like Antennas to Heaven!', 'Physical Graffiti', 'Aja', 'Mezzanine', 'Dummy', 'Superunknown', 'Nevermind', 'Unplugged in New York', 'Blue', 'Harvest', 'Who\'s Next', 'London Calling', 'Close to the Edge', 'Songs from the Big Chair', 'Crime of the Century', 'Wish You Were Here', 'Sgt. Pepper\'s Lonely Hearts Club Band']

/** A cover drawn as an image: two colours of the album, no network. */
function cover(index) {
    const hue = (index * 47) % 360
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},60%,18%)"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="${20 + (index % 5) * 6}" cy="${24 + (index % 4) * 5}" r="${8 + (index % 3) * 4}" fill="rgba(255,255,255,.18)"/></svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** 211 items: 157 Owned, 35 Not Owned, 19 Wishlist, three artists each about, some long titles. */
function items() {
    const list = []
    for (let i = 0; i < 211; i++) {
        const artist = ARTISTS[Math.floor(i * ARTISTS.length / 211)]
        const title = TITLES[(i * 7) % TITLES.length]
        const owned = i % 11 === 3 ? false : (i % 6 === 1 ? null : true)
        const item = {
            id: `inv-${i}`, title, artist, format: i % 9 === 0 ? 'vinyl' : 'cd', owned,
            purchasePrice: null, currency: 'BRL', notes: '', addedAt: new Date(2025, 0, 1 + i).toISOString(),
            albumData: { id: `album-${i}`, title, artist, coverUrl: i % 37 === 5 ? null : cover(i) },
            averages: i % 8 === 7 ? null : { rating: 60 + ((i * 13) % 380) / 10, popularity: 20 + ((i * 17) % 600) / 10, ratedTracks: 9, popTracks: 10, tracks: 10 }
        }
        if (i % 13 === 4) item.value = { amount: 18 + (i % 7), currency: 'USD', at: '2026-10-12T10:00:00Z' }
        list.push(item)
    }
    return list
}

const fixtures = scenario === 'empty' ? [] : items()

/** What the browser keeps of the Discogs readings: most albums, fresh. */
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
    rates: async () => ({ rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }),
    readingsOf: async (list) => new Map(list.filter(item => readings.has(item.id)).map(item => [item.id, readings.get(item.id)])),
    readItem: async () => ({ failure: 'other', waitMs: null, stops: false }),
    readMany: async (list) => ({ total: list.length, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false }),
    keepEditions: async () => { }
}

const fakeRouter = { afterNavigate() { } }
const fakeUser = { subscribe() { return () => { } }, getState: () => ({ currentUser: null }) }

async function main() {
    // each scenario starts from nothing kept: «brl» writes the currency (localStorage)
    try { localStorage.clear() } catch { /* nothing kept */ }
    history.replaceState(null, '', `/inventory?s=${scenario}`)
    startPhoneShell({ router: fakeRouter, userStore: fakeUser, clearCaches() { } })
    inventoryStore.setAlbums(fixtures)
    const view = new InventoryView()
    view.controller.values.service = service
    window.inventoryView = view
    const app = document.getElementById('app')
    app.textContent = ''
    app.appendChild(await view.render({}))
    await view.mount()
    await view.controller.valuesOpened
    await new Promise(resolve => setTimeout(resolve, 200))
    await SCENARIOS[scenario]?.(view)
    document.body.dataset.ready = 'true'
}

const click = (selector) => document.querySelector(selector)?.click()
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const SCENARIOS = {
    filtered: (view) => view.controller.handleFilterChange('search', 'zzzz no album'),
    loading: (view) => { view.controller.state.isLoading = true; view.controller.refresh() },
    reading: (view) => {
        view.controller.values.run = { busy: true, text: 'Reading values… 86 of 211', count: 86 }
        view.controller._drawValues()
        view.controller.refresh()
    },
    status: () => click('.inv-row:nth-child(2) .inv-row__status'),
    item: () => click('.inv-row:nth-child(1) .inv-row__more'),
    filters: () => click('[data-phone-action="filters"]'),
    actions: () => click('[data-phone-action="actions"]'),
    jump: () => click('[data-phone-action="jump"]'),
    edit: async (view) => { await view.handleEditWithModal('inv-0'); await wait(300) },
    pressed: (view) => view.controller.handleStatusCount('wishlist'),
    brl: (view) => view.controller.handleCurrencyChoice('BRL')
}

main().catch(error => {
    console.error(error)
    document.body.dataset.ready = 'error'
})
