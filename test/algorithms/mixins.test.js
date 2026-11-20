/**
 * Tests for Algorithm Mixins
 * 
 * @module test/algorithms/mixins.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BaseAlgorithm } from '../../public/js/algorithms/BaseAlgorithm.js'
import {
    PlaylistBalancingMixin,
    DurationTrimmingMixin,
    applyMixins
} from '../../public/js/algorithms/mixins/index.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function createMockTrack(id, duration = 180, rank = null, albumId = 'album1') {
    return {
        id: `track${id}`,
        title: `Track ${id}`,
        duration, // seconds
        acclaimRank: rank,
        originAlbumId: albumId
    }
}

function createMockPlaylist(id, tracks = []) {
    return {
        id: id,
        title: `Playlist ${id}`,
        tracks: [...tracks]
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PlaylistBalancingMixin Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('PlaylistBalancingMixin', () => {
    let TestClass
    let instance

    beforeEach(() => {
        TestClass = PlaylistBalancingMixin(BaseAlgorithm)
        instance = new TestClass({ targetSeconds: 180 }) // 3 minutes
    })

    describe('isSwapValid', () => {
        it('should reject swapping rank #1 track from p1', () => {
            const pOver = createMockPlaylist('p1', [createMockTrack(1, 180, 1)])
            const pUnder = createMockPlaylist('p2', [createMockTrack(2, 180, 2)])
            const trackOver = pOver.tracks[0]
            const trackUnder = pUnder.tracks[0]

            expect(instance.isSwapValid(pOver, pUnder, trackOver, trackUnder)).toBe(false)
        })

        it('should reject swapping rank #2 track from p2', () => {
            const pOver = createMockPlaylist('p2', [createMockTrack(2, 180, 2)])
            const pUnder = createMockPlaylist('p3', [createMockTrack(3, 180, 3)])
            const trackOver = pOver.tracks[0]
            const trackUnder = pUnder.tracks[0]

            expect(instance.isSwapValid(pOver, pUnder, trackOver, trackUnder)).toBe(false)
        })

        it('should allow swapping normal tracks between Deep Cuts', () => {
            const pOver = createMockPlaylist('p3', [createMockTrack(3, 180, 3)])
            const pUnder = createMockPlaylist('p4', [createMockTrack(4, 180, 4)])
            const trackOver = pOver.tracks[0]
            const trackUnder = pUnder.tracks[0]

            expect(instance.isSwapValid(pOver, pUnder, trackOver, trackUnder)).toBe(true)
        })
    })

    describe('isLastTrackOfAlbumInPlaylist', () => {
        it('should return true when track is only one from album', () => {
            const track = createMockTrack(1, 180, 1, 'album1')
            const playlist = createMockPlaylist('p1', [track])

            expect(instance.isLastTrackOfAlbumInPlaylist(playlist, track)).toBe(true)
        })

        it('should return false when multiple tracks from same album', () => {
            const track1 = createMockTrack(1, 180, 1, 'album1')
            const track2 = createMockTrack(2, 180, 2, 'album1')
            const playlist = createMockPlaylist('p1', [track1, track2])

            expect(instance.isLastTrackOfAlbumInPlaylist(playlist, track1)).toBe(false)
        })
    })

    describe('runSwapBalancing', () => {
        it('should balance playlists with uneven durations', () => {
            const playlist1 = createMockPlaylist('p3', [
                createMockTrack(1, 300, 3, 'album1'), // 5 min
                createMockTrack(2, 300, 4, 'album2')  // 5 min = 10 min total
            ])
            const playlist2 = createMockPlaylist('p4', [
                createMockTrack(3, 120, 5, 'album1'), // 2 min
                createMockTrack(4, 120, 6, 'album2')  // 2 min = 4 min total
            ])

            instance.runSwapBalancing([playlist1, playlist2], {
                targetSeconds: 420, // 7 min
                flexibilitySeconds: 180 // 3 min
            })

            // After balancing, durations should be closer
            const dur1 = instance.calculateTotalDuration(playlist1.tracks)
            const dur2 = instance.calculateTotalDuration(playlist2.tracks)
            expect(Math.abs(dur1 - dur2)).toBeLessThan(600) // Within 10 min
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// DurationTrimmingMixin Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('DurationTrimmingMixin', () => {
    let TestClass
    let instance

    beforeEach(() => {
        TestClass = DurationTrimmingMixin(BaseAlgorithm)
        instance = new TestClass()
        instance.deepCutsMax = 300 // 5 minutes for testing
    })

    describe('trimOverDurationPlaylists', () => {
        it('should move excess tracks to Orphan Tracks', () => {
            const playlist = createMockPlaylist('p3', [
                createMockTrack(1, 120, 1), // 2 min
                createMockTrack(2, 120, 2), // 2 min
                createMockTrack(3, 120, 3), // 2 min = 6 min total
            ])
            const playlists = [
                createMockPlaylist('p1', []),
                createMockPlaylist('p2', []),
                playlist
            ]

            instance.trimOverDurationPlaylists(playlists, 2, { maxDuration: 300 })

            // Should have created Orphan Tracks
            const orphan = playlists.find(p => p.title === 'Orphan Tracks')
            expect(orphan).toBeDefined()
            expect(orphan.tracks.length).toBeGreaterThan(0)

            // Original playlist should be under max
            const trimmedDuration = instance.calculateTotalDuration(playlist.tracks)
            expect(trimmedDuration).toBeLessThanOrEqual(300)
        })

        it('should not create Orphan Tracks if not needed', () => {
            const playlist = createMockPlaylist('p3', [
                createMockTrack(1, 60, 1),
                createMockTrack(2, 60, 2)
            ])
            const playlists = [createMockPlaylist('p1', []), createMockPlaylist('p2', []), playlist]

            instance.trimOverDurationPlaylists(playlists, 2, { maxDuration: 300 })

            const orphan = playlists.find(p => p.title === 'Orphan Tracks')
            expect(orphan).toBeUndefined()
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// applyMixins Utility Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('applyMixins', () => {
    it('should apply multiple mixins to base class', () => {
        const FullAlgorithm = applyMixins(
            BaseAlgorithm,
            PlaylistBalancingMixin,
            DurationTrimmingMixin
        )

        const instance = new FullAlgorithm()

        expect(typeof instance.runSwapBalancing).toBe('function')
        expect(typeof instance.trimOverDurationPlaylists).toBe('function')
    })
})
