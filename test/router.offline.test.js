/**
 * F83 TASK-05 (REQ-10, risk R19): the router tells «no network» from «a new version» when a screen file cannot be had, and
 * shows the progress bar while a slow one comes. Three outcomes: it arrived; it is gone because of a publication (the repair
 * of F64: load the app again, once); the network did not answer (the state «no network», with «Try again», and no reload).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Router } from '../public/js/router.js'
import { PUBLICATION, ScreenLoadTimeout } from '../public/js/utils/staleBuild.js'

const settle = (ms = 10) => new Promise(resolve => setTimeout(resolve, ms))
const gone = () => new TypeError('Failed to fetch dynamically imported module: https://x/assets/Saved-old.js')

describe('Router: a screen file that cannot be had (F83)', () => {
    let app, reloadForNewBuild, checkPublication, progress, router

    const build = (extra = {}) => new Router({ reloadForNewBuild, checkPublication, progress, progressDelayMs: 5, ...extra })

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        reloadForNewBuild = vi.fn(() => true)
        checkPublication = vi.fn(async () => PUBLICATION.NEWER)
        progress = { start: vi.fn(), finish: vi.fn() }
        router = build()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('a publication: the file is gone and the site is newer, so the app is loaded again once', async () => {
        router.register('/saved', async () => { throw gone() })
        router.navigate('/saved')
        await settle()

        expect(checkPublication).toHaveBeenCalledTimes(1)
        expect(reloadForNewBuild).toHaveBeenCalledTimes(1)
        expect(app.textContent).toContain('A new version of the app was published')
    })

    it('no network: the file is gone and the site cannot be asked, so it says «no network» and does not reload', async () => {
        checkPublication.mockResolvedValue(PUBLICATION.UNREACHABLE)
        router.register('/saved', async () => { throw gone() })
        router.navigate('/saved')
        await settle()

        expect(reloadForNewBuild).not.toHaveBeenCalled()
        expect(app.textContent).toContain('No connection')
        expect(app.textContent).not.toContain('View Error')
        expect(app.textContent).not.toContain('A new version')
        expect(app.querySelector('[data-action="retry-screen"]')).not.toBeNull()
        expect(app.querySelector('[role="alert"]')).not.toBeNull()
    })

    it('a file that does not come in 10 s is «no network» too, with no question to the site', async () => {
        router.register('/saved', async () => { throw new ScreenLoadTimeout(10000) })
        router.navigate('/saved')
        await settle()

        expect(checkPublication).not.toHaveBeenCalled()
        expect(reloadForNewBuild).not.toHaveBeenCalled()
        expect(app.textContent).toContain('No connection')
    })

    it('«Try again» asks for the screen again, without loading the app again; it comes when the network is back', async () => {
        checkPublication.mockResolvedValue(PUBLICATION.UNREACHABLE)
        let online = false
        router.register('/saved', async () => {
            if (!online) throw gone()
            return { render: () => '<p id="saved">saved playlists</p>' }
        })
        router.navigate('/saved')
        await settle()
        expect(app.textContent).toContain('No connection')

        online = true
        app.querySelector('[data-action="retry-screen"]').click()
        await settle()

        expect(app.querySelector('#saved').textContent).toBe('saved playlists')
        expect(reloadForNewBuild).not.toHaveBeenCalled()
        expect(app.textContent).not.toContain('No connection')
    })

    it('the site is the same and the file is still missing: the failure of F64 as it was (load again, once)', async () => {
        checkPublication.mockResolvedValue(PUBLICATION.SAME)
        router.register('/saved', async () => { throw gone() })
        router.navigate('/saved')
        await settle()

        expect(reloadForNewBuild).toHaveBeenCalledTimes(1)
    })

    it('another failure is not asked about the network at all', async () => {
        router.register('/broken', async () => { throw new Error('albums is not iterable') })
        router.navigate('/broken')
        await settle()

        expect(checkPublication).not.toHaveBeenCalled()
        expect(app.textContent).toContain('View Error')
    })

    it('a screen that is slow to come shows the progress bar and takes it away when it is there', async () => {
        router.register('/slow', async () => {
            await settle(30)
            return { render: () => '<p id="slow">here</p>' }
        })
        router.navigate('/slow')
        await settle(15)
        expect(progress.start).toHaveBeenCalledTimes(1)
        expect(progress.finish).not.toHaveBeenCalled()

        await settle(40)
        expect(progress.finish).toHaveBeenCalledTimes(1)
        expect(app.querySelector('#slow')).not.toBeNull()
    })

    it('a screen that comes at once never shows the bar (no blink on every move)', async () => {
        router.register('/fast', () => ({ render: () => '<p>fast</p>' }))
        router.navigate('/fast')
        await settle(20)

        expect(progress.start).not.toHaveBeenCalled()
        expect(progress.finish).not.toHaveBeenCalled()
    })

    it('a screen that fails slowly takes the bar away too', async () => {
        router.register('/slowfail', async () => {
            await settle(30)
            throw new Error('x')
        })
        router.navigate('/slowfail')
        await settle(60)

        expect(progress.start).toHaveBeenCalledTimes(1)
        expect(progress.finish).toHaveBeenCalledTimes(1)
    })
})
