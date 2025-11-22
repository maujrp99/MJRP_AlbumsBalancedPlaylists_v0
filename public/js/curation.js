// public/js/curation.js
// ES module implementing the playlist curation algorithm in a DOM-free way

export function curateAlbums (albums, opts = {}) {
  const DURATION_TARGET_S = opts.targetSeconds || 45 * 60 // default 45 minutes
  const P_HITS = 2 // P1 and P2

  // Defensive copy
  const workingAlbums = JSON.parse(JSON.stringify(albums || []))

  // Initialize playlists
  const playlists = [
    { id: 'p1', title: 'Greatest Hits Vol. 1', subtitle: 'Rank #1 de cada álbum', tracks: [] },
    { id: 'p2', title: 'Greatest Hits Vol. 2', subtitle: 'Rank #2 de cada álbum', tracks: [] }
  ]

  // Pool for remaining tracks
  const remaining = []

  // Phase: extract rank 1 and 2
  for (const album of workingAlbums) {
    if (!album || !Array.isArray(album.tracks)) continue
    const tracks = [...album.tracks]

    const t1 = tracks.find(t => t.rank === 1)
    if (t1) {
      // annotate hit provenance
      t1.rankingInfo = t1.rankingInfo || []
      t1.rankingInfo.push({ reason: 'P1 Hit', source: 'algorithm' })
      playlists[0].tracks.push(t1)
    }

    const t2 = tracks.find(t => t.rank === 2)
    if (t2) {
      t2.rankingInfo = t2.rankingInfo || []
      t2.rankingInfo.push({ reason: 'P2 Hit', source: 'algorithm' })
      playlists[1].tracks.push(t2)
    }

    // add remaining tracks to pool (exclude rank 1/2 copies)
    for (const t of tracks) {
      if (t.rank === 1 || t.rank === 2) continue
      // keep origin for rules
      t.originAlbumId = album.id
      remaining.push(t)
    }
  }

  // Phase: fill P1 and P2 if under duration target using worst-ranked-first
  // Sort remaining descending by rank (highest numeric value first)
  remaining.sort((a, b) => (b.rank || 999) - (a.rank || 999))

  function totalDuration (tracks) {
    return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0)
  }

  // Fill helper: append worst-ranked tracks until >= target or pool exhausted
  function fillPlaylistIfNeeded (playlist) {
    let dur = totalDuration(playlist.tracks)
    while (dur < DURATION_TARGET_S && remaining.length > 0) {
      // Prefer a candidate from an album not yet present in this playlist
      const existingAlbumIds = new Set((playlist.tracks || []).map(t => t.originAlbumId).filter(Boolean))
      let idx = remaining.findIndex(t => !existingAlbumIds.has(t.originAlbumId))
      if (idx === -1) idx = 0 // fallback to first available
      const [candidate] = remaining.splice(idx, 1)
      if (!candidate) break
      // annotate as fill
      candidate.rankingInfo = candidate.rankingInfo || []
      candidate.rankingInfo.push({ reason: 'fill:worse-ranked', source: 'algorithm' })
      playlist.tracks.push(candidate)
      dur += candidate.duration || 0
    }
  }

  fillPlaylistIfNeeded(playlists[0])
  fillPlaylistIfNeeded(playlists[1])

  // After filling P1/P2, distribute the rest into deep cuts using serpentine
  // Compute number of deep cut playlists from remaining durations
  const totalDeepCutsDuration = totalDuration(remaining)
  const P_DEEP_CUTS_IDEAL = Math.ceil(totalDeepCutsDuration / DURATION_TARGET_S)
  const numDeepCutPlaylists = Math.max(1, P_DEEP_CUTS_IDEAL)

  for (let i = 0; i < numDeepCutPlaylists; i++) {
    playlists.push({ id: `p${P_HITS + i + 1}`, title: `Deep Cuts Vol. ${i + 1}`, subtitle: 'S-Draft Balanceado', tracks: [] })
  }

  // Distribute remaining pool into deep cut playlists.
  // To avoid clumping tracks from the same album, group by originAlbumId and round-robin across groups.
  const albumBuckets = new Map()
  for (const t of remaining) {
    const key = t.originAlbumId || `__noalbum__:${t.id}`
    if (!albumBuckets.has(key)) albumBuckets.set(key, [])
    albumBuckets.get(key).push(t)
  }

  // Convert buckets to arrays and prepare iterators
  const buckets = Array.from(albumBuckets.values())
  let bucketIndex = 0
  while (buckets.some(b => b.length > 0)) {
    const bucket = buckets[bucketIndex]
    if (bucket && bucket.length > 0) {
      const track = bucket.shift()
      // place into next playlist in serpentine order
      playlists[P_HITS + (bucketIndex % numDeepCutPlaylists)].tracks.push(track)
    }
    bucketIndex = (bucketIndex + 1) % buckets.length
  }

  // Phase: run swap balancing with conservative swap rules
  runFase4SwapBalancing(playlists, DURATION_TARGET_S)

  return playlists
}

export function runFase4SwapBalancing (playlists, targetDurationS) {
  const FLEXIBILITY = 7 * 60 // 7 minutes
  const MAX_SWAP_ITERATIONS = 100

  function calculateTotalDuration (tracks) {
    return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0)
  }

  function isLastTrackOfAlbumInPlaylist (playlist, track) {
    if (!track || !track.originAlbumId) return false
    let count = 0
    for (const t of playlist.tracks) if (t.originAlbumId === track.originAlbumId) count++
    return count === 1
  }

  function isSwapValid (pOver, pUnder, trackOver, trackUnder) {
    // Disallow removing rank===1 from p1, or rank===2 from p2
    if (trackOver && trackOver.rank === 1 && pOver.id === 'p1') return false
    if (trackOver && trackOver.rank === 2 && pOver.id === 'p2') return false

    // Album representation constraints (existing rule)
    const isLastOver = isLastTrackOfAlbumInPlaylist(pOver, trackOver)
    if (isLastOver && (trackOver.originAlbumId !== trackUnder.originAlbumId)) return false

    const isLastUnder = isLastTrackOfAlbumInPlaylist(pUnder, trackUnder)
    if (isLastUnder && (trackUnder.originAlbumId !== trackOver.originAlbumId)) return false

    return true
  }

  for (let iter = 0; iter < MAX_SWAP_ITERATIONS; iter++) {
    const pDurations = playlists.map(p => ({ id: p.id, duration: calculateTotalDuration(p.tracks), playlist: p }))
    pDurations.sort((a, b) => a.duration - b.duration)
    const pUnder = pDurations[0]
    const pOver = pDurations[pDurations.length - 1]

    const isUnderOk = pUnder.duration >= (targetDurationS - FLEXIBILITY)
    const isOverOk = pOver.duration <= (targetDurationS + FLEXIBILITY)
    if (isUnderOk && isOverOk) return playlists

    let bestSwap = { trackOver: null, trackUnder: null, newGap: Math.abs(pOver.duration - pUnder.duration) }

    for (const trackOver of pOver.playlist.tracks) {
      for (const trackUnder of pUnder.playlist.tracks) {
        if (!isSwapValid(pOver.playlist, pUnder.playlist, trackOver, trackUnder)) continue
        const newOverDuration = pOver.duration - (trackOver.duration || 0) + (trackUnder.duration || 0)
        const newUnderDuration = pUnder.duration - (trackUnder.duration || 0) + (trackOver.duration || 0)
        const newGap = Math.abs(newOverDuration - newUnderDuration)
        if (newGap < bestSwap.newGap) bestSwap = { trackOver, trackUnder, newGap }
      }
    }

    if (bestSwap.trackOver) {
      // execute swap
      pOver.playlist.tracks = pOver.playlist.tracks.filter(t => t.id !== bestSwap.trackOver.id)
      pOver.playlist.tracks.push(bestSwap.trackUnder)
      pUnder.playlist.tracks = pUnder.playlist.tracks.filter(t => t.id !== bestSwap.trackUnder.id)
      pUnder.playlist.tracks.push(bestSwap.trackOver)
    } else {
      return playlists
    }
  }

  return playlists
}
