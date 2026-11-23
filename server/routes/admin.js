/**
 * Admin Routes (F82): what the Painel (the CMS) asks of this server. Thin routes: the handlers live
 * in routes/handlers/admin.js and every answer is built by lib/outcome.js. The door (the
 * administrator only) and the limit are mounted in index.js, on `/api/admin` (lib/auth/guards.js).
 */
const express = require('express')
const { asyncRoute } = require('../lib/asyncRoute')
const { createAdminHandlers } = require('./handlers/admin')
const { createTranslateService } = require('../lib/services/translateService')
const { createClaudeTranslator } = require('../lib/translation/claudeTranslator')
const { createAppleAlbumService } = require('../lib/services/appleAlbumService')
const { createAppleCatalog } = require('../lib/appleMusic/catalogClient')

const router = express.Router()

let handlers

/**
 * @param {Object} deps
 * @param {Object} [deps.logger]
 * @param {Object} [deps.env] - the environment (ANTHROPIC_API_KEY, TRANSLATE_MODEL)
 */
function initAdminRoutes ({ logger = console, env = process.env } = {}) {
  handlers = createAdminHandlers({
    translateService: createTranslateService({ translator: createClaudeTranslator({ env, logger }) }),
    appleAlbumService: createAppleAlbumService({ catalog: createAppleCatalog({ logger }) }),
    logger
  })
}

/** POST /api/admin/translate - one text of the site into the other language (the administrator) */
router.post('/admin/translate', asyncRoute((req, res) => handlers.translate(req, res)))

/** POST /api/admin/apple-albums - the albums of Apple Music's catalogue for a search or an album's link (the administrator) */
router.post('/admin/apple-albums', asyncRoute((req, res) => handlers.appleAlbums(req, res)))

module.exports = { router, initAdminRoutes }
