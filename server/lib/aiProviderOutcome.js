/**
 * What leaves this server for each answer of the paid AI provider (F52; arch.md, "O servidor diz
 * a verdade", section 11, item 2). A closed table, as data, read by every route that calls the provider.
 *
 * Why it is not "every failure is a 5xx": each call costs money, and a browser tab opened before
 * F52 asks again, up to twice, after ANY 5xx. So only a failure that may pass by asking again
 * leaves as 5xx with `retryable: true`. What will not pass (billing, quota, a request the provider
 * refuses, an answer that cannot be used) leaves as 424 Failed Dependency: a 4xx, which an old tab
 * does not repeat, and neither 401 nor 429, which are this server's own door and limit.
 * The provider's message goes to the log, never to the body.
 */
const { failure, isTimeout } = require('./outcome')

const AI_PROVIDER_TABLE = Object.freeze([
  // what the provider did                                   what leaves
  { provider: 'timeout', status: 504, code: 'upstream_timeout', retryable: true }, // no answer before the deadline
  { provider: 'no_answer', status: 502, code: 'upstream_failed', retryable: true }, // network: no answer at all
  { provider: '5xx', status: 502, code: 'upstream_failed', retryable: true }, // the provider broke
  { provider: '402', status: 424, code: 'upstream_failed', retryable: false }, // billing
  { provider: '429', status: 424, code: 'upstream_busy', retryable: false }, // quota
  { provider: '4xx', status: 424, code: 'upstream_failed', retryable: false }, // it refused the request (400, 401, 403, 404...)
  { provider: 'unusable', status: 424, code: 'upstream_failed', retryable: false } // it answered, and the answer cannot be used
].map(row => Object.freeze(row)))

const ROW_BY_CASE = new Map(AI_PROVIDER_TABLE.map(row => [row.provider, row]))

function caseOfStatus (status) {
  if (status === 402) return '402'
  if (status === 429) return '429'
  if (status >= 400 && status < 500) return '4xx'
  if (status >= 500) return '5xx'
  return 'unusable' // an answer that is neither a success nor an error the table knows
}

/**
 * @param {Error} err - what the call to the provider threw (axios-shaped)
 * @returns {string|null} the case of the table, or null when the error is not the provider's
 *          (a bug of this server): that one is thrown on, to the route's error path
 */
function providerCaseOf (err) {
  const status = Number(err && err.response && err.response.status)
  if (status) return caseOfStatus(status)
  if (isTimeout(err)) return 'timeout'
  const neverAnswered = err && (err.isAxiosError || err.request || typeof err.code === 'string')
  return neverAnswered ? 'no_answer' : null
}

/** The failure (lib/outcome.js) of one case of the table. */
function providerFailure (providerCase) {
  const row = ROW_BY_CASE.get(providerCase)
  if (!row) throw new Error(`Unknown AI provider case: ${providerCase}`)
  return failure(row.code, { status: row.status, retryable: row.retryable })
}

/** @returns {Object|null} the failure for what the provider call threw; null when it is not the provider's */
function failureFromProviderError (err) {
  const providerCase = providerCaseOf(err)
  return providerCase ? providerFailure(providerCase) : null
}

/** One line for the log: the case, the status and the provider's own words. Never the address (it carries the key). */
function describeProviderError (err) {
  const status = err && err.response && err.response.status
  const data = err && err.response && err.response.data
  const said = (data && data.error && (data.error.message || data.error.status)) || (err && err.message) || String(err)
  return `case=${providerCaseOf(err)} status=${status || '-'} said=${JSON.stringify(said)}`
}

module.exports = { AI_PROVIDER_TABLE, providerCaseOf, providerFailure, failureFromProviderError, describeProviderError }
