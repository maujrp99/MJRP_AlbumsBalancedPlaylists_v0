// Each engine-dependent feature on its own, measured on the engine (not taken from memory).
// Syntax features go through `new Function` so that one the engine cannot parse fails alone.
const results = {}
const probe = (name, fn) => {
    try {
        const value = fn()
        results[name] = value === undefined ? '<undefined>' : value
    } catch (error) {
        results[name] = { threw: `${error && error.name}: ${error && error.message}` }
    }
}
const codepoints = (s) => Array.from(s, c => c.codePointAt(0).toString(16)).join(' ')
const syntax = (src) => new Function(src)()

// --- crypto -------------------------------------------------------------------------------------
probe('crypto: typeof crypto', () => typeof crypto)
probe('crypto.randomUUID: typeof', () => typeof crypto.randomUUID)
probe('crypto.randomUUID: v4 format', () => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(crypto.randomUUID()))
probe('crypto.getRandomValues: typeof', () => typeof crypto.getRandomValues)

// --- Intl and locale-sensitive comparison ---------------------------------------------------------
const names = ['the beatles', 'sigur rós', 'pitty', 'кино', '宇多田ヒカル', 'banda exemplo', 'Ágætis', 'zé', 'a10', 'a2', 'A1', 'á1', 'b', 'ñu', 'nz', 'ελευθερία', 'barış manço']
probe('Intl: typeof', () => typeof Intl)
probe('Intl: keys', () => Object.getOwnPropertyNames(Intl).sort().join(','))
probe('localeCompare (no options): sort', () => names.slice().sort((a, b) => a.localeCompare(b)))
probe('localeCompare numeric: sort', () => names.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true })))
probe('localeCompare numeric: "Mix 10" vs "Mix 9"', () => 'Mix 10'.localeCompare('Mix 9', undefined, { numeric: true }))
probe('Intl.Collator numeric: sort', () => names.slice().sort(new Intl.Collator(undefined, { numeric: true }).compare))
probe('Intl.Collator sensitivity base: a/á/A', () => { const c = new Intl.Collator(undefined, { sensitivity: 'base' }); return [c.compare('a', 'á'), c.compare('a', 'A'), c.compare('a', 'b')] })
probe('Intl.Collator sensitivity accent: a/á/A', () => { const c = new Intl.Collator(undefined, { sensitivity: 'accent' }); return [c.compare('a', 'á'), c.compare('a', 'A')] })
probe('Intl.Collator: resolved locale', () => new Intl.Collator().resolvedOptions().locale)
probe('Intl.DateTimeFormat: resolved locale and timeZone', () => { const o = new Intl.DateTimeFormat().resolvedOptions(); return `${o.locale} ${o.timeZone}` })
const instant = new Date(Date.UTC(2026, 10, 20, 14, 5, 9))
probe('toLocaleDateString en-GB {day numeric, month short, year numeric}', () => instant.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))
probe('toLocaleTimeString en-GB {2-digit hour/minute}', () => instant.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }))
probe('toLocaleTimeString [] {2-digit hour/minute}', () => instant.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }))
probe('toLocaleString en-US {min/max fraction 2}', () => [1166.505, 1234567.891, 0, -3.2].map(n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })))
probe('Intl.NumberFormat currency EUR de-DE', () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5))

// --- Unicode text -------------------------------------------------------------------------------
probe('normalize NFD: Ágætis byrjun', () => codepoints('Ágætis byrjun'.normalize('NFD')))
probe('normalize NFD: й Ё', () => codepoints('й Ё'.normalize('NFD')))
probe('normalize NFKD: ﬁ （ＡＣＯＵＳＴＩＣ） ｱﾏｲﾜﾅ', () => 'ﬁ （ＡＣＯＵＳＴＩＣ） ｱﾏｲﾜﾅ'.normalize('NFKD'))
probe('normalize NFC of NFD round trip', () => 'Ágætis Sigur Rós'.normalize('NFD').normalize('NFC') === 'Ágætis Sigur Rós')
probe('normalize: bad form throws RangeError', () => { try { 'a'.normalize('XYZ'); return 'no throw' } catch (e) { return e.name } })
probe('diacritics stripped (the identity rules\' key)', () => 'Ágætis byrjun Víðrar Ёлка Mötley Crüe'.normalize('NFD').replace(/[̀-ͯ]/g, ''))
probe('toLowerCase: ΟΔΟΣ (final sigma)', () => 'ΟΔΟΣ'.toLowerCase())
probe('toLowerCase: İstanbul (dotted I)', () => codepoints('İstanbul'.toLowerCase()))
probe('toUpperCase: ß', () => 'straße'.toUpperCase())

// --- regular expressions ------------------------------------------------------------------------
probe('\\p{L}\\p{N} with u (literal)', () => 'Ágætis byrjun — 甘いワナ ～Paint It, Black / Группа крови №5 ٣'.replace(/[^\p{L}\p{N}]+/gu, ' '))
probe('\\p{} built at run time (new RegExp)', () => new RegExp('[\\p{L}\\p{N}]+', 'gu').exec('...Ёлка!')[0])
probe('lookbehind (?<=\\S)- and (?<!…) built at run time', () => [/\s-(?=\S)|(?<=\S)-\s/.test('Low- Life'), new RegExp('(?<![\\p{L}\\p{N}])(?:cream)(?![\\p{L}\\p{N}])', 'iu').test('Scream'), new RegExp('(?<![\\p{L}\\p{N}])(?:cream)(?![\\p{L}\\p{N}])', 'iu').test('the Cream live')])
probe('named groups', () => /(?<year>\d{4}) (?<kind>Mix|Remaster)/.exec('Abbey Road (2019 Mix)').groups)
probe('matchAll + replaceAll', () => [[...'a: b - c: d'.matchAll(/:\s+|\s+[-–—]\s+/g)].map(m => m.index), 'a-b-c'.replaceAll('-', '+')])
probe('regex flag v (unicodeSets)', () => syntax("return /[\\p{L}--[a-z]]/v.test('é')"))

// --- newer built-ins ----------------------------------------------------------------------------
probe('structuredClone: typeof', () => typeof structuredClone)
probe('queueMicrotask: typeof', () => typeof queueMicrotask)
probe('Array.prototype.toSorted', () => [3, 1, 2].toSorted())
probe('Array.prototype.at', () => [1, 2, 3].at(-1))
probe('Array.prototype.findLast', () => [1, 2, 3, 4].findLast(n => n % 2 === 1))
probe('Object.groupBy', () => Object.groupBy([1, 2, 3], n => (n % 2 ? 'odd' : 'even')))
probe('Object.hasOwn', () => Object.hasOwn({ i: 1 }, 'i'))
probe('Array.prototype.flatMap', () => [[1], [2, 3]].flatMap(x => x))
probe('Promise.withResolvers', () => typeof Promise.withResolvers)
probe('URLSearchParams: typeof', () => typeof URLSearchParams)
probe('TextEncoder: typeof', () => typeof TextEncoder)
probe('setTimeout: typeof', () => typeof setTimeout)
probe('console: typeof', () => typeof console)

// --- syntax ------------------------------------------------------------------------------------
probe('optional chaining and ??', () => syntax('const o = { a: null }; return [o?.a?.b ?? "none", o.x?.()]'))
probe('logical assignment ??= ||=', () => syntax('let a = null; a ??= 1; let b = 0; b ||= 2; return [a, b]'))
probe('class static fields', () => syntax('class A { static m = { id: "x" } } return A.m.id'))
probe('class private fields and methods', () => syntax('class A { #x = 1; #y() { return this.#x + 1 } get v() { return this.#y() } } return new A().v'))
probe('class static block', () => syntax('class A { static v; static { A.v = 7 } } return A.v'))
probe('spread, destructuring, generators', () => syntax('function* g() { yield 1; yield 2 } const [a, ...b] = [...g(), 3]; return [a, b]'))
probe('async/await', () => syntax('return typeof (async () => 1)()'))
probe('BigInt', () => syntax('return String(2n ** 64n)'))
probe('label + numeric separators', () => syntax('return 1_000_000'))

// --- Date parsing of the formats the code meets ---------------------------------------------------
probe('Date.parse formats', () => ({
    isoZ: Date.parse('2026-11-20T13:34:00.000Z'),
    isoDateOnly: Date.parse('2026-11-20'),
    isoLocalNoZ_minus_isoZ: Date.parse('2026-11-20T13:34:00') - Date.parse('2026-11-20T13:34:00Z'),
    rfc1123: Date.parse('Fri, 20 Nov 2026 13:34:00 GMT'),
    dayMonthYear: Date.parse('20 Nov 2026'),
    monthDayYear: Date.parse('November 20, 2026'),
    year: Date.parse('2026'),
    garbage: String(Date.parse('not a date')),
    empty: String(Date.parse(''))
}))
probe('new Date(ms).toISOString()', () => new Date(1795268040000).toISOString())
probe('Date timezone offset (minutes) at the instant', () => instant.getTimezoneOffset())

// --- sort stability and numbers -----------------------------------------------------------------
probe('Array.prototype.sort is stable (2000 items, 3 keys)', () => {
    const items = Array.from({ length: 2000 }, (_, i) => ({ i, k: (i * 7) % 3 }))
    const sorted = items.slice().sort((a, b) => a.k - b.k)
    return sorted.every((x, j) => j === 0 || sorted[j - 1].k < x.k || sorted[j - 1].i < x.i)
})
probe('sort with comparator returning NaN/undefined keeps order', () => [3, 1, 2].sort(() => NaN).join(','))
probe('numbers: JSON and toString', () => [String(0.1 + 0.2), JSON.stringify([1e21, 1e-7, -0, 5e-324, 123456789012345680000]), (1.005).toFixed(2), (123.456).toFixed(1), Math.round(-0.5), Math.round(2.5)])
probe('Math.max of empty spread', () => Math.max(...[]))
probe('engine error text for null.x', () => { try { null.x; return 'no throw' } catch (e) { return `${e.name}: ${e.message}` } })

// queueMicrotask actually runs, and only then the results are emitted
let microtaskRan = false
try { queueMicrotask(() => { microtaskRan = true }) } catch (e) { results['queueMicrotask: runs'] = { threw: `${e.name}: ${e.message}` } }
Promise.resolve().then(() => Promise.resolve()).then(() => {
    if (!('queueMicrotask: runs' in results)) results['queueMicrotask: runs'] = microtaskRan
    globalThis.__emit(JSON.stringify(results, null, 1))
})
