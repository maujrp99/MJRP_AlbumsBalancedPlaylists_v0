// public/js/curation.js
// ES module implementing the playlist curation algorithm in a DOM-free way
import { normalizeKey } from './shared/normalize.js'

const DEFAULT_TARGET_SECONDS = 45 * 60
const P_HITS = 2

function normalizeSourceEntry(source) {
  if (!source) return null
  const payload = typeof source === 'string' ? { name: source } : { ...source }
  const name = (payload.name || '').trim()
  if (!name) return null
  return {
    name,
    type: payload.type || 'external',
    reference: payload.reference || '',
    secure: payload.secure === true,
    description: payload.description || ''
  }
}

function createRankingInfoEntry(reason, sourceName, score) {
  return {
    reason,
    source: sourceName,
    score,
    timestamp: new Date().toISOString()
  }
}

export class CurationEngine {
  constructor(opts = {}) {
    this.targetSeconds = opts.targetSeconds || DEFAULT_TARGET_SECONDS
    this.rankingSources = new Map()
    this.albumLookup = new Map()

    // Register default source
    this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
      name: 'MJRP Hybrid Algorithm',
      type: 'internal',
      description: 'Curadurismo híbrido de faixas',
      secure: true
    })

    if (Array.isArray(opts.rankingSources)) {
      opts.rankingSources.forEach(s => this.registerRankingSource(s))
    }
  }

  registerRankingSource(source) {
    const normalized = normalizeSourceEntry(source)
    if (!normalized) return null
    const key = normalizeKey(normalized.name)
    if (!this.rankingSources.has(key)) this.rankingSources.set(key, normalized)
    return this.rankingSources.get(key)
  }

  annotateTrack(track, reason, sourceEntry, score) {
    if (!track) return
    track.rankingInfo = track.rankingInfo || []
    const sourceName = (sourceEntry && sourceEntry.name) || this.defaultRankingSource?.name || 'MJRP Hybrid Algorithm'
    track.rankingInfo.push(createRankingInfoEntry(reason, sourceName, score))
    if (sourceEntry) this.registerRankingSource(sourceEntry)
  }

  markTrackOrigin(track, albumId) {
    if (track && albumId) track.originAlbumId = albumId
  }

  curate(albums) {
    const workingAlbums = JSON.parse(JSON.stringify(albums || []))
    const playlists = [
      { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
      { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
    ]
    const remaining = []

    for (const album of workingAlbums) {
      if (!album || !album.id) continue
      this.albumLookup.set(album.id, album)
      if (Array.isArray(album.rankingSources)) album.rankingSources.forEach(s => this.registerRankingSource(s))
      if (!Array.isArray(album.tracks)) continue

      // Work on a local copy of the album tracks.
      const tracks = Array.isArray(album.tracks) ? album.tracks.map(t => ({ ...t })) : []
      const idToTrack = new Map(tracks.map((t, i) => [t && t.id ? t.id : `idx_${i}`, t]))

      const annotated = tracks.map((t, i) => ({
        id: t && t.id ? t.id : `idx_${i}`,
        rating: (t && (t.rating !== undefined && t.rating !== null)) ? Number(t.rating) : null,
        origIndex: i,
        acclaimRank: (t && (t.acclaimRank !== undefined && t.acclaimRank !== null)) ? Number(t.acclaimRank) : null,
        acclaimScore: (t && (t.acclaimScore !== undefined && t.acclaimScore !== null)) ? Number(t.acclaimScore) : null,
        existingRank: (t && t.rank) || null
      }))

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
          const ra = a.rating || 0; const rb = b.rating || 0
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

      const acclaimOrderedTracks = annotated.map((a, idx) => {
        const t = idToTrack.get(a.id)
        if (!t) return null
        const appliedRank = a.acclaimRank !== null ? a.acclaimRank : ((a.existingRank !== null ? a.existingRank : (idx + 1)))
        t.acclaimRank = appliedRank
        t.acclaimScore = a.acclaimScore !== null ? a.acclaimScore : (a.rating !== null ? a.rating : t.acclaimScore)
        t.rating = a.rating !== null ? a.rating : t.rating
        if (t.rank === undefined || t.rank === null) t.rank = appliedRank
        return t
      })

      const t1 = acclaimOrderedTracks[0]
      if (t1) {
        this.markTrackOrigin(t1, album.id)
        this.annotateTrack(t1, 'P1 Hit', this.defaultRankingSource, 1)
        playlists[0].tracks.push(t1)
      }

      const t2 = acclaimOrderedTracks[1]
      if (t2) {
        this.markTrackOrigin(t2, album.id)
        this.annotateTrack(t2, 'P2 Hit', this.defaultRankingSource, 0.95)
        playlists[1].tracks.push(t2)
      }

      for (let i = 0; i < acclaimOrderedTracks.length; i++) {
        const track = acclaimOrderedTracks[i]
        if (!track) continue
        if (i === 0 || i === 1) continue
        this.markTrackOrigin(track, album.id)
        remaining.push(track)
      }
    }

    remaining.sort((a, b) => (Number((a && (a.acclaimRank !== undefined ? a.acclaimRank : a.rank)) || Number.POSITIVE_INFINITY) - Number((b && (b.acclaimRank !== undefined ? b.acclaimRank : b.rank)) || Number.POSITIVE_INFINITY)))

    this.fillPlaylistIfNeeded(playlists[0], remaining)
    this.fillPlaylistIfNeeded(playlists[1], remaining)

    const totalDeepCutsDuration = this.calculateTotalDuration(remaining)
    const deepCutCount = Math.max(1, Math.ceil(totalDeepCutsDuration / this.targetSeconds))
    for (let i = 0; i < deepCutCount; i++) {
      playlists.push({ id: `p${P_HITS + i + 1}`, title: `Deep Cuts Vol. ${i + 1}`, subtitle: 'S-Draft Balanceado', tracks: [] })
    }

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

    this.runFase4SwapBalancing(playlists)

    const rankingSummary = this.buildRankingSummary(playlists)
    return {
      playlists,
      rankingSummary,
      rankingSources: Array.from(this.rankingSources.values())
    }
  }

  calculateTotalDuration(tracks) {
    return (tracks || []).reduce((sum, track) => sum + (track.duration || 0), 0)
  }

  fillPlaylistIfNeeded(playlist, remaining) {
    let duration = this.calculateTotalDuration(playlist.tracks)
    while (duration < this.targetSeconds && remaining.length > 0) {
      const existingAlbumIds = new Set((playlist.tracks || []).map(t => t.originAlbumId).filter(Boolean))
      let idx = remaining.findIndex(track => !existingAlbumIds.has(track.originAlbumId))
      if (idx === -1) idx = 0
      const [candidate] = remaining.splice(idx, 1)
      if (!candidate) break
      this.annotateTrack(candidate, 'fill:worse-ranked', this.defaultRankingSource, 0.35)
      playlist.tracks.push(candidate)
      duration += candidate.duration || 0
    }
  }

  isLastTrackOfAlbumInPlaylist(playlist, track) {
    if (!track || !track.originAlbumId) return false
    let count = 0
    for (const existing of playlist.tracks) if (existing.originAlbumId === track.originAlbumId) count++
    return count === 1
  }

  isSwapValid(pOver, pUnder, trackOver, trackUnder) {
    const rankOver = trackOver ? (trackOver.acclaimRank !== undefined ? trackOver.acclaimRank : trackOver.rank) : null
    const rankUnder = trackUnder ? (trackUnder.acclaimRank !== undefined ? trackUnder.acclaimRank : trackUnder.rank) : null
    if (rankOver === 1 && pOver.id === 'p1') return false
    if (rankOver === 2 && pOver.id === 'p2') return false
    const isLastOver = this.isLastTrackOfAlbumInPlaylist(pOver, trackOver)
    if (isLastOver && (trackOver.originAlbumId !== trackUnder.originAlbumId)) return false
    const isLastUnder = this.isLastTrackOfAlbumInPlaylist(pUnder, trackUnder)
    if (isLastUnder && (trackUnder.originAlbumId !== trackOver.originAlbumId)) return false
    return true
  }

  runFase4SwapBalancing(playlists, opts = {}) {
    const FLEXIBILITY = 7 * 60
    const MAX_SWAP_ITERATIONS = 100
    const onSwap = typeof opts.onSwap === 'function' ? opts.onSwap : (to, tu, po, pu) => {
      this.annotateTrack(to, `Swap: movido para ${pu.id}`, this.defaultRankingSource, 0.45)
      this.annotateTrack(tu, `Swap: movido para ${po.id}`, this.defaultRankingSource, 0.45)
    }

    for (let iteration = 0; iteration < MAX_SWAP_ITERATIONS; iteration++) {
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
      if (underOk && overOk) return playlists

      let bestSwap = { trackOver: null, trackUnder: null, newGap: Math.abs(pOver.duration - pUnder.duration) }
      for (const trackOver of pOver.playlist.tracks) {
        for (const trackUnder of pUnder.playlist.tracks) {
          if (!this.isSwapValid(pOver.playlist, pUnder.playlist, trackOver, trackUnder)) continue
          const newOverDuration = pOver.duration - (trackOver.duration || 0) + (trackUnder.duration || 0)
          const newUnderDuration = pUnder.duration - (trackUnder.duration || 0) + (trackOver.duration || 0)
          const gap = Math.abs(newOverDuration - newUnderDuration)
          if (gap < bestSwap.newGap) bestSwap = { trackOver, trackUnder, newGap: gap }
        }
      }

      if (bestSwap.trackOver) {
        if (onSwap) onSwap(bestSwap.trackOver, bestSwap.trackUnder, pOver.playlist, pUnder.playlist)
        pOver.playlist.tracks = pOver.playlist.tracks.filter(track => track.id !== bestSwap.trackOver.id)
        pOver.playlist.tracks.push(bestSwap.trackUnder)
        pUnder.playlist.tracks = pUnder.playlist.tracks.filter(track => track.id !== bestSwap.trackUnder.id)
        pUnder.playlist.tracks.push(bestSwap.trackOver)
      } else {
        return playlists
      }
    }
    return playlists
  }

  buildRankingSummary(playlists) {
    const summary = {}
    const now = new Date().toISOString()
    for (const playlist of playlists) {
      for (const track of playlist.tracks || []) {
        const albumId = track.originAlbumId
        if (!albumId) continue
        const albumMeta = this.albumLookup.get(albumId)
        if (!summary[albumId]) {
          summary[albumId] = {
            albumId,
            albumTitle: albumMeta?.title || 'Álbum Desconhecido',
            artist: albumMeta?.artist || 'Artista Desconhecido',
            tracks: [],
            sourceNames: [],
            lastUpdated: now
          }
        }
        const entry = summary[albumId]
        entry.tracks.push({
          trackId: track.id,
          title: track.title,
          rank: track.rank,
          playlistId: playlist.id,
          playlistTitle: playlist.title,
          duration: track.duration,
          rankingInfo: (track.rankingInfo || []).map(info => ({ ...info }))
        })
        const trackSources = new Set((track.rankingInfo || []).map(info => info.source).filter(Boolean))
        trackSources.forEach(sourceName => {
          if (!entry.sourceNames.includes(sourceName)) entry.sourceNames.push(sourceName)
        })
        if (Array.isArray(albumMeta?.rankingSources)) {
          albumMeta.rankingSources.forEach(src => {
            const normalized = normalizeSourceEntry(src)
            if (normalized && !entry.sourceNames.includes(normalized.name)) entry.sourceNames.push(normalized.name)
          })
        }
      }
    }
    return summary
  }
}

// Backward compatibility helper if needed, or just export the class
export function curateAlbums(albums, opts = {}) {
  const engine = new CurationEngine(opts)
  return engine.curate(albums)
}
