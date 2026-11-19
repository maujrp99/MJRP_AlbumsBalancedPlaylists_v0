/**
 * Router
 * Client-side router using History API (pushState)
 * Supports clean URLs without hash (#) for OAuth compatibility
 */

import { escapeHtml } from './utils/stringUtils.js'

export class Router {
    constructor() {
        this.routes = new Map()
        this.currentView = null
        this.beforeNavigateHooks = []
        this.afterNavigateHooks = []
        // Address (path + query) of the screen being shown: where the person stays when a hook refuses a move
        this.currentUrl = null
        // Identity of the route change that owns the screen: a newer change leaves the older one behind (F67)
        this.renderRun = 0

        // Listen to browser back/forward
        window.addEventListener('popstate', () => this.handleHistoryMove())

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
        if (!this.canNavigate(path, state)) return // Hook prevented navigation

        history.pushState(state, '', path)
        this.handleRouteChange()
    }

    /**
     * Ask the before hooks whether the screen may be left
     * @private
     */
    canNavigate(path, state = {}) {
        for (const hook of [...this.beforeNavigateHooks]) {
            if (hook(path, state) === false) return false
        }
        return true
    }

    /**
     * Back and forward of the browser: the address has already changed when this runs. The before
     * hooks are asked as in navigate(); when one refuses, the address of the screen the person
     * stays on is put back.
     * @private
     */
    handleHistoryMove() {
        const target = window.location.pathname + window.location.search
        if (this.currentUrl && target !== this.currentUrl && !this.canNavigate(target, history.state || {})) {
            history.pushState({}, '', this.currentUrl)
            return
        }
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
                this.currentUrl = path + window.location.search
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

        // No route matched - redirect to home (once: without a home route there is nowhere to go)
        if (path !== '/home') this.navigate('/home')
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
     * Render a view.
     *
     * Each call has an identity (`renderRun`). Two calls can run at the same time (a route whose
     * factory navigates and returns null, two navigations in the same turn, a slow view that the
     * person leaves): only the newest draws, mounts and shows a failure. The view that is mounted
     * is the one this call created, never "whatever `currentView` is by now".
     * @private
     */
    async renderView(viewFactory, params) {
        const container = document.getElementById('app')
        if (!container) {
            console.error('App container #app not found')
            return
        }

        const run = ++this.renderRun
        const leftBehind = () => run !== this.renderRun

        try {
            // Cleanup current view
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy()
            }
            this.currentView = null

            // Create new view instance
            const view = await viewFactory()
            if (leftBehind()) return
            this.currentView = view
            if (!view) return

            const drawn = await this.drawView(view, container, params, leftBehind)

            // Call view's mount lifecycle
            if (drawn && view.mount) {
                await view.mount(params)
            }
        } catch (error) {
            console.error('[Router] Render failed:', error)
            if (leftBehind()) return
            container.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-red-500 text-xl font-bold mb-2">View Error</div>
                    <pre class="bg-black/30 p-4 rounded text-left text-sm overflow-auto text-red-300 max-w-2xl mx-auto">${escapeHtml(error.message)}\n${escapeHtml(error.stack)}</pre>
                    <button class="btn btn-secondary mt-4" onclick="window.history.back()">Go Back</button>
                </div>
            `
        }
    }

    /**
     * Put what the view renders in the container.
     * @returns {Promise<boolean>} false when a newer route change took the screen meanwhile
     * @private
     */
    async drawView(view, container, params, leftBehind) {
        if (!view.render) return true
        const result = await view.render(params)
        if (leftBehind()) return false

        // SafeDOM Support (DOM Node)
        if (result instanceof Node) {
            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }
            container.appendChild(result)
        }
        // Legacy Support (HTML String)
        else if (typeof result === 'string') {
            container.innerHTML = result
        }
        return true
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
     * @returns {Function} removes the hook
     */
    beforeNavigate(hook) {
        this.beforeNavigateHooks.push(hook)
        return () => {
            this.beforeNavigateHooks = this.beforeNavigateHooks.filter(h => h !== hook)
        }
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
