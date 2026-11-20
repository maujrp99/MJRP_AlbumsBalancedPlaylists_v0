/**
 * The consolidated ranking of the tracks of an album, from the mentions the sources gave
 * ({ provider, trackTitle, position, rating, referenceUrl }). A pure step (F52, slice 5): tracks
 * and mentions in, the ranking out; nothing outside is asked.
 *
 *   1. board        every track of the album is a row, so the ranking covers the whole album
 *   2. placing      each mention is placed on the row of its track. Which track a mention is of
 *                   is the one track rule's to say (shared/trackIdentity.js, F74): the mentions
 *                   of each source are matched to the tracks one to one, so a rating never goes
 *                   to two tracks; a mention of no track is kept apart. Nothing here compares
 *                   titles (it used to: a title that contains the other, 40% of words in common)
 *   3. points       Borda count: with N tracks, a mention at position p gives N - p + 1 points
 *                   (1 / p when the tracks are not known)
 *   4. order        by rating when any track has one (the BestEverAlbums rating first), then by points
 *
 * `consolidateRanking` is async only because the track rule is an ES module loaded on first use
 * (lib/trackIdentity.js); `consolidate` is the same step with the rule handed in.
 */
const { loadTrackIdentity } = require('./trackIdentity')

const UNMATCHED = '__unmatched__'

const hasRating = (thing) => thing.rating !== undefined && thing.rating !== null
const isUnmatched = (key) => String(key).startsWith(UNMATCHED)

const titleOfTrack = (track, index) => (track && (track.title || track.name) ? String(track.title || track.name) : `track_${index + 1}`)

/** The key of the row of the track at `index`. */
const rowKeyOf = (index) => `track::${index}`

/**
 * One row per track of the album, in album order; two tracks of the same title are two rows.
 * @returns {Map<string, Object>}
 */
function boardOf (tracks) {
  const rows = new Map()
  tracks.forEach((track, index) => {
    rows.set(rowKeyOf(index), { trackTitle: titleOfTrack(track, index), score: 0, supporting: [] })
  })
  return rows
}

const supportOf = (mention) => ({
  provider: mention.provider || '',
  position: mention.position || null,
  referenceUrl: mention.referenceUrl || '',
  rating: mention.rating !== undefined ? mention.rating : null
})

function addSupport (rows, key, mention) {
  const row = rows.get(key) || { trackTitle: mention.trackTitle || key, score: 0, supporting: [] }
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

const isMention = (mention) => Boolean(mention && mention.trackTitle)

/** The mentions of each source, in the order the sources first speak. */
function bySource (mentions) {
  const sources = new Map()
  mentions.filter(isMention).forEach(mention => {
    const source = String(mention.provider || '')
    sources.set(source, [...(sources.get(source) || []), mention])
  })
  return [...sources.values()]
}

/**
 * For each mention, the key of the row it is placed on. The mentions of one source are matched to
 * the tracks by the track rule, one to one; a mention of no track gets a row apart, by its title.
 * With no track known, each title mentioned is a row of its own.
 * @returns {Map<Object, string>}
 */
function rowsOfMentions (tracks, mentions, { matchTracks, trackTextOf }) {
  const placed = new Map()
  bySource(mentions).forEach(ofSource => {
    matchTracks(tracks, ofSource).forEach((match, index) => {
      if (match) placed.set(match.entry, rowKeyOf(index))
    })
  })
  const apart = tracks.length === 0 ? '' : UNMATCHED
  mentions.filter(isMention).forEach(mention => {
    if (!placed.has(mention)) placed.set(mention, `${apart}${trackTextOf(mention.trackTitle)}`)
  })
  return placed
}

/** Place every mention on its row and count its points; a mention of no track counts none. */
function placeMentions (rows, mentions, placed, trackCount) {
  mentions.filter(isMention).forEach(mention => {
    const key = placed.get(mention)
    const row = addSupport(rows, key, mention)
    if (!isUnmatched(key)) row.score += pointsOf(mention.position, trackCount)
  })
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

/** The first mention, the text the rule compares it by, and whether a row has that text as its key. */
function sampleOf (mentions, rows, trackTextOf) {
  if (mentions.length === 0) return null
  const mention = mentions[0] && mentions[0].trackTitle
  const mentionKey = trackTextOf(mention)
  return { mention, mentionKey, matched: rows.has(mentionKey) }
}

/**
 * @param {Array} tracks - the tracks of the album (may be empty: not known)
 * @param {Array} mentions - what the sources gave
 * @param {{ matchTracks: Function, trackTextOf: Function }} rule - shared/trackIdentity.js
 * @returns {{ results: Array, divergence: Object, debugInfo: Object }}
 */
function consolidate (tracks, mentions, rule) {
  const albumTracks = Array.isArray(tracks) ? tracks : []
  const trackCount = albumTracks.length
  const sourceCount = sourcesIn(mentions).size
  const board = boardOf(albumTracks)
  placeMentions(board, mentions, rowsOfMentions(albumTracks.map(titleOfTrack), mentions, rule), trackCount)

  const rows = Array.from(board.entries())
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
      sampleMatch: sampleOf(mentions, board, rule.trackTextOf)
    }
  }
}

/**
 * @param {Array} [tracks] - album tracks
 * @param {Array} [acclaim] - mentions { provider, trackTitle, position, referenceUrl, rating }
 */
async function consolidateRanking (tracks = [], acclaim = []) {
  return consolidate(tracks, acclaim, await loadTrackIdentity())
}

module.exports = { consolidateRanking, consolidate }
