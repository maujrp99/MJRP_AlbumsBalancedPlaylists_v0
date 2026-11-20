// Canonical form of an output, computed INSIDE the engine under test (so the text compared is the
// engine's own JSON.stringify):
// - object keys sorted;
// - a UUID that was not in the input is a GENERATED id: it is written as «<new-id-N>», N being the
//   order in which it first appears in the case (so «the same new id in two places» is still
//   compared), and checked apart: v4 format, never seen before in the whole run;
// - the moment the rules stamp (`timestamp`, `lastUpdated`, from new Date().toISOString()) is
//   written as «<now>» after checking it is an ISO-8601 instant.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const STAMPS = new Set(['timestamp', 'lastUpdated'])

export const idReport = { generated: 0, notV4: 0, repeated: 0, badStamps: 0 }
const everGenerated = new Set()
let inputIds = new Set()

/** Every UUID-looking text of the inputs: those are data, not generated. */
export function rememberInputIds(input) {
    const walk = (value) => {
        if (typeof value === 'string') { if (UUID.test(value)) inputIds.add(value) }
        else if (Array.isArray(value)) value.forEach(walk)
        else if (value && typeof value === 'object') Object.keys(value).forEach(k => walk(value[k]))
    }
    walk(input)
}

export function canon(value) {
    const newIds = new Map()
    const seen = new WeakSet()
    const walk = (v, key) => {
        if (typeof v === 'string') {
            if (STAMPS.has(key) && v !== '') {
                if (!ISO_INSTANT.test(v) || Number.isNaN(new Date(v).getTime())) { idReport.badStamps++; return v }
                return '<now>'
            }
            if (UUID.test(v) && !inputIds.has(v)) {
                if (!newIds.has(v)) {
                    newIds.set(v, `<new-id-${newIds.size + 1}>`)
                    idReport.generated++
                    if (!UUID_V4.test(v)) idReport.notV4++
                    if (everGenerated.has(v)) idReport.repeated++
                    everGenerated.add(v)
                }
                return newIds.get(v)
            }
            return v
        }
        if (Array.isArray(v)) return v.map(item => walk(item, null))
        if (v && typeof v === 'object') {
            if (seen.has(v)) return '<cycle>'
            seen.add(v)
            const out = {}
            for (const k of Object.keys(v).sort()) out[k] = walk(v[k], k)
            seen.delete(v)
            return out
        }
        return v
    }
    return walk(value, null)
}
