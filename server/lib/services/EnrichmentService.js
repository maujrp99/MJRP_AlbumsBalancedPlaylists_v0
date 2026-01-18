/**
 * EnrichmentService.js
 * 
 * Logic regarding album enrichment (Rankings, BestEverAlbums scraping).
 * Extracted from server/routes/albums.js (Sprint 18).
 */
class EnrichmentService {
    constructor(deps) {
        this.getBestEverRanking = deps.getBestEverRanking;
        this.normalizeRankingKey = deps.normalizeRankingKey;
    }

    /**
     * Enriches album data with rankings from BestEverAlbums.
     * @param {Object} albumData - { artist, title, tracks }
     * @returns {Object} { data: { bestEverInfo, trackRatings } }
     */
    async enrichAlbum(albumData) {
        if (!albumData || !albumData.title || !Array.isArray(albumData.tracks)) {
            throw new Error('Invalid albumData. Requires title and tracks array.')
        }

        const artist = albumData.artist || ''
        const title = albumData.title
        const tracks = albumData.tracks

        // 1. Scrape BestEverAlbums for rankings
        let bestEver = null
        try {
            bestEver = await this.getBestEverRanking(title, artist)
        } catch (err) {
            console.warn(`[Enrichment] BestEver scraper failed for ${artist} - ${title}:`, err.message)
        }

        // 2. Map Scraped Ratings to Official Tracklist
        const ratingsMap = []

        if (bestEver && Array.isArray(bestEver.evidence) && bestEver.evidence.length > 0) {
            try {
                const normalizeKey = await this.normalizeRankingKey()

                // 1. Index evidence by normalized key
                const evidenceIndex = new Map()
                bestEver.evidence.forEach(e => {
                    const trackTitle = e.trackTitle || e.title
                    if (trackTitle && e.rating !== undefined && e.rating !== null) {
                        const key = normalizeKey(trackTitle)
                        if (key) evidenceIndex.set(key, e.rating)
                    }
                })

                // 2. Map to request tracks (Two-Pass Match)
                const { toFuzzyCore } = require('../normalize')

                tracks.forEach(t => {
                    const title = t.title || t.name || ''
                    const standardKey = normalizeKey(title)
                    let rating = null

                    // Pass 1: Standard Match
                    if (standardKey && evidenceIndex.has(standardKey)) {
                        const r = evidenceIndex.get(standardKey)
                        if (r !== null && r !== undefined) rating = Number(r)
                    }
                    // Pass 2: Fuzzy/Edge Case Match
                    else {
                        const fuzzyKey = toFuzzyCore(title)
                        // Try matching against fuzzy keys of evidence
                        for (const e of bestEver.evidence) {
                            if (toFuzzyCore(e.trackTitle || e.title) === fuzzyKey) {
                                if (e.rating !== null && e.rating !== undefined) {
                                    rating = Number(e.rating)
                                }
                                break
                            }
                        }
                    }
                    ratingsMap.push({ title, rating })
                })

                console.log(`[Enrichment] Success for ${title}: Found ${bestEver.evidence.length} rankings, matched ${ratingsMap.filter(r => r.rating !== null).length} tracks.`)

            } catch (e) {
                console.error('[Enrichment] Mapping failed:', e)
            }
        } else {
            console.warn(`[Enrichment] No ratings found for [${title}] by [${artist}]. Using original order.`)
            tracks.forEach(t => ratingsMap.push({ title: t.title, rating: null }))
        }

        return {
            data: {
                bestEverInfo: bestEver ? {
                    albumId: bestEver.albumId,
                    url: bestEver.albumUrl || bestEver.referenceUrl,
                    evidenceCount: bestEver.evidence?.length || 0
                } : null,
                trackRatings: ratingsMap
            }
        }
    }
}

module.exports = EnrichmentService;
