/**
 * LegacyRoundRobinAlgorithm - Current implementation (Algorithm #0)
 * 
 * This is the algorithm currently coded in CurationEngine.curate().
 * It uses round-robin distribution instead of full Serpentine.
 * 
 * Output:
 * - P1: Greatest Hits Vol. 1 (rank #1 from each album)
 * - P2: Greatest Hits Vol. 2 (rank #2 from each album)
 * - P3-N: Deep Cuts (round-robin distribution)
 * 
 * @module algorithms/LegacyRoundRobinAlgorithm
 */

import { BaseAlgorithm } from './BaseAlgorithm.js'

const DEFAULT_TARGET_SECONDS = 45 * 60 // 45 minutes
const P_HITS = 2 // Number of Greatest Hits playlists

export class LegacyRoundRobinAlgorithm extends BaseAlgorithm {
    static metadata = {
        id: 'legacy-roundrobin',
        name: 'Legacy Round-Robin',
        badge: 'LEGACY',
        description: 'Modo simples: distribui faixas em rodízio. Estável e testado, bom para comparação.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super(opts)
        this.targetSeconds = opts.targetSeconds || DEFAULT_TARGET_SECONDS

        // Register default source
        this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
            name: 'MJRP Hybrid Algorithm',
            type: 'internal',
            description: 'Curadoria híbrida de faixas',
            secure: true
        })
    }

    /**
     * Generate playlists using legacy round-robin algorithm
     * @param {Array} albums - Albums with tracks
     * @param {Object} opts - Options
     * @returns {Object} { playlists, rankingSummary, rankingSources }
     */
    generate(albums, opts = {}) {
        // Enrich tracks with ranking data
        const workingAlbums = (albums || []).map(album => ({
            ...album,
            tracks: this.enrichTracks(album)
        }))

        // Initialize Greatest Hits playlists
        const playlists = [
            { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
            { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
        ]
        const remaining = []

        // Process each album
        for (const album of workingAlbums) {
            if (!album || !album.id) continue
            this.albumLookup.set(album.id, album)

            if (Array.isArray(album.rankingSources)) {
                album.rankingSources.forEach(s => this.registerRankingSource(s))
            }

            if (!Array.isArray(album.tracks)) continue

            // Work on a local copy of the album tracks
            const tracks = album.tracks.map(t => ({ ...t }))
            const idToTrack = new Map(tracks.map((t, i) => [t?.id || `idx_${i}`, t]))

            // Annotate tracks with acclaim data
            const annotated = tracks.map((t, i) => ({
                id: t?.id || `idx_${i}`,
                rating: t?.rating !== undefined && t?.rating !== null ? Number(t.rating) : null,
                origIndex: i,
                acclaimRank: t?.acclaimRank !== undefined && t?.acclaimRank !== null ? Number(t.acclaimRank) : null,
                acclaimScore: t?.acclaimScore !== undefined && t?.acclaimScore !== null ? Number(t.acclaimScore) : null,
                existingRank: t?.rank || null
            }))

            // Sort by acclaim data
            const hasExplicitAcclaimRank = annotated.some(a => a.acclaimRank !== null)
            const hasRatings = annotated.some(a => a.rating !== null)

            if (hasExplicitAcclaimRank) {
                annotated.sort((a, b) => {
                    const ra = a.acclaimRank !== null ? a.acclaimRank : Number.POSITIVE_INFINITY
                    const rb = b.acclaimRank !== null ? b.acclaimRank : Number.POSITIVE_INFINITY
                    if (ra !== rb) return ra - rb
                    const sa = a.acclaimScore !== null ? a.acclaimScore : -Infinity
                    const sb = b.acclaimScore !== null ? b.acclaimScore : -Infinity
                    if (sa !== sb) return sb - sa
                    if (a.rating !== null && b.rating !== null && a.rating !== b.rating) return b.rating - a.rating
                    return a.origIndex - b.origIndex
                })
            } else if (hasRatings) {
                annotated.sort((a, b) => {
                    const ra = a.rating || 0
                    const rb = b.rating || 0
                    if (rb !== ra) return rb - ra
                    return a.origIndex - b.origIndex
                })
            } else {
                annotated.sort((a, b) => {
                    const ra = a.existingRank || Number.POSITIVE_INFINITY
                    const rb = b.existingRank || Number.POSITIVE_INFINITY
                    if (ra !== rb) return ra - rb
                    return a.origIndex - b.origIndex
                })
            }

            // Build acclaim-ordered tracks
            const acclaimOrderedTracks = annotated.map((a, idx) => {
                const t = idToTrack.get(a.id)
                if (!t) return null
                const appliedRank = a.acclaimRank !== null ? a.acclaimRank : (a.existingRank !== null ? a.existingRank : (idx + 1))
                t.acclaimRank = appliedRank
                t.acclaimScore = a.acclaimScore !== null ? a.acclaimScore : (a.rating !== null ? a.rating : t.acclaimScore)
                t.rating = a.rating !== null ? a.rating : t.rating
                if (t.rank === undefined || t.rank === null) t.rank = appliedRank
                return t
            })

            // P1: Rank #1 from this album
            const t1 = acclaimOrderedTracks[0]
            if (t1) {
                this.markTrackOrigin(t1, album.id)
                this.annotateTrack(t1, 'P1 Hit', this.defaultRankingSource, 1)
                playlists[0].tracks.push(t1)
            }

            // P2: Rank #2 from this album
            const t2 = acclaimOrderedTracks[1]
            if (t2) {
                this.markTrackOrigin(t2, album.id)
                this.annotateTrack(t2, 'P2 Hit', this.defaultRankingSource, 0.95)
                playlists[1].tracks.push(t2)
            }

            // Remaining tracks go to deep cuts
            for (let i = 2; i < acclaimOrderedTracks.length; i++) {
                const track = acclaimOrderedTracks[i]
                if (!track) continue
                this.markTrackOrigin(track, album.id)
                remaining.push(track)
            }
        }

        // Sort remaining by acclaim rank
        remaining.sort((a, b) => {
            const rankA = Number(a?.acclaimRank ?? a?.rank ?? Number.POSITIVE_INFINITY)
            const rankB = Number(b?.acclaimRank ?? b?.rank ?? Number.POSITIVE_INFINITY)
            return rankA - rankB
        })

        // Fill Greatest Hits playlists if needed
        this.fillPlaylistIfNeeded(playlists[0], remaining)
        this.fillPlaylistIfNeeded(playlists[1], remaining)

        // Calculate number of Deep Cuts playlists needed
        const totalDeepCutsDuration = this.calculateTotalDuration(remaining)
        const deepCutCount = Math.max(1, Math.ceil(totalDeepCutsDuration / this.targetSeconds))

        for (let i = 0; i < deepCutCount; i++) {
            playlists.push({
                id: `p${P_HITS + i + 1}`,
                title: `Deep Cuts Vol. ${i + 1}`,
                subtitle: 'S-Draft Balanceado',
                tracks: []
            })
        }

        // Round-robin distribution by album bucket
        const albumBuckets = new Map()
        for (const track of remaining) {
            const key = track.originAlbumId || `__noalbum__:${track.id}`
            if (!albumBuckets.has(key)) albumBuckets.set(key, [])
            albumBuckets.get(key).push(track)
        }

        const buckets = Array.from(albumBuckets.values())
        let bucketIndex = 0
        while (buckets.some(bucket => bucket.length > 0)) {
            const bucket = buckets[bucketIndex]
            if (bucket && bucket.length > 0) {
                const track = bucket.shift()
                playlists[P_HITS + (bucketIndex % deepCutCount)].tracks.push(track)
            }
            bucketIndex = (bucketIndex + 1) % buckets.length
        }

        // Balance playlist durations via swapping
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
     * Enrich tracks with ranking data from album metadata
     * @param {Object} album 
     * @returns {Array} Enriched tracks
     */
    enrichTracks(album) {
        if (!album) return []

        const localNormalizeKey = (str) => str ? str.toLowerCase().trim().replace(/[^\w\s]/g, '') : ''

        // Build indexes from album metadata
        const consolidatedIndex = new Map()
        if (Array.isArray(album.rankingConsolidated)) {
            album.rankingConsolidated.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) consolidatedIndex.set(key, entry)
            })
        }

        const bestEverIndex = new Map()
        if (Array.isArray(album.bestEverEvidence)) {
            album.bestEverEvidence.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) bestEverIndex.set(key, entry)
            })
        }

        const acclaimIndex = new Map()
        if (Array.isArray(album.rankingAcclaim)) {
            album.rankingAcclaim.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) acclaimIndex.set(key, entry)
            })
        }

        const durationIndex = new Map()
        if (Array.isArray(album.tracks)) {
            album.tracks.forEach(track => {
                const key = localNormalizeKey(track?.title || track?.trackTitle || track?.name || '')
                if (key && track) durationIndex.set(key, track.duration || null)
            })
        }

        // Determine base tracks source
        const baseTracks = (() => {
            if (Array.isArray(album.tracksByAcclaim) && album.tracksByAcclaim.length > 0) {
                return album.tracksByAcclaim.map(track => ({ ...track }))
            }
            if (Array.isArray(album.rankingConsolidated) && album.rankingConsolidated.length > 0) {
                return album.rankingConsolidated
                    .slice()
                    .sort((a, b) => Number(a.finalPosition || a.position || 0) - Number(b.finalPosition || b.position || 0))
                    .map((entry, idx) => {
                        const title = entry.trackTitle || entry.title || `Track ${idx + 1}`
                        const key = localNormalizeKey(title)
                        const duration = key && durationIndex.has(key) ? durationIndex.get(key) : null
                        return {
                            id: entry.id || `consolidated_${album.id || 'album'}_${idx + 1}`,
                            title,
                            artist: album.artist || '',
                            album: album.title || '',
                            rank: entry.finalPosition || entry.position || null,
                            rating: entry.rating !== undefined ? entry.rating : null,
                            normalizedScore: entry.normalizedScore !== undefined ? entry.normalizedScore : null,
                            duration,
                            originAlbumId: album.id || null
                        }
                    })
            }
            return Array.isArray(album.tracks) ? album.tracks.map(track => ({ ...track })) : []
        })()

        // Enrich each track
        const enrichedTracks = baseTracks.map((track, idx) => {
            const copy = { ...track }
            const title = copy.title || copy.trackTitle || copy.name || `Track ${idx + 1}`
            copy.title = title
            const key = localNormalizeKey(title)
            const consolidatedEntry = key ? consolidatedIndex.get(key) : null

            // Determine canonical rank
            const canonicalRank = (() => {
                if (copy.canonicalRank !== undefined && copy.canonicalRank !== null) return Number(copy.canonicalRank)
                if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
                if (consolidatedEntry?.finalPosition !== undefined && consolidatedEntry?.finalPosition !== null) {
                    return Number(consolidatedEntry.finalPosition)
                }
                return null
            })()

            // Determine rating
            const rating = (() => {
                if (copy.rating !== undefined && copy.rating !== null) return Number(copy.rating)
                if (consolidatedEntry?.rating !== undefined && consolidatedEntry?.rating !== null) {
                    return Number(consolidatedEntry.rating)
                }
                const be = key ? bestEverIndex.get(key) : null
                if (be?.rating !== undefined && be?.rating !== null) return Number(be.rating)
                const ac = key ? acclaimIndex.get(key) : null
                if (ac?.rating !== undefined && ac?.rating !== null) return Number(ac.rating)

                // Fallback: Spotify Popularity
                if (copy.spotifyPopularity !== undefined && copy.spotifyPopularity !== null && copy.spotifyPopularity > -1) {
                    return Number(copy.spotifyPopularity)
                }

                return null
            })()

            // Determine normalized score
            const normalizedScore = (() => {
                if (copy.acclaimScore !== undefined && copy.acclaimScore !== null) return Number(copy.acclaimScore)
                if (copy.normalizedScore !== undefined && copy.normalizedScore !== null) return Number(copy.normalizedScore)
                if (consolidatedEntry?.normalizedScore !== undefined && consolidatedEntry?.normalizedScore !== null) {
                    return Number(consolidatedEntry.normalizedScore)
                }
                if (rating !== null) return Number(rating)
                return null
            })()

            // Determine acclaim rank
            const acclaimRank = (() => {
                if (copy.acclaimRank !== undefined && copy.acclaimRank !== null) return Number(copy.acclaimRank)
                if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
                if (consolidatedEntry?.finalPosition !== undefined && consolidatedEntry?.finalPosition !== null) {
                    return Number(consolidatedEntry.finalPosition)
                }
                // If we have a rating (including from Spotify), do NOT default to index yet.
                // We will sort and assign rank later.
                return null
            })()

            const durationFromIndex = key && durationIndex.has(key) ? durationIndex.get(key) : null

            copy.id = copy.id || `track_${album.id || 'album'}_${idx + 1}`
            copy.originAlbumId = copy.originAlbumId || album.id || null
            copy.duration = copy.duration !== undefined && copy.duration !== null ? copy.duration : durationFromIndex
            copy.artist = copy.artist || album.artist || ''
            copy.album = copy.album || album.title || ''
            copy.rating = rating
            copy.acclaimScore = normalizedScore
            copy.acclaimRank = acclaimRank
            copy.canonicalRank = canonicalRank
            copy.spotifyPopularity = copy.spotifyPopularity // Ensure this is preserved if it exists
            copy.origIndex = idx // Preserve original index for stable sort

            return copy
        })

        // Sort by score/rating and assign final ranks
        const sortedTracks = [...enrichedTracks]
        sortedTracks.sort((a, b) => {
            const ratingA = a.rating !== undefined && a.rating !== null ? Number(a.rating) : null
            const ratingB = b.rating !== undefined && b.rating !== null ? Number(b.rating) : null
            const scoreA = a.acclaimScore !== undefined && a.acclaimScore !== null ? Number(a.acclaimScore) : null
            const scoreB = b.acclaimScore !== undefined && b.acclaimScore !== null ? Number(b.acclaimScore) : null

            // Primary: Acclaim Rank (if explicit)
            const rankA = a.acclaimRank !== null ? a.acclaimRank : Number.POSITIVE_INFINITY
            const rankB = b.acclaimRank !== null ? b.acclaimRank : Number.POSITIVE_INFINITY
            if (rankA !== rankB) return rankA - rankB

            // Secondary: Rating (includes Spotify Popularity now)
            if (ratingB !== null && ratingA !== null && ratingB !== ratingA) return ratingB - ratingA

            // Tertiary: Score
            if (scoreB !== null && scoreA !== null && scoreB !== scoreA) return scoreB - scoreA

            // Quaternary: Original Order
            return (a.origIndex || 0) - (b.origIndex || 0)
        })

        sortedTracks.forEach((track, idx) => {
            if (!track) return
            // Assign rank based on sort order if it was missing
            if (track.acclaimRank === null) {
                track.acclaimRank = idx + 1
            }
            if (track.canonicalRank === undefined || track.canonicalRank === null) {
                track.canonicalRank = track.rank !== undefined && track.rank !== null ? Number(track.rank) : null
            }
            track.rank = track.acclaimRank
        })

        return sortedTracks
    }

    /**
     * Fill playlist if duration is under target
     * @param {Object} playlist 
     * @param {Array} remaining 
     */
    fillPlaylistIfNeeded(playlist, remaining) {
        let duration = this.calculateTotalDuration(playlist.tracks)
        while (duration < this.targetSeconds && remaining.length > 0) {
            const existingAlbumIds = new Set(
                (playlist.tracks || []).map(t => t.originAlbumId).filter(Boolean)
            )
            let idx = remaining.findIndex(track => !existingAlbumIds.has(track.originAlbumId))
            if (idx === -1) idx = 0

            const [candidate] = remaining.splice(idx, 1)
            if (!candidate) break

            this.annotateTrack(candidate, 'fill:worse-ranked', this.defaultRankingSource, 0.35)
            playlist.tracks.push(candidate)
            duration += candidate.duration || 0
        }
    }

    /**
     * Check if track is the last one from its album in the playlist
     * @param {Object} playlist 
     * @param {Object} track 
     * @returns {boolean}
     */
    isLastTrackOfAlbumInPlaylist(playlist, track) {
        if (!track || !track.originAlbumId) return false
        let count = 0
        for (const existing of playlist.tracks) {
            if (existing.originAlbumId === track.originAlbumId) count++
        }
        return count === 1
    }

    /**
     * Check if swap is valid
     * @param {Object} pOver - Playlist over target
     * @param {Object} pUnder - Playlist under target
     * @param {Object} trackOver - Track from over playlist
     * @param {Object} trackUnder - Track from under playlist
     * @returns {boolean}
     */
    isSwapValid(pOver, pUnder, trackOver, trackUnder) {
        const rankOver = trackOver?.acclaimRank ?? trackOver?.rank ?? null
        const rankUnder = trackUnder?.acclaimRank ?? trackUnder?.rank ?? null

        if (rankOver === 1 && pOver.id === 'p1') return false
        if (rankOver === 2 && pOver.id === 'p2') return false

        const isLastOver = this.isLastTrackOfAlbumInPlaylist(pOver, trackOver)
        if (isLastOver && trackOver.originAlbumId !== trackUnder.originAlbumId) return false

        const isLastUnder = this.isLastTrackOfAlbumInPlaylist(pUnder, trackUnder)
        if (isLastUnder && trackUnder.originAlbumId !== trackOver.originAlbumId) return false

        return true
    }

    /**
     * Balance playlist durations via track swapping
     * @param {Array} playlists 
     */
    runSwapBalancing(playlists) {
        const FLEXIBILITY = 7 * 60 // 7 minutes
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

            const underOk = pUnder.duration >= (this.targetSeconds - FLEXIBILITY)
            const overOk = pOver.duration <= (this.targetSeconds + FLEXIBILITY)
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
}

export default LegacyRoundRobinAlgorithm
