/**
 * The consolidated ranking of the tracks of an album, from the mentions the sources gave
 * ({ provider, trackTitle, position, rating, referenceUrl }). A pure step (F52, slice 5): tracks
 * and mentions in, the ranking out; nothing outside is asked.
 *
 *   1. board        every track of the album is a row, so the ranking covers the whole album
 *   2. placing      each mention is placed on the row of its track (same title; else two tracks
 *                   with the title, the one with fewer mentions; else a title that contains the
 *                   other; else enough words in common); a mention of no track is kept apart
 *   3. points       Borda count: with N tracks, a mention at position p gives N - p + 1 points
 *                   (1 / p when the tracks are not known)
 *   4. order        by rating when any track has one (the BestEverAlbums rating first), then by points
 *
 * `consolidateRanking` is async only because the title rule (shared/normalize.js) is an ES module
 * loaded on first use; `consolidate` is the same step with the rule handed in.
 */

// Lazy load shared module (ESM)
let normalizeKeyFn = null
async function getNormalizeKey () {
  if (!normalizeKeyFn) {
    const mod = await import('../../shared/normalize.js')
    normalizeKeyFn = mod.normalizeKey
  }
  return normalizeKeyFn
}

const UNMATCHED = '__unmatched__'
/** Two titles with at least this share of their words in common are the same track. */
const SAME_TRACK_OVERLAP = 0.4

const hasRating = (thing) => thing.rating !== undefined && thing.rating !== null
const isUnmatched = (key) => String(key).startsWith(UNMATCHED)

function tokensOf (text, normalizeKey) {
  const key = normalizeKey(text || '')
  return key ? key.split(' ').filter(Boolean) : []
}

/** The share of words two titles have in common (Jaccard). */
function tokenOverlapRatio (tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const common = [...setA].filter(token => setB.has(token)).length
  return common / new Set([...setA, ...setB]).size
}

const titleOfTrack = (track, index) => (track && (track.title || track.name) ? String(track.title || track.name) : `track_${index + 1}`)

/**
 * One row per track of the album, in album order.
 * @returns {{ rows: Map<string, Object>, keysByTitle: Map<string, string[]> }} two tracks of the
 *          same title are two rows; `keysByTitle` lists the rows of a title
 */
function boardOf (tracks, normalizeKey) {
  const rows = new Map()
  const keysByTitle = new Map()
  tracks.forEach((track, index) => {
    const title = titleOfTrack(track, index)
    const titleKey = normalizeKey(title)
    const rowKey = `${titleKey}::${index}`
    rows.set(rowKey, { trackTitle: title, score: 0, supporting: [], tokens: tokensOf(title, normalizeKey), normKey: titleKey, index })
    keysByTitle.set(titleKey, [...(keysByTitle.get(titleKey) || []), rowKey])
  })
  return { rows, keysByTitle }
}

/** Of the rows of one title, the one with fewer mentions so far (the first, when they tie). */
const leastMentioned = (rows, rowKeys) => rowKeys.reduce((least, key) => (rows.get(key).supporting.length < rows.get(least).supporting.length ? key : least))

/**
 * The row whose title contains the mention's (or is contained in it); else the row with the most
 * words in common, when they are enough.
 * @returns {string|null}
 */
function similarRow (rows, mention, mentionKey, normalizeKey) {
  const mentionTokens = tokensOf(mention.trackTitle, normalizeKey)
  let best = { key: null, overlap: 0 }
  for (const [key, row] of rows.entries()) {
    const titleKey = row.normKey ? row.normKey : normalizeKey(row.trackTitle)
    if (mentionKey.includes(titleKey) || titleKey.includes(mentionKey)) return key
    const overlap = tokenOverlapRatio(mentionTokens, row.tokens)
    if (overlap > best.overlap) best = { key, overlap }
  }
  return best.overlap >= SAME_TRACK_OVERLAP ? best.key : null
}

/**
 * The row a mention is of.
 * @returns {string|null} null when it is of no track of the album
 */
function rowOfMention ({ rows, keysByTitle }, mention, mentionKey, normalizeKey) {
  // The tracks of the album are not known: each title mentioned is a row of its own
  if (keysByTitle.size === 0 || rows.has(mentionKey)) return mentionKey
  const sameTitle = keysByTitle.get(mentionKey) || []
  if (sameTitle.length > 0) return leastMentioned(rows, sameTitle)
  return similarRow(rows, mention, mentionKey, normalizeKey)
}

const supportOf = (mention) => ({
  provider: mention.provider || '',
  position: mention.position || null,
  referenceUrl: mention.referenceUrl || '',
  rating: mention.rating !== undefined ? mention.rating : null
})

function addSupport (rows, key, mention, normalizeKey) {
  const title = mention.trackTitle || key
  const row = rows.get(key) || { trackTitle: title, score: 0, supporting: [], tokens: tokensOf(title, normalizeKey) }
  row.supporting.push(supportOf(mention))
  rows.set(key, row)
  return row
}

/** Borda points of one mention. */
function pointsOf (position, trackCount) {
  const place = Number(position) || 0
  if (place <= 0) return 0
  if (trackCount === 0) return 1 / place
  return place <= trackCount ? trackCount - place + 1 : 0
}

/** Place every mention on its row and count its points; a mention of no track goes to a row apart. */
function placeMentions (board, mentions, trackCount, normalizeKey) {
  for (const mention of mentions) {
    const mentionKey = mention ? normalizeKey(mention.trackTitle) : ''
    if (!mentionKey) continue
    const rowKey = rowOfMention(board, mention, mentionKey, normalizeKey)
    if (rowKey === null) {
      addSupport(board.rows, `${UNMATCHED}${mentionKey}`, mention, normalizeKey)
      continue
    }
    addSupport(board.rows, rowKey, mention, normalizeKey).score += pointsOf(mention.position, trackCount)
  }
}

const isBestEver = (support) => Boolean(support.provider) && String(support.provider).toLowerCase().includes('bestever')

/** The rating of a track: the BestEverAlbums one when there is one, else the first a source gave. */
function ratingOf (supporting) {
  const rated = supporting.filter(hasRating)
  const preferred = rated.find(isBestEver) || rated[0]
  return preferred ? preferred.rating : null
}

const resultOf = ([key, row]) => ({
  trackTitle: row.trackTitle || key,
  rawScore: Number(row.score) || 0,
  supporting: row.supporting,
  rating: ratingOf(row.supporting)
})

const unmatchedOf = ([key, row]) => row.supporting.map(support => ({
  provider: support.provider,
  trackTitle: row.trackTitle || key,
  position: support.position,
  referenceUrl: support.referenceUrl,
  rating: support.rating
}))

const byPoints = (a, b) => b.rawScore - a.rawScore
const byRatingThenPoints = (a, b) => (Number(b.rating || 0) - Number(a.rating || 0)) || byPoints(a, b)

/** The most points a track can have: N from each source (1 from each when the tracks are not known). */
const mostPoints = (trackCount, sourceCount) => (trackCount > 0 && sourceCount > 0 ? trackCount * sourceCount : (sourceCount || 1))

function ordered (results, trackCount, sourceCount) {
  const most = mostPoints(trackCount, sourceCount)
  return [...results]
    .sort(results.some(hasRating) ? byRatingThenPoints : byPoints)
    .map((result, index) => ({ ...result, finalPosition: index + 1, normalizedScore: result.rawScore / most }))
}

const sourcesIn = (mentions) => new Set(mentions.filter(mention => mention && mention.provider).map(mention => String(mention.provider)))

function sampleOf (mentions, rows, normalizeKey) {
  if (mentions.length === 0) return null
  const mention = mentions[0] && mentions[0].trackTitle
  const mentionKey = normalizeKey(mention)
  return { mention, mentionKey, matched: rows.has(mentionKey) }
}

/**
 * @param {Array} tracks - the tracks of the album (may be empty: not known)
 * @param {Array} mentions - what the sources gave
 * @param {Function} normalizeKey - shared/normalize.js
 * @returns {{ results: Array, divergence: Object, debugInfo: Object }}
 */
function consolidate (tracks, mentions, normalizeKey) {
  const albumTracks = Array.isArray(tracks) ? tracks : []
  const trackCount = albumTracks.length
  const sourceCount = sourcesIn(mentions).size
  const board = boardOf(albumTracks, normalizeKey)
  placeMentions(board, mentions, trackCount, normalizeKey)

  const rows = Array.from(board.rows.entries())
  const results = ordered(rows.filter(([key]) => !isUnmatched(key)).map(resultOf), trackCount, sourceCount)
  return {
    results,
    divergence: {
      unmatchedMentions: rows.filter(([key]) => isUnmatched(key)).flatMap(unmatchedOf),
      tracksWithoutSupport: results.filter(result => result.supporting.length === 0).map(result => result.trackTitle)
    },
    debugInfo: {
      tracksCount: trackCount,
      acclaimCount: mentions.length,
      providersCount: sourceCount,
      sampleMatch: sampleOf(mentions, board.rows, normalizeKey)
    }
  }
}

/**
 * @param {Array} [tracks] - album tracks
 * @param {Array} [acclaim] - mentions { provider, trackTitle, position, referenceUrl, rating }
 */
async function consolidateRanking (tracks = [], acclaim = []) {
  return consolidate(tracks, acclaim, await getNormalizeKey())
}

module.exports = { consolidateRanking, consolidate, normalizeKey: getNormalizeKey }
