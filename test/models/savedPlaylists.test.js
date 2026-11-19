/**
 * F61 - the rules of the saved playlists list (models/savedPlaylists.js).
 */
import { describe, it, expect } from 'vitest'
import {
    DEFAULT_BATCH_NAME,
    SeriesPlaylistsStatus as Status,
    batchNameOf,
    batchTotals,
    coverSources,
    formatMinutes,
    groupIntoBatches,
    inReadOrder,
    summarize,
    toMillis
} from '../../public/js/models/savedPlaylists.js'

describe('savedPlaylists rules', () => {
    describe('toMillis', () => {
        it('reads a Firestore timestamp, a Date, a text and a number; nothing is 0', () => {
            expect(toMillis({ toMillis: () => 42 })).toBe(42)
            expect(toMillis({ seconds: 2, nanoseconds: 0 })).toBe(2000)
            expect(toMillis(new Date(5))).toBe(5)
            expect(toMillis('1970-01-01T00:00:01Z')).toBe(1000)
            expect(toMillis(7)).toBe(7)
            expect(toMillis(null)).toBe(0)
            expect(toMillis('not a date')).toBe(0)
        })
    })

    describe('groupIntoBatches', () => {
        it('groups by batch name, newest batch first, playlists in their saved order', () => {
            const batches = groupIntoBatches([
                { id: 'a2', name: 'Vol. 2', batchName: 'Old', order: 1, savedAt: '2026-01-01T00:00:00Z' },
                { id: 'b1', name: 'Vol. 1', batchName: 'New', order: 0, savedAt: '2026-02-01T00:00:00Z' },
                { id: 'a1', name: 'Vol. 1', batchName: 'Old', order: 0, savedAt: '2026-01-01T00:00:00Z' }
            ])

            expect(batches.map(batch => batch.name)).toEqual(['New', 'Old'])
            expect(batches[1].playlists.map(p => p.id)).toEqual(['a1', 'a2'])
        })

        it('playlists with no order go by name, counting numbers as numbers', () => {
            const [batch] = groupIntoBatches([{ id: 'x', name: 'Vol. 10' }, { id: 'y', name: 'Vol. 2' }])

            expect(batch.playlists.map(p => p.id)).toEqual(['y', 'x'])
        })

        it('a playlist saved before batches had a name belongs to the default batch', () => {
            expect(batchNameOf({})).toBe(DEFAULT_BATCH_NAME)
            expect(groupIntoBatches([{ id: 'x' }])[0].name).toBe(DEFAULT_BATCH_NAME)
        })

        it('no playlists, no batches', () => {
            expect(groupIntoBatches([])).toEqual([])
        })
    })

    describe('batchTotals', () => {
        it('counts playlists, tracks, different albums and seconds', () => {
            const totals = batchTotals({
                playlists: [
                    { tracks: [{ album: 'Animals', duration: 100 }, { album: 'animals', duration: 50 }] },
                    { tracks: [{ album: 'Wish You Were Here', duration: 30 }, { duration: 5 }] },
                    {}
                ]
            })

            expect(totals).toEqual({ playlists: 3, tracks: 4, albums: 2, durationSeconds: 185 })
            expect(formatMinutes(totals.durationSeconds)).toBe('3m')
        })
    })

    describe('inReadOrder', () => {
        it('most recently updated first; equals keep the order they came in', () => {
            const ordered = inReadOrder([
                { id: 'old', updatedAt: { seconds: 1 } },
                { id: 'none-1' },
                { id: 'new', updatedAt: { seconds: 9 } },
                { id: 'none-2' }
            ])

            expect(ordered.map(series => series.id)).toEqual(['new', 'old', 'none-1', 'none-2'])
        })
    })

    describe('coverSources', () => {
        it('takes the cover a query stores, asks a lookup for a text query, and stops at what a card shows', () => {
            const sources = coverSources({
                albumQueries: [
                    { artist: 'A', title: 'One', coverUrl: 'https://covers/one.jpg' },
                    'Pink Floyd - Animals - Remaster',
                    { artist: 'B', title: 'No cover' },
                    { artist: 'C', title: 'Fourth', coverUrl: 'https://covers/four.jpg' }
                ]
            })

            expect(sources).toEqual([
                { url: 'https://covers/one.jpg', lookup: null },
                { url: null, lookup: { artist: 'Pink Floyd', title: 'Animals - Remaster' } },
                { url: null, lookup: null }
            ])
        })

        it('a series with no albums has no covers', () => {
            expect(coverSources({})).toEqual([])
        })
    })

    describe('summarize', () => {
        it('counts the series by state', () => {
            const summary = summarize([
                { status: Status.LOADING }, { status: Status.READY }, { status: Status.READY },
                { status: Status.EMPTY }, { status: Status.FAILED }
            ])

            expect(summary).toEqual({ total: 5, loading: 1, ready: 2, empty: 1, failed: 1, settled: 4 })
        })
    })
})
