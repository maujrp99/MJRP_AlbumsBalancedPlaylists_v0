/**
 * PlaylistsExport
 * Export functionality for playlists (JSON, Apple Music); the Spotify export has its own window
 * (ui/SpotifyExportWindow.tsx)
 * Part of Sprint 10 refactoring (PlaylistsView modularization)
 */

import toast from '../components/Toast.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { playlistsStore } from '../stores/playlists.js'
import { getIcon } from '../components/Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'
import { AppleMusicExportService, appleExportMessages } from '../services/AppleMusicExportService.js'
import { track } from '../services/usage/track.js'

/**
 * Helper: Resolve effective batch name with fallback
 * @returns {string} Effective batch name
 */
function getEffectiveBatchName() {
    const storeState = playlistsStore.getState()
    return playlistsStore.batchName ||
        playlistsStore.editContext?.currentBatchName ||
        playlistsStore.editContext?.batchName ||
        storeState.defaultBatchName ||
        'Unsaved Batch'
}

/** The series the playlists belong to: the one given (the saved playlists screen), else the open one. */
export const seriesNameOf = (given) => given || albumSeriesStore.getActiveSeries()?.name || 'MJRP Playlists'

/**
 * Export playlists as JSON file
 * @param {Array} playlists - Array of playlist objects; none given: the ones on the edit screen
 * @param {Object} [names]
 * @param {string} [names.batchName] - the batch they belong to; none given: the one on the edit screen
 */
export function handleExportJson(playlists, { batchName: givenBatchName } = {}) {
    if (!playlists || playlists.length === 0) {
        playlists = playlistsStore.getPlaylists()
    }

    const batchName = givenBatchName || getEffectiveBatchName()

    // Ensure playlists have the batch name attached (for unsaved batches)
    const exportData = playlists.map(p => ({
        ...p,
        batchName: p.batchName || batchName
    }))

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    // Sanitize batch name for filename
    const safeName = batchName.replace(/[^a-z0-9 -]/gi, '_')
    a.download = `playlists_${safeName}_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
    // F77: the file was handed to the browser; how many playlists, never their names
    track('playlists_exported', { target: 'json', outcome: 'complete', playlist_count: exportData.length })
}

/** Where the progress of the Apple export is written: told to the screen that draws its own button, or written on the button given. */
function progressWriter({ btn, onStatus }) {
    if (onStatus) return onStatus
    return (text) => {
        if (!btn) return
        btn.disabled = true
        btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} ${escapeHtml(text)}`
    }
}

/** The end of the export: the screen is told it is over, or the button is given back as it was. */
function giveBackButton({ btn, onStatus, originalText }) {
    if (onStatus) onStatus(null)
    if (!btn) return
    btn.disabled = false
    btn.innerHTML = originalText || 'Export to Apple Music'
}

/** How long the report of an export stays: it names playlists, it is not read at a glance. */
const REPORT_MS = 12000

/** One export to Apple Music at a time: a second press while one runs creates nothing. */
let appleExportRunning = false

/**
 * Export playlists to Apple Music and tell the person what happened: what was created, what was
 * not and why (F62). The rule of the export (the report, no second copy of a playlist already
 * created in this session) is AppleMusicExportService's. The edit screen gives no playlists and
 * exports the ones it holds; the saved playlists screen gives one playlist or the whole batch (F90).
 *
 * @param {Object} options - Options
 * @param {HTMLElement} [options.btn] - the button pressed: it shows the progress and is given back
 * @param {(text: string|null) => void} [options.onStatus] - a screen that draws its own button is told the progress instead
 *   (a text while it runs, null when it is over)
 * @param {Array} [options.playlists] - what to export; none given: the playlists on the edit screen
 * @param {string} [options.seriesName] - the folder; none given: the open series
 * @param {string} [options.batchName] - the batch; none given: the one on the edit screen
 * @param {number[]} [options.positions] - the position of each playlist in its batch
 * @param {string} [options.folderName] - the Apple Music folder; none given: the series name (F90)
 * @param {string} [options.folderId] - the id of that folder, when it was picked from the library's list (F90)
 * @param {boolean} [options.noFolder] - no folder: the top of the library (F90)
 */
export async function handleExportToAppleMusic(options = {}) {
    const { btn, onStatus } = options

    if (appleExportRunning) {
        toast.info('The export to Apple Music is already running.')
        return
    }
    const playlists = options.playlists || playlistsStore.getPlaylists()
    if (playlists.length === 0) {
        toast.warning('No playlists to export')
        return
    }

    appleExportRunning = true
    const originalText = btn?.innerHTML
    const say = progressWriter({ btn, onStatus })
    say('Connecting...')

    try {
        const { musicKitService } = await import('../services/MusicKitService.js')
        const report = await AppleMusicExportService.exportPlaylists(
            playlists,
            { seriesName: seriesNameOf(options.seriesName), batchName: options.batchName || getEffectiveBatchName(), positions: options.positions, folderName: options.folderName, folderId: options.folderId, noFolder: options.noFolder },
            { musicKit: musicKitService, onProgress: say }
        )
        appleExportMessages(report).forEach(message => toast[message.type](message.text, REPORT_MS))
    } catch (error) {
        console.error('[AppleMusic] Export failed:', error)
        toast.error(`The export to Apple Music failed: ${error.message}`, REPORT_MS)
    } finally {
        appleExportRunning = false
        giveBackButton({ btn, onStatus, originalText })
    }
}
