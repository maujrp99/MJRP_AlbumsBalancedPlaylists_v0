/**
 * The world the inventory screen is asked in (F83 wave 6a): what stands OUTSIDE the screen, as stand-ins that write down every call
 * they get in `outside` (the service of the inventory, the value service of Discogs, the toast, the question dialog, the album load,
 * the two windows the screen opens: the album and the edit). The screen is the same code and the same controller under the
 * hand-made view and under the React screen, so the stand-ins are the same too.
 *
 * Read by `vi.mock` factories (test/support/inventoryScenarios.js is NOT imported here: a factory that imports the file that imports
 * the module it replaces hangs the test, lesson 12 of wave-lessons.md): this file imports nothing of the app but the store and the
 * models, which no test replaces.
 */
import { vi } from 'vitest'
import { inventoryStore } from '../../public/js/stores/inventory.js'
import { valuesOff } from '../helpers/inventoryValuesStub.js'

/** Every call the screen makes to what is outside it, in order: `[name, ...what]`. */
export const outside = []

/** A promise a scenario lets go of when it says so. */
export const held = () => {
    let release
    const promise = new Promise((resolve) => { release = resolve })
    return { promise, release }
}

const json = (value) => JSON.stringify(value)

/** What the scenario controls: the answers of the world, and the windows the screen opened. */
export const world = {
    values: valuesOff(),
    failUpdate: false,
    failRemove: false,
    /** what the question dialog answers; `gate` holds the answer until the scenario lets it go */
    confirm: { answer: true, gate: null },
    plan: null,
    seriesGate: null,
    addProgress: null,
    averagesGate: null,
    viewWindow: null,
    editWindow: null,
    reset() {
        this.values = valuesOff()
        this.failUpdate = false
        this.failRemove = false
        this.confirm = { answer: true, gate: null }
        this.plan = { toAdd: [{ artist: 'Cream', title: 'Disraeli Gears' }, { artist: 'Rush', title: 'Moving Pictures' }], skipped: [], alreadyThere: 1, repeated: 0, incomplete: 0, seriesCount: 2 }
        this.seriesGate = null
        this.addProgress = null
        this.averagesGate = null
        this.viewWindow = null
        this.editWindow = null
    }
}

const changeStore = (change) => inventoryStore.replaceAlbums(change(inventoryStore.getAlbums()))

export const inventoryService = {
    updateAlbum: vi.fn(async (id, updates) => {
        outside.push(['service.updateAlbum', id, json(updates)])
        if (world.failUpdate) throw new Error('the cloud refused')
        changeStore(albums => albums.map(album => (album.id === id ? { ...album, ...updates } : album)))
        return id
    }),
    removeAlbum: vi.fn(async (id) => {
        outside.push(['service.removeAlbum', id])
        if (world.failRemove) throw new Error('the cloud refused')
        changeStore(albums => albums.filter(album => album.id !== id))
    }),
    albumOfItem: vi.fn(async (item, options) => {
        outside.push(['service.albumOfItem', item.id, Boolean(options?.signal)])
        return null
    }),
    planSeriesAlbums: vi.fn(async (series) => {
        outside.push(['service.planSeriesAlbums', series.length])
        return world.plan
    }),
    addAlbumsAsNotOwned: vi.fn(async (albums, { onProgress }) => {
        outside.push(['service.addAlbumsAsNotOwned', albums.length])
        onProgress({ added: 0, total: albums.length })
        if (world.addProgress) await world.addProgress.promise
        onProgress({ added: 1, total: albums.length })
        return { added: albums.length, total: albums.length, error: null, reloaded: true }
    }),
    updateAverages: vi.fn(async ({ onProgress }) => {
        outside.push(['service.updateAverages'])
        onProgress({ phase: 'reading', done: 1, total: 31 })
        if (world.averagesGate) await world.averagesGate.promise
        onProgress({ phase: 'saving' })
        return { total: 31, planned: 31, saved: 31, error: null, aborted: false, covers: 0, notFound: 0, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0 }
    })
}

export const wiringModule = {
    inventoryService,
    readSeriesOfThePerson: vi.fn(async () => {
        outside.push(['service.readSeriesOfThePerson'])
        if (world.seriesGate) await world.seriesGate.promise
        return [{ id: 's1' }, { id: 's2' }]
    })
}

export const valuesModule = { inventoryValues: new Proxy({}, { get: (_, name) => world.values[name] }) }

export const loaderModule = { optimizedAlbumLoader: { load: vi.fn(async () => { outside.push(['albumLoader.load']) }) } }

const toast = {
    success: vi.fn((text) => { outside.push(['toast.success', text]) }),
    error: vi.fn((text) => { outside.push(['toast.error', text]) }),
    info: vi.fn((text) => { outside.push(['toast.info', text]) }),
    warning: vi.fn((text) => { outside.push(['toast.warning', text]) })
}
export const toastModule = { default: toast, toast }

export const dialogModule = {
    dialogService: {
        confirm: vi.fn(async (options) => {
            outside.push(['dialog.confirm', json(options)])
            if (world.confirm.gate) await world.confirm.gate.promise
            return world.confirm.answer
        })
    }
}

/** The windows the screen opens (screens/inventory/inventoryWindows): they write down what they were given and what the host answers when asked. */
export const windowsModule = {
    openInventoryView: vi.fn(async (item, options) => {
        outside.push(['window.view', item.id, Boolean(options.value), typeof options.loadAlbum])
        if (options.value) outside.push(['window.view.value', json(options.value.view())])
        await options.loadAlbum?.(new AbortController().signal)
        world.viewWindow = options
        return { redrawValue: () => { outside.push(['window.redrawValue']) } }
    }),
    openInventoryEdit: vi.fn(async (album, onSave) => {
        outside.push(['window.edit', album.id])
        world.editWindow = { album, onSave }
    })
}

/** The inventory the scenarios use: every status, a cover and none, a format and none, a value written, averages and none. */
export const ITEMS = () => [
    { id: 'owned', artist: 'Pink Floyd', title: 'The Dark Side of the Moon', owned: true, format: 'cd', purchasePrice: 60, currency: 'BRL', notes: 'a first press', addedToInventory: '2026-11-01T10:00:00.000Z', albumData: { id: 'pf-dsotm', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', coverUrl: 'https://covers.example/pf.jpg' }, averages: { rating: 88.2, popularity: 71.4, ratedTracks: 10, popTracks: 9, tracks: 12 } },
    { id: 'written', artist: 'Radiohead', title: 'OK Computer', owned: true, format: 'vinyl', value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, addedToInventory: '2026-11-02T10:00:00.000Z', albumData: { id: 'rh-okc', title: 'OK Computer', artist: 'Radiohead', coverUrl: 'https://covers.example/rh.jpg' }, averages: { rating: 91, popularity: 64.5, ratedTracks: 12, popTracks: 12, tracks: 12 } },
    { id: 'wanted', artist: 'Joni Mitchell', title: 'Hejira <b>', owned: null, format: 'vinyl', addedToInventory: '2026-11-03T10:00:00.000Z', coverUrl: 'https://covers.example/jm.jpg', albumData: { id: 'jm-hejira', title: 'Hejira <b>', artist: 'Joni Mitchell' } },
    { id: 'wished', artist: 'Yes', title: 'Fragile', owned: false, format: 'digital', addedToInventory: '2026-11-04T10:00:00.000Z', albumData: { id: 'yes-fragile', title: 'Fragile', artist: 'Yes', coverUrl: 'https://covers.example/yes.jpg' } },
    { id: 'bare', artist: 'Zappa', title: 'Apostrophe & Co', owned: true, albumData: { id: 'fz-apos', title: 'Apostrophe & Co', artist: 'Zappa' } }
]

/** `count` items for the phone's chunks of 50 and for the question that comes above 30 albums. */
export const manyItems = (count) => {
    const artists = ['ABBA', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen', 'Rush', 'Yes']
    return Array.from({ length: count }, (_, i) => ({
        id: `inv-${String(i).padStart(3, '0')}`,
        title: `Album ${i} <b>`,
        artist: artists[Math.floor(i * artists.length / count)],
        format: 'cd',
        owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
        albumData: { coverUrl: `https://covers.example/${i}.jpg` },
        averages: { rating: 80.5, popularity: 41.2, ratedTracks: 9, popTracks: 10, tracks: 10 }
    }))
}
