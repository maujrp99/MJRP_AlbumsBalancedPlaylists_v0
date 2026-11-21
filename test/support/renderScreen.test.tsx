/**
 * F83 TASK-07: the mold of the leave test works. It passes on a screen that cleans up after itself, and it accuses the
 * three ways a screen can go on listening after it is left: a store through the bridge, the window, and a screen left on the
 * page. The strict mode of React is on in the tests: an effect that does not undo itself shows.
 */
import { describe, it, expect } from 'vitest'
import { useEffect } from 'react'
import { renderScreen, leaveReport, itLeavesNoListeners } from './renderScreen'
import { useStore } from '../../public/js/react-bridge/useStore'

class Store {
    value = 'v'
    listeners = new Set<() => void>()
    set(value: string) { this.value = value; this.listeners.forEach(listener => listener()) }
    subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
}
const store = new Store()

function GoodScreen() {
    const value = useStore(store, current => current.value)
    useEffect(() => {
        const onResize = () => {}
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])
    return <p id="good">{value}</p>
}

function LeaksOnWindow() {
    useEffect(() => { window.addEventListener('resize', () => {}) }, [])
    return <p>leaks</p>
}

describe('renderScreen', () => {
    it('mounts the screen in #app as the router does, and the test reads the DOM by selector', async () => {
        const rendered = await renderScreen(GoodScreen, {})
        expect(rendered.app.id).toBe('app')
        expect(rendered.app.querySelector('#good')!.textContent).toBe('v')
        await rendered.act(() => store.set('changed'))
        expect(rendered.app.querySelector('#good')!.textContent).toBe('changed')
        await rendered.leave()
        expect(document.querySelector('#app')).toBeNull()
        store.set('v')
    })

    it('gives the screen the params of the route', async () => {
        function WithParams({ params }: { params: { query?: Record<string, string> } }) { return <p id="q">{params.query?.q}</p> }
        const rendered = await renderScreen(WithParams, {}, { params: { query: { q: 'floyd' } } })
        expect(rendered.app.querySelector('#q')!.textContent).toBe('floyd')
        await rendered.leave()
    })

    it('the strict mode is on: an effect runs twice on mount, so one that does not undo itself shows', async () => {
        let starts = 0
        function Counting() { useEffect(() => { starts += 1 }, []); return null }
        const rendered = await renderScreen(Counting, {})
        expect(starts).toBe(2)
        await rendered.leave()
    })
})

describe('the leave test accuses what a screen leaves behind (the wrong examples)', () => {
    it('a screen that cleans up leaves nothing', async () => {
        expect(await leaveReport(GoodScreen, {})).toEqual({ bridge: 0, window: 0, screens: 0 })
    })

    it('a screen that adds a listener to the window and never removes it is accused', async () => {
        const report = await leaveReport(LeaksOnWindow, {})
        expect(report.window).toBeGreaterThan(0)
        expect(report.bridge).toBe(0)
    })
})

// And the mold itself, applied to the good screen: this is the test a real screen has in its folder.
itLeavesNoListeners('GoodScreen', GoodScreen, {})
