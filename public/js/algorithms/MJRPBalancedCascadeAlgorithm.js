/**
 * MJRPBalancedCascadeAlgorithm - Algorithm #2 (Recommended)
 * 
 * Hybrid algorithm combining Serpentine distribution with Cascade rebalancing.
 * 
 * Phases:
 * 1. Greatest Hits: #1 and #2 only (split if >60 min)
 * 2. Serpentine (First Pass): Odd albums DC_last→DC1, Even albums DC1→DC_last
 * 3. Cascade Global: Excess tracks in ping-pong by ranking
 * 4. Duration Trim: Move excess from DC>48min to Orphan Tracks
 * 
 * @module algorithms/MJRPBalancedCascadeAlgorithm
 */

import { BaseAlgorithm } from './BaseAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'
import { DurationTrimmingMixin } from './mixins/index.js'

const GREATEST_HITS_MAX = 60 * 60 // 60 minutes
const DEEP_CUTS_MAX = 48 * 60 // 48 minutes (strict)
const MINIMUM_DURATION = 30 * 60 // 30 minutes

// Apply mixin to base class
const BaseWithTrimming = DurationTrimmingMixin(BaseAlgorithm)

export class MJRPBalancedCascadeAlgorithm extends BaseWithTrimming {
    static metadata = {
        id: 'mjrp-balanced-cascade',
        name: 'MJRP Balanced Cascade',
        badge: 'RECOMMENDED',
        description: 'Cria playlists balanceadas mesclando as melhores faixas de cada álbum. Playlists curtas são combinadas automaticamente.',
        isRecommended: true
    }

    constructor(opts = {}) {
        super(opts)
        this.greatestHitsMax = opts.greatestHitsMax || GREATEST_HITS_MAX
        this.deepCutsMax = opts.deepCutsMax || DEEP_CUTS_MAX
        this.minimumDuration = opts.minimumDuration || MINIMUM_DURATION

        this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
            name: 'MJRP Balanced Cascade',
            type: 'internal',
            description: 'Curadoria MJRP Balanced Cascade',
            secure: true
        })
    }

    /**
     * Generate playlists using MJRP Balanced Cascade algorithm
     */
    generate(albums, opts = {}) {
        // Phase 1: Preparation (Input Adaptation Phase)
        // Use injected strategy or default to Balanced
        const strategy = opts.rankingStrategy || new BalancedRankingStrategy()

        console.log(`[MJRPBalancedCascadeAlgorithm] Using properties:`, strategy.constructor.name)

        const workingAlbums = (albums || []).map((album, albumIndex) => {
            // DECOUPLED: Use the strategy to rank tracks
            const rankedTracks = strategy.rank(album)

            return {
                ...album,
                tracks: rankedTracks,
                _albumIndex: albumIndex
            }
        })

        const playlists = []
        const allAlbumIds = new Set()
        const albumTrackCounts = new Map()

        // Collect #1 and #2 tracks
        const rank1ByAlbum = new Map()
        const rank2ByAlbum = new Map()
        const remainingByAlbum = [] // tracks #3+

        // Phase 2: Extract Greatest Hits
        for (const album of workingAlbums) {
            if (!album || !album.id) continue
            allAlbumIds.add(album.id)
            this.albumLookup.set(album.id, album)

            if (Array.isArray(album.rankingSources)) {
                album.rankingSources.forEach(s => this.registerRankingSource(s))
            }

            if (!Array.isArray(album.tracks) || album.tracks.length === 0) continue

            // Strategy has already sorted tracks and assigned _rank (1-based)
            const sortedTracks = album.tracks // Trust the input strategy

            albumTrackCounts.set(album.id, sortedTracks.length)

            // Collect rank #1
            if (sortedTracks.length > 0 && sortedTracks[0]._rank === 1) {
                const t1 = { ...sortedTracks[0] }
                this.markTrackOrigin(t1, album.id)
                this.annotateTrack(t1, 'Greatest Hit #1', this.defaultRankingSource, 1)
                rank1ByAlbum.set(album.id, t1)
            }

            // Collect rank #2
            if (sortedTracks.length > 1 && sortedTracks[1]._rank === 2) {
                const t2 = { ...sortedTracks[1] }
                this.markTrackOrigin(t2, album.id)
                this.annotateTrack(t2, 'Greatest Hit #2', this.defaultRankingSource, 0.95)
                rank2ByAlbum.set(album.id, t2)
            }

            // Remaining tracks #3+ with rank info
            const remaining = sortedTracks.slice(2).map((t) => {
                const copy = { ...t }
                this.markTrackOrigin(copy, album.id)
                return copy
            })

            if (remaining.length > 0) {
                remainingByAlbum.push({
                    albumIndex: album._albumIndex,
                    albumId: album.id,
                    isOdd: album._albumIndex % 2 === 0, // 0-indexed: 0,2,4 = odd in 1-indexed
                    tracks: remaining
                })
            }
        }

        // Create Greatest Hits
        const rank1Tracks = Array.from(rank1ByAlbum.values())
        const rank2Tracks = Array.from(rank2ByAlbum.values())
        const rank1Duration = this.calculateTotalDuration(rank1Tracks)
        const rank2Duration = this.calculateTotalDuration(rank2Tracks)
        const combinedGHDuration = rank1Duration + rank2Duration

        if (combinedGHDuration <= this.greatestHitsMax) {
            playlists.push({
                id: 'p1',
                title: 'Greatest Hits',
                subtitle: 'Rank #1 e #2 de cada álbum',
                tracks: [...rank1Tracks, ...rank2Tracks]
            })
        } else {
            playlists.push({
                id: 'p1',
                title: 'Greatest Hits Vol. 1',
                subtitle: 'Rank #1 de cada álbum',
                tracks: rank1Tracks
            })
            playlists.push({
                id: 'p2',
                title: 'Greatest Hits Vol. 2',
                subtitle: 'Rank #2 de cada álbum',
                tracks: rank2Tracks
            })
        }

        const firstDeepCutIndex = playlists.length

        // Calculate numDC based on minTracks - 2
        const counts = Array.from(albumTrackCounts.values())
        const minTracksPerAlbum = counts.length > 0 ? Math.min(...counts) : 0
        const numDC = Math.max(1, minTracksPerAlbum - 2)
        const maxRankInFirstPass = numDC + 2 // e.g., if numDC=7, first pass covers #3-#9

        console.log(`[Cascade] minTracks=${minTracksPerAlbum}, numDC=${numDC}, firstPass=#3-#${maxRankInFirstPass}`)

        // Create Deep Cuts playlists
        for (let i = 0; i < numDC; i++) {
            playlists.push({
                id: `p${firstDeepCutIndex + i + 1}`,
                title: `Deep Cuts Vol. ${i + 1}`,
                subtitle: 'MJRP Balanced Cascade',
                tracks: []
            })
        }

        // Phase 3a: Serpentine Distribution (First Pass)
        // Separate odd and even albums
        const oddAlbums = remainingByAlbum.filter(a => a.isOdd)
        const evenAlbums = remainingByAlbum.filter(a => !a.isOdd)

        // Odd albums: DC_last → DC1 (reverse)
        for (const albumData of oddAlbums) {
            let dcIdx = firstDeepCutIndex + numDC - 1 // Start at last DC
            let direction = -1

            for (const track of albumData.tracks) {
                if (track._rank > maxRankInFirstPass) break // Excess for cascade

                playlists[dcIdx].tracks.push(track)
                this.annotateTrack(track, `Serpentine odd: DC${dcIdx - firstDeepCutIndex + 1}`, this.defaultRankingSource, 0.6)

                dcIdx += direction
                if (dcIdx < firstDeepCutIndex) {
                    direction = 1
                    dcIdx = firstDeepCutIndex
                } else if (dcIdx >= firstDeepCutIndex + numDC) {
                    direction = -1
                    dcIdx = firstDeepCutIndex + numDC - 1
                }
            }
        }

        // Even albums: DC1 → DC_last (forward)
        for (const albumData of evenAlbums) {
            let dcIdx = firstDeepCutIndex // Start at first DC
            let direction = 1

            for (const track of albumData.tracks) {
                if (track._rank > maxRankInFirstPass) break // Excess for cascade

                playlists[dcIdx].tracks.push(track)
                this.annotateTrack(track, `Serpentine even: DC${dcIdx - firstDeepCutIndex + 1}`, this.defaultRankingSource, 0.6)

                dcIdx += direction
                if (dcIdx >= firstDeepCutIndex + numDC) {
                    direction = -1
                    dcIdx = firstDeepCutIndex + numDC - 1
                } else if (dcIdx < firstDeepCutIndex) {
                    direction = 1
                    dcIdx = firstDeepCutIndex
                }
            }
        }

        // Phase 3b: Cascade Global (Excess tracks #maxRankInFirstPass+1 onwards)
        // Collect all excess tracks by rank
        const excessByRank = new Map() // rank -> [tracks]

        for (const albumData of remainingByAlbum) {
            for (const track of albumData.tracks) {
                if (track._rank > maxRankInFirstPass) {
                    if (!excessByRank.has(track._rank)) {
                        excessByRank.set(track._rank, [])
                    }
                    excessByRank.get(track._rank).push(track)
                }
            }
        }

        // Distribute in ping-pong starting from DC_last
        const sortedRanks = Array.from(excessByRank.keys()).sort((a, b) => a - b)
        let cascadeIdx = firstDeepCutIndex + numDC - 1 // Start at last DC
        let cascadeDirection = -1

        for (const rank of sortedRanks) {
            const tracksAtRank = excessByRank.get(rank)

            for (const track of tracksAtRank) {
                playlists[cascadeIdx].tracks.push(track)
                this.annotateTrack(track, `Cascade #${rank}: DC${cascadeIdx - firstDeepCutIndex + 1}`, this.defaultRankingSource, 0.4)
            }

            // Move to next DC in cascade direction
            cascadeIdx += cascadeDirection
            if (cascadeIdx < firstDeepCutIndex) {
                cascadeDirection = 1
                cascadeIdx = firstDeepCutIndex
            } else if (cascadeIdx >= firstDeepCutIndex + numDC) {
                cascadeDirection = -1
                cascadeIdx = firstDeepCutIndex + numDC - 1
            }
        }

        // Phase 3.5: Merge small adjacent playlists (front to back)
        this.mergeSmallPlaylists(playlists, firstDeepCutIndex)

        // Phase 4: Duration Trim (move excess to Orphan Tracks)
        this.trimOverDurationPlaylists(playlists, firstDeepCutIndex)

        // Renumber IDs
        playlists.forEach((p, idx) => {
            p.id = `p${idx + 1}`
        })

        // Build summary
        const rankingSummary = this.buildRankingSummary(playlists)

        return {
            playlists,
            rankingSummary,
            rankingSources: this.getRankingSources()
        }
    }

    /**
     * Merge adjacent small Deep Cuts playlists if combined duration < 48 min
     * Loop from front (DC1) to back - earlier DCs tend to be smaller
     * Maintains ranking grouping within merged playlist
     */
    mergeSmallPlaylists(playlists, firstDeepCutIndex) {
        let i = firstDeepCutIndex

        while (i < playlists.length - 1) {
            const current = playlists[i]
            const next = playlists[i + 1]

            // Skip GH playlists and Orphan Tracks
            if (current.title.includes('Greatest Hits') ||
                next.title.includes('Greatest Hits') ||
                current.title === 'Orphan Tracks' ||
                next.title === 'Orphan Tracks') {
                i++
                continue
            }

            const currentDuration = this.calculateTotalDuration(current.tracks)
            const nextDuration = this.calculateTotalDuration(next.tracks)
            const combinedDuration = currentDuration + nextDuration

            if (combinedDuration < this.deepCutsMax) {
                console.log(`[Cascade] Merging playlists: "${current.title}" (${Math.round(currentDuration / 60)}min) + "${next.title}" (${Math.round(nextDuration / 60)}min) = ${Math.round(combinedDuration / 60)}min`)

                // Merge: move all tracks from next into current
                for (const track of next.tracks) {
                    current.tracks.push(track)
                    this.annotateTrack(track, `Merged from ${next.title}`, this.defaultRankingSource, 0.5)
                }

                // Sort by rank to maintain grouping
                current.tracks.sort((a, b) => (a._rank || 0) - (b._rank || 0))

                // Update title to reflect merged content
                const currentVolMatch = current.title.match(/Vol\. (\d+)/)
                const nextVolMatch = next.title.match(/Vol\. (\d+)/)
                if (currentVolMatch && nextVolMatch) {
                    current.title = `Deep Cuts Vol. ${currentVolMatch[1]}-${nextVolMatch[1]}`
                }

                // Remove the merged playlist
                playlists.splice(i + 1, 1)

                // Don't increment i - check if we can merge again with new next
            } else {
                i++
            }
        }

        // Renumber Deep Cuts after merge
        let dcNum = 1
        for (let j = firstDeepCutIndex; j < playlists.length; j++) {
            if (playlists[j].title.includes('Deep Cuts') && !playlists[j].title.includes('-')) {
                playlists[j].title = `Deep Cuts Vol. ${dcNum}`
                dcNum++
            } else if (playlists[j].title.includes('-')) {
                // Already a merged title, just update the first number
                playlists[j].title = playlists[j].title.replace(/Vol\. \d+-/, `Vol. ${dcNum}-`)
                dcNum++
            }
        }
    }

    // NOTE: trimOverDurationPlaylists is now inherited from DurationTrimmingMixin
}

export default MJRPBalancedCascadeAlgorithm

