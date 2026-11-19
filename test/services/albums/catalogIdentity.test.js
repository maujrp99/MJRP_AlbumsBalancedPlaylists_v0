/**
 * F55, slice 1 - the Apple Music lookup accepts only the album asked for (UAT-184), by the one
 * identity rule; a stored id that no longer leads to the album asked for is not obeyed.
 * Slice 2 - the album says by which reason of the rule it was accepted (`metadata.identityReason`),
 * and a title the catalog only has with a subtitle is accepted by the rule's second tier.
 */
import { describe, it, expect, vi } from 'vitest'
import { Album } from '../../../public/js/models/Album.js'
import { askedAlbum, appleCandidate, spotifyCandidate, localCandidate } from '../../../public/js/models/askedAlbum.js'
import { CatalogAdapter } from '../../../public/js/services/albums/adapters/CatalogAdapter.js'
import { AlbumNotFoundError } from '../../../public/js/services/albums/AlbumLoadService.js'

const STP = 'Stone Temple Pilots'
const hit = (id, name, releaseDate) => ({ id, attributes: { name, artistName: STP, releaseDate } })
const detailsOf = (id, title, year, artist = STP) => ({
    id, title, artist, year, artworkTemplate: 'tpl',
    tracks: [{ id: `${id}-1`, title: 'One', trackNumber: 1, duration: 90 }]
})
const CATALOG = {
    'apple-core': detailsOf('apple-core', 'Core', '1992'),
    'apple-core-deluxe': detailsOf('apple-core-deluxe', 'Core (Super Deluxe Edition)', '2017'),
    'apple-shangri': detailsOf('apple-shangri', 'Shangri-La Dee Da', '2001'),
    'apple-unledded': detailsOf('apple-unledded', 'No Quarter: Jimmy Page & Robert Plant Unledded', '1994', 'Jimmy Page & Robert Plant'),
    'apple-clarksdale': detailsOf('apple-clarksdale', 'Walking Into Clarksdale', '1998', 'Jimmy Page & Robert Plant'),
    'apple-wall': detailsOf('apple-wall', 'The Wall', '1979', 'Pink Floyd'),
    'apple-wall-berlin': detailsOf('apple-wall-berlin', 'The Wall: Live in Berlin', '1990', 'Pink Floyd')
}

const build = ({ search = [], fetchFromServer } = {}) => {
    const musicKit = {
        searchAlbums: vi.fn(async () => search),
        getAlbumDetails: vi.fn(async (id) => {
            if (!CATALOG[id]) throw Object.assign(new Error('404'), { status: 404 })
            return CATALOG[id]
        }),
        getArtworkUrl: vi.fn(() => 'https://cover/600')
    }
    const adapter = new CatalogAdapter({
        musicKit,
        fetchFromServer: fetchFromServer || vi.fn(async () => null),
        retryWaitsMs: [1],
        generateAlbumId: ({ title, artist }) => `${artist}_${title}`.toLowerCase()
    })
    return { adapter, musicKit }
}

describe('the album asked for, read from a query', () => {
    it('is the artist and the title of the query, with its year when the query has one', () => {
        expect(askedAlbum('Stone Temple Pilots - Core')).toEqual({ artist: STP, title: 'Core', year: null })
        expect(askedAlbum({ artist: STP, title: 'Core', year: 1992, appleMusicId: 'x' })).toEqual({ artist: STP, title: 'Core', year: 1992 })
        expect(askedAlbum({ title: 'Page &amp; Plant - No Quarter' })).toEqual({ artist: 'Page & Plant', title: 'No Quarter', year: null })
    })

    it('each source is read into the same three fields', () => {
        expect(appleCandidate(hit('a', 'Core', '1992-09-29'))).toEqual({ artist: STP, title: 'Core', year: '1992-09-29' })
        expect(spotifyCandidate({ name: 'Raising Sand', release_date: '2007-10-23', artists: [{ name: 'Robert Plant' }, { name: 'Alison Krauss' }] }))
            .toEqual({ artist: 'Robert Plant & Alison Krauss', title: 'Raising Sand', year: '2007-10-23' })
        expect(localCandidate({ artist: STP, album: 'Core', year: '1992' })).toEqual({ artist: STP, title: 'Core', year: '1992' })
        expect(appleCandidate(null)).toEqual({ artist: undefined, title: undefined, year: undefined })
    })
})

describe('CatalogAdapter: the search by name', () => {
    it('«Core» asked for, «Shangri-La Dee Da» first in the results: loads «Core»', async () => {
        const { adapter, musicKit } = build({ search: [hit('apple-shangri', 'Shangri-La Dee Da'), hit('apple-core', 'Core')] })

        const album = await adapter.find('Stone Temple Pilots - Core')

        expect(album).toBeInstanceOf(Album)
        expect(album.title).toBe('Core')
        expect(musicKit.getAlbumDetails).toHaveBeenCalledWith('apple-core')
        expect(musicKit.getAlbumDetails).not.toHaveBeenCalledWith('apple-shangri')
    })

    it('only other albums of the artist in the results: Apple Music does not have it, and with no second source the album is "not found"', async () => {
        const fetchFromServer = vi.fn(async () => null)
        const { adapter, musicKit } = build({ search: [hit('apple-shangri', 'Shangri-La Dee Da')], fetchFromServer })

        await expect(adapter.find('Stone Temple Pilots - Core')).rejects.toBeInstanceOf(AlbumNotFoundError)
        expect(musicKit.getAlbumDetails).not.toHaveBeenCalled()
        expect(fetchFromServer).toHaveBeenCalledTimes(1)
    })

    it('the plain album comes before its edition, and the edition is taken when it is all there is', async () => {
        const both = build({ search: [hit('apple-core-deluxe', 'Core (Super Deluxe Edition)'), hit('apple-core', 'Core')] })
        const onlyEdition = build({ search: [hit('apple-core-deluxe', 'Core (Super Deluxe Edition)')] })

        expect((await both.adapter.find('Stone Temple Pilots - Core')).title).toBe('Core')
        expect((await onlyEdition.adapter.find('Stone Temple Pilots - Core')).title).toBe('Core (Super Deluxe Edition)')
    })
})

describe('CatalogAdapter: the id the series has stored', () => {
    const stored = (appleMusicId, title = 'Core') => ({ artist: STP, title, year: 1992, appleMusicId })

    it('leads to the album asked for: loaded by the id, in one call, with no search', async () => {
        const { adapter, musicKit } = build()

        const album = await adapter.find(stored('apple-core'))

        expect(album.title).toBe('Core')
        expect(musicKit.searchAlbums).not.toHaveBeenCalled()
        expect(album.metadata).toEqual({ source: 'Apple Music', sourceId: 'apple-core', identityReason: 'exact-title' })
    })

    it('leads to an edition of the album asked for: that edition is the one the person chose', async () => {
        const { adapter, musicKit } = build()

        const album = await adapter.find(stored('apple-core-deluxe'))

        expect(album.title).toBe('Core (Super Deluxe Edition)')
        expect(musicKit.searchAlbums).not.toHaveBeenCalled()
    })

    it('leads to ANOTHER album: the id is not obeyed, the album is searched by name, and the result says the id was replaced', async () => {
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        const { adapter, musicKit } = build({ search: [hit('apple-shangri', 'Shangri-La Dee Da'), hit('apple-core', 'Core')] })

        const album = await adapter.find(stored('apple-shangri'))

        expect(album.title).toBe('Core')
        expect(musicKit.searchAlbums).toHaveBeenCalledWith(STP, 'Core', 5)
        expect(album.metadata).toEqual({ source: 'Apple Music', sourceId: 'apple-core', identityReason: 'exact-title', replacedSourceId: 'apple-shangri' })
        quiet.mockRestore()
    })

    it('leads to another album and the search has none: "not found", never the album of the stale id', async () => {
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        const { adapter } = build({ search: [hit('apple-shangri', 'Shangri-La Dee Da')] })

        await expect(adapter.find(stored('apple-shangri'))).rejects.toBeInstanceOf(AlbumNotFoundError)
        quiet.mockRestore()
    })

    it('is gone (404) and the album is found by name: the result says the id was replaced', async () => {
        const { adapter } = build({ search: [hit('apple-core', 'Core')] })

        const album = await adapter.find(stored('gone-1'))

        expect(album.metadata.replacedSourceId).toBe('gone-1')
    })
})

describe('CatalogAdapter: the catalog only has the title with a subtitle (the rule\'s second tier)', () => {
    const PAGE_PLANT = 'Jimmy Page & Robert Plant'
    const by = (artist) => (id, name) => ({ id, attributes: { name, artistName: artist } })
    const pagePlant = by(PAGE_PLANT)
    const floyd = by('Pink Floyd')
    const UNLEDDED = 'No Quarter: Jimmy Page & Robert Plant Unledded'

    it('«Jimmy Page & Robert Plant - No Quarter»: loads the only «No Quarter: …» of the catalog, and the album says how it was accepted', async () => {
        const { adapter } = build({ search: [pagePlant('apple-clarksdale', 'Walking Into Clarksdale'), pagePlant('apple-unledded', UNLEDDED)] })

        const album = await adapter.find('Jimmy Page & Robert Plant - No Quarter')

        expect(album.title).toBe(UNLEDDED)
        expect(album.metadata).toEqual({ source: 'Apple Music', sourceId: 'apple-unledded', identityReason: 'title-before-subtitle' })
    })

    it('never when the album asked for is there: «The Wall» loads «The Wall», not «The Wall: Live in Berlin»', async () => {
        const { adapter } = build({ search: [floyd('apple-wall-berlin', 'The Wall: Live in Berlin'), floyd('apple-wall', 'The Wall')] })

        const album = await adapter.find('Pink Floyd - The Wall')

        expect(album.metadata).toMatchObject({ sourceId: 'apple-wall', identityReason: 'exact-title' })
    })

    it('two albums with the title before a subtitle: Apple Music does not have it (the person chooses, F57)', async () => {
        const fetchFromServer = vi.fn(async () => null)
        const { adapter, musicKit } = build({
            search: [floyd('apple-wall-berlin', 'The Wall: Live in Berlin'), floyd('apple-wall-movie', 'The Wall: The Movie')],
            fetchFromServer
        })

        await expect(adapter.find('Pink Floyd - The Wall')).rejects.toBeInstanceOf(AlbumNotFoundError)
        expect(musicKit.getAlbumDetails).not.toHaveBeenCalled()
    })

    it('a stored id that leads to the subtitled album is not believed alone: the search decides, and nothing is "replaced" when it ends on the same id', async () => {
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        const query = { artist: PAGE_PLANT, title: 'No Quarter', appleMusicId: 'apple-unledded' }
        const alone = build({ search: [pagePlant('apple-unledded', UNLEDDED)] })

        const album = await alone.adapter.find(query)

        expect(alone.musicKit.searchAlbums).toHaveBeenCalledTimes(1)
        expect(album.metadata).toEqual({ source: 'Apple Music', sourceId: 'apple-unledded', identityReason: 'title-before-subtitle' })
        quiet.mockRestore()
    })

    it('a stored id that leads to «The Wall: Live in Berlin» loses to «The Wall» when the catalog has it', async () => {
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        const { adapter } = build({ search: [floyd('apple-wall-berlin', 'The Wall: Live in Berlin'), floyd('apple-wall', 'The Wall')] })

        const album = await adapter.find({ artist: 'Pink Floyd', title: 'The Wall', appleMusicId: 'apple-wall-berlin' })

        expect(album.metadata).toEqual({ source: 'Apple Music', sourceId: 'apple-wall', identityReason: 'exact-title', replacedSourceId: 'apple-wall-berlin' })
        quiet.mockRestore()
    })
})
