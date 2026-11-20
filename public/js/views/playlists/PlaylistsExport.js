/**
 * PlaylistsExport
 * Export functionality for playlists (JSON, Apple Music); the Spotify export has its own window
 * (components/SpotifyExportModal.js)
 * Part of Sprint 10 refactoring (PlaylistsView modularization)
 */

import toast from '../../components/Toast.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { playlistsStore } from '../../stores/playlists.js'
import { getIcon } from '../../components/Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'
import { AppleMusicExportService, appleExportMessages } from '../../services/AppleMusicExportService.js'
import { track } from '../../services/usage/track.js'

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

/**
 * Export playlists as JSON file
 * @param {Array} playlists - Array of playlist objects
 */
export function handleExportJson(playlists) {
    if (!playlists || playlists.length === 0) {
        playlists = playlistsStore.getPlaylists()
    }

    const batchName = getEffectiveBatchName()

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

/** How long the report of an export stays: it names playlists, it is not read at a glance. */
const REPORT_MS = 12000

/** One export to Apple Music at a time: a second press while one runs creates nothing. */
let appleExportRunning = false

/**
 * Export the playlists on screen to Apple Music and tell the person what happened: what was
 * created, what was not and why (F62). The rule of the export (the report, no second copy of a
 * playlist already created in this session) is AppleMusicExportService's.
 *
 * @param {Object} options - Options
 * @param {HTMLElement} [options.btn] - the button pressed: it shows the progress and is given back
 */
export async function handleExportToAppleMusic(options = {}) {
    const { btn } = options

    if (appleExportRunning) {
        toast.info('The export to Apple Music is already running.')
        return
    }
    const playlists = playlistsStore.getPlaylists()
    if (playlists.length === 0) {
        toast.warning('No playlists to export')
        return
    }

    appleExportRunning = true
    const originalText = btn?.innerHTML
    const say = (text) => {
        if (!btn) return
        btn.disabled = true
        btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} ${escapeHtml(text)}`
    }
    say('Connecting...')

    try {
        const { musicKitService } = await import('../../services/MusicKitService.js')
        const report = await AppleMusicExportService.exportPlaylists(
            playlists,
            { seriesName: albumSeriesStore.getActiveSeries()?.name || 'MJRP Playlists', batchName: getEffectiveBatchName() },
            { musicKit: musicKitService, onProgress: say }
        )
        appleExportMessages(report).forEach(message => toast[message.type](message.text, REPORT_MS))
    } catch (error) {
        console.error('[AppleMusic] Export failed:', error)
        toast.error(`The export to Apple Music failed: ${error.message}`, REPORT_MS)
    } finally {
        appleExportRunning = false
        if (btn) {
            btn.disabled = false
            btn.innerHTML = originalText || 'Export to Apple Music'
        }
    }
}
