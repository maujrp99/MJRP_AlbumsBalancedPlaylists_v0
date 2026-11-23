/**
 * exportTexts - the words of the export to Apple Music that are said outside its report (F98, UAT-308).
 *
 * The export service (services/AppleMusicExportService.js) gives DATA: a step of the progress and a name, a kind of failure, the lists of
 * its report. It never writes a sentence. This file says them in the language the site speaks now (`t`, `tPlural`, the dictionaries
 * `en/` and `pt/` `exportWindow.js` and `notices.js`), as askTexts.js and inventoryTexts.js do for their models:
 *   appleProgressText   what is written on the «Export» button while the export runs
 *   appleFailureText    why the export created nothing, or stopped (the report says it too: ui/AppleExportReport.tsx)
 *   appleNextStepText   what the person can do about it, for the failures that have a next step
 *   appleSummaryNotice  the one notice of an export whose report nobody was there to read (the window was closed while it ran)
 */
import { t, tPlural } from './t.js'
import { exportEnding } from '../models/exportOutcome.js'

const STEP_KEYS = Object.freeze({
    connecting: 'notices.export.connecting',
    authorizing: 'notices.export.authorizing',
    folder: 'notices.export.folder',
    exporting: 'notices.export.exporting'
})

/**
 * @param {{ step: string, name?: string }} progress - what the export told
 * @returns {string}
 */
export function appleProgressText(progress) {
    return t(STEP_KEYS[progress?.step] || STEP_KEYS.connecting, { name: progress?.name ?? '' })
}

const FAILURE_KEYS = Object.freeze({
    'not-configured': 'appleReport.failure.notConfigured',
    authorization: 'appleReport.failure.authorization',
    refused: 'appleReport.failure.refused',
    unchecked: 'appleReport.failure.unchecked',
    'not-found': 'appleReport.failure.notFound',
    unreachable: 'appleReport.failure.unreachable'
})

/**
 * @param {{ kind: string, detail?: string|null }} failure
 * @returns {string} what Apple Music itself said (`detail`) goes inside a sentence of the app
 */
export function appleFailureText(failure) {
    const key = FAILURE_KEYS[failure?.kind]
    if (key) return t(key)
    return failure?.detail ? t('appleReport.failure.said', { detail: failure.detail }) : t('appleReport.failure.silent')
}

/** The failures that have a next step to say, after the reason. */
const NEXT_STEP_KEYS = Object.freeze({ refused: 'appleReport.failure.refusedNote', authorization: 'appleReport.failure.authorizationNote' })

/**
 * @param {{ kind: string }} failure
 * @returns {string|null} what the person can do next; null when the failure has no step of its own
 */
export function appleNextStepText(failure) {
    const key = NEXT_STEP_KEYS[failure?.kind]
    return key ? t(key) : null
}

/** The kinds of failure that are the person's to answer, not something that broke: told as a warning. */
const WARNED = Object.freeze(['authorization'])

const countOf = (list) => (Array.isArray(list) ? list.length : 0)

/** Nothing is in the library: why, or that Apple Music created none. */
function nothingNotice({ failure }) {
    if (!failure) return { type: 'error', text: t('notices.export.apple.noneCreated') }
    const said = appleFailureText(failure)
    const next = appleNextStepText(failure)
    // the reason of a refusal is a title, with no full stop: it gets one when the next step follows it
    const text = next ? `${said.replace(/[.!?]$/, '')}. ${next}` : said
    return { type: WARNED.includes(failure.kind) ? 'warning' : 'error', text }
}

/** Everything asked for is there: how many were created now, or that all were already there from an export of this session. */
function completeNotice(created) {
    const fresh = created.filter(item => !item.alreadyThere).length
    return fresh > 0
        ? { type: 'success', text: tPlural('notices.export.apple.complete', fresh, { count: fresh }) }
        : { type: 'info', text: tPlural('notices.export.apple.alreadyThere', created.length, { count: created.length }) }
}

/**
 * One notice for a whole report, for when no window is there to draw it.
 * @param {Object} report - AppleExportReport
 * @returns {{ type: 'success'|'info'|'warning'|'error', text: string }}
 */
export function appleSummaryNotice(report) {
    const ending = exportEnding(report)
    if (ending === 'failed') return nothingNotice(report)
    if (ending === 'complete') return completeNotice(report.created)
    const created = countOf(report.created)
    const total = created + countOf(report.failed) + countOf(report.empty) + countOf(report.notCreated)
    return { type: 'warning', text: tPlural('notices.export.apple.leftOut', total, { created, total }) }
}
