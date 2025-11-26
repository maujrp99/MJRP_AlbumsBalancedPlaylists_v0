/**
 * Normalizes a string for fuzzy matching/deduplication.
 * Removes diacritics, replaces non-alphanumerics with space, collapses spaces, and lowercases.
 *
 * @param {string} s - The string to normalize.
 * @returns {string} The normalized string.
 */
export function normalizeKey (s) {
  if (!s) return ''
  try {
    // Normalize: NFD -> remove diacritics, replace non-alphanumerics with space,
    // collapse spaces and lowercase. This preserves token boundaries for fuzzy matching.
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch (e) {
    // Fallback for environments without full unicode support (unlikely in modern browsers/node)
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  }
}
