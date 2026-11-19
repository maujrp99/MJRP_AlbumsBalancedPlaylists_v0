/**
 * text
 *
 * Text as the person wrote it, whatever was stored (UAT-180): pure functions, no DOM.
 * Some series and album queries were saved with HTML entities in the place of the character
 * ("Jimmy Page &amp; Robert Plant"). Text is stored and compared plain; escaping belongs to the
 * moment of drawing, never to the data.
 */

const NAMED = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })
const ENTITY = /&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,6});/gi
/** Text escaped more than once ("&amp;amp;") is undone layer by layer, up to this many. */
const MAX_LAYERS = 3

function decodeOnce(text) {
    return text.replace(ENTITY, (whole, name) => {
        if (name[0] !== '#') {
            const known = NAMED[name.toLowerCase()]
            return known === undefined ? whole : known
        }
        const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole
        return String.fromCodePoint(code)
    })
}

/**
 * Undo the common HTML entities of a stored text. Text with none comes back as it is;
 * a value that is not a string comes back untouched.
 * @param {*} text
 * @returns {*}
 */
export function decodeEntities(text) {
    if (typeof text !== 'string' || !text.includes('&')) return text
    let current = text
    for (let layer = 0; layer < MAX_LAYERS; layer++) {
        const next = decodeOnce(current)
        if (next === current) break
        current = next
    }
    return current
}
