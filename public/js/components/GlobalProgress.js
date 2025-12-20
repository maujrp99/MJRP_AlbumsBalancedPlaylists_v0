/**
 * GlobalProgress - Top progress bar indicator
 * 
 * Shows/hides a progress bar at the top of the page during loading operations.
 * Similar to YouTube/GitHub loading bars.
 */

class GlobalProgressManager {
    constructor() {
        this.element = null
        this.activeLoaders = 0
        this.init()
    }

    init() {
        // Create the progress bar element if it doesn't exist
        if (!document.getElementById('globalProgress')) {
            const container = document.createElement('div')
            container.id = 'globalProgress'
            // Fixed top bar, super high z-index (9999) to cover everything
            container.className = 'fixed top-0 left-0 w-full h-1.5 z-[9999] pointer-events-none'
            container.style.display = 'none'
            // Inner bar with animation and strong glow
            container.innerHTML = `
                <div class="h-full bg-brand-orange shadow-[0_0_15px_rgba(255,100,0,0.8)] animate-progress-indeterminate w-full origin-left"></div>
            `
            document.body.prepend(container)
        }
        this.element = document.getElementById('globalProgress')
    }

    /**
     * Start showing the progress bar
     * Multiple callers can start - bar stays visible until all finish
     */
    start() {
        this.activeLoaders++
        if (this.element) {
            this.element.style.display = 'block'
        }
        console.log('[GlobalProgress] Started', this.activeLoaders)
    }

    /**
     * Finish a loading operation
     * Hides bar only when all operations complete
     */
    finish() {
        this.activeLoaders = Math.max(0, this.activeLoaders - 1)
        if (this.activeLoaders === 0 && this.element) {
            // Small delay before hiding for visual smoothness
            setTimeout(() => {
                if (this.activeLoaders === 0 && this.element) {
                    this.element.style.display = 'none'
                }
            }, 200)
        }
        console.log('[GlobalProgress] Finished', this.activeLoaders)
    }

    /**
     * Force hide the progress bar
     */
    forceHide() {
        this.activeLoaders = 0
        if (this.element) {
            this.element.style.display = 'none'
        }
    }

    /**
     * Check if currently showing
     */
    isActive() {
        return this.activeLoaders > 0
    }
}

// Singleton instance
export const globalProgress = new GlobalProgressManager()
