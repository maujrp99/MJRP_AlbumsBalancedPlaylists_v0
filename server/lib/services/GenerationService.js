/**
 * GenerationService.js
 * 
 * Logic regarding album generation (AI Prompting, Parsing, Validation).
 * Extracted from server/routes/albums.js (Sprint 18).
 *
 * It returns a typed result (lib/outcome.js): the album as `found`, or a failure. What the paid
 * provider answered is turned into a failure by ONE table (lib/aiProviderOutcome.js); the
 * provider's own answer or message never leaves in the result (F52).
 */
const { success, failure } = require('../outcome')
const { providerFailure, failureFromProviderError, describeProviderError } = require('../aiProviderOutcome')

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

    /**
     * @returns {Promise<Object>} a result of lib/outcome.js; on success `data` is the album
     */
    async generateAlbum(reqBody, serverConfig) {
        const { albumQuery, model, maxTokens } = reqBody || {};
        const { processEnv } = serverConfig;

        // Nothing to look for: the paid provider is not called
        if (typeof albumQuery !== 'string' || !albumQuery.trim()) return failure('invalid_request')

        const prompts = this.loadPrompts()
        const albumPrompt = this.renderPrompt(prompts.albumSearchPrompt, { albumQuery })

        let response
        try {
            response = await this.callProvider({
                prompt: albumPrompt || undefined,
                albumQuery,
                model,
                maxTokens,
                aiEndpoint: processEnv.AI_ENDPOINT,
                aiApiKey: processEnv.AI_API_KEY,
                aiModelEnv: processEnv.AI_MODEL
            })
        } catch (err) {
            const failed = failureFromProviderError(err)
            if (!failed) throw err
            console.error(`AI provider failed for "${albumQuery}": ${describeProviderError(err)}`)
            return failed
        }

        // The provider answered and was paid for. Whatever stops the answer from becoming an album
        // is the "unusable" row of the table: a status no tab asks again for, and no raw answer out.
        try {
            const payload = await this._albumFromResponse(response, reqBody, serverConfig)
            return payload ? success(payload) : providerFailure('unusable')
        } catch (err) {
            console.error(`AI answer for "${albumQuery}" could not be read:`, err?.message || err)
            return providerFailure('unusable')
        }
    }

    /**
     * @returns {Promise<Object|null>} the album with its rankings, or null when the answer has no usable album
     * @private
     */
    async _albumFromResponse(response, reqBody, serverConfig) {
        const { albumQuery, rawStage } = reqBody;
        const { processEnv, allowRawStage } = serverConfig;
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
        const album = this.extractAlbum(response)
        if (album) {
            if (this.ajvAvailable && this.validateAlbum) {
                const ok = this.validateAlbum(album)
                if (!ok) {
                    console.warn('Album validation failed:', this.validateAlbum.errors)
                    return null
                }
            }
            let rankingEntries = []
            let rankingSources = []
            let fetchDebug = null

            try {
                if (rawStage === 'ranking' && allowRawStage) {
                    const rankingResult = await this.fetchRankingForAlbum(album, albumQuery, { raw: true })
                    return { rawRankingResponse: rankingResult.raw && rankingResult.raw.data }
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
            return albumPayload
        }

        console.warn(`AI answer for "${albumQuery}" has no album in it`)
        return null
    }
}

module.exports = GenerationService;
