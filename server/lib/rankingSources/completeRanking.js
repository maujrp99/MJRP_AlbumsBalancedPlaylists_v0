/**
 * A page of BestEverAlbums that lists fewer tracks than the album, completed with the ranking the
 * AI gave: the page's entry where the page has the track, the model's where it does not. Pure:
 * entries in, entries out. Which entry is of which track is the one track rule's to say
 * (`matchTracks`, shared/trackIdentity.js, F74): nothing here compares titles.
 */

const hasTitle = (entry) => Boolean(entry && entry.trackTitle)

const entryOf = (chosen, fallbackTitle, fallbackPosition) => ({
  provider: chosen.provider || 'Model',
  trackTitle: chosen.trackTitle || fallbackTitle,
  position: chosen.position || fallbackPosition,
  rating: chosen.rating || null,
  referenceUrl: chosen.referenceUrl || null
})

/** For each track of the album, in album order: the page's entry, else the model's. */
function ofTheTracks (tracks, fromPage, fromModel) {
  const entries = []
  tracks.forEach((track, index) => {
    const match = fromPage[index] || fromModel[index]
    if (match) entries.push(entryOf(match.entry, track.title || track.trackTitle, index + 1))
  })
  return entries
}

/** The entries of a list that no track of the album took. */
const leftOf = (entries, matches) => {
  const taken = new Set(matches.filter(Boolean).map(match => match.index))
  return entries.filter((entry, index) => hasTitle(entry) && !taken.has(index))
}

/**
 * The entries that are of no track of the album: the page's, then the model's that the page does
 * not also have (one entry per title).
 */
function ofNoTrack ({ pageEntries, modelEntries, fromPage, fromModel }, matchTracks) {
  const pageLeft = leftOf(pageEntries, fromPage)
  const modelLeft = leftOf(modelEntries, fromModel)
  // titles only: the `position` of an entry is its place in a ranking, not a track number
  const onThePage = matchTracks(modelLeft.map(entry => entry.trackTitle), pageEntries)
  return [...pageLeft, ...modelLeft.filter((entry, index) => !onThePage[index])]
}

const differentAndBoth = (a, b) => Boolean(a && b && a !== b)

/** By position; two entries at the same position, by rating (highest first). */
function byPositionThenRating (a, b) {
  if (differentAndBoth(a.position, b.position)) return a.position - b.position
  if (differentAndBoth(a.rating, b.rating)) return b.rating - a.rating
  return 0
}

/**
 * @param {Array} tracks - the tracks of the album (at least one)
 * @param {Array} pageEntries - what the page lists
 * @param {Array} modelEntries - what the AI gave (may be empty)
 * @param {Function} matchTracks - shared/trackIdentity.js
 * @returns {Array} the entries of the album: one per track that has one, then entries of no track
 *          of the album until there are as many as tracks
 */
function completeRanking (tracks, pageEntries, modelEntries, matchTracks) {
  const fromPage = matchTracks(tracks, pageEntries)
  const fromModel = matchTracks(tracks, modelEntries)

  const entries = ofTheTracks(tracks, fromPage, fromModel)
  for (const entry of ofNoTrack({ pageEntries, modelEntries, fromPage, fromModel }, matchTracks)) {
    if (entries.length >= tracks.length) break
    entries.push(entryOf(entry, entry.trackTitle, entries.length + 1))
  }
  return entries.sort(byPositionThenRating)
}

module.exports = { completeRanking }
