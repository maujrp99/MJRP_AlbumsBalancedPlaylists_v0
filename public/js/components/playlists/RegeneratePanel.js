/**
 * RegeneratePanel Component
 * 
 * Collapsible panel in PlaylistsView Detail for regenerating playlists.
 * Reuses BlendFlavorCard and BlendIngredientsPanel components.
 * 
 * @module components/playlists/RegeneratePanel
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'
import { BlendFlavorCard } from '../blend/BlendFlavorCard.js'
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
  static flavorCard = null
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
          
          <!-- Step 1: Flavor (Algorithm) -->
          <div id="regenerate-flavor-container"></div>

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
    // Initialize Flavor Card
    this.flavorCard = new BlendFlavorCard({
      containerId: 'regenerate-flavor-container',
      selectedFlavor: { id: this.currentConfig.algorithmId }, // Partial flavor supported by selector logic? 
      // Note: BlendFlavorCard expects full flavor object or logic to find it. 
      // We'll let it execute its internal logic if possible or update it shortly.
      onFlavorSelect: (flavor) => {
        this.currentConfig.algorithmId = flavor.id
        // Update ingredients visibility based on flavor
        if (this.ingredientsPanel) {
          this.ingredientsPanel.setFlavor(flavor)
          this.ingredientsPanel.render()
        }
      }
    })

    // Trick: We need to set the initial flavor selection correctly. 
    // BlendFlavorCard constructor usually takes `selectedFlavor` object. 
    // If we only have ID, we might need to find it first or force update after init.
    // For now, let's rely on BlendFlavorCard handling init or select first one if null.
    // Explicitly finding the flavor would be better if possible, but getAllAlgorithms is inside component logic.
    // Let's rely on internal init for now, then clean up if needed.

    // Correction: BlendFlavorCard gets algorithms internally. 
    // We can access this.flavorCard.flavors after construction to set correct initial selection.
    const algorithms = this.flavorCard.flavors || []
    const initialFlavor = algorithms.find(a => a.id === this.currentConfig.algorithmId) || algorithms[0]

    if (initialFlavor) {
      this.flavorCard.selectedFlavor = initialFlavor
      this.currentConfig.algorithmId = initialFlavor.id
    }

    this.flavorCard.render()


    // Initialize Ingredients Panel
    this.ingredientsPanel = new BlendIngredientsPanel({
      containerId: 'regenerate-ingredients-container',
      selectedFlavor: initialFlavor,
      config: {
        // Map currentConfig props to panel props
        // This assumes PlaylistsView passed a config object roughly matching expected keys or we use defaults
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
