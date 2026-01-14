/**
 * VirtualScrollObserver.js
 * 
 * A reusable wrapper around IntersectionObserver for implementing
 * infinite scroll and lazy loading patterns.
 */
export class VirtualScrollObserver {
    /**
     * @param {Object} options 
     * @param {string} options.rootMargin - Margin around the root (default: '0px 0px 200px 0px')
     * @param {number|Array} options.threshold - Visibility threshold (default: 0.1)
     */
    constructor({ rootMargin = '0px 0px 200px 0px', threshold = 0.1 } = {}) {
        this.options = { rootMargin, threshold };
        this.observer = null;
        this.callbacks = new Map(); // Element -> Callback
    }

    /**
     * Start observing an element.
     * @param {HTMLElement} element - The DOM element to watch
     * @param {Function} callback - Function to call when element enters viewport
     * @param {boolean} once - If true, disconnects after first trigger (default: true)
     */
    observe(element, callback, once = true) {
        if (!element || !callback) return;

        // Lazy initialization of the real observer
        if (!this.observer) {
            this._initObserver();
        }

        // Store callback logic
        this.callbacks.set(element, { callback, once });
        this.observer.observe(element);
    }

    /**
     * Stop observing an element manually.
     * @param {HTMLElement} element 
     */
    unobserve(element) {
        if (this.observer && element) {
            this.observer.unobserve(element);
            this.callbacks.delete(element);
        }
    }

    /**
     * Disconnect the observer entirely.
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.callbacks.clear();
        }
    }

    /**
     * Internal: Create the IntersectionObserver instance
     */
    _initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const data = this.callbacks.get(entry.target);
                    if (data) {
                        // Trigger callback
                        data.callback(entry);

                        // Cleanup if 'once' is true
                        if (data.once) {
                            this.unobserve(entry.target);
                        }
                    }
                }
            });
        }, this.options);
    }
}
