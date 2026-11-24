/**
 * crate - the crate of albums of the entry page as the CMS publishes it, and the one validator of it (F82, REQ-03, REQ-11;
 * F95; ADR-0024).
 *
 * The Painel checks the crate with this module before saving and the entry page checks it again on reading: the same rule
 * in the two places. Pure: no Firebase, no `fetch`, no global (test/architecture/coreStaysPortable.test.js).
 *
 * The published document (`published/crate`):
 *   { _schemaVersion, rev, sideA: [line], sideB: [line] }
 * Each side is in the order the owner sees it, THE FRONT RECORD FIRST. An album is stored as ONE LINE OF TEXT, its six
 * values joined by «<» (encodeAlbum, decodeAlbum): `title<artist<year<id<artwork path<Apple Music address`. Why a line and
 * not a map: the database's rules cannot loop and evaluate at most 1000 expressions a save, and a line is checked whole with
 * one match, which leaves room to check every value of twenty albums (firestore.rules, validCrateRecord). Everywhere else
 * an album is a plain record of exactly what the entry page needs:
 *   id      a short name (Apple's catalogue id, or the key of the fixed set): 1 to 64 of A-Z a-z 0-9 _ -
 *   title   the album's name, as text: not empty, no < nor >, no control nor direction-changing character, not made of
 *           invisible characters only, up to 200 characters
 *   artist  the same rule
 *   year    a whole number of four digits
 *   art     the PATH of the artwork on Apple's image server (never an address: the page writes the server itself):
 *           segments of A-Z a-z 0-9 _ - with single dots inside, between single slashes; no «..», no % and no backslash,
 *           so nothing in it, encoded or not, can leave the artwork folder
 *   href    the album's page on Apple Music (https://music.apple.com/… in printable ASCII, no < nor >)
 * A bad album is refused ALONE and the others go on; the same album twice stays once. Then each side must hold what the
 * crate can draw (CRATE_LIMITS), or the whole crate is refused and the entry page keeps its fixed set.
 * The earlier value of a save (F82, REQ-08) is NOT in the public document: the repository keeps it in the Painel's work
 * area, which only the administrator reads, so no visitor downloads it.
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
/** The address after the server's: what the database's rules allow (firestore.rules). */
const MAX_LINK_CHARS = LISTEN_SERVER.length + 470

export const REASON_NOT_AN_ALBUM = 'not_an_album'
export const REASON_ID = 'id'
export const REASON_NOT_TEXT = 'not_text'
export const REASON_EMPTY = 'empty'
export const REASON_MARKUP = 'markup'
export const REASON_CHARACTERS = 'characters'
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

/** Characters a name never needs and that can deceive: control characters, and the marks that change the direction of the text. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point of this rule
const DECEIVING = /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/
/** Characters that draw nothing: a name made only of them (and spaces) is an empty name. */
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g

/** The rule of a name (title, artist) that is broken, or null: the plain text rule of the site's texts, and no deceiving character. */
function brokenName(text) {
    if (typeof text !== 'string') return REASON_NOT_TEXT
    if (DECEIVING.test(text)) return REASON_CHARACTERS
    if (text.replace(INVISIBLE, '').trim() === '') return REASON_EMPTY
    if (/[<>]/.test(text)) return REASON_MARKUP
    return text.length > MAX_NAME_CHARS ? REASON_TOO_LONG : null
}

/**
 * A path inside the artwork folder, never an address (the same rule as the database's: firestore.rules): two or more
 * segments of letters, digits, _ and -, with single dots inside, between single slashes. No % and no backslash: a dot
 * written as %2e would be read as a dot by the image server, and «..» would leave the folder.
 */
const ART_SEGMENT = '[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*'
const ART_PATH = new RegExp(`^${ART_SEGMENT}(?:/${ART_SEGMENT})+$`)
const isArtPath = (art) => typeof art === 'string' && art.length <= MAX_ART_CHARS && ART_PATH.test(art)

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
const isId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id)

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

/** The mark between the six values of an album's line: none of the values can hold it. */
const MARK = '<'

/**
 * An album as its line of the published document: `title<artist<year<id<artwork path<Apple Music address`.
 * @param {{ id: string, title: string, artist: string, year: number, art: string, href: string }} album - already checked
 * @returns {string}
 */
export const encodeAlbum = (album) => [album.title, album.artist, album.year, album.id, album.art, album.href].join(MARK)

/**
 * The album of a line of the published document, NOT yet checked (validateAlbum does it). What is not a line of six values
 * comes back as it is, and the check refuses it as «not an album».
 * @param {*} line
 * @returns {Object|*}
 */
export function decodeAlbum(line) {
    const parts = typeof line === 'string' ? line.split(MARK) : []
    if (parts.length !== 6) return line
    const [title, artist, year, id, art, href] = parts
    return { id, title, artist, year: /^[1-9][0-9]{3}$/.test(year) ? Number(year) : year, art, href }
}

/**
 * The shape of the `published/crate` document, with each line read as an album. A newer version of the shape is read in the
 * fields known here. The albums are NOT checked here (validateCrate does it).
 * @param {*} data
 * @returns {{ ok: true, rev: number, sideA: Array, sideB: Array } | { ok: false, reason: string }}
 */
export function readCrateDocument(data) {
    if (!isPlainMap(data) || !Array.isArray(data.sideA) || !Array.isArray(data.sideB)) return refused(REASON_NOT_A_CRATE)
    // only a line is an album of the document: anything else stored in a place (a map, a number) is no album at all
    const albumsOf = (lines) => lines.map(line => (typeof line === 'string' ? decodeAlbum(line) : null))
    return { ok: true, rev: Number.isInteger(data.rev) ? data.rev : 0, sideA: albumsOf(data.sideA), sideB: albumsOf(data.sideB) }
}

const sameLines = (one, other) => one.length === other.length && one.every((line, i) => line === other[i])

/**
 * What a save of the crate writes: the whole document - the two sides as lines, `rev` the stored one plus one (the rules
 * refuse anything else) - and, apart, the earlier value ONLY of the side this save changed (null when there was none), which
 * covers the last save alone (F82, REQ-08) and goes to the Painel's work area, never to the public document.
 * @param {Object|null} live - the stored document, or null when there is none
 * @param {{ a: Object[], b: Object[] }} sides - already checked (validateCrate)
 * @returns {{ data: { _schemaVersion: number, rev: number, sideA: string[], sideB: string[] }, previous: Object, changed: string[] }}
 *   `changed` empty: there is nothing to save
 */
export function buildCrateSave(live, sides) {
    const stored = isPlainMap(live) ? live : {}
    const next = { sideA: sides.a.map(encodeAlbum), sideB: sides.b.map(encodeAlbum) }
    const previous = {}
    const changed = []
    for (const field of ['sideA', 'sideB']) {
        const before = Array.isArray(stored[field]) ? stored[field] : null
        if (before && sameLines(before, next[field])) continue
        previous[field] = before
        changed.push(field)
    }
    return {
        data: {
            _schemaVersion: Math.max(CRATE_SCHEMA_VERSION, Number.isInteger(stored._schemaVersion) ? stored._schemaVersion : 0),
            rev: (Number.isInteger(stored.rev) ? stored.rev : 0) + 1,
            sideA: next.sideA,
            sideB: next.sideB
        },
        previous,
        changed
    }
}
