/**
 * F52, slice 5 - what `consolidateRanking` (server/lib/ranking.js) does, pinned BEFORE it was
 * rewritten into small steps: these cases were written against the one function of complexity 49
 * and pass unchanged against the steps. It is a pure step: tracks and mentions in, the consolidated
 * ranking out, no outside source.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { consolidateRanking } = require('../../server/lib/ranking.js')

const TRACKS = [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }]
/** [title, rawScore, rating, finalPosition] of each result, in the order they leave. */
const rows = (consolidated) => consolidated.results.map(r => [r.trackTitle, r.rawScore, r.rating, r.finalPosition])
const supportOf = (consolidated, title) => consolidated.results.find(r => r.trackTitle === title).supporting

describe('consolidateRanking: the result covers every track of the album', () => {
    it('with ratings, the order is by rating (highest first), then by points; a track with no rating goes last', async () => {
        const consolidated = await consolidateRanking(TRACKS, [
            { provider: 'BestEverAlbums', trackTitle: 'One', position: 1, rating: 70, referenceUrl: 'u' },
            { provider: 'BestEverAlbums', trackTitle: 'Two', position: 2, rating: 90, referenceUrl: 'u' },
            { provider: 'BestEverAlbums', trackTitle: 'Three', position: 3, rating: null, referenceUrl: 'u' }
        ])

        expect(rows(consolidated)).toEqual([['Two', 2, 90, 1], ['One', 3, 70, 2], ['Three', 1, null, 3]])
        expect(supportOf(consolidated, 'Two')).toEqual([{ provider: 'BestEverAlbums', position: 2, referenceUrl: 'u', rating: 90 }])
        expect(consolidated.results.map(r => r.normalizedScore)).toEqual([2 / 3, 1, 1 / 3])
        expect(consolidated.divergence).toEqual({ unmatchedMentions: [], tracksWithoutSupport: [] })
    })

    it('without ratings, the order is by Borda points: N - position + 1 for each source, 0 for a position outside the album', async () => {
        const consolidated = await consolidateRanking(TRACKS, [
            { provider: 'A', trackTitle: 'Three', position: 1 },
            { provider: 'A', trackTitle: 'One', position: 2 },
            { provider: 'B', trackTitle: 'Three', position: 2 },
            { provider: 'B', trackTitle: 'Two', position: 1 },
            { provider: 'B', trackTitle: 'One', position: 9 }
        ])

        expect(rows(consolidated)).toEqual([['Three', 5, null, 1], ['Two', 3, null, 2], ['One', 2, null, 3]])
        // the most a track can have: N points from each of the 2 sources
        expect(consolidated.results[0].normalizedScore).toBe(5 / 6)
        expect(supportOf(consolidated, 'One')).toEqual([
            { provider: 'A', position: 2, referenceUrl: '', rating: null },
            { provider: 'B', position: 9, referenceUrl: '', rating: null }
        ])
    })

    it('no mention at all: every track is there, in album order, with no support', async () => {
        const consolidated = await consolidateRanking(TRACKS, [])

        expect(rows(consolidated)).toEqual([['One', 0, null, 1], ['Two', 0, null, 2], ['Three', 0, null, 3]])
        expect(consolidated.divergence.tracksWithoutSupport).toEqual(['One', 'Two', 'Three'])
        expect(consolidated.debugInfo).toEqual({ tracksCount: 3, acclaimCount: 0, providersCount: 0, sampleMatch: null })
    })

    it('the rating of a track is the BestEverAlbums one when there is one, else the first rating a source gave', async () => {
        const consolidated = await consolidateRanking(TRACKS, [
            { provider: 'Spotify', trackTitle: 'One', position: 1, rating: 50 },
            { provider: 'BestEverAlbums', trackTitle: 'One', position: 1, rating: 80 },
            { provider: 'Spotify', trackTitle: 'Two', position: 2, rating: 80 },
            { provider: 'X', trackTitle: 'Two', position: 1 }
        ])

        // the same rating: the points decide
        expect(rows(consolidated)).toEqual([['One', 6, 80, 1], ['Two', 5, 80, 2], ['Three', 0, null, 3]])
        expect(consolidated.debugInfo.providersCount).toBe(3)
    })

    it('a rating of 0 is a rating', async () => {
        const consolidated = await consolidateRanking(TRACKS, [
            { provider: 'BestEverAlbums', trackTitle: 'One', position: 1, rating: 0 },
            { provider: 'BestEverAlbums', trackTitle: 'Two', position: 2, rating: 0 }
        ])

        expect(rows(consolidated)).toEqual([['One', 3, 0, 1], ['Two', 2, 0, 2], ['Three', 0, null, 3]])
    })

    it('a mention with no source counts its points, and the score is not divided by sources', async () => {
        const consolidated = await consolidateRanking(TRACKS, [{ trackTitle: 'One', position: 1 }])

        expect(supportOf(consolidated, 'One')).toEqual([{ provider: '', position: 1, referenceUrl: '', rating: null }])
        expect(consolidated.results[0]).toMatchObject({ rawScore: 3, normalizedScore: 3 })
    })
})

describe('consolidateRanking: which track a mention is of', () => {
    it('the same title apart from notes in brackets; a title that contains the other; a track with no title is "track_N"', async () => {
        const consolidated = await consolidateRanking([{ title: 'Voodoo Child (Slight Return)' }, { name: 'Little Wing' }, {}], [
            { provider: 'A', trackTitle: 'Voodoo Child', position: 1 },
            { provider: 'A', trackTitle: 'Little Wing Live Version', position: 2 },
            { provider: 'A', trackTitle: 'Completely Different', position: 3, rating: 5 },
            null,
            { provider: 'A', trackTitle: '' }
        ])

        expect(rows(consolidated)).toEqual([['Voodoo Child (Slight Return)', 3, null, 1], ['Little Wing', 2, null, 2], ['track_3', 0, null, 3]])
        expect(consolidated.divergence).toEqual({
            unmatchedMentions: [{ provider: 'A', trackTitle: 'Completely Different', position: 3, referenceUrl: '', rating: 5 }],
            tracksWithoutSupport: ['track_3']
        })
    })

    it('enough words in common (40%) is the same track; fewer is a mention of no track of the album', async () => {
        const consolidated = await consolidateRanking([{ title: 'Since I Have Been Loving You' }, { title: 'Black Dog' }], [
            { provider: 'A', trackTitle: 'Since I Have Been Loving', position: 1 },
            { provider: 'A', trackTitle: 'Dog Black Night', position: 2 },
            { provider: 'A', trackTitle: 'Black Night Moon Sun Star', position: 2 }
        ])

        expect(rows(consolidated)).toEqual([['Since I Have Been Loving You', 2, null, 1], ['Black Dog', 1, null, 2]])
        expect(consolidated.divergence.unmatchedMentions.map(m => m.trackTitle)).toEqual(['Black Night Moon Sun Star'])
    })

    it('two tracks with the same title: each mention goes to the one with fewer mentions so far', async () => {
        const consolidated = await consolidateRanking([{ title: 'Intro' }, { title: 'Intro' }, { title: 'Song' }], [
            { provider: 'A', trackTitle: 'Intro', position: 1 },
            { provider: 'A', trackTitle: 'Intro', position: 2 },
            { provider: 'B', trackTitle: 'Intro', position: 3 }
        ])

        expect(rows(consolidated)).toEqual([['Intro', 4, null, 1], ['Intro', 2, null, 2], ['Song', 0, null, 3]])
        expect(consolidated.divergence.tracksWithoutSupport).toEqual(['Song'])
    })

    it('a mention of no track is kept apart, and a later mention that contains its title joins it', async () => {
        const consolidated = await consolidateRanking(TRACKS, [
            { provider: 'A', trackTitle: 'Completely Different', position: 1 },
            { provider: 'B', trackTitle: 'Completely Different Thing', position: 2 }
        ])

        expect(rows(consolidated)).toEqual([['One', 0, null, 1], ['Two', 0, null, 2], ['Three', 0, null, 3]])
        expect(consolidated.divergence.unmatchedMentions).toEqual([
            { provider: 'A', trackTitle: 'Completely Different', position: 1, referenceUrl: '', rating: null },
            { provider: 'B', trackTitle: 'Completely Different', position: 2, referenceUrl: '', rating: null }
        ])
    })
})

describe('consolidateRanking: when the tracks of the album are not known', () => {
    it('the mentions are the tracks; points are 1 / position; a mention with no position has none', async () => {
        const consolidated = await consolidateRanking([], [
            { provider: 'A', trackTitle: 'One', position: 1 },
            { provider: 'B', trackTitle: 'One', position: 2 },
            { provider: 'A', trackTitle: 'Two', position: 4 },
            { provider: 'A', trackTitle: 'Zed' }
        ])

        expect(rows(consolidated)).toEqual([['One', 1.5, null, 1], ['Two', 0.25, null, 2], ['Zed', 0, null, 3]])
        expect(consolidated.results.map(r => r.normalizedScore)).toEqual([0.75, 0.125, 0])
        expect(consolidated.debugInfo).toEqual({ tracksCount: 0, acclaimCount: 4, providersCount: 2, sampleMatch: { mention: 'One', mentionKey: 'one', matched: true } })
    })

    it('what the debug sample says with tracks known (it looks for the bare key, which a track never has)', async () => {
        const consolidated = await consolidateRanking(TRACKS, [{ provider: 'A', trackTitle: 'One', position: 1 }])

        expect(consolidated.debugInfo).toEqual({ tracksCount: 3, acclaimCount: 1, providersCount: 1, sampleMatch: { mention: 'One', mentionKey: 'one', matched: false } })
    })
})
