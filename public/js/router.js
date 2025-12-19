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
                const targetHref = link.getAttribute('href')
                const currentPath = window.location.pathname + window.location.search

                // FIX: Avoid duplicate navigation to the same path
                // Also prevents phantom clicks during TopNav re-render
                if (targetHref === currentPath) {
                    console.log('[Router] Ignoring duplicate navigation to:', targetHref)
                    e.preventDefault()
                    return
                }

                // FIX: Don't navigate to /albums if we're already on /albums with a seriesId
                // and the click is coming from a navigation link (not user intent)
                const currentHasSeriesId = window.location.search.includes('seriesId=')
                const targetIsPlainAlbums = targetHref === '/albums'
                if (currentHasSeriesId && targetIsPlainAlbums && window.location.pathname === '/albums') {
                    // Check if this is likely a phantom click (no user interaction flag)
                    if (!e.isTrusted || e.detail === 0) {
                        console.log('[Router] Blocking phantom click to /albums while on series view')
                        e.preventDefault()
                        return
                    }
                }

                e.preventDefault()
                this.navigate(targetHref)
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
        console.log('[Router] navigate called:', path, 'from:', new Error().stack?.split('\n')[2])
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
        // Update history without triggering popstate
        history.replaceState({}, '', path)

        // Manually trigger route handling
        await this.handleRouteChange()
    }

    /**
     * Render a view
     * @private
     */
    async renderView(viewFactory, params) {
        // Cleanup current view
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy()
        }

        // Create new view instance
        this.currentView = await viewFactory()
        const container = document.getElementById('app')

        if (!container) {
            console.error('App container #app not found')
            return
        }

        // Render view HTML
        if (this.currentView && this.currentView.render) {
            const html = await this.currentView.render(params)
            container.innerHTML = html
        }

        // Call view's mount lifecycle
        if (this.currentView && this.currentView.mount) {
            await this.currentView.mount(params)
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
