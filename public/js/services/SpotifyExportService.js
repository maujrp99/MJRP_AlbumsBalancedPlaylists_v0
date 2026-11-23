/**
 * SpotifyExportService.js
 *
 * Exports the playlists on screen to Spotify and reports what happened (F62).
 *
 * The export never ends in silence. Its answer (ExportReport) says:
 *   created     the playlists that are in Spotify with all their matched tracks, each with its
 *               address; `alreadyThere` when this session had sent it before (not created again)
 *   incomplete  created, but not every track was added (a second export finishes it)
 *   empty       not created: Spotify answered every search of its tracks and had none of them
 *   notCreated  what was left to do when the export stopped, and what had no track that could be checked
 *   unchecked   how many tracks could not be checked: the search failed (network, 5xx, timeout).
 *               It is never "not found": a track is not found only when Spotify answered and had none (F97)
 *   failure     null, or why it stopped:
 *               { kind: 'reconnect' | 'rate-limit' | 'refused' | 'unchecked' | 'error', message }
 *               'refused': Spotify answered 403, it does not serve this account (F97, UAT-302)
 *               'unchecked': no track was matched and at least one search failed
 *
 * - An access that expired is renewed (SpotifyAuthService / SpotifyService); when it cannot be,
 *   the failure is 'reconnect' and only the person can go on.
 * - A playlist sent in this session is not created again (services/export/exportLedger.js).
 */

import { SpotifyAuthService } from './SpotifyAuthService.js'
import { SpotifyService } from './SpotifyService.js'
import { SpotifyReconnectError, SpotifyRateLimitError, SpotifyRefusedError } from './spotify/spotifyErrors.js'
import { exportLedger } from './export/exportLedger.js'
import { exportOutcome, exportReason } from '../models/exportOutcome.js'
import { track } from './usage/track.js'

/** Between two searches, so a long export does not run into the rate limit. */
const SEARCH_PAUSE_MS = 80

const titleOf = (playlist) => playlist.title || playlist.name
const storedUri = (track) => track.spotifyUri || (track.spotifyId ? `spotify:track:${track.spotifyId}` : null)

/** Why the export stopped, in the terms the screen acts on. */
function failureOf(error) {
    if (error instanceof SpotifyReconnectError) return { kind: 'reconnect', message: error.message }
    if (error instanceof SpotifyRateLimitError) {
        return { kind: 'rate-limit', message: error.message, retryAfterSeconds: error.retryAfterSeconds }
    }
    if (error instanceof SpotifyRefusedError) return { kind: 'refused', message: error.message }
    return { kind: 'error', message: error?.message || 'Spotify did not answer' }
}

/** These three stop the export; any other failure of a search is one track that could not be checked (never "not found"). */
const stopsTheExport = (error) => error instanceof SpotifyReconnectError || error instanceof SpotifyRateLimitError ||
    error instanceof SpotifyRefusedError

/** F77: how the export ended, measured once, whatever way it ended. */
function measured(report, playlists) {
    const reason = exportReason(report)
    track('playlists_exported', { target: 'spotify', outcome: exportOutcome(report), ...(reason ? { reason } : {}), playlist_count: playlists.length })
    return report
}

export class SpotifyExportService {

    /** Replaceable in tests. */
    static pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Export playlists to Spotify.
     * @param {Array} playlists - playlists from the store
     * @param {Object} options - { mode: 'merge'|'separate', name: string }
     * @param {Object} callbacks - { onProgress(stage, current, total, message), onMatch(count), onNotFound(track), onUnchecked(track) }
     * @returns {Promise<Object>} ExportReport (see the top of this file)
     * @throws only when there is nothing to export
     */
    static async exportPlaylists(playlists, options, callbacks = {}) {
        if (!playlists || playlists.length === 0) throw new Error('No playlists to export')

        const report = {
            mode: options.mode === 'separate' ? 'separate' : 'merge',
            totalTracks: playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0),
            matchCount: 0,
            unchecked: 0,
            created: [], incomplete: [], empty: [], notCreated: [],
            failure: null,
            createdUrl: null
        }
        const targets = this._targetsOf(playlists, report.mode, options.name)

        try {
            // an access that expired is renewed here, before anything is asked of Spotify
            if (!(await SpotifyAuthService.getAccessToken())) throw new SpotifyReconnectError()
            await this._match(targets, report, callbacks)
        } catch (error) {
            report.failure = failureOf(error)
            report.notCreated = targets.map(target => target.name)
            return measured(report, playlists)
        }

        await this._deliverAll(targets, report, callbacks)
        report.createdUrl = report.created[0]?.url || null
        return measured(report, playlists)
    }

    /** What will exist in Spotify: one playlist of everything, or one for each playlist. */
    static _targetsOf(playlists, mode, name) {
        if (mode === 'separate') {
            return playlists.map(playlist => ({
                name: `${name} - ${titleOf(playlist)}`,
                description: `Part of ${name}`,
                sources: [playlist],
                uris: [],
                unchecked: 0
            }))
        }
        return [{ name, description: null, sources: playlists, uris: [], unchecked: 0 }]
    }

    /**
     * Find the Spotify track of every track. The ones Spotify does not have are told through onNotFound;
     * the ones whose search failed, through onUnchecked - they are counted apart.
     */
    static async _match(targets, report, callbacks) {
        const { onProgress = () => { } } = callbacks
        let seen = 0
        for (const target of targets) {
            for (const playlist of target.sources) {
                for (const track of (playlist.tracks || [])) {
                    const title = track.title || track.name
                    seen++
                    onProgress('MATCHING', seen, report.totalTracks, `Searching: ${title}`)

                    const found = await this._uriOf(track)
                    this._count(found, target, report, { title, artist: track.artist, playlist: titleOf(playlist) }, callbacks)
                }
            }
        }
    }

    /** One track, counted where it belongs: matched, not checked (its search failed), or not found (Spotify has none). */
    static _count(found, target, report, told, { onMatch, onNotFound, onUnchecked }) {
        if (found.uri) {
            target.uris.push(found.uri)
            report.matchCount++
            onMatch?.(report.matchCount)
        } else if (found.unchecked) {
            target.unchecked++
            report.unchecked++
            onUnchecked?.(told)
        } else {
            onNotFound?.(told)
        }
    }

    /**
     * The Spotify address of a track: the one it carries, or the one a search finds.
     * @returns {Promise<{ uri: string|null, unchecked?: true }>} `uri: null` alone: Spotify answered and has none;
     *          `unchecked`: the search could not be made, so nothing is known about the track
     */
    static async _uriOf(track) {
        const stored = storedUri(track)
        if (stored) return { uri: stored }
        try {
            const found = await SpotifyService.searchTrack(track.title || track.name, track.artist, track.album || '')
            await this.pause(SEARCH_PAUSE_MS)
            return { uri: found?.uri || null }
        } catch (error) {
            if (stopsTheExport(error)) throw error
            console.warn('[SpotifyExport] Track search failed:', track.title, error?.message)
            return { uri: null, unchecked: true }
        }
    }

    /** Create what is missing, one target at a time; the first failure stops and is reported. */
    static async _deliverAll(targets, report, { onProgress = () => { } }) {
        const withTracks = targets.filter(target => target.uris.length > 0)
        const without = targets.filter(target => target.uris.length === 0)
        // "no track found" only when Spotify answered for every track; one that could not be checked is "not created"
        report.empty = without.filter(target => !target.unchecked).map(target => target.name)
        const notChecked = without.filter(target => target.unchecked).map(target => target.name)
        if (withTracks.length === 0) {
            report.notCreated = notChecked
            report.failure = report.unchecked > 0
                ? { kind: 'unchecked', message: 'Spotify could not be reached: the tracks could not be checked.' }
                : { kind: 'error', message: 'No tracks found on Spotify' }
            return
        }

        for (const [index, target] of withTracks.entries()) {
            onProgress('CREATING', index + 1, withTracks.length, `Creating "${target.name}"...`)
            const outcome = await this._deliver(target, report, onProgress)
            if (outcome.error) {
                report.failure = failureOf(outcome.error)
                report.notCreated = [...withTracks.slice(index + (outcome.exists ? 1 : 0)).map(item => item.name), ...notChecked]
                return
            }
        }
        report.notCreated = notChecked
    }

    /**
     * Have one target in Spotify with all its tracks. What this session already sent is not sent
     * again: a playlist that is there is left alone, one that is half there gets the rest.
     * @returns {Promise<{ error?: Error, exists?: boolean }>}
     */
    static async _deliver(target, report, onProgress) {
        const key = exportLedger.keyOf('spotify', target.name, target.uris)
        const total = target.uris.length
        let sent = exportLedger.get(key)
        const alreadyThere = sent?.added === total

        try {
            if (!sent) {
                const description = target.description || `Generated by MJRP Album Blender • ${report.matchCount}/${report.totalTracks} tracks`
                const playlist = await SpotifyService.createPlaylist(target.name, description)
                const url = playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`
                sent = exportLedger.set(key, { id: playlist.id, url, added: 0 })
            }
            if (sent.added < total) {
                onProgress('ADDING', sent.added, total, `Adding ${total - sent.added} tracks to "${target.name}"...`)
                const before = sent.added
                await SpotifyService.addTracksToPlaylist(sent.id, target.uris.slice(before), (added) => {
                    sent = exportLedger.set(key, { ...sent, added: before + added })
                })
            }
        } catch (error) {
            if (sent) report.incomplete.push({ name: target.name, url: sent.url, tracks: sent.added, total })
            return { error, exists: !!sent }
        }

        report.created.push({ name: target.name, url: sent.url, tracks: total, total, alreadyThere })
        return {}
    }
}
