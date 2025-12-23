/**
 * BlendingMenuView.js
 * 
 * The Blending Menu - Restaurant Metaphor Wizard
 * Main view for playlist generation from series
 * 
 * Steps:
 * 1. 🍹 Choose Your Blend - Entity/Series selection
 * 2. 🍬 Choose Your Flavor - Algorithm selection
 * 3. 🥗 Pick Your Ingredients - Parameters
 * 4. 🎛️ Blend It! - Generate button (dynamic CTA)
 * 
 * @module views/BlendingMenuView
 */

import { BaseView } from './BaseView.js'
import { getIcon } from '../components/Icons.js'
import { BlendSeriesSelector } from '../components/blend/BlendSeriesSelector.js'
import { BlendFlavorCard } from '../components/blend/BlendFlavorCard.js'
import { BlendIngredientsPanel } from '../components/blend/BlendIngredientsPanel.js'
import { createAlgorithm } from '../algorithms/index.js'
import { albumSeriesStore } from '../stores/albumSeries.js'

export class BlendingMenuView extends BaseView {
    constructor() {
        super()
        this.seriesSelector = null
        this.flavorCard = null
        this.ingredientsPanel = null

        // State
        this.selectedSeries = null
        this.selectedFlavor = null
        this.config = { duration: 45, outputMode: 'auto' }
        this.isGenerating = false
    }

    async render(params) {
        return `
            <div class="container mx-auto px-4 py-8 max-w-5xl">
                <!-- Header -->
                <div class="text-center mb-10">
                    <div class="inline-flex items-center gap-3 mb-4">
                        <span class="text-4xl">🍹</span>
                        <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                            The Blending Menu
                        </h1>
                    </div>
                    <p class="text-muted text-lg">"Your Music, Your Recipe"</p>
                </div>

                <!-- Step 1: Choose Your Blend -->
                <section class="glass-panel rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🍹</span>
                        <h2 class="text-xl font-bold">Choose Your Blend</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 1</span>
                    </div>
                    <div id="blend-series-selector"></div>
                </section>

                <!-- Step 2: Choose Your Flavor -->
                <section class="glass-panel rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🍬</span>
                        <h2 class="text-xl font-bold">Choose Your Flavor</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 2</span>
                    </div>
                    <div id="blend-flavor-cards"></div>
                </section>

                <!-- Step 3: Pick Your Ingredients -->
                <section class="glass-panel rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🥗</span>
                        <h2 class="text-xl font-bold">Pick Your Ingredients</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 3</span>
                    </div>
                    <div id="blend-ingredients-panel"></div>
                </section>

                <!-- Step 4: Blend It! -->
                <section class="glass-panel rounded-2xl p-6 border-2 border-orange-400/30">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🎛️</span>
                        <h2 class="text-xl font-bold">Blend It!</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 4</span>
                    </div>
                    <div id="blend-generate-section" class="text-center py-4">
                        ${this.renderGenerateButton()}
                    </div>
                </section>

                <!-- Results Area -->
                <section id="blend-results" class="mt-8 hidden">
                </section>
            </div>
        `
    }

    /**
     * Render dynamic CTA button
     */
    renderGenerateButton() {
        const entityType = this.seriesSelector?.selectedEntity || 'Album'
        const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1, -1) // albums -> Album
        const isMultiple = this.config.outputMode === 'multiple'
        const plural = isMultiple ? 's' : ''

        const isReady = this.selectedSeries && this.selectedFlavor

        return `
            <div class="space-y-4">
                ${!isReady ? `
                    <p class="text-muted text-sm">
                        ${!this.selectedSeries ? '👈 Select a series' : ''}
                        ${this.selectedSeries && !this.selectedFlavor ? '👈 Select a flavor' : ''}
                    </p>
                ` : ''}
                
                <button id="blend-generate-btn" 
                    class="tech-btn-primary px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    ${!isReady || this.isGenerating ? 'disabled' : ''}>
                    ${this.isGenerating
                ? `<span class="inline-flex items-center gap-2">
                               <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                               Blending...
                           </span>`
                : `${getIcon('Sparkles', 'w-5 h-5 inline mr-2')}Blend your ${entityLabel} Playlist${plural}!`
            }
                </button>

                ${isReady ? `
                    <p class="text-sm text-muted">
                        Using <strong>${this.selectedFlavor.name}</strong> on 
                        <strong>${this.selectedSeries.name}</strong>
                        (${this.config.duration} min, ${this.config.outputMode} mode)
                    </p>
                ` : ''}
            </div>
        `
    }

    async mount() {
        // Initialize components
        this.seriesSelector = new BlendSeriesSelector({
            onEntityChange: (entity) => this.updateGenerateButton(),
            onSeriesSelect: (series) => {
                this.selectedSeries = series
                this.updateGenerateButton()
            }
        })

        this.flavorCard = new BlendFlavorCard({
            onFlavorSelect: (flavor) => {
                this.selectedFlavor = flavor
                this.updateGenerateButton()
            }
        })

        this.ingredientsPanel = new BlendIngredientsPanel({
            onConfigChange: (config) => {
                this.config = config
                this.updateGenerateButton()
            }
        })

        // Render components
        this.seriesSelector.render()
        await this.seriesSelector.loadSeries()
        this.flavorCard.render()
        this.ingredientsPanel.render()

        // Attach generate button listener
        this.attachGenerateListener()
    }

    /**
     * Update generate button state
     */
    updateGenerateButton() {
        const section = document.getElementById('blend-generate-section')
        if (section) {
            section.innerHTML = this.renderGenerateButton()
            this.attachGenerateListener()
        }
    }

    /**
     * Attach generate button listener
     */
    attachGenerateListener() {
        const btn = document.getElementById('blend-generate-btn')
        if (btn) {
            btn.addEventListener('click', () => this.handleGenerate())
        }
    }

    /**
     * Handle playlist generation
     */
    async handleGenerate() {
        if (!this.selectedSeries || !this.selectedFlavor) return

        this.isGenerating = true
        this.updateGenerateButton()

        try {
            // The selected series has albumQueries, need to load full album data
            const albumQueries = this.selectedSeries.albumQueries || []

            if (albumQueries.length === 0) {
                this.showError('No albums in selected series')
                return
            }

            // For now, we'll show a placeholder message since albums need to be loaded
            // In a production implementation, we'd use apiClient to fetch album data
            this.showError(`Ready to blend ${albumQueries.length} albums! (Full album loading coming soon)`)
            return

            // TODO: Load albums via apiClient and generate playlists
            // const albums = await Promise.all(albumQueries.map(q => apiClient.fetchAlbum(q)))
            // const algorithm = createAlgorithm(this.selectedFlavor.id, {...})
            // const result = algorithm.generate(albums)
            // this.showResults(result)

        } catch (err) {
            console.error('[BlendingMenuView] Generation error:', err)
            this.showError(err.message || 'Generation failed')
        } finally {
            this.isGenerating = false
            this.updateGenerateButton()
        }
    }

    /**
     * Show generation results
     */
    showResults(result) {
        const container = document.getElementById('blend-results')
        if (!container) return

        container.classList.remove('hidden')
        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-6">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    ${getIcon('CheckCircle', 'w-6 h-6 text-green-400')}
                    Playlist${result.playlists.length > 1 ? 's' : ''} Generated!
                </h3>
                <div class="space-y-4">
                    ${result.playlists.map(p => `
                        <div class="p-4 rounded-lg bg-white/5 border border-white/10">
                            <h4 class="font-semibold">${p.title}</h4>
                            <p class="text-sm text-muted">${p.tracks.length} tracks</p>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                    <button class="btn btn-primary" onclick="alert('Save to Spotify - Coming Soon')">
                        ${getIcon('Save', 'w-4 h-4')} Save to Spotify
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        ${getIcon('RefreshCw', 'w-4 h-4')} Create Another
                    </button>
                </div>
            </div>
        `
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('blend-results')
        if (!container) return

        container.classList.remove('hidden')
        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-6 border-2 border-red-400/30">
                <div class="flex items-center gap-3 text-red-400">
                    ${getIcon('AlertCircle', 'w-6 h-6')}
                    <span class="font-semibold">${message}</span>
                </div>
            </div>
        `
    }
}

export default BlendingMenuView
