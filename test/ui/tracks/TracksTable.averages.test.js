/**
 * F71 (S-56) - the header of the track comparison of an album: «My Avg», «Avg Rating» (it took the
 * place of «Avg Rank», which only measured how many tracks an album has) and «Avg Pop», the last
 * two from the same model the inventory reads.
 *
 * Taken over from test/components/ranking/TracksTable.averages.test.js (F83 wave 6b): the table is React now, so the scaffold changes (it is drawn
 * into a box of the page, and the header is its first child), never the assertion.
 */
import { createElement } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { TracksTable } from '../../../public/js/ui/tracks/TracksTable'
import { averagesOf } from '../../../public/js/models/albumAverages.js'
import { draw, undraw } from '../../support/windowHost'

const header = async (tracks) => {
    const host = await draw(createElement(TracksTable, { tracks, onSort: () => { } }))
    return host.querySelector('.tracks-table-root').firstElementChild.textContent.replace(/\s+/g, ' ').trim()
}

describe('TracksTable: the averages in the header', () => {
    afterEach(undraw)

    const tracks = [
        { title: 'A', position: 1, rank: 1, rating: 90, spotifyPopularity: 80, userRank: 2 },
        { title: 'B', position: 2, rank: 2, rating: 80, spotifyPopularity: 60, userRank: 4 },
        { title: 'C', position: 3, rank: 999, rating: null, spotifyPopularity: -1, userRank: null }
    ]

    it('says My Avg, Avg Rating and Avg Pop, and no longer says Avg Rank', async () => {
        const text = await header(tracks)

        expect(text).toContain('My Avg: 3.0')
        expect(text).toContain('Avg Rating: 85')
        expect(text).toContain('Avg Pop: 70%')
        expect(text).not.toContain('Avg Rank')
    })

    it('shows the number the inventory shows for the same tracks', async () => {
        const { rating, popularity } = averagesOf(tracks)

        expect(await header(tracks)).toContain(`Avg Rating: ${rating}`)
        expect(await header(tracks)).toContain(`Avg Pop: ${popularity}%`)
    })

    it('says a dash, never "-%", when a source has nothing', async () => {
        const text = await header([{ title: 'A', position: 1, rank: 999, rating: null, spotifyPopularity: -1 }])

        expect(text).toContain('My Avg: -')
        expect(text).toContain('Avg Rating: —')
        expect(text).toContain('Avg Pop: —')
        expect(text).not.toContain('-%')
    })
})
