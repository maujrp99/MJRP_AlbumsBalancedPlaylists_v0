/**
 * BlendRecipeCard.js
 * 
 * Step 2: 🍬 Choose Your Recipe
 * Algorithm selection with visual cards
 * 
 * @module components/blend/BlendRecipeCard
 */

import { getIcon } from '../Icons.js'
import { getAllAlgorithms } from '../../algorithms/index.js'

export class BlendRecipeCard {
    constructor(opts = {}) {
        this.containerId = opts.containerId || 'blend-recipe-cards'
        this.onRecipeSelect = opts.onRecipeSelect || (() => { })
        this.selectedRecipe = opts.selectedRecipe || null

        // Get ALL algorithms for Blending Menu
        this.recipes = this.getBlendingRecipes()
    }

    /**
     * Get all algorithms that are valid for blending
     */
    getBlendingRecipes() {
        const algorithms = getAllAlgorithms()

        // Map implementation details to recipe properties
        return algorithms.map(algo => ({
            id: algo.id,
            name: algo.name,
            description: algo.description,
            icon: this.getRecipeIcon(algo.id),
            color: this.getRecipeColor(algo.id),
            badge: algo.badge,
            isRecommended: algo.isRecommended
        }))
    }

    /**
     * Get icon for each recipe
     */
    getRecipeIcon(id) {
        const icons = {
            // Recommended / Full Experience
            'mjrp-balanced-cascade': 'Sparkles',
            'mjrp-cascade-v0': 'Layers',
            's-draft-original': 'Shuffle',
            'legacy-roundrobin': 'RefreshCw',
            // Top N (Curated Selection)
            'top-n-popular': 'TrendingUp',
            'top-n-acclaimed': 'Award'
        }
        return icons[id] || 'Music'
    }

    /**
     * Get color theme for each recipe
     */
    getRecipeColor(id) {
        const colors = {
            // Recommended - Golden gradient
            'mjrp-balanced-cascade': { from: 'from-amber-400', to: 'to-orange-500' },
            // Full Experience
            'mjrp-cascade-v0': { from: 'from-emerald-500', to: 'to-teal-500' },
            's-draft-original': { from: 'from-indigo-500', to: 'to-purple-500' },
            'legacy-roundrobin': { from: 'from-slate-500', to: 'to-gray-600' },
            // Top N (Curated Selection)
            'top-n-popular': { from: 'from-green-500', to: 'to-emerald-600' }, // Spotify Green
            'top-n-acclaimed': { from: 'from-rose-500', to: 'to-orange-500' } // BEA Red/Orange
        }
        return colors[id] || { from: 'from-gray-500', to: 'to-gray-600' }
    }

    /**
     * Render individual recipe card
     */
    renderRecipeCard(recipe) {
        const isSelected = this.selectedRecipe?.id === recipe.id
        const isRecommended = recipe.isRecommended // Will need to ensure this property exists or is derived

        // Determine badge style
        let badgeClass = 'bg-gray-500/20 text-gray-400'
        if (isRecommended) {
            badgeClass = 'bg-amber-400/20 text-amber-400 font-bold'
        } else if (recipe.badge === 'SPOTIFY') {
            badgeClass = 'bg-green-500/20 text-green-400 font-semibold'
        } else if (recipe.badge === 'BEA') {
            badgeClass = 'bg-rose-500/20 text-rose-400 font-semibold'
        } else if (recipe.badge === 'TOP 3') {
            badgeClass = 'bg-orange-500/20 text-orange-400'
        } else if (recipe.badge === 'TOP 5') {
            badgeClass = 'bg-blue-500/20 text-blue-400'
        }

        const borderClass = isSelected
            ? `border-amber-400 bg-gradient-to-br ${recipe.color.from}/10 ${recipe.color.to}/10 ring-2 ring-orange-400 shadow-lg shadow-orange-400/20`
            : isRecommended
                ? `border-amber-400/40 bg-gradient-to-br from-amber-900/10 to-orange-900/5 hover:border-amber-400/60`
                : `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10`

        return `
            <div class="blend-recipe-card group relative cursor-pointer p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] ${borderClass}"
                 data-recipe-id="${recipe.id}">
                
                ${isRecommended ? `
                    <div class="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-black whitespace-nowrap">
                        ★ RECOMMENDED
                    </div>
                ` : ''}

                <div class="flex items-center justify-center mb-3">
                    <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${recipe.color.from} ${recipe.color.to} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        ${getIcon(recipe.icon, 'w-6 h-6 text-white')}
                    </div>
                </div>

                <h4 class="font-bold text-base mb-1 ${isSelected || isRecommended ? 'text-amber-400' : ''}">${recipe.name}</h4>
                
                <span class="inline-block px-2 py-0.5 text-[10px] rounded-full mb-2 ${badgeClass}">
                    ${recipe.badge || 'ALGORITHM'}
                </span>

                <p class="text-[11px] text-muted leading-snug line-clamp-2">${recipe.description}</p>
            </div>
        `
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById(this.containerId)
        if (!container) return

        const cards = this.recipes.map(r => this.renderRecipeCard(r)).join('')

        // 4 columns on desktop, 2 on mobile - handles 8 cards nicely
        container.innerHTML = `
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                ${cards}
            </div>
        `

        this.attachListeners(container)
    }

    /**
     * Attach event listeners
     */
    attachListeners(container) {
        container.querySelectorAll('.blend-recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId
                const recipe = this.recipes.find(r => r.id === recipeId)
                this.selectedRecipe = recipe
                this.onRecipeSelect(recipe)
                this.render()
            })
        })
    }

    /**
     * Get current selection
     */
    getSelection() {
        return this.selectedRecipe
    }
}

export default BlendRecipeCard
