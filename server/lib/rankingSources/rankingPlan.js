/**
 * The decisions of the ranking pipeline, as pure functions over what the sources answered
 * (sourceOutcome.js): which source is still needed, and which answer becomes the ranking of the
 * album. No source is asked here.
 *
 *   needsPopularity   BestEverAlbums listed no track, or rated few of them
 *   needsModel        neither BestEverAlbums nor Spotify gave the ranking of the whole album
 *   chooseRanking     Spotify when it wins; else the page (completed by the AI when it lists fewer
 *                     tracks than the album); else what the AI gave; else nothing
 */
const { SOURCE_OUTCOMES } = require('./sourceOutcome')
const { completeRanking } = require('./completeRanking')

/** Below this many rated tracks AND below this share of the album, the page has "few ratings". */
const ENOUGH_RATED_TRACKS = 3
const ENOUGH_RATED_SHARE = 0.4
/** Spotify replaces a page with few ratings only when it has at least this share of the tracks. */
const POPULARITY_SHARE_TO_WIN = 0.5
/** How many sources the AI named are listed beside the page. */
const MODEL_SOURCES_LISTED = 3

const entriesOf = (answer) => answer.entries || []
const hasEntries = (answer) => entriesOf(answer).length > 0
const isFound = (answer) => answer.outcome === SOURCE_OUTCOMES.FOUND
/** The source answered, with or without a ranking (it did not fail, and it was asked). */
const answered = (answer) => Array.isArray(answer.entries)

function hasFewRatings (asked, acclaim) {
  const enoughForTheAlbum = Math.ceil((asked.trackCount || 1) * ENOUGH_RATED_SHARE)
  return acclaim.rated < enoughForTheAlbum && acclaim.rated < ENOUGH_RATED_TRACKS
}

const needsPopularity = (asked, { acclaim }) => !hasEntries(acclaim) || hasFewRatings(asked, acclaim)

function popularityWins (asked, { acclaim, popularity }) {
  if (!isFound(popularity)) return false
  return !hasEntries(acclaim) || popularity.entries.length >= (asked.trackCount || 0) * POPULARITY_SHARE_TO_WIN
}

/** The page lists every track of the album (or the tracks of the album are not known). */
const pageIsComplete = (asked, acclaim) => !asked.trackCount || acclaim.entries.length >= asked.trackCount

function needsModel (asked, answers) {
  if (popularityWins(asked, answers)) return false
  return !(hasEntries(answers.acclaim) && pageIsComplete(asked, answers.acclaim))
}

function fromPopularity ({ acclaim, popularity }) {
  const ranking = { entries: popularity.entries, sources: [popularity.source], spotify: popularity.spotify }
  // The page that lost stays on the album as evidence
  return hasEntries(acclaim) ? { ...ranking, bestEver: acclaim.bestEver } : ranking
}

function fromPage (asked, { acclaim, aiRanking }, normalizeKey) {
  const page = { entries: acclaim.entries, sources: [acclaim.source], bestEver: acclaim.bestEver }
  if (!answered(aiRanking)) return page // complete, or the AI could not complete it
  return {
    ...page,
    entries: completeRanking(asked.tracks, acclaim.entries, aiRanking.entries, normalizeKey),
    sources: [acclaim.source, ...aiRanking.sources.slice(0, MODEL_SOURCES_LISTED)]
  }
}

/**
 * @param {Object} asked - { title, artist, tracks, trackCount }
 * @param {{ acclaim: Object, popularity: Object, aiRanking: Object }} answers
 * @param {Function} normalizeKey
 * @returns {{ entries: Array, sources: Array, bestEver?: Object, spotify?: Object }}
 */
function chooseRanking (asked, answers, normalizeKey) {
  if (popularityWins(asked, answers)) return fromPopularity(answers)
  if (hasEntries(answers.acclaim)) return fromPage(asked, answers, normalizeKey)
  return { entries: entriesOf(answers.aiRanking), sources: answers.aiRanking.sources || [] }
}

module.exports = { needsPopularity, needsModel, chooseRanking, hasEntries }
