// Consolidation helpers for ranking acclaim
// Implements Borda count consolidation: each source gives points = N - position + 1

// Lazy load shared module (ESM)
let normalizeKeyFn = null
async function getNormalizeKey() {
  if (!normalizeKeyFn) {
    const mod = await import('../../shared/normalize.js')
    normalizeKeyFn = mod.normalizeKey
  }
  return normalizeKeyFn
}

async function tokenize(s) {
  const normalizeKey = await getNormalizeKey()
  const k = normalizeKey(s || '')
  if (!k) return []
  return k.split(' ').filter(Boolean)
}

function tokenOverlapRatio(tokensA, tokensB) {
  if (!Array.isArray(tokensA) || !Array.isArray(tokensB) || tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let inter = 0
  for (const t of setA) if (setB.has(t)) inter++
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : (inter / union)
}

async function consolidateRanking(tracks = [], acclaim = []) {
  const normalizeKey = await getNormalizeKey()
  // tracks: array of album tracks (used to infer N)
  // acclaim: array of mentions { provider, trackTitle, position, referenceUrl }
  const N = Array.isArray(tracks) && tracks.length ? tracks.length : 0
  // collect unique providers (only those that provided a numeric position)
  const providers = new Set()
  acclaim.forEach(m => { if (m && m.provider) providers.add(String(m.provider)) })
  const providersCount = Math.max(0, providers.size)

  // build a map containing all album tracks as base (so consolidated ranking covers 1..N)
  const map = new Map()
  const normIndex = new Map()
  if (Array.isArray(tracks)) {
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]
      const title = (t && (t.title || t.name)) ? String(t.title || t.name) : `track_${i + 1}`
      const baseKey = normalizeKey(title)
      const uniqKey = `${baseKey}::${i}`
      map.set(uniqKey, { trackTitle: title, score: 0, supporting: [], tokens: await tokenize(title), normKey: baseKey, index: i })
      const arr = normIndex.get(baseKey) || []
      arr.push(uniqKey)
      normIndex.set(baseKey, arr)
    }
  }

  const addSupporting = async (key, mention) => {
    const existing = map.get(key) || { trackTitle: mention.trackTitle || key, score: 0, supporting: [], tokens: await tokenize(mention.trackTitle || key) }
    existing.supporting.push({ provider: mention.provider || '', position: mention.position || null, referenceUrl: mention.referenceUrl || '', rating: (mention.rating !== undefined ? mention.rating : null) })
    map.set(key, existing)
  }

  for (const m of acclaim) {
    if (!m) continue
    const mentionKey = normalizeKey(m.trackTitle)
    if (!mentionKey) continue
    // Only count points for tracks that are part of the album when tracks list is provided
    let matchedKey = mentionKey
    if (N > 0 && !map.has(matchedKey)) {
      // Try normalized exact-match to one or more album tracks
      const candidates = normIndex.get(mentionKey) || []
      if (candidates.length === 1) {
        matchedKey = candidates[0]
      } else if (candidates.length > 1) {
        // multiple album tracks with same normalized title: pick the one with least supporting entries
        let bestCandidate = candidates[0]
        let bestSupportCount = (map.get(bestCandidate) && map.get(bestCandidate).supporting) ? map.get(bestCandidate).supporting.length : 0
        for (const c of candidates) {
          const sCount = (map.get(c) && map.get(c).supporting) ? map.get(c).supporting.length : 0
          if (sCount < bestSupportCount) {
            bestCandidate = c
            bestSupportCount = sCount
          }
        }
        matchedKey = bestCandidate
      } else {
        // attempt fuzzy token-overlap matching to handle small title variants (pt. vs pt, commas, parentheses, etc.)
        const mentionTokens = await tokenize(m.trackTitle)
        let best = { key: null, score: 0 }
        for (const [k, v] of map.entries()) {
          const norm = v && v.normKey ? v.normKey : normalizeKey(v && v.trackTitle)
          // exact containment check on normalized base keys first
          if (mentionKey.includes(norm) || norm.includes(mentionKey)) {
            best = { key: k, score: 1 }
            break
          }
          const ratio = tokenOverlapRatio(mentionTokens, v.tokens || await tokenize(v && v.trackTitle))
          if (ratio > best.score) best = { key: k, score: ratio }
        }
        // require moderate overlap (>= 0.4) to consider as a match; exact containment short-circuits
        if (best.score >= 0.4 && best.key) matchedKey = best.key
        else {
          // unmatched mention: ignore for strict per-album consolidation but record under a special key
          const muKey = `__unmatched__${mentionKey}`
          await addSupporting(muKey, m)
          continue
        }
      }
    }
    await addSupporting(matchedKey, m)
    // Borda points: if N is known, points = N - position + 1; else use reciprocal fallback
    const p = Number(m.position) || 0
    let points = 0
    if (N > 0) {
      if (p > 0 && p <= N) points = (N - p + 1)
      else points = 0
    } else {
      points = p > 0 ? (1 / p) : 0
    }
    const obj = map.get(matchedKey)
    if (obj) {
      obj.score = (obj.score || 0) + points
      map.set(matchedKey, obj)
    }
  }

  // Ensure we have results for all album tracks (map may have been empty if tracks unknown)
  // prepare results: ignore special unmatched buckets (they are recorded in divergence)
  const allEntries = Array.from(map.entries())
  const results = allEntries
    .filter(([k]) => !String(k).startsWith('__unmatched__'))
    .map(([k, v]) => ({
      trackTitle: v.trackTitle || k,
      rawScore: Number(v.score) || 0,
      supporting: v.supporting || [],
      // prefer explicit rating from BestEver evidence when present; otherwise take any available rating
      rating: (function () {
        try {
          if (!v.supporting || v.supporting.length === 0) return null
          // prefer BestEver provider rating
          const be = v.supporting.find(s => s && s.provider && String(s.provider).toLowerCase().includes('bestever') && (s.rating !== undefined && s.rating !== null))
          if (be) return be.rating
          // otherwise first supporting rating
          const any = v.supporting.find(s => s && (s.rating !== undefined && s.rating !== null))
          if (any) return any.rating
          return null
        } catch (e) { return null }
      })()
    }))

  // divergence information: unmatched mentions and tracks without supporting evidence
  const unmatchedMentions = allEntries
    .filter(([k]) => String(k).startsWith('__unmatched__'))
    .flatMap(([k, v]) => (v.supporting || []).map(s => ({ provider: s.provider, trackTitle: v.trackTitle || k, position: s.position, referenceUrl: s.referenceUrl, rating: s.rating })))

  const tracksWithoutSupport = results.filter(r => !r.supporting || r.supporting.length === 0).map(r => r.trackTitle)

  // If ratings are present for any track, prefer ordering by rating desc (BestEver priority),
  // otherwise fall back to rawScore (Borda) ordering. Keep rawScore as tiebreaker.
  const hasRatings = results.some(r => r.rating !== undefined && r.rating !== null)
  if (hasRatings) {
    results.sort((a, b) => {
      const ra = Number(a.rating || 0)
      const rb = Number(b.rating || 0)
      if (rb !== ra) return rb - ra
      return (b.rawScore || 0) - (a.rawScore || 0)
    })
  } else {
    results.sort((a, b) => (b.rawScore || 0) - (a.rawScore || 0))
  }

  // assign finalPosition and normalizedScore and then return ordered by finalPosition (1..N)
  const maxPossible = (N > 0 && providersCount > 0) ? (N * providersCount) : (providersCount || 1)
  results.forEach((r, idx) => {
    r.finalPosition = idx + 1
    r.normalizedScore = maxPossible > 0 ? (r.rawScore / maxPossible) : r.rawScore
  })

  // make sure array is ordered from finalPosition = 1 .. n (already is)
  return {
    results,
    divergence: { unmatchedMentions, tracksWithoutSupport },
    debugInfo: {
      tracksCount: N,
      acclaimCount: acclaim.length,
      providersCount,
      sampleMatch: acclaim.length > 0 ? {
        mention: acclaim[0].trackTitle,
        mentionKey: await getNormalizeKey().then(f => f(acclaim[0].trackTitle)),
        matched: map.has(await getNormalizeKey().then(f => f(acclaim[0].trackTitle)))
      } : null
    }
  }
}

module.exports = { consolidateRanking, normalizeKey: getNormalizeKey }
