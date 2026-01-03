import { PlaylistGrid } from './PlaylistGrid.js'
import { RegeneratePanel } from './RegeneratePanel.js'
import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'

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
                currentConfig: RegeneratePanel.currentConfig || { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' },
                expanded: isExpanded
            })}
                </div>
            `
        }

        // Initial Empty State
        return ''
    }

    static renderExportSection(playlists) {
        if (playlists.length === 0) return ''

        return `
            <div class="export-section glass-panel p-6">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    ${getIcon('Save', 'w-5 h-5')} Actions & Export
                </h3>
                <div class="export-actions flex flex-wrap gap-4">
                    <button class="btn btn-success flex items-center gap-2" id="saveToHistoryBtn">
                        ${getIcon('Cloud', 'w-5 h-5')} Save to Series History
                    </button>
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
                <label class="block text-sm font-medium mb-2">Batch Name</label>
                <label class="block text-sm font-medium mb-2">Batch Name</label>
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
