/**
 * F67 - two route changes at the same time: the newer one owns the screen, and its view is
 * mounted exactly once. Before, a route that redirects (the factory calls navigate and returns
 * null: /callback, /album-series, /series) left the next screen drawn but never mounted: no
 * button answered until the page was loaded again.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Router } from '../public/js/router.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 10))

describe('Router: overlapping route changes (F67)', () => {
    let router
    let app

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        router = new Router()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    const view = (html, extra = {}) => ({ render: vi.fn(() => html), mount: vi.fn(), destroy: vi.fn(), ...extra })

    it('a route that redirects leaves the destination mounted (sync factory)', async () => {
        const home = view('<div>Home</div>')
        router.register('/home', () => home)
        router.register('/old', () => { router.navigate('/home'); return null })

        router.navigate('/old')
        await settle()

        expect(app.textContent).toBe('Home')
        expect(home.mount).toHaveBeenCalledTimes(1)
        expect(router.currentView).toBe(home)
    })

    it('a route that redirects leaves the destination mounted (async factory, as /callback)', async () => {
        const home = view('<div>Home</div>')
        router.register('/home', () => home)
        router.register('/callback', async () => {
            await Promise.resolve()
            router.navigate('/home')
            return null
        })

        router.navigate('/callback')
        await settle()

        expect(home.mount).toHaveBeenCalledTimes(1)
        expect(router.currentView).toBe(home)
    })

    it('two changes in the same turn: only the newer view is drawn and mounted, once', async () => {
        const first = view('<div>First</div>')
        const second = view('<div>Second</div>')
        router.register('/first', () => first)
        router.register('/second', () => second)

        router.navigate('/first')
        router.navigate('/second')
        await settle()

        expect(app.textContent).toBe('Second')
        expect(first.mount).not.toHaveBeenCalled()
        expect(second.mount).toHaveBeenCalledTimes(1)
        expect(router.currentView).toBe(second)
    })

    it('the same screen asked twice in the same turn is mounted once, on the DOM that stays', async () => {
        const made = []
        router.register('/home', () => {
            const home = view(`<div>Home ${made.length + 1}</div>`)
            made.push(home)
            return home
        })

        router.navigate('/home')
        router.handleRouteChange()
        await settle()

        expect(app.textContent).toBe('Home 2')
        expect(made[0].mount).not.toHaveBeenCalled()
        expect(made[1].mount).toHaveBeenCalledTimes(1)
    })

    it('a slow view that was left does not draw over the newer one', async () => {
        let finishRender
        const slow = view(null, { render: vi.fn(() => new Promise(resolve => { finishRender = () => resolve('<div>Slow</div>') })) })
        const fast = view('<div>Fast</div>')
        router.register('/slow', () => slow)
        router.register('/fast', () => fast)

        router.navigate('/slow')
        await settle()
        router.navigate('/fast')
        await settle()
        finishRender()
        await settle()

        expect(app.textContent).toBe('Fast')
        expect(slow.mount).not.toHaveBeenCalled()
        expect(slow.destroy).toHaveBeenCalled()
    })

    it('a view that was left and then fails does not put the error screen over the newer one', async () => {
        let failMount
        const broken = view('<div>Broken</div>', { mount: vi.fn(() => new Promise((_, reject) => { failMount = () => reject(new Error('late')) })) })
        const fast = view('<div>Fast</div>')
        router.register('/broken', () => broken)
        router.register('/fast', () => fast)

        router.navigate('/broken')
        await settle()
        router.navigate('/fast')
        await settle()
        failMount()
        await settle()

        expect(app.textContent).toBe('Fast')
    })

    it('a view that fails while it owns the screen still shows the error screen', async () => {
        router.register('/broken', () => view('<div>x</div>', { mount: vi.fn(() => { throw new Error('boom') }) }))

        router.navigate('/broken')
        await settle()

        expect(app.textContent).toContain('View Error')
        expect(app.textContent).toContain('boom')
    })
})
