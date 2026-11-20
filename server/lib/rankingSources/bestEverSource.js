/**
 * The first source of the ranking of an album: the track ratings of BestEverAlbums (the scraper is
 * injected). One typed outcome (sourceOutcome.js); a failure of the scraper is thrown on, and
 * `askSource` turns it into `failed`.
 */
const { SOURCE_OUTCOMES, found, none } = require('./sourceOutcome')

const NAME = 'BestEverAlbums'

/** A rating as a number; text is read as a number; no rating is null. */
const ratingOf = (rating) => {
  if (typeof rating === 'number') return rating
  return rating ? Number(rating) : null
}
const isRated = (entry) => entry.rating !== null && entry.rating !== undefined
const urlOf = (page) => page.referenceUrl || page.albumUrl || null

/** The tracks the page lists, in page order: the position of each is its place on the page. */
const entriesOf = (page) => page.evidence.map((evidence, index) => ({
  provider: NAME,
  trackTitle: evidence.trackTitle,
  position: index + 1,
  rating: ratingOf(evidence.rating),
  referenceUrl: urlOf(page)
}))

/** What the album keeps of the page, apart from the ranking. */
const pageOf = (page) => ({ albumUrl: urlOf(page), albumId: page.albumId || null, evidence: page.evidence })

/**
 * @param {Object} deps
 * @param {Function} deps.getBestEverRanking - (title, artist, { deadlineAt }) => Promise<page|null>, throws UpstreamError
 */
function createBestEverSource ({ getBestEverRanking }) {
  /**
   * @returns {Promise<Object>} found | no_ratings, with { entries, rated, source, bestEver }; or not_found
   */
  async function ask ({ title, artist }, { deadlineAt }) {
    const page = await getBestEverRanking(title, artist, { deadlineAt })
    if (!page) return none(SOURCE_OUTCOMES.NOT_FOUND)

    const entries = entriesOf({ ...page, evidence: Array.isArray(page.evidence) ? page.evidence : [] })
    const rated = entries.filter(isRated).length
    const data = {
      entries,
      rated,
      source: { provider: NAME, providerType: 'community', referenceUrl: urlOf(page) },
      bestEver: pageOf(page)
    }
    return rated > 0 ? found(data) : none(SOURCE_OUTCOMES.NO_RATINGS, data)
  }

  return { name: NAME, ask }
}

module.exports = { createBestEverSource }
