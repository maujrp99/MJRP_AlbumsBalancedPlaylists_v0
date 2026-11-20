/**
 * A page of BestEverAlbums that lists fewer tracks than the album, completed with the ranking the
 * AI gave: the page's entry where the page has the track, the model's where it does not. Pure:
 * entries in, entries out; `normalizeKey` (shared/normalize.js) says when two titles are the same.
 */

const titleOfTrack = (track) => (track && (track.title || track.trackTitle || track.name)) || ''
const keyOfEntry = (entry, normalizeKey) => (entry && entry.trackTitle ? normalizeKey(entry.trackTitle) : null)

/** Map<title key, entry>; with two entries of the same title, the later one stays. */
function byTitle (entries, normalizeKey) {
  const index = new Map()
  entries.forEach(entry => {
    const key = keyOfEntry(entry, normalizeKey)
    if (key) index.set(key, entry)
  })
  return index
}

/** For each track of the album the page does not have, the model's entry of that title. */
function fillFromModel (chosen, tracks, modelEntries, normalizeKey) {
  const modelByTitle = byTitle(modelEntries, normalizeKey)
  tracks.forEach(track => {
    const key = normalizeKey(titleOfTrack(track))
    if (key && !chosen.has(key) && modelByTitle.has(key)) chosen.set(key, modelByTitle.get(key))
  })
}

/** Still fewer entries than tracks: the model's other entries, in its order, until there are enough. */
function topUpFromModel (chosen, modelEntries, trackCount, normalizeKey) {
  for (const entry of modelEntries) {
    if (chosen.size >= trackCount) return
    const key = keyOfEntry(entry, normalizeKey)
    if (key && !chosen.has(key)) chosen.set(key, entry)
  }
}

const entryOf = (chosen, fallbackTitle, fallbackPosition) => ({
  provider: chosen.provider || 'Model',
  trackTitle: chosen.trackTitle || fallbackTitle,
  position: chosen.position || fallbackPosition,
  rating: chosen.rating || null,
  referenceUrl: chosen.referenceUrl || null
})

/** The chosen entries of the tracks of the album, in album order. */
function inAlbumOrder (chosen, tracks, normalizeKey) {
  const entries = []
  tracks.forEach((track, index) => {
    const entry = chosen.get(normalizeKey(titleOfTrack(track)))
    if (entry) entries.push(entryOf(entry, track.title || track.trackTitle, index + 1))
  })
  return entries
}

/** Chosen entries that are of no track of the album, appended until there are as many as tracks. */
function appendOthers (entries, chosen, trackCount, normalizeKey) {
  const present = new Set(entries.map(entry => normalizeKey(entry.trackTitle)))
  for (const entry of chosen.values()) {
    if (entries.length >= trackCount) return
    const key = keyOfEntry(entry, normalizeKey)
    if (!key || present.has(key)) continue
    entries.push(entryOf(entry, entry.trackTitle, entries.length + 1))
    present.add(key)
  }
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
 * @param {Function} normalizeKey
 * @returns {Array} the entries of the album, at most one per title
 */
function completeRanking (tracks, pageEntries, modelEntries, normalizeKey) {
  const chosen = byTitle(pageEntries, normalizeKey)
  fillFromModel(chosen, tracks, modelEntries, normalizeKey)
  topUpFromModel(chosen, modelEntries, tracks.length, normalizeKey)

  const entries = inAlbumOrder(chosen, tracks, normalizeKey)
  appendOthers(entries, chosen, tracks.length, normalizeKey)
  return entries.sort(byPositionThenRating)
}

module.exports = { completeRanking }
