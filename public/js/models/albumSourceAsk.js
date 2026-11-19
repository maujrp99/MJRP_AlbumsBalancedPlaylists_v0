/**
 * albumSourceAsk
 *
 * The rules of asking one enrichment source for one album, as pure functions (F58; arch.md,
 * "Carga da tela de álbuns", seção 19). AlbumLoadService does the asking, on its queues; what is
 * decided about an ask is here: whether the source is still to be asked, over which album its
 * answer is applied, and what the answer means for the screen and for what is kept.
 */

import { AlbumStatus, EnrichmentStatus } from './albumLoadState.js'

/** A source that answered, with data or with nothing, is not asked again. */
const ANSWERED = new Set([EnrichmentStatus.DONE, EnrichmentStatus.EMPTY])

/** True when the source of this entry answered already. */
export function hasAnswered(status) {
    return ANSWERED.has(status)
}

/**
 * Is this source still to be asked for this album? Only for an album that is on screen (found)
 * and whose source has not answered yet.
 * @param {Object|null} entry - the entry of the album in the load store
 * @param {string} source
 * @returns {boolean}
 */
export function awaitsSource(entry, source) {
    if (!entry || entry.status !== AlbumStatus.FOUND) return false
    return !hasAnswered(entry.enrichment[source])
}

/**
 * The album to publish for an answer. The source worked on the album it was given. If another
 * source published a newer album meanwhile, the answer is applied over that one (and again, if
 * yet another was published while it applied), so no source undoes another.
 * @param {{ result: Object, given: Object }} answer - `result.apply(album)` applies it again
 * @param {Function} newestAlbum - () => the album the load has now for this entry, if any
 * @returns {Promise<Object>}
 */
export async function overNewestAlbum({ result, given }, newestAlbum) {
    let album = result.album || given
    let base = given
    while (typeof result.apply === 'function') {
        const current = newestAlbum()
        if (!current || current === base) break
        base = current
        album = await result.apply(current)
    }
    return album
}

/**
 * What the answer of a source means: the state of the source on screen, and what is noted beside
 * it in what is kept. A source that has nothing says why (the cache believes an "empty" for a time
 * that depends on the reason) and, when it decided by the identity rule, with which version (F68).
 * @param {{ status: string, reason?: string, rule?: number }} result
 * @returns {{ status: string, note: { reason: string|null, rule?: number } }}
 */
export function sourceOutcome(result) {
    if (result.status === EnrichmentStatus.DONE) return { status: EnrichmentStatus.DONE, note: { reason: null } }
    const decidedBy = result.rule ? { rule: result.rule } : {}
    return { status: EnrichmentStatus.EMPTY, note: { reason: result.reason || null, ...decidedBy } }
}
