/**
 * Debug Routes
 * Sprint 10 refactoring: Extracted from server/index.js
 * Handles debug and development endpoints
 */

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// Dependencies (will be injected via factory function)
let loadPrompts, renderPrompt, callProvider, extractAlbum
let getBestEverRanking, fetchRankingForAlbum

/**
 * Initialize routes with dependencies
 * @param {Object} deps - Dependencies object
 */
function initDebugRoutes(deps) {
    loadPrompts = deps.loadPrompts
    renderPrompt = deps.renderPrompt
    callProvider = deps.callProvider
    extractAlbum = deps.extractAlbum
    getBestEverRanking = deps.getBestEverRanking
    fetchRankingForAlbum = deps.fetchRankingForAlbum
}

/**
 * GET /api/list-models
 * List available AI models
 */
router.get('/list-models', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })
    try {
        const listUrl = 'https://generativelanguage.googleapis.com/v1/models?key=' + encodeURIComponent(AI_API_KEY)
        const resp = await axios.get(listUrl, { timeout: 10_000 })
        return res.status(resp.status).json(resp.data)
    } catch (err) {
        console.error('Error listing models:', err?.response?.status, err?.response?.data || err.message || err)
        const status = err.response?.status || 500
        const data = err.response?.data || { error: 'Could not list models' }
        return res.status(status).json(data)
    }
})

/**
 * POST /api/debug/raw-ranking
 * Return raw provider response for ranking prompt
 */
router.post('/debug/raw-ranking', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })
    const { albumQuery, model, maxTokens } = req.body
    if (!albumQuery) return res.status(400).json({ error: 'Missing albumQuery in request body' })
    try {
        const prompts = loadPrompts()
        const albumPrompt = renderPrompt(prompts.albumSearchPrompt, { albumQuery })
        const albumResp = await callProvider({
            prompt: albumPrompt || undefined,
            albumQuery,
            model,
            maxTokens,
            aiEndpoint: process.env.AI_ENDPOINT,
            aiApiKey: AI_API_KEY,
            aiModelEnv: process.env.AI_MODEL
        })

        let album = null
        try { album = extractAlbum(albumResp) } catch (e) { /* ignore */ }
        const rankingResult = await fetchRankingForAlbum(album || { title: albumQuery, artist: '', year: '' }, albumQuery, { raw: true })

        let bestEver = null
        try {
            bestEver = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
        } catch (e) {
            console.warn('BestEverAlbums scraper failed:', e && e.message)
        }

        const safeAlbumResp = albumResp && albumResp.data ? albumResp.data : null
        const safeRankingResp = rankingResult && rankingResult.raw && rankingResult.raw.data ? rankingResult.raw.data : null
        return res.status(200).json({ albumResponse: safeAlbumResp, rawRankingResponse: safeRankingResp, bestEverEvidence: bestEver })

    } catch (err) {
        console.error('Error fetching raw ranking:', err?.message || err)
        const status = err.response?.status || 500
        const data = err.response?.data || { error: 'Could not fetch raw ranking', details: err.message, stack: err.stack }
        return res.status(status).json(data)
    }
})

/**
 * GET /api/debug/files
 * List files to verify container structure
 */
router.get('/debug/files', (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured' })
    try {
        const targetPath = req.query.path ? path.resolve(req.query.path) : path.resolve(__dirname, '..')

        const listDir = (dir) => {
            try {
                return fs.readdirSync(dir).map(f => {
                    const stat = fs.statSync(path.join(dir, f))
                    return { name: f, isDir: stat.isDirectory(), size: stat.size }
                })
            } catch (e) { return e.message }
        }

        res.json({
            cwd: process.cwd(),
            dirname: __dirname,
            targetPath,
            contents: listDir(targetPath)
        })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

/**
 * GET /api/debug/import
 * Test import and normalization
 */
router.get('/debug/import', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured' })
    try {
        const mod = await import('../../shared/normalize.js')
        const input = req.query.input
        const normalized = input ? mod.normalizeKey(input) : null
        res.json({ ok: true, exports: Object.keys(mod), input, normalized })
    } catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack })
    }
})

module.exports = { router, initDebugRoutes }
