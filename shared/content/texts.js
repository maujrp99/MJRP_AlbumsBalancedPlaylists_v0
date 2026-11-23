/**
 * texts - the one validator of the texts the CMS publishes (F82, REQ-06, REQ-12, REQ-14; ADR-0024).
 *
 * The Painel checks a text with it before saving, every visitor's site checks it again on reading, and the entry page
 * will too: the same rule in the three places. Pure: no Firebase, no `fetch`, no global
 * (test/architecture/coreStaysPortable.test.js covers it with no exception).
 *
 * A text is checked against the ENGLISH of the code (the reserve), by the KIND of its key:
 *   plain  not empty, the same {placeholders} as the English, no < nor >, up to 3 times the English length
 *          (a warning from 1.5 times)
 *   rich   stored as the kit's Markdown, never HTML: the plain rules minus «no < nor >», and a reader of rich text,
 *          handed in (`parseRich(text) -> { ok, links[] }`), must say it reads; every link must be `https:`, `mailto:`
 *          or a path of the site
 *   short  the short bar of a label (bold, italic, link): rich, with no line break
 * The kit's own pure core is the reader to hand in when it arrives (harness F332); until then `basicParseRich` stands in.
 */

export const TEXTS_SCHEMA_VERSION = 1

export const KIND_PLAIN = 'plain'
export const KIND_SHORT = 'short'
export const KIND_RICH = 'rich'

export const MAX_TIMES_ENGLISH = 3
export const WARN_TIMES_ENGLISH = 1.5

export const REASON_NOT_TEXT = 'not_text'
export const REASON_EMPTY = 'empty'
export const REASON_PLACEHOLDERS = 'placeholders'
export const REASON_MARKUP = 'markup'
export const REASON_TOO_LONG = 'too_long'
export const REASON_UNKNOWN_KEY = 'unknown_key'
export const REASON_RICH_UNREADABLE = 'rich_unreadable'
export const REASON_LINK_NOT_ALLOWED = 'link_not_allowed'
export const REASON_LINE_BREAK = 'line_break'
export const REASON_NOT_A_DOCUMENT = 'not_a_document'
export const REASON_NO_TEXTS = 'no_texts'

export const WARNING_LONG = 'long'

const isPlainMap = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

const own = (map, key) => Object.prototype.hasOwnProperty.call(map, key)

/**
 * The {placeholders} of a text, each once, in alphabetical order.
 * @param {string} text
 * @returns {string[]}
 */
export function placeholdersOf(text) {
    return [...new Set(String(text).match(/\{\w+\}/g) || [])].map(mark => mark.slice(1, -1)).sort()
}

/**
 * A link a published text may carry: `https:`, `mailto:` or a path of the site (`/albums`, never `//host`). No space, no
 * control character and no backslash anywhere in it.
 * @param {*} href
 * @returns {boolean}
 */
export function isAllowedLink(href) {
    if (typeof href !== 'string' || href === '') return false
    for (let i = 0; i < href.length; i++) {
        const code = href.charCodeAt(i)
        if (code <= 32 || code === 127 || code === 92) return false
    }
    if (href[0] === '/') return href[1] !== '/'
    return /^https:\/\/[^/]/i.test(href) || /^mailto:[^@]+@[^@]+$/i.test(href)
}

/**
 * The stand-in reader of rich text, until the kit's pure core is handed in: it refuses raw HTML and collects the links of
 * the Markdown (`[text](href)`, images, `<autolinks>` and `[name]: href` lines). It does not render anything.
 * @param {string} text
 * @returns {{ ok: boolean, links: string[] }}
 */
export function basicParseRich(text) {
    const links = []
    const noAutolinks = String(text).replace(/<([a-zA-Z][a-zA-Z0-9+.-]*:[^\s<>]*)>/g, (whole, href) => { links.push(href); return '' })
    if (/<\s*[a-zA-Z/!?]/.test(noAutolinks)) return { ok: false, links: [] }
    for (const match of noAutolinks.matchAll(/\]\(\s*([^)\s]*)[^)]*\)/g)) links.push(match[1])
    for (const match of noAutolinks.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)) links.push(match[1])
    return { ok: true, links }
}

function readRich(text, parseRich) {
    try {
        const read = parseRich(text)
        return read && read.ok === true && Array.isArray(read.links) ? read.links : null
    } catch {
        return null
    }
}

const refused = (reason) => ({ ok: false, reason })
const isRich = (kind) => kind === KIND_RICH || kind === KIND_SHORT

/** The first rule of every kind that a text breaks, or null. */
function brokenRule(text, english, kind) {
    if (typeof text !== 'string') return REASON_NOT_TEXT
    if (text.trim() === '') return REASON_EMPTY
    if (kind === KIND_SHORT && /[\r\n]/.test(text)) return REASON_LINE_BREAK
    if (!isRich(kind) && /[<>]/.test(text)) return REASON_MARKUP
    if (placeholdersOf(text).join() !== placeholdersOf(english).join()) return REASON_PLACEHOLDERS
    return text.length > MAX_TIMES_ENGLISH * String(english).length ? REASON_TOO_LONG : null
}

/** The links of a rich text, or the reason it is refused. */
function richLinks(text, parseRich) {
    const links = readRich(text, parseRich)
    if (links === null) return { reason: REASON_RICH_UNREADABLE }
    return links.every(isAllowedLink) ? { links } : { reason: REASON_LINK_NOT_ALLOWED }
}

const warningOf = (length, reserve) => (length >= WARN_TIMES_ENGLISH * reserve && length > reserve ? WARNING_LONG : null)

/**
 * Checks one text against the English of the code, by the kind of its key.
 * @param {*} text - what was typed, or read
 * @param {string} english - the code's English text of the same key
 * @param {{ kind?: string, parseRich?: (text: string) => { ok: boolean, links: string[] } }} [options]
 * @returns {{ ok: true, warning: string|null, links: string[] } | { ok: false, reason: string }}
 */
export function validateText(text, english, { kind = KIND_PLAIN, parseRich = basicParseRich } = {}) {
    const broken = brokenRule(text, english, kind)
    if (broken) return refused(broken)
    const rich = isRich(kind) ? richLinks(text, parseRich) : { links: [] }
    if (rich.reason) return refused(rich.reason)
    return { ok: true, warning: warningOf(text.length, String(english).length), links: rich.links }
}

/**
 * Checks a map of texts key by key: one bad key is refused ALONE, the others go on.
 * @param {*} texts - key -> text, as read or as about to be saved
 * @param {Record<string, string>} english - the code's English dictionary
 * @param {{ kindOf?: (key: string) => string, parseRich?: Function }} [options]
 * @returns {{ values: Record<string, string>, rejected: Array<{ key: string, reason: string }>, warnings: Array<{ key: string, warning: string }> }}
 *   a key the English does not have is refused as `unknown_key` (the Painel's «orphan»)
 */
export function validateTexts(texts, english, { kindOf = () => KIND_PLAIN, parseRich = basicParseRich } = {}) {
    const values = {}
    const rejected = []
    const warnings = []
    if (!isPlainMap(texts)) return { values, rejected, warnings }
    for (const key of Object.keys(texts)) {
        if (!own(english, key) || typeof english[key] !== 'string') { rejected.push({ key, reason: REASON_UNKNOWN_KEY }); continue }
        const result = validateText(texts[key], english[key], { kind: kindOf(key), parseRich })
        if (!result.ok) { rejected.push({ key, reason: result.reason }); continue }
        values[key] = texts[key]
        if (result.warning) warnings.push({ key, warning: result.warning })
    }
    return { values, rejected, warnings }
}

/**
 * The shape of a `published/texts_*` document: a map of texts and the sequence of the saves. A newer version of the shape
 * is read in the fields known here.
 * @param {*} data
 * @returns {{ ok: true, rev: number, texts: Record<string, *> } | { ok: false, reason: string }}
 */
export function readTextsDocument(data) {
    if (!isPlainMap(data)) return refused(REASON_NOT_A_DOCUMENT)
    if (!isPlainMap(data.texts)) return refused(REASON_NO_TEXTS)
    return { ok: true, rev: Number.isInteger(data.rev) ? data.rev : 0, texts: { ...data.texts } }
}
