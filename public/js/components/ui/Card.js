/**
 * Universal Card Component (SafeDOM Version)
 * 
 * Standardizes the "Entity Card" UI across the application.
 * Replaces: BaseCard, EntityCard, AlbumsGridRenderer cards.
 * 
 * Sprint 15 Phase 3: Refactored to use SafeDOM for zero innerHTML.
 * 
 * @module components/ui/Card
 * @since Sprint 15 (ARCH-12)
 */

import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'

/**
 * @typedef {Object} CardProps
 * @property {Object} entity - The data object (Album, Playlist)
 * @property {'grid' | 'list' | 'minimal'} [variant='grid'] - Visual style
 * @property {string} [image] - Primary image URL
 * @property {string} [title] - Primary text
 * @property {string} [subtitle] - Secondary text
 * @property {string} [badge] - Top-right badge (e.g., Year, "32 tracks")
 * @property {Array<{icon: string, label: string, action: string, class?: string}>} [actions] - Button config
 * @property {string|Node|Array} [content] - Content for expanded body (List variant only)
 * @property {Function} [onClick] - Main card click handler (default: view-modal)
 */

export class Card {
    /**
     * Render the Card as a DOM Node
     * @param {CardProps} props 
     * @returns {HTMLElement} DOM Node
     */
    static render(props) {
        const { variant = 'grid' } = props

        if (variant === 'list' || variant === 'expanded') {
            return this.renderList(props)
        }
        return this.renderGrid(props)
    }

    /**
     * Backwards-compatible HTML string renderer
     * Use this when you need HTML string (for template literals or innerHTML)
     * @param {CardProps} props 
     * @returns {string} HTML string
     */
    static renderHTML(props) {
        const el = this.render(props)
        return el.outerHTML
    }

    /**
     * Render Compact/Grid Variant
     * @private
     */
    static renderGrid(props) {
        const { entity, image, title, subtitle, badge, actions = [], onClick } = props
        const id = entity?.id || ''

        // Default Actions if none provided
        const finalActions = actions.length > 0 ? actions : [
            { icon: 'Plus', label: 'Add', action: 'add-to-inventory' },
            { icon: 'Trash', label: 'Remove', action: 'remove-album', class: 'hover:text-red-400' }
        ]

        // Image element or placeholder
        let imageContent
        if (image) {
            imageContent = SafeDOM.img({
                src: image,
                alt: title || '',
                className: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                loading: 'lazy'
            })
        } else {
            const placeholder = SafeDOM.div({
                className: 'flex items-center justify-center w-full h-full text-white/20'
            })
            placeholder.innerHTML = getIcon('Music', 'w-24 h-24')
            imageContent = placeholder
        }

        // Hover overlay
        const hoverOverlay = SafeDOM.div({
            className: 'absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none'
        })
        const hoverIcon = SafeDOM.span({
            className: 'bg-black/50 p-3 rounded-full backdrop-blur text-white'
        })
        hoverIcon.innerHTML = getIcon('Maximize2', 'w-6 h-6')
        hoverOverlay.appendChild(hoverIcon)

        // Image container
        const imageContainer = SafeDOM.div({
            className: 'relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group',
            dataset: { action: 'view-modal', id },
            onClick: onClick
        }, [imageContent, hoverOverlay])

        // Title
        const titleEl = SafeDOM.h3({
            className: 'font-bold text-white text-base truncate leading-tight',
            title: title
        }, title)

        // Subtitle
        const subtitleEl = SafeDOM.p({
            className: 'text-gray-400 text-sm truncate hover:text-white transition-colors'
        }, subtitle)

        // Action buttons
        const actionButtons = finalActions.map(btn => {
            const buttonEl = SafeDOM.button({
                className: `p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors ${btn.class || ''}`,
                title: btn.label,
                dataset: { action: btn.action, id }
            })
            buttonEl.innerHTML = getIcon(btn.icon, 'w-4 h-4')
            return buttonEl
        })

        const actionsContainer = SafeDOM.div({
            className: 'flex items-center gap-1 shrink-0'
        }, actionButtons)

        // Header row (title + actions)
        const headerRow = SafeDOM.div({
            className: 'flex justify-between items-start gap-2'
        }, [
            SafeDOM.div({ className: 'min-w-0 flex-1' }, [titleEl, subtitleEl]),
            actionsContainer
        ])

        // Badge elements
        const badgeElements = []
        if (badge) {
            badgeElements.push(SafeDOM.span({
                className: 'text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5'
            }, badge))
        }
        const rankingBadges = this.renderRankingBadge(entity)
        if (rankingBadges) {
            badgeElements.push(rankingBadges)
        }

        // Footer row (badges)
        const footerRow = SafeDOM.div({
            className: 'flex items-center justify-between mt-2 gap-2'
        }, [
            SafeDOM.div({ className: 'flex flex-wrap gap-2' }, badgeElements)
        ])

        // Metadata container
        const metaContainer = SafeDOM.div({
            className: 'flex flex-col gap-1 px-1'
        }, [headerRow, footerRow])

        // Main card
        const card = SafeDOM.div({
            className: 'album-card-compact flex flex-col gap-3 h-full relative fade-in',
            dataset: { id }
        }, [imageContainer, metaContainer])

        return card
    }

    /**
     * Render Expanded/List Variant
     * @private
     */
    static renderList(props) {
        const { entity, image, title, subtitle, content, actions = [] } = props
        const id = entity?.id || ''

        // Cover image
        const coverImg = SafeDOM.img({
            src: image,
            alt: title || '',
            className: 'w-full h-full object-cover',
            loading: 'lazy'
        })

        const coverContainer = SafeDOM.div({
            className: 'w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-white/10'
        }, coverImg)

        // Action buttons
        const actionButtons = actions.map(btn => {
            const buttonEl = SafeDOM.button({
                className: `tech-btn tech-btn-secondary text-xs px-4 py-2 flex items-center gap-2 hover:bg-white/20 ${btn.class || ''}`,
                dataset: { action: btn.action, id }
            })
            const iconSpan = SafeDOM.span({})
            iconSpan.innerHTML = getIcon(btn.icon, 'w-3 h-3')
            buttonEl.appendChild(iconSpan)
            buttonEl.appendChild(SafeDOM.text(' ' + btn.label))
            return buttonEl
        })

        const actionsRow = SafeDOM.div({
            className: 'flex flex-wrap gap-2 justify-center md:justify-start'
        }, actionButtons)

        // Left column
        const leftColumn = SafeDOM.div({
            className: 'flex flex-col gap-4 shrink-0'
        }, [
            SafeDOM.div({ className: 'relative group' }, coverContainer),
            actionsRow
        ])

        // Title with icon
        const titleHeader = SafeDOM.h3({
            className: 'text-2xl font-bold mb-1 flex items-center gap-2'
        })
        const titleIcon = SafeDOM.span({})
        titleIcon.innerHTML = getIcon('Music', 'w-6 h-6 text-accent-primary')
        titleHeader.appendChild(titleIcon)
        titleHeader.appendChild(SafeDOM.text(title))

        // Subtitle
        const subtitleEl = SafeDOM.p({
            className: 'text-accent-primary text-lg mb-3'
        }, subtitle)

        // Ranking badges container
        const badgesRow = SafeDOM.div({
            className: 'flex flex-wrap gap-2 text-sm mb-4'
        }, this.renderRankingBadge(entity))

        // Right column
        const rightColumn = SafeDOM.div({
            className: 'flex-1 w-full min-w-0'
        }, [
            titleHeader,
            subtitleEl,
            badgesRow,
            // Content can be string, Node, or array
            content
        ])

        // Main layout
        const layout = SafeDOM.div({
            className: 'flex flex-col md:flex-row gap-6 items-start'
        }, [leftColumn, rightColumn])

        // Card container
        const card = SafeDOM.div({
            className: 'expanded-album-card glass-panel p-6 mb-6 rounded-2xl animate-in fade-in',
            dataset: { id }
        }, layout)

        return card
    }

    /**
     * Render Badges (Spotify, Acclaim, etc.) as DOM fragments
     * Ported from AlbumsGridRenderer
     * @returns {DocumentFragment|null}
     */
    static renderRankingBadge(entity) {
        if (!entity) return null

        const hasBestEver = !!entity.bestEverAlbumId
        const hasSpotify = !!entity.spotifyId

        const badges = []

        if (hasBestEver) {
            const link = SafeDOM.a({
                href: `https://www.besteveralbums.com/thechart.php?a=${entity.bestEverAlbumId}`,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'badge badge-primary hover:badge-accent transition-colors flex items-center gap-1',
                title: 'Acclaim'
            })
            link.innerHTML = getIcon('ExternalLink', 'w-3 h-3')
            link.appendChild(SafeDOM.text(' Acclaim'))
            badges.push(link)
        }

        if (hasSpotify) {
            const spotifyUrl = entity.spotifyUrl || `https://open.spotify.com/album/${entity.spotifyId}`
            const link = SafeDOM.a({
                href: spotifyUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'badge flex items-center gap-1 transition-colors hover:opacity-80',
                style: { background: '#1DB954', color: 'white', border: 'none' },
                title: 'Spotify'
            })
            link.innerHTML = getIcon('Spotify', 'w-3 h-3')
            link.appendChild(SafeDOM.text(' Spotify'))
            badges.push(link)
        }

        if (badges.length === 0) return null

        return SafeDOM.fragment(badges)
    }
}
