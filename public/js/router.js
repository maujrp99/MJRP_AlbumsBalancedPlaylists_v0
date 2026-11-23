/**
 * Router
 * Client-side router using History API (pushState)
 * Supports clean URLs without hash (#) for OAuth compatibility
 */

import { errorPanelModel, errorPanelHtml } from './utils/failurePanel.js'
import { isMissingBuildFile, isLoadTimeout, reloadOnceForNewBuild, publicationState, PUBLICATION } from './utils/staleBuild.js'
import { globalProgress } from './stores/progress.js'
import { t } from './i18n/t.js'
import { escapeHtml } from './utils/stringUtils.js'

export class Router {
    /**
     * @param {Object} [options]
     * @param {Function} [options.reloadForNewBuild] - () => boolean: loads the app again when the tab
     *        runs a version that is no longer published; false when that was just tried (F64)
     * @param {Function} [options.checkPublication] - () => Promise<'newer'|'same'|'unreachable'>: whether the site was
     *        published again since this tab loaded; a lost network is not a new version (F83, REQ-10)
     * @param {{ start: Function, finish: Function }} [options.progress] - the progress bar shown while a screen file comes
     * @param {number} [options.progressDelayMs] - how long a screen may take before the bar shows (no blink on a fast move)
     */
    constructor({
        reloadForNewBuild = reloadOnceForNewBuild,
        checkPublication = publicationState,
        progress = globalProgress,
        progressDelayMs = 150
    } = {}) {
        this.reloadForNewBuild = reloadForNewBuild
        this.checkPublication = checkPublication
        this.progress = progress
        this.progressDelayMs = progressDelayMs
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
            // A link marked data-full-page (the logo: out of the app, to /home, the entry page) is the browser's
            if (link && !link.hasAttribute('data-full-page')) {
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
     * @param {string} path - Route path (e.g., '/start', '/albums/:id')
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
     * Go to a path IN PLACE of the address being left (F63): an old address, the return from
     * Spotify, an address with no screen. The entry is replaced, so the back button never lands on
     * an address that sends the person forward again.
     * @param {string} path - Destination path
     * @param {Object} state - Optional state to pass
     */
    redirect(path, state = {}) {
        if (!this.canNavigate(path, state)) return

        history.replaceState(state, '', path)
        this.handleRouteChange()
    }

    /**
     * The screen being shown changes its own address (a scope, a filter) and is not drawn again.
     * The history of the browser is written here and nowhere else, so the router always knows
     * where the person is (the address a refused back/forward is put back to).
     * @param {string} path - path + query of the same screen
     * @param {{ replace?: boolean }} [options] - replace: the same place written another way, no new entry
     */
    setAddress(path, { replace = false } = {}) {
        if (window.location.pathname + window.location.search !== path) {
            if (replace) history.replaceState({}, '', path)
            else history.pushState({}, '', path)
        }
        this.currentUrl = path
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

                // Call after hooks: the address, its params, and the route it matched ('/albums/:seriesId')
                for (const hook of this.afterNavigateHooks) {
                    hook(path, params, routePath)
                }
                return
            }
        }

        // No route matched - redirect to home (once: without a home route there is nowhere to go)
        if (path !== '/start') this.redirect('/start')
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

            // Create new view instance (the file of a screen may take a while to come: the progress bar says so)
            const view = await this.withProgress(viewFactory)
            if (leftBehind()) return
            this.currentView = view
            if (!view) return

            const drawn = await this.drawView(view, container, params, leftBehind)

            // Call view's mount lifecycle
            if (drawn && view.mount) {
                await view.mount(params)
            }
        } catch (error) {
            await this.showFailure(container, error, leftBehind)
        }
    }

    /**
     * Put the panel of a failure in the container, unless a newer route change took the screen meanwhile.
     * @private
     */
    async showFailure(container, error, leftBehind) {
        console.error('[Router] Render failed:', error)
        if (leftBehind()) return
        const panel = await this._failurePanel(error)
        if (leftBehind()) return
        container.innerHTML = panel
        this.wireRetry(container)
    }

    /**
     * Runs the factory of a route and shows the progress bar if it takes longer than `progressDelayMs`; the bar is
     * taken away when the factory ends, well or not. A factory that answers at once never shows it.
     * @private
     */
    async withProgress(viewFactory) {
        let shown = false
        const timer = setTimeout(() => { shown = true; this.progress.start() }, this.progressDelayMs)
        try {
            return await viewFactory()
        } finally {
            clearTimeout(timer)
            if (shown) this.progress.finish()
        }
    }

    /** «Try again» of the «no connection» panel asks for the same screen again; the app is not loaded again. @private */
    wireRetry(container) {
        container.querySelector('[data-action="retry-screen"]')?.addEventListener('click', () => this.handleRouteChange())
    }

    /**
     * What the screen shows when a view could not be drawn. A file of an older publication is not
     * a failure of the view: the app is loaded again, once, to get the published version (F64).
     * @private
     */
    async _failurePanel(error) {
        if (isLoadTimeout(error)) return this._noConnectionPanel()
        if (!isMissingBuildFile(error)) return errorPanelHtml(errorPanelModel(error)) // the same panel the React bridge draws (F83)
        // The file is gone, or the network is: only asking the site tells which (a lost network is not a new version, F83)
        if (await this.checkPublication() === PUBLICATION.UNREACHABLE) return this._noConnectionPanel()
        if (this.reloadForNewBuild()) {
            return `<div class="p-8 text-center text-white/70" role="status">${escapeHtml(t('notices.router.newVersion'))}</div>`
        }
        return `
            <div class="p-8 text-center" role="alert">
                <div class="text-white text-xl font-bold mb-2">${escapeHtml(t('notices.router.staleTitle'))}</div>
                <p class="text-white/60 mb-4">${escapeHtml(t('notices.router.staleBody'))}</p>
                <button class="btn btn-primary" data-action="reload-app" onclick="window.location.reload()">${escapeHtml(t('notices.router.staleButton'))}</button>
            </div>
        `
    }

    /**
     * The screen could not be downloaded and the site does not answer: nothing was published, the person is offline.
     * @private
     */
    _noConnectionPanel() {
        return `
            <div class="p-8 text-center" role="alert">
                <div class="text-white text-xl font-bold mb-2">${escapeHtml(t('notices.router.offlineTitle'))}</div>
                <p class="text-white/60 mb-4">${escapeHtml(t('notices.router.offlineBody'))}</p>
                <button class="btn btn-primary" data-action="retry-screen">${escapeHtml(t('notices.router.retry'))}</button>
            </div>
        `
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
     * @param {Function} hook - Hook function (path, params, route) => void; `route` is the
     *        pattern that matched, as registered ('/albums/:seriesId'): a name with no ids (F77)
     * @returns {Function} removes the hook (F83: whoever listens for a screen lets go when the screen is left)
     */
    afterNavigate(hook) {
        this.afterNavigateHooks.push(hook)
        return () => {
            this.afterNavigateHooks = this.afterNavigateHooks.filter(h => h !== hook)
        }
    }
}

// Singleton instance
export const router = new Router()
