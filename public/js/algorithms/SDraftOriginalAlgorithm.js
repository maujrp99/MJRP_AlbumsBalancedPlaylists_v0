/**
 * SDraftOriginalAlgorithm - Full Serpentine algorithm (Algorithm #1)
 * 
 * The original MJRP algorithm design with complete Serpentine distribution.
 * - P1: Greatest Hits Vol. 1 (rank #1 from each album)
 * - P2: Greatest Hits Vol. 2 (rank #2 from each album)
 * - P3-N: Deep Cuts distributed via Serpentine (odd/even album logic)
 * 
 * Rules of Thumb:
 * - ~45 min per playlist (±7 min flexibility)
 * - All playlists must have tracks from all albums
 * - All tracks from all albums must be used
 * 
 * @module algorithms/SDraftOriginalAlgorithm
 */

import { BaseAlgorithm } from './BaseAlgorithm.js'
import { LegacyRoundRobinAlgorithm } from './LegacyRoundRobinAlgorithm.js'

const DEFAULT_TARGET_SECONDS = 45 * 60 // 45 minutes
const FLEXIBILITY_SECONDS = 7 * 60 // ±7 minutes
const P_HITS = 2 // Number of Greatest Hits playlists

export class SDraftOriginalAlgorithm extends BaseAlgorithm {
    static metadata = {
        id: 's-draft-original',
        name: 'S-Draft Serpentine',
        badge: 'CLASSIC',
        description: 'Algoritmo clássico: distribui faixas em zigue-zague entre as playlists para máxima variedade.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super(opts)
        this.targetSeconds = opts.targetSeconds || DEFAULT_TARGET_SECONDS
        this.flexibilitySeconds = opts.flexibilitySeconds || FLEXIBILITY_SECONDS

        // Use Legacy for enrichTracks (shared logic)
        this._legacyHelper = new LegacyRoundRobinAlgorithm(opts)

        // Register default source
        this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
            name: 'MJRP S-Draft Original',
            type: 'internal',
            description: 'Curadoria S-Draft com Serpentine completo',
            secure: true
        })
    }

    /**
     * Generate playlists using S-Draft Original algorithm
     * @param {Array} albums - Albums with tracks
     * @param {Object} opts - Options
     * @returns {Object} { playlists, rankingSummary, rankingSources }
     */
    generate(albums, opts = {}) {
        // Phase 1: Preparation & Ranking
        const workingAlbums = (albums || []).map((album, albumIndex) => ({
            ...album,
            tracks: this._legacyHelper.enrichTracks(album),
            _albumIndex: albumIndex // Track original order for odd/even logic
        }))

        // Initialize Greatest Hits playlists
        const playlists = [
            { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
            { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
        ]

        // Collect remaining tracks per album with their album index
        const remainingByAlbum = [] // Array of { albumIndex, albumId, tracks: [...] }

        // Phase 2: Extract Greatest Hits
        for (const album of workingAlbums) {
            if (!album || !album.id) continue
            this.albumLookup.set(album.id, album)

            if (Array.isArray(album.rankingSources)) {
                album.rankingSources.forEach(s => this.registerRankingSource(s))
            }

            if (!Array.isArray(album.tracks) || album.tracks.length === 0) continue

            // Sort tracks by rank
            const sortedTracks = [...album.tracks].sort((a, b) => {
                const rankA = a.acclaimRank ?? a.rank ?? Number.POSITIVE_INFINITY
                const rankB = b.acclaimRank ?? b.rank ?? Number.POSITIVE_INFINITY
                return rankA - rankB
            })

            // P1: Rank #1
            const t1 = sortedTracks[0]
            if (t1) {
                this.markTrackOrigin(t1, album.id)
                this.annotateTrack(t1, 'P1 Greatest Hit', this.defaultRankingSource, 1)
                playlists[0].tracks.push({ ...t1 })
            }

            // P2: Rank #2
            const t2 = sortedTracks[1]
            if (t2) {
                this.markTrackOrigin(t2, album.id)
                this.annotateTrack(t2, 'P2 Greatest Hit', this.defaultRankingSource, 0.95)
                playlists[1].tracks.push({ ...t2 })
            }

            // Remaining tracks (rank #3+)
            const remaining = sortedTracks.slice(2).map(t => {
                this.markTrackOrigin(t, album.id)
                return { ...t }
            })

            if (remaining.length > 0) {
                remainingByAlbum.push({
                    albumIndex: album._albumIndex,
                    albumId: album.id,
                    tracks: remaining
                })
            }
        }

        // Calculate total remaining duration for Deep Cuts playlists
        const totalRemainingDuration = remainingByAlbum.reduce(
            (sum, item) => sum + this.calculateTotalDuration(item.tracks),
            0
        )
        const deepCutCount = Math.max(1, Math.ceil(totalRemainingDuration / this.targetSeconds))

        // Create Deep Cuts playlists
        for (let i = 0; i < deepCutCount; i++) {
            playlists.push({
                id: `p${P_HITS + i + 1}`,
                title: `Deep Cuts Vol. ${i + 1}`,
                subtitle: 'S-Draft Serpentine',
                tracks: []
            })
        }

        // Phase 3: Serpentine Distribution
        const firstDeepCut = P_HITS // Index of first Deep Cut playlist (p3)
        const lastDeepCut = P_HITS + deepCutCount - 1 // Index of last Deep Cut playlist

        for (const albumData of remainingByAlbum) {
            const isOddAlbum = (albumData.albumIndex % 2 === 0) // 0-indexed, so 0,2,4 are "album 1,3,5"
            const tracks = albumData.tracks

            if (isOddAlbum) {
                // RULE A: Odd albums - distribute P → P3 (reverse order)
                this.distributeSerpentine(tracks, playlists, lastDeepCut, firstDeepCut, -1)
            } else {
                // RULE B: Even albums - distribute P3 → P (forward order)
                this.distributeSerpentine(tracks, playlists, firstDeepCut, lastDeepCut, 1)
            }
        }

        // Phase 4: Duration rebalancing
        this.runSwapBalancing(playlists)

        // Build summary
        const rankingSummary = this.buildRankingSummary(playlists)

        return {
            playlists,
            rankingSummary,
            rankingSources: this.getRankingSources()
        }
    }

    /**
     * Distribute tracks using Serpentine pattern
     * @param {Array} tracks - Tracks to distribute
     * @param {Array} playlists - All playlists
     * @param {number} startIdx - Starting playlist index
     * @param {number} endIdx - Ending playlist index
     * @param {number} direction - 1 for forward, -1 for reverse
     */
    distributeSerpentine(tracks, playlists, startIdx, endIdx, direction) {
        let playlistIdx = startIdx
        let currentDirection = direction

        for (const track of tracks) {
            // Add track to current playlist
            playlists[playlistIdx].tracks.push(track)
            this.annotateTrack(track, `Serpentine: ${playlists[playlistIdx].id}`, this.defaultRankingSource, 0.5)

            // Move to next position
            playlistIdx += currentDirection

            // Check for turn points
            if (currentDirection === 1 && playlistIdx > endIdx) {
                // Hit bottom, reverse direction
                currentDirection = -1
                playlistIdx = endIdx
            } else if (currentDirection === -1 && playlistIdx < endIdx) {
                // Hit top, reverse direction (endIdx is actually the start in reverse)
                currentDirection = 1
                playlistIdx = endIdx
            }

            // Handle edge case: single Deep Cut playlist
            if (startIdx === endIdx) {
                playlistIdx = startIdx
            }
        }
    }

    /**
     * Balance playlist durations via track swapping (same as Legacy)
     * @param {Array} playlists 
     */
    runSwapBalancing(playlists) {
        const MAX_ITERATIONS = 100

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            const playlistDurations = playlists.map(playlist => ({
                id: playlist.id,
                duration: this.calculateTotalDuration(playlist.tracks),
                playlist
            }))

            playlistDurations.sort((a, b) => a.duration - b.duration)
            const pUnder = playlistDurations[0]
            const pOver = playlistDurations[playlistDurations.length - 1]

            const underOk = pUnder.duration >= (this.targetSeconds - this.flexibilitySeconds)
            const overOk = pOver.duration <= (this.targetSeconds + this.flexibilitySeconds)
            if (underOk && overOk) return

            let bestSwap = {
                trackOver: null,
                trackUnder: null,
                newGap: Math.abs(pOver.duration - pUnder.duration)
            }

            for (const trackOver of pOver.playlist.tracks) {
                for (const trackUnder of pUnder.playlist.tracks) {
                    if (!this.isSwapValid(pOver.playlist, pUnder.playlist, trackOver, trackUnder)) continue

                    const newOverDuration = pOver.duration - (trackOver.duration || 0) + (trackUnder.duration || 0)
                    const newUnderDuration = pUnder.duration - (trackUnder.duration || 0) + (trackOver.duration || 0)
                    const gap = Math.abs(newOverDuration - newUnderDuration)

                    if (gap < bestSwap.newGap) {
                        bestSwap = { trackOver, trackUnder, newGap: gap }
                    }
                }
            }

            if (bestSwap.trackOver) {
                this.annotateTrack(bestSwap.trackOver, `Swap: moved to ${pUnder.playlist.id}`, this.defaultRankingSource, 0.45)
                this.annotateTrack(bestSwap.trackUnder, `Swap: moved to ${pOver.playlist.id}`, this.defaultRankingSource, 0.45)

                pOver.playlist.tracks = pOver.playlist.tracks.filter(t => t.id !== bestSwap.trackOver.id)
                pOver.playlist.tracks.push(bestSwap.trackUnder)
                pUnder.playlist.tracks = pUnder.playlist.tracks.filter(t => t.id !== bestSwap.trackUnder.id)
                pUnder.playlist.tracks.push(bestSwap.trackOver)
            } else {
                return // No valid swap found
            }
        }
    }

    /**
     * Check if swap is valid (protect Greatest Hits top tracks)
     */
    isSwapValid(pOver, pUnder, trackOver, trackUnder) {
        const rankOver = trackOver?.acclaimRank ?? trackOver?.rank ?? null

        if (rankOver === 1 && pOver.id === 'p1') return false
        if (rankOver === 2 && pOver.id === 'p2') return false

        return true
    }
}

export default SDraftOriginalAlgorithm
