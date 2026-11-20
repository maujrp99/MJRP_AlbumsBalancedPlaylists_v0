/**
 * The ranking of the tracks of an album, for POST /api/generate: a small pipeline of sources
 * (F52, slice 5). Each source is a module of lib/rankingSources/ with ONE typed outcome
 * (sourceOutcome.js: found, not_found, no_ratings, not_configured, failed, not_asked); they are
 * asked in the order declared in `PIPELINE`, each only while the ones before left the ranking
 * incomplete (rankingPlan.js), and the choice of what becomes the ranking is a pure step.
 *
 *   1. acclaim     BestEverAlbums, the track ratings of the album's page
 *   2. popularity  Spotify, when the page listed no track or rated few of them
 *   3. aiRanking   the paid AI provider, when neither gave the ranking of the whole album
 *
 * A source that fails is `failed` in `ratings`, never read as "it has none": the album still gets
 * what the other sources gave, and the answer says which source could not be asked. Before, a
 * failure of the scraper or of Spotify was swallowed here and looked the same as an album with no
 * ratings.
 *
 * The result: { entries, sources, bestEver?, spotify?, ratings, debugTrace }
 *   ratings     { acclaim, popularity, aiRanking }: the outcome of each source
 *   debugTrace  one row per source: { source, outcome, entries, code? }; no message of a source
 */
const { loadPrompts, renderPrompt, requirePrompt } = require('./prompts')
const { callProvider } = require('./aiClient')
const { extractAndValidateRankingEntries, rankingEntriesToSources } = require('./normalize')
const { getRankingForAlbum: getBestEverRanking } = require('./scrapers/besteveralbums')
const { getSpotifyPopularityRanking } = require('./services/spotifyPopularity')
const { loadTrackIdentity } = require('./trackIdentity')
const logger = require('./logger')
const { askSource, notAsked, NO_BUDGET } = require('./rankingSources/sourceOutcome')
const { createBestEverSource } = require('./rankingSources/bestEverSource')
const { createSpotifySource } = require('./rankingSources/spotifySource')
const { createModelSource } = require('./rankingSources/modelSource')
const { needsPopularity, needsModel, chooseRanking, hasEntries } = require('./rankingSources/rankingPlan')

/** What is asked for: the album the AI answered, or the query when it has no title of its own. */
function askedOf (album, albumQuery) {
  const given = album || {}
  const tracks = Array.isArray(given.tracks) ? given.tracks : null
  return {
    title: given.title || albumQuery,
    artist: given.artist || '',
    year: given.year || '',
    albumQuery,
    tracks,
    trackCount: tracks ? tracks.length : null
  }
}

const traceOf = (answers) => Object.entries(answers).map(([source, answer]) => ({
  source,
  outcome: answer.outcome,
  entries: (answer.entries || []).length,
  ...(answer.code ? { code: answer.code } : {})
}))

const ratingsOf = (answers) => Object.fromEntries(Object.entries(answers).map(([source, answer]) => [source, answer.outcome]))

/**
 * @param {Object} deps - the outside, injected: loadPrompts, renderPrompt, requirePrompt, callProvider,
 *        extractAndValidateRankingEntries, rankingEntriesToSources, getBestEverRanking,
 *        getSpotifyPopularityRanking, loadTrackIdentity, logger, [env]
 */
function createRankingFetch (deps) {
  const model = createModelSource(deps)

  /** The sources, in the order they are asked. `needed` reads what the ones before answered. */
  const PIPELINE = Object.freeze([
    {
      key: 'acclaim',
      source: createBestEverSource(deps),
      needed: () => true,
      optionsOf: (answers, budget) => ({ deadlineAt: budget.deadlineAt })
    },
    {
      key: 'popularity',
      source: createSpotifySource(deps),
      needed: needsPopularity,
      optionsOf: () => ({})
    },
    {
      key: 'aiRanking',
      source: model,
      needed: needsModel,
      // The suggested sources are named only when the AI ranks alone, not when it completes a page
      optionsOf: (answers) => ({ withProviders: !hasEntries(answers.acclaim) })
    }
  ])

  async function askInOrder (asked, budget) {
    const answers = {}
    for (const { key, source, needed, optionsOf } of PIPELINE) {
      answers[key] = needed(asked, answers)
        ? await askSource(source.name, () => source.ask(asked, optionsOf(answers, budget)), { budget, logger: deps.logger })
        : notAsked()
    }
    return answers
  }

  /**
   * @param {Object} album - the album the AI answered ({ title, artist, year, tracks })
   * @param {string} albumQuery
   * @param {Object} [options]
   * @param {Object} [options.budget] - lib/timeBudget.js: the time of the request
   * @param {boolean} [options.raw] - a debug feature: only the AI's answer to the ranking prompt, as it came
   * @throws {PromptsError} when the prompts file has no ranking prompt
   */
  async function fetchRankingForAlbum (album, albumQuery, options = {}) {
    const asked = askedOf(album, albumQuery)
    if (options.raw) return { raw: await model.callWithRankingPrompt(asked, true), debugTrace: [] }

    requirePrompt(deps.loadPrompts(), 'rankingPrompt')
    const answers = await askInOrder(asked, options.budget || NO_BUDGET)
    const { matchTracks } = await deps.loadTrackIdentity()
    return { ...chooseRanking(asked, answers, matchTracks), ratings: ratingsOf(answers), debugTrace: traceOf(answers) }
  }

  return fetchRankingForAlbum
}

const fetchRankingForAlbum = createRankingFetch({
  loadPrompts,
  renderPrompt,
  requirePrompt,
  callProvider,
  extractAndValidateRankingEntries,
  rankingEntriesToSources,
  getBestEverRanking,
  getSpotifyPopularityRanking,
  loadTrackIdentity,
  logger
})

module.exports = { fetchRankingForAlbum, createRankingFetch }
