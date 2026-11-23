/**
 * The crate of the entry page as the Painel saves it (shared/content/crate.js), for the rules test
 * (test/security/firestoreRules.emulator.js): albums a side, the front record first.
 */
export const crateAlbum = (id, over = {}) => ({
    id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990, art: `Music1/v4/${id}/cover.jpg`, href: `https://music.apple.com/us/album/a/${id}`, ...over
})
export const crateSide = (from, count) => Array.from({ length: count }, (_, i) => crateAlbum(from + i))
export const CRATE = Object.freeze({ _schemaVersion: 1, rev: 1, sideA: crateSide(1, 6), sideB: crateSide(20, 4) })
