/**
 * The one place that builds an answer of this server (F52, "O servidor diz a verdade").
 *
 * Every route answers in one of two shapes, and the app tells them apart by the HTTP status
 * and by one field:
 *
 *   success  200  { data, outcome }                 outcome is ALWAYS there:
 *                                                     'found'       the source has it
 *                                                     'not_found'   the source answered: it has no such thing
 *                                                     'no_ratings'  the source has the page, with no rating
 *                                                     'no_value'    the source has the edition, with no price for it (F75)
 *                                                     'not_configured'  this server is not set up (or was told not)
 *                                                                   to ask the source: it was not asked (F75)
 *   failure  4xx/5xx  { error: { code, retryable } } code is one of ERROR_CODES;
 *                                                    retryable: the same request, sent again within
 *                                                    seconds, may work
 *
 * "It could not be known" is never a success: a source that is down, slow or busy is a failure.
 * No message of a provider or of the server's inside goes in the body; it goes to the log.
 *
 * A service returns `success(...)` or `failure(...)` (a typed result); a route hands it to
 * `respond(res, result)`. Nothing else in server/ writes `res.status(...).json(...)` for these routes.
 */

const OUTCOMES = Object.freeze({ FOUND: 'found', NOT_FOUND: 'not_found', NO_RATINGS: 'no_ratings', NO_VALUE: 'no_value', NOT_CONFIGURED: 'not_configured' })
const OUTCOME_VALUES = new Set(Object.values(OUTCOMES))

/** code -> the status it leaves with when the caller names no other, and whether to ask again. */
const ERRORS = Object.freeze({
  upstream_failed: Object.freeze({ status: 502, retryable: true }), // the outside source failed
  upstream_timeout: Object.freeze({ status: 504, retryable: true }), // the outside source was too slow
  upstream_busy: Object.freeze({ status: 503, retryable: true }), // the outside source asked to wait
  upstream_unauthorized: Object.freeze({ status: 502, retryable: false }), // the outside source refused this server's own key (F75)
  invalid_request: Object.freeze({ status: 400, retryable: false }), // the caller sent something unusable
  unauthorized: Object.freeze({ status: 401, retryable: false }), // no login, or one that may not do this
  rate_limited: Object.freeze({ status: 429, retryable: false }), // this person's limit; see Retry-After
  internal: Object.freeze({ status: 500, retryable: false }) // this server broke
})
const ERROR_CODES = Object.freeze(Object.keys(ERRORS))

/**
 * @param {*} data
 * @param {string} [outcome='found'] - one of OUTCOMES
 * @returns {{ ok: true, status: 200, outcome: string, data: * }}
 */
function success (data, outcome = OUTCOMES.FOUND) {
  if (!OUTCOME_VALUES.has(outcome)) throw new Error(`Unknown outcome: ${outcome}`)
  return { ok: true, status: 200, outcome, data }
}

/**
 * @param {string} code - one of ERROR_CODES
 * @param {Object} [options]
 * @param {number} [options.status] - another HTTP status than the code's own
 * @param {boolean} [options.retryable] - another answer to "ask again?" than the code's own
 * @param {number} [options.retryAfterSeconds] - sent as the Retry-After header
 * @returns {{ ok: false, status: number, code: string, retryable: boolean, retryAfterSeconds: number|null }}
 */
function failure (code, { status, retryable, retryAfterSeconds = null } = {}) {
  const known = ERRORS[code]
  if (!known) throw new Error(`Unknown error code: ${code}`)
  return {
    ok: false,
    status: status || known.status,
    code,
    retryable: typeof retryable === 'boolean' ? retryable : known.retryable,
    retryAfterSeconds
  }
}

/** The body that goes on the wire for a result. */
function bodyOf (result) {
  if (result.ok) return { data: result.data, outcome: result.outcome }
  return { error: { code: result.code, retryable: result.retryable } }
}

/** Write a result as the answer of a request. */
function respond (res, result) {
  if (!result.ok && result.retryAfterSeconds) res.set('Retry-After', String(result.retryAfterSeconds))
  return res.status(result.status).json(bodyOf(result))
}

/**
 * An outside source could not answer. Thrown by whatever talks to the outside (a scraper, the AI
 * client's callers), so "it failed" can never be read as "there is nothing".
 */
class UpstreamError extends Error {
  /**
   * @param {string} code - upstream_failed | upstream_timeout | upstream_busy | upstream_unauthorized
   * @param {string} message - for the log
   * @param {Object} [options]
   * @param {Error} [options.cause]
   * @param {number} [options.retryAfterMs] - with upstream_busy: how long the source is to be left alone
   */
  constructor (code, message, { cause, retryAfterMs = null } = {}) {
    super(message)
    this.name = 'UpstreamError'
    this.code = code
    this.retryAfterMs = retryAfterMs
    if (cause) this.cause = cause
  }
}

const isTimeout = (err) => err && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || /timeout/i.test(String(err.message || '')))

/**
 * Turn a failure of an HTTP call (axios-shaped) into an UpstreamError. The message names the
 * source and the status or the network code, never the address of the request (it may carry a key).
 * @param {Error} err
 * @param {string} source - the name for the log, e.g. 'BestEverAlbums'
 * @returns {UpstreamError}
 */
function upstreamErrorFrom (err, source) {
  if (err instanceof UpstreamError) return err
  const status = err && err.response && err.response.status
  let code = 'upstream_failed'
  if (!status && isTimeout(err)) code = 'upstream_timeout'
  if (status === 429 || status === 503) code = 'upstream_busy'
  const detail = status ? `HTTP ${status}` : ((err && err.code) || 'no answer')
  return new UpstreamError(code, `${source}: ${detail}`, { cause: err })
}

module.exports = { OUTCOMES, ERROR_CODES, success, failure, bodyOf, respond, UpstreamError, upstreamErrorFrom, isTimeout }
