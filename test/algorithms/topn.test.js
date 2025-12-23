/**
 * Tests for Top N Algorithms
 * 
 * @module test/algorithms/topn.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TopNAlgorithm } from '../../public/js/algorithms/TopNAlgorithm.js'
import { Top3PopularAlgorithm } from '../../public/js/algorithms/Top3PopularAlgorithm.js'
import { Top3AcclaimedAlgorithm } from '../../public/js/algorithms/Top3AcclaimedAlgorithm.js'
import { Top5PopularAlgorithm } from '../../public/js/algorithms/Top5PopularAlgorithm.js'
import { Top5AcclaimedAlgorithm } from '../../public/js/algorithms/Top5AcclaimedAlgorithm.js'
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
            duration: 180 + (i * 30), // 3-6 minutes
            spotifyPopularity: 100 - (i * 10), // 100, 90, 80...
            rating: 90 - (i * 5) // 90, 85, 80...
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
            // 2 albums x 3 tracks = 6 total tracks
            const totalTracks = result.playlists.reduce((sum, p) => sum + p.tracks.length, 0)
            expect(totalTracks).toBe(6)
        })

        it('should create single playlist when outputMode is single', () => {
            const algo = new TopNAlgorithm({ trackCount: 3, outputMode: 'single' })
            const albums = [createMockAlbum('album1')]

            const result = algo.generate(albums)

            expect(result.playlists.length).toBe(1)
        })

        it('should annotate tracks with ranking info', () => {
            const algo = new TopNAlgorithm({ trackCount: 2 })
            const albums = [createMockAlbum('album1')]

            const result = algo.generate(albums)

            expect(result.playlists[0].tracks[0].rankingInfo).toBeDefined()
            expect(result.playlists[0].tracks[0].rankingInfo.length).toBeGreaterThan(0)
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Subclass Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Top3PopularAlgorithm', () => {
    it('should have correct metadata', () => {
        const meta = Top3PopularAlgorithm.getMetadata()
        expect(meta.id).toBe('top-3-popular')
        expect(meta.name).toBe('Crowd Favorites')
        expect(meta.badge).toBe('TOP 3')
    })

    it('should use trackCount of 3', () => {
        const algo = new Top3PopularAlgorithm()
        expect(algo.trackCount).toBe(3)
    })

    it('should use SpotifyRankingStrategy', () => {
        const algo = new Top3PopularAlgorithm()
        expect(algo.rankingStrategy.constructor.metadata.id).toBe('spotify')
    })
})

describe('Top3AcclaimedAlgorithm', () => {
    it('should have correct metadata', () => {
        const meta = Top3AcclaimedAlgorithm.getMetadata()
        expect(meta.id).toBe('top-3-acclaimed')
        expect(meta.name).toBe("Critics' Choice")
    })

    it('should use BEARankingStrategy', () => {
        const algo = new Top3AcclaimedAlgorithm()
        expect(algo.rankingStrategy.constructor.metadata.id).toBe('bea')
    })
})

describe('Top5PopularAlgorithm', () => {
    it('should use trackCount of 5', () => {
        const algo = new Top5PopularAlgorithm()
        expect(algo.trackCount).toBe(5)
    })

    it('should generate playlists with 5 tracks per album', () => {
        const algo = new Top5PopularAlgorithm()
        const albums = [createMockAlbum('album1', 10)]

        const result = algo.generate(albums)
        const totalTracks = result.playlists.reduce((sum, p) => sum + p.tracks.length, 0)
        expect(totalTracks).toBe(5)
    })
})

describe('Top5AcclaimedAlgorithm', () => {
    it('should have correct metadata', () => {
        const meta = Top5AcclaimedAlgorithm.getMetadata()
        expect(meta.id).toBe('top-5-acclaimed')
        expect(meta.name).toBe('Deep Cuts')
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Registry Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Algorithm Registry', () => {
    it('should include all 8 algorithms', () => {
        const all = getAllAlgorithms()
        expect(all.length).toBe(8)
    })

    it('should find top-3-popular by ID', () => {
        const AlgoClass = getAlgorithm('top-3-popular')
        expect(AlgoClass).toBe(Top3PopularAlgorithm)
    })

    it('should create algorithm instance via factory', () => {
        const instance = createAlgorithm('top-5-acclaimed')
        expect(instance).toBeInstanceOf(Top5AcclaimedAlgorithm)
    })
})
