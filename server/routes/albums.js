/**
 * Album Routes
 * Sprint 18: Refactored to "Thin Route" pattern using Services.
 * Handles /api/generate and /api/enrich-album endpoints
 */

const express = require('express')
const { asyncRoute } = require('../lib/asyncRoute')
const { debugRoutesEnabled } = require('../lib/debugGate')
const router = express.Router()

// Service Classes
const EnrichmentService = require('../lib/services/EnrichmentService')
const GenerationService = require('../lib/services/GenerationService')

let enrichmentService
let generationService

/**
 * Initialize routes with dependencies
 * @param {Object} deps - Dependencies object
 */
function initAlbumRoutes(deps) {
    // Instantiate Services with dependencies
    enrichmentService = new EnrichmentService(deps)
    generationService = new GenerationService(deps)
}

/**
 * POST /api/enrich-album
 * Enriches album with BestEver rankings
 */
router.post('/enrich-album', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })

    try {
        const result = await enrichmentService.enrichAlbum(req.body.albumData)
        return res.json(result)
    } catch (err) {
        // Simple error handling for route-level issues
        const status = err.message.includes('Invalid') ? 400 : 500
        return res.status(status).json({ error: err.message })
    }
})

/**
 * POST /api/generate
 * Main album generation endpoint
 */
router.post('/generate', asyncRoute(async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })

    const serverConfig = {
        processEnv: process.env,
        startTime: req._startTime,
        // The raw stage shows the provider's answer as it came: a debug feature (F59)
        allowRawStage: debugRoutesEnabled(process.env)
    }

    const result = await generationService.generateAlbum(req.body || {}, serverConfig)
    return res.status(result.status).json(result.data)
}))

module.exports = { router, initAlbumRoutes }
