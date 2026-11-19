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
import { escapeHtml } from '../../utils/stringUtils.js'
import { BlendRecipeCard } from '../blend/BlendRecipeCard.js'
import { BlendIngredientsPanel } from '../blend/BlendIngredientsPanel.js'

/**
 * @typedef {Object} RegeneratePanelOptions
 * @property {string} seriesId - Current series ID
 * @property {string} batchName - Current batch name
 * @property {string[]} existingPlaylistIds - IDs to preserve on regenerate
 * @property {Object|null} generatedWith - the recipe the playlists on screen were generated with
 * @property {boolean} [expanded=false] - Initial expanded state
 */

/** The recipe the panel opens on when the playlists do not say how they were generated. */
const DEFAULT_RECIPE = Object.freeze({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' })

/** The ranking of a recipe as the ingredients panel names it. */
const RANKING_TYPE_OF = Object.freeze({ spotify: 'spotify', bea: 'bea' })

/**
 * The recipe shown is, in this order: what the person changed in the panel and did not generate
 * yet (`pending`, kept through every redraw of the screen), or the recipe the playlists on screen
 * were generated with, or the recommended one. Always in the form the generation takes
 * (algorithmId, rankingId, targetDuration in seconds, outputMode, groupingStrategy, trackCount).
 */
export class RegeneratePanel {
  // Store instances to access state later
  static recipeCard = null
  static ingredientsPanel = null
  static currentConfig = {}
  static pending = null

  /** Forget what was changed in the panel: after a generation, and when the screen opens. */
  static reset() {
    this.pending = null
  }

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
      generatedWith = null,
      expanded = false
    } = options

    this.currentConfig = { ...(this.pending || generatedWith || DEFAULT_RECIPE) }

    const playlistCount = count || existingPlaylistIds.length

    return `
      <div class="regenerate-panel bg-surface rounded-xl border border-white/10 mb-6" 
           data-series-id="${escapeHtml(seriesId)}" 
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
    this.recipeCard = new BlendRecipeCard({
      containerId: 'regenerate-recipe-container',
      onRecipeSelect: (recipe) => {
        this.ingredientsPanel.setRecipe(recipe)
        this.ingredientsPanel.render()
        this._remember()
      }
    })
    const recipes = this.recipeCard.recipes || []
    const initialRecipe = recipes.find(recipe => recipe.id === this.currentConfig.algorithmId) || recipes[0] || null
    this.recipeCard.selectedRecipe = initialRecipe
    this.recipeCard.render()

    this.ingredientsPanel = new BlendIngredientsPanel({
      containerId: 'regenerate-ingredients-container',
      selectedRecipe: initialRecipe,
      config: this._ingredientsOf(this.currentConfig),
      onConfigChange: () => this._remember()
    })
    this.ingredientsPanel.render()
  }

  /** A recipe in the form of the generation, as the options of the ingredients panel. */
  static _ingredientsOf(config) {
    const chosen = {
      duration: config.targetDuration ? config.targetDuration / 60 : undefined, // seconds → minutes
      outputMode: config.outputMode,
      groupingStrategy: config.groupingStrategy,
      rankingType: RANKING_TYPE_OF[config.rankingId] || 'combined',
      trackCount: config.trackCount
    }
    // an option the recipe does not carry keeps the default of the panel
    return Object.fromEntries(Object.entries(chosen).filter(([, value]) => value !== undefined && value !== null))
  }

  /** What is in the panel now becomes what the next redraw shows. */
  static _remember() {
    this.pending = this.getConfig()
  }

  /**
   * Get the current configuration for generation
   * BlendIngredientsPanel.getConfig() already returns normalized format
   * (targetDuration in seconds, rankingId instead of rankingType)
   *
   * @returns {Object} Config ready for PlaylistGenerationService
   */
  static getConfig() {
    if (!this.ingredientsPanel) return { ...this.currentConfig }
    return {
      algorithmId: this.recipeCard?.selectedRecipe?.id || this.currentConfig.algorithmId,
      ...this.ingredientsPanel.getConfig()
    }
  }

  /**
   * Escape HTML special characters
   * @private
   */
  static escapeHtml(text) {
    if (!text) return ''
    return escapeHtml(text)
  }
}
