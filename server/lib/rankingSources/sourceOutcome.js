/**
 * What ONE source of ratings answered, for the ranking of an album (F52, slice 5). A source is
 * asked through `askSource` and always ends in one of these, never in a thrown error and never in
 * "nothing" when it failed:
 *
 *   found           the source has ratings (or a ranking) for the album; with `entries`
 *   not_found       the source answered: it has no such album
 *   no_ratings      the source has the album's page, with no rating on it (it may still list the tracks)
 *   not_configured  this server is not set up to ask the source: it was not asked
 *   failed          the source could not answer (down, slow, busy, or it broke); with `code`
 *   not_asked       the pipeline did not need the source
 *
 * The first three are the outcomes of lib/outcome.js. `failed` is what a route would answer as a
 * failure; here it stays beside the album, because the album itself was found.
 */
const { UpstreamError } = require('../outcome')
const { providerCaseOf, AI_PROVIDER_TABLE } = require('../aiProviderOutcome')

const SOURCE_OUTCOMES = Object.freeze({
  FOUND: 'found',
  NOT_FOUND: 'not_found',
  NO_RATINGS: 'no_ratings',
  NOT_CONFIGURED: 'not_configured',
  FAILED: 'failed',
  NOT_ASKED: 'not_asked'
})

const found = (data) => ({ outcome: SOURCE_OUTCOMES.FOUND, ...data })
const none = (outcome, data = {}) => ({ outcome, ...data })
const failed = (code, message) => ({ outcome: SOURCE_OUTCOMES.FAILED, code, message })
const notAsked = () => ({ outcome: SOURCE_OUTCOMES.NOT_ASKED })

const CODE_OF_PROVIDER_CASE = new Map(AI_PROVIDER_TABLE.map(row => [row.provider, row.code]))

/** The code, and the words for the log, of what a source threw. Something of ours that broke is `internal`. */
function failureOf (err) {
  if (err instanceof UpstreamError) return failed(err.code, err.message)
  const providerCase = providerCaseOf(err)
  if (providerCase) return failed(CODE_OF_PROVIDER_CASE.get(providerCase), `the AI provider: ${providerCase}`)
  return failed('internal', (err && err.message) || String(err))
}

/** A budget for a caller that has none (a script, a debug route): no deadline. */
const NO_BUDGET = Object.freeze({ deadlineAt: Infinity, remainingMs: () => Infinity, race: (work) => work })

/**
 * Ask one source, within the time of the request.
 * @param {string} name - the name for the log, e.g. 'BestEverAlbums'
 * @param {Function} ask - () => Promise<outcome>
 * @param {Object} options
 * @param {Object} options.budget - lib/timeBudget.js
 * @param {Object} options.logger - { warn(msg, meta), error(msg, meta) }
 * @returns {Promise<Object>} the outcome; a failure is `failed`, never thrown
 */
async function askSource (name, ask, { budget, logger }) {
  if (budget.remainingMs() <= 0) return failed('upstream_timeout', `${name}: the time of the request is over`)
  try {
    return await budget.race(Promise.resolve().then(ask), name)
  } catch (err) {
    const failure = failureOf(err)
    const level = failure.code === 'internal' ? 'error' : 'warn'
    logger[level]('ranking_source_failed', { source: name, code: failure.code, err: failure.message })
    return failure
  }
}

module.exports = { SOURCE_OUTCOMES, found, none, failed, notAsked, askSource, NO_BUDGET }
