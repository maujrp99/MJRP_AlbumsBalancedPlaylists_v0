/**
 * EnrichmentService.js
 *
 * Track ratings of an album, from BestEverAlbums (the scraper is injected).
 *
 * It returns a typed result (lib/outcome.js), never a swallowed failure (F52):
 *   found       the source has the album and at least one rating matched a track asked for
 *   not_found   the source answered every search and has no page for the album
 *   no_ratings  the source has the page, with no rating for the tracks asked for
 *   failure     the request was unusable (invalid_request) or the source could not answer
 *               (upstream_failed, upstream_timeout, upstream_busy)
 * Anything else that breaks here is thrown: the route's error path answers `internal`.
 */
const { OUTCOMES, success, failure, UpstreamError } = require('../outcome')
const { toFuzzyCore } = require('../normalize')

const titleOf = (track) => (track && (track.title || track.name)) || ''

class EnrichmentService {
    constructor(deps) {
        this.getBestEverRanking = deps.getBestEverRanking;
        this.normalizeRankingKey = deps.normalizeRankingKey;
        this.logger = deps.logger || console;
    }

    /**
     * @param {Object} albumData - { artist, title, tracks }
     * @returns {Promise<Object>} a result of lib/outcome.js; on success `data` is
     *          { bestEverInfo, trackRatings, trackEvidence }
     */
    async enrichAlbum(albumData) {
        if (!albumData || !albumData.title || !Array.isArray(albumData.tracks)) {
            return failure('invalid_request')
        }
        const artist = albumData.artist || ''
        const { title, tracks } = albumData

        let page
        try {
            page = await this.getBestEverRanking(title, artist)
        } catch (err) {
            if (!(err instanceof UpstreamError)) throw err
            this.logger.warn(`[Enrichment] the source failed for ${artist} - ${title}: ${err.message}`)
            return failure(err.code)
        }

        if (!page) {
            this.logger.info(`[Enrichment] no page for [${title}] by [${artist}].`)
            return success(this._data(null, tracks.map(track => this._unrated(track))), OUTCOMES.NOT_FOUND)
        }

        const matched = await this._matchRatings(page, tracks)
        const ratedCount = matched.filter(entry => entry.rating !== null).length
        this.logger.info(`[Enrichment] ${title}: ${(page.evidence || []).length} rankings on the page, ${ratedCount} matched.`)
        return success(this._data(page, matched), ratedCount > 0 ? OUTCOMES.FOUND : OUTCOMES.NO_RATINGS)
    }

    _unrated(track) {
        return { title: titleOf(track), rating: null, evidence: [] }
    }

    /**
     * Each track asked for with the rating the page has for it, or null: by the ranking key first,
     * then by the fuzzy core of the title (the two passes this service always made).
     */
    async _matchRatings(page, tracks) {
        const evidence = Array.isArray(page.evidence) ? page.evidence : []
        const rated = evidence.filter(e => e && e.rating !== undefined && e.rating !== null)
        if (rated.length === 0) return tracks.map(track => this._unrated(track))

        const normalizeKey = await this.normalizeRankingKey()
        const byKey = new Map()
        rated.forEach(e => {
            const key = normalizeKey(e.trackTitle || e.title)
            if (key) byKey.set(key, e)
        })
        const url = page.albumUrl || page.referenceUrl

        return tracks.map(track => {
            const title = titleOf(track)
            const key = normalizeKey(title)
            const fuzzy = toFuzzyCore(title)
            const match = (key && byKey.get(key)) ||
                evidence.find(e => e && toFuzzyCore(e.trackTitle || e.title) === fuzzy)
            if (!match || match.rating === null || match.rating === undefined) return this._unrated(track)

            const rating = Number(match.rating)
            return { title, rating, evidence: [{ source: 'BestEverAlbums', score: rating, votes: null, url }] }
        })
    }

    _data(page, matched) {
        return {
            bestEverInfo: page ? {
                albumId: page.albumId,
                url: page.albumUrl || page.referenceUrl,
                evidenceCount: Array.isArray(page.evidence) ? page.evidence.length : 0
            } : null,
            trackRatings: matched.map(({ title, rating }) => ({ title, rating })),
            trackEvidence: matched.map(({ title, evidence }) => ({ title, evidence }))
        }
    }
}

module.exports = EnrichmentService;
