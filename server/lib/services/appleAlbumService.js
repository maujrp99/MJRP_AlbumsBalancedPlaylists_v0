/**
 * The Painel's search of the albums for the entry page's crate (F82, REQ-03): what may be asked, and the answer under the
 * contract of lib/outcome.js. Apple's catalogue is asked by the client it is given (lib/appleMusic/catalogClient.js); this
 * file knows no address of Apple's API and no token.
 *
 * The request: { query }
 *   query   a word or two (an album, an artist), or the link of an album on Apple Music
 *           (https://music.apple.com/<storefront>/album/<name>/<id>); text, not empty, up to MAX_QUERY_CHARS characters
 * The answer: success({ albums }) - each album is exactly what the entry page needs and what the crate stores
 * ({ id, title, artist, year, art, href }, checked by the crate's own validator, shared/content/crate.js); an album the page
 * could not show (no cover on Apple's image server, a name with markup, no year) is left out. Nothing found: `not_found`.
 *
 * REASONS is the closed list of the names a failure of this route carries in `error.reason` (the door's and the limit's
 * among them, the same as the translation's): what the Painel shows.
 */
const { success, failure, OUTCOMES } = require('../outcome')
const { loadCrate } = require('../contentCore')

const MAX_QUERY_CHARS = 300
const MAX_RESULTS = 12
/** A search with no link looks in this storefront (the fixed set's albums point to it). */
const SEARCH_STOREFRONT = 'us'

const REASONS = Object.freeze({
  SESSION_EXPIRED: 'session-expired', // 401: sign in again
  NOT_AN_ADMINISTRATOR: 'not-an-administrator', // 403
  NOT_CONFIGURED: 'search-not-configured', // 503 no MusicKit key in the server; 502 Apple refuses the token
  SERVICE_UNAVAILABLE: 'service-unavailable', // 502, 503, 504: ask again later
  TOO_MANY_REQUESTS: 'too-many-requests', // 429, with Retry-After
  INVALID_REQUEST: 'invalid-request', // 400: a bug of the caller
  NOT_AN_ALBUM_LINK: 'not-an-album-link' // 400: an address that is not an album of Apple Music
})

const INVALID = () => failure('invalid_request', { reason: REASONS.INVALID_REQUEST })
const NOT_A_LINK = () => failure('invalid_request', { reason: REASONS.NOT_AN_ALBUM_LINK })

/** What makes a query an address: it starts as a web address does, or with Apple Music's own name (a link pasted without «https://»). */
const LOOKS_LIKE_A_LINK = /^(https?:\/\/|music\.apple\.com\/)/i

/**
 * What a query is: `undefined` when it is not an address at all (a search by words: «U2: Achtung Baby» and «AC:DC» are
 * words, whatever their colon), `null` when it is an address but not an album of Apple Music, or the album's storefront
 * and id.
 * @param {string} query
 * @returns {{ storefront: string, id: string } | null | undefined}
 */
function albumLinkOf (query) {
  const text = String(query).trim()
  if (!LOOKS_LIKE_A_LINK.test(text)) return undefined
  const address = /^music\./i.test(text) ? `https://${text}` : text
  const match = /^https:\/\/music\.apple\.com\/([a-z]{2})\/album\/(?:[^/?#]+\/)?(\d+)(?:[?#].*)?$/i.exec(address)
  return match ? { storefront: match[1].toLowerCase(), id: match[2] } : null
}

/** A record of Apple's catalogue as the fields of an album of the crate (not yet checked). */
function albumOf (raw, artPathOf) {
  const attributes = (raw && raw.attributes) || {}
  return {
    id: String((raw && raw.id) || ''),
    title: attributes.name,
    artist: attributes.artistName,
    year: Number(String(attributes.releaseDate || '').slice(0, 4)),
    art: artPathOf(attributes.artwork && attributes.artwork.url),
    href: attributes.url
  }
}

const usable = (body) => body && typeof body === 'object' && typeof body.query === 'string' && body.query.trim() !== '' && body.query.length <= MAX_QUERY_CHARS

/**
 * @param {Object} deps
 * @param {Object} deps.catalog - { searchAlbums(term, { storefront, limit }), albumById(id, { storefront }) }
 */
function createAppleAlbumService ({ catalog }) {
  /**
   * @param {*} body - the body of the request, as it came
   * @returns {Promise<Object>} a typed result of lib/outcome.js
   */
  async function search (body) {
    if (!usable(body)) return INVALID()
    const link = albumLinkOf(body.query)
    if (link === null) return NOT_A_LINK()

    const result = link
      ? await catalog.albumById(link.id, { storefront: link.storefront })
      : await catalog.searchAlbums(body.query.trim(), { storefront: SEARCH_STOREFRONT, limit: MAX_RESULTS })
    if (!result.ok) return result

    const { validateAlbum, artPathOf } = await loadCrate()
    const albums = result.albums.flatMap((raw) => {
      const checked = validateAlbum(albumOf(raw, artPathOf))
      return checked.ok ? [checked.album] : []
    })
    return success({ albums }, albums.length > 0 ? OUTCOMES.FOUND : OUTCOMES.NOT_FOUND)
  }

  return { search }
}

module.exports = { createAppleAlbumService, albumLinkOf, LOOKS_LIKE_A_LINK, MAX_QUERY_CHARS, MAX_RESULTS, SEARCH_STOREFRONT, REASONS }
