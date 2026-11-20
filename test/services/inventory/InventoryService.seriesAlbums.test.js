/**
 * F71 (S-54) - "add the albums of my series", in the service: the plan is made against the
 * inventory the cloud holds, the write goes in parts, the store is told once at the end, and a
 * part that fails is said (the parts before it stay; running again adds only the rest).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InventoryService, SERIES_WRITE_SIZE } from '../../../public/js/services/inventory/InventoryService.js'
import { InventoryStore } from '../../../public/js/stores/inventory.js'

/** A repository that keeps what it is given, as the cloud would. */
const createCloud = (items = []) => {
    const cloud = {
        items: [...items],
        failAtWrite: null,
        writes: 0,
        findAll: vi.fn(async () => [...cloud.items]),
        addBatch: vi.fn(async (albums) => {
            cloud.writes += 1
            if (cloud.writes === cloud.failAtWrite) throw new Error('offline')
            const made = albums.map((album, index) => ({
                id: `inv-${cloud.items.length + index}`, title: album.title, artist: album.artist, owned: null, format: null, albumData: album
            }))
            cloud.items.push(...made)
            return made.map(item => item.id)
        }),
        addAlbum: vi.fn(async () => 'new-id')
    }
    return cloud
}

const seriesOf = (count, name = 'Big') => [{
    id: name,
    name,
    albumQueries: Array.from({ length: count }, (_, index) => ({ artist: `Artist ${index}`, title: `Album ${index}`, appleMusicId: String(1000 + index), year: 1990, coverUrl: null }))
}]

describe('InventoryService: the albums of the series', () => {
    let store, service, cloud, quiet

    const build = (items) => {
        cloud = createCloud(items)
        store = new InventoryStore()
        service = new InventoryService({ store, createRepository: () => cloud })
    }

    beforeEach(() => {
        quiet = [vi.spyOn(console, 'log').mockImplementation(() => { }), vi.spyOn(console, 'error').mockImplementation(() => { })]
        build([])
    })
    afterEach(() => quiet.forEach(spy => spy.mockRestore()))

    it('plans against the inventory of the cloud, not the one on screen, and writes nothing', async () => {
        build([{ id: 'inv-0', title: 'Album 0', artist: 'Artist 0', owned: true, albumData: { id: 'artist-0_album-0' } }])
        store.setAlbums([]) // the screen knows nothing yet

        const plan = await service.planSeriesAlbums(seriesOf(3))

        expect(plan.toAdd.map(album => album.title)).toEqual(['Album 1', 'Album 2'])
        expect(plan.alreadyThere).toBe(1)
        expect(cloud.addBatch).not.toHaveBeenCalled()
    })

    it('a plan that cannot read the inventory fails: nothing is guessed', async () => {
        cloud.findAll.mockRejectedValueOnce(new Error('offline'))

        await expect(service.planSeriesAlbums(seriesOf(3))).rejects.toThrow('offline')
    })

    it('writes the albums in parts, says the progress after each, and tells the store only at the end', async () => {
        const plan = await service.planSeriesAlbums(seriesOf(SERIES_WRITE_SIZE * 2 + 30))
        const notified = vi.fn()
        store.subscribe(notified)
        const progress = []

        const result = await service.addAlbumsAsNotOwned(plan.toAdd, { onProgress: step => progress.push({ ...step, notifiedSoFar: notified.mock.calls.length }) })

        expect(result).toEqual({ added: 230, total: 230, error: null, reloaded: true })
        expect(cloud.addBatch.mock.calls.map(call => call[0].length)).toEqual([100, 100, 30])
        expect(progress).toEqual([
            { added: 100, total: 230, notifiedSoFar: 0 },
            { added: 200, total: 230, notifiedSoFar: 0 },
            { added: 230, total: 230, notifiedSoFar: 0 }
        ])
        // one read at the end: "reading" and "read", whatever the number of albums
        expect(notified).toHaveBeenCalledTimes(2)
        expect(store.getAlbums()).toHaveLength(230)
        expect(store.getAlbums().every(item => item.owned === null)).toBe(true)
    })

    it('items that were there are not written again or changed: the write only creates', async () => {
        const mine = { id: 'inv-0', title: 'Album 0', artist: 'Artist 0', owned: true, purchasePrice: 80, currency: 'BRL', format: 'vinyl', notes: 'mint', albumData: { id: 'artist-0_album-0' } }
        build([mine])

        const plan = await service.planSeriesAlbums(seriesOf(3))
        await service.addAlbumsAsNotOwned(plan.toAdd)

        expect(cloud.items[0]).toEqual(mine)
        expect(cloud.addBatch.mock.calls.flatMap(call => call[0]).map(album => album.title)).toEqual(['Album 1', 'Album 2'])
        expect(store.getAlbums()).toHaveLength(3)
    })

    it('a part that fails stops the run: the answer says how many went in, and the screen shows them', async () => {
        cloud.failAtWrite = 2
        const plan = await service.planSeriesAlbums(seriesOf(250))

        const result = await service.addAlbumsAsNotOwned(plan.toAdd)

        expect(result).toEqual({ added: 100, total: 250, error: 'offline', reloaded: true })
        expect(cloud.addBatch).toHaveBeenCalledTimes(2) // the third part is not tried
        expect(store.getAlbums()).toHaveLength(100)
    })

    it('running it again after a failure adds only the rest', async () => {
        cloud.failAtWrite = 2
        const all = seriesOf(250)
        await service.addAlbumsAsNotOwned((await service.planSeriesAlbums(all)).toAdd)

        const again = await service.planSeriesAlbums(all)
        const result = await service.addAlbumsAsNotOwned(again.toAdd)

        expect(again.toAdd).toHaveLength(150)
        expect(again.alreadyThere).toBe(100)
        expect(result).toMatchObject({ added: 150, total: 150, error: null })
        expect(new Set(cloud.items.map(item => item.albumData.id)).size).toBe(250) // each album once
        expect((await service.planSeriesAlbums(all)).toAdd).toEqual([])
    })

    it('when the first part fails nothing went in, and the inventory is not read again', async () => {
        cloud.failAtWrite = 1
        const plan = await service.planSeriesAlbums(seriesOf(5))
        cloud.findAll.mockClear()

        const result = await service.addAlbumsAsNotOwned(plan.toAdd)

        expect(result).toEqual({ added: 0, total: 5, error: 'offline', reloaded: true })
        expect(cloud.findAll).not.toHaveBeenCalled()
    })

    it('says so when the albums went in but the inventory could not be read again', async () => {
        const plan = await service.planSeriesAlbums(seriesOf(5))
        cloud.findAll.mockRejectedValueOnce(new Error('offline'))

        expect(await service.addAlbumsAsNotOwned(plan.toAdd)).toEqual({ added: 5, total: 5, error: null, reloaded: false })
    })

    it('the person changed during the write: the inventory of who arrived is not replaced by this read', async () => {
        const plan = await service.planSeriesAlbums(seriesOf(5))
        const other = createCloud([{ id: 'theirs', title: 'Theirs', artist: 'Them' }])
        cloud.addBatch.mockImplementationOnce(async () => { service.repository = other })

        const result = await service.addAlbumsAsNotOwned(plan.toAdd)

        expect(result).toMatchObject({ added: 5, reloaded: false })
        expect(cloud.findAll).toHaveBeenCalledTimes(1) // the plan only
    })
})

describe('InventoryService.addAlbum after the series went in (the album cards)', () => {
    let service, cloud, quiet

    beforeEach(async () => {
        quiet = [vi.spyOn(console, 'log').mockImplementation(() => { }), vi.spyOn(console, 'error').mockImplementation(() => { })]
        cloud = createCloud([])
        service = new InventoryService({ store: new InventoryStore(), createRepository: () => cloud })
        const plan = await service.planSeriesAlbums([{ name: 'Grunge', albumQueries: [{ artist: 'Stone Temple Pilots', title: 'Core', appleMusicId: '1440863531' }] }])
        await service.addAlbumsAsNotOwned(plan.toAdd)
    })
    afterEach(() => quiet.forEach(spy => spy.mockRestore()))

    it('refuses the loaded album of a series entry: it is already there', async () => {
        const loaded = { id: 'stone-temple-pilots_core', title: 'Core', artist: 'Stone Temple Pilots', tracks: [] }

        await expect(service.addAlbum(loaded, 'cd')).rejects.toThrow('Album already in inventory')
        expect(cloud.addAlbum).not.toHaveBeenCalled()
    })

    it('refuses an edition of it too, though the id the app gave it is another one', async () => {
        const loaded = { id: 'stone-temple-pilots_core-super-deluxe-edition', title: 'Core (Super Deluxe Edition)', artist: 'Stone Temple Pilots', tracks: [] }

        await expect(service.addAlbum(loaded, 'vinyl')).rejects.toThrow('Album already in inventory')
        expect(cloud.addAlbum).not.toHaveBeenCalled()
    })

    it('adds another album as before', async () => {
        const loaded = { id: 'pearl-jam_ten', title: 'Ten', artist: 'Pearl Jam', tracks: [] }

        await expect(service.addAlbum(loaded, 'cd', { notes: 'x' })).resolves.toBe('new-id')
        expect(cloud.addAlbum).toHaveBeenCalledWith(loaded, 'cd', { notes: 'x' })
    })
})
