/**
 * switches - the feature switches of the CMS, and the one validator of them (F93, REQ-05; ADR-0024).
 *
 * The Painel, the site and the server read the same document (`published/site`, `switches`) and
 * check it with this module: a CLOSED list of three keys, each true or false. A key out of the list
 * or of another type is refused ALONE, and the others go on. Pure: no Firebase, no `fetch`, no
 * global (test/architecture/coreStaysPortable.test.js covers it with no exception); how the
 * document is read is each side's own business.
 *
 * Each switch declares:
 *   default       the value when the document was read and the key is not in it (nothing was said)
 *   whenUnknown   what a reader does when there is no reading and no copy that turns it off:
 *                   'ask-server'    the site asks the server, which answers on / off / unknown
 *                   'follow-build'  the site's own build setting decides (usage measurement, F77)
 *                   'closed'        the function stays closed (the site speaks English, as today)
 *   onlyTurnsOff  the CMS can only turn it OFF (usage measurement: it follows the build, and the
 *                 CMS may only switch it off); a reader never turns it on from the CMS alone
 * "Unknown" (no reading) is not "off": the readers keep the reason, they do not turn it into false.
 */

const entry = (fields) => Object.freeze(fields)

/** The closed list. A new switch is a new line here, nothing else (and the rules: firestore.rules). */
export const SWITCHES = Object.freeze({
    discogsValues: entry({ id: 'discogsValues', default: false, whenUnknown: 'ask-server', onlyTurnsOff: false }),
    usageMeasurement: entry({ id: 'usageMeasurement', default: true, whenUnknown: 'follow-build', onlyTurnsOff: true }),
    portugueseForAll: entry({ id: 'portugueseForAll', default: false, whenUnknown: 'closed', onlyTurnsOff: false })
})

export const SWITCH_IDS = Object.freeze(Object.keys(SWITCHES))

export const REASON_NOT_A_MAP = 'not_a_map'
export const REASON_UNKNOWN_KEY = 'unknown_key'
export const REASON_NOT_BOOLEAN = 'not_boolean'

const isPlainMap = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

const inList = (key) => Object.prototype.hasOwnProperty.call(SWITCHES, key)

/**
 * Checks the `switches` map of a published document, key by key.
 * @param {*} input - what was read
 * @returns {{ values: Object<string, boolean>, rejected: Array<{ key: string|null, reason: string }> }}
 *   `values` has only the keys of the list that came as a real true or false (a copy, in the order
 *   of the input); `rejected` says each key refused and why, or one entry with `key: null` when the
 *   input is not a map at all
 */
export function validateSwitches(input) {
    if (!isPlainMap(input)) return { values: {}, rejected: [{ key: null, reason: REASON_NOT_A_MAP }] }
    const values = {}
    const rejected = []
    for (const key of Object.keys(input)) {
        if (!inList(key)) rejected.push({ key, reason: REASON_UNKNOWN_KEY })
        else if (typeof input[key] !== 'boolean') rejected.push({ key, reason: REASON_NOT_BOOLEAN })
        else values[key] = input[key]
    }
    return { values, rejected }
}

/**
 * The value of a switch: what was read, else its default.
 * @param {string} id - a key of the list
 * @param {Object<string, boolean>} values - the `values` of validateSwitches
 * @returns {boolean}
 */
export function switchValue(id, values) {
    if (!inList(id)) throw new Error(`switchValue: "${id}" is not a switch of the list`)
    return typeof values?.[id] === 'boolean' ? values[id] : SWITCHES[id].default
}
