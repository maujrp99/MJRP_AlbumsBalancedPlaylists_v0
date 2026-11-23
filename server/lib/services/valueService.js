/**
 * valueService - the value of an album for the inventory (F75), as a typed result of
 * lib/outcome.js. The source is injected (lib/valueSources/discogsSource.js).
 *
 *   found           the source has a price suggestion for the CD edition; `data` is
 *                   { release: { id, title, url }, conditions: { mint, nearMint, veryGoodPlus }, currency, readAt };
 *                   or, when Discogs refuses suggestions to the account (no seller settings), the
 *                   lowest price for sale: { release, kind: 'lowest_for_sale', lowest: { value, currency },
 *                   forSale, suggestions: 'seller_settings_missing' | 'not_asked', readAt }
 *   not_found       the source has no CD edition of the album; `data` is null
 *   no_value        the edition exists and has no suggestion; `data` is { release }
 *   not_configured  the switch is not on for who asks (lib/valueSources/valueSwitch.js: off, or
 *                   unknown when the CMS key could not be read): the source was not asked; `data` is null
 *   failure         invalid_request, or the source could not answer: upstream_unauthorized (the
 *                   token was refused), upstream_busy (its limit, with Retry-After),
 *                   upstream_timeout, upstream_failed
 * Anything else that breaks here is thrown: the route's error path answers `internal`.
 *
 * One album request has VALUE_BUDGET_MS in all (the app waits 25 s): at the deadline the answer
 * is `upstream_timeout`, whatever the source is doing. Nothing is kept after the request: there
 * is no cache of prices on the server (Discogs API Terms of Use).
 */
const { success, failure, UpstreamError } = require('../outcome')
const { createBudget } = require('../timeBudget')
const { discogsSwitch, discogsState, ON, UNKNOWN } = require('../valueSources/valueSwitch')

/** The whole time of one album request: three requests to the source, one a second, and their answers. */
const VALUE_BUDGET_MS = 20000
const MAX_TEXT = 300

const isText = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_TEXT
const isReleaseId = (value) => Number.isInteger(value) && value > 0
const yearOf = (value) => (typeof value === 'number' || typeof value === 'string' ? value : null)

/** What the app sent, as the source is asked; null when it is unusable. */
function albumOf (body) {
  if (!body || !isText(body.artist) || !isText(body.title)) return null
  if (body.releaseId !== undefined && body.releaseId !== null && !isReleaseId(body.releaseId)) return null
  const album = { artist: body.artist.trim(), title: body.title.trim() }
  if (yearOf(body.year) !== null) album.year = body.year
  if (isReleaseId(body.releaseId)) album.releaseId = body.releaseId
  // the app already knows the suggestions are refused for the seller settings: only the lowest price is asked
  if (body.prices === 'lowest') album.prices = 'lowest'
  return album
}

/**
 * @param {Object} deps
 * @param {{ name: string, ask: Function }} deps.source - (album, { deadlineAt }) => Promise<outcome>, throws UpstreamError
 * @param {{ discogsValues: () => Promise<'on'|'off'|'unknown'> }} deps.switches - the CMS switches (lib/valueSources/cmsSwitches.js)
 * @param {Object} [deps.env] - the environment, read on every request (the switch)
 * @param {Function} [deps.newBudget] - () => a budget of lib/timeBudget.js, for one request
 * @param {Object} [deps.logger]
 */
function createValueService ({ source, switches, env = process.env, newBudget = () => createBudget({ ms: VALUE_BUDGET_MS }), logger = console }) {
  if (!switches || typeof switches.discogsValues !== 'function') throw new Error('createValueService needs the CMS switches: the Discogs key is the second lock')

  /**
   * The Discogs switch for who asks: two locks, the environment (read first: when it says off the CMS
   * is not asked) and the key of the CMS. `unknown` (the key could not be read) is said in the log.
   * @returns {Promise<'on'|'off'|'unknown'>}
   */
  async function discogsFor (user) {
    const environmentLock = discogsSwitch(env, user)
    if (environmentLock !== ON) return discogsState(environmentLock, null)
    const state = discogsState(environmentLock, await switches.discogsValues())
    if (state === UNKNOWN) logger.warn('[Value] the Discogs key of the CMS could not be read: the values are unknown, so not shown')
    return state
  }

  /** @returns {Promise<Object>} found, with { discogs: 'on' | 'off' | 'unknown' } for who asks */
  async function valueSources (user) {
    return success({ discogs: await discogsFor(user) })
  }

  /**
   * @param {Object} body - { artist, title, year?, releaseId? }
   * @param {{ uid: string, anonymous: boolean }|null} user - who asks
   * @returns {Promise<Object>} a result of lib/outcome.js
   */
  async function albumValue (body, user) {
    const album = albumOf(body)
    if (!album) return failure('invalid_request')
    if (await discogsFor(user) !== ON) return success(null, 'not_configured')

    const budget = newBudget()
    let answer
    try {
      answer = await budget.race(source.ask(album, { deadlineAt: budget.deadlineAt }), source.name)
    } catch (err) {
      if (!(err instanceof UpstreamError)) throw err
      logger.warn(`[Value] the source failed: ${err.message}`)
      return failure(err.code, { retryAfterSeconds: err.retryAfterMs > 0 ? Math.ceil(err.retryAfterMs / 1000) : null })
    }
    const { outcome, ...data } = answer
    return success(Object.keys(data).length > 0 ? data : null, outcome)
  }

  return { albumValue, valueSources }
}

module.exports = { createValueService, VALUE_BUDGET_MS }
