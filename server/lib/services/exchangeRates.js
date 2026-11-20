/**
 * exchangeRates - the reference rates of the day from USD to BRL, EUR and GBP (F75, REQ-08), as a
 * typed result of lib/outcome.js. The inventory keeps its values in USD and shows them in the
 * currency the person chose.
 *
 * The source is public and needs no key (api.frankfurter.app: the reference rates of the European
 * Central Bank, one set per working day). What it answers is kept in the memory of this instance
 * for the day (UTC): the source is asked once a day per instance. A failure is a typed failure and
 * is NOT kept: the next request asks again, and the app shows the values in USD and says why.
 */
const axios = require('axios')
const { success, failure, upstreamErrorFrom } = require('../outcome')

const SOURCE = 'Frankfurter'
const CURRENCIES = Object.freeze(['BRL', 'EUR', 'GBP'])
const RATES_URL = `https://api.frankfurter.app/latest?from=USD&to=${CURRENCIES.join(',')}`
const REQUEST_TIMEOUT_MS = 8000

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
const isRate = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0

/** The rates of an answer, or null when one is missing or is not a number above zero. */
function ratesOf (body) {
  const given = body && typeof body === 'object' ? body.rates : null
  if (!given || !CURRENCIES.every(code => isRate(given[code]))) return null
  return { base: 'USD', date: typeof body.date === 'string' ? body.date : null, rates: { USD: 1, ...Object.fromEntries(CURRENCIES.map(code => [code, given[code]])) } }
}

/**
 * @param {Object} [deps]
 * @param {Object} [deps.http] - { get(url, config) }, axios by default (it follows redirects)
 * @param {Function} [deps.now] - () => ms
 * @param {Object} [deps.logger]
 */
function createExchangeRates ({ http = axios, now = () => Date.now(), logger = console } = {}) {
  let kept = null // { day, data }

  /** @returns {Promise<Object>} found with { base, date, rates: { USD, BRL, EUR, GBP } }, or a failure of the source */
  async function today () {
    const day = dayOf(now())
    if (kept && kept.day === day) return success(kept.data)

    let response
    try {
      response = await http.get(RATES_URL, { timeout: REQUEST_TIMEOUT_MS, headers: { Accept: 'application/json' } })
    } catch (err) {
      const upstream = upstreamErrorFrom(err, SOURCE)
      logger.warn(`[ExchangeRates] the source failed: ${upstream.message}`)
      return failure(upstream.code)
    }
    const data = ratesOf(response && response.data)
    if (!data) {
      logger.warn('[ExchangeRates] the source answered something that is not the three rates')
      return failure('upstream_failed')
    }
    kept = { day, data }
    return success(data)
  }

  return { today }
}

module.exports = { createExchangeRates, RATES_URL }
