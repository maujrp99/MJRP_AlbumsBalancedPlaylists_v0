/**
 * GenerationService.js
 * 
 * Logic regarding album generation (AI Prompting, Parsing, Validation).
 * Extracted from server/routes/albums.js (Sprint 18).
 */
class GenerationService {
    constructor(deps) {
        this.loadPrompts = deps.loadPrompts;
        this.renderPrompt = deps.renderPrompt;
        this.callProvider = deps.callProvider;
        this.extractAlbum = deps.extractAlbum;
        this.validateAlbum = deps.validateAlbum;
        this.ajvAvailable = deps.ajvAvailable;
        this.getBestEverRanking = deps.getBestEverRanking;
        this.fetchRankingForAlbum = deps.fetchRankingForAlbum;
        this.consolidateRanking = deps.consolidateRanking;
        this.normalizeRankingKey = deps.normalizeRankingKey;
        this.logger = deps.logger || console;
    }

    async generateAlbum(reqBody, serverConfig) {
        const { albumQuery, model, maxTokens, rawStage } = reqBody;
        const { processEnv } = serverConfig;

        const AI_API_KEY = processEnv.AI_API_KEY;

        try {
            const prompts = this.loadPrompts()
            const albumPrompt = this.renderPrompt(prompts.albumSearchPrompt, { albumQuery })
            const response = await this.callProvider({
                prompt: albumPrompt || undefined,
                albumQuery,
                model,
                maxTokens,
                aiEndpoint: processEnv.AI_ENDPOINT,
                aiApiKey: AI_API_KEY,
                aiModelEnv: processEnv.AI_MODEL
            })

            const latencyMs = Date.now() - (serverConfig.startTime || Date.now())
            const usedModel = (processEnv.AI_MODEL || 'models/gemini-2.5-flash')
            console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`)

            if (response.data?.usageMetadata) {
                try {
                    const u = response.data.usageMetadata
                    console.log(`AI usage: promptTokens=${u.promptTokenCount || '-'} totalTokens=${u.totalTokenCount || '-'} thoughtsTokens=${u.thoughtsTokenCount || '-'} `)
                } catch (e) { /* ignore */ }
            }

            // Normalize
            try {
                const album = this.extractAlbum(response)
                if (album) {
                    if (this.ajvAvailable && this.validateAlbum) {
                        const ok = this.validateAlbum(album)
                        if (!ok) {
                            console.warn('Album validation failed:', this.validateAlbum.errors)
                            return {
                                status: 422,
                                data: { error: 'Validation failed', validationErrors: this.validateAlbum.errors }
                            }
                        }
                    }
                    let rankingEntries = []
                    let rankingSources = []
                    let fetchDebug = null

                    try {
                        if (rawStage === 'ranking') {
                            const rankingResult = await this.fetchRankingForAlbum(album, albumQuery, { raw: true })
                            return { status: 200, data: { rawRankingResponse: rankingResult.raw } }
                        }
                        const rankingResult = await this.fetchRankingForAlbum(album, albumQuery)
                        fetchDebug = rankingResult.debugTrace
                        rankingEntries = rankingResult.entries
                        rankingSources = rankingResult.sources

                        let bestEver = rankingResult.bestEver
                        if (!bestEver) {
                            try {
                                const be = await this.getBestEverRanking(album?.title || albumQuery, album?.artist || '')
                                if (be && Array.isArray(be.evidence) && be.evidence.length > 0) {
                                    bestEver = be
                                    rankingSources = Array.isArray(rankingSources) ? rankingSources : []
                                    if (!rankingSources.some(s => String(s.provider || '').toLowerCase() === 'besteveralbums')) {
                                        rankingSources.unshift({ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: be.referenceUrl || be.albumUrl || null })
                                    }
                                }
                            } catch (e) {
                                this.logger && this.logger.warn && this.logger.warn('bestever_scraper_fallback_failed', { albumQuery, err: (e && e.message) || String(e) })
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
                        const consolidated = await this.consolidateRanking(albumPayload.tracks || [], albumPayload.rankingAcclaim || [])
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
                        const normalizeKey = await this.normalizeRankingKey()

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
                        this.logger && this.logger.warn && this.logger.warn('rank_mapping_failed', { err: (e && e.message) || String(e) })
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
                        this.logger && this.logger.warn && this.logger.warn('tracks_by_acclaim_failed', { err: (e && e.message) || String(e) })
                    }
                    return { status: 200, data: { data: albumPayload } }
                }
            } catch (err) {
                console.warn('Normalization attempt failed, forwarding raw provider response', err?.message || err)
            }

            return { status: response.status, data: response.data }

        } catch (err) {
            console.error('Error proxying to AI provider:', err?.response?.status, err?.response?.data || err.message || err)
            const status = err.response?.status || 500
            const data = err.response?.data || { error: 'AI provider error' }
            return { status, data }
        }
    }
}

module.exports = GenerationService;
