/**
 * BaseView
 * Abstract base class for all view components
 * Provides lifecycle methods and common utilities
 */

export class BaseView {
    constructor() {
        this.container = null
        this.state = {}
        this.subscriptions = []
    }

    /**
     * Render view HTML
     * @param {Object} params - Route params and query params
     * @returns {string} HTML string
     */
    async render(params) {
        throw new Error('render() must be implemented by subclass')
    }

    /**
     * Mount view (setup event listeners, subscribe to stores)
     * Called after render() completes
     * @param {Object} params - Route params and query params
     */
    async mount(params) {
        // Override in subclass if needed
    }

    /**
     * Destroy view (cleanup listeners, unsubscribe)
     * Called before navigating to new view
     */
    destroy() {
        // Unsubscribe from all stores
        this.subscriptions.forEach(unsubscribe => unsubscribe())
        this.subscriptions = []
    }

    /**
     * Update view state and trigger re-render
     * @param {Object} newState - State updates
     */
    setState(newState) {
        this.state = { ...this.state, ...newState }
        this.update()
    }

    /**
     * Update view (re-render changed parts)
     * Override in subclass for efficient partial updates
     */
    update() {
        // Default: no-op
        // Subclasses can implement selective DOM updates
    }

    /**
     * Get DOM element by selector within view
     * @param {string} selector - CSS selector
     * @returns {Element|null}
     */
    $(selector) {
        if (!this.container) {
            this.container = document.getElementById('app')
        }
        return this.container ? this.container.querySelector(selector) : null
    }

    /**
     * Get all DOM elements by selector within view
     * @param {string} selector - CSS selector
     * @returns {NodeList}
     */
    $$(selector) {
        if (!this.container) {
            this.container = document.getElementById('app')
        }
        return this.container ? this.container.querySelectorAll(selector) : []
    }

    /**
     * Add event listener with automatic cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(element, event, handler) {
        if (!element) return
        element.addEventListener(event, handler)

        // Store cleanup function
        const cleanup = () => element.removeEventListener(event, handler)
        this.subscriptions.push(cleanup)
    }

    /**
     * Format timestamp for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted string
     */
    formatTimestamp(date) {
        if (!date) return 'Unknown'
        const dateObj = date instanceof Date ? date : new Date(date)
        const now = new Date()
        const diff = now - dateObj
        const hours = Math.floor(diff / (1000 * 60 * 60))

        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        if (hours < 48) return 'Yesterday'
        return dateObj.toLocaleDateString()
    }
}
