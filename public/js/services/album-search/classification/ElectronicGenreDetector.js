/**
 * ElectronicGenreDetector - Helper for detecting electronic music genres
 * 
 * Part of ARCH-18: Album Classification Modularization
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#gêneros-eletrônicos-lista-expandida
 */

/**
 * Comprehensive list of electronic music genres from Apple Music
 * Used to determine if an album should use AI whitelist for Studio classification
 */
export const ELECTRONIC_GENRES = [
    // Main categories
    'electronic', 'electronica', 'dance', 'edm',

    // House (12 subgenres)
    'house', 'deep house', 'progressive house', 'tech house',
    'electro house', 'acid house', 'chicago house', 'disco house',
    'funky house', 'latin house', 'tribal house', 'afro house',

    // Techno (5)
    'techno', 'detroit techno', 'minimal techno', 'melodic techno', 'industrial techno',

    // Trance (6)
    'trance', 'progressive trance', 'uplifting trance', 'vocal trance',
    'psytrance', 'goa trance',

    // Bass music
    'dubstep', 'brostep', 'drum and bass', 'drum n bass', 'jungle', 'breakbeat',

    // Ambient/Chill
    'ambient', 'downtempo', 'chillout', 'lounge', 'chillwave',

    // UK/Garage
    'uk garage', '2-step', 'garage',

    // Synth
    'synthwave', 'retrowave', 'synthpop', 'electropop',

    // Other
    'idm', 'intelligent dance music', 'big room', 'future bass', 'bass music',
    'hardstyle', 'hardcore', 'gabber', 'happy hardcore',
    'eurodance', 'eurobeat', 'hi-nrg',
    'dj', 'club', 'rave'
];

/**
 * Prog Rock genres that get special treatment (duration-based classification)
 */
export const PROG_ROCK_GENRES = [
    'progressive rock', 'prog rock', 'art rock',
    'progressive metal', 'prog metal',
    'post-rock', 'post rock',
    'krautrock', 'space rock',
    'symphonic rock', 'neo-prog'
];

/**
 * Check if album genres indicate electronic music
 * @param {string[]} genres - Array of genre names (lowercase)
 * @returns {boolean}
 */
export function isElectronic(genres) {
    if (!genres || !Array.isArray(genres)) return false;

    return genres.some(genre => {
        const g = genre.toLowerCase();
        return ELECTRONIC_GENRES.some(e => g.includes(e));
    });
}

/**
 * Check if album genres indicate progressive rock
 * @param {string[]} genres - Array of genre names (lowercase)
 * @returns {boolean}
 */
export function isProgRock(genres) {
    if (!genres || !Array.isArray(genres)) return false;

    return genres.some(genre => {
        const g = genre.toLowerCase();
        return PROG_ROCK_GENRES.some(p => g.includes(p));
    });
}

export const ElectronicGenreDetector = {
    ELECTRONIC_GENRES,
    PROG_ROCK_GENRES,
    isElectronic,
    isProgRock
};
