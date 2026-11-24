/**
 * The crate of the entry page as the Painel saves it (shared/content/crate.js), for the rules test
 * (test/security/firestoreRules.emulator.js): a side is a list of lines, one album a line, the front record first.
 */
import { encodeAlbum } from '../../../shared/content/crate.js'

export const crateAlbum = (id, over = {}) => ({
    id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990, art: `Music1/v4/${id}/cover.jpg`, href: `https://music.apple.com/us/album/a/${id}`, ...over
})
export const crateAlbums = (from, count) => Array.from({ length: count }, (_, i) => crateAlbum(from + i))
/** A line as the Painel writes it, from an album (the album is NOT checked here: a test may ask for a bad one). */
export const crateLine = (id, over = {}) => encodeAlbum(crateAlbum(id, over))
export const crateSide = (from, count) => crateAlbums(from, count).map(encodeAlbum)
export const CRATE = Object.freeze({ _schemaVersion: 1, rev: 1, sideA: crateSide(1, 6), sideB: crateSide(20, 4) })
/** The longest line the Painel's check lets through (shared/content/crate.js), for the largest save. */
export const longestLine = (id) => crateLine(id, { id: String(id).padStart(64, '0'), title: 'T'.repeat(200), artist: 'A'.repeat(200), art: `Music1/${'a'.repeat(288)}.jpg`, href: `https://music.apple.com/${'x'.repeat(470)}` })
