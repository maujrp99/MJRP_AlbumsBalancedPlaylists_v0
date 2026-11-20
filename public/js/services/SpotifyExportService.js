/**
 * SpotifyExportService.js
 *
 * Exports the playlists on screen to Spotify and reports what happened (F62).
 *
 * The export never ends in silence. Its answer (ExportReport) says:
 *   created     the playlists that are in Spotify with all their matched tracks, each with its
 *               address; `alreadyThere` when this session had sent it before (not created again)
 *   incomplete  created, but not every track was added (a second export finishes it)
 *   empty       not created: none of its tracks was found
 *   notCreated  what was left to do when the export stopped
 *   failure     null, or why it stopped: { kind: 'reconnect' | 'rate-limit' | 'error', message }
 *
 * - An access that expired is renewed (SpotifyAuthService / SpotifyService); when it cannot be,
 *   the failure is 'reconnect' and only the person can go on.
 * - A playlist sent in this session is not created again (services/export/exportLedger.js).
 */

import { SpotifyAuthService } from './SpotifyAuthService.js'
import { SpotifyService } from './SpotifyService.js'
import { SpotifyReconnectError, SpotifyRateLimitError } from './spotify/spotifyErrors.js'
import { exportLedger } from './export/exportLedger.js'
import { exportOutcome } from '../models/exportOutcome.js'
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
    return { kind: 'error', message: error?.message || 'Spotify did not answer' }
}

/** These two stop the export; any other failure of a search is one track that was not matched. */
const stopsTheExport = (error) => error instanceof SpotifyReconnectError || error instanceof SpotifyRateLimitError

/** F77: how the export ended, measured once, whatever way it ended. */
function measured(report, playlists) {
    track('playlists_exported', { target: 'spotify', outcome: exportOutcome(report), playlist_count: playlists.length })
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
     * @param {Object} callbacks - { onProgress(stage, current, total, message), onMatch(count), onNotFound(track) }
     * @returns {Promise<Object>} ExportReport (see the top of this file)
     * @throws only when there is nothing to export
     */
    static async exportPlaylists(playlists, options, callbacks = {}) {
        if (!playlists || playlists.length === 0) throw new Error('No playlists to export')

        const report = {
            mode: options.mode === 'separate' ? 'separate' : 'merge',
            totalTracks: playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0),
            matchCount: 0,
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
                uris: []
            }))
        }
        return [{ name, description: null, sources: playlists, uris: [] }]
    }

    /** Find the Spotify track of every track; the ones not found are told through onNotFound. */
    static async _match(targets, report, { onProgress = () => { }, onMatch, onNotFound }) {
        let seen = 0
        for (const target of targets) {
            for (const playlist of target.sources) {
                for (const track of (playlist.tracks || [])) {
                    const title = track.title || track.name
                    seen++
                    onProgress('MATCHING', seen, report.totalTracks, `Searching: ${title}`)

                    const uri = await this._uriOf(track)
                    if (uri) {
                        target.uris.push(uri)
                        report.matchCount++
                        onMatch?.(report.matchCount)
                    } else {
                        onNotFound?.({ title, artist: track.artist, playlist: titleOf(playlist) })
                    }
                }
            }
        }
    }

    /** The Spotify address of a track: the one it carries, or the one a search finds; null when none. */
    static async _uriOf(track) {
        const stored = storedUri(track)
        if (stored) return stored
        try {
            const found = await SpotifyService.searchTrack(track.title || track.name, track.artist, track.album || '')
            await this.pause(SEARCH_PAUSE_MS)
            return found?.uri || null
        } catch (error) {
            if (stopsTheExport(error)) throw error
            console.warn('[SpotifyExport] Track search failed:', track.title, error?.message)
            return null
        }
    }

    /** Create what is missing, one target at a time; the first failure stops and is reported. */
    static async _deliverAll(targets, report, { onProgress = () => { } }) {
        const withTracks = targets.filter(target => target.uris.length > 0)
        report.empty = targets.filter(target => target.uris.length === 0).map(target => target.name)
        if (withTracks.length === 0) {
            report.failure = { kind: 'error', message: 'No tracks found on Spotify' }
            return
        }

        for (const [index, target] of withTracks.entries()) {
            onProgress('CREATING', index + 1, withTracks.length, `Creating "${target.name}"...`)
            const outcome = await this._deliver(target, report, onProgress)
            if (outcome.error) {
                report.failure = failureOf(outcome.error)
                report.notCreated = withTracks.slice(index + (outcome.exists ? 1 : 0)).map(item => item.name)
                return
            }
        }
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
