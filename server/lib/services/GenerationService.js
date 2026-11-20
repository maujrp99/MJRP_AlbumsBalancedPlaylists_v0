/**
 * GenerationService.js
 *
 * An album from the paid AI provider, with the ranking of its tracks (POST /api/generate).
 *
 * It returns a typed result (lib/outcome.js): the album as `found`, or a failure. What the paid
 * provider answered is turned into a failure by ONE table (lib/aiProviderOutcome.js); the
 * provider's own answer or message never leaves in the result (F52).
 *
 * The album and its ratings are two things (F52, slice 5):
 *   - the ALBUM decides the result: found, or the failure of the provider;
 *   - the RATINGS come from a pipeline of sources (lib/fetchRanking.js) and never fail the
 *     request: `data.ratings` says, source by source, what happened (found, not_found, no_ratings,
 *     not_configured, failed, not_asked), so "there are no ratings" and "the ratings could not be
 *     fetched" are told apart. The app asks the ratings again through POST /api/enrich-album.
 * Anything of this server that breaks (a missing prompt, a bug in the consolidation) is thrown:
 * the route's error path answers `internal`. It is never answered as an album without ratings.
 *
 * Time: one request has GENERATE_BUDGET_MS in all, less than the time the app waits for this call
 * (90 s, `serverTimeoutMs` in the app's api/client.js). The provider not answering the album in
 * that time is `upstream_timeout`; a source of ratings that is still running when the time ends
 * is `failed` in `data.ratings`, and the album leaves (it was paid for).
 *
 * Every result carries `trace` ({ ratings }) for the log line of the route; it does not go on the wire.
 */
const { success, failure, UpstreamError } = require('../outcome')
const { providerFailure, failureFromProviderError, describeProviderError } = require('../aiProviderOutcome')
const { createBudget } = require('../timeBudget')
const { requirePrompt } = require('../prompts')
const { withRanking, withConsolidation, withRanksOnTracks } = require('../albumAnswer')
const { loadTrackIdentity } = require('../trackIdentity')

/** The whole time of one request. The app gives up at 90 s; the answer has to leave before. */
const GENERATE_BUDGET_MS = 75000
const PROVIDER = 'AI provider'

/** The tokens the provider says it used, for the log. */
const tokensOf = (usage) => ['promptTokenCount', 'totalTokenCount', 'thoughtsTokenCount']
    .map(name => `${name.replace('Count', 's')}=${usage[name] || '-'}`)
    .join(' ')

const isBudgetTimeout = (err) => err instanceof UpstreamError && err.code === 'upstream_timeout'

class GenerationService {
    /**
     * @param {Object} deps
     * @param {Function} deps.loadPrompts
     * @param {Function} deps.renderPrompt
     * @param {Function} deps.callProvider - the AI client
     * @param {Function} deps.extractAlbum - the album in the provider's answer, or null
     * @param {Function} [deps.validateAlbum] - the schema check (ajv), with `ajvAvailable`
     * @param {Function} deps.fetchRankingForAlbum - lib/fetchRanking.js
     * @param {Function} deps.consolidateRanking - lib/ranking.js
     * @param {Object} [deps.logger]
     * @param {Function} [deps.newBudget] - () => a budget of lib/timeBudget.js, for one request
     */
    constructor(deps) {
        this.loadPrompts = deps.loadPrompts;
        this.renderPrompt = deps.renderPrompt;
        this.callProvider = deps.callProvider;
        this.extractAlbum = deps.extractAlbum;
        this.validateAlbum = deps.validateAlbum;
        this.ajvAvailable = deps.ajvAvailable;
        this.fetchRankingForAlbum = deps.fetchRankingForAlbum;
        this.consolidateRanking = deps.consolidateRanking;
        this.logger = deps.logger || console;
        this.newBudget = deps.newBudget || (() => createBudget({ ms: GENERATE_BUDGET_MS }));
    }

    /**
     * @returns {Promise<Object>} a result of lib/outcome.js; on success `data` is the album
     * @throws {PromptsError} when the prompts file has no prompt for the album search
     */
    async generateAlbum(reqBody, serverConfig) {
        const { albumQuery } = reqBody || {};

        // Nothing to look for: the paid provider is not called
        if (typeof albumQuery !== 'string' || !albumQuery.trim()) return failure('invalid_request')

        // No prompt: this server is broken, and it is known before anything is spent
        const prompt = this.renderPrompt(requirePrompt(this.loadPrompts(), 'albumSearchPrompt'), { albumQuery })
        const budget = this.newBudget()

        const asked = await this._askProvider(prompt, reqBody, serverConfig, budget)
        if (asked.failed) return asked.failed

        // The provider answered and was paid for. An answer with no usable album in it is the
        // "unusable" row of the table: a status no tab asks again for, and no raw answer out.
        const album = this._albumIn(asked.response, albumQuery)
        if (!album) return providerFailure('unusable')

        if (reqBody.rawStage === 'ranking' && serverConfig.allowRawStage) return this._rawRanking(album, albumQuery)

        const ranking = await this.fetchRankingForAlbum(album, albumQuery, { budget })
        return { ...success(await this._answerOf(album, ranking)), trace: { ratings: ranking.ratings } }
    }

    /**
     * One call to the paid provider, within the time of the request.
     * @returns {Promise<{ response: Object }|{ failed: Object }>} a failure of the provider is a
     *          row of the table; anything else that breaks is thrown
     * @private
     */
    async _askProvider(prompt, reqBody, serverConfig, budget) {
        const { processEnv } = serverConfig
        try {
            const response = await budget.race(this.callProvider({
                prompt,
                albumQuery: reqBody.albumQuery,
                model: reqBody.model,
                maxTokens: reqBody.maxTokens,
                aiEndpoint: processEnv.AI_ENDPOINT,
                aiApiKey: processEnv.AI_API_KEY,
                aiModelEnv: processEnv.AI_MODEL
            }), PROVIDER)
            if (response) this._logUsage(response, serverConfig)
            return { response }
        } catch (err) {
            const failed = isBudgetTimeout(err) ? providerFailure('timeout') : failureFromProviderError(err)
            if (!failed) throw err
            console.error(`AI provider failed for "${reqBody.albumQuery}": ${isBudgetTimeout(err) ? err.message : describeProviderError(err)}`)
            return { failed }
        }
    }

    /** @private */
    _logUsage(response, serverConfig) {
        const latencyMs = Date.now() - (serverConfig.startTime || Date.now())
        const usedModel = serverConfig.processEnv.AI_MODEL || 'models/gemini-2.5-flash'
        console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`)

        const usage = response.data && response.data.usageMetadata
        if (usage) console.log(`AI usage: ${tokensOf(usage)}`)
    }

    /**
     * The album in the provider's answer.
     * @returns {Object|null} null when the answer has no album, breaks while it is read, or the
     *          album fails the schema: the three are "the answer cannot be used"
     * @private
     */
    _albumIn(response, albumQuery) {
        let album
        try {
            album = this.extractAlbum(response)
        } catch (err) {
            console.error(`AI answer for "${albumQuery}" could not be read:`, (err && err.message) || err)
            return null
        }
        if (!album) {
            console.warn(`AI answer for "${albumQuery}" has no album in it`)
            return null
        }
        if (this.ajvAvailable && this.validateAlbum && !this.validateAlbum(album)) {
            console.warn('Album validation failed:', this.validateAlbum.errors)
            return null
        }
        return album
    }

    /**
     * The raw stage (a debug feature, F59): the provider's answer to the ranking prompt, as it came.
     * @private
     */
    async _rawRanking(album, albumQuery) {
        try {
            const ranking = await this.fetchRankingForAlbum(album, albumQuery, { raw: true })
            return success({ rawRankingResponse: ranking.raw && ranking.raw.data })
        } catch (err) {
            const failed = failureFromProviderError(err)
            if (!failed) throw err
            console.error(`AI provider failed for the ranking of "${albumQuery}": ${describeProviderError(err)}`)
            return failed
        }
    }

    /**
     * The album with its ranking, consolidated and written on the tracks.
     * @private
     */
    async _answerOf(album, ranking) {
        const ranked = withRanking(album, ranking)
        const consolidated = await this.consolidateRanking(ranked.tracks || [], ranked.rankingAcclaim || [])
        const { matchTracks } = await loadTrackIdentity()
        return withRanksOnTracks(withConsolidation(ranked, consolidated, ranking), matchTracks)
    }
}

module.exports = GenerationService;
module.exports.GENERATE_BUDGET_MS = GENERATE_BUDGET_MS;
