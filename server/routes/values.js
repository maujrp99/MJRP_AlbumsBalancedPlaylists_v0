/**
 * Value Routes (F75): what an album of the inventory is worth, and the rates to show it in
 * another currency. Thin routes: the handlers live in routes/handlers/values.js and every answer
 * is built by lib/outcome.js.
 */
const express = require('express')
const { asyncRoute } = require('../lib/asyncRoute')
const { createValueHandlers } = require('./handlers/values')
const { createValueService } = require('../lib/services/valueService')
const { createExchangeRates } = require('../lib/services/exchangeRates')
const { createDiscogsSource } = require('../lib/valueSources/discogsSource')
const { createCmsSwitches } = require('../lib/valueSources/cmsSwitches')

const router = express.Router()

let handlers

/**
 * @param {Object} deps
 * @param {Object} [deps.logger]
 */
function initValueRoutes ({ logger = console } = {}) {
  handlers = createValueHandlers({
    valueService: createValueService({ source: createDiscogsSource({ logger }), switches: createCmsSwitches({ logger }), logger }),
    exchangeRates: createExchangeRates({ logger }),
    logger
  })
}

/** POST /api/album-value - the Discogs value of one album (a person with an account) */
router.post('/album-value', asyncRoute((req, res) => handlers.albumValue(req, res)))

/** GET /api/value-sources - the switch of the Discogs values (on, off or unknown), for who asks */
router.get('/value-sources', asyncRoute((req, res) => handlers.valueSources(req, res)))

/** GET /api/exchange-rates - the rates of the day from USD to BRL, EUR and GBP */
router.get('/exchange-rates', asyncRoute((req, res) => handlers.exchangeRates(req, res)))

module.exports = { router, initValueRoutes }
