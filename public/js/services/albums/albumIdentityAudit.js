/**
 * albumIdentityAudit - counts, READ-ONLY, how many albums are wrong today (F55, UAT-184).
 *
 * For each album a series asks for, it reads the album the app has for that query and asks the one
 * identity rule (shared/albumIdentity.js) whether it is the album asked for. It writes nothing:
 * not to the series, not to the cache, not to the load store. It receives what it reads, so it
 * runs in a test with plain data; `countWrongAlbums` in albumLoading.js gives it the real sources
 * and `window.albumIdentityAudit()` runs it from the browser console.
 */

import { askedAlbum, compareAlbumIdentity } from '../../models/askedAlbum.js'

export const AuditVerdict = Object.freeze({
    SAME: 'same',
    DIFFERENT: 'different',
    /** The app has no album kept for this query (never loaded, or expired): nothing to compare. */
    NOT_LOADED: 'not-loaded'
})

const NOTHING_KEPT = 'nothing-kept-for-this-album'

const labelOf = ({ artist, title }) => (artist ? `${artist} - ${title}` : title)

async function auditOne(series, query, shownFor) {
    const asked = askedAlbum(query)
    const row = {
        series: series.name,
        asked: labelOf(asked),
        shown: null,
        verdict: AuditVerdict.NOT_LOADED,
        reason: NOTHING_KEPT,
        storedAppleId: (typeof query === 'object' && query !== null && query.appleMusicId) || null
    }

    let shown
    try {
        shown = await shownFor(query, series)
    } catch (error) {
        return { ...row, reason: `could-not-be-read: ${error?.message || error}` }
    }
    if (!shown) return row

    const { verdict, reason } = compareAlbumIdentity(asked, shown)
    return { ...row, shown: labelOf(shown), verdict, reason }
}

function summarize(seriesCount, rows) {
    const count = (verdict) => rows.filter(row => row.verdict === verdict).length
    return {
        series: seriesCount,
        asked: rows.length,
        same: count(AuditVerdict.SAME),
        different: count(AuditVerdict.DIFFERENT),
        notLoaded: count(AuditVerdict.NOT_LOADED)
    }
}

/**
 * @param {Object} sources
 * @param {Array<{ name: string, albumQueries?: Array }>} sources.series - the person's series
 * @param {Function} sources.shownFor - async (query, series) => { artist, title, year? } | null:
 *        the album the app has for that query, read without changing anything
 * @returns {Promise<{ rows: Array<{ series, asked, shown, verdict, reason, storedAppleId }>, summary: Object }>}
 */
export async function auditAlbumIdentity({ series, shownFor }) {
    const list = series || []
    const rows = []
    for (const one of list) {
        for (const query of one.albumQueries || []) {
            rows.push(await auditOne(one, query, shownFor))
        }
    }
    return { rows, summary: summarize(list.length, rows) }
}
