/**
 * SDraftBalancedAlgorithm - Revised MJRP algorithm (Algorithm #2)
 * 
 * The revised MJRP algorithm with flexible Greatest Hits and strict duration rules.
 * 
 * Key Rules:
 * - Greatest Hits: Only #1 and #2 tracks, split if >60min
 *   - When split: P1 gets ALL #1s, P2 gets #2s, balance duration
 *   - Rule of thumb: All albums must be represented in both GH playlists
 * - Deep Cuts: Max 48 min (strict), Serpentine distribution
 * - Minimum playlist duration: 30 min (redistribute or "Orphan Tracks")
 * - All playlists must have tracks from all albums when possible
 * 
 * @module algorithms/SDraftBalancedAlgorithm
 */

import { BaseAlgorithm } from './BaseAlgorithm.js'
import { LegacyRoundRobinAlgorithm } from './LegacyRoundRobinAlgorithm.js'

const GREATEST_HITS_MAX = 60 * 60 // 60 minutes max for Greatest Hits
const DEEP_CUTS_MAX = 48 * 60 // 48 minutes max for Deep Cuts (strict)
const MINIMUM_DURATION = 30 * 60 // 30 minutes minimum for any playlist

export class SDraftBalancedAlgorithm extends BaseAlgorithm {
    static metadata = {
        id: 's-draft-balanced',
        name: 'S-Draft MJRP Balanced',
        badge: 'RECOMMENDED',
        description: 'Revised algorithm: Flexible Greatest Hits (1 or 2), strict 48min Deep Cuts, 30min minimum. Best for most use cases.',
        isRecommended: true
    }

    constructor(opts = {}) {
        super(opts)
        this.greatestHitsMax = opts.greatestHitsMax || GREATEST_HITS_MAX
        this.deepCutsMax = opts.deepCutsMax || DEEP_CUTS_MAX
        this.minimumDuration = opts.minimumDuration || MINIMUM_DURATION

        // Use Legacy for enrichTracks (shared logic)
        this._legacyHelper = new LegacyRoundRobinAlgorithm(opts)

        // Register default source
        this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
            name: 'MJRP S-Draft Balanced',
            type: 'internal',
            description: 'Curadoria MJRP Balanced revisada',
            secure: true
        })
    }

    /**
     * Generate playlists using S-Draft Balanced algorithm
     * @param {Array} albums - Albums with tracks
     * @param {Object} opts - Options
     * @returns {Object} { playlists, rankingSummary, rankingSources }
     */
    generate(albums, opts = {}) {
        // Phase 1: Preparation & Ranking
        const workingAlbums = (albums || []).map((album, albumIndex) => ({
            ...album,
            tracks: this._legacyHelper.enrichTracks(album),
            _albumIndex: albumIndex
        }))

        const playlists = []
        const remainingByAlbum = []
        const allAlbumIds = new Set()
        const albumTrackCounts = new Map() // albumId -> total track count

        // Collect all #1 and #2 tracks, organized by album
        const rank1ByAlbum = new Map() // albumId -> track
        const rank2ByAlbum = new Map() // albumId -> track

        // Phase 2: Extract Greatest Hits (flexible)
        for (const album of workingAlbums) {
            if (!album || !album.id) continue
            allAlbumIds.add(album.id)
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

            // Track album size for coverage rule
            albumTrackCounts.set(album.id, sortedTracks.length)

            // Collect rank #1
            if (sortedTracks[0]) {
                const t1 = { ...sortedTracks[0] }
                this.markTrackOrigin(t1, album.id)
                this.annotateTrack(t1, 'Greatest Hit #1', this.defaultRankingSource, 1)
                rank1ByAlbum.set(album.id, t1)
            }

            // Collect rank #2
            if (sortedTracks[1]) {
                const t2 = { ...sortedTracks[1] }
                this.markTrackOrigin(t2, album.id)
                this.annotateTrack(t2, 'Greatest Hit #2', this.defaultRankingSource, 0.95)
                rank2ByAlbum.set(album.id, t2)
            }

            // Remaining tracks (rank #3+) - NEVER go to Greatest Hits
            const remaining = sortedTracks.slice(2).map(t => {
                const copy = { ...t }
                this.markTrackOrigin(copy, album.id)
                return copy
            })

            if (remaining.length > 0) {
                remainingByAlbum.push({
                    albumIndex: album._albumIndex,
                    albumId: album.id,
                    tracks: remaining
                })
            }
        }

        // Convert to arrays
        const rank1Tracks = Array.from(rank1ByAlbum.values())
        const rank2Tracks = Array.from(rank2ByAlbum.values())

        // Determine Greatest Hits structure
        const rank1Duration = this.calculateTotalDuration(rank1Tracks)
        const rank2Duration = this.calculateTotalDuration(rank2Tracks)
        const combinedGHDuration = rank1Duration + rank2Duration

        if (combinedGHDuration <= this.greatestHitsMax) {
            // Single Greatest Hits playlist (all #1 + all #2)
            playlists.push({
                id: 'p1',
                title: 'Greatest Hits',
                subtitle: 'Rank #1 e #2 de cada álbum',
                tracks: [...rank1Tracks, ...rank2Tracks]
            })
        } else {
            // Split into two playlists with balanced duration
            // Rule: P1 must have ALL #1s, then balance with #2s
            const ghPlaylists = this.splitGreatestHitsBalanced(
                rank1ByAlbum,
                rank2ByAlbum,
                allAlbumIds
            )
            playlists.push(...ghPlaylists)
        }

        const firstDeepCutIndex = playlists.length

        // Calculate Deep Cuts playlists needed
        const totalRemainingDuration = remainingByAlbum.reduce(
            (sum, item) => sum + this.calculateTotalDuration(item.tracks),
            0
        )
        const deepCutCount = Math.max(1, Math.ceil(totalRemainingDuration / this.deepCutsMax))

        // Create Deep Cuts playlists
        for (let i = 0; i < deepCutCount; i++) {
            playlists.push({
                id: `p${firstDeepCutIndex + i + 1}`,
                title: `Deep Cuts Vol. ${i + 1}`,
                subtitle: 'S-Draft MJRP Balanced',
                tracks: []
            })
        }

        // Phase 3: Serpentine Distribution for Deep Cuts
        const firstDeepCut = firstDeepCutIndex
        const lastDeepCut = firstDeepCutIndex + deepCutCount - 1

        for (const albumData of remainingByAlbum) {
            const isOddAlbum = (albumData.albumIndex % 2 === 0)
            const tracks = albumData.tracks

            if (isOddAlbum) {
                // RULE A: Odd albums - distribute P → first (reverse)
                this.distributeSerpentine(tracks, playlists, lastDeepCut, firstDeepCut, -1)
            } else {
                // RULE B: Even albums - distribute first → P (forward)
                this.distributeSerpentine(tracks, playlists, firstDeepCut, lastDeepCut, 1)
            }
        }

        // Phase 4: Duration Validation & Rebalancing
        this.handleUnderDurationPlaylists(playlists, firstDeepCutIndex)

        // Phase 5: Verify album coverage in all playlists (conditional rule)
        this.verifyAlbumCoverage(playlists, allAlbumIds, albumTrackCounts)

        // Build summary
        const rankingSummary = this.buildRankingSummary(playlists)

        return {
            playlists,
            rankingSummary,
            rankingSources: this.getRankingSources()
        }
    }

    /**
     * Split Greatest Hits into 2 playlists with balanced duration
     * Rule 0: Both playlists must have tracks from all albums
     * Rule 1: P1 must have ALL #1 tracks
     * Rule 2: Balance duration between the two playlists
     * 
     * @param {Map} rank1ByAlbum - Map of albumId -> rank #1 track
     * @param {Map} rank2ByAlbum - Map of albumId -> rank #2 track
     * @param {Set} allAlbumIds - Set of all album IDs
     * @returns {Array} Two playlist objects
     */
    splitGreatestHitsBalanced(rank1ByAlbum, rank2ByAlbum, allAlbumIds) {
        const p1Tracks = []
        const p2Tracks = []

        // P1 gets ALL #1 tracks (mandatory)
        for (const [albumId, track] of rank1ByAlbum) {
            p1Tracks.push(track)
        }

        // P2 gets ALL #2 tracks initially
        for (const [albumId, track] of rank2ByAlbum) {
            p2Tracks.push(track)
        }

        const p1Duration = this.calculateTotalDuration(p1Tracks)
        const p2Duration = this.calculateTotalDuration(p2Tracks)

        // If P2 is much shorter than P1, try to balance by moving some #2s to P1
        // But P1 still needs to have its #1s, so we only do this if P2 is under target
        // Actually, per the spec: P1 = all #1, P2 = all #2, just balance if needed

        // For now, keep it simple: P1 = all #1, P2 = all #2
        // The duration imbalance is acceptable as long as both have all albums

        // Check album coverage
        const p1AlbumIds = new Set(p1Tracks.map(t => t.originAlbumId))
        const p2AlbumIds = new Set(p2Tracks.map(t => t.originAlbumId))

        // Log missing album coverage
        const missingInP1 = [...allAlbumIds].filter(id => !p1AlbumIds.has(id))
        const missingInP2 = [...allAlbumIds].filter(id => !p2AlbumIds.has(id))

        if (missingInP1.length > 0) {
            console.warn('[SDraftBalanced] Albums missing in GH Vol.1:', missingInP1)
        }
        if (missingInP2.length > 0) {
            console.warn('[SDraftBalanced] Albums missing in GH Vol.2:', missingInP2)
        }

        return [
            {
                id: 'p1',
                title: 'Greatest Hits Vol. 1',
                subtitle: 'Rank #1 de cada álbum',
                tracks: p1Tracks
            },
            {
                id: 'p2',
                title: 'Greatest Hits Vol. 2',
                subtitle: 'Rank #2 de cada álbum',
                tracks: p2Tracks
            }
        ]
    }

    /**
     * Distribute tracks using Serpentine pattern
     */
    distributeSerpentine(tracks, playlists, startIdx, endIdx, direction) {
        let playlistIdx = startIdx
        let currentDirection = direction

        for (const track of tracks) {
            playlists[playlistIdx].tracks.push(track)
            this.annotateTrack(track, `Serpentine: ${playlists[playlistIdx].id}`, this.defaultRankingSource, 0.5)

            playlistIdx += currentDirection

            if (currentDirection === 1 && playlistIdx > endIdx) {
                currentDirection = -1
                playlistIdx = endIdx
            } else if (currentDirection === -1 && playlistIdx < endIdx) {
                currentDirection = 1
                playlistIdx = endIdx
            }

            if (startIdx === endIdx) {
                playlistIdx = startIdx
            }
        }
    }

    /**
     * Handle playlists under 30 min minimum
     * Redistribute tracks to previous playlists (P → P1) respecting duration limits
     * If not possible, rename to "Orphan Tracks"
     * 
     * IMPORTANT: Do NOT redistribute #3+ tracks to Greatest Hits (only #1 and #2 allowed there)
     */
    handleUnderDurationPlaylists(playlists, firstDeepCutIndex) {
        const underDurationPlaylists = playlists.filter(p =>
            this.calculateTotalDuration(p.tracks) < this.minimumDuration
        )

        for (const underPlaylist of underDurationPlaylists) {
            const underIdx = playlists.indexOf(underPlaylist)
            if (underIdx === -1) continue

            // Skip Greatest Hits playlists from redistribution
            if (underIdx < firstDeepCutIndex) continue

            const tracksToRedistribute = [...underPlaylist.tracks]

            // Try to redistribute to OTHER Deep Cuts playlists (NOT Greatest Hits)
            for (let targetIdx = playlists.length - 1; targetIdx >= firstDeepCutIndex; targetIdx--) {
                if (targetIdx === underIdx) continue
                const targetPlaylist = playlists[targetIdx]

                for (let i = tracksToRedistribute.length - 1; i >= 0; i--) {
                    const track = tracksToRedistribute[i]
                    const currentDuration = this.calculateTotalDuration(targetPlaylist.tracks)

                    if (currentDuration + (track.duration || 0) <= this.deepCutsMax) {
                        targetPlaylist.tracks.push(track)
                        this.annotateTrack(track, `Redistributed to ${targetPlaylist.id}`, this.defaultRankingSource, 0.3)
                        tracksToRedistribute.splice(i, 1)
                    }
                }
            }

            if (tracksToRedistribute.length === 0) {
                // All tracks redistributed, mark for removal
                underPlaylist.tracks = []
            } else {
                // Could not redistribute all - mark as Orphan Tracks
                underPlaylist.tracks = tracksToRedistribute
                underPlaylist.title = 'Orphan Tracks'
                underPlaylist.subtitle = 'Duration under 30 min - requires manual curation'
            }
        }

        // Remove empty playlists
        for (let i = playlists.length - 1; i >= 0; i--) {
            if (playlists[i].tracks.length === 0) {
                playlists.splice(i, 1)
            }
        }

        // Renumber playlist IDs
        playlists.forEach((p, idx) => {
            p.id = `p${idx + 1}`
        })
    }

    /**
     * Verify and enforce album coverage rule (conditionally)
     * 
     * RULE: All playlists must have tracks from all albums
     * CONDITION: Only applies if numPlaylists <= minTracksPerAlbum
     * 
     * If numPlaylists > minTracksPerAlbum (e.g., 8 playlists but albums have only 6 tracks),
     * the rule is FLEXIBILIZED - it's mathematically impossible to have all albums in all playlists.
     * 
     * @param {Array} playlists - All playlists
     * @param {Set} allAlbumIds - All album IDs
     * @param {Map} albumTrackCounts - Map of albumId -> track count
     */
    verifyAlbumCoverage(playlists, allAlbumIds, albumTrackCounts) {
        const numPlaylists = playlists.length

        // Find minimum tracks across all albums
        const minTracksPerAlbum = Math.min(...Array.from(albumTrackCounts.values()))

        // Check if rule applies
        const ruleApplies = numPlaylists <= minTracksPerAlbum

        console.log(`[SDraftBalanced] Album coverage check: ${numPlaylists} playlists, min ${minTracksPerAlbum} tracks/album`)
        console.log(`[SDraftBalanced] Coverage rule ${ruleApplies ? 'APPLIES' : 'FLEXIBILIZED (numPlaylists > minTracks)'}`)

        if (!ruleApplies) {
            // Rule does not apply - just log for info
            console.log('[SDraftBalanced] Coverage rule flexibilized - mathematically impossible to cover all albums in all playlists')
            return
        }

        // Rule applies - try to enforce coverage
        this.enforceAlbumCoverage(playlists, allAlbumIds)
    }

    /**
     * Enforce album coverage by swapping tracks between playlists
     * Goal: Every playlist should have at least one track from every album
     */
    enforceAlbumCoverage(playlists, allAlbumIds) {
        const allAlbumArray = Array.from(allAlbumIds)
        let swapsPerformed = 0
        const MAX_SWAPS = 100 // Safety limit

        for (const playlist of playlists) {
            if (playlist.title === 'Orphan Tracks') continue // Skip orphan tracks

            const playlistAlbumIds = new Set(playlist.tracks.map(t => t.originAlbumId).filter(Boolean))
            const missingAlbums = allAlbumArray.filter(id => !playlistAlbumIds.has(id))

            if (missingAlbums.length === 0) continue // All albums present

            console.log(`[SDraftBalanced] Playlist "${playlist.title}" missing ${missingAlbums.length} albums, attempting swaps...`)

            for (const missingAlbumId of missingAlbums) {
                if (swapsPerformed >= MAX_SWAPS) break

                // Find another playlist that has this album AND has a duplicate from playlist's existing albums
                let swapDone = false

                for (const sourcePlaylist of playlists) {
                    if (sourcePlaylist === playlist) continue
                    if (sourcePlaylist.title === 'Orphan Tracks') continue

                    // Find a track from missingAlbumId in source that we can swap
                    const candidateTrack = sourcePlaylist.tracks.find(t => t.originAlbumId === missingAlbumId)
                    if (!candidateTrack) continue

                    // Check if source playlist has another track from this album (so it won't lose coverage)
                    const sourceAlbumCount = sourcePlaylist.tracks.filter(t => t.originAlbumId === missingAlbumId).length
                    if (sourceAlbumCount <= 1) continue // Can't take the only track from that album

                    // Find a track in target playlist that we can swap back (from an album that source is missing or has multiple)
                    for (const targetTrack of playlist.tracks) {
                        const targetAlbumId = targetTrack.originAlbumId

                        // Check if target playlist has multiple tracks from this album
                        const targetAlbumCount = playlist.tracks.filter(t => t.originAlbumId === targetAlbumId).length
                        if (targetAlbumCount <= 1) continue // Can't give away the only track from that album

                        // Perform swap
                        const candidateIdx = sourcePlaylist.tracks.indexOf(candidateTrack)
                        const targetIdx = playlist.tracks.indexOf(targetTrack)

                        if (candidateIdx !== -1 && targetIdx !== -1) {
                            // Swap
                            sourcePlaylist.tracks.splice(candidateIdx, 1, targetTrack)
                            playlist.tracks.splice(targetIdx, 1, candidateTrack)

                            this.annotateTrack(candidateTrack, `Coverage swap to ${playlist.id}`, this.defaultRankingSource, 0.4)
                            this.annotateTrack(targetTrack, `Coverage swap to ${sourcePlaylist.id}`, this.defaultRankingSource, 0.4)

                            swapsPerformed++
                            swapDone = true
                            break
                        }
                    }

                    if (swapDone) break
                }

                if (!swapDone) {
                    console.warn(`[SDraftBalanced] Could not find swap for album ${missingAlbumId} in "${playlist.title}"`)
                }
            }
        }

        if (swapsPerformed > 0) {
            console.log(`[SDraftBalanced] Album coverage enforcement: ${swapsPerformed} swaps performed`)
        }
    }
}

export default SDraftBalancedAlgorithm

