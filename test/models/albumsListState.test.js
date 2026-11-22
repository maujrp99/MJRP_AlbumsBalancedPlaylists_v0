/**
 * F79 (P1-1) - what the list area of the albums screen shows, as a rule with no screen:
 * the loading state while the first read of the series is out, the real empty state only after
 * the read ended with no series, the list when there are series.
 */
import { describe, it, expect } from 'vitest'
import { albumsListState, ListState } from '../../public/js/models/albumsListState.js'

describe('albumsListState', () => {
    it('shows the loading state while the first read is still out and no series is known', () => {
        expect(albumsListState({ seriesCount: 0, read: false, failed: false })).toBe(ListState.LOADING)
    })

    it('shows the real empty state when the read ended and the person has no series', () => {
        expect(albumsListState({ seriesCount: 0, read: true, failed: false })).toBe(ListState.EMPTY)
    })

    it('shows the list when the read ended with series', () => {
        expect(albumsListState({ seriesCount: 3, read: true, failed: false })).toBe(ListState.LIST)
    })

    it('keeps the list on screen during a read, never blanking it', () => {
        expect(albumsListState({ seriesCount: 3, read: false, failed: false })).toBe(ListState.LIST)
    })

    it('shows what it showed before when the read failed with no series: the empty state', () => {
        expect(albumsListState({ seriesCount: 0, read: true, failed: true })).toBe(ListState.EMPTY)
        expect(albumsListState({ seriesCount: 0, read: false, failed: true })).toBe(ListState.EMPTY)
    })

    it('keeps the list when a later read failed but series are known', () => {
        expect(albumsListState({ seriesCount: 2, read: true, failed: true })).toBe(ListState.LIST)
    })

    it('does not go back to loading when a second read starts with nothing known', () => {
        expect(albumsListState({ seriesCount: 0, read: true, failed: false })).toBe(ListState.EMPTY)
    })
})
