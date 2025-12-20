/**
 * InlineProgress.js
 * Renders a percentage-based progress bar inside a container.
 * Used for long-running operations like loading albums.
 */

export class InlineProgress {
    constructor(container) {
        this.container = container
        this.element = null
        this.isVisible = false
    }

    /**
     * Mount request logic
     * @param {HTMLElement} parent - The DOM element to append to (optional, defaults to constructor container)
     */
    mount(parent = this.container) {
        if (!parent) return

        this.element = document.createElement('div')
        this.element.className = 'w-full glass-panel p-4 mb-6 fade-in hidden'
        this.element.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-mono text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]" data-label>Initializing...</span>
                <span class="text-xs text-white/50" data-percent>0%</span>
            </div>
            <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div class="h-full bg-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.5)] transition-all duration-300 ease-out" style="width: 0%" data-bar></div>
            </div>
        `
        parent.appendChild(this.element)
    }

    /**
     * Show and reset
     */
    start() {
        if (!this.element) this.mount()
        this.element.classList.remove('hidden')
        this.isVisible = true
        this.update(0, 100, 'Starting...')
    }

    /**
     * Update progress
     * @param {number} current 
     * @param {number} total 
     * @param {string} label 
     */
    update(current, total, label = '') {
        if (!this.element) return

        const percent = Math.min(100, Math.round((current / total) * 100))

        const labelEl = this.element.querySelector('[data-label]')
        const percentEl = this.element.querySelector('[data-percent]')
        const barEl = this.element.querySelector('[data-bar]')

        if (labelEl) labelEl.textContent = label
        if (percentEl) percentEl.textContent = `${percent}%`
        if (barEl) barEl.style.width = `${percent}%`
    }

    /**
     * Hide progress bar
     */
    finish() {
        if (this.element) {
            // Fill to 100% first
            const barEl = this.element.querySelector('[data-bar]')
            if (barEl) barEl.style.width = '100%'

            setTimeout(() => {
                this.element.classList.add('hidden')
                this.isVisible = false
            }, 500)
        }
    }
}
