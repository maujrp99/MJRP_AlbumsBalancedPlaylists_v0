/**
 * exportOutcome - how an export to a music service ended, in one word (F77: the event
 * `playlists_exported`). It reads the report of SpotifyExportService or of AppleMusicExportService:
 *   complete  every playlist is there, whole
 *   partial   some are there, and something was left out, failed or was not finished
 *   failed    none is there
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
