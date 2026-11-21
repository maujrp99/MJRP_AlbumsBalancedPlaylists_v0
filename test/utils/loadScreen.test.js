/**
 * F83 (REQ-10): «Try again» after a lost network loads the screen WITHOUT loading the app again.
 *
 * A browser remembers, for the life of the page, that an import() failed: the file and the files it imports statically (a
 * React screen imports React) are cached as failed by exact URL, so asking again fails the same way with the network back, even
 * with a query on the URL (the dependency stays failed). The mock of an importer that simply succeeds the second time hid
 * this. `makeBrowser` below behaves like the browser. loadScreen asks the network first, so the failure is never made.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadScreen, networkAnswers } from '../../public/js/utils/loadScreen.js'
import { Router } from '../../public/js/router.js'
import { PUBLICATION, isLoadTimeout, isMissingBuildFile } from '../../public/js/utils/staleBuild.js'

const FILE = 'https://site.test/assets/index-AbCd1234.js'
const DEPENDENCY = 'https://site.test/assets/react-vendor-XyZ.js' // the file imports it statically; every later screen will too

/** An import() as the browser does it: a failure is remembered by exact URL, for the file and for what it imports. */
function makeBrowser() {
    const moduleMap = new Map() // url -> 'ok' | 'failed'
    const state = { online: true, asked: [] }
    const browserImport = async (url) => {
        state.asked.push(url)
        const gone = () => new TypeError(`Failed to fetch dynamically imported module: ${url}`)
        if (moduleMap.get(url) === 'failed') throw gone()
        if (!state.online) {
            moduleMap.set(url, 'failed')
            moduleMap.set(DEPENDENCY, 'failed') // the dependency is asked for together with the file, and fails with it
            throw gone()
        }
        if (moduleMap.get(DEPENDENCY) === 'failed') { moduleMap.set(url, 'failed'); throw gone() }
        moduleMap.set(url, 'ok')
        return { screen: 'the screen' }
    }
    return { state, browserImport }
}

describe('the premise: the browser keeps the failure, of the file and of its dependency', () => {
    it('after a failed import the same URL fails online, and so does the same file with a query (its dependency stays failed)', async () => {
        const { state, browserImport } = makeBrowser()
        state.online = false
        await expect(browserImport(FILE)).rejects.toThrow(/Failed to fetch/)
        state.online = true
        await expect(browserImport(FILE)).rejects.toThrow(/Failed to fetch/)
        await expect(browserImport(`${FILE}?retry=1`)).rejects.toThrow(/Failed to fetch/)
    })
})

describe('loadScreen: the network is asked first, so the failure is never made', () => {
    it('online: the import the route wrote, once, untouched', async () => {
        const { state, browserImport } = makeBrowser()
        const load = loadScreen(() => browserImport(FILE), { reachable: async () => state.online })
        expect(await load()).toEqual({ screen: 'the screen' })
        expect(state.asked).toEqual([FILE])
    })

    it('offline: nothing is imported and the answer is «no connection» (not a failure of the file)', async () => {
        const { state, browserImport } = makeBrowser()
        const load = loadScreen(() => browserImport(FILE), { reachable: async () => state.online })
        state.online = false
        const error = await load().catch(e => e)
        expect(isLoadTimeout(error)).toBe(true) // the router shows «No connection»
        expect(isMissingBuildFile(error)).toBe(false) // and does not take it for a new version
        expect(state.asked).toEqual([])
    })

    it('back online, asking again imports the very file the build made, with its dependency: it comes', async () => {
        const { state, browserImport } = makeBrowser()
        const load = loadScreen(() => browserImport(FILE), { reachable: async () => state.online })
        state.online = false
        await expect(load()).rejects.toThrow()
        await expect(load()).rejects.toThrow() // and again, still offline
        state.online = true

        expect(await load()).toEqual({ screen: 'the screen' })
        expect(state.asked).toEqual([FILE]) // no query, one file: one React
    })

    it('the file that came is kept: a later visit does not ask the network or the browser again', async () => {
        const { state, browserImport } = makeBrowser()
        const reachable = vi.fn(async () => state.online)
        const load = loadScreen(() => browserImport(FILE), { reachable })
        await load()
        await load()
        expect(reachable).toHaveBeenCalledTimes(1)
        expect(state.asked).toEqual([FILE])
    })

    it('the network drops between the question and the import: the failure is the one the browser remembers, and says so (the repair of F64 is the way out)', async () => {
        const { state, browserImport } = makeBrowser()
        const load = loadScreen(() => browserImport(FILE), { reachable: async () => true })
        state.online = false
        const first = await load().catch(e => e)
        expect(isMissingBuildFile(first)).toBe(true)
        state.online = true
        await expect(load()).rejects.toThrow(/Failed to fetch/)
    })

    it('a file that does not come in time ends as a timeout of the load', async () => {
        const load = loadScreen(() => new Promise(() => {}), { reachable: async () => true, deadlineMs: 5 })
        expect(isLoadTimeout(await load().catch(e => e))).toBe(true)
    })
})

describe('networkAnswers', () => {
    it('yes for any answer of the site, even an error page; no when the request fails or does not answer in time', async () => {
        expect(await networkAnswers({ fetchPage: async () => ({ ok: false, status: 404 }) })).toBe(true)
        expect(await networkAnswers({ fetchPage: async () => ({ ok: true }) })).toBe(true)
        expect(await networkAnswers({ fetchPage: async () => { throw new TypeError('Failed to fetch') } })).toBe(false)
        expect(await networkAnswers({ fetchPage: () => new Promise(() => {}), timeoutMs: 5 })).toBe(false)
    })

    it('asks for the app page, with a HEAD and no cache', async () => {
        const fetchPage = vi.fn(async () => ({ ok: true }))
        await networkAnswers({ fetchPage })
        expect(fetchPage).toHaveBeenCalledWith('/app.html', { method: 'HEAD', cache: 'no-store' })
    })
})

describe('«Try again» of the router, with a browser that remembers the failure', () => {
    let app, router, state, browserImport, reloadForNewBuild

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        ;({ state, browserImport } = makeBrowser())
        const load = loadScreen(() => browserImport(FILE), { reachable: async () => state.online })
        reloadForNewBuild = vi.fn(() => true)
        router = new Router({ reloadForNewBuild, checkPublication: async () => PUBLICATION.SAME, progress: { start() {}, finish() {} } })
        router.register('/artists', async () => {
            await load()
            return { render: () => '<h1 id="screen">Artist Series</h1>' }
        })
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => { app.remove(); vi.restoreAllMocks() })
    const settle = () => new Promise(resolve => setTimeout(resolve, 20))

    it('offline: «No connection»; back online: «Try again» draws the screen and the app is not loaded again', async () => {
        state.online = false
        router.navigate('/artists')
        await settle()
        expect(app.textContent).toContain('No connection')
        expect(app.textContent).not.toContain('new version')

        state.online = true
        app.querySelector('[data-action="retry-screen"]').click()
        await settle()

        expect(app.querySelector('#screen').textContent).toBe('Artist Series')
        expect(reloadForNewBuild).not.toHaveBeenCalled()
    })
})
