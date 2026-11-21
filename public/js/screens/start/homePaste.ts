/**
 * homePaste
 *
 * The pasted list in the Start screen's one field (F79; moved here and given the dictionary in F83 wave 4; it was models/homePaste.js),
 * as data and words. The rule is the one of F63 (models/bulkPaste.js): a line that cannot go in is skipped and the others go on. What
 * F79 adds is WHEN it is said: each line says «ready» or why before the click, and after «Add» the lines that did not go in stay, each
 * with its reason, to be fixed in place. No DOM, no network.
 */
import { t, tPlural } from '../../i18n/t.js'
import { parsePastedAlbumLine, PastedLineProblem } from '../../models/albumQuery.js'
import { SkipReason } from '../../models/bulkPaste.js'

/** Why a line is not ready, before the click: what to do about it. */
const BEFORE: Record<string, string> = {
    [PastedLineProblem.NO_SEPARATOR]: 'start.list.before.noSeparator',
    [PastedLineProblem.NO_ALBUM]: 'start.list.before.noAlbum'
}

/** Why a line did not go in, after the click: where to fix it. */
const AFTER: Record<string, string> = {
    [SkipReason.NO_SEPARATOR]: 'start.list.before.noSeparator',
    [SkipReason.NO_ALBUM]: 'start.list.before.noAlbum',
    [SkipReason.NOT_FOUND]: 'start.list.after.notFound',
    [SkipReason.SEARCH_FAILED]: 'start.list.after.searchFailed'
}

export interface CheckedLine {
    text: string
    ready: boolean
    blank: boolean
    why: string
}

export interface Skipped {
    line: number
    text: string
    reason: string
}

export interface PasteReport {
    message: string
    lines: Array<{ text: string; why: string }>
    button: string
    tone: 'success' | 'warning' | 'error'
}

/**
 * @param text - the list, one album per line
 * @returns one per line
 */
export function checkPastedLines(text: string): CheckedLine[] {
    return String(text ?? '').split(/\r?\n/).map(raw => {
        const read = parsePastedAlbumLine(raw)
        const blank = !read.ok && read.problem === PastedLineProblem.BLANK
        return { text: raw.trim(), ready: read.ok, blank, why: read.ok || blank ? '' : t(BEFORE[read.problem]) }
    })
}

/** The foot of the list before the click. */
export function pasteSummary(lines: CheckedLine[]): { text: string; ready: number; button: string } {
    const filled = lines.filter(line => !line.blank)
    const ready = filled.filter(line => line.ready).length
    return {
        text: t('start.list.summary', { lines: tPlural('start.list.lines', filled.length, { count: filled.length }), ready, fix: filled.length - ready }),
        ready,
        button: ready > 0 ? tPlural('start.list.addCount', ready, { count: ready }) : t('start.list.add')
    }
}

function reportMessage(added: number, toFix: number, already: number): string {
    const parts = [added > 0 ? tPlural('start.list.report.added', added, { count: added }) : t('start.list.report.added.none')]
    if (toFix > 0) parts.push(tPlural('start.list.report.skipped', toFix, { count: toFix }))
    if (already > 0) parts.push(tPlural('start.list.report.already', already, { count: already }))
    return parts.join(' ')
}

function reportTone(added: number, toFix: number): PasteReport['tone'] {
    if (added === 0) return toFix > 0 ? 'error' : 'success'
    return toFix > 0 ? 'warning' : 'success'
}

/**
 * What the list says after «Add».
 * `lines`: what stays in the list to be fixed, in its order.
 */
export function pasteReport({ added, skipped }: { added: number; skipped: Skipped[] }): PasteReport {
    const inOrder = [...skipped].sort((a, b) => a.line - b.line)
    const lines = inOrder.filter(item => item.reason !== SkipReason.ALREADY_SELECTED).map(item => ({ text: item.text, why: t(AFTER[item.reason]) }))
    const already = inOrder.length - lines.length
    let button = ''
    if (lines.length === 1) button = t('start.list.addLine')
    else if (lines.length > 1) button = t('start.list.addLines', { count: lines.length })
    return { message: reportMessage(added, lines.length, already), lines, button, tone: reportTone(added, lines.length) }
}
