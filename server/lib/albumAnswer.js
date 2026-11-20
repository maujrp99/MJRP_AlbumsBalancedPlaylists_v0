/**
 * The album POST /api/generate answers, built from the album the AI gave, the ranking the sources
 * gave (lib/fetchRanking.js) and its consolidation (lib/ranking.js). Pure steps (F52, slice 5):
 * nothing outside is asked here, and nothing that breaks is caught.
 *
 *   withRanking        the sources, the entries, what stays of the BestEverAlbums page, and
 *                      `ratings`: what happened to each source of ratings
 *   withConsolidation  the consolidated ranking and its notes
 *   withRanksOnTracks  the rank and the rating of each track, and the tracks listed by acclaim
 */

const isBestEverSource = (source) => String((source && source.provider) || '').toLowerCase() === 'besteveralbums'

/** The sources of the ranking; the page of BestEverAlbums that stays as evidence is named first. */
function sourcesOf (album, ranking) {
  const own = Array.isArray(album.rankingSources) ? album.rankingSources : []
  const fetched = [...ranking.sources]
  if (ranking.bestEver && !fetched.some(isBestEverSource)) {
    fetched.unshift({ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: ranking.bestEver.albumUrl })
  }
  return [...own, ...fetched]
}

/** What the album keeps of the page of BestEverAlbums. */
function pageFields (bestEver) {
  if (!bestEver) return {}
  return {
    bestEverEvidence: Array.isArray(bestEver.evidence) ? bestEver.evidence : [],
    bestEverUrl: bestEver.albumUrl || null,
    ...(bestEver.albumId ? { bestEverAlbumId: String(bestEver.albumId) } : {})
  }
}

/**
 * @param {Object} album - the album the AI gave
 * @param {Object} ranking - what lib/fetchRanking.js gave
 */
function withRanking (album, ranking) {
  return {
    ...album,
    ...pageFields(ranking.bestEver),
    rankingSources: sourcesOf(album, ranking),
    ...(ranking.entries.length ? { rankingAcclaim: ranking.entries } : {}),
    // What happened to each source of ratings: "it has none" and "it could not be asked" are told apart
    ratings: ranking.ratings
  }
}

/**
 * @param {Object} answer - the album with its ranking
 * @param {Object} consolidated - what lib/ranking.js gave
 * @param {Object} ranking - what lib/fetchRanking.js gave
 */
function withConsolidation (answer, consolidated, ranking) {
  return {
    ...answer,
    rankingConsolidated: consolidated.results,
    rankingConsolidatedMeta: {
      ...consolidated.divergence,
      debugInfo: consolidated.debugInfo,
      rankingEntriesCount: ranking.entries.length,
      rankingEntriesSample: ranking.entries.length ? ranking.entries[0] : null,
      fetchRankingDebug: ranking.debugTrace
    }
  }
}

const titleOfTrack = (track) => (track && (track.title || track.trackTitle || track.name)) || ''
const isSet = (value) => value !== undefined && value !== null

/** Map<title key, value of `field`> of the consolidated rows that have one. */
function byTitle (consolidated, field, normalizeKey) {
  const values = new Map()
  consolidated.forEach(row => {
    if (row && row.trackTitle && isSet(row[field])) values.set(normalizeKey(row.trackTitle), Number(row[field]))
  })
  return values
}

/** The track with its rank (its place in the album when the ranking has none) and its rating. */
function rankedTrack (track, index, ranks, ratings, normalizeKey) {
  if (!track || typeof track !== 'object') return track
  const key = normalizeKey(titleOfTrack(track))
  const ranked = { ...track }
  if (ranks.has(key)) ranked.rank = ranks.get(key)
  if (ratings.has(key)) ranked.rating = ratings.get(key)
  if (!isSet(ranked.rank)) ranked.rank = index + 1
  return ranked
}

const rankOf = (track) => (track && track.rank) || Number.POSITIVE_INFINITY

/**
 * @param {Object} answer - the album with its consolidated ranking
 * @param {Function} normalizeKey - shared/normalize.js
 * @returns {Object} the answer; an album with no list of tracks is left as it is
 */
function withRanksOnTracks (answer, normalizeKey) {
  if (!Array.isArray(answer.tracks)) return answer
  const ranks = byTitle(answer.rankingConsolidated, 'finalPosition', normalizeKey)
  const ratings = byTitle(answer.rankingConsolidated, 'rating', normalizeKey)
  const tracks = answer.tracks.map((track, index) => rankedTrack(track, index, ranks, ratings, normalizeKey))
  return { ...answer, tracks, tracksByAcclaim: [...tracks].sort((a, b) => rankOf(a) - rankOf(b)) }
}

module.exports = { withRanking, withConsolidation, withRanksOnTracks }
