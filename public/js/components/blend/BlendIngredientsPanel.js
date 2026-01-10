/**
 * BlendIngredientsPanel.js
 * 
 * Step 3: 🥗 Pick Your Ingredients
 * Parameter configuration (duration, output mode, ranking type, discovery mode)
 * Shows/hides options conditionally based on selected algorithm recipe
 * 
 * @module components/blend/BlendIngredientsPanel
 */

import { getIcon } from '../Icons.js'

/**
 * Configuration for which ingredients each algorithm supports
 */
const ALGORITHM_RECIPES = {
    'mjrp-balanced-cascade': {
        duration: true,
        outputMode: false,      // Auto-split internally
        rankingType: true,      // Spotify / BEA / Combined
        discoveryMode: true,    // Include unranked
        groupingStrategy: false // Generally strictly chronological/balanced
    },
    'mjrp-cascade-v0': {
        duration: true,
        outputMode: false,
        rankingType: true,
        discoveryMode: true
    },
    's-draft-original': {
        duration: true,
        outputMode: true,       // Single / Multiple
        rankingType: true,
        discoveryMode: true
    },
    'legacy-roundrobin': {
        duration: true,
        outputMode: false,
        rankingType: false,
        discoveryMode: true
    },
    'top-n-popular': {
        groupingStrategy: true,
        outputMode: true,
        duration: false,        // Fixed count, duration irrelevant
        rankingType: false,     // Locked: Spotify
        discoveryMode: false,   // Requires ranking data
        trackCount: true        // Sprint 17: Variable N
    },
    'top-n-acclaimed': {
        groupingStrategy: true,
        outputMode: true,
        duration: false,        // Fixed count
        rankingType: false,     // Locked: BEA
        discoveryMode: false,
        trackCount: true
    }
}

export class BlendIngredientsPanel {
    constructor(opts = {}) {
        this.containerId = opts.containerId || 'blend-ingredients-panel'
        this.onConfigChange = opts.onConfigChange || (() => { })
        this.selectedRecipe = opts.selectedRecipe || null
        this.config = {
            duration: opts.duration || 60,
            outputMode: opts.outputMode || 'auto',
            groupingStrategy: opts.groupingStrategy || 'by_album',
            rankingType: opts.rankingType || 'combined',
            discoveryMode: opts.discoveryMode !== undefined ? opts.discoveryMode : true, // Default true
            trackCount: opts.trackCount || 3, // Default for Top N
            ...opts.config
        }
    }

    /**
     * Duration options (in minutes)
     */
    static DURATIONS = [
        { value: 30, label: '30' },
        { value: 45, label: '45' },
        { value: 50, label: '50' },
        { value: 60, label: '60' },
        { value: 70, label: '70' },
        { value: 75, label: '75' },
        { value: 80, label: '80' },
        { value: 90, label: '90' },
        { value: 100, label: '100' },
        { value: 120, label: '120' }
    ]

    /**
     * Output mode options
     */
    static OUTPUT_MODES = [
        { value: 'single', label: 'Single Playlist', description: 'One playlist with all tracks', icon: 'ListMusic' },
        { value: 'multiple', label: 'Multiple Playlists', description: 'Split by duration limits', icon: 'LayoutGrid' },
        { value: 'auto', label: 'Auto', description: 'Let the algorithm decide', icon: 'Sparkles' }
    ]

    /**
     * Ranking type options
     */
    static RANKING_TYPES = [
        { value: 'spotify', label: 'Spotify Popularity', description: 'Based on play counts', icon: 'TrendingUp' },
        { value: 'bea', label: 'Critics Choice', description: 'Based on BEA rankings', icon: 'Award' },
        { value: 'combined', label: 'Combined', description: 'Balanced mix of both', icon: 'Scale' }
    ]

    /**
     * Grouping Strategy options (New for Sprint 15.5)
     */
    static GROUPING_STRATEGIES = [
        { value: 'by_album', label: 'By Album', description: 'Keep Album Sequence', icon: 'Disc' },
        { value: 'flat_ranked', label: 'By Ranking', description: 'Flow by Popularity', icon: 'TrendingUp' },
        { value: 'artist_rank', label: 'By Artist then By Rank', description: 'Cluster by Artist', icon: 'Users' },
        { value: 'ranked_interleave', label: 'Balanced Interleave', description: 'Round Robin by Rank', icon: 'GitMerge' },
        { value: 'shuffle', label: 'Shuffle', description: 'Surprise Me', icon: 'Shuffle' }
    ]

    /**
     * Update selected flavor (called from parent view)
     */
    setRecipe(recipe) {
        this.selectedRecipe = recipe
        // Auto-detect default N from recipe ID (e.g., 'top-5-popular' -> 5)
        if (recipe && recipe.id) {
            const match = recipe.id.match(/top-(\d+)/)
            if (match) {
                this.config.trackCount = parseInt(match[1])
            }
        }
    }

    /**
     * Get ingredient visibility for current flavor
     */
    getIngredientConfig() {
        const recipeId = this.selectedRecipe?.id
        return ALGORITHM_RECIPES[recipeId] || {
            groupingStrategy: true,
            outputMode: true,
            outputMode: true,
            duration: true,
            rankingType: true,
            discoveryMode: true,
            trackCount: false
        }
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById(this.containerId)
        if (!container) return

        const ingredients = this.getIngredientConfig()

        container.innerHTML = `
            <div class="space-y-6">
                 <!-- 0. Track Count (Sprint 17: Top NParametrization) -->
                ${ingredients.trackCount ? this.renderTrackCountSection() : ''}

                 <!-- 1. Grouping Tracks (Renamed) -->
                ${ingredients.groupingStrategy ? this.renderGroupingSection() : ''}

                <!-- 2. Output Mode -->
                ${ingredients.outputMode ? this.renderOutputModeSection() : ''}

                <!-- 3. Duration (Conditional: Show if algorithm supports it OR if Multiple Playlists selected) -->
                ${(ingredients.duration || (ingredients.outputMode && this.config.outputMode === 'multiple')) ? this.renderDurationSection() : ''}
                
                <!-- Ranking Type (conditional) -->
                ${ingredients.rankingType ? this.renderRankingTypeSection() : ''}
                
                <!-- Discovery Mode (conditional) -->
                ${ingredients.discoveryMode ? this.renderDiscoveryModeSection() : ''}
            </div>
        `

        this.attachListeners(container)
    }

    /**
     * Render Track Count section (Sprint 17)
     */
    /**
     * Render Track Count section (Sprint 17.5: Swapped to Buttons)
     */
    renderTrackCountSection() {
        // Top 1 to Top 10
        const counts = Array.from({ length: 10 }, (_, i) => i + 1)

        return `
            <div>
                 <label class="block text-sm font-medium mb-3 text-muted">
                    ${getIcon('Music', 'w-4 h-4 inline mr-2')}Choose your Top #
                </label>
                <div class="grid grid-cols-5 gap-2">
                    ${counts.map(n => `
                        <button type="button" 
                            class="blend-track-count-btn px-3 py-2 rounded-lg border transition-all duration-200 text-center
                                ${this.config.trackCount === n
                ? 'border-orange-400 bg-orange-400/20 text-orange-400 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                            data-count="${n}">
                            <span class="font-semibold text-sm">Top ${n}</span>
                        </button>
                    `).join('')}
                </div>
                <p class="text-xs text-muted mt-2">Select how many top tracks to pick from each album.</p>
            </div>
        `
    }

    /**
     * Render Duration section
     */
    /**
     * Render Duration section (Sprint 17.5: Swapped to Slider)
     */
    renderDurationSection() {
        return `
            <div>
                <label class="block text-sm font-medium mb-3 text-muted">
                    ${getIcon('Clock', 'w-4 h-4 inline mr-2')}Target Duration (minutes)
                </label>
                <div class="flex items-center gap-4">
                    <input type="range" min="30" max="180" step="5" 
                        id="blend-duration-slider"
                        value="${this.config.duration || 60}" 
                        class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400">
                    <span id="blend-duration-display" class="text-2xl font-bold text-orange-400 w-12 text-center">
                        ${this.config.duration || 60}m
                    </span>
                </div>
                <p class="text-xs text-muted mt-2">How long should each volume be?</p>
            </div>
        `
    }

    /**
     * Render Output Mode section
     */
    renderOutputModeSection() {
        return `
            <div>
                <label class="block text-sm font-medium mb-3 text-muted">
                    ${getIcon('LayoutGrid', 'w-4 h-4 inline mr-2')}Playlist Structure
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${BlendIngredientsPanel.OUTPUT_MODES.map(m => `
                        <button type="button"
                            class="blend-output-btn p-4 rounded-lg border text-left transition-all duration-200
                                ${this.config.outputMode === m.value
                ? 'border-orange-400 bg-orange-400/20 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                            data-output="${m.value}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-surface/60 flex items-center justify-center
                                    ${this.config.outputMode === m.value ? 'text-orange-400' : 'text-muted'}">
                                    ${getIcon(m.icon, 'w-5 h-5')}
                                </div>
                                <div>
                                    <span class="font-medium block ${this.config.outputMode === m.value ? 'text-orange-400' : ''}">${m.label}</span>
                                    <span class="text-xs text-muted">${m.description}</span>
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `
    }

    /**
     * Render Ranking Type section
     */
    renderRankingTypeSection() {
        return `
            <div>
                <label class="block text-sm font-medium mb-3 text-muted">
                    ${getIcon('BarChart2', 'w-4 h-4 inline mr-2')}Ranking Source
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${BlendIngredientsPanel.RANKING_TYPES.map(r => `
                        <button type="button"
                            class="blend-ranking-btn p-4 rounded-lg border text-left transition-all duration-200
                                ${this.config.rankingType === r.value
                ? 'border-orange-400 bg-orange-400/20 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                            data-ranking="${r.value}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-surface/60 flex items-center justify-center
                                    ${this.config.rankingType === r.value ? 'text-orange-400' : 'text-muted'}">
                                    ${getIcon(r.icon, 'w-5 h-5')}
                                </div>
                                <div>
                                    <span class="font-medium block ${this.config.rankingType === r.value ? 'text-orange-400' : ''}">${r.label}</span>
                                    <span class="text-xs text-muted">${r.description}</span>
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `
    }

    /**
     * Render Discovery Mode section
     */
    renderDiscoveryModeSection() {
        return `
            <div class="flex items-center justify-between p-4 rounded-lg border ${this.config.discoveryMode
                ? 'border-orange-400/50 bg-orange-400/10'
                : 'border-white/10 bg-white/5'} transition-all duration-200">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-surface/60 flex items-center justify-center ${this.config.discoveryMode ? 'text-orange-400' : 'text-muted'}">
                        ${getIcon('Compass', 'w-5 h-5')}
                    </div>
                    <div>
                        <span class="font-medium block ${this.config.discoveryMode ? 'text-orange-400' : ''}">Discovery Mode</span>
                        <span class="text-xs text-muted">Include tracks without ranking data</span>
                    </div>
                </div>
                <button type="button" 
                    id="blend-discovery-toggle"
                    class="w-12 h-7 rounded-full transition-all duration-200 relative ${this.config.discoveryMode
                ? 'bg-orange-400'
                : 'bg-gray-600'}">
                    <span class="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${this.config.discoveryMode
                ? 'left-6'
                : 'left-1'}"></span>
                </button>
            </div>
        `
    }

    /**
     * Render Grouping Strategy section
     */
    renderGroupingSection() {
        return `
            <div>
                <label class="block text-sm font-medium mb-3 text-muted">
                    ${getIcon('Layers', 'w-4 h-4 inline mr-2')}Grouping Tracks
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    ${BlendIngredientsPanel.GROUPING_STRATEGIES.map(g => `
                        <button type="button"
                            class="blend-grouping-btn p-3 rounded-lg border text-left transition-all duration-200
                                ${this.config.groupingStrategy === g.value
                ? 'border-orange-400 bg-orange-400/20 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                            data-grouping="${g.value}">
                            <div class="flex items-center gap-2 mb-1">
                                <div class="${this.config.groupingStrategy === g.value ? 'text-orange-400' : 'text-muted'}">
                                    ${getIcon(g.icon, 'w-4 h-4')}
                                </div>
                                <span class="font-medium text-sm ${this.config.groupingStrategy === g.value ? 'text-orange-400' : ''}">${g.label}</span>
                            </div>
                            <span class="text-[10px] text-muted block leading-tight">${g.description}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        // Duration Slider (Sprint 17.5)
        const durationSlider = document.getElementById('blend-duration-slider')
        const durationDisplay = document.getElementById('blend-duration-display')
        if (durationSlider && durationDisplay) {
            durationSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value)
                durationDisplay.textContent = val + 'm'
                this.config.duration = val
                this.onConfigChange(this.config)
            })
        }

        // Output mode buttons
        document.querySelectorAll('.blend-output-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.outputMode = btn.dataset.output
                this.onConfigChange(this.config)
                this.render()
            })
        })

        // Grouping Strategy buttons
        document.querySelectorAll('.blend-grouping-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.groupingStrategy = btn.dataset.grouping
                this.onConfigChange(this.config)
                this.render()
            })
        })

        // Ranking type buttons
        document.querySelectorAll('.blend-ranking-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.rankingType = btn.dataset.ranking
                this.onConfigChange(this.config)
                this.render()
            })
        })

        // Discovery mode toggle
        const discoveryToggle = document.getElementById('blend-discovery-toggle')
        if (discoveryToggle) {
            discoveryToggle.addEventListener('click', () => {
                this.config.discoveryMode = !this.config.discoveryMode
                this.onConfigChange(this.config)
                this.render()
            })
        }

        // Sprint 17.5: Track Count Buttons
        document.querySelectorAll('.blend-track-count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.trackCount = parseInt(btn.dataset.count)
                this.onConfigChange(this.config)
                this.render()
            })
        })
    }

    /**
     * Get current configuration in NORMALIZED format for PlaylistGenerationService
     * 
     * Returns:
     * - targetDuration: in SECONDS (not minutes)
     * - rankingId: 'balanced' | 'spotify' | 'bea' (not rankingType)
     * - outputMode: as-is
     * - discoveryMode: as-is
     * 
     * @returns {Object} Normalized config ready for PlaylistGenerationService
     */
    getConfig() {
        // Map rankingType → rankingId
        const rankingMapping = {
            'combined': 'balanced',
            'spotify': 'spotify',
            'bea': 'bea'
        }

        return {
            targetDuration: this.config.duration * 60, // minutes → seconds
            rankingId: rankingMapping[this.config.rankingType] || 'balanced',
            outputMode: this.config.outputMode,
            groupingStrategy: this.config.groupingStrategy,
            discoveryMode: this.config.discoveryMode,
            trackCount: this.config.trackCount // Pass N to service
        }
    }
}

export default BlendIngredientsPanel
