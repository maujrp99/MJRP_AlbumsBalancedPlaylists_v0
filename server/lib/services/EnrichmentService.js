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
        const evidenceMap = [] // Sprint 23: Evidence Container

        if (bestEver && Array.isArray(bestEver.evidence) && bestEver.evidence.length > 0) {
            try {
                const normalizeKey = await this.normalizeRankingKey()

                // 1. Index evidence by normalized key
                const evidenceIndex = new Map()
                bestEver.evidence.forEach(e => {
                    const trackTitle = e.trackTitle || e.title
                    if (trackTitle && e.rating !== undefined && e.rating !== null) {
                        const key = normalizeKey(trackTitle)
                        if (key) evidenceIndex.set(key, e) // Store WHOLE object for evidence extraction
                    }
                })

                // 2. Map to request tracks (Two-Pass Match)
                const { toFuzzyCore } = require('../normalize')

                tracks.forEach(t => {
                    const title = t.title || t.name || ''
                    const standardKey = normalizeKey(title)
                    let rating = null
                    let match = null

                    // DEBUG: 72 Seasons logging (removed for clean prod code, but keeping logic)

                    // Pass 1: Standard Match
                    if (standardKey && evidenceIndex.has(standardKey)) {
                        match = evidenceIndex.get(standardKey)
                        if (match && match.rating !== null) rating = Number(match.rating)
                    }
                    // Pass 2: Fuzzy/Edge Case Match
                    else {
                        const fuzzyKey = toFuzzyCore(title)
                        match = bestEver.evidence.find(e => toFuzzyCore(e.trackTitle || e.title) === fuzzyKey)
                        if (match && match.rating !== null) {
                            rating = Number(match.rating)
                        }
                    }

                    ratingsMap.push({ title, rating })

                    // Sprint 23: Populate Evidence
                    const trackEvidence = []
                    if (match && rating !== null) {
                        trackEvidence.push({
                            source: 'BestEverAlbums',
                            score: rating,
                            votes: null,
                            url: bestEver.albumUrl || bestEver.referenceUrl
                        })
                    }
                    evidenceMap.push({ title, evidence: trackEvidence })
                })

                console.log(`[Enrichment] Success for ${title}: Found ${bestEver.evidence.length} rankings, matched ${ratingsMap.filter(r => r.rating !== null).length} tracks.`)

            } catch (e) {
                console.error('[Enrichment] Mapping failed:', e)
            }
        } else {
            console.warn(`[Enrichment] No ratings found for [${title}] by [${artist}]. Using original order.`)
            tracks.forEach(t => {
                ratingsMap.push({ title: t.title, rating: null })
                evidenceMap.push({ title: t.title, evidence: [] })
            })
        }



        // Re-construct evidence map if we didn't enter the block above (fallback)
        // Actually, let's make sure 'evidenceMap' is available in scope or handle it in return.
        // Quick fix: define evidenceMap outside or map it from ratingsMap if needed (but we want provenance).
        // Better: let's do a cleaner return construction.

        // RE-RUNNING THE ABOVE LOGIC CLEANLY for evidenceMap constant scope issue? 
        // I'll just rely on the fact that I'm inside the try block for the main mapped data. 
        // But wait, if bestEver is null, I need fallback.

        return {
            data: {
                bestEverInfo: bestEver ? {
                    albumId: bestEver.albumId,
                    url: bestEver.albumUrl || bestEver.referenceUrl,
                    evidenceCount: bestEver.evidence?.length || 0
                } : null,
                trackRatings: ratingsMap,
                // NEW: Consolidated Evidence for Sprint 23
                trackEvidence: (typeof evidenceMap !== 'undefined') ? evidenceMap : []
            }
        }
    }
}

module.exports = EnrichmentService;
