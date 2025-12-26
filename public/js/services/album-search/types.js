/**
 * @typedef {Object} SearchResult
 * @property {string} id - Apple Music Album ID
 * @property {string} title - Album Title
 * @property {string} artist - Artist Name
 * @property {string} year - Release Year
 * @property {string} type - 'Album', 'Single', 'Compilation', 'Live'
 * @property {number} confidence - Match confidence score (0-1)
 * @property {number} score - Raw match score
 * @property {string[]} strategies - List of strategies used to find this
 * @property {Object} raw - Original Apple Music object
 */

/**
 * @typedef {Object} SearchOptions
 * @property {boolean} preferStandard - Penalize Deluxe/Remasters
 * @property {boolean} allowLive - Allow Live albums (normally penalized)
 * @property {number} limit - Max results to return
 * @property {number} minConfidence - Minimum confidence to accept (default 0.35)
 */

export const AlbumTypes = {
    ALBUM: 'Album',
    SINGLE: 'Single',
    COMPILATION: 'Compilation',
    LIVE: 'Live'
};
