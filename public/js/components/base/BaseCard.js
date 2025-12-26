/**
 * BaseCard Component
 * 
 * Base card component providing consistent styling and structure.
 * Uses composition pattern for String Template rendering.
 * 
 * @module components/base/BaseCard
 * @since ARCH-3
 */

import { getIcon } from '../Icons.js'

export class BaseCard {
    /**
     * Default card CSS classes
     */
    static BASE_CLASSES = 'rounded-xl border border-white/10 bg-surface overflow-hidden'
    static HOVER_CLASSES = 'transition-all duration-300 hover:border-brand-orange/30'

    /**
     * Render card container with header, body, and footer slots
     * @param {Object} options
     * @param {string} [options.header] - Header HTML content
     * @param {string} [options.body] - Body HTML content  
     * @param {string} [options.footer] - Footer HTML content
     * @param {string} [options.className] - Additional CSS classes
     * @param {Object} [options.dataAttrs] - Data attributes { key: value }
     * @param {boolean} [options.noHover] - Disable hover effects
     * @returns {string} HTML string
     */
    static renderContainer(options = {}) {
        const {
            header,
            body,
            footer,
            className = '',
            dataAttrs = {},
            noHover = false
        } = options

        const dataAttrsStr = Object.entries(dataAttrs)
            .map(([k, v]) => `data-${k}="${this.escapeHtml(String(v))}"`)
            .join(' ')

        const hoverClasses = noHover ? '' : this.HOVER_CLASSES

        return `
            <div class="${this.BASE_CLASSES} ${hoverClasses} ${className}"
                 ${dataAttrsStr}>
                ${header ? `<div class="card-header p-4 bg-white/5 border-b border-white/10">${header}</div>` : ''}
                ${body ? `<div class="card-body">${body}</div>` : ''}
                ${footer ? `<div class="card-footer p-4 border-t border-white/10">${footer}</div>` : ''}
            </div>
        `
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    static escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    /**
     * Render icon using Icons.js
     * @param {string} iconName - Lucide icon name
     * @param {string} [className] - Additional CSS classes
     * @returns {string} Icon HTML
     */
    static icon(iconName, className = 'w-4 h-4') {
        return getIcon(iconName, className)
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        if (!date) return ''
        const d = date instanceof Date ? date : new Date(date)
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    /**
     * Calculate duration in MM:SS format
     * @param {Object[]} tracks - Array of tracks with duration property
     * @returns {string} Formatted duration
     */
    static formatDuration(tracks) {
        if (!tracks || tracks.length === 0) return '0:00'
        const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
        const mins = Math.floor(totalSeconds / 60)
        const secs = Math.floor(totalSeconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }
}

export default BaseCard
