/**
 * textsSave - what a save of the Painel writes, and the conflict between two devices (F82, REQ-08, REQ-09; ADR-0024).
 *
 * Pure: the repository (shared/data/PublishedContentRepository.js) calls these inside its transaction. A save writes the
 * whole `published/texts_*` document: `rev` is the stored one plus one (the rules refuse anything else) and `previous`
 * holds the earlier value ONLY of the keys this save changed, so it covers the last save alone. An edit is a text, or
 * `null` to take the key out of the published document (the site goes back to the code's text).
 */
import { TEXTS_SCHEMA_VERSION } from './texts.js'

const isMap = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const textsOf = (data) => (isMap(data) && isMap(data.texts) ? data.texts : {})
const valueIn = (texts, key) => (Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : null)

/**
 * @param {Object|null} live - the stored document, or null when there is none
 * @param {Record<string, string|null>} edits
 * @returns {{ data: { _schemaVersion: number, rev: number, texts: Object, previous: Object }, changed: string[] }}
 *   `changed` empty: there is nothing to save
 */
export function buildTextsSave(live, edits) {
    const texts = { ...textsOf(live) }
    const previous = {}
    const changed = []
    for (const key of Object.keys(edits || {})) {
        const next = edits[key]
        if (next !== null && typeof next !== 'string') throw new TypeError(`buildTextsSave: the edit of "${key}" is not a text nor null`)
        const before = valueIn(texts, key)
        if (before === next) continue
        previous[key] = before
        changed.push(key)
        if (next === null) delete texts[key]
        else texts[key] = next
    }
    const stored = isMap(live) ? live : {}
    return {
        data: {
            _schemaVersion: Math.max(TEXTS_SCHEMA_VERSION, Number.isInteger(stored._schemaVersion) ? stored._schemaVersion : 0),
            rev: (Number.isInteger(stored.rev) ? stored.rev : 0) + 1,
            texts,
            previous
        },
        changed
    }
}

/**
 * The keys this device wants to change that another device changed in between, to another value.
 * @param {{ loaded: Object, live: Object, edits: Record<string, string|null> }} sides - `loaded`: the texts this device
 *   had read; `live`: the texts stored now; a key that is not in a map is not published (told as null)
 * @returns {Array<{ key: string, loaded: string|null, other: string|null, yours: string|null }>}
 */
export function findTextConflicts({ loaded, live, edits }) {
    const read = isMap(loaded) ? loaded : {}
    const stored = isMap(live) ? live : {}
    return Object.keys(edits || {}).flatMap(key => {
        const before = valueIn(read, key)
        const other = valueIn(stored, key)
        const yours = edits[key]
        return other !== before && other !== yours ? [{ key, loaded: before, other, yours }] : []
    })
}
