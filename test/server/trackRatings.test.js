/**
 * F74 (UAT-221) - every place of the server that puts what a source says of a track on the tracks
 * of an album asks the one track rule (shared/trackIdentity.js):
 *   the ratings of POST /api/enrich-album   services/EnrichmentService.js
 *   the ranking of POST /api/generate       ranking.js, rankingSources/completeRanking.js, albumAnswer.js
 *
 * The albums are real: test/fixtures/trackIdentity/measuredAlbums.json (read on 2026-11-20).
 */
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { matchTracks, trackTextOf, TRACK_IDENTITY_RULE_VERSION } from '../../shared/trackIdentity.js'

const require = createRequire(import.meta.url)
const EnrichmentService = require('../../server/lib/services/EnrichmentService.js')
const { consolidateRanking } = require('../../server/lib/ranking.js')
const { completeRanking } = require('../../server/lib/rankingSources/completeRanking.js')
const { withRanksOnTracks } = require('../../server/lib/albumAnswer.js')

const { albums } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'test/fixtures/trackIdentity/measuredAlbums.json'), 'utf8'))
const albumNamed = (name) => albums.find(one => one.album === name)
const serviceLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

/** The page as the scraper hands it: sorted by rating, highest first. */
const pageOf = ({ page, pageUrl }) => ({
    provider: 'BestEverAlbums',
    referenceUrl: pageUrl,
    albumId: '1',
    evidence: [...page].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
})
const serviceWith = (getBestEverRanking) => new EnrichmentService({ getBestEverRanking, logger: serviceLogger })
const enrich = (album, getBestEverRanking = async () => pageOf(album)) =>
    serviceWith(getBestEverRanking).enrichAlbum({ title: album.album, artist: album.artist, tracks: album.tracks.map(title => ({ title })) })

describe('POST /api/enrich-album: each rating goes to the track it is of', () => {
    const crimson = albumNamed('In the Court of the Crimson King (Expanded Edition)')

    it('«In the Court of the Crimson King (Expanded Edition)»: the five originals rated, the three extras not', async () => {
        const result = await enrich(crimson)

        expect(result).toMatchObject({ ok: true, outcome: 'found' })
        expect(result.data.trackRatings.map(row => row.rating)).toEqual([93, 90, 93, 82, 93, null, null, null])
        expect(result.data.trackRatings.map(row => row.title)).toEqual(crimson.tracks)
    })

    it('the evidence of a track names the page; a track with no rating has none', async () => {
        const { data } = await enrich(crimson)

        expect(data.trackEvidence[0]).toEqual({
            title: '21st Century Schizoid Man (Including "Mirrors")',
            evidence: [{ source: 'BestEverAlbums', score: 93, votes: null, url: crimson.pageUrl }]
        })
        expect(data.trackEvidence[6]).toEqual({ title: 'I Talk to the Wind (Duo Version)', evidence: [] })
    })

    it('a live album gives each rating to its one track: «Live At The Apollo (1962)»', async () => {
        const { data } = await enrich(albumNamed('Live At The Apollo (1962)'))

        expect(data.trackRatings.map(row => row.rating)).toEqual([null, 81, 83, null, 83, null, 83, null, null, 85, 82])
    })

    it('the answer says which version of the track rule decided it, for "found" and for "no_ratings"', async () => {
        const found = await enrich(crimson)
        const noRatings = await enrich(crimson, async () => ({ ...pageOf(crimson), evidence: [{ trackTitle: 'Another Song', rating: 70 }] }))
        const notFound = await enrich(crimson, async () => null)

        expect(found.data.trackRule).toBe(TRACK_IDENTITY_RULE_VERSION)
        expect(noRatings).toMatchObject({ outcome: 'no_ratings', data: { trackRule: TRACK_IDENTITY_RULE_VERSION } })
        expect(notFound.outcome).toBe('not_found')
        expect(notFound.data).not.toHaveProperty('trackRule')
    })

    it('the tracks of the album go to the scraper with the search, so it can choose the edition', async () => {
        const getBestEverRanking = vi.fn(async () => pageOf(crimson))

        await enrich(crimson, getBestEverRanking)

        expect(getBestEverRanking).toHaveBeenCalledWith(crimson.album, crimson.artist, expect.objectContaining({ tracks: crimson.tracks.map(title => ({ title })) }))
    })

    it('a page entry with no rating gives none, and an entry that is not an object is passed over', async () => {
        const { data } = await enrich(crimson, async () => ({ ...pageOf(crimson), evidence: [null, { trackTitle: 'I Talk To The Wind', rating: null }, { trackTitle: 'Moonchild', rating: 82 }] }))

        expect(data.trackRatings.map(row => row.rating)).toEqual([null, null, null, 82, null, null, null, null])
    })
})

describe('POST /api/generate: the ranking of the album', () => {
    const rule = { matchTracks, trackTextOf }
    const titles = (rows) => rows.map(row => row.trackTitle)

    it('consolidation: a rating of the page goes to the original, never also to the extra', async () => {
        const tracks = [{ title: 'I Talk to the Wind' }, { title: 'I Talk to the Wind (Duo Version)' }, { title: 'Epitaph (Including "March for No Reason" and "Tomorrow and Tomorrow")' }]
        const consolidated = await consolidateRanking(tracks, [
            { provider: 'BestEverAlbums', trackTitle: 'Epitaph Including March For No Reason & Tomorrow And Tomorrow', position: 1, rating: 93 },
            { provider: 'BestEverAlbums', trackTitle: 'I Talk To The Wind', position: 2, rating: 90 }
        ])

        expect(consolidated.results.map(row => [row.trackTitle, row.rating])).toEqual([
            [tracks[2].title, 93],
            ['I Talk to the Wind', 90],
            ['I Talk to the Wind (Duo Version)', null]
        ])
        expect(consolidated.divergence.unmatchedMentions).toEqual([])
    })

    it('consolidation: each source is matched on its own, so two sources can both speak of one track', async () => {
        const consolidated = await consolidateRanking([{ title: 'One' }, { title: 'Two' }], [
            { provider: 'A', trackTitle: 'One', position: 1 },
            { provider: 'B', trackTitle: 'One (2011 Remaster)', position: 2 },
            { provider: 'B', trackTitle: 'Two', position: 1 }
        ])

        expect(consolidated.results.map(row => [row.trackTitle, row.rawScore])).toEqual([['One', 3], ['Two', 2]])
    })

    it('the page completed by the AI: the page\'s entry where the page has the track, by the rule', () => {
        const tracks = [{ title: 'Larks\' Tongues In Aspic, Pt. 1' }, { title: 'Exiles' }, { title: 'Recording Session Extract, Pt. 1 (Bonus Track)' }]
        const pageEntries = [
            { provider: 'BestEverAlbums', trackTitle: 'Larks\' Tongues In Aspic, Part One', position: 1, rating: 86 },
            { provider: 'BestEverAlbums', trackTitle: 'Exiles', position: 2, rating: 84 }
        ]
        const modelEntries = [
            { provider: 'Model', trackTitle: 'Exiles', position: 1 },
            { provider: 'Model', trackTitle: 'Larks\' Tongues In Aspic, Pt. 1', position: 2 },
            { provider: 'Model', trackTitle: 'Recording Session Extract, Pt. 1', position: 3 }
        ]

        const entries = completeRanking(tracks, pageEntries, modelEntries, rule.matchTracks)

        expect(entries.map(entry => [entry.provider, entry.trackTitle, entry.rating])).toEqual([
            ['BestEverAlbums', 'Larks\' Tongues In Aspic, Part One', 86],
            ['BestEverAlbums', 'Exiles', 84],
            ['Model', 'Recording Session Extract, Pt. 1', null]
        ])
    })

    it('the ranks and ratings written on the tracks: two tracks of one title each keep their own row', () => {
        const answer = {
            tracks: [{ title: 'All Right Now' }, { title: 'Mr. Big' }, { title: 'All Right Now' }],
            rankingConsolidated: [
                { trackTitle: 'Mr. Big', finalPosition: 1, rating: 82 },
                { trackTitle: 'All Right Now', finalPosition: 2, rating: 77 },
                { trackTitle: 'All Right Now', finalPosition: 3, rating: null }
            ]
        }

        const { tracks, tracksByAcclaim } = withRanksOnTracks(answer, rule.matchTracks)

        expect(tracks).toEqual([
            { title: 'All Right Now', rank: 2, rating: 77 },
            { title: 'Mr. Big', rank: 1, rating: 82 },
            { title: 'All Right Now', rank: 3 }
        ])
        expect(titles(tracksByAcclaim.map(track => ({ trackTitle: track.title })))).toEqual(['Mr. Big', 'All Right Now', 'All Right Now'])
    })
})
