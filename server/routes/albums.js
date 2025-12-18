/**
 * Album Routes
 * Sprint 10 refactoring: Extracted from server/index.js
 * Handles /api/generate and /api/enrich-album endpoints
 */

const express = require('express')
const router = express.Router()

// Dependencies (will be injected via factory function)
let loadPrompts, renderPrompt, callProvider, extractAlbum
let validateAlbum, ajvAvailable
let getBestEverRanking, fetchRankingForAlbum
let consolidateRanking, normalizeRankingKey
let logger

/**
 * Initialize routes with dependencies
 * @param {Object} deps - Dependencies object
 */
function initAlbumRoutes(deps) {
    loadPrompts = deps.loadPrompts
    renderPrompt = deps.renderPrompt
    callProvider = deps.callProvider
    extractAlbum = deps.extractAlbum
    validateAlbum = deps.validateAlbum
    ajvAvailable = deps.ajvAvailable
    getBestEverRanking = deps.getBestEverRanking
    fetchRankingForAlbum = deps.fetchRankingForAlbum
    consolidateRanking = deps.consolidateRanking
    normalizeRankingKey = deps.normalizeRankingKey
    logger = deps.logger || console
}

/**
 * POST /api/enrich-album
 * Enriches album with BestEver rankings
 */
router.post('/enrich-album', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })

    const { albumData } = req.body
    if (!albumData || !albumData.title || !Array.isArray(albumData.tracks)) {
        return res.status(400).json({ error: 'Invalid albumData. Requires title and tracks array.' })
    }

    const artist = albumData.artist || ''
    const title = albumData.title
    const tracks = albumData.tracks

    // 1. Scrape BestEverAlbums for rankings
    let bestEver = null
    try {
        bestEver = await getBestEverRanking(title, artist)
    } catch (err) {
        console.warn(`[Enrichment] BestEver scraper failed for ${artist} - ${title}:`, err.message)
    }

    // 2. Map Scraped Ratings to Official Tracklist
    const ratingsMap = []

    if (bestEver && Array.isArray(bestEver.evidence) && bestEver.evidence.length > 0) {
        try {
            const normalizeKey = await normalizeRankingKey()

            // Index the evidence by normalized key
            const evidenceIndex = new Map()
            bestEver.evidence.forEach(e => {
                const trackTitle = e.trackTitle || e.title
                if (trackTitle && e.rating !== undefined && e.rating !== null) {
                    const key = normalizeKey(trackTitle)
                    console.log(`[Enrichment DEBUG] BestEver track: "${trackTitle}" -> key: "${key}" -> rating: ${e.rating}`)
                    if (key) evidenceIndex.set(key, e.rating)
                }
            })

            console.log(`[Enrichment DEBUG] Evidence index has ${evidenceIndex.size} entries:`, [...evidenceIndex.keys()])

            // Map to request tracks
            tracks.forEach(t => {
                const key = normalizeKey(t.title || t.name || '')
                console.log(`[Enrichment DEBUG] Apple track: "${t.title}" -> key: "${key}" -> hasMatch: ${evidenceIndex.has(key)}`)
                let rating = null
                if (key && evidenceIndex.has(key)) {
                    rating = Number(evidenceIndex.get(key))
                }
                ratingsMap.push({ title: t.title, rating })
            })

            console.log(`[Enrichment] Success for ${title}: Found ${evidenceIndex.size} ratings, matched ${ratingsMap.filter(r => r.rating !== null).length} tracks.`)

        } catch (e) {
            console.error('[Enrichment] Mapping failed:', e)
        }
    } else {
        console.warn(`[Enrichment] No ratings found for [${title}] by [${artist}]. Using original order.`)
        tracks.forEach(t => ratingsMap.push({ title: t.title, rating: null }))
    }

    return res.json({
        data: {
            bestEverInfo: bestEver ? {
                albumId: bestEver.albumId,
                url: bestEver.albumUrl || bestEver.referenceUrl,
                evidenceCount: bestEver.evidence?.length || 0
            } : null,
            trackRatings: ratingsMap
        }
    })
})

/**
 * POST /api/generate
 * Main album generation endpoint
 */
router.post('/generate', async (req, res) => {
    const AI_API_KEY = process.env.AI_API_KEY
    if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })

    const { albumQuery, model, maxTokens } = req.body
    if (!albumQuery) return res.status(400).json({ error: 'Missing albumQuery in request body' })

    try {
        const prompts = loadPrompts()
        const albumPrompt = renderPrompt(prompts.albumSearchPrompt, { albumQuery })
        const response = await callProvider({
            prompt: albumPrompt || undefined,
            albumQuery,
            model,
            maxTokens,
            aiEndpoint: process.env.AI_ENDPOINT,
            aiApiKey: AI_API_KEY,
            aiModelEnv: process.env.AI_MODEL
        })

        const latencyMs = Date.now() - (req._startTime || Date.now())
        const usedModel = (process.env.AI_MODEL || 'models/gemini-2.5-flash')
        console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`)

        if (response.data?.usageMetadata) {
            try {
                const u = response.data.usageMetadata
                console.log(`AI usage: promptTokens=${u.promptTokenCount || '-'} totalTokens=${u.totalTokenCount || '-'} thoughtsTokens=${u.thoughtsTokenCount || '-'} `)
            } catch (e) { /* ignore */ }
        }

        // Normalize
        try {
            const album = extractAlbum(response)
            if (album) {
                if (ajvAvailable && validateAlbum) {
                    const ok = validateAlbum(album)
                    if (!ok) {
                        console.warn('Album validation failed:', validateAlbum.errors)
                        return res.status(422).json({ error: 'Validation failed', validationErrors: validateAlbum.errors })
                    }
                }
                let rankingEntries = []
                let rankingSources = []
                let fetchDebug = null

                try {
                    if (req.body && req.body.rawStage === 'ranking') {
                        const rankingResult = await fetchRankingForAlbum(album, albumQuery, { raw: true })
                        return res.status(200).json({ rawRankingResponse: rankingResult.raw })
                    }
                    const rankingResult = await fetchRankingForAlbum(album, albumQuery)
                    fetchDebug = rankingResult.debugTrace
                    rankingEntries = rankingResult.entries
                    rankingSources = rankingResult.sources

                    let bestEver = rankingResult.bestEver
                    if (!bestEver) {
                        try {
                            const be = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
                            if (be && Array.isArray(be.evidence) && be.evidence.length > 0) {
                                bestEver = be
                                rankingSources = Array.isArray(rankingSources) ? rankingSources : []
                                if (!rankingSources.some(s => String(s.provider || '').toLowerCase() === 'besteveralbums')) {
                                    rankingSources.unshift({ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: be.referenceUrl || be.albumUrl || null })
                                }
                            }
                        } catch (e) {
                            logger && logger.warn && logger.warn('bestever_scraper_fallback_failed', { albumQuery, err: (e && e.message) || String(e) })
                        }
                    }
                    if (bestEver) {
                        album.bestEverEvidence = Array.isArray(bestEver.evidence) ? bestEver.evidence : []
                        album.bestEverUrl = bestEver.albumUrl || null
                        if (bestEver.albumId) album.bestEverAlbumId = String(bestEver.albumId)
                    }
                } catch (err) {
                    console.warn('Ranking fetch skipped:', err?.message || err)
                }

                const combinedSources = Array.isArray(album.rankingSources)
                    ? [...album.rankingSources, ...rankingSources]
                    : [...rankingSources]
                const albumPayload = {
                    ...album,
                    rankingSources: combinedSources
                }
                if (rankingEntries.length) albumPayload.rankingAcclaim = rankingEntries

                // Consolidate acclaim
                try {
                    const consolidated = await consolidateRanking(albumPayload.tracks || [], albumPayload.rankingAcclaim || [])
                    if (consolidated && consolidated.results) {
                        albumPayload.rankingConsolidated = consolidated.results
                        albumPayload.rankingConsolidatedMeta = {
                            ...consolidated.divergence,
                            debugInfo: consolidated.debugInfo,
                            rankingEntriesCount: rankingEntries ? rankingEntries.length : -1,
                            rankingEntriesSample: rankingEntries && rankingEntries.length ? rankingEntries[0] : null,
                            fetchRankingDebug: fetchDebug
                        }
                    } else {
                        albumPayload.rankingConsolidated = Array.isArray(consolidated) ? consolidated : []
                        albumPayload.rankingConsolidatedMeta = {}
                    }
                } catch (e) {
                    console.warn('Ranking consolidation failed:', e && e.message)
                    albumPayload.rankingConsolidated = []
                    albumPayload.rankingConsolidatedMeta = { error: e.message, stack: e.stack }
                }

                // Map ranks back to tracks
                try {
                    const normalizeKey = await normalizeRankingKey()

                    if (Array.isArray(albumPayload.rankingConsolidated) && Array.isArray(albumPayload.tracks)) {
                        const rankMap = new Map()
                        const ratingMap = new Map()
                        albumPayload.rankingConsolidated.forEach(r => {
                            if (r && r.trackTitle) {
                                const key = normalizeKey(r.trackTitle)
                                if (r.finalPosition !== undefined && r.finalPosition !== null) {
                                    rankMap.set(key, Number(r.finalPosition))
                                }
                                if (r.rating !== undefined && r.rating !== null) {
                                    ratingMap.set(key, Number(r.rating))
                                }
                            }
                        })

                        albumPayload.tracks.forEach(t => {
                            const key = normalizeKey((t && (t.title || t.trackTitle || t.name)) || '')
                            if (rankMap.has(key)) t.rank = rankMap.get(key)
                            if (ratingMap.has(key)) t.rating = ratingMap.get(key)
                        })
                    }
                } catch (e) {
                    logger && logger.warn && logger.warn('rank_mapping_failed', { err: (e && e.message) || String(e) })
                }

                // Create tracksByAcclaim sorted list
                try {
                    if (Array.isArray(albumPayload.tracks)) {
                        albumPayload.tracks.forEach((t, idx) => {
                            if (t && (t.rank === undefined || t.rank === null)) t.rank = idx + 1
                        })
                        albumPayload.tracksByAcclaim = Array.from(albumPayload.tracks).slice().sort((a, b) => {
                            const ra = (a && a.rank) || Number.POSITIVE_INFINITY
                            const rb = (b && b.rank) || Number.POSITIVE_INFINITY
                            return ra - rb
                        })
                    }
                } catch (e) {
                    logger && logger.warn && logger.warn('tracks_by_acclaim_failed', { err: (e && e.message) || String(e) })
                }
                return res.status(200).json({ data: albumPayload })
            }
        } catch (err) {
            console.warn('Normalization attempt failed, forwarding raw provider response', err?.message || err)
        }

        return res.status(response.status).json(response.data)
    } catch (err) {
        console.error('Error proxying to AI provider:', err?.response?.status, err?.response?.data || err.message || err)
        const status = err.response?.status || 500
        const data = err.response?.data || { error: 'AI provider error' }
        return res.status(status).json(data)
    }
})

module.exports = { router, initAlbumRoutes }
