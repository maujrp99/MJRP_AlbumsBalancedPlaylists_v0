/**
 * RegeneratePanel Component
 * 
 * Collapsible panel in PlaylistsView Detail for regenerating playlists.
 * Reuses BlendRecipeCard and BlendIngredientsPanel components.
 * 
 * @module components/playlists/RegeneratePanel
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'
import { BlendRecipeCard } from '../blend/BlendRecipeCard.js'
import { BlendIngredientsPanel } from '../blend/BlendIngredientsPanel.js'

/**
 * @typedef {Object} RegeneratePanelOptions
 * @property {string} seriesId - Current series ID
 * @property {string} batchName - Current batch name
 * @property {string[]} existingPlaylistIds - IDs to preserve on regenerate
 * @property {Object} currentConfig - Current generation config
 * @property {boolean} [expanded=false] - Initial expanded state
 */

export class RegeneratePanel {
  // Store instances to access state later
  static recipeCard = null
  static ingredientsPanel = null
  static currentConfig = {}

  /**
   * Render regenerate panel HTML
   * @param {RegeneratePanelOptions} options
   * @returns {string} - HTML string
   */
  static render(options) {
    const {
      seriesId,
      batchName,
      existingPlaylistIds = [],
      count = 0,
      currentConfig = {},
      expanded = false
    } = options

    // Store initial config
    this.currentConfig = { ...currentConfig }

    const playlistCount = count || existingPlaylistIds.length

    return `
      <div class="regenerate-panel bg-surface rounded-xl border border-white/10 mb-6" 
           data-series-id="${seriesId}" 
           data-batch-name="${this.escapeHtml(batchName)}">
        
        <!-- Collapsible Header -->
        <button class="regenerate-header w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                data-action="toggle-regenerate-panel">
          <div class="flex items-center gap-3">
            ${getIcon('RefreshCw', 'w-5 h-5 text-brand-orange')}
                <h3 class="regenerate-header text-lg font-bold flex-1">Reconfigure your Music Playlist Blend</h3>
            <span class="text-sm text-muted">(${playlistCount} playlist${playlistCount !== 1 ? 's' : ''})</span>
          </div>
          <div class="regenerate-chevron transition-transform ${expanded ? 'rotate-180' : ''}">
            ${getIcon('ChevronDown', 'w-5 h-5')}
          </div>
        </button>

        <!-- Collapsible Content -->
        <div class="regenerate-content ${expanded ? '' : 'hidden'} border-t border-white/10 p-4 space-y-4">
          
          <!-- Step 1: Recipe (Algorithm) -->
          <div id="regenerate-recipe-container"></div>

          <!-- Step 2: Ingredients (Params) -->
          <div id="regenerate-ingredients-container"></div>

          <!-- Warning -->
          <!-- Warning Block Removed (too technical) -->

          <!-- Regenerate Button -->
          <button class="btn btn-primary w-full flex items-center justify-center gap-2" 
                  data-action="regenerate-playlists">
            ${getIcon('RefreshCw', 'w-5 h-5')}
            <span>Regenerate Playlists</span>
          </button>
        </div>
      </div>
    `
  }

  /**
   * Mount components and attach listeners
   * Must be called after render()
   */
  static mount() {
    // Initialize Recipe Card
    this.recipeCard = new BlendRecipeCard({
      containerId: 'regenerate-recipe-container',
      selectedRecipe: { id: this.currentConfig.algorithmId }, // Partial recipe supported by selector logic? 
      // Note: BlendRecipeCard expects full recipe object or logic to find it. 
      // We'll let it execute its internal logic if possible or update it shortly.
      onRecipeSelect: (recipe) => {
        this.currentConfig.algorithmId = recipe.id
        // Update ingredients visibility based on recipe
        if (this.ingredientsPanel) {
          this.ingredientsPanel.setRecipe(recipe)
          this.ingredientsPanel.render()
        }
      }
    })

    // Trick: We need to set the initial recipe selection correctly. 
    // BlendRecipeCard constructor usually takes `selectedRecipe` object. 
    // If we only have ID, we might need to find it first or force update after init.
    // For now, let's rely on BlendRecipeCard handling init or select first one if null.
    // Explicitly finding the recipe would be better if possible, but getAllAlgorithms is inside component logic.
    // Let's rely on internal init for now, then clean up if needed.

    // Correction: BlendRecipeCard gets algorithms internally. 
    // We can access this.recipeCard.recipes after construction to set correct initial selection.
    const algorithms = this.recipeCard.recipes || []
    const initialRecipe = algorithms.find(a => a.id === this.currentConfig.algorithmId) || algorithms[0]

    if (initialRecipe) {
      this.recipeCard.selectedRecipe = initialRecipe
      this.currentConfig.algorithmId = initialRecipe.id
    }

    this.recipeCard.render()


    // Initialize Ingredients Panel with current config values
    this.ingredientsPanel = new BlendIngredientsPanel({
      containerId: 'regenerate-ingredients-container',
      selectedRecipe: initialRecipe,
      config: {
        // Pass current config so user selections are preserved
        duration: (this.currentConfig.targetDuration || 3600) / 60, // seconds → minutes
        outputMode: this.currentConfig.outputMode || 'auto',
        groupingStrategy: this.currentConfig.groupingStrategy || 'by_album',
        rankingType: this.currentConfig.rankingId === 'spotify' ? 'spotify' :
          this.currentConfig.rankingId === 'bea' ? 'bea' : 'combined',
        discoveryMode: this.currentConfig.discoveryMode || false
      },
      onConfigChange: (newConfig) => {
        // Merge updates into our tracked config
        Object.assign(this.currentConfig, newConfig)
      }
    })
    this.ingredientsPanel.render()
  }

  /**
   * Get the current configuration for generation
   * BlendIngredientsPanel.getConfig() already returns normalized format
   * 
   * @returns {Object} Config ready for PlaylistGenerationService
   */
  static getConfig() {
    if (this.ingredientsPanel) {
      // BlendIngredientsPanel.getConfig() returns normalized config
      // (targetDuration in seconds, rankingId instead of rankingType)
      return {
        algorithmId: this.currentConfig.algorithmId,
        ...this.ingredientsPanel.getConfig()
      }
    }
    return this.currentConfig
  }

  /**
   * Escape HTML special characters
   * @private
   */
  static escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
