/**
 * PlaylistsExport
 * Export functionality for playlists (JSON, Apple Music)
 * Part of Sprint 10 refactoring (PlaylistsView modularization)
 */

import toast from '../../components/Toast.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { playlistsStore } from '../../stores/playlists.js'
import { getIcon } from '../../components/Icons.js'

/**
 * Export playlists as JSON file
 * @param {Array} playlists - Array of playlist objects
 */
export function handleExportJson(playlists) {
    if (!playlists || playlists.length === 0) {
        playlists = playlistsStore.getPlaylists()
    }

    const json = JSON.stringify(playlists, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `playlists_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
}

/**
 * Export playlists to Apple Music
 * @param {Object} options - Options
 * @param {HTMLElement} options.btn - Button element to update
 * @param {Function} options.getIcon - Icon function
 */
export async function handleExportToAppleMusic(options = {}) {
    const { btn } = options
    const originalText = btn?.innerHTML

    try {
        // 1. Import MusicKitService
        const { musicKitService } = await import('../../services/MusicKitService.js')

        // 2. Initialize MusicKit
        if (btn) {
            btn.disabled = true
            btn.innerHTML = `${getIcon('Apple', 'w-5 h-5 animate-spin')} Connecting...`
        }

        await musicKitService.init()

        // 3. Authorize user (get library access)
        if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Authorizing...`
        await musicKitService.authorize()

        const playlists = playlistsStore.getPlaylists()
        if (playlists.length === 0) {
            toast.warning('No playlists to export')
            return
        }

        // 4. Get active series name for folder
        const activeSeries = albumSeriesStore.getActiveSeries()
        const seriesName = activeSeries?.name || 'MJRP Playlists'

        // 5. Create or find folder with series name
        if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Creating folder...`
        const folderId = await musicKitService.createOrGetFolder(seriesName)

        let successCount = 0
        let warningCount = 0

        // 6. Export each playlist
        for (const playlist of playlists) {
            const playlistName = `${seriesName} - ${playlist.name}`
            if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Exporting ${playlist.name}...`

            // Find tracks in Apple Music catalog with improved matching
            const trackIds = []
            const notFound = []

            for (const track of playlist.tracks) {
                // Use improved matching with album name and live album detection
                const isLiveAlbum = track.album?.toLowerCase().includes('live') || false
                const found = await musicKitService.findTrackFromAlbum(
                    track.title,
                    track.artist,
                    track.album || '',
                    isLiveAlbum
                )
                if (found) {
                    trackIds.push(found.id)
                } else {
                    notFound.push(`${track.artist} - ${track.title}`)
                }
            }

            if (trackIds.length > 0) {
                // Create playlist inside series folder
                await musicKitService.createPlaylistInFolder(playlistName, trackIds, folderId)
                successCount++

                if (notFound.length > 0) {
                    console.warn(`[AppleMusic] Tracks not found in ${playlist.name}:`, notFound)
                    warningCount += notFound.length
                }
            } else {
                toast.warning(`Could not find any tracks for "${playlist.name}"`)
            }

            // Small delay between playlist creations
            await new Promise(r => setTimeout(r, 500))
        }

        // 7. Show result
        if (successCount > 0) {
            if (warningCount > 0) {
                toast.success(`${successCount} playlist(s) exported to "${seriesName}" folder! (${warningCount} tracks not found)`)
            } else {
                toast.success(`${successCount} playlist(s) exported to "${seriesName}" folder! 🎉`)
            }
        } else {
            toast.error('Failed to export playlists')
        }

    } catch (error) {
        console.error('[AppleMusic] Export failed:', error)

        if (error.message?.includes('not configured')) {
            toast.error('Apple Music not configured. Please set up MusicKit credentials.')
        } else if (error.message?.includes('Authorization')) {
            toast.warning('Apple Music authorization was cancelled')
        } else {
            toast.error(`Export failed: ${error.message}`)
        }
    } finally {
        if (btn) {
            btn.disabled = false
            btn.innerHTML = originalText || 'Export to Apple Music'
        }
    }
}
