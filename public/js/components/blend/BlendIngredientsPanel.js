/**
 * BlendIngredientsPanel.js
 * 
 * Step 3: 🥗 Pick Your Ingredients
 * Parameter configuration (duration, output mode)
 * 
 * @module components/blend/BlendIngredientsPanel
 */

import { getIcon } from '../Icons.js'

export class BlendIngredientsPanel {
    constructor(opts = {}) {
        this.onConfigChange = opts.onConfigChange || (() => { })
        this.config = {
            duration: opts.duration || 45,  // 30, 45, 60 minutes
            outputMode: opts.outputMode || 'auto',  // 'single', 'multiple', 'auto'
            ...opts.config
        }
    }

    /**
     * Duration options
     */
    static DURATIONS = [
        { value: 30, label: '30 min', icon: 'Clock' },
        { value: 45, label: '45 min', icon: 'Clock' },
        { value: 60, label: '1 hour', icon: 'Clock' }
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
     * Render the component
     */
    render() {
        const container = document.getElementById('blend-ingredients-panel')
        if (!container) return

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Duration -->
                <div>
                    <label class="block text-sm font-medium mb-3 text-muted">
                        ${getIcon('Clock', 'w-4 h-4 inline mr-2')}Target Duration
                    </label>
                    <div class="flex gap-3">
                        ${BlendIngredientsPanel.DURATIONS.map(d => `
                            <button type="button" 
                                class="blend-duration-btn flex-1 px-4 py-3 rounded-lg border transition-all duration-200
                                    ${this.config.duration === d.value
                ? 'border-orange-400 bg-orange-400/20 text-orange-400 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                                data-duration="${d.value}">
                                <span class="font-semibold">${d.label}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Output Mode -->
                <div>
                    <label class="block text-sm font-medium mb-3 text-muted">
                        ${getIcon('LayoutGrid', 'w-4 h-4 inline mr-2')}Output Mode
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
            </div>
        `

        this.attachListeners()
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        // Duration buttons
        document.querySelectorAll('.blend-duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.duration = parseInt(btn.dataset.duration)
                this.onConfigChange(this.config)
                this.render()
            })
        })

        // Output mode buttons
        document.querySelectorAll('.blend-output-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.outputMode = btn.dataset.output
                this.onConfigChange(this.config)
                this.render()
            })
        })
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config }
    }
}

export default BlendIngredientsPanel
