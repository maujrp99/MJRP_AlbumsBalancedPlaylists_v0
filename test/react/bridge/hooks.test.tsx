/**
 * F83 TASK-04: the other hooks of the bridge. «Is it a phone?» over the one function of the site (utils/isPhone.js), the
 * title of the phone's top bar and of the tab over the functions of today, and navigation by code over the router.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { usePhone } from '../../../public/js/react-bridge/usePhone'
import { useScreenTitle } from '../../../public/js/react-bridge/useScreenTitle'
import { navigate } from '../../../public/js/react-bridge/navigation'
import { bridgeListenerCount } from '../../../public/js/react-bridge/listeners'
import { router } from '../../../public/js/router.js'
import * as screenName from '../../../public/js/stores/screenName.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type MediaListener = (event: { matches: boolean }) => void

/** A matchMedia that the test can turn: jsdom has none. */
function fakeMedia(initial: boolean) {
    let matches = initial
    const listeners = new Set<MediaListener>()
    const media = {
        get matches() { return matches },
        addEventListener: (_: string, listener: MediaListener) => { listeners.add(listener) },
        removeEventListener: (_: string, listener: MediaListener) => { listeners.delete(listener) }
    }
    return { media, turn: (next: boolean) => { matches = next; listeners.forEach(listener => listener({ matches })) }, listeners }
}

let root: Root
let host: HTMLElement
beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
})
afterEach(async () => {
    await act(async () => { root.unmount() })
    host.remove()
    vi.restoreAllMocks()
    delete (window as { matchMedia?: unknown }).matchMedia
})

describe('usePhone', () => {
    it('answers from the width of the screen and draws again when the phone turns, and lets go when left', async () => {
        const fake = fakeMedia(false)
        ;(window as { matchMedia?: unknown }).matchMedia = () => fake.media
        function Screen() { return <p id="kind">{usePhone() ? 'phone' : 'computer'}</p> }
        const base = bridgeListenerCount()

        await act(async () => { root.render(<Screen />) })
        expect(host.querySelector('#kind')!.textContent).toBe('computer')
        expect(bridgeListenerCount()).toBe(base + 1)

        await act(async () => { fake.turn(true) })
        expect(host.querySelector('#kind')!.textContent).toBe('phone')

        await act(async () => { root.unmount() })
        expect(fake.listeners.size).toBe(0)
        expect(bridgeListenerCount()).toBe(base)
        root = createRoot(host)
    })

    it('where the width cannot be asked it is not a phone, and nothing breaks', async () => {
        function Screen() { return <p id="kind">{usePhone() ? 'phone' : 'computer'}</p> }
        await act(async () => { root.render(<Screen />) })
        expect(host.querySelector('#kind')!.textContent).toBe('computer')
    })
})

describe('useScreenTitle', () => {
    it('names the screen in the top bar of the phone, and sets the tab title through the one place for it', async () => {
        const named = vi.spyOn(screenName, 'nameThisScreen').mockImplementation(() => {})
        function Screen() { useScreenTitle({ name: 'Series', tab: 'MJRP The Album Blender - Playlist Generator' }); return null }

        await act(async () => { root.render(<Screen />) })

        expect(named).toHaveBeenCalledWith('Series')
        expect(document.title).toBe('MJRP The Album Blender - Playlist Generator')
    })

    it('a screen with no name leaves the bar and the tab as the router left them', async () => {
        const named = vi.spyOn(screenName, 'nameThisScreen').mockImplementation(() => {})
        document.title = 'kept'
        function Screen() { useScreenTitle({}); return null }

        await act(async () => { root.render(<Screen />) })

        expect(named).not.toHaveBeenCalled()
        expect(document.title).toBe('kept')
    })
})

describe('navigate', () => {
    it('hands the move to the router after the draw in course, not during it', async () => {
        const go = vi.spyOn(router, 'navigate').mockImplementation(() => {})
        navigate('/albums', { from: 'test' })
        expect(go).not.toHaveBeenCalled()

        await Promise.resolve()

        expect(go).toHaveBeenCalledWith('/albums', { from: 'test' })
    })
})
