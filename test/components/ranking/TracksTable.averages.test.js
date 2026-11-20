/**
 * F71 (S-56) - the header of the track comparison of an album: «My Avg», «Avg Rating» (it took the
 * place of «Avg Rank», which only measured how many tracks an album has) and «Avg Pop», the last
 * two from the same model the inventory reads.
 */
import { describe, it, expect } from 'vitest'
import { TracksTable } from '../../../public/js/components/ranking/TracksTable.js'
import { averagesOf } from '../../../public/js/models/albumAverages.js'

const header = (tracks) => new TracksTable({ tracks }).renderStatsHeader().textContent.replace(/\s+/g, ' ').trim()

describe('TracksTable: the averages in the header', () => {
    const tracks = [
        { title: 'A', position: 1, rank: 1, rating: 90, spotifyPopularity: 80, userRank: 2 },
        { title: 'B', position: 2, rank: 2, rating: 80, spotifyPopularity: 60, userRank: 4 },
        { title: 'C', position: 3, rank: 999, rating: null, spotifyPopularity: -1, userRank: null }
    ]

    it('says My Avg, Avg Rating and Avg Pop, and no longer says Avg Rank', () => {
        const text = header(tracks)

        expect(text).toContain('My Avg: 3.0')
        expect(text).toContain('Avg Rating: 85')
        expect(text).toContain('Avg Pop: 70%')
        expect(text).not.toContain('Avg Rank')
    })

    it('shows the number the inventory shows for the same tracks', () => {
        const { rating, popularity } = averagesOf(tracks)

        expect(header(tracks)).toContain(`Avg Rating: ${rating}`)
        expect(header(tracks)).toContain(`Avg Pop: ${popularity}%`)
    })

    it('says a dash, never "-%", when a source has nothing', () => {
        const text = header([{ title: 'A', position: 1, rank: 999, rating: null, spotifyPopularity: -1 }])

        expect(text).toContain('My Avg: -')
        expect(text).toContain('Avg Rating: —')
        expect(text).toContain('Avg Pop: —')
        expect(text).not.toContain('-%')
    })
})
