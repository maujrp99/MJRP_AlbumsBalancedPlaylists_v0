/**
 * Tests for Top N Algorithms (Sprint 17.5 Generic Implementation)
 * 
 * @module test/algorithms/topn.test
 */

import { describe, it, expect } from 'vitest'
import { TopNAlgorithm } from '../../public/js/algorithms/TopNAlgorithm.js'
import { TopNPopularAlgorithm } from '../../public/js/algorithms/TopNPopularAlgorithm.js'
import { TopNAcclaimedAlgorithm } from '../../public/js/algorithms/TopNAcclaimedAlgorithm.js'
import { getAllAlgorithms, getAlgorithm, createAlgorithm } from '../../public/js/algorithms/index.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

function createMockAlbum(id, trackCount = 5) {
    const tracks = []
    for (let i = 0; i < trackCount; i++) {
        tracks.push({
            id: `${id}_track_${i + 1}`,
            title: `Track ${i + 1}`,
            duration: 180 + (i * 30),
            spotifyPopularity: 100 - (i * 10),
            rating: 90 - (i * 5)
        })
    }
    return {
        id,
        title: `Album ${id}`,
        artist: 'Test Artist',
        tracks
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TopNAlgorithm Base Class Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('TopNAlgorithm', () => {
    describe('constructor', () => {
        it('should set default values', () => {
            const algo = new TopNAlgorithm()
            expect(algo.trackCount).toBe(3)
            expect(algo.outputMode).toBe('auto')
        })

        it('should accept custom options', () => {
            const algo = new TopNAlgorithm({ trackCount: 5, outputMode: 'single' })
            expect(algo.trackCount).toBe(5)
            expect(algo.outputMode).toBe('single')
        })
    })

    describe('generate', () => {
        it('should select top N tracks from each album', () => {
            const algo = new TopNAlgorithm({ trackCount: 3 })
            const albums = [createMockAlbum('album1', 5), createMockAlbum('album2', 5)]

            const result = algo.generate(albums)

            expect(result.playlists.length).toBeGreaterThan(0)
            const totalTracks = result.playlists.reduce((sum, p) => sum + p.tracks.length, 0)
            expect(totalTracks).toBe(6) // 2 albums * 3 tracks
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Subclass Tests (Generic Sprint 17.5)
// ═══════════════════════════════════════════════════════════════════════════

describe('TopNPopularAlgorithm', () => {
    it('should have correct metadata', () => {
        const meta = TopNPopularAlgorithm.getMetadata()
        expect(meta.id).toBe('top-n-popular')
        expect(meta.badge).toBe('SPOTIFY')
    })

    it('should use BalancedRankingStrategy with Spotify weight', () => {
        const algo = new TopNPopularAlgorithm()
        // Check strategy config directly if accessible, or constructor type
        expect(algo.rankingStrategy).toBeDefined()
        if (algo.rankingStrategy.weights) {
            expect(algo.rankingStrategy.weights.spotifyWeight).toBe(1.0)
        }
    })
})

describe('TopNAcclaimedAlgorithm', () => {
    it('should have correct metadata', () => {
        const meta = TopNAcclaimedAlgorithm.getMetadata()
        expect(meta.id).toBe('top-n-acclaimed')
        expect(meta.badge).toBe('BEA')
    })

    it('should use BalancedRankingStrategy with BEA weight', () => {
        const algo = new TopNAcclaimedAlgorithm()
        expect(algo.rankingStrategy).toBeDefined()
        if (algo.rankingStrategy.weights) {
            expect(algo.rankingStrategy.weights.beaWeight).toBe(1.0)
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Registry Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Algorithm Registry', () => {
    it('should include 4 core algorithms', () => {
        const all = getAllAlgorithms()
        expect(all.length).toBe(4) // mjrp-balanced + 3 TopN generics (Pop, Acc, User)
    })

    it('should find top-n-popular by ID', () => {
        const AlgoClass = getAlgorithm('top-n-popular')
        expect(AlgoClass).toBe(TopNPopularAlgorithm)
    })

    it('should create algorithm instance via factory', () => {
        const instance = createAlgorithm('top-n-acclaimed')
        expect(instance).toBeInstanceOf(TopNAcclaimedAlgorithm)
    })
})
