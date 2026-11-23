/**
 * AppleMusicExportService
 *
 * Exports the playlists on screen to the person's Apple Music library and reports what happened
 * (F62). The export never ends in silence. Its answer (AppleExportReport) says:
 *   folder      { name, created } - the folder of the series; `created: false` when Apple Music
 *               did not give one, and the playlists went to the top of the library
 *   created     the playlists that are in the library: { name, tracks, total, alreadyThere }
 *               (`alreadyThere`: this session had sent it before, so it was not created again)
 *   failed      [{ name, detail }] - Apple Music did not create it (`detail`: what Apple Music said, or null); the others are still tried
 *   empty       not created: Apple Music answered every search of its tracks and had none of them
 *   notFound    the tracks left out because the catalogue has none ("Artist - Title"). A track is here ONLY when
 *               Apple Music answered and had none (F98, UAT-307)
 *   unchecked   how many tracks could not be checked: their search failed (network, 5xx, timeout). Never "not found" (F98)
 *   uncheckedTracks  those tracks ("Artist - Title")
 *   notCreated  what was left to do when the export stopped, and what had no track that could be checked
 *   failure     null, or why it stopped or created nothing: { kind, detail? }
 *               'not-configured'  Apple Music is not set up for this site
 *               'authorization'   the person did not authorize
 *               'refused'         Apple Music refused the person: no subscription, an authorization revoked, 401/403 (F98)
 *               'unreachable'     MusicKit did not start in time, or its script did not load
 *               'unchecked'       nothing was created and at least one search failed (F98)
 *               'not-found'       nothing was created: Apple Music answered every search and had none
 *               'error'           it did not start, for another reason; `detail`: what was said, or null
 *
 * The service writes no sentence (F98, UAT-308): the report is data, the progress is a step and a name, and whoever shows them says
 * the words in the language of the app (ui/AppleExportReport.tsx, i18n/exportTexts.js).
 *
 * No second copy: a playlist this session already created is not created again. The id Apple
 * Music gave it is remembered for the session (services/export/exportLedger.js). The library is
 * not searched instead, on purpose: names are not unique there and a playlist that was just
 * created takes a while to be listed, so the search would miss exactly the second click.
 */

import { exportLedger } from './export/exportLedger.js'
import { exportOutcome, exportReason } from '../models/exportOutcome.js'
import { AppleMusicAuthorizationError, isRefusal } from './musickit/musicKitErrors.js'
import { track } from './usage/track.js'

/** Between two creations, as the export always did. */
const BETWEEN_PLAYLISTS_MS = 500

const titleOf = (playlist) => playlist.title || playlist.name
const nameOf = (track) => `${track.artist} - ${track.title}`

/** F77: how the export ended, measured once, whatever way it ended; the reason, as for Spotify (F98). */
function measured(report, playlists) {
    const reason = exportReason(report)
    track('playlists_exported', { target: 'apple_music', outcome: exportOutcome(report), ...(reason ? { reason } : {}), playlist_count: playlists.length })
    return report
}
const isCatalogId = (id) => !!id && /^\d+$/.test(String(id))

/** MusicKit did not start in time, or its script did not come. */
const isUnreachable = (error) => error?.name === 'DeadlineError' || /Failed to load MusicKit/i.test(String(error?.message || ''))

/** Why the export stopped, in the terms the screen acts on. */
function failureOf(error) {
    const said = error?.message ? String(error.message) : null
    if (error instanceof AppleMusicAuthorizationError) return { kind: 'authorization' }
    if (isRefusal(error)) return { kind: 'refused' }
    if (/not configured/i.test(said || '')) return { kind: 'not-configured' }
    if (/authoriz/i.test(said || '')) return { kind: 'authorization' }
    if (isUnreachable(error)) return { kind: 'unreachable' }
    return { kind: 'error', detail: said }
}

/** What an export will do: the folder (the series' name unless another was chosen) and each playlist with the name it gets. */
function planOf(playlists, { seriesName, batchName, positions = [], folderName = seriesName, folderId, noFolder = false }) {
    const targets = playlists.map((playlist, index) => ({
        name: `${positions[index] || index + 1}. ${batchName} - ${titleOf(playlist)}`,
        tracks: playlist.tracks || []
    }))
    return { folderName, folderId, noFolder, targets }
}

/** The report of an export that has not begun. */
function emptyReport({ folderName, noFolder }) {
    return {
        folder: noFolder ? { name: null, created: false, none: true } : { name: folderName, created: false },
        created: [], failed: [], empty: [], notFound: [], notCreated: [],
        unchecked: 0, uncheckedTracks: [],
        failure: null
    }
}

/** Nothing was created and nothing stopped the export: why. Null when something was created or Apple Music refused a creation. */
function nothingCreatedOf(report) {
    if (report.created.length > 0 || report.failed.length > 0) return null
    if (report.unchecked > 0) return { kind: 'unchecked' }
    return report.empty.length > 0 ? { kind: 'not-found' } : null
}

export class AppleMusicExportService {

    /** Replaceable in tests. */
    static pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * @param {Array} playlists - the playlists on screen
     * @param {Object} names
     * @param {string} names.seriesName - the folder the playlists go into
     * @param {string} names.batchName - each playlist is named "<position>. <batchName> - <title>"
     * @param {string} [names.folderName] - the folder to put them in (F90); none given: the series' name
     * @param {string} [names.folderId] - the id of that folder when it was picked from the library's list: used as it is
     * @param {boolean} [names.noFolder] - no folder: the playlists go to the top of the library
     * @param {number[]} [names.positions] - the position each playlist has in its batch (1-based), for
     *        one playlist or some of a batch: the name is then the one the export of the whole batch gives
     * @param {Object} deps
     * @param {Object} deps.musicKit - MusicKitService
     * @param {Function} [deps.onProgress] - ({ step: 'connecting'|'authorizing'|'folder'|'exporting', name? }) => void
     * @returns {Promise<Object>} AppleExportReport (see the top of this file)
     * @throws only when there is nothing to export
     */
    static async exportPlaylists(playlists, names, deps) {
        const { musicKit, onProgress = () => { } } = deps
        if (!playlists || playlists.length === 0) throw new Error('No playlists to export')

        const { folderName, folderId: pickedId, noFolder, targets } = planOf(playlists, names)
        const report = emptyReport({ folderName, noFolder })

        let folderId
        try {
            folderId = await this._start(musicKit, { folderName, folderId: pickedId, noFolder }, onProgress)
        } catch (error) {
            console.error('[AppleMusicExport] could not start:', error)
            report.failure = failureOf(error)
            report.notCreated = targets.map(target => target.name)
            return measured(report, playlists)
        }
        report.folder.created = !!folderId

        for (const [index, target] of targets.entries()) {
            onProgress({ step: 'exporting', name: target.name })
            try {
                await this._deliver(target, folderId || null, report, musicKit)
            } catch (error) {
                // only a refusal of Apple Music comes here: the playlists left would be refused too
                console.error('[AppleMusicExport] stopped:', error)
                report.failure = failureOf(error)
                report.notCreated.push(...targets.slice(index).map(left => left.name))
                return measured(report, playlists)
            }
        }
        report.failure = nothingCreatedOf(report)
        return measured(report, playlists)
    }

    /** Connect, authorize and have the folder (none when the person chose no folder). @returns {Promise<string|undefined>} the folder id */
    static async _start(musicKit, { folderName, folderId, noFolder }, onProgress) {
        onProgress({ step: 'connecting' })
        await musicKit.init()
        onProgress({ step: 'authorizing' })
        await musicKit.authorize()
        if (noFolder) return undefined
        if (folderId) return folderId // picked from the library's own list: no second lookup by name
        onProgress({ step: 'folder' })
        return musicKit.createOrGetFolder(folderName)
    }

    /**
     * Have one playlist in the library, unless this session already put it there.
     * @throws when Apple Music refuses the person (a search or the creation): the export stops
     */
    static async _deliver(target, folderId, report, musicKit) {
        const before = report.unchecked
        const trackIds = await this._catalogIdsOf(target.tracks, report, musicKit)
        if (trackIds.length === 0) {
            // "no track found" only when Apple Music answered for every track; one that could not be checked is "not created"
            const list = report.unchecked > before ? report.notCreated : report.empty
            list.push(target.name)
            return
        }

        const key = exportLedger.keyOf('apple', target.name, trackIds)
        const entry = { name: target.name, tracks: trackIds.length, total: target.tracks.length }
        if (exportLedger.get(key)) {
            report.created.push({ ...entry, alreadyThere: true })
            return
        }

        try {
            const playlist = await musicKit.createPlaylistInFolder(target.name, trackIds, folderId)
            exportLedger.set(key, { id: playlist?.id || null })
            report.created.push({ ...entry, alreadyThere: false })
        } catch (error) {
            if (isRefusal(error)) throw error
            console.error(`[AppleMusicExport] "${target.name}" was not created:`, error)
            report.failed.push({ name: target.name, detail: error?.message ? String(error.message) : null })
        }
        await this.pause(BETWEEN_PLAYLISTS_MS)
    }

    /**
     * The catalog id of each track: the one it carries, or the one a search finds. A track the catalogue does not have goes
     * to `notFound`; one whose search failed, to the unchecked - they are counted apart (F98).
     */
    static async _catalogIdsOf(tracks, report, musicKit) {
        const ids = []
        for (const track of tracks) {
            const found = isCatalogId(track.appleMusicId) ? { id: String(track.appleMusicId) } : await this._searchId(track, musicKit)
            if (found.id) ids.push(found.id)
            else if (found.unchecked) {
                report.unchecked++
                report.uncheckedTracks.push(nameOf(track))
            } else report.notFound.push(nameOf(track))
        }
        return ids
    }

    /**
     * The catalog id of a track, by a search.
     * @returns {Promise<{ id: string|null, unchecked?: true }>} `id: null` alone: Apple Music answered and has none;
     *          `unchecked`: the search could not be made, so nothing is known about the track
     * @throws when Apple Music refuses the person: nothing else would be answered either
     */
    static async _searchId(track, musicKit) {
        const isLiveAlbum = track.album?.toLowerCase().includes('live') || false
        try {
            const found = await musicKit.findTrackFromAlbum(track.title, track.artist, track.album || '', isLiveAlbum)
            return { id: found?.id ? String(found.id) : null }
        } catch (error) {
            if (isRefusal(error)) throw error
            console.warn('[AppleMusicExport] Track search failed:', track.title, error?.message)
            return { id: null, unchecked: true }
        }
    }
}
