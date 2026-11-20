/**
 * The default order of the series list, newest first (UAT-227), one rule for the site and the
 * phone app (F78): shared/seriesOrder.js. Runs with jsdom and again in plain Node (core-node).
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_SERIES_ORDER, createdAtMillis, compareByCreation, newestFirst } from '../../shared/seriesOrder.js'

const timestamp = (ms) => ({ toMillis: () => ms }) // the shape of a Firestore Timestamp

describe('the series, newest first (UAT-227, F78)', () => {
    it('the default order is «Newest»', () => {
        expect(DEFAULT_SERIES_ORDER).toBe('recent_desc')
    })

    it('reads a creation date in each shape it arrives in', () => {
        expect(createdAtMillis(new Date(1000))).toBe(1000)
        expect(createdAtMillis(2000)).toBe(2000)
        expect(createdAtMillis(timestamp(3000))).toBe(3000)
        expect(createdAtMillis({ toDate: () => new Date(4000) })).toBe(4000)
        expect(createdAtMillis(undefined)).toBe(0)
        expect(createdAtMillis(new Date('not a date'))).toBe(0)
        expect(createdAtMillis('2026-11-20')).toBe(0)
    })

    it('lists the newest first, the ones with no date last, mixed shapes included', () => {
        const list = [
            { id: 'old', createdAt: new Date(1000) },
            { id: 'none' },
            { id: 'new', createdAt: timestamp(5000) },
            { id: 'middle', createdAt: 3000 }
        ]
        expect(newestFirst(list).map(s => s.id)).toEqual(['new', 'middle', 'old', 'none'])
        expect(list.map(s => s.id)).toEqual(['old', 'none', 'new', 'middle']) // the given list is not changed
    })

    it('«recent_asc» is the opposite order, as the site\'s «Oldest»', () => {
        const a = { createdAt: new Date(1000) }
        const b = { createdAt: new Date(2000) }
        expect(compareByCreation(a, b, 'recent_desc')).toBeGreaterThan(0)
        expect(compareByCreation(a, b, 'recent_asc')).toBeLessThan(0)
    })
})
