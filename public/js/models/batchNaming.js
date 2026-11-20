/**
 * batchNaming - the default name of a new batch of playlists (UAT-229), and the spelling out of the
 * codes the recipes write in playlist titles (shared with the readable names of saved batches).
 *
 * The name says what the batch is: the series, then the playlist when the set is one playlist, or
 * the recipe when it is several («Trip Hop Vol.1 · Spotify Top 3 balanced»). It carries no date:
 * the saved batch already has one. With no series to name it, the stamped name of the local clock.
 *
 * Pure: values in, a string out.
 */
import { decodeEntities } from './text.js'

/** The codes of the recipe titles and the words they stand for. */
export const NAME_CODES = Object.freeze([
    [/\bSPFY\b/g, 'Spotify'],
    [/\bBEA\b/g, 'BestEverAlbums'],
    [/\bBal\.\s*Intv\.?/gi, 'balanced'],
    [/\bIntv\.?/gi, 'interleaved']
])

const SEPARATOR = ' · '
const BRACKET_TAG = /^\s*\[[^\]]*\]\s*/

/** «SPFY Top 3 Bal.Intv.» → «Spotify Top 3 balanced». */
export function spellOutCodes(text) {
    let out = String(text ?? '')
    NAME_CODES.forEach(([code, word]) => { out = out.replace(code, word) })
    return out.replace(/\s{2,}/g, ' ').trim()
}

const two = (n) => String(n).padStart(2, '0')

/** «TheAlbumBlender Playlist 2026-11-19 23:21», day and hour of the local clock (UAT-225). */
export function stampedBatchName(now = new Date()) {
    const day = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`
    return `TheAlbumBlender Playlist ${day} ${two(now.getHours())}:${two(now.getMinutes())}`
}

/** What follows the series: the one playlist's title, or the recipe's name without its «[TAG]». */
function whatTheBatchIs(playlists, recipeName) {
    if (playlists.length === 1) return spellOutCodes(decodeEntities(playlists[0].name || playlists[0].title || ''))
    return String(recipeName || '').replace(BRACKET_TAG, '').trim()
}

/**
 * @param {Object} parts
 * @param {string} [parts.seriesName]
 * @param {Array<{name?: string, title?: string}>} [parts.playlists]
 * @param {string} [parts.recipeName]
 * @param {Date} [parts.now]
 * @returns {string}
 */
export function defaultBatchName({ seriesName = '', playlists = [], recipeName = '', now = new Date() } = {}) {
    const series = String(decodeEntities(String(seriesName || ''))).trim()
    if (!series) return stampedBatchName(now)
    const what = whatTheBatchIs(playlists, recipeName)
    return what ? `${series}${SEPARATOR}${what}` : series
}
