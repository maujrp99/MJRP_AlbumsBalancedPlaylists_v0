/**
 * SpotifyExportModal
 * Export playlists to Spotify with visual progress feedback
 * Refactored in Sprint 18 to use SpotifyExportService
 *
 * F62: the window ends on the report of the export (SpotifyExportService): what was created, each
 * with its link; what was not; why it stopped; and what the person can do next - connect again
 * when the access could not be renewed, try again otherwise.
 */

import { getIcon } from './Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'
import { safeUrl } from '../utils/safeUrl.js'
import toast from './Toast.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { SpotifyExportService } from '../services/SpotifyExportService.js'
import { SpotifyAuthService } from '../services/SpotifyAuthService.js'

// State constants
const STATES = {
    IDLE: 'IDLE',
    MATCHING: 'MATCHING',
    CREATING: 'CREATING',
    ADDING: 'ADDING',
    DONE: 'DONE' // the export ended: the report is shown, whatever it says
}

/** What each mode creates, said under the export button (UAT-09). */
const MODE_NOTES = Object.freeze({
    merge: 'All playlists will be merged into a single Spotify playlist',
    separate: 'Each playlist becomes its own Spotify playlist, named after this name and its title'
})

/** The report of an export that broke where the service did not foresee. */
const brokenReport = (error) => ({
    mode: 'merge', totalTracks: 0, matchCount: 0, created: [], incomplete: [], empty: [], notCreated: [],
    failure: { kind: 'error', message: error?.message || 'Export failed' }
})

export class SpotifyExportModal {
    constructor() {
        this.state = STATES.IDLE
        this.progress = { current: 0, total: 0, message: '' }
        this.playlistName = ''
        this.mode = 'merge'
        this.report = null      // what the last export answered
        this.exporting = false  // one export at a time
        this.notFoundTracks = []
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
            if (e.target === this.container.querySelector('.modal-backdrop') && this.canClose()) this.close()
        })
    }

    /** The window closes when no export is on its way. */
    canClose() {
        return this.state === STATES.IDLE || this.state === STATES.DONE
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
        this.report = null
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
        const on = (selector, type, listener) => this.container.querySelector(selector)?.addEventListener(type, listener)

        this.container.querySelectorAll('.close-modal-btn').forEach(button => button.addEventListener('click', () => this.close()))
        on('#startExportBtn', 'click', () => this.handleExport())
        on('#retryExportBtn', 'click', () => this.handleExport())
        on('#reconnectSpotifyBtn', 'click', () => SpotifyAuthService.login())
        on('#playlistNameInput', 'input', (e) => { this.playlistName = e.target.value })

        // The text under the button follows the mode chosen (UAT-09)
        this.container.querySelectorAll('input[name="exportMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.mode = radio.value === 'separate' ? 'separate' : 'merge'
                const note = this.container.querySelector('#exportModeNote')
                if (note) note.textContent = MODE_NOTES[this.mode]
            })
        })
    }

    /**
     * Run the export with the name and the mode chosen, and end on its report. One at a time.
     */
    async handleExport() {
        if (this.exporting) return

        const playlists = playlistsStore.getPlaylists()
        if (playlists.length === 0) {
            toast.warning('No playlists to export')
            return
        }

        this.exporting = true
        this.notFoundTracks = []
        try {
            this.report = await SpotifyExportService.exportPlaylists(
                playlists,
                { mode: this.mode, name: this.playlistName },
                {
                    onProgress: (stage, current, total, message) => {
                        this.state = stage // MATCHING, CREATING, ADDING
                        this.progress = { current, total, message }
                        this.updateUI()
                    },
                    onNotFound: (track) => {
                        this.notFoundTracks.push(track)
                    }
                }
            )
        } catch (error) {
            console.error('[SpotifyExportModal] Export failed:', error)
            this.report = brokenReport(error)
        } finally {
            this.exporting = false
        }

        this.state = STATES.DONE
        this.updateUI()
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
        const canClose = this.canClose()
        return `
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #1DB954;">
                        ${getIcon('Spotify', 'w-6 h-6 text-white')}
                    </div>
                    <h2 class="text-xl font-bold text-white">Export to Spotify</h2>
                </div>
                ${canClose ? `
                    <button id="closeModalBtn" aria-label="Close" class="close-modal-btn p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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
            case STATES.DONE:
                return this.renderReportState()
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
                        value="${escapeHtml(this.playlistName)}"
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#1DB954] transition-colors"
                        placeholder="Enter playlist name..."
                    />
                </div>

                <div class="bg-white/5 rounded-xl p-4 space-y-3">
                    <label class="block text-sm text-white/60">Export Mode</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportMode" value="merge" ${this.mode === 'merge' ? 'checked' : ''} class="accent-[#1DB954]">
                            <span class="text-sm text-white">Merge All</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportMode" value="separate" ${this.mode === 'separate' ? 'checked' : ''} class="accent-[#1DB954]">
                            <span class="text-sm text-white">Separate Playlists</span>
                        </label>
                    </div>

                    <div class="h-px bg-white/10 my-2"></div>

                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Playlists</span>
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

                <p id="exportModeNote" class="text-xs text-white/40 text-center">${MODE_NOTES[this.mode]}</p>
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
                    <p class="text-sm text-white/60 truncate max-w-[280px] mx-auto">${escapeHtml(this.progress.message)}</p>
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

    /**
     * The end of an export: what it created, what it did not, why it stopped, what to do next.
     */
    renderReportState() {
        const report = this.report
        const { failure } = report
        const done = report.created.length + report.incomplete.length

        const heading = !failure ? 'Export Complete! 🎉' : (done > 0 ? 'Export stopped part of the way' : 'Export Failed')
        const mark = failure
            ? `<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20">${getIcon('AlertTriangle', 'w-8 h-8 text-red-400')}</div>`
            : `<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#1DB954]">${getIcon('Check', 'w-8 h-8 text-white')}</div>`

        return `
            <div class="space-y-5 py-4">
                <div class="text-center">
                    ${mark}
                    <h3 class="text-xl font-bold text-white mb-2">${heading}</h3>
                    ${failure ? `<p class="text-white/80">${escapeHtml(failure.message)}</p>` : ''}
                </div>

                ${this.renderCreated(report.created)}
                ${this.renderNames('Created without all their tracks', report.incomplete.map(p => `${p.name} (${p.tracks} of ${p.total} tracks)`))}
                ${this.renderNames('Not created', report.notCreated)}
                ${this.renderNames('No track found', report.empty)}
                ${this.renderMatchSummary(report)}
                ${this.renderNextSteps(failure)}
            </div>
        `
    }

    /** The playlists that are in Spotify, each with the link that opens it. */
    renderCreated(created) {
        if (created.length === 0) return ''
        const rows = created.map(playlist => {
            const url = safeUrl(playlist.url) // the address comes from Spotify: a link only when it is a web address (F59)
            const link = url
                ? `<a class="created-playlist-link shrink-0 text-[#1DB954] hover:underline inline-flex items-center gap-1" href="${escapeHtml(safeUrl(playlist.url))}" target="_blank" rel="noopener">${getIcon('ExternalLink', 'w-4 h-4')} Open in Spotify</a>`
                : ''
            return `
                <li class="flex items-center justify-between gap-3">
                    <span class="min-w-0"><span class="text-white">${escapeHtml(playlist.name)}</span>
                        <span class="text-white/60">· ${playlist.tracks} tracks</span>
                        ${playlist.alreadyThere ? '<span class="text-white/40">(already exported in this session, not created again)</span>' : ''}</span>
                    ${link}
                </li>`
        }).join('')
        return `
            <div class="bg-white/5 rounded-xl p-4 text-sm">
                <p class="text-white/60 mb-2">Created (${created.length})</p>
                <ul class="space-y-2">${rows}</ul>
            </div>
        `
    }

    /** A titled list of names; nothing when the list is empty. */
    renderNames(title, names) {
        if (names.length === 0) return ''
        return `
            <div class="bg-white/5 rounded-xl p-4 text-sm">
                <p class="text-yellow-400 mb-2">${escapeHtml(title)} (${names.length})</p>
                <ul class="space-y-1 text-white/80">${names.map(name => `<li>• ${escapeHtml(name)}</li>`).join('')}</ul>
            </div>
        `
    }

    /** How many tracks were found in Spotify, and the ones that were not. */
    renderMatchSummary(report) {
        if (!report.totalTracks) return ''
        const missing = this.notFoundTracks
        return `
            <div class="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-white/60">Tracks matched</span>
                    <span class="text-[#1DB954] font-medium">${report.matchCount} / ${report.totalTracks}</span>
                </div>
                ${missing.length > 0 ? `
                    <details>
                        <summary class="text-yellow-400 cursor-pointer hover:text-yellow-300 flex items-center gap-2">
                            ${getIcon('AlertTriangle', 'w-4 h-4')}
                            ${missing.length} tracks not found
                        </summary>
                        <ul class="mt-2 space-y-1 text-white/60 max-h-32 overflow-y-auto pl-6">
                            ${missing.slice(0, 10).map(t => `
                                <li class="truncate">• ${escapeHtml(t.artist)} - ${escapeHtml(t.title)}</li>
                            `).join('')}
                            ${missing.length > 10 ? `<li class="text-white/40">...and ${missing.length - 10} more</li>` : ''}
                        </ul>
                    </details>
                ` : ''}
            </div>
        `
    }

    /** What the person can do after the report: connect again, try again, close. */
    renderNextSteps(failure) {
        const primary = 'w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]'
        const green = 'style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);"'
        let next = ''
        if (failure?.kind === 'reconnect') {
            next = `<button id="reconnectSpotifyBtn" class="${primary}" ${green}>${getIcon('Spotify', 'w-5 h-5')} Connect to Spotify again</button>
                <p class="text-xs text-white/40 text-center">You will leave this page to sign in to Spotify. Export again when you are back: what was created is not created twice in the same visit, but it is after the page reloads.</p>`
        } else if (failure) {
            next = `<button id="retryExportBtn" class="${primary}" ${green}>${getIcon('RefreshCw', 'w-5 h-5')} Try again</button>
                <p class="text-xs text-white/40 text-center">What was already created is not created again.</p>`
        }
        return `
            ${next}
            <button class="close-modal-btn w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors">
                Close
            </button>
        `
    }
}

// Singleton factory
export function showSpotifyExportModal() {
    const modal = new SpotifyExportModal()
    modal.show()
    return modal
}
