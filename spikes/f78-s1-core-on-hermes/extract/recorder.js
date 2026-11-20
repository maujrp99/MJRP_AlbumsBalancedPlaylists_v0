// What the recorder keeps: a deep copy of the arguments AT CALL TIME (the rules mutate what they
// get), as JSON. A call with a function or a value JSON cannot carry (undefined inside arrays,
// NaN, a class the rule reads by prototype) is marked `replayable: false` and not replayed.
const records = (globalThis.__s1Records ??= [])

function snapshot(value) {
    let replayable = true
    const json = JSON.stringify(value, function (key, v) {
        if (v === undefined && Array.isArray(this)) { replayable = false; return null }
        if (typeof v === 'function') { replayable = false; return '[function]' }
        if (typeof v === 'number' && !Number.isFinite(v)) { replayable = false; return String(v) }
        if (typeof v === 'bigint' || typeof v === 'symbol') { replayable = false; return String(v) }
        return v
    })
    return { data: json === undefined ? null : JSON.parse(json), replayable }
}

export function recordCall(name, args, call) {
    // A trailing argument left out and one passed as undefined are the same call
    const given = [...args]
    while (given.length && given[given.length - 1] === undefined) given.pop()
    const { data, replayable } = snapshot(given)
    records.push({ kind: 'call', name, args: data, replayable })
    return call()
}

export function recordAlbum(kind, name, album) {
    const { data, replayable } = snapshot(album)
    records.push({ kind, name, album: data, replayable })
}

export function recordGenerate(name, albums, opts) {
    const { rankingStrategy, ...plain } = opts || {}
    const { data, replayable } = snapshot({ albums, opts: plain })
    records.push({
        kind: 'generate', name, albums: data.albums, opts: data.opts,
        rankingStrategy: rankingStrategy?.constructor?.name ?? null, replayable
    })
}

export const takeRecords = () => records.splice(0, records.length)
