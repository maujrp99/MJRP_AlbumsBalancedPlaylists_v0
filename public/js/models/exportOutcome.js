/**
 * exportOutcome - how an export to a music service ended, in one word (F77: the event
 * `playlists_exported`). It reads the report of SpotifyExportService or of AppleMusicExportService:
 *   complete  every playlist is there, whole
 *   partial   some are there, and something was left out, failed or was not finished
 *   failed    none is there
 *
 * exportReason - why, when the export ended for one of the two reasons that are not about the playlists (F97):
 *   refused    the music service did not allow the account (Spotify answered 403)
 *   unchecked  no track could be checked: the searches failed
 */

const LEFT_OUT = ['incomplete', 'empty', 'failed', 'notCreated']

const countOf = (list) => (Array.isArray(list) ? list.length : 0)

/**
 * @param {Object} report - ExportReport (Spotify) or AppleExportReport
 * @returns {'complete'|'partial'|'failed'}
 */
export function exportOutcome(report) {
    const created = countOf(report?.created)
    const leftOut = LEFT_OUT.reduce((sum, name) => sum + countOf(report?.[name]), 0)
    if (created === 0 && countOf(report?.incomplete) === 0) return 'failed'
    return leftOut > 0 || report?.failure ? 'partial' : 'complete'
}

const REASONS = ['refused', 'unchecked']

/**
 * @param {Object} report - ExportReport (Spotify)
 * @returns {'refused'|'unchecked'|undefined} undefined: the export ended any other way
 */
export function exportReason(report) {
    const kind = report?.failure?.kind
    return REASONS.includes(kind) ? kind : undefined
}
