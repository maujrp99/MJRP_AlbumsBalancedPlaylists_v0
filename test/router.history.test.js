/**
 * F63 (UAT-201) - the back button goes back.
 *
 * The router owns the history of the browser. A redirect (an old address, the return from Spotify,
 * an address with no screen, the bare "/") takes the place of the entry it leaves, so going back
 * never lands on an address that sends the person forward again. A screen that changes its own
 * address (the scope of the albums screen) does it through the router, which keeps knowing where
 * the person is.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Router } from '../public/js/router.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 10))
const address = () => window.location.pathname + window.location.search

describe('Router: history (F63)', () => {
    let router
    let app
    let pushed
    let replaced

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.replaceState({}, '', '/start')
        router = new Router()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        pushed = vi.spyOn(window.history, 'pushState')
        replaced = vi.spyOn(window.history, 'replaceState')
    })

    afterEach(() => {
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    const view = (html) => ({ render: vi.fn(() => html), mount: vi.fn(), destroy: vi.fn() })

    describe('redirect', () => {
        it('takes the place of the entry it leaves and shows the destination', async () => {
            const home = view('<div>Home</div>')
            router.register('/home', () => home)

            router.redirect('/home')
            await settle()

            expect(address()).toBe('/home')
            expect(pushed).not.toHaveBeenCalled()
            expect(replaced).toHaveBeenCalledTimes(1)
            expect(home.mount).toHaveBeenCalledTimes(1)
        })

        it('a route that redirects (as /callback) adds one entry, not two', async () => {
            const home = view('<div>Home</div>')
            router.register('/home', () => home)
            router.register('/callback', async () => {
                await Promise.resolve()
                router.redirect('/home')
                return null
            })

            router.navigate('/callback')
            await settle()

            expect(address()).toBe('/home')
            expect(pushed).toHaveBeenCalledTimes(1) // the navigate to /callback; the redirect replaced it
            expect(home.mount).toHaveBeenCalledTimes(1)
            expect(router.currentUrl).toBe('/home')
        })

        it('an address with no screen is replaced by the Home, not stacked under it', async () => {
            const home = view('<div>Home</div>')
            router.register('/home', () => home)
            window.history.replaceState({}, '', '/nowhere')
            replaced.mockClear()

            await router.handleRouteChange()
            await settle()

            expect(address()).toBe('/home')
            expect(pushed).not.toHaveBeenCalled()
            expect(home.mount).toHaveBeenCalledTimes(1)
        })

        it('asks the before hooks, as navigate does', async () => {
            const home = view('<div>Home</div>')
            router.register('/home', () => home)
            router.beforeNavigate(() => false)

            router.redirect('/home')
            await settle()

            expect(address()).toBe('/start')
            expect(home.render).not.toHaveBeenCalled()
        })
    })

    describe('setAddress', () => {
        it('adds an entry without drawing the screen again, and the router knows the new address', async () => {
            const albums = view('<div>Albums</div>')
            router.register('/albums', () => albums)
            router.navigate('/albums')
            await settle()
            pushed.mockClear()

            router.setAddress('/albums?seriesId=s1')

            expect(address()).toBe('/albums?seriesId=s1')
            expect(pushed).toHaveBeenCalledTimes(1)
            expect(router.currentUrl).toBe('/albums?seriesId=s1')
            expect(albums.render).toHaveBeenCalledTimes(1)
        })

        it('replace: true rewrites the entry (the same place, written the canonical way)', () => {
            window.history.replaceState({}, '', '/albums/s1')
            replaced.mockClear()

            router.setAddress('/albums?seriesId=s1', { replace: true })

            expect(address()).toBe('/albums?seriesId=s1')
            expect(pushed).not.toHaveBeenCalled()
            expect(replaced).toHaveBeenCalledTimes(1)
            expect(router.currentUrl).toBe('/albums?seriesId=s1')
        })

        it('the address already shown adds nothing', () => {
            window.history.replaceState({}, '', '/albums?seriesId=s1')
            replaced.mockClear()

            router.setAddress('/albums?seriesId=s1')

            expect(pushed).not.toHaveBeenCalled()
            expect(replaced).not.toHaveBeenCalled()
            expect(router.currentUrl).toBe('/albums?seriesId=s1')
        })
    })
})
