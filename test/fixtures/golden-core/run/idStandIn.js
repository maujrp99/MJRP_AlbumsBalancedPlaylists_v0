// The id source the Hermes run wires into the id port (shared/platform/newId.js): bare Hermes has no
// `crypto` (spike S1 measured typeof crypto === 'undefined'). It is a STAND-IN, not the app's: a
// xorshift128 generator seeded by the clock gives v4-shaped ids, which proves the rules run and
// that every new id is a distinct v4; it is NOT a cryptographic source. The app wires its own
// native source (expo-crypto's randomUUID) in its own wiring.
export function standInIdSource() {
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
    const hex = (n) => (n + 0x100).toString(16).slice(1)
    return () => {
        const b = Array.from({ length: 16 }, () => next() & 0xff)
        b[6] = (b[6] & 0x0f) | 0x40
        b[8] = (b[8] & 0x3f) | 0x80
        const h = b.map(hex)
        return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`
    }
}
