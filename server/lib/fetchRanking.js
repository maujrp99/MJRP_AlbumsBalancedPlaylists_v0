const { loadPrompts, renderPrompt } = require('./prompts')
const { callProvider } = require('./aiClient')
const { extractAndValidateRankingEntries, rankingEntriesToSources } = require('./normalize')
const { getRankingForAlbum: getBestEverRanking } = require('./scrapers/besteveralbums')

// Musicboard scraper integration (Sprint 9)
const { getRankingForAlbum: getMusicboardRanking } = require('./scrapers/musicboard')

// Lazy load shared module (ESM)
let normalizeKeyFn = null
async function getNormalizeKey() {
    if (!normalizeKeyFn) {
        const mod = await import('../../shared/normalize.js')
        normalizeKeyFn = mod.normalizeKey
    }
    return normalizeKeyFn
}

const logger = (() => { try { return require('./logger') } catch (e) { return console } })()

/**
 * Normalize ratings from different sources to 0-100 scale
 * BestEverAlbums: 0-100 (no change)
 * Musicboard: 0-10 → multiply by 10
 * @param {number} rating - Raw rating from source
 * @param {string} source - Source provider name
 * @returns {number} Normalized rating (0-100)
function normalizeRating(rating, source) {
    if (rating === null || rating === undefined) return null
    const numRating = Number(rating)
    if (isNaN(numRating)) return null

    // NOTE: Musicboard scraper already converts 0-5 → 0-100 internally
    // So we don't need to re-normalize it here
    // All sources should return 0-100 scale

    return Math.min(100, Math.max(0, numRating))
}

/**
 * Merge evidence from multiple sources with source priority
 * Priority: 1. BestEver, 2. Musicboard, 3. Others
 * @param {Array} bestEverEvidence - Evidence from BestEverAlbums
 * @param {Array} musicboardEvidence - Evidence from Musicboard
 * @returns {Array} Merged evidence with best rating per track
 */
function mergeRankingEvidence(bestEverEvidence = [], musicboardEvidence = []) {
    const merged = new Map()

    // First, add all BestEver evidence (highest priority)
    for (const e of bestEverEvidence) {
        if (!e || !e.trackTitle) continue
        const key = String(e.trackTitle).toLowerCase().trim()
        merged.set(key, {
            ...e,
            rating: normalizeRating(e.rating, 'BestEverAlbums'),
            source: 'BestEverAlbums'
        })
    }

    // Then, fill gaps with Musicboard evidence
    for (const e of musicboardEvidence) {
        if (!e || !e.trackTitle) continue
        const key = String(e.trackTitle).toLowerCase().trim()
        if (!merged.has(key)) {
            merged.set(key, {
                ...e,
                rating: normalizeRating(e.rating, 'Musicboard'),
                source: 'Musicboard'
            })
        }
    }

    return Array.from(merged.values())
}

async function fetchRankingForAlbum(album, albumQuery, options = {}) {
    const debugTrace = []
    const normalizeKey = await getNormalizeKey()
    const prompts = loadPrompts()
    const template = prompts.rankingPrompt
    if (!template) return { entries: [], sources: [], debugTrace }

    const rankingProviders = Array.isArray(prompts.defaultRankingProviders)
        ? prompts.defaultRankingProviders
            .slice(0, 10)
            .map((p, i) => `${i + 1}. ${String(p).trim()}`)
            .join('\n')
        : ''

    const rankingPrompt = renderPrompt(template, {
        albumTitle: album.title || albumQuery,
        albumArtist: album.artist || '',
        albumYear: album.year || '',
        albumQuery,
        rankingProviders
    })

    if (!rankingPrompt) return { entries: [], sources: [], debugTrace }

    if (options && options.raw) {
        const rankingResponse = await callProvider({
            prompt: rankingPrompt,
            maxTokens: 2048,
            aiEndpoint: process.env.AI_ENDPOINT,
            aiApiKey: process.env.AI_API_KEY,
            aiModelEnv: process.env.AI_MODEL
        })
        return { raw: rankingResponse, debugTrace }
    }

    try {
        debugTrace.push({ step: 'getBestEverRanking', args: { title: album?.title || albumQuery, artist: album?.artist || '' } })
        const best = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
        debugTrace.push({ step: 'getBestEverRanking_result', found: !!best, evidenceCount: best?.evidence?.length, error: best?.error })

        if (best && Array.isArray(best.evidence) && best.evidence.length > 0) {
            const scraperEntries = best.evidence.map((e, idx) => ({
                provider: 'BestEverAlbums',
                trackTitle: e.trackTitle,
                position: idx + 1,
                rating: typeof e.rating === 'number' ? e.rating : (e.rating ? Number(e.rating) : null),
                referenceUrl: best.referenceUrl || best.albumUrl || null
            }))

            const albumTrackCount = Array.isArray(album && album.tracks) ? album.tracks.length : null
            debugTrace.push({ step: 'check_completeness', albumTrackCount, scraperEntriesCount: scraperEntries.length })

            // ==================================================================
            // MUSICBOARD FALLBACK (Sprint 9)
            // Try Musicboard when BestEver data is incomplete
            // ==================================================================
            let musicboardEvidence = []
            if (getMusicboardRanking && scraperEntries.length < (albumTrackCount || Infinity)) {
                try {
                    debugTrace.push({ step: 'getMusicboardRanking', reason: 'BestEver incomplete' })
                    const mbResult = await getMusicboardRanking(album?.title || albumQuery, album?.artist || '')
                    debugTrace.push({ step: 'getMusicboardRanking_result', found: !!mbResult, evidenceCount: mbResult?.evidence?.length, error: mbResult?.error })

                    if (mbResult && Array.isArray(mbResult.evidence) && mbResult.evidence.length > 0) {
                        musicboardEvidence = mbResult.evidence.map(e => ({
                            ...e,
                            rating: normalizeRating(e.rating, 'Musicboard'),
                            provider: 'Musicboard'
                        }))
                        logger.info('musicboard_fallback_used', { albumQuery, tracksFound: musicboardEvidence.length })
                    }
                } catch (mbErr) {
                    logger.warn('musicboard_fallback_failed', { albumQuery, err: mbErr?.message || String(mbErr) })
                    debugTrace.push({ step: 'musicboard_fallback_failed', error: mbErr?.message })
                }
            }
            // ==================================================================

            if (!albumTrackCount || scraperEntries.length >= albumTrackCount) {
                const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
                scraperEntries.sort((a, b) => {
                    if ((a.position || 0) && (b.position || 0)) return (a.position || 0) - (b.position || 0)
                    if ((a.rating || 0) && (b.rating || 0)) return (b.rating || 0) - (a.rating || 0)
                    return 0
                })
                return { entries: scraperEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence }, debugTrace }
            }

            try {
                debugTrace.push({ step: 'ai_enrichment_start' })
                const rankingResponse = await callProvider({
                    prompt: renderPrompt(loadPrompts().rankingPrompt, {
                        albumTitle: album.title || albumQuery,
                        albumArtist: album.artist || '',
                        albumYear: album.year || '',
                        albumQuery,
                        rankingProviders: ''
                    }),
                    maxTokens: 2048,
                    aiEndpoint: process.env.AI_ENDPOINT,
                    aiApiKey: process.env.AI_API_KEY,
                    aiModelEnv: process.env.AI_MODEL
                })
                let modelEntries = await extractAndValidateRankingEntries(rankingResponse)
                debugTrace.push({ step: 'ai_enrichment_result', modelEntriesCount: modelEntries.length })

                const mergedByTitle = new Map()
                const modelIndex = new Map()
                modelEntries.forEach(me => {
                    if (me && me.trackTitle) modelIndex.set(normalizeKey(me.trackTitle), me)
                })

                scraperEntries.forEach(se => {
                    if (se && se.trackTitle) mergedByTitle.set(normalizeKey(se.trackTitle), se)
                })

                if (Array.isArray(album && album.tracks)) {
                    album.tracks.forEach((t, idx) => {
                        const key = normalizeKey((t && (t.title || t.trackTitle || t.name)) || '')
                        if (!key) return
                        if (!mergedByTitle.has(key)) {
                            const candidate = modelIndex.get(key)
                            if (candidate) mergedByTitle.set(key, candidate)
                        }
                    })
                }

                if (mergedByTitle.size < (albumTrackCount || 0)) {
                    for (const me of modelEntries) {
                        const k = me && me.trackTitle ? normalizeKey(me.trackTitle) : null
                        if (!k) continue
                        if (!mergedByTitle.has(k)) mergedByTitle.set(k, me)
                        if (mergedByTitle.size >= (albumTrackCount || Infinity)) break
                    }
                }

                const finalEntries = []
                if (Array.isArray(album && album.tracks)) {
                    album.tracks.forEach((t, idx) => {
                        const k = normalizeKey((t && (t.title || t.trackTitle || t.name)) || '')
                        const found = k ? mergedByTitle.get(k) : null
                        if (found) {
                            const pos = found.position || (idx + 1)
                            finalEntries.push({ provider: found.provider || 'Model', trackTitle: found.trackTitle || t.title || t.trackTitle, position: pos, rating: found.rating || null, referenceUrl: found.referenceUrl || null })
                        }
                    })
                }

                if (finalEntries.length < (albumTrackCount || 0)) {
                    let i = finalEntries.length + 1
                    for (const v of mergedByTitle.values()) {
                        const k = v && v.trackTitle ? normalizeKey(v.trackTitle) : null
                        if (k && !finalEntries.some(fe => normalizeKey(fe.trackTitle) === k)) {
                            finalEntries.push({ provider: v.provider || 'Model', trackTitle: v.trackTitle, position: v.position || i, rating: v.rating || null, referenceUrl: v.referenceUrl || null })
                            i++
                        }
                        if (finalEntries.length >= (albumTrackCount || Infinity)) break
                    }
                }

                finalEntries.sort((a, b) => {
                    if ((a.position || 0) && (b.position || 0) && (a.position !== b.position)) return (a.position || 0) - (b.position || 0)
                    if ((a.rating || 0) && (b.rating || 0) && (a.rating !== b.rating)) return (b.rating || 0) - (a.rating || 0)
                    return 0
                })

                const modelSources = rankingEntriesToSources(modelEntries || [])
                const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
                for (const s of (modelSources || [])) {
                    if (sources.length >= 4) break
                    if (!sources.some(existing => String(existing.provider).toLowerCase() === String(s.provider || '').toLowerCase())) sources.push(s)
                }

                return { entries: finalEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence }, debugTrace }
            } catch (e) {
                logger.warn('model_enrichment_failed', { albumQuery, err: (e && e.message) || String(e) })
                debugTrace.push({ step: 'model_enrichment_failed', error: e.message })
                const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
                return { entries: scraperEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence }, debugTrace }
            }
        }
    } catch (err) {
        logger.warn('bestever_scraper_failed', { albumQuery, err: (err && err.message) || String(err) })
        debugTrace.push({ step: 'bestever_scraper_failed', error: err.message })
    }

    const rankingResponse = await callProvider({
        prompt: rankingPrompt,
        maxTokens: 2048,
        aiEndpoint: process.env.AI_ENDPOINT,
        aiApiKey: process.env.AI_API_KEY,
        aiModelEnv: process.env.AI_MODEL
    })

    try {
        const respData = rankingResponse && rankingResponse.data
        const finishReason = (respData?.candidates && respData.candidates[0] && respData.candidates[0].metadata && respData.candidates[0].metadata.finishReason) || respData?.finish_reason || (respData?.choices && respData.choices[0] && respData.choices[0].finish_reason)
        if (finishReason && String(finishReason).toUpperCase().includes('MAX_TOKENS')) {
            logger.info('model_truncation_detected', { albumQuery, finishReason })
        }
    } catch (e) { }

    let entries = await extractAndValidateRankingEntries(rankingResponse)
    const sources = rankingEntriesToSources(entries)
    return { entries, sources, debugTrace }
}

module.exports = { fetchRankingForAlbum }
