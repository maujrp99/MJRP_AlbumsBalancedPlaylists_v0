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
    logger
  })
}

/** POST /api/admin/translate - one text of the site into the other language (the administrator) */
router.post('/admin/translate', asyncRoute((req, res) => handlers.translate(req, res)))

module.exports = { router, initAdminRoutes }
