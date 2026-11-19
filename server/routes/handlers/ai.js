/**
 * The handlers of the AI assistant routes, apart from Express so they are tested with no server
 * (routes/ai.js only mounts them). The answer is built by lib/outcome.js, and a failure of the
 * paid provider by the one table of lib/aiProviderOutcome.js (F52): never 200 with an empty list
 * for a failure, never the provider's message (it can carry the request address, with the key).
 */
const { OUTCOMES, success, failure, respond } = require('../../lib/outcome')
const { providerFailure, failureFromProviderError, describeProviderError } = require('../../lib/aiProviderOutcome')

// Strict JSON output, studio albums only, the COMPLETE discography
const studioAlbumsPrompt = (artistName) => `List ALL original studio albums from the complete discography of ${artistName} . Exclude compilations, EPs, singles, DJ mixes, live albums, and remix albums. Reply ONLY with a valid JSON array of album title strings in chronological order. Do not include any other text. Example format: ["Album 1", "Album 2"]`

/**
 * The list of titles in the provider's answer.
 * @returns {string[]|null} null when the answer has no list in it (no text, or text that is not a list)
 */
function albumTitlesIn (response) {
  const raw = response && response.data && response.data.candidates && response.data.candidates[0] &&
    response.data.candidates[0].content && response.data.candidates[0].content.parts &&
    response.data.candidates[0].content.parts[0] && response.data.candidates[0].content.parts[0].text
  if (typeof raw !== 'string' || !raw.trim()) return null

  // Clean up code fences (```json ... ```)
  const text = raw.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : null
  } catch (parseErr) {
    // Broken JSON (a cut answer, a missing comma): read the quoted titles one by one
    const matches = text.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : null
  }
}

/**
 * @param {Object} deps
 * @param {Function} deps.callProvider - the AI client
 * @param {Object} [deps.env]
 * @param {Object} [deps.logger]
 */
function createAiHandlers ({ callProvider, env = process.env, logger = console }) {
  /** POST /api/ai/studio-albums - Body: { artistName } -> { data: { albums: string[] }, outcome } */
  async function studioAlbums (req, res) {
    const artistName = req.body && req.body.artistName
    if (!artistName || typeof artistName !== 'string') return respond(res, failure('invalid_request'))
    if (!env.AI_API_KEY) return respond(res, failure('internal', { status: 503 }))

    let response
    try {
      response = await callProvider({
        prompt: studioAlbumsPrompt(artistName),
        maxTokens: 10000, // large discographies were being cut
        aiApiKey: env.AI_API_KEY
      })
    } catch (err) {
      const failed = failureFromProviderError(err)
      if (!failed) throw err
      logger.error(`[AI] studio albums of "${artistName}" failed: ${describeProviderError(err)}`)
      return respond(res, failed)
    }

    const albums = albumTitlesIn(response)
    if (!albums) {
      logger.error(`[AI] studio albums of "${artistName}": the answer has no list in it`)
      return respond(res, providerFailure('unusable'))
    }
    logger.log(`[AI] Found ${albums.length} albums for ${artistName}`)
    return respond(res, success({ albums }, albums.length > 0 ? OUTCOMES.FOUND : OUTCOMES.NOT_FOUND))
  }

  return { studioAlbums }
}

module.exports = { createAiHandlers, albumTitlesIn }
