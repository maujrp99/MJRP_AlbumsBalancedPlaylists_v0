/**
 * The handlers of the administrator's routes (F82), apart from Express so they are tested with no
 * server (routes/admin.js only mounts them). Each asks a service for a typed result and hands it
 * to `respond` (lib/outcome.js): the handlers build no answer of their own.
 */
const { respond } = require('../../lib/outcome')

/**
 * @param {Object} deps
 * @param {Object} deps.translateService - lib/services/translateService.js
 * @param {Object} [deps.appleAlbumService] - lib/services/appleAlbumService.js
 * @param {Object} [deps.logger] - { info(msg, meta) }
 * @param {Function} [deps.now] - () => ms
 */
function createAdminHandlers ({ translateService, appleAlbumService, logger = console, now = () => Date.now() }) {
  /**
   * POST /api/admin/translate - one text into the other language. One line of log per request:
   * with what answer, in how long, in which direction and of what size. Nothing of the text, of
   * its context, of the translation or of the person is in it.
   */
  async function translate (req, res) {
    const startedAt = now()
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const result = await translateService.translate(req.body)
    logger.info('cms_translate', {
      event: 'cms_translate',
      answer: result.ok ? result.outcome : (result.reason || result.code),
      ms: now() - startedAt,
      target: typeof body.target === 'string' ? body.target.slice(0, 8) : null,
      kind: typeof body.kind === 'string' ? body.kind.slice(0, 8) : null,
      chars: typeof body.text === 'string' ? body.text.length : null
    })
    return respond(res, result)
  }

  /**
   * POST /api/admin/apple-albums - the albums of Apple Music's catalogue for a search or for an album's link (the
   * entry page's crate, F82 REQ-03). One line of log per request: with what answer, in how long, whether it was a link
   * or a search, of what size and with how many albums. Nothing of what was searched or of the person is in it.
   */
  async function appleAlbums (req, res) {
    const startedAt = now()
    const query = req.body && typeof req.body === 'object' && typeof req.body.query === 'string' ? req.body.query : null
    const result = await appleAlbumService.search(req.body)
    logger.info('cms_apple_albums', {
      event: 'cms_apple_albums',
      answer: result.ok ? result.outcome : (result.reason || result.code),
      ms: now() - startedAt,
      kind: query === null ? null : (/^\s*https?:/i.test(query) ? 'link' : 'term'),
      chars: query === null ? null : query.length,
      count: result.ok ? result.data.albums.length : null
    })
    return respond(res, result)
  }

  return { translate, appleAlbums }
}

module.exports = { createAdminHandlers }
