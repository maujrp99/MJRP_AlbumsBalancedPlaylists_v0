/**
 * text - the engine-dependent handling of text the core uses, in one place (F78, REQ-08).
 *
 * `String.prototype.normalize` is answered by each engine's own Unicode tables: the browser's, Node's
 * ICU, Hermes on the iPhone (CoreFoundation) and Hermes on Android (Java). Spike S1 measured the
 * iPhone equal to Node; Android is still to be measured. Keeping the call here makes every use of it
 * visible and measurable, and the sensor test/architecture/coreStaysPortable.test.js refuses it
 * anywhere else in shared/.
 *
 * Pure: no import, no global.
 */

/**
 * The text in a Unicode normal form ('NFD' splits a letter from its accent: «á» is «a» and «◌́»).
 * @param {string} text
 * @param {'NFC'|'NFD'|'NFKC'|'NFKD'} form
 * @returns {string}
 */
export function normalizeText(text, form) {
    return String(text).normalize(form)
}
