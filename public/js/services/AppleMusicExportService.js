/**
 * AppleMusicExportService
 *
 * Exports the playlists on screen to the person's Apple Music library and reports what happened
 * (F62). The export never ends in silence. Its answer (AppleExportReport) says:
 *   folder      { name, created } - the folder of the series; `created: false` when Apple Music
 *               did not give one, and the playlists went to the top of the library
 *   created     the playlists that are in the library: { name, tracks, total, alreadyThere }
 *               (`alreadyThere`: this session had sent it before, so it was not created again)
 *   failed      [{ name, message }] - Apple Music refused to create it; the others are still tried
 *   empty       not created: none of its tracks was found in the catalog
 *   notFound    the tracks left out ("Artist - Title")
 *   notCreated  everything, when the export stopped before it began
 *   failure     null, or why it never began: { kind: 'not-configured' | 'authorization' | 'error', message }
 *
 * No second copy: a playlist this session already created is not created again. The id Apple
 * Music gave it is remembered for the session (services/export/exportLedger.js). The library is
 * not searched instead, on purpose: names are not unique there and a playlist that was just
 * created takes a while to be listed, so the search would miss exactly the second click.
 */

import { exportLedger } from './export/exportLedger.js'
import { exportOutcome } from '../models/exportOutcome.js'
import { track } from './usage/track.js'

/** Between two creations, as the export always did. */
const BETWEEN_PLAYLISTS_MS = 500

/** How many names a message lists before it counts the rest. */
const NAMED_AT_MOST = 5

const titleOf = (playlist) => playlist.title || playlist.name

/** F77: how the export ended, measured once, whatever way it ended. */
function measured(report, playlists) {
    track('playlists_exported', { target: 'apple_music', outcome: exportOutcome(report), playlist_count: playlists.length })
    return report
}
const isCatalogId = (id) => !!id && /^\d+$/.test(String(id))

/** Why the export never began, in the terms the screen tells the person. */
function failureOf(error) {
    const message = error?.message || 'Apple Music did not answer'
    if (/not configured/i.test(message)) return { kind: 'not-configured', message }
    if (/authoriz/i.test(message)) return { kind: 'authorization', message }
    return { kind: 'error', message }
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
     * @param {boolean} [names.noFolder] - no folder: the playlists go to the top of the library
     * @param {number[]} [names.positions] - the position each playlist has in its batch (1-based), for
     *        one playlist or some of a batch: the name is then the one the export of the whole batch gives
     * @param {Object} deps
     * @param {Object} deps.musicKit - MusicKitService
     * @param {Function} [deps.onProgress] - (text) => void
     * @returns {Promise<Object>} AppleExportReport (see the top of this file)
     * @throws only when there is nothing to export
     */
    static async exportPlaylists(playlists, { seriesName, batchName, positions = [], folderName = seriesName, noFolder = false }, { musicKit, onProgress = () => { } }) {
        if (!playlists || playlists.length === 0) throw new Error('No playlists to export')

        const targets = playlists.map((playlist, index) => ({
            name: `${positions[index] || index + 1}. ${batchName} - ${titleOf(playlist)}`,
            tracks: playlist.tracks || []
        }))
        const report = {
            folder: noFolder ? { name: null, created: false, none: true } : { name: folderName, created: false },
            created: [], failed: [], empty: [], notFound: [], notCreated: [],
            failure: null
        }

        let folderId
        try {
            onProgress('Connecting...')
            await musicKit.init()
            onProgress('Authorizing...')
            await musicKit.authorize()
            if (!noFolder) {
                onProgress('Creating folder...')
                folderId = await musicKit.createOrGetFolder(folderName)
            }
        } catch (error) {
            console.error('[AppleMusicExport] could not start:', error)
            report.failure = failureOf(error)
            report.notCreated = targets.map(target => target.name)
            return measured(report, playlists)
        }
        report.folder.created = !!folderId

        for (const target of targets) {
            onProgress(`Exporting ${target.name}...`)
            await this._deliver(target, folderId || null, report, musicKit)
        }
        return measured(report, playlists)
    }

    /** Have one playlist in the library, unless this session already put it there. */
    static async _deliver(target, folderId, report, musicKit) {
        const trackIds = await this._catalogIdsOf(target.tracks, report, musicKit)
        if (trackIds.length === 0) {
            report.empty.push(target.name)
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
            console.error(`[AppleMusicExport] "${target.name}" was not created:`, error)
            report.failed.push({ name: target.name, message: error?.message || 'Apple Music did not answer' })
        }
        await this.pause(BETWEEN_PLAYLISTS_MS)
    }

    /** The catalog id of each track: the one it carries, or the one a search finds. */
    static async _catalogIdsOf(tracks, report, musicKit) {
        const ids = []
        for (const track of tracks) {
            const id = isCatalogId(track.appleMusicId) ? String(track.appleMusicId) : await this._searchId(track, musicKit)
            if (id) ids.push(id)
            else report.notFound.push(`${track.artist} - ${track.title}`)
        }
        return ids
    }

    static async _searchId(track, musicKit) {
        const isLiveAlbum = track.album?.toLowerCase().includes('live') || false
        const found = await musicKit.findTrackFromAlbum(track.title, track.artist, track.album || '', isLiveAlbum)
        return found?.id ? String(found.id) : null
    }
}

// ---------- what the person is told ----------

const count = (number, noun) => `${number} ${noun}${number === 1 ? '' : 's'}`
const quoted = (names) => names.map(name => `"${name}"`).join(', ')
const listed = (names) => {
    const shown = names.slice(0, NAMED_AT_MOST).join(', ')
    return names.length > NAMED_AT_MOST ? `${shown} and ${names.length - NAMED_AT_MOST} more` : shown
}

const NEVER_BEGAN = Object.freeze({
    'not-configured': () => ({ type: 'error', text: 'Apple Music is not set up for this site: nothing was exported.' }),
    authorization: () => ({ type: 'warning', text: 'Apple Music was not authorized: nothing was exported.' }),
    error: (failure) => ({ type: 'error', text: `The export to Apple Music failed before anything was created: ${failure.message}.` })
})

function failedMessage(report, total) {
    const reasons = report.failed.map(item => `"${item.name}" (${item.message})`).join(', ')
    return {
        type: 'error',
        text: `Apple Music did not create ${report.failed.length} of ${count(total, 'playlist')}: ${reasons}. ` +
            'Export again to create what is missing: what was created is not created twice.'
    }
}

function createdMessage(report, fresh) {
    const where = report.folder.created ? `, in the folder "${report.folder.name}"` : (report.folder.none ? ', outside any folder' : '')
    const which = report.failed.length > 0 ? `: ${quoted(fresh.map(item => item.name))}` : ''
    return { type: 'success', text: `${count(fresh.length, 'playlist')} exported to Apple Music${where}${which}.` }
}

function alreadyThereMessage(already) {
    const were = already.length === 1 ? 'was' : 'were'
    return { type: 'info', text: `${count(already.length, 'playlist')} ${were} already exported in this session and ${were} not created again.` }
}

function leftOutMessages(report, fresh) {
    const messages = []
    if (fresh.length > 0 && !report.folder.created && !report.folder.none) {
        messages.push({ type: 'warning', text: `The folder "${report.folder.name}" could not be created in Apple Music: the playlists are at the top of your library.` })
    }
    if (report.empty.length > 0) {
        messages.push({ type: 'warning', text: `No track was found in Apple Music for ${quoted(report.empty)}: not created.` })
    }
    if (report.notFound.length > 0) {
        const were = report.notFound.length === 1 ? 'was' : 'were'
        messages.push({ type: 'warning', text: `${count(report.notFound.length, 'track')} ${were} not found in Apple Music and ${were} left out: ${listed(report.notFound)}.` })
    }
    return messages
}

/**
 * What to tell the person about an export, most important first.
 * @param {Object} report - AppleExportReport
 * @returns {Array<{ type: 'success'|'info'|'warning'|'error', text: string }>}
 */
export function appleExportMessages(report) {
    if (report.failure) return [NEVER_BEGAN[report.failure.kind](report.failure)]

    const fresh = report.created.filter(item => !item.alreadyThere)
    const already = report.created.filter(item => item.alreadyThere)
    const total = report.created.length + report.failed.length + report.empty.length

    return [
        ...(report.failed.length > 0 ? [failedMessage(report, total)] : []),
        ...(fresh.length > 0 ? [createdMessage(report, fresh)] : []),
        ...(already.length > 0 ? [alreadyThereMessage(already)] : []),
        ...leftOutMessages(report, fresh)
    ]
}
