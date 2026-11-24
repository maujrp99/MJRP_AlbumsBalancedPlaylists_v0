/**
 * Apple Music's catalogue, asked by this server (F82, REQ-03: the Painel's search of the albums of the entry page's
 * crate). The only file of the server that calls api.music.apple.com. It uses the developer token the server already
 * makes for MusicKit (services/MusicKitTokenService.js); the token stays in the request's header, here: it is never logged
 * and never part of an answer.
 *
 * searchAlbums(term, { storefront, limit }) and albumById(id, { storefront }) answer { ok: true, albums: [raw] } - the
 * catalogue's own records, read by the service - or a typed failure of lib/outcome.js with the name the Painel shows:
 *   search-not-configured   the server has no MusicKit key, the key cannot sign, or Apple refuses the token (401, 403)
 *   service-unavailable     asked to wait (429, 503), broke (5xx), no connection, no answer in time
 * «No such album» (404 by id, or a search with no album) is an empty list, not a failure.
 * The log says the kind of failure and the HTTP status: never the token, the address or what was searched.
 */
const axios = require('axios')
const { failure, isTimeout } = require('../outcome')

const CATALOG_URL = 'https://api.music.apple.com/v1/catalog'
const TIMEOUT_MS = 8000

const NOT_CONFIGURED = 'search-not-configured'
const SERVICE_UNAVAILABLE = 'service-unavailable'

const NO_ANSWER_IN_TIME = Object.freeze({ kind: 'timeout', code: 'upstream_timeout', reason: SERVICE_UNAVAILABLE })
const NO_CONNECTION = Object.freeze({ kind: 'no-connection', code: 'upstream_failed', reason: SERVICE_UNAVAILABLE })

/** An answer of Apple that is an error, read by its HTTP status; the first line that matches says the failure. */
const HTTP_FAILURES = Object.freeze([
  { kind: 'token-refused', code: 'upstream_unauthorized', reason: NOT_CONFIGURED, when: (status) => status === 401 || status === 403 },
  { kind: 'busy', code: 'upstream_busy', reason: SERVICE_UNAVAILABLE, when: (status) => status === 429 || status === 503 },
  { ...NO_ANSWER_IN_TIME, when: (status) => status === 408 || status === 504 },
  { kind: 'provider-error', code: 'upstream_failed', reason: SERVICE_UNAVAILABLE, when: () => true }
])

/** The HTTP status of a failed call, or 0 when the call had no answer. */
const statusOf = (error) => Number(error?.response?.status) || 0
const ofTheNetwork = (error) => Boolean(error && (error.isAxiosError || error.code))
/** The albums of a search's body, and of an album's: a list, or none. */
const foundIn = (body) => body?.results?.albums?.data
const listOf = (data) => (Array.isArray(data) ? data : [])

/**
 * @param {Object} [deps]
 * @param {Object} [deps.tokens] - { checkConfig() -> { ready }, getToken() -> { token } } (MusicKitTokenService)
 * @param {Object} [deps.http] - { get(url, config) } (axios)
 * @param {Object} [deps.logger]
 * @param {number} [deps.timeoutMs]
 */
function createAppleCatalog ({ tokens, http = axios, logger = console, timeoutMs = TIMEOUT_MS } = {}) {
  const warn = (kind, status) => { if (logger && logger.warn) logger.warn('apple_catalog_failed', { kind, status: status || null }) }
  const say = ({ kind, code, reason }, status) => { warn(kind, status); return failure(code, { reason }) }

  /** The developer token, or null when the server cannot make one. */
  function tokenOrNull () {
    const service = tokens || require('../../services/MusicKitTokenService').musicKitTokenService
    if (!service.checkConfig().ready) return null
    try {
      return service.getToken().token || null
    } catch {
      warn('token-not-made')
      return null
    }
  }

  /** A failed call as an answer: «no such thing» (404) is an empty body; anything that is not of the network is thrown on. */
  function answerOfFailure (error) {
    const status = statusOf(error)
    if (status === 404) return { ok: true, body: null }
    if (status) return say(HTTP_FAILURES.find((known) => known.when(status)), status)
    if (isTimeout(error)) return say(NO_ANSWER_IN_TIME)
    if (ofTheNetwork(error)) return say(NO_CONNECTION)
    throw error // a bug of ours: the routes answer `internal`
  }

  /** One GET of the catalogue: the body, null for 404, or a typed failure. */
  async function ask (path, params) {
    const token = tokenOrNull()
    if (!token) return failure('not_configured', { reason: NOT_CONFIGURED })
    try {
      // One try, with a deadline: the Painel is waiting, and asking again is the person's choice
      const response = await http.get(`${CATALOG_URL}/${path}`, { params, headers: { Authorization: `Bearer ${token}` }, timeout: timeoutMs })
      return { ok: true, body: response.data || {} }
    } catch (error) {
      return answerOfFailure(error)
    }
  }

  /**
   * @param {string} term - what to look for (an album, an artist)
   * @param {{ storefront: string, limit: number }} where
   */
  async function searchAlbums (term, { storefront, limit }) {
    const answer = await ask(`${storefront}/search`, { term, types: 'albums', limit })
    if (!answer.ok) return answer
    return { ok: true, albums: listOf(foundIn(answer.body)) }
  }

  /**
   * @param {string} id - the catalogue id of the album (digits)
   * @param {{ storefront: string }} where
   */
  async function albumById (id, { storefront }) {
    const answer = await ask(`${storefront}/albums/${id}`)
    if (!answer.ok) return answer
    return { ok: true, albums: listOf(answer.body?.data) }
  }

  return { searchAlbums, albumById }
}

module.exports = { createAppleCatalog, CATALOG_URL, TIMEOUT_MS }
