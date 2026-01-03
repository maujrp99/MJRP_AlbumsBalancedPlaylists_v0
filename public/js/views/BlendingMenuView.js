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
import { SafeDOM } from '../utils/SafeDOM.js'

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
        const algorithmHasParams = true
        const step3Skipped = false
        const step3Complete = step2Complete && this.config.duration !== null

        const container = SafeDOM.div({ className: 'container mx-auto px-4 py-8 max-w-5xl' })

        // Header
        const header = SafeDOM.div({ className: 'text-center mb-8' })

        const titleRow = SafeDOM.div({ className: 'inline-flex items-center gap-3 mb-3' })
        titleRow.appendChild(SafeDOM.span({ className: 'text-4xl' }, '🍹'))
        titleRow.appendChild(SafeDOM.h1({ className: 'text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent' }, 'The Blending Menu'))
        header.appendChild(titleRow)

        header.appendChild(SafeDOM.p({ className: 'text-muted text-lg mb-6' }, '"Your Music, Your Recipe"'))

        // Progressive Disclosure Stepper
        const stepperContainer = SafeDOM.div({ className: 'inline-flex items-center gap-2 md:gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10' })
        stepperContainer.appendChild(SafeDOM.fromHTML(this.renderStepper()))
        header.appendChild(stepperContainer)

        container.appendChild(header)

        // Step 1: Choose Your Blend - Always visible
        const step1 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 mb-6' })
        const step1Header = SafeDOM.div({ className: 'flex items-center gap-3 mb-4' }, [
            SafeDOM.span({ className: 'text-2xl' }, '🍹'),
            SafeDOM.h2({ className: 'text-xl font-bold' }, 'Choose Your Blend'),
            SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, 'Step 1')
        ])
        step1.appendChild(step1Header)
        step1.appendChild(SafeDOM.div({ id: 'blend-series-selector' }))
        container.appendChild(step1)

        // Step 2: Choose Your Flavor
        if (step1Complete) {
            const step2 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 mb-6 animate-fadeIn' })
            step2.appendChild(SafeDOM.div({ className: 'flex items-center gap-3 mb-4' }, [
                SafeDOM.span({ className: 'text-2xl' }, '🍬'),
                SafeDOM.h2({ className: 'text-xl font-bold' }, 'Choose Your Flavor'),
                SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, 'Step 2')
            ]))
            step2.appendChild(SafeDOM.div({ id: 'blend-flavor-cards' }))
            container.appendChild(step2)
        } else {
            const step2 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 mb-6 opacity-40' })
            step2.appendChild(SafeDOM.div({ className: 'flex items-center gap-3' }, [
                SafeDOM.span({ className: 'text-2xl' }, '🔒'),
                SafeDOM.h2({ className: 'text-xl font-medium text-muted' }, 'Choose Your Flavor'),
                SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, 'Step 2')
            ]))
            step2.appendChild(SafeDOM.p({ className: 'text-sm text-muted mt-2' }, 'Complete Step 1 to unlock'))
            container.appendChild(step2)
        }

        // Step 3: Pick Your Ingredients
        if (step2Complete && algorithmHasParams) {
            const step3 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 mb-6 animate-fadeIn' })
            step3.appendChild(SafeDOM.div({ className: 'flex items-center gap-3 mb-4' }, [
                SafeDOM.span({ className: 'text-2xl' }, '🥗'),
                SafeDOM.h2({ className: 'text-xl font-bold' }, 'Pick Your Ingredients'),
                SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, 'Step 3')
            ]))
            step3.appendChild(SafeDOM.div({ id: 'blend-ingredients-panel' }))
            container.appendChild(step3)
        }

        // Step 4: Blend It!
        if ((step2Complete && step3Skipped) || step3Complete) {
            const step4 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 border-2 border-orange-400/30 animate-fadeIn' })
            step4.appendChild(SafeDOM.div({ className: 'flex items-center gap-3 mb-4' }, [
                SafeDOM.span({ className: 'text-2xl' }, '🎛️'),
                SafeDOM.h2({ className: 'text-xl font-bold' }, 'Blend It!'),
                SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, algorithmHasParams ? 'Step 4' : 'Step 3')
            ]))
            const genSection = SafeDOM.div({ id: 'blend-generate-section', className: 'text-center py-4' })
            genSection.appendChild(SafeDOM.fromHTML(this.renderGenerateButton()))
            step4.appendChild(genSection)
            container.appendChild(step4)
        } else if (step1Complete && !step2Complete) {
            const step4 = SafeDOM.section({ className: 'glass-panel rounded-2xl p-6 opacity-40' })
            step4.appendChild(SafeDOM.div({ className: 'flex items-center gap-3' }, [
                SafeDOM.span({ className: 'text-2xl' }, '🔒'),
                SafeDOM.h2({ className: 'text-xl font-medium text-muted' }, 'Blend It!'),
                SafeDOM.span({ className: 'text-xs text-muted px-2 py-1 bg-white/5 rounded-full' }, algorithmHasParams ? 'Step 4' : 'Step 3')
            ]))
            step4.appendChild(SafeDOM.p({ className: 'text-sm text-muted mt-2' }, 'Complete previous steps to unlock'))
            container.appendChild(step4)
        }

        // Results Area
        container.appendChild(SafeDOM.section({ id: 'blend-results', className: 'mt-8 hidden' }))

        return container
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
                this.fullUpdate()
            }
        })

        this.flavorCard = new BlendFlavorCard({
            onFlavorSelect: (flavor) => {
                this.selectedFlavor = flavor
                this.fullUpdate()
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
        const navContainer = document.getElementById('app')
        if (!navContainer) return

        // Wait for render
        const newContent = await this.render()

        // Use SafeDOM.clear and appendChild
        SafeDOM.clear(navContainer)
        navContainer.appendChild(newContent)

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
            SafeDOM.clear(section)
            section.appendChild(SafeDOM.fromHTML(this.renderGenerateButton()))
            this.attachGenerateListener()
        }
    }

    /**
     * Update stepper UI
     */
    updateStepper() {
        const stepperContainer = document.querySelector('.inline-flex.items-center.gap-2')
        if (stepperContainer) {
            SafeDOM.clear(stepperContainer)
            stepperContainer.appendChild(SafeDOM.fromHTML(this.renderStepper()))
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
        SafeDOM.clear(container)
        container.appendChild(SafeDOM.fromHTML(`
            <div class="glass-panel rounded-2xl p-6 text-center">
                <div class="animate-spin rounded-full h-10 w-10 border-3 border-orange-400 border-t-transparent mx-auto mb-4"></div>
                <p class="text-muted">${message}</p>
            </div>
        `))
    }

    /**
     * Show generation results
     */
    showResults(result) {
        const container = document.getElementById('blend-results')
        if (!container) return

        container.classList.remove('hidden')
        SafeDOM.clear(container)
        container.appendChild(SafeDOM.fromHTML(`
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
        `))
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('blend-results')
        if (!container) return

        container.classList.remove('hidden')
        SafeDOM.clear(container)
        container.appendChild(SafeDOM.fromHTML(`
            <div class="glass-panel rounded-2xl p-6 border-2 border-red-400/30">
                <div class="flex items-center gap-3 text-red-400">
                    ${getIcon('AlertCircle', 'w-6 h-6')}
                    <span class="font-semibold">${message}</span>
                </div>
            </div>
        `))
    }
}

export default BlendingMenuView
