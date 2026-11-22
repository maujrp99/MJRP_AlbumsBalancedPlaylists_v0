/**
 * F76 (REQ-04) - the sheet of the phone: the page behind is held and found where it was, the focus stays inside and goes back where it came from, the
 * sheet is a dialog with a name, and it closes by its button, by Escape and (the bottom one) by a tap outside or a drag down.
 *
 * Carried in F83 wave 8c from test/components/ui/Sheet.test.js (the hand-made motor), assertion for assertion, through the imperative door of the
 * React sheet (`openSheet`: what a controller that opens a sheet calls). What was a DOM node given as content is a piece of React here; nothing else changed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { openSheet, SHEET_SLIDE_MS, useSheetWindow, type SheetHandle } from '../../public/js/ui/SheetWindow'
import { pageScrollLocks } from '../../public/js/utils/pageScrollLock.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const key = (name: string, more = {}) => act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...more })) })
const touch = (target: Element, type: string, y: number) => {
    const event = new Event(type, { bubbles: true }) as Event & { touches: unknown[]; changedTouches: unknown[] }
    event.touches = [{ clientY: y }]
    event.changedTouches = [{ clientY: y }]
    act(() => { target.dispatchEvent(event) })
}

type Request = Parameters<typeof openSheet>[0]
/** A screen calls the door from an event: inside the update. */
const open = (request: Request): SheetHandle => {
    let sheet!: SheetHandle
    act(() => { sheet = openSheet(request) })
    return sheet
}
const close = (sheet: SheetHandle) => act(() => { sheet.close() })
const content = (node: ReactNode) => () => node

describe('Sheet', () => {
    let scrolledTo: Array<[number, number]>

    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = '<button id="opener">Open</button>'
        document.body.removeAttribute('style')
        scrolledTo = []
        window.scrollTo = ((x: number, y: number) => { scrolledTo.push([x, y]) }) as unknown as typeof window.scrollTo
        Object.defineProperty(window, 'scrollY', { value: 640, configurable: true })
    })

    afterEach(() => {
        act(() => { vi.runAllTimers() })
        vi.useRealTimers()
        expect(pageScrollLocks()).toBe(0)
    })

    it('is a dialog named by its title, with a close button that has a name', () => {
        const sheet = open({ title: 'Edit album', render: content('Body') })
        const panel = sheet.element!.querySelector('[role="dialog"]')!

        expect(panel.getAttribute('aria-modal')).toBe('true')
        expect(document.getElementById(panel.getAttribute('aria-labelledby')!)!.textContent).toBe('Edit album')
        expect(sheet.element!.querySelector('.sheet__close')!.getAttribute('aria-label')).toBe('Close')
        expect(sheet.element!.classList.contains('sheet--full')).toBe(true)
        close(sheet)
    })

    it('writes the title and the body as text, never as HTML', () => {
        const sheet = open({ title: '<img src=x onerror=alert(1)>', render: content('<b>bold</b>') })

        expect(sheet.element!.querySelector('img')).toBeNull()
        expect(sheet.element!.querySelector('b')).toBeNull()
        expect(sheet.body!.textContent).toBe('<b>bold</b>')
        close(sheet)
    })

    it('holds the page behind while open and gives its place back when it closes', () => {
        const sheet = open({ title: 'Filters' })

        expect(document.body.style.position).toBe('fixed')
        expect(document.body.style.top).toBe('-640px')
        expect(pageScrollLocks()).toBe(1)

        close(sheet)

        expect(document.body.style.position).toBe('')
        expect(document.body.style.top).toBe('')
        expect(scrolledTo).toEqual([[0, 640]])
    })

    it('a sheet over a sheet: the page is given back only when the last one closes', () => {
        const first = open({ title: 'Menu' })
        const second = open({ variant: 'bottom', title: 'Sure?' })

        close(second)
        expect(document.body.style.position).toBe('fixed')

        close(first)
        expect(document.body.style.position).toBe('')
        expect(scrolledTo).toEqual([[0, 640]])
    })

    it('puts the focus inside and gives it back to where it came from', () => {
        const opener = document.getElementById('opener')!
        opener.focus()
        const sheet = open({ title: 'Filters', render: content(<button id="inside">First</button>) })

        expect(document.activeElement).toBe(document.getElementById('inside'))

        close(sheet)
        expect(document.activeElement).toBe(opener)
    })

    it('keeps Tab and Shift+Tab going round inside the sheet', () => {
        const sheet = open({ title: 'Filters', render: content(<button id="first">First</button>), footer: content(<button id="last">Save</button>) })
        const closeButton = sheet.element!.querySelector<HTMLElement>('.sheet__close')!
        const last = document.getElementById('last')!

        // The order on the screen: close (header), First (body), Save (footer)
        last.focus()
        key('Tab')
        expect(document.activeElement).toBe(closeButton)

        key('Tab', { shiftKey: true })
        expect(document.activeElement).toBe(last)

        document.getElementById('opener')!.focus() // the focus got out: Tab brings it back in
        key('Tab')
        expect(document.activeElement).toBe(closeButton)
        close(sheet)
    })

    it('closes by its button, tells who opened it once, and leaves the page after the slide', () => {
        const onClose = vi.fn()
        const sheet = open({ title: 'Filters', onClose })

        act(() => { sheet.element!.querySelector<HTMLElement>('.sheet__close')!.click() })
        close(sheet) // a second close is nothing

        expect(onClose).toHaveBeenCalledTimes(1)
        expect(sheet.isOpen()).toBe(false)
        expect(sheet.element!.classList.contains('sheet--closing')).toBe(true)
        const element = sheet.element!
        expect(document.body.contains(element)).toBe(true)

        act(() => { vi.advanceTimersByTime(SHEET_SLIDE_MS) })
        expect(document.body.contains(element)).toBe(false)
    })

    it('leaves at once, with no slide, for who asked for less motion', () => {
        const matchMedia = window.matchMedia
        window.matchMedia = ((query: string) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener() { }, removeEventListener() { } })) as unknown as typeof window.matchMedia
        const sheet = open({ title: 'Filters' })
        const element = sheet.element!

        close(sheet)

        expect(document.body.contains(element)).toBe(false)
        window.matchMedia = matchMedia
    })

    it('closes on Escape', () => {
        const sheet = open({ title: 'Filters' })
        key('Escape')
        expect(sheet.isOpen()).toBe(false)
    })

    it('a bottom sheet has a drag handle and closes on a tap outside; a full one has neither', () => {
        const bottom = open({ variant: 'bottom', title: 'Sort by' })
        expect(bottom.element!.classList.contains('sheet--bottom')).toBe(true)
        expect(bottom.element!.querySelector('.sheet__handle')).not.toBeNull()
        act(() => { bottom.element!.querySelector<HTMLElement>('.sheet__backdrop')!.click() })
        expect(bottom.isOpen()).toBe(false)

        const full = open({ title: 'Edit album' })
        expect(full.element!.querySelector('.sheet__handle')).toBeNull()
        act(() => { full.element!.querySelector<HTMLElement>('.sheet__backdrop')!.click() })
        expect(full.isOpen()).toBe(true)
        close(full)
    })

    it('a bottom sheet closes when dragged down far enough, and stays when let go early', () => {
        const sheet = open({ variant: 'bottom', title: 'Sort by' })
        const handle = sheet.element!.querySelector('.sheet__handle')!
        const panel = sheet.element!.querySelector<HTMLElement>('.sheet__panel')!

        touch(handle, 'touchstart', 300)
        touch(handle, 'touchmove', 340)
        expect(panel.style.transform).toBe('translateY(40px)')
        touch(handle, 'touchend', 340)
        expect(sheet.isOpen()).toBe(true)
        expect(panel.style.transform).toBe('')

        touch(handle, 'touchstart', 300)
        touch(handle, 'touchend', 420)
        expect(sheet.isOpen()).toBe(false)
    })

    it('closes when the screen stops being a phone', () => {
        const matchMedia = window.matchMedia
        let tell: ((event: { matches: boolean }) => void) | null = null
        window.matchMedia = ((query: string) => ({
            matches: !query.includes('prefers-reduced-motion'),
            addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => { tell = listener },
            removeEventListener: () => { tell = null }
        })) as unknown as typeof window.matchMedia
        const sheet = open({ title: 'Filters' })

        act(() => { tell!({ matches: false }) })

        expect(sheet.isOpen()).toBe(false)
        expect(tell).toBeNull()
        window.matchMedia = matchMedia
    })

    it('can be given a new title and a footer that stays in view', () => {
        const sheet = open({ title: 'Edit', footer: content(<button id="save">Save</button>) })

        act(() => { sheet.setTitle('Edit · Brothers in Arms') })

        expect(sheet.element!.querySelector('.sheet__title')!.textContent).toBe('Edit · Brothers in Arms')
        expect(sheet.footer!.contains(document.getElementById('save'))).toBe(true)
        expect(sheet.footer!.classList.contains('sheet__footer')).toBe(true)
        close(sheet)
    })

    it('the door goes when the sheet has: nothing is left in the page, and the screen is not held', () => {
        const sheet = open({ title: 'Filters' })
        close(sheet)
        act(() => { vi.advanceTimersByTime(SHEET_SLIDE_MS) })
        // a microtask later the root of the door is gone too
        return Promise.resolve().then(() => {
            expect(document.querySelector('.sheet')).toBeNull()
            expect(pageScrollLocks()).toBe(0)
        })
    })

    it('a screen that says the title at every draw (the filters sheet does, in an effect) does not draw for ever', () => {
        let draws = 0
        function Screen() {
            const sheet = useSheetWindow()
            draws += 1
            useEffect(() => { if (sheet.isOpen()) sheet.setTitle('Filters (2)') })
            return <><button id="open" onClick={() => { sheet.show({ title: 'Filters', closeLabel: 'Close', render: () => null }) }}>Open</button>{sheet.layer}</>
        }
        const root = createRoot(document.body.appendChild(document.createElement('div')))
        act(() => { root.render(<Screen />) })
        act(() => { document.getElementById('open')!.click() })

        expect(document.querySelector('.sheet__title')!.textContent).toBe('Filters (2)')
        expect(draws).toBeLessThan(10)
        act(() => { root.unmount() }) // the screen is left: the sheet goes with it and the page is given back
    })
})
