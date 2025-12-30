/**
 * Universal Card Component
 * 
 * Standardizes the "Entity Card" UI across the application.
 * Replaces: BaseCard, EntityCard, AlbumsGridRenderer cards.
 * 
 * @module components/ui/Card
 * @since Sprint 15 (ARCH-12)
 */

import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'

/**
 * @typedef {Object} CardProps
 * @property {Object} entity - The data object (Album, Playlist)
 * @property {'grid' | 'list' | 'minimal'} [variant='grid'] - Visual style
 * @property {string} [image] - Primary image URL
 * @property {string} [title] - Primary text
 * @property {string} [subtitle] - Secondary text
 * @property {string} [badge] - Top-right badge (e.g., Year, "32 tracks")
 * @property {Array<{icon: string, label: string, action: string, class?: string}>} [actions] - Button config
 * @property {string} [content] - HTML content for expanded body (List variant only)
 * @property {Function} [onClick] - Main card click handler (default: view-modal)
 */

export class Card {
    /**
     * Render the Card HTML
     * @param {CardProps} props 
     * @returns {string} HTML string
     */
    static render(props) {
        const { variant = 'grid' } = props

        if (variant === 'list' || variant === 'expanded') {
            return this.renderList(props)
        }
        return this.renderGrid(props)
    }

    /**
     * Render Compact/Grid Variant
     * @private
     */
    static renderGrid(props) {
        const { entity, image, title, subtitle, badge, actions = [] } = props
        const id = entity.id || ''

        // Default Actions if none provided
        const finalActions = actions.length > 0 ? actions : [
            { icon: 'Plus', label: 'Add', action: 'add-to-inventory' },
            { icon: 'Trash', label: 'Remove', action: 'remove-album', class: 'hover:text-red-400' }
        ]

        return `
        <div class="album-card-compact flex flex-col gap-3 h-full relative fade-in" data-id="${id}">
            <!-- Image Container -->
            <div 
                class="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                data-action="view-modal"
                data-id="${id}"
            >
                ${image ?
                `<img src="${image}" alt="${escapeHtml(title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />` :
                `<div class="flex items-center justify-center w-full h-full text-white/20">${getIcon('Music', 'w-24 h-24')}</div>`
            }
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span class="bg-black/50 p-3 rounded-full backdrop-blur text-white">
                        ${getIcon('Maximize2', 'w-6 h-6')}
                    </span>
                </div>
            </div>
            
            <!-- Metadata -->
            <div class="flex flex-col gap-1 px-1">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-white text-base truncate leading-tight" title="${escapeHtml(title)}">
                            ${escapeHtml(title)}
                        </h3>
                        <p class="text-gray-400 text-sm truncate hover:text-white transition-colors">
                            ${escapeHtml(subtitle)}
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 shrink-0">
                        ${finalActions.map(btn => `
                            <button class="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors ${btn.class || ''}" 
                                title="${escapeHtml(btn.label)}" 
                                data-action="${btn.action}" 
                                data-id="${id}">
                                ${getIcon(btn.icon, 'w-4 h-4')}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Footer / Badges -->
                <div class="flex items-center justify-between mt-2 gap-2">
                    <div class="flex flex-wrap gap-2">
                        ${badge ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">${escapeHtml(badge)}</span>` : ''}
                        ${this.renderRankingBadge(entity)}
                    </div>
                </div>
            </div>
        </div>
        `
    }

    /**
     * Render Expanded/List Variant
     * @private
     */
    static renderList(props) {
        const { entity, image, title, subtitle, content, actions = [] } = props
        const id = entity.id || ''

        // Animation delay index handling could be passed in props if needed

        return `
        <div class="expanded-album-card glass-panel p-6 mb-6 rounded-2xl animate-in fade-in" data-id="${id}">
            <div class="flex flex-col md:flex-row gap-6 items-start">
                
                <!-- Left: Cover & Actions -->
                <div class="flex flex-col gap-4 shrink-0">
                    <div class="relative group">
                        <div class="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-white/10">
                            <img src="${image}" alt="${escapeHtml(title)}" class="w-full h-full object-cover" loading="lazy" />
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                        ${actions.map(btn => `
                            <button class="tech-btn tech-btn-secondary text-xs px-4 py-2 flex items-center gap-2 hover:bg-white/20 ${btn.class || ''}"
                                data-action="${btn.action}"
                                data-id="${id}">
                                ${getIcon(btn.icon, 'w-3 h-3')} ${escapeHtml(btn.label)}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Right: Content -->
                <div class="flex-1 w-full min-w-0">
                    <h3 class="text-2xl font-bold mb-1 flex items-center gap-2">
                        ${getIcon('Music', 'w-6 h-6 text-accent-primary')}
                        ${escapeHtml(title)}
                    </h3>
                    <p class="text-accent-primary text-lg mb-3">${escapeHtml(subtitle)}</p>
                    
                    <div class="flex flex-wrap gap-2 text-sm mb-4">
                        ${this.renderRankingBadge(entity)}
                    </div>

                    <!-- Injected Content (e.g. Ranking Container) -->
                    ${content || ''}
                </div>
            </div>
        </div>
        `
    }

    /**
     * Render Badges (Spotify, Acclaim, etc.)
     * Ported from AlbumsGridRenderer
     */
    static renderRankingBadge(entity) {
        if (!entity) return ''

        // V3 Object Query vs V2 Model Support
        const hasBestEver = !!entity.bestEverAlbumId
        const hasSpotify = !!entity.spotifyId
        const providerType = entity.acclaim?.providerType || entity.rankingSource

        let badges = []

        if (hasBestEver) {
            // We return HTML strings here. Ideally this should be a Link Component but keeping it simple for now.
            badges.push(`
                <a href="https://www.besteveralbums.com/thechart.php?a=${entity.bestEverAlbumId}" target="_blank" rel="noopener noreferrer" 
                   class="badge badge-primary hover:badge-accent transition-colors flex items-center gap-1" title="Acclaim">
                   ${getIcon('ExternalLink', 'w-3 h-3')} Acclaim
                </a>`)
        }

        if (hasSpotify) {
            badges.push(`
                <a href="${entity.spotifyUrl || `https://open.spotify.com/album/${entity.spotifyId}`}" target="_blank" rel="noopener noreferrer" 
                   class="badge flex items-center gap-1 transition-colors hover:opacity-80" style="background: #1DB954; color: white; border: none;" title="Spotify">
                   ${getIcon('Spotify', 'w-3 h-3')} Spotify
                </a>`)
        }

        return badges.join('')
    }
}
