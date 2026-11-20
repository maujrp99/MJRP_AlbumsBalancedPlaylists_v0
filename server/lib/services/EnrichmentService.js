/**
 * EnrichmentService.js
 *
 * Track ratings of an album, from BestEverAlbums (the scraper is injected).
 *
 * It returns a typed result (lib/outcome.js), never a swallowed failure (F52):
 *   found       the source has the album and at least one rating is of a track asked for
 *   not_found   the source answered every search and has no page for the album
 *   no_ratings  the source has the page, with no rating for the tracks asked for
 *   failure     the request was unusable (invalid_request) or the source could not answer
 *               (upstream_failed, upstream_timeout, upstream_busy)
 * Anything else that breaks here is thrown: the route's error path answers `internal`.
 *
 * Time and pace (F52, slice 3):
 *   - one album request has ALBUM_BUDGET_MS in all, less than the time the app waits for the
 *     ratings (20 s, LOAD_LIMITS.enrichTimeoutMs in the app). At the deadline the answer is
 *     `upstream_timeout`, whatever the source is doing;
 *   - identical requests at the same time (same artist and title) share ONE search of the source
 *     (lib/inFlight.js); each still gets the ratings of its own tracks. Nothing is remembered
 *     after the search ends: there is no cache here.
 * A `not_found` is decided by the identity rule (shared/albumIdentity.js), and the rule changes: its
 * data carries `identityRule`, the version of the rule that decided it, so the app does not keep
 * believing a "no page" of an older rule (F68).
 * Which track a rating is of is decided by the track rule (shared/trackIdentity.js, F74), one
 * rating to one track; `found` and `no_ratings` carry `trackRule`, the version of the rule that
 * decided, so the app asks again for the ratings an older rule spread (an extra track with the
 * rating of the original). The tracks asked for go to the scraper too: they choose the page when
 * the source has two editions under one name.
 * Every result carries `trace` ({ how: 'source' | 'joined', sourceRequests }) for the log of the
 * route; it does not go on the wire.
 */
const { OUTCOMES, success, failure, UpstreamError } = require('../outcome')
const { createInFlight } = require('../inFlight')
const { createBudget } = require('../timeBudget')
const { loadAlbumIdentity } = require('../albumIdentity')
const { loadTrackIdentity } = require('../trackIdentity')

/** The whole time of one album request. The app gives up at 20 s; the answer has to leave before. */
const ALBUM_BUDGET_MS = 15000
const SOURCE = 'BestEverAlbums'

const titleOf = (track) => (track && (track.title || track.name)) || ''
const isRated = (entry) => Boolean(entry) && entry.rating !== undefined && entry.rating !== null

/** Two requests are for the same album when artist and title are the same text, case and spacing apart. */
const sameText = (text) => String(text || '').toLowerCase().replace(/\s+/g, ' ').trim()
const albumKey = (artist, title) => `${sameText(artist)}|${sameText(title)}`

class EnrichmentService {
    /**
     * @param {Object} deps
     * @param {Function} deps.getBestEverRanking - (title, artist, { deadlineAt, stats, tracks }) => Promise<page|null>
     * @param {Object} [deps.logger]
     * @param {Object} [deps.inFlight] - lib/inFlight.js
     * @param {Function} [deps.newBudget] - () => a budget of lib/timeBudget.js, for one request
     */
    constructor(deps) {
        this.getBestEverRanking = deps.getBestEverRanking;
        this.logger = deps.logger || console;
        this.inFlight = deps.inFlight || createInFlight();
        this.newBudget = deps.newBudget || (() => createBudget({ ms: ALBUM_BUDGET_MS }));
    }

    /**
     * @param {Object} albumData - { artist, title, tracks }
     * @returns {Promise<Object>} a result of lib/outcome.js; on success `data` is
     *          { bestEverInfo, trackRatings, trackEvidence, trackRule? }
     */
    async enrichAlbum(albumData) {
        if (!albumData || !albumData.title || !Array.isArray(albumData.tracks)) {
            return failure('invalid_request')
        }
        const artist = albumData.artist || ''
        const { title, tracks } = albumData

        const search = this._searchOnce({ title, artist, tracks }, this.newBudget())
        let page
        try {
            page = await search.page
        } catch (err) {
            if (!(err instanceof UpstreamError)) throw err
            this.logger.warn(`[Enrichment] the source failed for ${artist} - ${title}: ${err.message}`)
            return { ...this._failureOf(err), trace: search.trace() }
        }
        return { ...(await this._resultOf(page, title, artist, tracks)), trace: search.trace() }
    }

    /**
     * The page of the album, from the search already running for it or from a new one, never past
     * the budget of this request.
     * @returns {{ page: Promise<Object|null>, trace: Function }}
     */
    _searchOnce({ title, artist, tracks }, budget) {
        const stats = { requests: 0 }
        const shared = this.inFlight.share(albumKey(artist, title), () =>
            this.getBestEverRanking(title, artist, { deadlineAt: budget.deadlineAt, stats, tracks }))
        return {
            page: budget.race(shared.promise, SOURCE),
            trace: () => ({ how: shared.joined ? 'joined' : 'source', sourceRequests: stats.requests })
        }
    }

    _failureOf(err) {
        const retryAfterSeconds = err.retryAfterMs > 0 ? Math.ceil(err.retryAfterMs / 1000) : null
        return failure(err.code, { retryAfterSeconds })
    }

    async _resultOf(page, title, artist, tracks) {
        if (!page) {
            this.logger.info(`[Enrichment] no page for [${title}] by [${artist}].`)
            const { IDENTITY_RULE_VERSION } = await loadAlbumIdentity()
            const data = this._data(null, tracks.map(track => this._unrated(track)))
            return success({ ...data, identityRule: IDENTITY_RULE_VERSION }, OUTCOMES.NOT_FOUND)
        }

        const { matchTracks, TRACK_IDENTITY_RULE_VERSION } = await loadTrackIdentity()
        const matched = this._matchRatings(page, tracks, matchTracks)
        const ratedCount = matched.filter(entry => entry.rating !== null).length
        this.logger.info(`[Enrichment] ${title}: ${(page.evidence || []).length} rankings on the page, ${ratedCount} matched.`)
        const data = { ...this._data(page, matched), trackRule: TRACK_IDENTITY_RULE_VERSION }
        return success(data, ratedCount > 0 ? OUTCOMES.FOUND : OUTCOMES.NO_RATINGS)
    }

    _unrated(track) {
        return { title: titleOf(track), rating: null, evidence: [] }
    }

    /**
     * Each track asked for with the rating the page has for it, or null. Which entry of the page
     * is of which track is the track rule's to say (`matchTracks`): one entry to one track.
     */
    _matchRatings(page, tracks, matchTracks) {
        const evidence = Array.isArray(page.evidence) ? page.evidence : []
        const url = page.albumUrl || page.referenceUrl

        return matchTracks(tracks, evidence).map((match, index) => {
            if (!match || !isRated(match.entry)) return this._unrated(tracks[index])
            const rating = Number(match.entry.rating)
            return { title: titleOf(tracks[index]), rating, evidence: [{ source: 'BestEverAlbums', score: rating, votes: null, url }] }
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
module.exports.ALBUM_BUDGET_MS = ALBUM_BUDGET_MS;
