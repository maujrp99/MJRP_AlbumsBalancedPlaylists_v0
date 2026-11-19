/**
 * Album Routes
 * Sprint 18: Refactored to "Thin Route" pattern using Services.
 * Handles /api/generate and /api/enrich-album endpoints.
 * The handlers live in routes/handlers/albums.js; every answer is built by lib/outcome.js (F52).
 */

const express = require('express')
const { asyncRoute } = require('../lib/asyncRoute')
const { createAlbumHandlers } = require('./handlers/albums')
const router = express.Router()

// Service Classes
const EnrichmentService = require('../lib/services/EnrichmentService')
const GenerationService = require('../lib/services/GenerationService')

let handlers

/**
 * Initialize routes with dependencies
 * @param {Object} deps - Dependencies object
 */
function initAlbumRoutes(deps) {
    handlers = createAlbumHandlers({
        enrichmentService: new EnrichmentService(deps),
        generationService: new GenerationService(deps),
        logger: deps.logger
    })
}

/** POST /api/enrich-album - track ratings from BestEverAlbums */
router.post('/enrich-album', asyncRoute((req, res) => handlers.enrichAlbum(req, res)))

/** POST /api/generate - main album generation endpoint (paid AI) */
router.post('/generate', asyncRoute((req, res) => handlers.generate(req, res)))

module.exports = { router, initAlbumRoutes }
