/**
 * F83 TASK-04: `afterNavigate` gives back how to stop listening (a screen that listened to the router must be able to
 * let go when it is left), like `beforeNavigate` already did.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Router } from '../public/js/router.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 10))

describe('Router.afterNavigate', () => {
    let router, app

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        router = new Router({ reloadForNewBuild: () => false })
        router.register('/a', () => ({ render: () => '<p>a</p>' }))
        router.register('/b', () => ({ render: () => '<p>b</p>' }))
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('is called after each navigation with the path, the params and the route', async () => {
        const hook = vi.fn()
        router.afterNavigate(hook)
        router.navigate('/a')
        await settle()

        expect(hook).toHaveBeenCalledWith('/a', {}, '/a')
    })

    it('gives back a function that stops the hook', async () => {
        const hook = vi.fn()
        const stop = router.afterNavigate(hook)
        router.navigate('/a')
        await settle()
        stop()
        router.navigate('/b')
        await settle()

        expect(hook).toHaveBeenCalledTimes(1)
        expect(router.afterNavigateHooks).toHaveLength(0)
    })
})
