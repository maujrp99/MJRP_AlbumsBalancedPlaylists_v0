/**
 * SpotifyExportModal
 * Export playlists to Spotify with visual progress feedback
 * 
 * State Machine:
 * 1. IDLE: Initial state, showing playlist name input
 * 2. MATCHING: "Searching Spotify for track X/Y..."
 * 3. CREATING: "Creating playlist..."
 * 4. ADDING: "Adding tracks..."
 * 5. SUCCESS: "Done! [Open in Spotify]"
 * 6. ERROR: Warning list of unmatched tracks
 * 
 * @module components/SpotifyExportModal
 */

import { getIcon } from './Icons.js'
import toast from './Toast.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumSeriesStore } from '../stores/albumSeries.js'

// State constants
const STATES = {
    IDLE: 'IDLE',
    MATCHING: 'MATCHING',
    CREATING: 'CREATING',
    ADDING: 'ADDING',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
}

export class SpotifyExportModal {
    constructor() {
        this.state = STATES.IDLE
        this.progress = { current: 0, total: 0, message: '' }
        this.playlistName = ''
        this.createdPlaylistUrl = null
        this.notFoundTracks = []
        this.matchedCount = 0
        this.container = null

        // Bind methods
        this.render = this.render.bind(this)
        this.handleExport = this.handleExport.bind(this)
        this.close = this.close.bind(this)
    }

    /**
     * Show the modal
     */
    show() {
        // Set default playlist name from active series
        const activeSeries = albumSeriesStore.getActiveSeries()
        this.playlistName = activeSeries?.name || 'MJRP Playlist'

        // Create modal container
        this.container = document.createElement('div')
        this.container.id = 'spotify-export-modal'
        this.container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4'
        document.body.appendChild(this.container)

        this.updateUI()

        // Close on backdrop click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container.querySelector('.modal-backdrop')) {
                if (this.state === STATES.IDLE || this.state === STATES.SUCCESS || this.state === STATES.ERROR) {
                    this.close()
                }
            }
        })
    }

    /**
     * Close the modal
     */
    close() {
        if (this.container) {
            this.container.remove()
            this.container = null
        }
        // Reset state
        this.state = STATES.IDLE
        this.progress = { current: 0, total: 0, message: '' }
        this.notFoundTracks = []
        this.createdPlaylistUrl = null
    }

    /**
     * Update the modal UI
     */
    updateUI() {
        if (!this.container) return
        this.container.innerHTML = this.render()
        this.attachListeners()
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        const closeBtn = this.container.querySelector('#closeModalBtn')
        const exportBtn = this.container.querySelector('#startExportBtn')
        const nameInput = this.container.querySelector('#playlistNameInput')
        const openSpotifyBtn = this.container.querySelector('#openSpotifyBtn')

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close())
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport())
        }

        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.playlistName = e.target.value
            })
        }

        if (openSpotifyBtn && this.createdPlaylistUrl) {
            openSpotifyBtn.addEventListener('click', () => {
                window.open(this.createdPlaylistUrl, '_blank')
            })
        }
    }

    /**
     * Handle export process
     */
    async handleExport() {
        try {
            // Import services
            const { SpotifyAuthService } = await import('../services/SpotifyAuthService.js')
            const { SpotifyService } = await import('../services/SpotifyService.js')

            // Check auth
            if (!SpotifyAuthService.isAuthenticated()) {
                toast.warning('Connect to Spotify first')
                this.close()
                return
            }

            const playlists = playlistsStore.getPlaylists()
            if (playlists.length === 0) {
                toast.warning('No playlists to export')
                return
            }

            // Calculate total tracks
            const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)
            this.progress.total = totalTracks

            let processedTracks = 0
            const allTrackUris = []
            this.notFoundTracks = []

            // Phase 1: MATCHING - Find all tracks on Spotify
            this.state = STATES.MATCHING
            this.updateUI()

            for (const playlist of playlists) {
                for (const track of (playlist.tracks || [])) {
                    processedTracks++
                    this.progress.current = processedTracks
                    this.progress.message = `Searching: ${track.title || track.name}`
                    this.updateUI()

                    const found = await SpotifyService.searchTrack(
                        track.title || track.name,
                        track.artist,
                        track.album || ''
                    )

                    if (found) {
                        allTrackUris.push(found.uri)
                        this.matchedCount++
                    } else {
                        this.notFoundTracks.push({
                            title: track.title || track.name,
                            artist: track.artist,
                            playlist: playlist.title || playlist.name
                        })
                    }

                    // Rate limiting
                    await new Promise(r => setTimeout(r, 80))
                }
            }

            if (allTrackUris.length === 0) {
                this.state = STATES.ERROR
                this.progress.message = 'No tracks found on Spotify'
                this.updateUI()
                return
            }

            // Phase 2: CREATING - Create playlist
            this.state = STATES.CREATING
            this.progress.message = `Creating "${this.playlistName}"...`
            this.updateUI()

            const description = `Generated by MJRP Album Blender • ${this.matchedCount}/${totalTracks} tracks`
            const createdPlaylist = await SpotifyService.createPlaylist(this.playlistName, description)

            // Phase 3: ADDING - Add tracks
            this.state = STATES.ADDING
            this.progress.message = `Adding ${allTrackUris.length} tracks...`
            this.updateUI()

            await SpotifyService.addTracksToPlaylist(createdPlaylist.id, allTrackUris)

            // Phase 4: SUCCESS
            this.state = STATES.SUCCESS
            this.createdPlaylistUrl = createdPlaylist.external_urls?.spotify || `https://open.spotify.com/playlist/${createdPlaylist.id}`
            this.updateUI()

        } catch (error) {
            console.error('[SpotifyExportModal] Export failed:', error)
            this.state = STATES.ERROR
            this.progress.message = error.message || 'Export failed'
            this.updateUI()
        }
    }

    /**
     * Render modal content based on state
     */
    render() {
        return `
            <div class="modal-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div class="relative glass-panel rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                ${this.renderHeader()}
                ${this.renderContent()}
            </div>
        `
    }

    renderHeader() {
        const canClose = this.state === STATES.IDLE || this.state === STATES.SUCCESS || this.state === STATES.ERROR
        return `
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #1DB954;">
                        ${getIcon('Spotify', 'w-6 h-6 text-white')}
                    </div>
                    <h2 class="text-xl font-bold text-white">Export to Spotify</h2>
                </div>
                ${canClose ? `
                    <button id="closeModalBtn" class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        ${getIcon('X', 'w-5 h-5')}
                    </button>
                ` : ''}
            </div>
        `
    }

    renderContent() {
        switch (this.state) {
            case STATES.IDLE:
                return this.renderIdleState()
            case STATES.MATCHING:
            case STATES.CREATING:
            case STATES.ADDING:
                return this.renderProgressState()
            case STATES.SUCCESS:
                return this.renderSuccessState()
            case STATES.ERROR:
                return this.renderErrorState()
            default:
                return ''
        }
    }

    renderIdleState() {
        const playlists = playlistsStore.getPlaylists()
        const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)

        return `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm text-white/60 mb-2">Playlist Name</label>
                    <input 
                        type="text" 
                        id="playlistNameInput"
                        value="${this.playlistName}"
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#1DB954] transition-colors"
                        placeholder="Enter playlist name..."
                    />
                </div>

                <div class="bg-white/5 rounded-xl p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Playlists to merge</span>
                        <span class="text-white font-medium">${playlists.length}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Total tracks</span>
                        <span class="text-white font-medium">${totalTracks}</span>
                    </div>
                </div>

                <button 
                    id="startExportBtn"
                    class="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);"
                >
                    ${getIcon('Spotify', 'w-5 h-5')}
                    Export to Spotify
                </button>

                <p class="text-xs text-white/40 text-center">
                    All playlists will be merged into a single Spotify playlist
                </p>
            </div>
        `
    }

    renderProgressState() {
        const percentage = this.progress.total > 0
            ? Math.round((this.progress.current / this.progress.total) * 100)
            : 0

        const stateLabels = {
            [STATES.MATCHING]: 'Searching tracks...',
            [STATES.CREATING]: 'Creating playlist...',
            [STATES.ADDING]: 'Adding tracks...'
        }

        return `
            <div class="space-y-6 py-4">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style="background: #1DB954;">
                        ${getIcon('Spotify', 'w-8 h-8 text-white')}
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-1">${stateLabels[this.state]}</h3>
                    <p class="text-sm text-white/60 truncate max-w-[280px] mx-auto">${this.progress.message}</p>
                </div>

                ${this.state === STATES.MATCHING ? `
                    <div>
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-white/60">${this.progress.current} / ${this.progress.total}</span>
                            <span class="text-white font-medium">${percentage}%</span>
                        </div>
                        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-300" style="width: ${percentage}%; background: #1DB954;"></div>
                        </div>
                    </div>
                ` : `
                    <div class="flex justify-center">
                        <div class="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                `}
            </div>
        `
    }

    renderSuccessState() {
        const matchRate = this.progress.total > 0
            ? Math.round((this.matchedCount / this.progress.total) * 100)
            : 100

        return `
            <div class="space-y-6 py-4">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#1DB954]">
                        ${getIcon('Check', 'w-8 h-8 text-white')}
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Export Complete! 🎉</h3>
                    <p class="text-white/60">"${this.playlistName}" created successfully</p>
                </div>

                <div class="bg-white/5 rounded-xl p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Tracks matched</span>
                        <span class="text-[#1DB954] font-medium">${this.matchedCount} / ${this.progress.total}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Match rate</span>
                        <span class="text-white font-medium">${matchRate}%</span>
                    </div>
                </div>

                ${this.notFoundTracks.length > 0 ? `
                    <details class="text-sm">
                        <summary class="text-yellow-400 cursor-pointer hover:text-yellow-300 flex items-center gap-2">
                            ${getIcon('AlertTriangle', 'w-4 h-4')}
                            ${this.notFoundTracks.length} tracks not found
                        </summary>
                        <ul class="mt-2 space-y-1 text-white/60 max-h-32 overflow-y-auto pl-6">
                            ${this.notFoundTracks.slice(0, 10).map(t => `
                                <li class="truncate">• ${t.artist} - ${t.title}</li>
                            `).join('')}
                            ${this.notFoundTracks.length > 10 ? `<li class="text-white/40">...and ${this.notFoundTracks.length - 10} more</li>` : ''}
                        </ul>
                    </details>
                ` : ''}

                <button 
                    id="openSpotifyBtn"
                    class="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);"
                >
                    ${getIcon('ExternalLink', 'w-5 h-5')}
                    Open in Spotify
                </button>
            </div>
        `
    }

    renderErrorState() {
        return `
            <div class="space-y-6 py-4">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20">
                        ${getIcon('AlertTriangle', 'w-8 h-8 text-red-400')}
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Export Failed</h3>
                    <p class="text-white/60">${this.progress.message}</p>
                </div>

                ${this.notFoundTracks.length > 0 ? `
                    <div class="bg-white/5 rounded-xl p-4">
                        <p class="text-sm text-white/60 mb-2">${this.notFoundTracks.length} tracks not found:</p>
                        <ul class="space-y-1 text-sm text-white/60 max-h-32 overflow-y-auto">
                            ${this.notFoundTracks.slice(0, 5).map(t => `
                                <li class="truncate">• ${t.artist} - ${t.title}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <button 
                    id="closeModalBtn"
                    class="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                >
                    Close
                </button>
            </div>
        `
    }
}

// Singleton factory
export function showSpotifyExportModal() {
    const modal = new SpotifyExportModal()
    modal.show()
    return modal
}
