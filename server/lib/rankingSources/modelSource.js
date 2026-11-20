/**
 * The last source of the ranking of an album: the paid AI provider, asked with the ranking prompt
 * of the prompts file. It gives positions, not ratings. One typed outcome (sourceOutcome.js); a
 * failure of the provider is thrown on, and `askSource` turns it into `failed`.
 *
 * The ranking prompt is required: a prompts file without it is a broken deploy, and `rankingPromptOf`
 * throws (lib/prompts.js, PromptsError) instead of reading it as "there is no ranking".
 */
const { SOURCE_OUTCOMES, found, none } = require('./sourceOutcome')

const NAME = 'AI ranking'
const MAX_PROVIDERS = 10
const MAX_TOKENS = 2048

/** The sources the prompts file suggests to the model, numbered. */
const numberedProviders = (providers) => (Array.isArray(providers) ? providers : [])
  .slice(0, MAX_PROVIDERS)
  .map((provider, index) => `${index + 1}. ${String(provider).trim()}`)
  .join('\n')

/** Why the model stopped, wherever the provider says it (the two answer shapes the AI client knows). */
const candidateFinishReason = (data) => data?.candidates?.[0]?.metadata?.finishReason
const choiceFinishReason = (data) => data?.finish_reason || data?.choices?.[0]?.finish_reason
const finishReasonOf = (data) => candidateFinishReason(data) || choiceFinishReason(data)

/**
 * @param {Object} deps
 * @param {Function} deps.loadPrompts
 * @param {Function} deps.renderPrompt
 * @param {Function} deps.requirePrompt - lib/prompts.js
 * @param {Function} deps.callProvider - the AI client
 * @param {Function} deps.extractAndValidateRankingEntries
 * @param {Function} deps.rankingEntriesToSources
 * @param {Object} deps.logger
 * @param {Object} [deps.env]
 */
function createModelSource ({ loadPrompts, renderPrompt, requirePrompt, callProvider, extractAndValidateRankingEntries, rankingEntriesToSources, logger, env = process.env }) {
  /**
   * @param {Object} asked - { title, artist, year, albumQuery }
   * @param {boolean} withProviders - name the suggested sources in the prompt
   * @throws {PromptsError} when the prompts file has no ranking prompt
   */
  function rankingPromptOf (asked, withProviders) {
    const prompts = loadPrompts()
    return renderPrompt(requirePrompt(prompts, 'rankingPrompt'), {
      albumTitle: asked.title,
      albumArtist: asked.artist,
      albumYear: asked.year,
      albumQuery: asked.albumQuery,
      rankingProviders: withProviders ? numberedProviders(prompts.defaultRankingProviders) : ''
    })
  }

  /** The provider's answer to the ranking prompt, as it came. */
  function callWithRankingPrompt (asked, withProviders) {
    return callProvider({
      prompt: rankingPromptOf(asked, withProviders),
      maxTokens: MAX_TOKENS,
      aiEndpoint: env.AI_ENDPOINT,
      aiApiKey: env.AI_API_KEY,
      aiModelEnv: env.AI_MODEL
    })
  }

  /** @returns {Promise<Object>} found, with { entries, sources }; or not_found (it answered with no ranking) */
  async function ask (asked, { withProviders }) {
    const response = await callWithRankingPrompt(asked, withProviders)
    const finishReason = finishReasonOf(response && response.data)
    if (finishReason && String(finishReason).toUpperCase().includes('MAX_TOKENS')) {
      logger.info('model_truncation_detected', { finishReason })
    }

    const entries = await extractAndValidateRankingEntries(response)
    if (!entries.length) return none(SOURCE_OUTCOMES.NOT_FOUND, { entries: [], sources: [] })
    return found({ entries, sources: rankingEntriesToSources(entries) })
  }

  return { name: NAME, ask, rankingPromptOf, callWithRankingPrompt }
}

module.exports = { createModelSource }
