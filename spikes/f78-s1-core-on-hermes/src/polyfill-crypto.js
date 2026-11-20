// The stand-in for the id generator on bare Hermes, which has no `crypto` (measured: typeof crypto
// === 'undefined'). It is a SPIKE stand-in, not the app's: it draws from a xorshift128+ generator
// seeded by the clock, which is fine to prove the rules run and give distinct v4 ids, and is NOT a
// cryptographic source. The app gets its ids from a native source (expo-crypto's randomUUID, or
// react-native-get-random-values under crypto.getRandomValues) — see the report.
;(function () {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') return
    let s0 = (Date.now() ^ 0x9e3779b9) >>> 0
    let s1 = 0x85ebca6b ^ s0
    let s2 = 0xc2b2ae35
    let s3 = 0x27d4eb2f ^ (s0 << 7)
    const next = () => {
        const t = s0 ^ (s0 << 11)
        s0 = s1; s1 = s2; s2 = s3
        s3 = (s3 ^ (s3 >>> 19) ^ t ^ (t >>> 8)) >>> 0
        return s3
    }
    for (let i = 0; i < 32; i++) next()
    const getRandomValues = (array) => {
        for (let i = 0; i < array.length; i++) array[i] = next() & 0xff
        return array
    }
    const hex = (n) => (n + 0x100).toString(16).slice(1)
    const randomUUID = () => {
        const b = getRandomValues(new Uint8Array(16))
        b[6] = (b[6] & 0x0f) | 0x40
        b[8] = (b[8] & 0x3f) | 0x80
        const h = Array.from(b, hex)
        return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`
    }
    globalThis.crypto = { randomUUID, getRandomValues }
})()
