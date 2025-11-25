// Consolidation helpers for ranking acclaim
// Implements Borda count consolidation: each source gives points = N - position + 1

function normalizeKey (s) {
  if (!s) return ''
  try {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '')
      .trim()
  } catch (e) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim()
  }
}

function consolidateRanking (tracks = [], acclaim = []) {
  // tracks: array of album tracks (used to infer N)
  // acclaim: array of mentions { provider, trackTitle, position, referenceUrl }
  const N = Array.isArray(tracks) && tracks.length ? tracks.length : 0
  // collect unique providers (only those that provided a numeric position)
  const providers = new Set()
  acclaim.forEach(m => { if (m && m.provider) providers.add(String(m.provider)) })
  const providersCount = Math.max(0, providers.size)

  // build a map containing all album tracks as base (so consolidated ranking covers 1..N)
  const map = new Map()
  if (Array.isArray(tracks)) {
    tracks.forEach((t, i) => {
      const title = (t && (t.title || t.name)) ? String(t.title || t.name) : `track_${i + 1}`
      const key = normalizeKey(title)
      map.set(key, { trackTitle: title, score: 0, supporting: [] })
    })
  }

  const addSupporting = (key, mention) => {
    const existing = map.get(key) || { trackTitle: mention.trackTitle || key, score: 0, supporting: [] }
    existing.supporting.push({ provider: mention.provider || '', position: mention.position || null, referenceUrl: mention.referenceUrl || '' })
    map.set(key, existing)
  }

  acclaim.forEach(m => {
    if (!m) return
    const key = normalizeKey(m.trackTitle)
    if (!key) return
    // Only count points for tracks that are part of the album when tracks list is provided
    if (N > 0 && !map.has(key)) {
      // ignore mentions that don't match album tracks to keep consolidated ranking strictly per-album
      return
    }
    addSupporting(key, m)
    // Borda points: if N is known, points = N - position + 1; else use reciprocal fallback
    const p = Number(m.position) || 0
    let points = 0
    if (N > 0) {
      if (p > 0 && p <= N) points = (N - p + 1)
      else points = 0
    } else {
      points = p > 0 ? (1 / p) : 0
    }
    const obj = map.get(key)
    obj.score = (obj.score || 0) + points
  })

  // Ensure we have results for all album tracks (map may have been empty if tracks unknown)
  const results = Array.from(map.entries()).map(([k, v]) => ({
    trackTitle: v.trackTitle || k,
    rawScore: Number(v.score) || 0,
    supporting: v.supporting || []
  }))

  // sort by rawScore desc (highest score first = final position 1)
  results.sort((a, b) => (b.rawScore || 0) - (a.rawScore || 0))

  // assign finalPosition and normalizedScore and then return ordered by finalPosition (1..N)
  const maxPossible = (N > 0 && providersCount > 0) ? (N * providersCount) : (providersCount || 1)
  results.forEach((r, idx) => {
    r.finalPosition = idx + 1
    r.normalizedScore = maxPossible > 0 ? (r.rawScore / maxPossible) : r.rawScore
  })

  // make sure array is ordered from finalPosition = 1 .. n (already is)
  return results
}

module.exports = { consolidateRanking }
