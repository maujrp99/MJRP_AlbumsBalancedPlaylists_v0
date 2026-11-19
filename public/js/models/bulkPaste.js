/**
 * bulkPaste
 *
 * The pasted list of the Home ("Bulk Paste"), as data: which lines are albums, which are not and
 * why, and what the screen says when the list has been processed. Pure: no DOM, no network.
 * A line is read by parsePastedAlbumLine (models/albumQuery.js), the one parser of "Artist - Album".
 *
 * The rule of the screen (F63, UAT-201): a line that cannot go in is skipped and reported, with its
 * number, its text and the reason; the other lines go on.
 */

import { parsePastedAlbumLine, PastedLineProblem } from './albumQuery.js'

/** Why a line of the list did not become a selected album. */
export const SkipReason = Object.freeze({
    NO_SEPARATOR: PastedLineProblem.NO_SEPARATOR,
    NO_ALBUM: PastedLineProblem.NO_ALBUM,
    NOT_FOUND: 'not-found',
    SEARCH_FAILED: 'search-failed',
    ALREADY_SELECTED: 'already-selected'
})

/** The reason, in the words of the screen. */
const WHY = Object.freeze({
    [SkipReason.NO_SEPARATOR]: 'no " - " between the artist and the album',
    [SkipReason.NO_ALBUM]: 'the album name is missing',
    [SkipReason.NOT_FOUND]: 'not found in the catalog',
    [SkipReason.SEARCH_FAILED]: 'the catalog search failed: try this line again',
    [SkipReason.ALREADY_SELECTED]: 'already in the selection'
})

/** A line skipped for one of these has nothing to fix: it does not stay in the box. */
const NOTHING_TO_FIX = new Set([SkipReason.ALREADY_SELECTED])

const COVER_SIZE = '300'

/**
 * @param {string} text - what is in the box
 * @returns {{ entries: Array<{ line: number, text: string, artist: string, title: string }>,
 *             skipped: Array<{ line: number, text: string, reason: string }> }}
 *          `line` is the number of the line in the box, blank lines counted
 */
export function readPastedList(text) {
    const entries = []
    const skipped = []
    String(text ?? '').split(/\r?\n/).forEach((raw, index) => {
        const read = parsePastedAlbumLine(raw)
        const at = { line: index + 1, text: raw.trim() }
        if (read.ok) entries.push({ ...at, artist: read.artist, title: read.title })
        else if (read.problem !== PastedLineProblem.BLANK) skipped.push({ ...at, reason: read.problem })
    })
    return { entries, skipped }
}

/**
 * @param {string} text - what is in the box
 * @returns {'empty'|'valid'|'invalid'} valid: every line is an album
 */
export function bulkInputState(text) {
    const { entries, skipped } = readPastedList(text)
    if (skipped.length > 0) return 'invalid'
    return entries.length > 0 ? 'valid' : 'empty'
}

/**
 * The album found in the catalog, as the selection of the Home keeps it.
 * @param {Object} match - { id, title, artist, year, coverUrl } with the size of the cover as {w} and {h}
 */
export function toStagedAlbum(match) {
    return {
        id: match.id,
        title: match.title,
        artist: match.artist,
        coverUrl: match.coverUrl ? match.coverUrl.replace('{w}', COVER_SIZE).replace('{h}', COVER_SIZE) : null,
        artworkTemplate: match.coverUrl,
        year: match.year,
        appleMusicId: match.id
    }
}

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`

function outcomeMessage(added, skippedCount) {
    const addedPart = added > 0 ? `Added ${count(added, 'album', 'albums')}.` : 'No album was added.'
    if (skippedCount === 0) return addedPart
    return `${addedPart} ${count(skippedCount, 'line was', 'lines were')} skipped: see the list under the box.`
}

function outcomeTone(added, skippedCount) {
    if (added === 0) return 'error'
    return skippedCount > 0 ? 'warning' : 'success'
}

/**
 * What the screen says when the list has been processed.
 * @param {{ added: number, skipped: Array<{ line: number, text: string, reason: string }> }} result
 * @returns {{ tone: 'success'|'warning'|'error', message: string,
 *             report: Array<{ line: number, text: string, why: string }>, leftInBox: string }}
 *          report: the skipped lines in the order of the box; leftInBox: the lines the person can fix
 */
export function bulkOutcome({ added, skipped }) {
    const inOrder = [...skipped].sort((a, b) => a.line - b.line)
    return {
        tone: outcomeTone(added, inOrder.length),
        message: outcomeMessage(added, inOrder.length),
        report: inOrder.map(({ line, text, reason }) => ({ line, text, why: WHY[reason] })),
        leftInBox: inOrder.filter(item => !NOTHING_TO_FIX.has(item.reason)).map(item => item.text).join('\n')
    }
}
