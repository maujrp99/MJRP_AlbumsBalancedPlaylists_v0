/**
 * F45 - the adapters between the load service and the real sources, each with doubles.
 */
import { describe, it, expect, vi } from 'vitest'
import { parseAlbumQuery } from '../../../public/js/models/albumQuery.js'
import { cloneAlbum } from '../../../public/js/models/cloneAlbum.js'
import { Album } from '../../../public/js/models/Album.js'
import { CatalogAdapter } from '../../../public/js/services/albums/adapters/CatalogAdapter.js'
import { AcclaimEnricher, PopularityEnricher, UserRankingEnricher } from '../../../public/js/services/albums/adapters/enrichers.js'
import { AlbumCacheAdapter, ALBUM_RECORD_PREFIX } from '../../../public/js/services/albums/adapters/AlbumCacheAdapter.js'
import { AlbumNotFoundError } from '../../../public/js/services/albums/AlbumLoadService.js'

const makeAlbum = (extra = {}) => new Album({
    id: 'artist_album', title: 'Album', artist: 'Artist',
    tracks: [{ id: 't1', title: 'One', position: 1 }, { id: 't2', title: 'Two', position: 2 }],
    ...extra
})
const snapshot = (album) => JSON.stringify(album)

describe('parseAlbumQuery', () => {
    it('reads "Artist - Title"', () => {
        expect(parseAlbumQuery('Pink Floyd - Animals')).toEqual({ artist: 'Pink Floyd', title: 'Animals' })
    })
    it('keeps a title with " - " inside whole (only the first separator counts)', () => {
        expect(parseAlbumQuery('Artist - Album - Deluxe')).toEqual({ artist: 'Artist', title: 'Album - Deluxe' })
    })
    it('reads the object form, and splits a title that carries the artist when artist is missing', () => {
        expect(parseAlbumQuery({ artist: 'A', title: 'B - C' })).toEqual({ artist: 'A', title: 'B - C' })
        expect(parseAlbumQuery({ title: 'A - B' })).toEqual({ artist: 'A', title: 'B' })
    })
    it('a hyphen without spaces is part of the name', () => {
        expect(parseAlbumQuery('Jay-Z - The Blueprint')).toEqual({ artist: 'Jay-Z', title: 'The Blueprint' })
    })
    it('survives an empty query', () => {
        expect(parseAlbumQuery(null)).toEqual({ artist: '', title: '' })
    })
})

describe('cloneAlbum', () => {
    it('gives a new Album with new Tracks of the same classes, sharing the tracks between its two lists', () => {
        const album = makeAlbum()
        album.tracksOriginalOrder = [...album.tracks]
        const copy = cloneAlbum(album)

        expect(copy).not.toBe(album)
        expect(copy).toBeInstanceOf(Album)
        expect(copy.tracks[0]).not.toBe(album.tracks[0])
        expect(copy.tracks[0].constructor).toBe(album.tracks[0].constructor)
        expect(copy.tracksOriginalOrder[0]).toBe(copy.tracks[0])
        expect(typeof copy.setUserRankings).toBe('function')
    })
})

describe('CatalogAdapter', () => {
    const appleHit = { id: 'apple-1', attributes: { name: 'Album', artistName: 'Artist' } }
    const details = {
        id: 'apple-1', title: 'Album', artist: 'Artist', year: 1977, artworkTemplate: 'tpl',
        tracks: [{ id: 'a2', title: 'Two', trackNumber: 2, duration: 100 }, { id: 'a1', title: 'One', trackNumber: 1, duration: 90 }]
    }
    const build = (overrides = {}) => new CatalogAdapter({
        musicKit: {
            searchAlbums: vi.fn(async () => [appleHit]),
            getAlbumDetails: vi.fn(async () => details),
            getArtworkUrl: vi.fn(() => 'https://cover/600'),
            ...overrides.musicKit
        },
        fetchFromServer: overrides.fetchFromServer || vi.fn(async () => { throw new Error('HTTP 404') }),
        retryWaitsMs: overrides.retryWaitsMs || [1, 1],
        generateAlbumId: ({ title, artist }) => `${artist}_${title}`.toLowerCase(),
        findLocalCover: overrides.findLocalCover
    })

    it('builds the album from Apple Music, with no ratings, the tracks in disc order and the series it is for', async () => {
        const album = await build().find('Artist - Album', { seriesId: 's1' })

        expect(album).toBeInstanceOf(Album)
        expect(album).toMatchObject({ id: 'artist_album', title: 'Album', artist: 'Artist', coverUrl: 'https://cover/600', seriesIds: ['s1'] })
        expect(album.tracksOriginalOrder.map(t => t.title)).toEqual(['One', 'Two'])
        expect(album.tracks.every(t => t.rating === null)).toBe(true)
    })

    it('searches with the artist and the whole title, even when the title has " - " inside', async () => {
        const adapter = build()
        await adapter.find('Artist - Album - Deluxe').catch(() => { })

        expect(adapter.musicKit.searchAlbums).toHaveBeenCalledWith('Artist', 'Album - Deluxe', 5)
    })

    it('falls to the second source when Apple Music has nothing', async () => {
        const fromServer = makeAlbum({ title: 'From Server' })
        const adapter = build({ musicKit: { searchAlbums: vi.fn(async () => []) }, fetchFromServer: vi.fn(async () => fromServer) })

        await expect(adapter.find('Artist - Album')).resolves.toBe(fromServer)
    })

    it('falls to the second source when what Apple Music found is not the album asked for', async () => {
        const fromServer = makeAlbum()
        const adapter = build({
            musicKit: { searchAlbums: vi.fn(async () => [{ id: 'x', attributes: { name: 'Something Else Entirely', artistName: 'Nobody' } }]) },
            fetchFromServer: vi.fn(async () => fromServer)
        })

        await expect(adapter.find('Artist - Album')).resolves.toBe(fromServer)
    })

    it('says "not found" when neither source has the album', async () => {
        const adapter = build({ musicKit: { searchAlbums: vi.fn(async () => []) } })

        await expect(adapter.find('Artist - Album')).rejects.toBeInstanceOf(AlbumNotFoundError)
    })

    it('says the search failed, not "not found", when Apple Music keeps failing, and never asks the paid second source', async () => {
        const fetchFromServer = vi.fn(async () => makeAlbum())
        const adapter = build({ musicKit: { searchAlbums: vi.fn(async () => { throw new Error('429') }) }, fetchFromServer })

        const error = await adapter.find('Artist - Album').catch(e => e)
        expect(error).not.toBeInstanceOf(AlbumNotFoundError)
        expect(error.message).toBe('429')
        expect(adapter.musicKit.searchAlbums).toHaveBeenCalledTimes(3)
        expect(fetchFromServer).not.toHaveBeenCalled()
    })

    it('tries Apple Music again after a failure and uses the answer when it comes', async () => {
        let calls = 0
        const adapter = build({ musicKit: { searchAlbums: vi.fn(async () => { if (calls++ === 0) throw new Error('429'); return [appleHit] }) } })

        await expect(adapter.find('Artist - Album')).resolves.toMatchObject({ title: 'Album' })
        expect(adapter.musicKit.searchAlbums).toHaveBeenCalledTimes(2)
    })
})

describe('enrichers', () => {
    it('AcclaimEnricher: applies the ratings to a copy, orders the tracks by rating, and leaves the album given untouched', async () => {
        const album = makeAlbum()
        const before = snapshot(album)
        const enricher = new AcclaimEnricher({
            requestRatings: vi.fn(async () => ({ any: 'data' })),
            applyRatings: (copy) => {
                copy.bestEverUrl = 'https://bea/1'
                copy.acclaim = { hasRatings: true }
                copy.tracks.find(t => t.title === 'Two').rating = 90
                copy.tracks.find(t => t.title === 'One').rating = 70
            }
        })

        const result = await enricher.enrich(album)

        expect(result.status).toBe('done')
        expect(result.album).not.toBe(album)
        expect(result.album.tracks.map(t => [t.title, t.rank])).toEqual([['Two', 1], ['One', 2]])
        expect(snapshot(album)).toBe(before)
    })

    it('AcclaimEnricher: "the source has no rating" is empty; a request that failed throws', async () => {
        const empty = new AcclaimEnricher({ requestRatings: async () => ({}), applyRatings: () => { } })
        const broken = new AcclaimEnricher({ requestRatings: async () => null, applyRatings: () => { } })

        await expect(empty.enrich(makeAlbum())).resolves.toMatchObject({ status: 'empty' })
        await expect(broken.enrich(makeAlbum())).rejects.toThrow('failed')
    })

    it('AcclaimEnricher: an album that already has its ratings is not asked for again', async () => {
        const requestRatings = vi.fn()
        const album = makeAlbum({ bestEverUrl: 'https://bea/1' })

        await expect(new AcclaimEnricher({ requestRatings, applyRatings: () => { } }).enrich(album)).resolves.toMatchObject({ status: 'done', album })
        expect(requestRatings).not.toHaveBeenCalled()
    })

    it('PopularityEnricher: done when Spotify data was applied, empty when not, never touching the album given', async () => {
        const album = makeAlbum()
        const before = snapshot(album)
        const connected = new PopularityEnricher({ applyPopularity: async (copy) => { copy.spotifyId = 'sp1'; copy.spotifyPopularity = 80 } })
        const notConnected = new PopularityEnricher({ applyPopularity: async () => { } })

        expect(await connected.enrich(album)).toMatchObject({ status: 'done', album: { spotifyId: 'sp1' } })
        expect((await notConnected.enrich(album)).status).toBe('empty')
        expect(snapshot(album)).toBe(before)
    })

    it('UserRankingEnricher: applies the ranking to a copy; empty with no user or no ranking', async () => {
        const album = makeAlbum()
        const before = snapshot(album)
        const ranked = new UserRankingEnricher({
            getUserId: () => 'u1',
            getRanking: async () => ({ rankings: [{ trackTitle: 'Two', userRank: 1 }] })
        })

        const result = await ranked.enrich(album)
        expect(result.status).toBe('done')
        expect(result.album.hasUserRanking).toBe(true)
        expect(result.album.tracks.find(t => t.title === 'Two').userRank).toBe(1)
        expect(snapshot(album)).toBe(before)

        expect((await new UserRankingEnricher({ getUserId: () => null, getRanking: vi.fn() }).enrich(album)).status).toBe('empty')
        expect((await new UserRankingEnricher({ getUserId: () => 'u1', getRanking: async () => null }).enrich(album)).status).toBe('empty')
    })
})

describe('AlbumCacheAdapter', () => {
    const build = (clock = { now: 1000 }) => {
        const backing = new Map()
        const cache = {
            get: vi.fn(async (key) => backing.get(key) ?? null),
            set: vi.fn(async (key, value) => { backing.set(key, value) }),
            invalidate: vi.fn(async (key) => { backing.delete(key) })
        }
        return { backing, clock, adapter: new AlbumCacheAdapter({ cache, createAlbum: (plain) => new Album(plain), now: () => clock.now }) }
    }

    it('keys the record by the query, the same for its text and object forms', async () => {
        const { adapter, backing } = build()
        await adapter.saveBase('Artist - Album', makeAlbum())

        expect([...backing.keys()]).toEqual([`${ALBUM_RECORD_PREFIX}artist - album`])
        expect(await adapter.get({ artist: 'Artist', title: 'Album' })).not.toBeNull()
    })

    it('hands out a new Album each time, for the series asked, with nothing enriched yet', async () => {
        const { adapter } = build()
        await adapter.saveBase('Artist - Album', makeAlbum())

        const first = await adapter.get('Artist - Album', { seriesId: 's1' })
        const second = await adapter.get('Artist - Album', { seriesId: 's2' })

        expect(first.album).toBeInstanceOf(Album)
        expect(first.album).not.toBe(second.album)
        expect(first.album.seriesIds).toEqual(['s1'])
        expect(first.enrichment).toEqual({})
    })

    it('remembers each source on its own, and stops trusting "empty" after an hour', async () => {
        const { adapter, clock } = build()
        const album = makeAlbum()
        await adapter.saveBase('Artist - Album', album)
        await adapter.saveEnrichment('Artist - Album', album, 'acclaim', 'done')
        await adapter.saveEnrichment('Artist - Album', album, 'popularity', 'empty')

        expect((await adapter.get('Artist - Album')).enrichment).toEqual({ acclaim: 'done', popularity: 'empty' })

        clock.now += 61 * 60 * 1000
        expect((await adapter.get('Artist - Album')).enrichment).toEqual({ acclaim: 'done' })
    })

    it('never saves the person\'s own ranking with the album', async () => {
        const { adapter, backing } = build()
        const album = makeAlbum()
        album.setUserRankings([{ trackTitle: 'One', userRank: 1 }])
        await adapter.saveBase('Artist - Album', album)
        await adapter.saveEnrichment('Artist - Album', album, 'userRanking', 'done')

        const stored = JSON.stringify([...backing.values()])
        expect(stored).not.toContain('userRank')
        expect((await adapter.get('Artist - Album')).enrichment).toEqual({})
    })

    it('answers null for a query it never saw', async () => {
        expect(await build().adapter.get('Nobody - Nothing')).toBeNull()
    })
})
