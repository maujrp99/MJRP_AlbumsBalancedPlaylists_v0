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

        // Sprint 15.5: Get batch name from store for playlist naming
        const batchName = playlistsStore.batchName || playlistsStore.editContext?.batchName || ''

        // 5. Create or find folder with series name
        if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Creating folder...`
        const folderId = await musicKitService.createOrGetFolder(seriesName)

        let successCount = 0
        let warningCount = 0

        // 6. Export each playlist
        for (let i = 0; i < playlists.length; i++) {
            const playlist = playlists[i]

            // Note: Algorithm-generated title (e.g., "Greatest Hits Vol. 1") doesn't have index prefix
            const playlistTitle = playlist.title || playlist.name

            let playlistName
            if (batchName) {
                // Format: "1. BatchName - Original Title" (e.g., "1. Batch 555 - Greatest Hits Vol. 1")
                playlistName = `${i + 1}. ${batchName} - ${playlistTitle}`
            } else {
                // Original format that worked (series name prefix)
                playlistName = `${seriesName} - ${playlistTitle}`
            }

            // DEBUG: Log the exact playlist name being sent
            console.log('[AppleMusic Export] Playlist name:', playlistName)
            if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Exporting ${playlistTitle}...`

            // Find tracks in Apple Music catalog with improved matching
            const trackIds = []
            const notFound = []

            for (const track of playlist.tracks) {
                // DEBUG: Log track data to see what IDs are available
                console.log('[AppleMusic Export] Track data:', {
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    appleMusicId: track.appleMusicId,
                    id: track.id,
                    spotifyId: track.spotifyId,
                    hasAppleMusicId: !!track.appleMusicId
                })

                // Helper: Check if ID is a valid Apple Music catalog ID (numeric)
                const isValidAppleMusicId = (id) => id && /^\d+$/.test(id)

                // 1. Check for existing VALID Apple Music ID (Fast Path)
                if (isValidAppleMusicId(track.appleMusicId)) {
                    console.log(`[AppleMusic Export] ✅ FAST PATH: Using existing ID ${track.appleMusicId} for "${track.title}"`)
                    trackIds.push(track.appleMusicId)
                    continue
                }

                // ID exists but is invalid (e.g., "track-3") - log and search
                if (track.appleMusicId && !isValidAppleMusicId(track.appleMusicId)) {
                    console.warn(`[AppleMusic Export] ⚠️ Invalid ID format "${track.appleMusicId}" for "${track.title}" - searching...`)
                }

                // 2. Fallback to Search (Slow Path)
                console.log(`[AppleMusic Export] 🔍 SLOW PATH: Searching for "${track.title}" by ${track.artist}`)
                const isLiveAlbum = track.album?.toLowerCase().includes('live') || false
                const found = await musicKitService.findTrackFromAlbum(
                    track.title,
                    track.artist,
                    track.album || '',
                    isLiveAlbum
                )
                if (found) {
                    console.log(`[AppleMusic Export] Found via search: ${found.id}`)
                    trackIds.push(found.id)
                } else {
                    console.log(`[AppleMusic Export] ❌ NOT FOUND: "${track.artist} - ${track.title}"`)
                    notFound.push(`${track.artist} - ${track.title}`)
                }
            }

            if (trackIds.length > 0) {
                // DEBUG: Log what we're sending to Apple
                console.log(`[AppleMusic Export] 📤 Creating playlist "${playlistName}" with ${trackIds.length} tracks:`, trackIds)

                // Create playlist inside series folder
                try {
                    const result = await musicKitService.createPlaylistInFolder(playlistName, trackIds, folderId)
                    console.log(`[AppleMusic Export] 📥 API Response:`, result)
                    successCount++
                } catch (apiError) {
                    console.error(`[AppleMusic Export] ❌ API ERROR:`, apiError)
                }

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

/**
 * Export playlists to Spotify
 * @param {Object} options - Options
 * @param {HTMLElement} options.btn - Button element to update
 */
export async function handleExportToSpotify(options = {}) {
    const { btn } = options
    const originalText = btn?.innerHTML

    try {
        // 1. Import Spotify services
        const { SpotifyAuthService } = await import('../../services/SpotifyAuthService.js')
        const { SpotifyService } = await import('../../services/SpotifyService.js')

        // 2. Check authentication
        if (!SpotifyAuthService.isAuthenticated()) {
            toast.warning('Connect to Spotify first (click the Spotify button in the header)')
            return
        }

        if (btn) {
            btn.disabled = true
            btn.innerHTML = `${getIcon('Spotify', 'w-5 h-5 animate-spin')} Connecting...`
        }

        const playlists = playlistsStore.getPlaylists()
        if (playlists.length === 0) {
            toast.warning('No playlists to export')
            return
        }

        // 3. Get active series name for playlist prefix
        const activeSeries = albumSeriesStore.getActiveSeries()
        const seriesName = activeSeries?.name || 'MJRP'

        // Sprint 15.5: Get batch name from store for playlist naming
        const batchName = playlistsStore.batchName || playlistsStore.editContext?.batchName || ''

        let successCount = 0
        let totalTracks = 0
        let matchedTracks = 0

        // 4. Export each playlist
        for (let i = 0; i < playlists.length; i++) {
            const playlist = playlists[i]

            // Note: Algorithm-generated title doesn't have index prefix
            const playlistTitle = playlist.title || playlist.name

            let playlistName
            if (batchName) {
                // Format: "1. BatchName - Original Title"
                playlistName = `${i + 1}. ${batchName} - ${playlistTitle}`
            } else {
                // Original format that worked (series name prefix)
                playlistName = `${seriesName} - ${playlistTitle}`
            }
            if (btn) btn.innerHTML = `${getIcon('Spotify', 'w-5 h-5')} Exporting ${playlistTitle}...`

            // Find tracks in Spotify catalog
            const trackUris = []
            const notFound = []

            for (const track of playlist.tracks) {
                totalTracks++

                // 1. Check for existing Spotify URI/ID (Fast Path)
                if (track.spotifyUri) {
                    trackUris.push(track.spotifyUri)
                    matchedTracks++
                    continue
                }
                if (track.spotifyId) {
                    trackUris.push(`spotify:track:${track.spotifyId}`)
                    matchedTracks++
                    continue
                }

                // 2. Fallback to Search (Slow Path)
                const found = await SpotifyService.searchTrack(
                    track.title || track.name,
                    track.artist,
                    track.album || ''
                )
                if (found) {
                    trackUris.push(found.uri)
                    matchedTracks++
                } else {
                    notFound.push(`${track.artist} - ${track.title || track.name}`)
                }

                // Rate limiting: small delay between searches
                await new Promise(r => setTimeout(r, 100))
            }

            if (trackUris.length > 0) {
                // Create playlist and add tracks
                const description = `Generated by MJRP Album Blender from "${seriesName}"`
                const createdPlaylist = await SpotifyService.createPlaylist(playlistName, description)
                await SpotifyService.addTracksToPlaylist(createdPlaylist.id, trackUris)
                successCount++

                if (notFound.length > 0) {
                    console.warn(`[Spotify] Tracks not found in ${playlist.title || playlist.name}:`, notFound)
                }
            } else {
                toast.warning(`Could not find any tracks for "${playlist.title || playlist.name}"`)
            }

            // Delay between playlist creations
            await new Promise(r => setTimeout(r, 500))
        }

        // 5. Show result
        if (successCount > 0) {
            const matchRate = Math.round((matchedTracks / totalTracks) * 100)
            toast.success(`${successCount} playlist(s) exported to Spotify! (${matchRate}% tracks matched) 🎉`)
        } else {
            toast.error('Failed to export playlists')
        }

    } catch (error) {
        console.error('[Spotify] Export failed:', error)

        if (error.message?.includes('401') || error.message?.includes('Token')) {
            toast.error('Spotify session expired. Please reconnect.')
        } else {
            toast.error(`Export failed: ${error.message}`)
        }
    } finally {
        if (btn) {
            btn.disabled = false
            btn.innerHTML = originalText || 'Export to Spotify'
        }
    }
}
