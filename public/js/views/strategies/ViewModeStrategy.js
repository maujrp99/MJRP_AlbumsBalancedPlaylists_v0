/**
 * ViewMode Strategy Pattern
 * 
 * Modularizes view mode logic (compact vs expanded) for AlbumsView.
 * Each strategy handles its own rendering logic and UI labels.
 */

/**
 * Base Strategy Interface
 * @abstract
 */
export class ViewModeStrategy {
    constructor(view) {
        this.view = view
    }

    /**
     * Get the container ID to render into
     * @returns {string}
     */
    getContainerId() {
        return 'albumsContainer'
    }

    /**
     * Render albums using this strategy's layout
     * @param {Array} albums - Filtered albums to render
     * @param {Array} series - All series for grouping
     * @returns {string} HTML content
     */
    render(albums, series) {
        throw new Error('ViewModeStrategy.render() must be implemented')
    }

    /**
     * Get the toggle button label
     * @returns {string}
     */
    getButtonLabel() {
        throw new Error('ViewModeStrategy.getButtonLabel() must be implemented')
    }

    /**
     * Get the toggle button icon name
     * @returns {string}
     */
    getButtonIcon() {
        throw new Error('ViewModeStrategy.getButtonIcon() must be implemented')
    }

    /**
     * Get the mode key for localStorage
     * @returns {string}
     */
    getModeKey() {
        throw new Error('ViewModeStrategy.getModeKey() must be implemented')
    }

    /**
     * Get CSS class for the toggle button
     * @returns {string}
     */
    getButtonClass() {
        return 'btn btn-secondary'
    }
}

/**
 * Compact Grid View Strategy
 * Displays albums in a responsive grid layout
 */
export class CompactViewStrategy extends ViewModeStrategy {
    getModeKey() {
        return 'compact'
    }

    render(albums, series) {
        return this.view.renderScopedGrid(albums, series)
    }

    getButtonLabel() {
        return 'View Compact'
    }

    getButtonIcon() {
        return 'Grid'
    }

    getButtonClass() {
        return 'btn btn-primary'
    }
}

/**
 * Expanded List View Strategy
 * Displays albums in detailed list format with dual tracklists
 */
export class ExpandedViewStrategy extends ViewModeStrategy {
    getModeKey() {
        return 'expanded'
    }

    render(albums, series) {
        return this.view.renderScopedList(albums, series)
    }

    getButtonLabel() {
        return 'View Expanded'
    }

    getButtonIcon() {
        return 'List'
    }

    getButtonClass() {
        return 'btn btn-secondary'
    }
}

/**
 * Factory function to create the appropriate strategy
 * @param {string} modeKey - 'compact' or 'expanded'
 * @param {Object} view - The AlbumsView instance
 * @returns {ViewModeStrategy}
 */
export function createViewModeStrategy(modeKey, view) {
    switch (modeKey) {
        case 'expanded':
            return new ExpandedViewStrategy(view)
        case 'compact':
        default:
            return new CompactViewStrategy(view)
    }
}
