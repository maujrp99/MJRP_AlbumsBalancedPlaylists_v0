/**
 * F77: where the measurement is put together when the app starts. The switch picks the adapter
 * (none, the debug one, PostHog); the screen of each route and the click on a buy link are
 * measured here, in one place each.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { startUsageMeasurement, screenOfRoute, buyLinkClickOf } from '../../../public/js/services/usage/usageWiring.js'
import { stopUsage, track, usageState } from '../../../public/js/services/usage/track.js'

const storageWith = (flag) => ({ getItem: (key) => (key === 'mjrp.usage' ? flag : null) })

const fakeRouter = () => {
    const hooks = []
    return { hooks, afterNavigate: (hook) => hooks.push(hook), go: (path, route) => hooks.forEach(hook => hook(path, {}, route)) }
}

beforeEach(() => {
    stopUsage()
    document.body.innerHTML = ''
    delete window.__usageEvents
    vi.spyOn(console, 'info').mockImplementation(() => { })
    vi.spyOn(console, 'warn').mockImplementation(() => { })
})

describe('the switch picks the adapter', () => {
    it('no key: off, nothing is loaded, no hook is put on the router', async () => {
        const router = fakeRouter()
        const loadPosthog = vi.fn()
        const mode = await startUsageMeasurement({ env: {}, storage: storageWith(null), win: window, doc: document, router, loadPosthog })

        expect(mode).toBe('off')
        expect(loadPosthog).not.toHaveBeenCalled()
        expect(router.hooks).toEqual([])
        expect(usageState()).toBe('off')
    })

    it('a key, and the browser turned it off: off, the library is never loaded', async () => {
        const loadPosthog = vi.fn()
        const mode = await startUsageMeasurement({ env: { VITE_POSTHOG_KEY: 'project-key' }, storage: storageWith('off'), win: window, doc: document, router: fakeRouter(), loadPosthog })

        expect(mode).toBe('off')
        expect(loadPosthog).not.toHaveBeenCalled()
    })

    it('a key: the PostHog adapter is loaded with the key and the host of the build', async () => {
        const sent = []
        const createPosthogAdapter = vi.fn(() => ({ send: (event) => sent.push(event) }))
        const loadPosthog = vi.fn(async () => ({ createPosthogAdapter }))
        const env = { VITE_POSTHOG_KEY: 'project-key', VITE_POSTHOG_HOST: 'https://us.i.posthog.com' }
        const mode = await startUsageMeasurement({ env, storage: storageWith(null), win: window, doc: document, router: fakeRouter(), loadPosthog })

        expect(mode).toBe('on')
        expect(createPosthogAdapter).toHaveBeenCalledWith({ key: 'project-key', host: 'https://us.i.posthog.com' })
        track('sign_out')
        expect(sent.map(event => event.name)).toEqual(['sign_out'])
    })

    it('debug: the events are kept in window.__usageEvents and the library is never loaded', async () => {
        const loadPosthog = vi.fn()
        const mode = await startUsageMeasurement({ env: { VITE_POSTHOG_KEY: 'project-key' }, storage: storageWith('debug'), win: window, doc: document, router: fakeRouter(), loadPosthog })
        track('series_created', { album_count: 2 })

        expect(mode).toBe('debug')
        expect(loadPosthog).not.toHaveBeenCalled()
        expect(window.__usageEvents.map(event => [event.name, event.properties])).toEqual([['series_created', { album_count: 2 }]])
    })

    it('without the debug flag there is no window.__usageEvents', async () => {
        await startUsageMeasurement({ env: {}, storage: storageWith(null), win: window, doc: document, router: fakeRouter() })
        expect(window.__usageEvents).toBeUndefined()
    })
})

describe('the screens', () => {
    it('each route has the name of its screen; an address with ids is never the name', () => {
        expect(screenOfRoute('/home')).toBe('home')
        expect(screenOfRoute('/albums')).toBe('albums')
        expect(screenOfRoute('/albums/:seriesId')).toBe('series')
        expect(screenOfRoute('/playlists/edit')).toBe('playlists_edit')
        expect(screenOfRoute('/saved-playlists')).toBe('saved_playlists')
        expect(screenOfRoute('/playlist-series')).toBe('saved_playlists')
        expect(screenOfRoute('/genres')).toBe('coming_soon')
        expect(screenOfRoute('/albums/abc123')).toBeNull()
        expect(screenOfRoute('/callback')).toBeNull()
        expect(screenOfRoute(undefined)).toBeNull()
    })

    it('a route that is shown sends screen_viewed with its name; a route that only redirects sends nothing', async () => {
        const router = fakeRouter()
        await startUsageMeasurement({ env: {}, storage: storageWith('debug'), win: window, doc: document, router })
        router.go('/albums/abc123', '/albums/:seriesId')
        router.go('/series', '/series')

        expect(window.__usageEvents.map(event => event.properties)).toEqual([{ screen: 'series' }])
    })
})

describe('the buy links', () => {
    const link = (store, place) => {
        document.body.innerHTML = `<a href="https://www.amazon.com/s?k=x" target="_blank" data-buy-store="${store}" data-buy-place="${place}"><span>Amazon ↗</span></a>`
        return document.querySelector('a')
    }

    it('a click on a link of a store, or on what is inside it, is the store and the place', () => {
        expect(buyLinkClickOf(link('amazon', 'card').querySelector('span'))).toEqual({ store: 'amazon', place: 'card' })
        expect(buyLinkClickOf(document.body)).toBeNull()
        expect(buyLinkClickOf(null)).toBeNull()
    })

    it('the click is measured and the navigation is not held: the default is not prevented', async () => {
        await startUsageMeasurement({ env: {}, storage: storageWith('debug'), win: window, doc: document, router: fakeRouter() })
        const anchor = link('discogs', 'phone_sheet')
        let heldByTheMeasurement = null
        anchor.addEventListener('click', (event) => {
            heldByTheMeasurement = event.defaultPrevented
            event.preventDefault() // jsdom would try to navigate
        })
        anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

        expect(heldByTheMeasurement).toBe(false)
        expect(window.__usageEvents.map(event => event.properties)).toEqual([{ store: 'discogs', place: 'phone_sheet' }])
    })

    it('a middle click (a new tab) is measured too', async () => {
        await startUsageMeasurement({ env: {}, storage: storageWith('debug'), win: window, doc: document, router: fakeRouter() })
        link('imusic', 'album_window').dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }))

        expect(window.__usageEvents.map(event => event.name)).toEqual(['buy_link_opened'])
    })
})
