/**
 * F71 (UAT-220) - the window of an inventory item shows the album as the album load has it now.
 * The service asks the load through its one door, for every source the albums screen shows, so
 * the window and the albums screen show the same album.
 */
import { describe, it, expect, vi } from 'vitest'
import { InventoryService } from '../../../public/js/services/inventory/InventoryService.js'
import { ENRICHMENT_SOURCES } from '../../../public/js/models/albumLoadState.js'

const item = { id: 'inv-1', artist: 'Pink Floyd', title: 'The Dark Side of the Moon', year: 1973, albumData: { appleMusicId: '1065973699' } }
const make = (answer) => {
    const albumAsks = { albumsOf: vi.fn(async () => answer) }
    const service = new InventoryService({ store: {}, createRepository: () => ({}), albumAsks })
    return { service, albumAsks }
}

describe('InventoryService.albumOfItem', () => {
    it('asks the album load for the album of the item, with every source the albums screen shows', async () => {
        const album = { title: 'The Dark Side of the Moon' }
        const { service, albumAsks } = make({ albums: [album] })
        const signal = new AbortController().signal

        expect(await service.albumOfItem(item, { signal })).toBe(album)

        const request = albumAsks.albumsOf.mock.calls[0][0]
        expect(request.sources).toEqual([...ENRICHMENT_SOURCES])
        expect(request.sources).toContain('userRanking')
        expect(request.signal).toBe(signal)
        expect(request.series).toHaveLength(1)
        expect(request.series[0].id).toBe('inventory-album:inv-1')
        expect(request.series[0].albumQueries).toEqual([
            { artist: 'Pink Floyd', title: 'The Dark Side of the Moon', appleMusicId: '1065973699', year: 1973, coverUrl: null }
        ])
    })

    it('gives null when the load has no album to give', async () => {
        expect(await make({ albums: [] }).service.albumOfItem(item)).toBe(null)
        expect(await make({ aborted: true }).service.albumOfItem(item)).toBe(null)
    })
})
