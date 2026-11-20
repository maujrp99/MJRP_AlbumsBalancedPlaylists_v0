/**
 * popularityOnConnect (F69)
 *
 * When the person connects to Spotify, the albums on screen whose popularity was "not connected"
 * are asked, through the album load (refreshSource: its queue, its state, its hold), and only that
 * source: no album is loaded again.
 *
 * The signal is the one of the Spotify session, 'spotify-auth-change' (connect, renewed access,
 * disconnect). It asks only when there is a session, and only what is "not connected", so a
 * renewed access or a disconnect asks nothing.
 */

import { EnrichmentStatus } from '../../models/albumLoadState.js'

const SOURCE = 'popularity'
const SESSION_CHANGED = 'spotify-auth-change'

/**
 * @param {Object} deps
 * @param {AlbumLoadStore} deps.store - getSeriesIds, getEntries
 * @param {AlbumLoadService} deps.service - refreshSource
 * @param {Function} deps.isConnected - () => boolean
 * @param {EventTarget} [deps.target] - where the session signal is heard
 * @returns {Function} () => number: asks now, and says for how many albums (also what the signal calls)
 */
export function askPopularityOnConnect({ store, service, isConnected, target = window }) {
    const ask = () => {
        if (!isConnected()) return 0

        const albumIds = new Set()
        store.getSeriesIds().forEach(seriesId => store.getEntries(seriesId).forEach(entry => {
            if (entry.enrichment[SOURCE] === EnrichmentStatus.NOT_CONNECTED && entry.album?.id) albumIds.add(entry.album.id)
        }))
        albumIds.forEach(albumId => service.refreshSource(albumId, SOURCE))
        return albumIds.size
    }

    target.addEventListener(SESSION_CHANGED, ask)
    return ask
}
