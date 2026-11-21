/**
 * homePaste
 *
 * The pasted list in the Home's one field (F79), as data. The rule is the one of F63
 * (models/bulkPaste.js): a line that cannot go in is skipped and the others go on. What F79 adds is
 * WHEN it is said: each line says «ready» or why before the click, and after «Add» the lines that
 * did not go in stay, each with its reason, to be fixed in place. Pure: no DOM, no network.
 */

import { parsePastedAlbumLine, PastedLineProblem } from './albumQuery.js'
import { SkipReason } from './bulkPaste.js'

/** Why a line is not ready, before the click: what to do about it. */
const BEFORE = Object.freeze({
    [PastedLineProblem.NO_SEPARATOR]: 'add « - » between artist and album',
    [PastedLineProblem.NO_ALBUM]: 'add the album name after « - »'
})

/** Why a line did not go in, after the click: where to fix it. */
const AFTER = Object.freeze({
    [SkipReason.NO_SEPARATOR]: 'add « - » between artist and album',
    [SkipReason.NO_ALBUM]: 'add the album name after « - »',
    [SkipReason.NOT_FOUND]: 'not found in the catalog: fix the spelling here',
    [SkipReason.SEARCH_FAILED]: 'the catalog did not answer: try this line again'
})

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`

/**
 * @param {string} text - the list, one album per line
 * @returns {Array<{ text: string, ready: boolean, blank: boolean, why: string }>} one per line
 */
export function checkPastedLines(text) {
    return String(text ?? '').split(/\r?\n/).map(raw => {
        const read = parsePastedAlbumLine(raw)
        const blank = !read.ok && read.problem === PastedLineProblem.BLANK
        return { text: raw.trim(), ready: read.ok, blank, why: read.ok || blank ? '' : BEFORE[read.problem] }
    })
}

/**
 * The foot of the list before the click.
 * @returns {{ text: string, ready: number, button: string }}
 */
export function pasteSummary(lines) {
    const filled = lines.filter(line => !line.blank)
    const ready = filled.filter(line => line.ready).length
    return {
        text: `${count(filled.length, 'line', 'lines')}: ${ready} ready, ${filled.length - ready} to fix. Lines to fix are skipped; the rest go in.`,
        ready,
        button: ready > 0 ? `Add ${count(ready, 'album', 'albums')}` : 'Add albums'
    }
}

function reportMessage(added, toFix, already) {
    const parts = [added > 0 ? `Added ${count(added, 'album', 'albums')}.` : 'No album was added.']
    if (toFix > 0) parts.push(`${count(toFix, 'line was', 'lines were')} skipped and ${toFix === 1 ? 'is' : 'are'} still here to fix.`)
    if (already > 0) parts.push(`${count(already, 'line was', 'lines were')} already in your series.`)
    return parts.join(' ')
}

function reportTone(added, toFix) {
    if (added === 0) return toFix > 0 ? 'error' : 'success'
    return toFix > 0 ? 'warning' : 'success'
}

/**
 * What the list says after «Add».
 * @param {{ added: number, skipped: Array<{ line: number, text: string, reason: string }> }} result
 * @returns {{ message: string, lines: Array<{ text: string, why: string }>, button: string, tone: string }}
 *          lines: what stays in the list to be fixed, in its order
 */
export function pasteReport({ added, skipped }) {
    const inOrder = [...skipped].sort((a, b) => a.line - b.line)
    const lines = inOrder.filter(item => item.reason !== SkipReason.ALREADY_SELECTED).map(item => ({ text: item.text, why: AFTER[item.reason] }))
    const already = inOrder.length - lines.length
    let button = ''
    if (lines.length === 1) button = 'Add this line'
    else if (lines.length > 1) button = `Add these ${lines.length} lines`
    return { message: reportMessage(added, lines.length, already), lines, button, tone: reportTone(added, lines.length) }
}
