/**
 * Router
 * Client-side router using History API (pushState)
 * Supports clean URLs without hash (#) for OAuth compatibility
 */

export class Router {
    constructor() {
        this.routes = new Map()
        this.currentView = null
        this.beforeNavigateHooks = []
        this.afterNavigateHooks = []

        // Listen to browser back/forward
        window.addEventListener('popstate', () => this.handleRouteChange())

        // Intercept link clicks for SPA navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]')
            if (link) {
                e.preventDefault()
                this.navigate(link.getAttribute('href'))
            }
        })
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., '/home', '/albums/:id')
     * @param {Function} viewFactory - Function that returns view instance
     */
    register(path, viewFactory) {
        this.routes.set(path, {
            pattern: this.pathToRegex(path),
            viewFactory,
            params: this.extractParamNames(path)
        })
    }

    /**
     * Navigate to a path
     * @param {string} path - Destination path
     * @param {Object} state - Optional state to pass
     */
    navigate(path, state = {}) {
        // Call before hooks
        for (const hook of this.beforeNavigateHooks) {
            const canNavigate = hook(path, state)
            if (canNavigate === false) return // Hook prevented navigation
        }

        history.pushState(state, '', path)
        this.handleRouteChange()
    }

    /**
     * Handle route change (popstate or manual navigate)
     * @private
     */
    async handleRouteChange() {
        const path = window.location.pathname

        for (const [routePath, route] of this.routes) {
            const match = path.match(route.pattern)
            if (match) {
                const params = this.extractParams(route.params, match)
                const queryParams = this.parseQueryString()

                await this.renderView(route.viewFactory, { ...params, query: queryParams })

                // Call after hooks
                for (const hook of this.afterNavigateHooks) {
                    hook(path, params)
                }
                return
            }
        }

        // No route matched - redirect to home
        this.navigate('/home')
    }

    /**
     * Force load a specific route (useful for re-rendering same view)
     * @param {string} path - Path to load
     */
    async loadRoute(path) {
        console.log('🚦 [Router] loadRoute called:', path)
        console.log('🚦 [Router] Current view:', this.currentView?.constructor?.name)

        // Update history without triggering popstate
        history.replaceState({}, '', path)

        // Manually trigger route handling
        console.log('🚦 [Router] Triggering handleRouteChange...')
        await this.handleRouteChange()
        console.log('🚦 [Router] loadRoute completed')
    }

    /**
     * Render a view
     * @private
     */
    async renderView(viewFactory, params) {
        console.log('🚦 [Router] renderView called')

        // Cleanup current view
        if (this.currentView && this.currentView.destroy) {
            console.log('🚦 [Router] Destroying old view:', this.currentView.constructor.name)
            this.currentView.destroy()
            console.log('🚦 [Router] Old view destroyed')
        }

        // Create new view instance
        console.log('🚦 [Router] Creating new view instance...')
        this.currentView = viewFactory()
        console.log('🚦 [Router] New view created:', this.currentView.constructor.name)

        const container = document.getElementById('app')

        if (!container) {
            console.error('App container #app not found')
            return
        }

        // Render view HTML
        if (this.currentView.render) {
            console.log('🚦 [Router] Rendering view HTML...')
            const html = await this.currentView.render(params)
            container.innerHTML = html
            console.log('🚦 [Router] View HTML rendered')
        }

        // Call view's mount lifecycle
        if (this.currentView.mount) {
            console.log('🚦 [Router] Mounting view...')
            await this.currentView.mount(params)
            console.log('🚦 [Router] View mounted')
        }
    }

    /**
     * Convert path pattern to regex
     * @private
     */
    pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '(?<$1>[^/]+)')
        return new RegExp(`^${pattern}$`)
    }

    /**
     * Extract param names from path pattern
     * @private
     */
    extractParamNames(path) {
        const matches = path.matchAll(/:(\w+)/g)
        return Array.from(matches, m => m[1])
    }

    /**
     * Extract param values from regex match
     * @private
     */
    extractParams(paramNames, match) {
        const params = {}
        paramNames.forEach(name => {
            params[name] = match.groups[name]
        })
        return params
    }

    /**
     * Parse query string from URL
     * @private
     */
    parseQueryString() {
        const params = {}
        const searchParams = new URLSearchParams(window.location.search)
        for (const [key, value] of searchParams) {
            params[key] = value
        }
        return params
    }

    /**
     * Add before navigate hook
     * @param {Function} hook - Hook function (path, state) => boolean
     */
    beforeNavigate(hook) {
        this.beforeNavigateHooks.push(hook)
    }

    /**
     * Add after navigate hook
     * @param {Function} hook - Hook function (path, params) => void
     */
    afterNavigate(hook) {
        this.afterNavigateHooks.push(hook)
    }
}

// Singleton instance
export const router = new Router()
