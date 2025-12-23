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

        // Get Top N algorithms only (for Blending Menu)
        this.flavors = this.getBlendingFlavors()
    }

    /**
     * Get algorithms suitable for Blending Menu
     */
    getBlendingFlavors() {
        const allAlgorithms = getAllAlgorithms()

        // Filter to Top N algorithms only
        return allAlgorithms.filter(algo =>
            algo.id.startsWith('top-')
        ).map(algo => ({
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

        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        return `
            <div class="blend-flavor-card group cursor-pointer p-4 rounded-xl border transition-all duration-300 transform hover:scale-105
                ${isSelected
                ? 'border-orange-400 bg-gradient-to-br from-orange-400/20 to-amber-400/10 ring-2 ring-orange-400 shadow-lg shadow-orange-400/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}"
                data-flavor-id="${flavor.id}">
                
                <div class="text-center">
                    <div class="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${flavor.color.from} ${flavor.color.to} flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                        ${getIcon(flavor.icon, 'w-7 h-7 text-white')}
                    </div>
                    
                    <h4 class="font-bold text-sm mb-1 ${isSelected ? 'text-orange-400' : ''}">${flavor.name}</h4>
                    
                    <span class="inline-block px-2 py-0.5 text-xs rounded-full mb-2
                        ${flavor.badge === 'TOP 3' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}">
                        ${flavor.badge}
                    </span>
                    
                    <p class="text-xs text-muted line-clamp-2">${flavor.description}</p>
                </div>
                
                ${isSelected ? `
                    <div class="absolute top-2 right-2 text-orange-400">
                        ${getIcon('CheckCircle', 'w-5 h-5')}
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
