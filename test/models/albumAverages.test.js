/**
 * F71 (S-56) - the two averages of an album, said once: «Avg Rating» (the BestEverAlbums rating
 * of its tracks) and «Avg Pop» (the Spotify popularity of its tracks).
 */
import { describe, it, expect } from 'vitest'
import {
    averagesOf, averagesOfAlbum, mergedTracksOf, averagesLine, ratingText, popularityText, ratingValue, popularityValue
} from '../../public/js/models/albumAverages.js'

const track = (title, rating, spotifyPopularity) => ({ title, rating, spotifyPopularity })

describe('averagesOf', () => {
    it('the rating is the mean of the ratings above zero; the popularity is the mean of those from zero up', () => {
        const averages = averagesOf([track('a', 80, 50), track('b', 70, 0), track('c', 0, 40), track('d', null, -1), track('e', null, null)])

        expect(averages).toEqual({ rating: 75, popularity: 30, ratedTracks: 2, popTracks: 3 })
    })

    it('keeps one decimal, as a number', () => {
        const averages = averagesOf([track('a', 78, 42), track('b', 79, 43), track('c', 78, 43)])

        expect(averages.rating).toBe(78.3)
        expect(averages.popularity).toBe(42.7)
        expect(typeof averages.rating).toBe('number')
    })

    it('says null, not zero, for an album with nothing to average', () => {
        expect(averagesOf([track('a', null, -1)])).toEqual({ rating: null, popularity: null, ratedTracks: 0, popTracks: 0 })
        expect(averagesOf([])).toEqual({ rating: null, popularity: null, ratedTracks: 0, popTracks: 0 })
        expect(averagesOf(undefined)).toEqual({ rating: null, popularity: null, ratedTracks: 0, popTracks: 0 })
    })

    it('does not count what is not a number', () => {
        const averages = averagesOf([track('a', '80', '50'), track('b', NaN, NaN), track('c', 60, 20)])

        expect(averages).toMatchObject({ rating: 60, popularity: 20, ratedTracks: 1, popTracks: 1 })
    })
})

describe('averagesOfAlbum', () => {
    const album = (original, acclaim) => ({ getTracks: (order) => (order === 'acclaim' ? acclaim : original) })

    it('puts the ratings of the acclaim order onto the original order, by title', () => {
        const original = [{ title: 'Time', position: 1 }, { title: 'Money', position: 2 }, { title: 'Us & Them', position: 3 }]
        const acclaim = [{ title: 'money', rating: 90, rank: 1, spotifyPopularity: 80 }, { title: 'TIME', rating: 80, rank: 2, spotifyPopularity: 70 }]

        expect(averagesOfAlbum(album(original, acclaim))).toEqual({ rating: 85, popularity: 75, ratedTracks: 2, popTracks: 2 })
    })

    it('a track of the original order keeps its own rating and popularity when the acclaim order has none', () => {
        const original = [{ title: 'A', rating: 60, spotifyPopularity: 10 }, { title: 'B', spotifyPopularity: null }]

        expect(averagesOfAlbum(album(original, []))).toEqual({ rating: 60, popularity: 10, ratedTracks: 1, popTracks: 1 })
    })

    it('mergedTracksOf is what the track comparison shows: every track of the original order, with defaults', () => {
        const merged = mergedTracksOf(album([{ title: 'A' }, { title: 'B', position: '4' }], []))

        expect(merged).toEqual([
            { title: 'A', rank: 999, rating: null, spotifyPopularity: -1, spotifyId: undefined, position: 1, duration: 0 },
            { title: 'B', rank: 999, rating: null, spotifyPopularity: -1, spotifyId: undefined, position: 4, duration: 0 }
        ])
    })
})

describe('what is said of the averages', () => {
    const averages = { rating: 78.4, popularity: 42.6 }

    it('the two labels', () => {
        expect(ratingText(averages)).toBe('Avg Rating: 78.4')
        expect(popularityText(averages)).toBe('Avg Pop: 42.6%')
    })

    it('a missing average is a dash, never "0" or "-%"', () => {
        expect(ratingText({ rating: null })).toBe('Avg Rating: —')
        expect(popularityText(null)).toBe('Avg Pop: —')
        expect(ratingValue(undefined)).toBe('—')
        expect(popularityValue({ popularity: null })).toBe('—')
        expect(popularityValue(averages)).toBe('42.6%')
        expect(ratingValue(averages)).toBe('78.4')
    })

    it('a zero popularity is a number: it is said', () => {
        expect(popularityText({ popularity: 0 })).toBe('Avg Pop: 0%')
    })

    it('the line of a card has what the item has, and nothing when it has nothing', () => {
        expect(averagesLine(averages)).toBe('Avg Rating: 78.4 · Avg Pop: 42.6%')
        expect(averagesLine({ rating: 78.4, popularity: null })).toBe('Avg Rating: 78.4')
        expect(averagesLine({ rating: null, popularity: 12 })).toBe('Avg Pop: 12%')
        expect(averagesLine({ rating: null, popularity: null })).toBe('')
        expect(averagesLine(undefined)).toBe('')
    })
})
