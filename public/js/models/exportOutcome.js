/**
 * exportOutcome - how an export to a music service ended, in one word (F77: the event
 * `playlists_exported`). It reads the report of SpotifyExportService or of AppleMusicExportService:
 *   complete  every playlist is there, whole
 *   partial   some are there, and something was left out, failed, was not finished or could not be checked
 *   failed    none is there
 *
 * exportReason - why, when the export ended for one of the two reasons that are not about the playlists (F97; Apple Music too, F98):
 *   refused    the music service did not allow the account (Spotify answered 403; Apple Music refused the person)
 *   unchecked  no track could be checked: the searches failed
 *
 * exportEnding - what the report of an export is headed with (F98): the two windows read it, so a result with something left out is
 * never headed as a clean success:
 *   complete  everything asked for is there. Tracks the catalogue does not have are still a complete export: the service answered
 *   left-out  it ran to the end, and something is missing: tracks that could not be checked, a playlist that was not created
 *   stopped   it stopped part of the way, with something already there
 *   failed    nothing is there
 */

const LEFT_OUT = ['incomplete', 'empty', 'failed', 'notCreated']

const countOf = (list) => (Array.isArray(list) ? list.length : 0)

/** How many tracks could not be checked: both reports count them in `unchecked`. */
const uncheckedOf = (report) => Number(report?.unchecked) || 0

const leftOutOf = (report) => LEFT_OUT.reduce((sum, name) => sum + countOf(report?.[name]), 0) + uncheckedOf(report)

const nothingThere = (report) => countOf(report?.created) === 0 && countOf(report?.incomplete) === 0

/**
 * @param {Object} report - ExportReport (Spotify) or AppleExportReport
 * @returns {'complete'|'partial'|'failed'}
 */
export function exportOutcome(report) {
    if (nothingThere(report)) return 'failed'
    return leftOutOf(report) > 0 || report?.failure ? 'partial' : 'complete'
}

const REASONS = ['refused', 'unchecked']

/**
 * @param {Object} report - ExportReport (Spotify) or AppleExportReport
 * @returns {'refused'|'unchecked'|undefined} undefined: the export ended any other way
 */
export function exportReason(report) {
    const kind = report?.failure?.kind
    return REASONS.includes(kind) ? kind : undefined
}

/**
 * @param {Object} report - ExportReport (Spotify) or AppleExportReport
 * @returns {'complete'|'left-out'|'stopped'|'failed'}
 */
export function exportEnding(report) {
    if (nothingThere(report)) return 'failed'
    if (report?.failure) return 'stopped'
    return leftOutOf(report) > 0 ? 'left-out' : 'complete'
}

/**
 * Was something left out of what was asked for (a playlist not created or not finished, a track that could not be checked)?
 * @param {Object} report
 * @returns {boolean}
 */
export const leftSomethingOut = (report) => leftOutOf(report) > 0

/**
 * Is there something another try could bring? A failure, a playlist the service did not create, a track that could not be checked.
 * A track or a playlist the catalogue does not have is not: the service answered, and would answer the same.
 * @param {Object} report
 * @returns {boolean}
 */
export function worthAnotherTry(report) {
    const failed = Boolean(report?.failure) && report.failure.kind !== 'not-found'
    return failed || uncheckedOf(report) > 0 || countOf(report?.failed) > 0 || countOf(report?.incomplete) > 0
}
