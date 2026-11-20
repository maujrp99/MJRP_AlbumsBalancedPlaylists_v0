/**
 * F64 (UAT-207) - the router, when the file of a screen is gone because a newer version was
 * published: it loads the new version once instead of showing "View Error".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Router } from '../public/js/router.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 10))
const gone = () => new TypeError('Failed to fetch dynamically imported module: https://x/assets/SavedPlaylistsView-old.js')

describe('Router: a screen file of an older publication (F64, UAT-207)', () => {
    let router, app, reloadForNewBuild

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        reloadForNewBuild = vi.fn(() => true)
        router = new Router({ reloadForNewBuild })
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('asks for the new version and says so, with no "View Error"', async () => {
        router.register('/saved', async () => { throw gone() })
        router.navigate('/saved')
        await settle()

        expect(reloadForNewBuild).toHaveBeenCalledTimes(1)
        expect(app.textContent).toContain('A new version of the app was published')
        expect(app.textContent).not.toContain('View Error')
    })

    it('when the reload was already tried, shows the failure with a way to load again', async () => {
        reloadForNewBuild.mockReturnValue(false)
        router.register('/saved', async () => { throw gone() })
        router.navigate('/saved')
        await settle()

        expect(app.textContent).toContain('could not be loaded')
        expect(app.querySelector('[data-action="reload-app"]')).not.toBeNull()
    })

    it('another failure is still shown as it is, and nothing is reloaded', async () => {
        router.register('/broken', async () => { throw new Error('albums is not iterable') })
        router.navigate('/broken')
        await settle()

        expect(reloadForNewBuild).not.toHaveBeenCalled()
        expect(app.textContent).toContain('View Error')
        expect(app.textContent).toContain('albums is not iterable')
    })
})
