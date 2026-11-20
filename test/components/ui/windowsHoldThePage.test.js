/**
 * F76 (REQ-04) - on the phone the page behind a window of the app does not scroll: the windows
 * that existed before the Sheet are watched, the page is held while one is open and given back
 * where it was when the last one leaves.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { holdPageBehindWindows } from '../../../public/js/components/ui/windowsHoldThePage.js'
import { pageScrollLocks } from '../../../public/js/utils/pageScrollLock.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 0))
const windowOf = (className, id) => {
    const el = document.createElement('div')
    el.className = className
    if (id) el.id = id
    return el
}

describe('windowsHoldThePage', () => {
    let stop, scrolledTo

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>'
        document.body.removeAttribute('style')
        scrolledTo = []
        window.scrollTo = (x, y) => scrolledTo.push([x, y])
        Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true })
    })

    afterEach(() => {
        stop?.()
        expect(pageScrollLocks()).toBe(0)
    })

    it.each([
        ['the album window', 'modal-overlay album-window', null],
        ['an edit or confirmation window', 'app-modal app-modal--full', null],
        ['the ranking window', 'rank-window', null],
        ['the Spotify export', '', 'spotify-export-modal']
    ])('holds the page while %s is open and gives its place back after', async (what, className, id) => {
        stop = holdPageBehindWindows()
        const opened = windowOf(className, id)

        document.body.appendChild(opened)
        await settle()
        expect(document.body.style.position).toBe('fixed')
        expect(document.body.style.top).toBe('-1200px')

        opened.remove()
        await settle()
        expect(document.body.style.position).toBe('')
        expect(scrolledTo).toEqual([[0, 1200]])
    })

    it('two windows: the page is given back when the last one leaves', async () => {
        stop = holdPageBehindWindows()
        const album = windowOf('modal-overlay album-window')
        const confirm = windowOf('app-modal app-modal--bottom')

        document.body.append(album, confirm)
        await settle()
        confirm.remove()
        await settle()
        expect(document.body.style.position).toBe('fixed')
        expect(pageScrollLocks()).toBe(1)

        album.remove()
        await settle()
        expect(document.body.style.position).toBe('')
    })

    it('something else put on the page does not hold it', async () => {
        stop = holdPageBehindWindows()

        document.body.appendChild(windowOf('toast'))
        await settle()

        expect(document.body.style.position).toBe('')
    })

    it('a window already open when the watch starts holds the page; stopping gives it back', async () => {
        document.body.appendChild(windowOf('modal-overlay'))

        stop = holdPageBehindWindows()
        expect(document.body.style.position).toBe('fixed')

        stop()
        stop = null
        expect(document.body.style.position).toBe('')
    })
})
