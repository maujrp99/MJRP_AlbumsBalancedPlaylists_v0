/**
 * F74 (UAT-221) - in the app, what a source says of a track reaches the track it is of, by the one
 * track rule (shared/trackIdentity.js, through models/sameTrack.js):
 *   the ratings the server answered, written on the album     helpers/BEAEnrichmentHelper.js
 *   the popularity Spotify answered, written on the album     helpers/SpotifyEnrichmentHelper.js
 *   the two orders of an album merged for the comparison      models/albumAverages.js
 * And the ratings an older rule decided are asked for again, once, with nobody pressing anything
 * (services/albums/adapters/AlbumCacheAdapter.js).
 */
import { describe, it, expect } from 'vitest'
import { Album } from '../../../public/js/models/Album.js'
import { applyBEAData } from '../../../public/js/helpers/BEAEnrichmentHelper.js'
import { applySpotifyData } from '../../../public/js/helpers/SpotifyEnrichmentHelper.js'
import { averagesOfAlbum, mergedTracksOf } from '../../../public/js/models/albumAverages.js'
import { AcclaimEnricher } from '../../../public/js/services/albums/adapters/enrichers.js'
import { AlbumCacheAdapter } from '../../../public/js/services/albums/adapters/AlbumCacheAdapter.js'
import { sourceOutcome } from '../../../public/js/models/albumSourceAsk.js'
import { entryOfEachTrack, TRACK_IDENTITY_RULE_VERSION } from '../../../public/js/models/sameTrack.js'

const CRIMSON = [
    '21st Century Schizoid Man (Including "Mirrors")',
    'I Talk to the Wind',
    'Epitaph (Including "March for No Reason" and "Tomorrow and Tomorrow")',
    'Moonchild (Including "The Dream" and "The Illusion")',
    'The Court of the Crimson King (Including "The Return of the Fire Witch" and "The Dance of the Puppets")',
    '21st Century Schizoid Man (Radio Version)',
    'I Talk to the Wind (Duo Version)',
    'A Man a City (Live at the Fillmore West)'
]
const RATINGS = [93, 90, 93, 82, 93, null, null, null]
const PAGE = 'https://www.besteveralbums.com/thechart.php?a=1169#tracks'

const crimson = (extra = {}) => new Album({
    id: 'kc', title: 'In the Court of the Crimson King (Expanded Edition)', artist: 'King Crimson',
    tracks: CRIMSON.map((title, index) => ({ id: `t${index + 1}`, title, position: index + 1 })),
    ...extra
})
/** What the server answers for the album: one row per track asked for, in the order asked. */
const answerOf = (ratings = RATINGS) => ({
    bestEverInfo: { albumId: '1169', url: PAGE, evidenceCount: 5 },
    trackRatings: CRIMSON.map((title, index) => ({ title, rating: ratings[index] })),
    trackEvidence: CRIMSON.map((title, index) => ({ title, evidence: ratings[index] === null ? [] : [{ source: 'BestEverAlbums', score: ratings[index], votes: null, url: PAGE }] })),
    trackRule: TRACK_IDENTITY_RULE_VERSION
})
const ratingsIn = (tracks) => Object.fromEntries(tracks.map(track => [track.title, track.rating]))

describe('the ratings the server answered, written on the album', () => {
    it('each track gets the rating of its own row: the extra «(Duo Version)» does not take the 90 of the original', () => {
        const album = crimson()

        applyBEAData(album, answerOf())

        expect(ratingsIn(album.tracksOriginalOrder)).toEqual(Object.fromEntries(CRIMSON.map((title, index) => [title, RATINGS[index]])))
        expect(ratingsIn(album.tracks)).toEqual(ratingsIn(album.tracksOriginalOrder))
        expect(album.bestEverUrl).toBe(PAGE)
        expect(album.acclaim).toMatchObject({ hasRatings: true, source: 'best-ever-albums' })
    })

    it('the tracks by acclaim are ordered by rating, the unrated after, each with its rank', () => {
        const album = crimson()

        applyBEAData(album, answerOf())

        expect(album.tracks.map(track => [track.rank, track.rating, track.title.slice(0, 12)])).toEqual([
            [1, 93, '21st Century'], [2, 93, 'Epitaph (Inc'], [3, 93, 'The Court of'], [4, 90, 'I Talk to th'], [5, 82, 'Moonchild (I'],
            [6, null, '21st Century'], [7, null, 'I Talk to th'], [8, null, 'A Man a City']
        ])
    })

    it('a rating an older answer left on a track is taken away when the answer of today says the track has none', () => {
        const album = crimson()
        applyBEAData(album, answerOf([null, 90, null, null, null, null, 90, null])) // what the rule of before F74 gave

        applyBEAData(album, answerOf())

        expect(album.tracksOriginalOrder.find(track => track.title === 'I Talk to the Wind (Duo Version)').rating).toBeNull()
        expect(averagesOfAlbum(album)).toMatchObject({ rating: 90.2, ratedTracks: 5, tracks: 8 })
    })

    it('the evidence of a track goes with its rating', () => {
        const album = crimson()

        applyBEAData(album, answerOf())

        const byTitle = Object.fromEntries(album.tracksOriginalOrder.map(track => [track.title, track.ranking?.evidence ?? null]))
        expect(byTitle['I Talk to the Wind']).toEqual([{ source: 'BestEverAlbums', score: 90, votes: null, url: PAGE }])
        expect(byTitle['I Talk to the Wind (Duo Version)']).toBeNull()
    })

    it('an answer with no page and no ratings changes nothing', () => {
        const album = crimson()

        applyBEAData(album, { bestEverInfo: null })
        applyBEAData(album, { bestEverInfo: null, trackRatings: CRIMSON.map(title => ({ title, rating: null })) })

        expect(album.bestEverUrl).toBeUndefined()
        expect(album.acclaim?.hasRatings).toBeFalsy()
        expect(album.tracks.every(track => track.rating === null)).toBe(true)
    })
})

describe('the two orders of an album, merged for the comparison and the averages', () => {
    it('the track in album order gets what the acclaim order knows of the same track, not of another with the same words outside the brackets', () => {
        const album = crimson()
        applyBEAData(album, answerOf())

        const merged = mergedTracksOf(album)

        expect(merged.map(track => track.title)).toEqual(CRIMSON)
        expect(merged.map(track => track.rating)).toEqual(RATINGS)
        expect(averagesOfAlbum(album)).toEqual({ rating: 90.2, popularity: null, ratedTracks: 5, popTracks: 0, tracks: 8 })
    })

    it('two tracks of one title keep each its own', () => {
        const album = new Album({ id: 'free', title: 'Free Live!', artist: 'Free', tracks: ['All Right Now', 'Mr. Big', 'All Right Now'].map((title, index) => ({ id: `t${index}`, title, position: index + 1 })) })
        album.tracks[0].rating = 77
        album.tracks[1].rating = 82

        expect(mergedTracksOf(album).map(track => track.rating)).toEqual([77, 82, null])
    })
})

describe('the popularity Spotify answered, written on the album', () => {
    const spotify = (rows) => ({
        spotifyId: 'sp1', spotifyUrl: 'https://open.spotify.com/album/sp1', spotifyPopularity: 60,
        trackPopularity: rows.map(([name, popularity], index) => ({ name, popularity, spotifyId: `s${index}`, spotifyUri: `spotify:track:s${index}` }))
    })
    const popularityIn = (tracks) => tracks.map(track => track.spotifyPopularity ?? null)

    it('Spotify writes the title in another way: the track still gets its popularity', () => {
        const album = crimson()

        applySpotifyData(album, spotify([
            ['21st Century Schizoid Man', 71], ['I Talk To The Wind', 60], ['Epitaph - Including "March for No Reason" and "Tomorrow and Tomorrow"', 62],
            ['Moonchild (Including "The Dream" and "The Illusion") - 2019 Remaster', 50], ['The Court of the Crimson King', 58]
        ]))

        expect(popularityIn(album.tracksOriginalOrder).slice(0, 5)).toEqual([71, 60, 62, 50, 58])
    })

    it('the extra does not take the popularity of the original: a title that contains the other is not the same track', () => {
        const album = crimson()

        applySpotifyData(album, spotify([['I Talk To The Wind', 60], ['21st Century Schizoid Man', 71]]))

        const byTitle = Object.fromEntries(album.tracksOriginalOrder.map(track => [track.title, track.spotifyPopularity ?? null]))
        expect(byTitle['I Talk to the Wind']).toBe(60)
        expect(byTitle['I Talk to the Wind (Duo Version)']).toBeNull()
        expect(byTitle['21st Century Schizoid Man (Radio Version)']).toBeNull()
    })

    it('Spotify lists nothing: the album gets its Spotify id and no track is touched', () => {
        const album = crimson()

        applySpotifyData(album, spotify([]))

        expect(album.spotifyId).toBe('sp1')
        expect(popularityIn(album.tracks).every(value => value === null)).toBe(true)
    })
})

describe('the app\'s side of the rule', () => {
    it('entryOfEachTrack: for each track, the entry of the source that is the same track, or null', () => {
        const entries = [{ trackTitle: 'I Talk To The Wind', rating: 90 }]

        expect(entryOfEachTrack([{ title: 'I Talk to the Wind (Duo Version)' }, { title: 'I Talk to the Wind' }], entries)).toEqual([null, entries[0]])
        expect(entryOfEachTrack([{ title: 'One' }], undefined)).toEqual([null])
    })
})

describe('ratings decided by an older track rule are asked for again, once', () => {
    const makeCache = () => {
        const kept = new Map()
        return { kept, get: async (key) => kept.get(key) ?? null, peek: async (key) => kept.get(key) ?? null, set: async (key, value) => { kept.set(key, value) }, invalidate: async (key) => { kept.delete(key) } }
    }
    const QUERY = { artist: 'King Crimson', title: 'In the Court of the Crimson King (Expanded Edition)' }
    const adapterOf = (cache = makeCache()) => new AlbumCacheAdapter({ cache, createAlbum: (plain) => new Album(plain), now: () => 1000 })
    /** The album as the rule of before F74 left it: one original rated, and the extra with its rating. */
    const rated = (ratings) => {
        const album = crimson()
        applyBEAData(album, answerOf(ratings))
        return album
    }
    const OLD = [null, 90, null, null, null, null, 90, null]

    it('the enricher hands on the version of the rule the server decided with; the server of before sends none', async () => {
        const enricherFor = (answer) => new AcclaimEnricher({ requestRatings: async () => answer, applyRatings: applyBEAData })

        const today = await enricherFor({ kind: 'found', data: answerOf() }).enrich(crimson())
        const before = await enricherFor({ kind: 'found', data: { ...answerOf(), trackRule: undefined } }).enrich(crimson())
        const none = await enricherFor({ kind: 'no_ratings', data: { ...answerOf(RATINGS.map(() => null)) } }).enrich(crimson())

        expect(today).toMatchObject({ status: 'done', trackRule: TRACK_IDENTITY_RULE_VERSION })
        expect(before).toMatchObject({ status: 'done', trackRule: null })
        expect(none).toMatchObject({ status: 'empty', reason: 'no_ratings', trackRule: TRACK_IDENTITY_RULE_VERSION })
    })

    it('the version travels with the answer to what is kept', () => {
        expect(sourceOutcome({ status: 'done', trackRule: 3 })).toEqual({ status: 'done', note: { reason: null, trackRule: 3 } })
        expect(sourceOutcome({ status: 'done', trackRule: null })).toEqual({ status: 'done', note: { reason: null } })
        expect(sourceOutcome({ status: 'empty', reason: 'no_ratings', trackRule: 3 })).toEqual({ status: 'empty', note: { reason: 'no_ratings', trackRule: 3 } })
        expect(sourceOutcome({ status: 'empty', reason: 'not_found', rule: 2, trackRule: null })).toEqual({ status: 'empty', note: { reason: 'not_found', rule: 2 } })
    })

    it('ratings kept with the rule of today are believed: the album comes with them and the source is not asked', async () => {
        const adapter = adapterOf()
        await adapter.saveBase(QUERY, crimson())
        await adapter.saveEnrichment(QUERY, rated(RATINGS), 'acclaim', 'done', { reason: null, trackRule: TRACK_IDENTITY_RULE_VERSION })

        const { album, enrichment } = await adapter.get(QUERY)

        expect(enrichment).toEqual({ acclaim: 'done' })
        expect(album.bestEverUrl).toBe(PAGE)
        expect(mergedTracksOf(album).map(track => track.rating)).toEqual(RATINGS)
    })

    it.each([
        ['with no version on record (kept before F74)', { reason: null }],
        ['with another version', { reason: null, trackRule: TRACK_IDENTITY_RULE_VERSION + 1 }]
    ])('ratings kept %s say nothing today: the album comes without them and the source is asked again', async (name, note) => {
        const adapter = adapterOf()
        await adapter.saveBase(QUERY, crimson())
        await adapter.saveEnrichment(QUERY, rated(OLD), 'acclaim', 'done', note)
        await adapter.saveEnrichment(QUERY, rated(OLD), 'popularity', 'done', { reason: null })

        const { album, enrichment } = await adapter.get(QUERY)

        expect(enrichment).toEqual({ popularity: 'done' }) // the other sources are not touched
        expect(album.bestEverUrl).toBeUndefined()
        expect(album.acclaim?.hasRatings).toBeFalsy()
        expect([...album.tracks, ...album.tracksOriginalOrder].every(track => track.rating === null && !track.ranking?.evidence?.length)).toBe(true)
        expect(album.tracksOriginalOrder.map(track => track.title)).toEqual(CRIMSON)
    })

    it('asked again, the enricher really asks (the album no longer says it has its ratings), and the new answer is kept with the version', async () => {
        const adapter = adapterOf()
        await adapter.saveBase(QUERY, crimson())
        await adapter.saveEnrichment(QUERY, rated(OLD), 'acclaim', 'done', { reason: null })
        const asked = []
        const enricher = new AcclaimEnricher({ requestRatings: async (request) => { asked.push(request.title); return { kind: 'found', data: answerOf() } }, applyRatings: applyBEAData })

        const first = await adapter.get(QUERY)
        const result = await enricher.enrich(first.album)
        const { status, note } = sourceOutcome(result)
        await adapter.saveEnrichment(QUERY, result.album, 'acclaim', status, note)
        const second = await adapter.get(QUERY)

        expect(asked).toHaveLength(1)
        expect(second.enrichment).toEqual({ acclaim: 'done' })
        expect(mergedTracksOf(second.album).map(track => track.rating)).toEqual(RATINGS)
    })

    it('"the page has no rating for these tracks" is the rule\'s word too: an older one is asked again', async () => {
        const adapter = adapterOf()
        await adapter.saveBase(QUERY, crimson())
        await adapter.saveEnrichment(QUERY, crimson(), 'acclaim', 'empty', { reason: 'no_ratings' })
        expect((await adapter.get(QUERY)).enrichment).toEqual({})

        await adapter.saveEnrichment(QUERY, crimson(), 'acclaim', 'empty', { reason: 'no_ratings', trackRule: TRACK_IDENTITY_RULE_VERSION })
        expect((await adapter.get(QUERY)).enrichment).toEqual({ acclaim: 'empty' })
    })

    it('"the source has no page" is not the track rule\'s word: it is believed as before', async () => {
        const { IDENTITY_RULE_VERSION } = await import('../../../shared/albumIdentity.js')
        const adapter = adapterOf()
        await adapter.saveBase(QUERY, crimson())
        await adapter.saveEnrichment(QUERY, crimson(), 'acclaim', 'empty', { reason: 'not_found', rule: IDENTITY_RULE_VERSION })

        expect((await adapter.get(QUERY)).enrichment).toEqual({ acclaim: 'empty' })
    })
})
