/**
 * F55, slice 2 - adding and removing an album of a series ask the one identity rule which query
 * of the series is "this album". Removing used to match a text query by "the query contains the
 * title and the artist", and adding by "the query contains the title": «Core» removed «Core
 * Memories», and «Core Memories» in a series kept «Core» from being added.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const repository = vi.hoisted(() => ({ update: vi.fn(async () => { }) }))
vi.mock('../../public/js/repositories/SeriesRepository.js', () => ({ SeriesRepository: vi.fn().mockImplementation(() => repository) }))

import { SeriesService } from '../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

const STP = 'Stone Temple Pilots'
const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }

describe('SeriesService: which query of the series is this album (the one identity rule)', () => {
    let service
    const withQueries = (albumQueries) => albumSeriesStore.setSeries([{ id: 's1', name: 'Grunge Rock - Classics', albumQueries }])
    const queriesNow = () => albumSeriesStore.getById('s1').albumQueries

    beforeEach(() => {
        vi.clearAllMocks()
        albumSeriesStore.reset()
        service = new SeriesService({}, 'user-1', storage, { handleUserChange: vi.fn() })
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    describe('removeAlbumFromSeries', () => {
        it('removes the query that asked for the album, not one that contains its title', async () => {
            withQueries(['Stone Temple Pilots - Core Memories', 'Stone Temple Pilots - Core', 'Pearl Jam - Ten'])

            await service.removeAlbumFromSeries('s1', { id: 'a1', title: 'Core', artist: STP })

            expect(queriesNow()).toEqual(['Stone Temple Pilots - Core Memories', 'Pearl Jam - Ten'])
            expect(repository.update).toHaveBeenCalledWith('s1', expect.objectContaining({ albumQueries: queriesNow() }))
        })

        it('finds the query of an album that was loaded as an edition, with other case, accents or "&amp;"', async () => {
            withQueries([
                { artist: STP, title: 'Core', appleMusicId: 'apple-core' },
                { artist: 'Page &amp; Plant', title: 'Walking Into Clarksdale' },
                'beyoncé - lemonade'
            ])

            await service.removeAlbumFromSeries('s1', { id: 'a1', title: 'Core (Remastered)', artist: STP })
            await service.removeAlbumFromSeries('s1', { id: 'a2', title: 'Walking into Clarksdale', artist: 'Page & Plant' })
            await service.removeAlbumFromSeries('s1', { id: 'a3', title: 'Lemonade', artist: 'Beyonce' })

            expect(queriesNow()).toEqual([])
        })

        it('between a query for the album and a query for an edition of it, takes the one with the album\'s own title', async () => {
            withQueries([{ artist: STP, title: 'Core' }, { artist: STP, title: 'Core (Deluxe Edition)' }])

            await service.removeAlbumFromSeries('s1', { id: 'a1', title: 'Core (Deluxe Edition)', artist: STP })

            expect(queriesNow()).toEqual([{ artist: STP, title: 'Core' }])
        })

        it('finds the query of an album a load accepted by the second tier of the rule, and of no other subtitled album', async () => {
            withQueries(['Jimmy Page & Robert Plant - No Quarter', 'Pink Floyd - The Wall'])
            const unledded = { id: 'a1', title: 'No Quarter: Jimmy Page & Robert Plant Unledded', artist: 'Jimmy Page & Robert Plant', metadata: { identityReason: 'title-before-subtitle' } }

            await service.removeAlbumFromSeries('s1', unledded)
            expect(queriesNow()).toEqual(['Pink Floyd - The Wall'])

            await expect(service.removeAlbumFromSeries('s1', { id: 'a2', title: 'The Wall: Live in Berlin', artist: 'Pink Floyd' }))
                .rejects.toThrow('Could not find album "The Wall: Live in Berlin" in series')
            expect(queriesNow()).toEqual(['Pink Floyd - The Wall'])
        })

        it('a query that keeps the id of the album is that album, whatever its text (legacy `id`, legacy `album`)', async () => {
            withQueries([{ id: 'a9', album: 'Whatever Was Typed' }, { artist: STP, album: 'Purple' }])

            await service.removeAlbumFromSeries('s1', { id: 'a9', title: 'Core', artist: STP })
            await service.removeAlbumFromSeries('s1', { id: 'a2', title: 'Purple', artist: STP })

            expect(queriesNow()).toEqual([])
        })

        it('the same title by another artist, or another album of the artist, is not found, and nothing is removed', async () => {
            withQueries(['Persefone - Core', 'Stone Temple Pilots - Purple'])

            await expect(service.removeAlbumFromSeries('s1', { id: 'a1', title: 'Core', artist: STP }))
                .rejects.toThrow('Could not find album "Core" in series')
            expect(queriesNow()).toEqual(['Persefone - Core', 'Stone Temple Pilots - Purple'])
            expect(repository.update).not.toHaveBeenCalled()
        })
    })

    describe('addAlbumToSeries', () => {
        it('adds «Core» to a series that has «Core Memories»: one title containing the other is not the same album', async () => {
            withQueries(['Stone Temple Pilots - Core Memories'])

            await service.addAlbumToSeries('s1', { id: 'a1', title: 'Core', artist: STP })

            expect(queriesNow()).toEqual(['Stone Temple Pilots - Core Memories', { id: 'a1', title: 'Core', artist: STP }])
        })

        it('does not add the album the series already asks for, however the query writes it', async () => {
            withQueries(['stone temple pilots - core', { artist: 'Beyoncé', title: 'Lemonade' }])

            await service.addAlbumToSeries('s1', { id: 'a1', title: 'Core', artist: STP })
            await service.addAlbumToSeries('s1', { id: 'a2', title: 'LEMONADE', artist: 'Beyonce' })

            expect(queriesNow()).toHaveLength(2)
            expect(repository.update).not.toHaveBeenCalled()
        })

        it('an edition is something else to ask for: «Core (Deluxe Edition)» is added beside «Core»', async () => {
            withQueries([{ artist: STP, title: 'Core' }])

            await service.addAlbumToSeries('s1', { id: 'a2', title: 'Core (Deluxe Edition)', artist: STP })

            expect(queriesNow()).toHaveLength(2)
        })
    })
})
