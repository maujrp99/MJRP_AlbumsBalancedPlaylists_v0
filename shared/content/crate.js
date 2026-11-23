/**
 * crate - the crate of albums of the entry page as the CMS publishes it, and the one validator of it (F82, REQ-03, REQ-11;
 * F95; ADR-0024).
 *
 * The Painel checks the crate with this module before saving and the entry page checks it again on reading: the same rule
 * in the two places. Pure: no Firebase, no `fetch`, no global (test/architecture/coreStaysPortable.test.js).
 *
 * The published document (`published/crate`):
 *   { _schemaVersion, rev, sideA: [album], sideB: [album], previous?: { sideA?, sideB? } }
 * Each side is in the order the owner sees it, THE FRONT RECORD FIRST. An album is exactly what the entry page needs:
 *   id      a short name (Apple's catalogue id, or the key of the fixed set)
 *   title   the album's name, as text: not empty, no < nor >, up to 200 characters
 *   artist  the same rule
 *   year    a whole number of four digits
 *   art     the PATH of the artwork on Apple's image server (never an address: the page writes the server itself)
 *   href    the album's page on Apple Music (https://music.apple.com/…)
 * A bad album is refused ALONE and the others go on; the same album twice stays once. Then each side must hold what the
 * crate can draw (CRATE_LIMITS), or the whole crate is refused and the entry page keeps its fixed set.
 */
import { isAllowedLink } from './texts.js'

export const CRATE_SCHEMA_VERSION = 1

/**
 * What the crate can draw (public/splash/splash.js TRACKS, framing.js recordAt): the page pulls the 1st, 3rd and 6th record
 * of side A, and the 1st, 2nd and 4th of side B, so a side has at least that many; ten a side keeps the sleeves apart in the
 * crate (twenty in all; the page shipped with fifteen).
 */
export const CRATE_LIMITS = Object.freeze({ a: Object.freeze({ min: 6, max: 10 }), b: Object.freeze({ min: 4, max: 10 }) })

/** The one image server the entry page's content policy allows, and the folder of the artwork on it. */
export const COVER_SERVER = 'https://is1-ssl.mzstatic.com/image/thumb/'
/** Where an album's own page is. */
export const LISTEN_SERVER = 'https://music.apple.com/'

export const MAX_NAME_CHARS = 200
const MAX_ART_CHARS = 300
const MAX_LINK_CHARS = 500

export const REASON_NOT_AN_ALBUM = 'not_an_album'
export const REASON_ID = 'id'
export const REASON_NOT_TEXT = 'not_text'
export const REASON_EMPTY = 'empty'
export const REASON_MARKUP = 'markup'
export const REASON_TOO_LONG = 'too_long'
export const REASON_YEAR = 'year'
export const REASON_COVER = 'cover'
export const REASON_LINK = 'link'
export const REASON_REPEATED = 'repeated'
export const REASON_NOT_A_CRATE = 'not_a_crate'
export const REASON_SIDE_A_COUNT = 'side_a_count'
export const REASON_SIDE_B_COUNT = 'side_b_count'

const isPlainMap = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

/** The rule of a name (title, artist) that is broken, or null: the plain text rule of the site's texts. */
function brokenName(text) {
    if (typeof text !== 'string') return REASON_NOT_TEXT
    if (text.trim() === '') return REASON_EMPTY
    if (/[<>]/.test(text)) return REASON_MARKUP
    return text.length > MAX_NAME_CHARS ? REASON_TOO_LONG : null
}

/** A path inside the artwork folder: letters, digits and . _ - % between single slashes, never two dots in a row, never an address (the same rule as the database's: firestore.rules). */
const isArtPath = (art) => typeof art === 'string' && art.length <= MAX_ART_CHARS
    && /^[A-Za-z0-9._%-]+(\/[A-Za-z0-9._%-]+)+$/.test(art) && !art.includes('..')

/**
 * The address of a cover, always on the one image server: the page asks for a square of `size` pixels.
 * @param {string} art - the artwork path of an accepted album
 * @param {number} size
 * @returns {string}
 */
export const coverUrl = (art, size) => `${COVER_SERVER}${art}/${size}x${size}bb.webp`

/**
 * The artwork path out of an address of Apple's catalogue (`https://isN-ssl.mzstatic.com/image/thumb/<path>/{w}x{h}bb.jpg`),
 * or null when the address is not one of those.
 * @param {*} url
 * @returns {string|null}
 */
export function artPathOf(url) {
    const match = typeof url === 'string' ? /^https:\/\/is[1-5]-ssl\.mzstatic\.com\/image\/thumb\/(.+)\/[^/]+$/.exec(url) : null
    return match && isArtPath(match[1]) ? match[1] : null
}

const isYear = (year) => Number.isInteger(year) && year >= 1000 && year <= 9999
// printable ASCII with no < nor >, as the database's rules check it (an address of Apple Music comes percent-encoded)
const isListenLink = (href) => typeof href === 'string' && href.length <= MAX_LINK_CHARS && href.startsWith(LISTEN_SERVER) && /^[!-;=?-~]+$/.test(href) && isAllowedLink(href)
const isId = (id) => typeof id === 'string' && /^[\w-]{1,64}$/.test(id)

const refused = (reason) => ({ ok: false, reason })

/** The first rule an album breaks, or null. */
function brokenAlbum(input) {
    if (!isPlainMap(input)) return REASON_NOT_AN_ALBUM
    if (!isId(input.id)) return REASON_ID
    const name = brokenName(input.title) || brokenName(input.artist)
    if (name) return name
    if (!isYear(input.year)) return REASON_YEAR
    // the address check on the whole address the page will ask for, not only on the path
    if (!isArtPath(input.art) || !isAllowedLink(coverUrl(input.art, 360))) return REASON_COVER
    return isListenLink(input.href) ? null : REASON_LINK
}

/**
 * Checks one album.
 * @param {*} input - what was typed, found or read
 * @returns {{ ok: true, album: { id: string, title: string, artist: string, year: number, art: string, href: string } } | { ok: false, reason: string }}
 *   the album comes back as a copy with its six fields and nothing else
 */
export function validateAlbum(input) {
    const broken = brokenAlbum(input)
    if (broken) return refused(broken)
    const { id, title, artist, year, art, href } = input
    return { ok: true, album: { id, title, artist, year, art, href } }
}

const inside = (count, { min, max }) => count >= min && count <= max

/**
 * Checks a crate: `{ sideA, sideB }`, each a list of albums with the front record first.
 * @param {*} input
 * @returns {{ ok: true, sides: { a: Object[], b: Object[] }, rejected: Array<{ side: 'a'|'b', index: number, reason: string }> }
 *   | { ok: false, reason: string, rejected: Array<{ side: 'a'|'b', index: number, reason: string }>, sides?: { a: Object[], b: Object[] } }}
 *   a crate refused by the count of a side still says its good albums (`sides`), for the Painel to mend it
 */
export function validateCrate(input) {
    const rejected = []
    if (!isPlainMap(input) || !Array.isArray(input.sideA) || !Array.isArray(input.sideB)) return { ok: false, reason: REASON_NOT_A_CRATE, rejected }
    const seen = new Set()
    const good = (side, list) => list.flatMap((entry, index) => {
        const result = validateAlbum(entry)
        const reason = result.ok ? (seen.has(result.album.id) ? REASON_REPEATED : null) : result.reason
        if (reason) { rejected.push({ side, index, reason }); return [] }
        seen.add(result.album.id)
        return [result.album]
    })
    const sides = { a: good('a', input.sideA), b: good('b', input.sideB) }
    if (!inside(sides.a.length, CRATE_LIMITS.a)) return { ok: false, reason: REASON_SIDE_A_COUNT, rejected, sides }
    if (!inside(sides.b.length, CRATE_LIMITS.b)) return { ok: false, reason: REASON_SIDE_B_COUNT, rejected, sides }
    return { ok: true, sides, rejected }
}

/**
 * The crate as one row, the way the entry page stands it: side A from the front, then side B from the BACK (the last
 * record of the row is the front of side B, the one facing you when the crate is turned).
 * @param {{ a: Object[], b: Object[] }} sides
 * @returns {Object[]}
 */
export const flatCrate = (sides) => [...sides.a, ...[...sides.b].reverse()]

/**
 * The two sides of a row whose last `countB` records are side B.
 * @param {Object[]} row
 * @param {number} countB
 * @returns {{ a: Object[], b: Object[] }}
 */
export const sidesOfFlat = (row, countB) => ({ a: row.slice(0, row.length - countB), b: row.slice(row.length - countB).reverse() })

const FIELDS = ['id', 'title', 'artist', 'year', 'art', 'href']
const sameAlbum = (one, other) => FIELDS.every(field => one?.[field] === other?.[field])
const sameSide = (one, other) => Array.isArray(one) && Array.isArray(other) && one.length === other.length && one.every((album, i) => sameAlbum(album, other[i]))

/** Two crates with the same albums on the same sides in the same order. */
export const sameCrate = (one, other) => sameSide(one?.a, other?.a) && sameSide(one?.b, other?.b)

/**
 * The shape of the `published/crate` document. A newer version of the shape is read in the fields known here. The albums
 * are NOT checked here (validateCrate does it).
 * @param {*} data
 * @returns {{ ok: true, rev: number, sideA: Array, sideB: Array } | { ok: false, reason: string }}
 */
export function readCrateDocument(data) {
    if (!isPlainMap(data) || !Array.isArray(data.sideA) || !Array.isArray(data.sideB)) return refused(REASON_NOT_A_CRATE)
    return { ok: true, rev: Number.isInteger(data.rev) ? data.rev : 0, sideA: [...data.sideA], sideB: [...data.sideB] }
}

/**
 * What a save of the crate writes: the whole document, `rev` the stored one plus one (the rules refuse anything else) and
 * `previous` with the earlier value ONLY of the side this save changed (null when there was none), so it covers the last
 * save alone (F82, REQ-08).
 * @param {Object|null} live - the stored document, or null when there is none
 * @param {{ a: Object[], b: Object[] }} sides - already checked (validateCrate)
 * @returns {{ data: { _schemaVersion: number, rev: number, sideA: Object[], sideB: Object[], previous: Object }, changed: string[] }}
 *   `changed` empty: there is nothing to save
 */
export function buildCrateSave(live, sides) {
    const stored = isPlainMap(live) ? live : {}
    const next = { sideA: sides.a, sideB: sides.b }
    const previous = {}
    const changed = []
    for (const field of ['sideA', 'sideB']) {
        const before = Array.isArray(stored[field]) ? stored[field] : null
        if (before && sameSide(before, next[field])) continue
        previous[field] = before
        changed.push(field)
    }
    return {
        data: {
            _schemaVersion: Math.max(CRATE_SCHEMA_VERSION, Number.isInteger(stored._schemaVersion) ? stored._schemaVersion : 0),
            rev: (Number.isInteger(stored.rev) ? stored.rev : 0) + 1,
            sideA: next.sideA,
            sideB: next.sideB,
            previous
        },
        changed
    }
}
