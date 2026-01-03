/**
 * AlbumCascade Component
 * 
 * Renders a stack of album thumbnails in a diagonal cascade.
 * Reusable across BlendSeriesSelector and SavedPlaylistsView.
 * 
 * @module components/common/AlbumCascade
 */

import { getIcon } from '../Icons.js'
import { SafeDOM } from '../../utils/SafeDOM.js'

export class AlbumCascade {
    /**
     * Render cascade thumbnails HTML (Legacy Wrapper)
     * @returns {string} HTML string
     */
    static render(thumbnails = [], options = {}) {
        return this.renderNode(thumbnails, options).outerHTML
    }

    /**
     * Render cascade thumbnails as DOM Node
     * @param {string[]} thumbnails - Array of image URLs (can contain nulls)
     * @param {Object} options - Rendering options
     * @returns {HTMLElement} DOM Element
     */
    static renderNode(thumbnails = [], options = {}) {
        const max = options.max || 3
        const items = thumbnails.slice(0, max)

        // Handling for empty state
        if (items.length === 0) {
            const emptyContainer = SafeDOM.div({
                className: 'w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center border border-white/10'
            })
            emptyContainer.appendChild(SafeDOM.fromHTML(getIcon('Music', 'w-6 h-6 text-orange-400')))
            return emptyContainer
        }

        // Calculate container dimensions based on item count
        const baseSize = 40 // 10 units (w-10) approx 40px
        const xOffset = 10
        const yOffset = 6

        const containerWidth = baseSize + ((items.length - 1) * xOffset)
        const containerHeight = baseSize + ((items.length - 1) * yOffset)

        const container = SafeDOM.div({
            className: 'relative shrink-0 album-cascade',
            style: { width: `${containerWidth}px`, height: `${containerHeight}px` }
        })

        items.forEach((url, i) => {
            const zIndex = items.length - i
            const left = i * xOffset
            const top = i * yOffset

            if (url) {
                container.appendChild(SafeDOM.img({
                    src: url,
                    alt: 'Album cover',
                    className: 'w-10 h-10 rounded-md object-cover shadow-lg border border-white/20 absolute transition-transform hover:scale-105 hover:z-50',
                    style: { left: `${left}px`, top: `${top}px`, zIndex: zIndex },
                    onerror: "this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNSkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiLz48L3N2Zz4n'"
                }))
            } else {
                // Gradient placeholder
                const placeholder = SafeDOM.div({
                    className: 'w-10 h-10 rounded-md bg-gradient-to-br from-purple-500/40 to-orange-500/40 shadow-lg border border-white/20 absolute flex items-center justify-center',
                    style: { left: `${left}px`, top: `${top}px`, zIndex: zIndex }
                })
                placeholder.appendChild(SafeDOM.fromHTML(getIcon('Disc', 'w-5 h-5 text-white/50')))
                container.appendChild(placeholder)
            }
        })

        return container
    }
}
