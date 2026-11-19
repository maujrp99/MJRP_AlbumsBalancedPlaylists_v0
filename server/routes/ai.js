const express = require('express')
const router = express.Router()
const { callProvider } = require('../lib/aiClient')
const { asyncRoute } = require('../lib/asyncRoute')
const { createAiHandlers } = require('./handlers/ai')

const handlers = createAiHandlers({ callProvider })

// POST /api/ai/studio-albums
// Body: { artistName: string }
router.post('/studio-albums', asyncRoute(handlers.studioAlbums))

module.exports = router
