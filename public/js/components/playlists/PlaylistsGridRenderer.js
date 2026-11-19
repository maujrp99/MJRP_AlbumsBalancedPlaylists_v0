import { PlaylistGrid } from './PlaylistGrid.js'
import { RegeneratePanel } from './RegeneratePanel.js'
import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'
import { Breadcrumb } from '../Breadcrumb.js'

/**
 * PlaylistsGridRenderer
 * 
 * Handles HTML generation for PlaylistsView.
 * Pure rendering logic, no state.
 */
export class PlaylistsGridRenderer {

    /**
     * Render the Generation Config Panel (or "Reconfigure" panel)
     */
    static renderGenerationControls(playlists, activeSeries, isExpanded) {
        // UX Improvement: Always render the panel if we have playlists (Create or Edit mode)
        // This allows "Reconfiguring" immediately after generation.
        if (playlists.length > 0) {
            return `
                <div id="regeneratePanelMount" class="mb-6 fade-in" style="animation-delay: 0.05s">
                    ${RegeneratePanel.render({
                seriesId: activeSeries?.id,
                // UX Fix: Allow reconfigure in Create Mode (no batch name yet)
                batchName: playlists[0].batchName || 'New Batch',
                existingPlaylistIds: playlists.map(p => p.id).filter(Boolean),
                count: playlists.length, // Explicit count for UI
                generatedWith: this.generatedWith(playlists),
                expanded: isExpanded
            })}
                </div>
            `
        }

        // Initial Empty State
        return ''
    }

    /**
     * The recipe the playlists on screen were generated with: each generated playlist carries it
     * (PlaylistGenerationService) and it is saved with the batch. Null for playlists that do not
     * say (saved before F62 with only part of it, or not generated here).
     * @param {Array} playlists
     * @returns {Object|null}
     */
    static generatedWith(playlists) {
        const meta = playlists.find(playlist => playlist?._meta?.algorithmId)?._meta
        return meta ? { ...meta } : null
    }

    /**
     * The top of the screen: where it is, what it is and, for a saved batch, which one.
     * @param {Object} state
     * @param {boolean} state.isEditMode - a saved batch is being edited
     * @param {string} [state.editedBatchName] - the name the batch is saved under
     */
    static renderHeader({ isEditMode, editedBatchName = '' }) {
        const title = isEditMode ? 'Edit Playlist Batch' : 'Playlist Management'
        const badge = isEditMode && editedBatchName
            ? `<span class="badge badge-success px-3 py-1 rounded-full text-sm">Editing: ${escapeHtml(editedBatchName)}</span>`
            : ''

        return `
            <header class="view-header mb-8 fade-in">
                ${Breadcrumb.render('/playlists', { editing: isEditMode })}
                <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 class="text-2xl md:text-4xl font-bold flex items-center gap-3">
                        ${getIcon(isEditMode ? 'Edit' : 'Music', 'w-8 h-8')} ${escapeHtml(title)}
                    </h1>
                    <div class="header-actions flex flex-wrap items-center gap-4 w-full md:w-auto">
                        ${badge}
                    </div>
                </div>
            </header>
        `
    }

    /** One of the two buttons of the history: drawn from the state, disabled when it has no step to take. */
    static renderHistoryButton({ action, icon, text, label, enabled }) {
        return `<button class="btn btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            data-action="${action}" aria-label="${label}" title="${label}" ${enabled ? '' : 'disabled'}>
                        ${getIcon(icon, 'w-5 h-5')} ${text}
                    </button>`
    }

    /**
     * @param {Array} playlists
     * @param {Object} [state]
     * @param {boolean} [state.isSaving] - a save is on its way: the button is drawn disabled
     * @param {boolean} [state.canUndo] - there is a change to undo (the store says)
     * @param {boolean} [state.canRedo] - there is an undone change to redo (the store says)
     */
    static renderExportSection(playlists, { isSaving = false, canUndo = false, canRedo = false } = {}) {
        if (playlists.length === 0) return ''

        const undoButton = this.renderHistoryButton({ action: 'undo-edit', icon: 'Undo', text: 'Undo', label: 'Undo the last change', enabled: canUndo })
        const redoButton = this.renderHistoryButton({ action: 'redo-edit', icon: 'Redo', text: 'Redo', label: 'Redo the change that was undone', enabled: canRedo })

        const saveButton = isSaving
            ? `<button class="btn btn-success flex items-center gap-2" id="saveToHistoryBtn" disabled aria-busy="true">
                        ${getIcon('Loader', 'w-4 h-4 animate-spin')} Saving...
                    </button>`
            : `<button class="btn btn-success flex items-center gap-2" id="saveToHistoryBtn">
                        ${getIcon('Cloud', 'w-5 h-5')} Save to Series History
                    </button>`

        return `
            <div class="export-section glass-panel p-6">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    ${getIcon('Save', 'w-5 h-5')} Actions & Export
                </h3>
                <div class="export-actions flex flex-wrap gap-4">
                    ${undoButton}
                    ${redoButton}
                    <div class="h-auto w-px bg-white/10 mx-2"></div>
                    ${saveButton}
                    <div class="h-auto w-px bg-white/10 mx-2"></div>
                    <button class="btn flex items-center gap-2 text-white font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300" 
                            style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);" 
                            id="exportSpotifyBtn">
                        ${getIcon('Spotify', 'w-5 h-5')} Export to Spotify
                    </button>
                    <button class="btn flex items-center gap-2 bg-gradient-to-r from-[#FF4D00] to-[#FF8800] hover:from-[#FF8800] hover:to-[#FFCC00] text-white font-semibold shadow-lg hover:shadow-[#FF4D00]/30 transition-all duration-300" 
                            id="exportAppleMusicBtn">
                        ${getIcon('Apple', 'w-5 h-5')} Export to Apple Music
                    </button>
                    <button class="btn btn-secondary flex items-center gap-2" id="exportJsonBtn">
                        ${getIcon('Download', 'w-5 h-5')} Download JSON
                    </button>
                </div>
            </div>
        `
    }

    /**
     * Render the playlist grid with batch name formatting
     * @param {Array} playlists - Playlists to render
     * @param {string} batchName - Optional batch name for title formatting
     * @returns {string} HTML string
     */
    static renderGrid(playlists, batchName = '') {
        if (!playlists || playlists.length === 0) return ''

        // Batch name is fully resolved by the View before calling this.

        return PlaylistGrid.render({
            playlists,
            editable: true,
            primaryRanking: 'acclaim',
            batchName // Pass through
        })
    }

    static renderBatchNameInput(currentName, isEditMode, defaultBatchName = '') {
        // ALWAYS render the input, even in Create Mode, so users can name their batch before saving.
        return `
            <div id="batchNameSection" class="mb-6 fade-in glass-panel p-4 rounded-xl" style="animation-delay: 0.03s">
                <label for="batchNameInput" class="block text-sm font-medium mb-2">Batch Name</label>
                <input 
                    type="text" 
                    id="batchNameInput" 
                    value="${escapeHtml(currentName || defaultBatchName || '')}"
                    class="input input-bordered w-full max-w-md bg-white/5 border-white/10 rounded-lg px-4 py-2"
                    placeholder="Enter batch name (e.g., 'My Beatles Mix')"
                />
            </div>
        `
    }

    static renderEmptyState() {
        return `
            <div class="no-albums-warning glass-panel max-w-2xl mx-auto text-center p-8 mb-6">
                <div class="alert alert-warning bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl">
                    <strong class="flex items-center justify-center gap-2 mb-2">${getIcon('AlertTriangle', 'w-5 h-5')} No albums loaded</strong>
                    <p>Please go back and load albums first before generating playlists.</p>
                </div>
            </div>
        `
    }

    static renderInitialSettings(algorithms, currentAlgoId, rankingStrategies, currentRankingId) {
        // Logic to render the initial "Generate" form when no playlists exist
        // Reuse logic from old PlaylistsView.renderSettingsSection
        // ...
        return `
            <div class="settings-section glass-panel p-6">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    ${getIcon('Settings', 'w-5 h-5')} Generation Settings
                </h3>
                  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    <!-- ALGORITHMS -->
                    <div class="lg:col-span-8">
                        <label class="block text-sm font-medium text-muted mb-3">1. Distribution Algorithm (Output)</label>
                        <div class="algorithm-options grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${algorithms.map(algo => `
                                <label class="algorithm-option flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer h-full
                                ${currentAlgoId === algo.id ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}">
                                <input type="radio" name="algorithm" value="${algo.id}" 
                                    ${currentAlgoId === algo.id ? 'checked' : ''}
                                    class="mt-1 accent-accent-primary" />
                                <div class="flex-1 text-left">
                                    <div class="flex items-center gap-2 mb-1">
                                    <span class="font-semibold text-sm">${algo.name}</span>
                                    <span class="badge ${algo.isRecommended ? 'badge-success' : algo.badge === 'LEGACY' ? 'badge-warning' : 'badge-neutral'} text-[10px] px-1.5 py-0.5">
                                        ${algo.badge}
                                    </span>
                                    </div>
                                    <p class="text-xs text-muted line-clamp-2">${algo.description}</p>
                                </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- RANKING -->
                     <div class="lg:col-span-4">
                        <label class="block text-sm font-medium text-muted mb-3">2. Ranking Source (Input)</label>
                        <div class="bg-white/5 rounded-xl border border-white/10 p-4 h-full">
                            <p class="text-xs text-muted mb-3">Choose the "Source of Truth" for how tracks are ranked.</p>
                            <select id="rankingStrategySelect" class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-accent-primary">
                                ${rankingStrategies.map(strat => `
                                    <option value="${strat.id}" ${currentRankingId === strat.id ? 'selected' : ''}>${strat.name}</option>
                                `).join('')}
                            </select>
                            <div class="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                                <div class="flex items-start gap-2">
                                     ${getIcon('Info', 'w-4 h-4 text-accent-primary mt-0.5')}
                                     <p class="text-xs text-muted" id="rankingDescription">
                                        ${rankingStrategies.find(s => s.id === currentRankingId)?.description || ''}
                                     </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-large w-full justify-center" id="generateBtn">
                    ${getIcon('Rocket', 'w-5 h-5')} Generate Playlists
                </button>
            </div>
         `
    }
}
