/**
 * PlaylistGrid Component
 * 
 * Responsive grid layout for PlaylistCards.
 * 
 * @module components/playlists/PlaylistGrid
 * @since Sprint 12.5
 */

import { PlaylistCard } from './PlaylistCard.js'

/**
 * @typedef {Object} PlaylistGridOptions
 * @property {Object[]} playlists - Array of playlists
 * @property {boolean} [editable=true] - Enable editing
 * @property {'spotify' | 'acclaim'} [primaryRanking='spotify'] - Ranking order
 */

export class PlaylistGrid {
    /**
     * Render playlist grid HTML
     * @param {PlaylistGridOptions} options
     * @returns {string} - HTML string
     */
    static render(options) {
        const {
            playlists,
            editable = true,
            primaryRanking = 'spotify'
        } = options

        if (!playlists || playlists.length === 0) {
            return `
        <div class="text-center py-12 text-muted">
          <p class="text-lg">No playlists generated yet.</p>
          <p class="text-sm mt-2">Use the settings above to generate playlists.</p>
        </div>
      `
        }

        const cardsHtml = playlists.map((playlist, index) =>
            PlaylistCard.render({
                playlist,
                index,
                editable,
                primaryRanking
            })
        ).join('')

        // Responsive grid: 1 col on mobile, 2 on md, 3 on lg
        return `
      <div class="playlist-grid grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        ${cardsHtml}
      </div>
    `
    }
}
