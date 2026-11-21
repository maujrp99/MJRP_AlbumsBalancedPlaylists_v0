/**
 * F83 TASK-04: a React screen under the house router (REQ-01). Enters and leaves in the same #app as the hand-made
 * screens, leaves no listener of the screen behind, and an error at draw time shows the router's panel and is counted.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, useEffect } from 'react'
import { Router, router as theRouter } from '../../../public/js/router.js'
import { errorPanelModel, errorPanelHtml } from '../../../public/js/utils/failurePanel.js'
import { ReactView } from '../../../public/js/react-bridge/ReactView'
import { useStore } from '../../../public/js/react-bridge/useStore'
import { navigate } from '../../../public/js/react-bridge/navigation'
import { bridgeListenerCount } from '../../../public/js/react-bridge/listeners'
import * as track from '../../../public/js/services/usage/track.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

class Store {
    value = 'v'
    listeners = new Set<() => void>()
    set(value: string) { this.value = value; this.listeners.forEach(listener => listener()) }
    subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
}

class PlainView {
    render() {
        const node = document.createElement('p')
        node.id = 'plain'
        node.textContent = 'a hand-made screen'
        return node
    }
}

describe('a React screen under the router (F83 bridge)', () => {
    let app: HTMLElement
    let router: Router
    let store: Store

    function Screen({ params }: { params: { query?: Record<string, string> } }) {
        const value = useStore(store, current => current.value)
        return <section id="react-screen" data-q={params.query?.q ?? ''}>{value}</section>
    }

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')
        store = new Store()
        router = new Router({ reloadForNewBuild: () => false })
        // the bridge navigates through the one router of the site; here the screens are registered on a router of the test
        vi.spyOn(theRouter, 'navigate').mockImplementation((path: string, state?: object) => router.navigate(path, state))
        router.register('/react', () => new ReactView(Screen, {}, { screen: 'coming_soon' }))
        router.register('/plain', () => new PlainView())
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(async () => {
        await act(async () => { router.currentView?.destroy?.() })
        app.remove()
        vi.restoreAllMocks()
    })

    const go = (path: string) => act(async () => { router.navigate(path); await new Promise(resolve => setTimeout(resolve, 0)) })

    it('draws at once into #app with the params of the route, and a hand-made screen takes its place', async () => {
        await go('/react?q=floyd')
        expect(app.querySelector('#react-screen')!.textContent).toBe('v')
        expect(app.querySelector('#react-screen')!.getAttribute('data-q')).toBe('floyd')

        await go('/plain')
        expect(app.querySelector('#react-screen')).toBeNull()
        expect(app.querySelector('#plain')!.textContent).toBe('a hand-made screen')
    })

    it('away and back five times: one screen, and no listener of the screen left', async () => {
        const base = bridgeListenerCount()
        for (let visit = 0; visit < 5; visit++) {
            await go('/react')
            expect(bridgeListenerCount()).toBe(base + 1)
            await go('/plain')
            expect(bridgeListenerCount()).toBe(base)
        }
        await go('/react')
        expect(app.querySelectorAll('#react-screen')).toHaveLength(1)
    })

    it('the screen is drawn again when the store it reads changes', async () => {
        await go('/react')
        await act(async () => { store.set('changed') })
        expect(app.querySelector('#react-screen')!.textContent).toBe('changed')
    })

    it('an error while drawing shows the same panel as the router, and is counted by the port of use', async () => {
        const tracked = vi.spyOn(track, 'track').mockReturnValue(true)
        vi.spyOn(console, 'error').mockImplementation(() => {})
        function Broken(): never { throw new Error('albums is not iterable') }
        router.register('/broken', () => new ReactView(Broken, {}, { screen: 'coming_soon' }))

        await go('/broken')

        const expected = document.createElement('div')
        const error = new Error('albums is not iterable')
        expected.innerHTML = errorPanelHtml(errorPanelModel(error))
        expect(app.querySelector('.text-red-500')!.textContent).toBe('View Error')
        expect(app.querySelector('pre')!.textContent).toContain('albums is not iterable')
        expect(app.querySelector('button.btn.btn-secondary.mt-4')!.textContent).toBe('Go Back')
        expect(app.querySelector('.p-8.text-center')!.className).toBe(expected.querySelector('.p-8.text-center')!.className)
        expect(tracked).toHaveBeenCalledWith('screen_error', { screen: 'coming_soon' })
    })

    it('the button of the panel goes back, as the router panel does', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
        function Broken(): never { throw new Error('x') }
        router.register('/broken', () => new ReactView(Broken, {}, { screen: 'coming_soon' }))
        await go('/broken')

        await act(async () => { (app.querySelector('button.btn-secondary') as HTMLButtonElement).click() })
        expect(back).toHaveBeenCalledTimes(1)
    })

    it('navigating from inside an effect does not break the draw in course: the router moves on after it', async () => {
        function Redirecting() {
            useEffect(() => { navigate('/plain') }, [])
            return <p id="going">going</p>
        }
        router.register('/redirecting', () => new ReactView(Redirecting, {}, { screen: 'coming_soon' }))
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

        await go('/redirecting')
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)) })

        expect(app.querySelector('#plain')).not.toBeNull()
        expect(app.querySelector('#going')).toBeNull()
        expect(errors).not.toHaveBeenCalled()
        expect(window.location.pathname).toBe('/plain')
    })
})
