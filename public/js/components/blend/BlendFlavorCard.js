/**
 * BlendFlavorCard.js
 * 
 * Step 2: 🍬 Choose Your Flavor
 * Algorithm selection with visual cards
 * 
 * @module components/blend/BlendFlavorCard
 */

import { getIcon } from '../Icons.js'
import { getAllAlgorithms } from '../../algorithms/index.js'

export class BlendFlavorCard {
    constructor(opts = {}) {
        this.onFlavorSelect = opts.onFlavorSelect || (() => { })
        this.selectedFlavor = opts.selectedFlavor || null

        // Get ALL algorithms for Blending Menu
        this.flavors = this.getBlendingFlavors()
    }

    /**
     * Get algorithms suitable for Blending Menu
     * Order: RECOMMENDED first, then Full Experience, then Top N (Curated Selection)
     */
    getBlendingFlavors() {
        const allAlgorithms = getAllAlgorithms()

        // Separate recommended, full experience, and curated selection
        const recommended = allAlgorithms.filter(a => a.isRecommended)
        const fullExperience = allAlgorithms.filter(a =>
            !a.isRecommended && !a.id.startsWith('top-')
        )
        const curatedSelection = allAlgorithms.filter(a =>
            a.id.startsWith('top-')
        )

        // Order: RECOMMENDED first, then Full Experience, then Curated Selection
        const ordered = [...recommended, ...fullExperience, ...curatedSelection]

        return ordered.map(algo => ({
            ...algo,
            icon: this.getFlavorIcon(algo.id),
            color: this.getFlavorColor(algo.id)
        }))
    }

    /**
     * Get icon for each flavor
     */
    getFlavorIcon(id) {
        const icons = {
            // Recommended / Full Experience
            'mjrp-balanced-cascade': 'Sparkles',
            'mjrp-cascade-v0': 'Layers',
            's-draft-original': 'Shuffle',
            'legacy-roundrobin': 'RefreshCw',
            // Top N (Curated Selection)
            'top-3-popular': 'TrendingUp',
            'top-3-acclaimed': 'Award',
            'top-5-popular': 'Star',
            'top-5-acclaimed': 'Gem'
        }
        return icons[id] || 'Music'
    }

    /**
     * Get color theme for each flavor
     */
    getFlavorColor(id) {
        const colors = {
            // Recommended - Golden gradient
            'mjrp-balanced-cascade': { from: 'from-amber-400', to: 'to-orange-500' },
            // Full Experience
            'mjrp-cascade-v0': { from: 'from-emerald-500', to: 'to-teal-500' },
            's-draft-original': { from: 'from-indigo-500', to: 'to-purple-500' },
            'legacy-roundrobin': { from: 'from-slate-500', to: 'to-gray-600' },
            // Top N (Curated Selection)
            'top-3-popular': { from: 'from-orange-500', to: 'to-red-500' },
            'top-3-acclaimed': { from: 'from-purple-500', to: 'to-pink-500' },
            'top-5-popular': { from: 'from-yellow-400', to: 'to-orange-500' },
            'top-5-acclaimed': { from: 'from-blue-500', to: 'to-cyan-400' }
        }
        return colors[id] || { from: 'from-gray-500', to: 'to-gray-600' }
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById('blend-flavor-cards')
        if (!container) return

        const cards = this.flavors.map(f => this.renderFlavorCard(f)).join('')

        // 4 columns on desktop, 2 on mobile - handles 8 cards nicely
        container.innerHTML = `
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                ${cards}
            </div>
        `

        this.attachListeners()
    }

    /**
     * Render individual flavor card
     */
    renderFlavorCard(flavor) {
        const isSelected = this.selectedFlavor?.id === flavor.id
        const isRecommended = flavor.isRecommended

        // Determine badge style
        let badgeClass = 'bg-gray-500/20 text-gray-400'
        if (isRecommended) {
            badgeClass = 'bg-amber-400/20 text-amber-400 font-bold'
        } else if (flavor.badge === 'TOP 3') {
            badgeClass = 'bg-orange-500/20 text-orange-400'
        } else if (flavor.badge === 'TOP 5') {
            badgeClass = 'bg-blue-500/20 text-blue-400'
        }

        return `
            <div class="blend-flavor-card group relative cursor-pointer p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.03]
                ${isSelected
                ? 'border-orange-400 bg-gradient-to-br from-orange-400/20 to-amber-400/10 ring-2 ring-orange-400 shadow-lg shadow-orange-400/20'
                : isRecommended
                    ? 'border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-orange-400/5 hover:border-amber-400/50'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                data-flavor-id="${flavor.id}">
                
                ${isRecommended ? `
                    <div class="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-black whitespace-nowrap">
                        ⭐ RECOMMENDED
                    </div>
                ` : ''}
                
                <div class="text-center ${isRecommended ? 'pt-2' : ''}">
                    <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${flavor.color.from} ${flavor.color.to} flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        ${getIcon(flavor.icon, 'w-6 h-6 text-white')}
                    </div>
                    
                    <h4 class="font-bold text-base mb-1 ${isSelected ? 'text-orange-400' : isRecommended ? 'text-amber-400' : ''}">${flavor.name}</h4>
                    
                    <span class="inline-block px-2 py-0.5 text-[10px] rounded-full mb-2 ${badgeClass}">
                        ${flavor.badge}
                    </span>
                    
                    <p class="text-[13px] text-muted leading-snug">${flavor.description}</p>
                </div>
                
                ${isSelected ? `
                    <div class="absolute top-2 right-2 text-orange-400">
                        ${getIcon('CheckCircle', 'w-4 h-4')}
                    </div>
                ` : ''}
            </div>
        `
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        document.querySelectorAll('.blend-flavor-card').forEach(card => {
            card.addEventListener('click', () => {
                const flavorId = card.dataset.flavorId
                const flavor = this.flavors.find(f => f.id === flavorId)
                this.selectedFlavor = flavor
                this.onFlavorSelect(flavor)
                this.render()
            })
        })
    }

    /**
     * Get current selection
     */
    getSelection() {
        return this.selectedFlavor
    }
}

export default BlendFlavorCard
