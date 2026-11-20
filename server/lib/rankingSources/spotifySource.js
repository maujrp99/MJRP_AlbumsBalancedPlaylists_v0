/**
 * The second source of the ranking of an album: the popularity of its tracks on Spotify, used as
 * a rating when BestEverAlbums has too little (the lookup is injected: services/spotifyPopularity.js,
 * typed since F69). One typed outcome (sourceOutcome.js); a failure of Spotify is thrown on, and
 * `askSource` turns it into `failed`.
 */
const { SOURCE_OUTCOMES, found, none } = require('./sourceOutcome')

const NAME = 'Spotify'

const entriesOf = (answer) => answer.evidence
  .map(evidence => ({
    provider: NAME,
    trackTitle: evidence.trackTitle,
    position: evidence.position,
    rating: evidence.rating, // 0-100
    referenceUrl: answer.referenceUrl
  }))
  .sort((a, b) => b.rating - a.rating)

const hasTracks = (answer) => answer.outcome === SOURCE_OUTCOMES.FOUND && Array.isArray(answer.evidence) && answer.evidence.length > 0

/**
 * @param {Object} deps
 * @param {Function} deps.getSpotifyPopularityRanking - (title, artist) => Promise<{ outcome, ... }>, throws UpstreamError
 */
function createSpotifySource ({ getSpotifyPopularityRanking }) {
  /** @returns {Promise<Object>} found, with { entries, source, spotify }; or not_found; or not_configured */
  async function ask ({ title, artist }) {
    const answer = (await getSpotifyPopularityRanking(title, artist)) || {}
    if (answer.outcome === SOURCE_OUTCOMES.NOT_CONFIGURED) return none(SOURCE_OUTCOMES.NOT_CONFIGURED)
    if (!hasTracks(answer)) return none(SOURCE_OUTCOMES.NOT_FOUND)

    return found({
      entries: entriesOf(answer),
      source: { provider: NAME, providerType: 'popularity', referenceUrl: answer.referenceUrl },
      spotify: { referenceUrl: answer.referenceUrl }
    })
  }

  return { name: NAME, ask }
}

module.exports = { createSpotifySource }
