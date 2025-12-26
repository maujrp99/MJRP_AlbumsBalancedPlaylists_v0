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
import { escapeHtml } from '../utils/stringUtils.js'
import { BlendSeriesSelector } from '../components/blend/BlendSeriesSelector.js'
import { BlendFlavorCard } from '../components/blend/BlendFlavorCard.js'
import { BlendIngredientsPanel } from '../components/blend/BlendIngredientsPanel.js'
import { blendingController } from '../controllers/BlendingController.js'

export class BlendingMenuView extends BaseView {
    constructor() {
        super()
        this.seriesSelector = null
        this.flavorCard = null
        this.ingredientsPanel = null

        // State
        this.selectedSeries = null
        this.selectedFlavor = null
        this.config = {
            duration: 60,
            outputMode: 'auto',
            rankingType: 'combined',
            discoveryMode: false
        }
        this.isGenerating = false
    }

    async render(params) {
        // Progressive disclosure state
        const step1Complete = !!this.selectedSeries
        const step2Complete = !!this.selectedFlavor
        // ALL algorithms now show Step 3 for duration selection
        const algorithmHasParams = true
        const step3Skipped = false // Never skip Step 3
        const step3Complete = step2Complete && this.config.duration !== null

        return `
            <div class="container mx-auto px-4 py-8 max-w-5xl">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center gap-3 mb-3">
                        <span class="text-4xl">🍹</span>
                        <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                            The Blending Menu
                        </h1>
                    </div>
                    <p class="text-muted text-lg mb-6">"Your Music, Your Recipe"</p>
                    
                    <!-- Progressive Disclosure Stepper -->
                    <div class="inline-flex items-center gap-2 md:gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                        ${this.renderStepper()}
                    </div>
                </div>

                <!-- Step 1: Choose Your Blend - Always visible -->
                <section class="glass-panel rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🍹</span>
                        <h2 class="text-xl font-bold">Choose Your Blend</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 1</span>
                    </div>
                    <div id="blend-series-selector"></div>
                </section>

                <!-- Step 2: Choose Your Flavor - Visible only when Step 1 complete -->
                ${step1Complete ? `
                <section class="glass-panel rounded-2xl p-6 mb-6 animate-fadeIn">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🍬</span>
                        <h2 class="text-xl font-bold">Choose Your Flavor</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 2</span>
                    </div>
                    <div id="blend-flavor-cards"></div>
                </section>
                ` : `
                <section class="glass-panel rounded-2xl p-6 mb-6 opacity-40">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🔒</span>
                        <h2 class="text-xl font-medium text-muted">Choose Your Flavor</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 2</span>
                    </div>
                    <p class="text-sm text-muted mt-2">Complete Step 1 to unlock</p>
                </section>
                `}

                <!-- Step 3: Pick Your Ingredients - Only show if algorithm has params -->
                ${step2Complete && algorithmHasParams ? `
                <section class="glass-panel rounded-2xl p-6 mb-6 animate-fadeIn">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🥗</span>
                        <h2 class="text-xl font-bold">Pick Your Ingredients</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">Step 3</span>
                    </div>
                    <div id="blend-ingredients-panel"></div>
                </section>
                ` : ''}

                <!-- Step 4: Blend It! - Visible when Step 2 complete (and Step 3 if applicable) -->
                ${(step2Complete && step3Skipped) || step3Complete ? `
                <section class="glass-panel rounded-2xl p-6 border-2 border-orange-400/30 animate-fadeIn">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="text-2xl">🎛️</span>
                        <h2 class="text-xl font-bold">Blend It!</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">${algorithmHasParams ? 'Step 4' : 'Step 3'}</span>
                    </div>
                    <div id="blend-generate-section" class="text-center py-4">
                        ${this.renderGenerateButton()}
                    </div>
                </section>
                ` : step1Complete && !step2Complete ? `
                <section class="glass-panel rounded-2xl p-6 opacity-40">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🔒</span>
                        <h2 class="text-xl font-medium text-muted">Blend It!</h2>
                        <span class="text-xs text-muted px-2 py-1 bg-white/5 rounded-full">${algorithmHasParams ? 'Step 4' : 'Step 3'}</span>
                    </div>
                    <p class="text-sm text-muted mt-2">Complete previous steps to unlock</p>
                </section>
                ` : ''}

                <!-- Results Area -->
                <section id="blend-results" class="mt-8 hidden">
                </section>
            </div>
        `
    }

    /**
     * Render progressive disclosure stepper
     */
    renderStepper() {
        const steps = [
            { num: 1, label: 'Blend', icon: '🍹', done: !!this.selectedSeries },
            { num: 2, label: 'Flavor', icon: '🍬', done: !!this.selectedFlavor },
            { num: 3, label: 'Ingredients', icon: '🥗', done: this.config.duration !== null },
            { num: 4, label: 'Ready!', icon: '🎛️', done: false }
        ]

        // Determine current step
        let currentStep = 1
        if (this.selectedSeries) currentStep = 2
        if (this.selectedFlavor) currentStep = 3
        if (this.selectedSeries && this.selectedFlavor) currentStep = 4

        return steps.map((step, idx) => {
            const isActive = step.num === currentStep
            const isDone = step.num < currentStep
            const isFuture = step.num > currentStep

            const stepClass = isDone
                ? 'bg-green-500 text-white border-green-500'
                : isActive
                    ? 'bg-orange-400 text-black border-orange-400 shadow-lg shadow-orange-400/30'
                    : 'bg-white/5 text-muted border-white/20'

            const labelClass = isDone
                ? 'text-green-400'
                : isActive
                    ? 'text-orange-400 font-bold'
                    : 'text-muted'

            const connector = idx < steps.length - 1
                ? `<div class="w-4 md:w-8 h-0.5 ${isDone ? 'bg-green-500' : 'bg-white/20'}"></div>`
                : ''

            return `
                <div class="flex items-center gap-1 md:gap-2">
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-sm transition-all ${stepClass}">
                            ${isDone ? '✓' : step.icon}
                        </div>
                        <span class="text-[10px] md:text-xs mt-1 ${labelClass}">${step.label}</span>
                    </div>
                    ${connector}
                </div>
            `
        }).join('')
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
                        Using <strong>${escapeHtml(this.selectedFlavor.name)}</strong> on 
                        <strong>${escapeHtml(this.selectedSeries.name)}</strong>
                        (${this.config.duration} min, ${this.config.outputMode} mode)
                    </p>
                ` : ''}
            </div>
        `
    }

    async mount() {
        // Initialize components
        this.seriesSelector = new BlendSeriesSelector({
            onEntityChange: (entity) => this.fullUpdate(),
            onSeriesSelect: (series) => {
                this.selectedSeries = series
                this.fullUpdate() // Trigger full re-render for progressive disclosure
            }
        })

        this.flavorCard = new BlendFlavorCard({
            onFlavorSelect: (flavor) => {
                this.selectedFlavor = flavor
                this.fullUpdate() // Trigger full re-render for progressive disclosure
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
     * Full update - re-render entire view for progressive disclosure
     */
    async fullUpdate() {
        const container = this.container || document.getElementById('app')
        if (!container) return

        // Re-render entire view
        container.innerHTML = await this.render()

        // Re-mount components
        this.seriesSelector.render()
        this.flavorCard.render()

        // Pass selected flavor to ingredients panel for conditional rendering
        this.ingredientsPanel.setFlavor(this.selectedFlavor)
        this.ingredientsPanel.render()

        // Attach listeners
        this.attachGenerateListener()
    }

    /**
     * Update generate button state and stepper
     */
    updateGenerateButton() {
        // Update stepper
        this.updateStepper()

        // Update generate button
        const section = document.getElementById('blend-generate-section')
        if (section) {
            section.innerHTML = this.renderGenerateButton()
            this.attachGenerateListener()
        }
    }

    /**
     * Update stepper UI
     */
    updateStepper() {
        const stepperContainer = document.querySelector('.inline-flex.items-center.gap-2')
        if (stepperContainer) {
            stepperContainer.innerHTML = this.renderStepper()
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
     * Loads albums from series, sets in stores, navigates to PlaylistsView
     */
    async handleGenerate() {
        if (!this.selectedSeries || !this.selectedFlavor) return

        this.isGenerating = true
        this.updateGenerateButton()

        try {
            const { router } = await import('../router.js')
            const toast = (await import('../components/Toast.js')).default

            // Build config from flavor + ingredients
            const ingredientsConfig = this.ingredientsPanel.getConfig()
            const config = {
                algorithmId: this.selectedFlavor.id,
                ...ingredientsConfig
            }

            // Use BlendingController for centralized generation logic
            const result = await blendingController.generateFromSeries(
                this.selectedSeries.id,
                config,
                {
                    onProgress: (msg) => this.showProgress(msg),
                    useExistingAlbums: false
                }
            )

            // Navigate to playlists view
            toast.success(`Generated ${result.playlists.length} playlist(s)!`)
            router.navigate(`/playlists?seriesId=${this.selectedSeries.id}`)

        } catch (err) {
            console.error('[BlendingMenuView] Generation error:', err)
            this.showError(err.message || 'Generation failed')
        } finally {
            this.isGenerating = false
            this.updateGenerateButton()
        }
    }

    /**
     * Show progress message
     */
    showProgress(message) {
        const container = document.getElementById('blend-results')
        if (!container) return

        container.classList.remove('hidden')
        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-6 text-center">
                <div class="animate-spin rounded-full h-10 w-10 border-3 border-orange-400 border-t-transparent mx-auto mb-4"></div>
                <p class="text-muted">${message}</p>
            </div>
        `
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
                            <h4 class="font-semibold">${escapeHtml(p.title)}</h4>
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
