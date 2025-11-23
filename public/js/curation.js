// public/js/curation.js
// ES module implementing the playlist curation algorithm in a DOM-free way

const DEFAULT_TARGET_SECONDS = 45 * 60
const P_HITS = 2

function normalizeSourceEntry (source) {
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

function createRankingInfoEntry (reason, sourceName, score) {
  return {
    reason,
    source: sourceName,
    score,
    timestamp: new Date().toISOString()
  }
}

export function curateAlbums (albums, opts = {}) {
  const targetSeconds = opts.targetSeconds || DEFAULT_TARGET_SECONDS
  const workingAlbums = JSON.parse(JSON.stringify(albums || []))
  const playlists = [
    { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
    { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
  ]
  const remaining = []
  const rankingSources = new Map()
  const albumLookup = new Map()

  function registerRankingSource (source) {
    const normalized = normalizeSourceEntry(source)
    if (!normalized) return null
    const key = normalized.name.toLowerCase()
    if (!rankingSources.has(key)) rankingSources.set(key, normalized)
    return rankingSources.get(key)
  }

  function annotateTrack (track, reason, sourceEntry, score) {
    if (!track) return
    track.rankingInfo = track.rankingInfo || []
    const sourceName = (sourceEntry && sourceEntry.name) || defaultRankingSource?.name || 'MJRP Hybrid Algorithm'
    track.rankingInfo.push(createRankingInfoEntry(reason, sourceName, score))
    if (sourceEntry) registerRankingSource(sourceEntry)
  }

  function markTrackOrigin (track, albumId) {
    if (track && albumId) track.originAlbumId = albumId
  }

  function buildRankingSummary () {
    const summary = {}
    const now = new Date().toISOString()
    for (const playlist of playlists) {
      for (const track of playlist.tracks || []) {
        const albumId = track.originAlbumId
        if (!albumId) continue
        const albumMeta = albumLookup.get(albumId)
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

  const defaultRankingSource = registerRankingSource(opts.defaultRankingSource || {
    name: 'MJRP Hybrid Algorithm',
    type: 'internal',
    description: 'Curadurismo híbrido de faixas',
    secure: true
  })
  if (Array.isArray(opts.rankingSources)) opts.rankingSources.forEach(registerRankingSource)

  for (const album of workingAlbums) {
    if (!album || !album.id) continue
    albumLookup.set(album.id, album)
    if (Array.isArray(album.rankingSources)) album.rankingSources.forEach(registerRankingSource)
    if (!Array.isArray(album.tracks)) continue
    const tracks = [...album.tracks]

    const t1 = tracks.find(t => t.rank === 1)
    if (t1) {
      markTrackOrigin(t1, album.id)
      annotateTrack(t1, 'P1 Hit', defaultRankingSource, 1)
      playlists[0].tracks.push(t1)
    }

    const t2 = tracks.find(t => t.rank === 2)
    if (t2) {
      markTrackOrigin(t2, album.id)
      annotateTrack(t2, 'P2 Hit', defaultRankingSource, 0.95)
      playlists[1].tracks.push(t2)
    }

    for (const track of tracks) {
      if (track.rank === 1 || track.rank === 2) continue
      markTrackOrigin(track, album.id)
      remaining.push(track)
    }
  }

  remaining.sort((a, b) => (b.rank || 999) - (a.rank || 999))

  function totalDuration (tracks) {
    return (tracks || []).reduce((sum, track) => sum + (track.duration || 0), 0)
  }

  function fillPlaylistIfNeeded (playlist) {
    let duration = totalDuration(playlist.tracks)
    while (duration < targetSeconds && remaining.length > 0) {
      const existingAlbumIds = new Set((playlist.tracks || []).map(t => t.originAlbumId).filter(Boolean))
      let idx = remaining.findIndex(track => !existingAlbumIds.has(track.originAlbumId))
      if (idx === -1) idx = 0
      const [candidate] = remaining.splice(idx, 1)
      if (!candidate) break
      annotateTrack(candidate, 'fill:worse-ranked', defaultRankingSource, 0.35)
      playlist.tracks.push(candidate)
      duration += candidate.duration || 0
    }
  }

  fillPlaylistIfNeeded(playlists[0])
  fillPlaylistIfNeeded(playlists[1])

  const totalDeepCutsDuration = totalDuration(remaining)
  const deepCutCount = Math.max(1, Math.ceil(totalDeepCutsDuration / targetSeconds))
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

  runFase4SwapBalancing(playlists, targetSeconds, {
    onSwap (trackOver, trackUnder, playlistOver, playlistUnder) {
      annotateTrack(trackOver, `Swap: movido para ${playlistUnder.id}`, defaultRankingSource, 0.45)
      annotateTrack(trackUnder, `Swap: movido para ${playlistOver.id}`, defaultRankingSource, 0.45)
    }
  })

  const rankingSummary = buildRankingSummary()
  return {
    playlists,
    rankingSummary,
    rankingSources: Array.from(rankingSources.values())
  }
}

export function runFase4SwapBalancing (playlists, targetDurationS, opts = {}) {
  const FLEXIBILITY = 7 * 60
  const MAX_SWAP_ITERATIONS = 100
  const onSwap = typeof opts.onSwap === 'function' ? opts.onSwap : null

  function calculateTotalDuration (tracks) {
    return (tracks || []).reduce((sum, track) => sum + (track.duration || 0), 0)
  }

  function isLastTrackOfAlbumInPlaylist (playlist, track) {
    if (!track || !track.originAlbumId) return false
    let count = 0
    for (const existing of playlist.tracks) if (existing.originAlbumId === track.originAlbumId) count++
    return count === 1
  }

  function isSwapValid (pOver, pUnder, trackOver, trackUnder) {
    if (trackOver && trackOver.rank === 1 && pOver.id === 'p1') return false
    if (trackOver && trackOver.rank === 2 && pOver.id === 'p2') return false
    const isLastOver = isLastTrackOfAlbumInPlaylist(pOver, trackOver)
    if (isLastOver && (trackOver.originAlbumId !== trackUnder.originAlbumId)) return false
    const isLastUnder = isLastTrackOfAlbumInPlaylist(pUnder, trackUnder)
    if (isLastUnder && (trackUnder.originAlbumId !== trackOver.originAlbumId)) return false
    return true
  }

  for (let iteration = 0; iteration < MAX_SWAP_ITERATIONS; iteration++) {
    const playlistDurations = playlists.map(playlist => ({
      id: playlist.id,
      duration: calculateTotalDuration(playlist.tracks),
      playlist
    }))
    playlistDurations.sort((a, b) => a.duration - b.duration)
    const pUnder = playlistDurations[0]
    const pOver = playlistDurations[playlistDurations.length - 1]

    const underOk = pUnder.duration >= (targetDurationS - FLEXIBILITY)
    const overOk = pOver.duration <= (targetDurationS + FLEXIBILITY)
    if (underOk && overOk) return playlists

    let bestSwap = { trackOver: null, trackUnder: null, newGap: Math.abs(pOver.duration - pUnder.duration) }
    for (const trackOver of pOver.playlist.tracks) {
      for (const trackUnder of pUnder.playlist.tracks) {
        if (!isSwapValid(pOver.playlist, pUnder.playlist, trackOver, trackUnder)) continue
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
