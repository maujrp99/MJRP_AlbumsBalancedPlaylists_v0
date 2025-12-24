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

/**
 * @typedef {Object} RegeneratePanelOptions
 * @property {string} seriesId - Current series ID
 * @property {string} batchName - Current batch name
 * @property {string[]} existingPlaylistIds - IDs to preserve on regenerate
 * @property {Object} currentConfig - Current generation config
 * @property {boolean} [expanded=false] - Initial expanded state
 */

export class RegeneratePanel {
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
            currentConfig = {},
            expanded = false
        } = options

        const playlistCount = existingPlaylistIds.length

        return `
      <div class="regenerate-panel bg-surface rounded-xl border border-white/10 mb-6" 
           data-series-id="${seriesId}" 
           data-batch-name="${this.escapeHtml(batchName)}">
        
        <!-- Collapsible Header -->
        <button class="regenerate-header w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                data-action="toggle-regenerate-panel">
          <div class="flex items-center gap-3">
            ${getIcon('RefreshCw', 'w-5 h-5 text-brand-orange')}
            <span class="font-semibold">Regenerate Settings</span>
            <span class="text-sm text-muted">(${playlistCount} playlist${playlistCount !== 1 ? 's' : ''})</span>
          </div>
          <div class="regenerate-chevron transition-transform ${expanded ? 'rotate-180' : ''}">
            ${getIcon('ChevronDown', 'w-5 h-5')}
          </div>
        </button>

        <!-- Collapsible Content -->
        <div class="regenerate-content ${expanded ? '' : 'hidden'} border-t border-white/10 p-4 space-y-4">
          
          <!-- Algorithm Selector Placeholder -->
          <div id="regenerate-flavor-container">
            <!-- BlendFlavorCard will be mounted here -->
            <div class="text-center text-muted py-4">Loading algorithm options...</div>
          </div>

          <!-- Ingredients Panel Placeholder -->
          <div id="regenerate-ingredients-container">
            <!-- BlendIngredientsPanel will be mounted here -->
          </div>

          <!-- Warning -->
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
            ${getIcon('AlertTriangle', 'w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5')}
            <div class="text-sm">
              <p class="font-medium text-yellow-500">ID Preservation</p>
              <p class="text-muted mt-1">Regenerating will replace all tracks but keep playlist IDs intact for proper overwrite.</p>
            </div>
          </div>

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
