// The same harness on every engine. It makes two things that are random or about the moment
// comparable, and nothing else:
// - Math.random is replaced by a seeded generator (mulberry32), re-seeded before each case, so the
//   «shuffle» grouping draws the same numbers on Node and on Hermes. What is compared is the
//   recipe's use of the numbers, not the engine's random source (which differs by design).
// - console is replaced by a collector (bare Hermes has no console; React Native adds one). What
//   the rules log is part of the output and is compared too.
// The id generator is NOT replaced: see canon.js for how generated ids are compared.

let state = 0
function mulberry32() {
    state = (state + 0x6D2B79F5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function seedRandom(seed) {
    state = seed | 0
}

let logs = []
const text = (value) => {
    if (typeof value === 'string') return value
    try { return JSON.stringify(value) } catch { return String(value) }
}

export function installHarness() {
    Math.random = mulberry32
    const collect = (level) => (...args) => { logs.push(`${level} ${args.map(text).join(' ')}`) }
    globalThis.console = {
        log: collect('log'), info: collect('info'), warn: collect('warn'),
        error: collect('error'), debug: collect('debug')
    }
}

export const takeLogs = () => { const taken = logs; logs = []; return taken }
