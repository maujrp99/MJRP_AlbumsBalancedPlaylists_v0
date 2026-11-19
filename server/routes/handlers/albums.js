/**
 * The handlers of the album routes, apart from Express so they are tested with no server
 * (routes/albums.js only mounts them). Each asks a service for a typed result and hands it to
 * `respond` (lib/outcome.js): the handlers build no answer of their own (F52).
 */
const { failure, respond } = require('../../lib/outcome')
const { debugRoutesEnabled } = require('../../lib/debugGate')

/**
 * @param {Object} deps
 * @param {Object} deps.enrichmentService - { enrichAlbum(albumData) -> result }
 * @param {Object} deps.generationService - { generateAlbum(body, config) -> result }
 * @param {Object} [deps.env] - the environment (read on each request)
 */
function createAlbumHandlers ({ enrichmentService, generationService, env = process.env }) {
  /** POST /api/enrich-album - track ratings from BestEverAlbums. It uses no AI and asks for no AI key. */
  async function enrichAlbum (req, res) {
    const result = await enrichmentService.enrichAlbum(req.body && req.body.albumData)
    return respond(res, result)
  }

  /** POST /api/generate - an album from the paid AI provider. */
  async function generate (req, res) {
    // The server is not set up to call the provider: 503 as before, and nothing is spent
    if (!env.AI_API_KEY) return respond(res, failure('internal', { status: 503 }))

    const serverConfig = {
      processEnv: env,
      startTime: req._startTime,
      // The raw stage shows the provider's answer as it came: a debug feature (F59)
      allowRawStage: debugRoutesEnabled(env)
    }
    const result = await generationService.generateAlbum(req.body || {}, serverConfig)
    return respond(res, result)
  }

  return { enrichAlbum, generate }
}

module.exports = { createAlbumHandlers }
