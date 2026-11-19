/**
 * The total duration shown on a playlist card. It used to be a method of PlaylistsView; it lives
 * in the grid that draws the cards (PlaylistGrid). Track durations are in seconds.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))

import { PlaylistGrid } from '../../../public/js/components/playlists/PlaylistGrid.js'

describe('PlaylistGrid.calculateDuration', () => {
    it('should format seconds to MM:SS', () => {
        // 65 s + 125 s = 190 s = 3 min 10 s
        expect(PlaylistGrid.calculateDuration([{ duration: 65 }, { duration: 125 }])).toBe('3:10')
    })

    it('should pad seconds with zero', () => {
        expect(PlaylistGrid.calculateDuration([{ duration: 61 }])).toBe('1:01')
    })

    it('should handle empty tracks', () => {
        expect(PlaylistGrid.calculateDuration([])).toBe('0:00')
    })

    it('should handle missing duration', () => {
        expect(PlaylistGrid.calculateDuration([{ title: 'No Duration' }])).toBe('0:00')
    })
})
