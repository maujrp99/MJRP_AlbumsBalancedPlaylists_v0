/**
 * Normalizes a string for fuzzy matching/deduplication.
 * Removes diacritics, replaces non-alphanumerics with space, collapses spaces, and lowercases.
 *
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string.
 */
export function normalizeKey(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '') // Remove (anything)
    .replace(/\s*\[.*?\]/g, '') // Remove [anything]
    .replace(/\s*\{.*?\}/g, '') // Remove {anything} - just in case
    .replace(/\s*-\s*.*?remaster.*/g, '') // Remove "- 2011 Remaster" etc trailing dashes
    .replace(/\s*-\s*.*?mix.*/g, '') // Remove "- 2023 Mix"
    .replace(/[^\w\s]/g, '') // Remove all non-word chars (punctuation)
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}
