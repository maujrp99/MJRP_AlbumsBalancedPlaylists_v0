/**
 * The handlers of the value routes (F75), apart from Express so they are tested with no server
 * (routes/values.js only mounts them). Each asks a service for a typed result and hands it to
 * `respond` (lib/outcome.js): the handlers build no answer of their own.
 */
const { respond } = require('../../lib/outcome')

/**
 * @param {Object} deps
 * @param {Object} deps.valueService - lib/services/valueService.js
 * @param {Object} deps.exchangeRates - lib/services/exchangeRates.js
 * @param {Object} [deps.logger] - { info(msg, meta) }
 * @param {Function} [deps.now] - () => ms
 */
function createValueHandlers ({ valueService, exchangeRates, logger = console, now = () => Date.now() }) {
  /**
   * POST /api/album-value - the Discogs value of one album. One line of log per request: with
   * what answer and in how long. Nothing of the person and nothing of the album is in it.
   */
  async function albumValue (req, res) {
    const startedAt = now()
    const result = await valueService.albumValue(req.body, req.user || null)
    logger.info('album_value', { event: 'album_value', answer: result.ok ? result.outcome : result.code, ms: now() - startedAt })
    return respond(res, result)
  }

  /** GET /api/value-sources - { discogs: 'on' | 'off' } for who asks: the switch, read now. */
  async function valueSources (req, res) {
    return respond(res, valueService.valueSources(req.user || null))
  }

  /** GET /api/exchange-rates - the rates of the day from USD. */
  async function rates (req, res) {
    return respond(res, await exchangeRates.today())
  }

  return { albumValue, valueSources, exchangeRates: rates }
}

module.exports = { createValueHandlers }
