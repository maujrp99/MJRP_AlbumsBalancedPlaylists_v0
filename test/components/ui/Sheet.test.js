/**
 * F76 (REQ-04) - the sheet of the phone: the page behind is held and found where it was, the
 * focus stays inside and goes back where it came from, the sheet is a dialog with a name, and it
 * closes by its button, by Escape and (the bottom one) by a tap outside or a drag down.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openSheet, SHEET_SLIDE_MS } from '../../../public/js/components/ui/Sheet.js'
import { pageScrollLocks } from '../../../public/js/utils/pageScrollLock.js'

const key = (name, more = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...more }))
const touch = (target, type, y) => {
    const event = new Event(type, { bubbles: true })
    event.touches = [{ clientY: y }]
    event.changedTouches = [{ clientY: y }]
    target.dispatchEvent(event)
}
const button = (label) => {
    const el = document.createElement('button')
    el.textContent = label
    return el
}

describe('Sheet', () => {
    let scrolledTo

    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = '<button id="opener">Open</button>'
        document.body.removeAttribute('style')
        scrolledTo = []
        window.scrollTo = (x, y) => scrolledTo.push([x, y])
        Object.defineProperty(window, 'scrollY', { value: 640, configurable: true })
    })

    afterEach(() => {
        vi.runAllTimers()
        vi.useRealTimers()
        expect(pageScrollLocks()).toBe(0)
    })

    it('is a dialog named by its title, with a close button that has a name', () => {
        const sheet = openSheet({ title: 'Edit album', content: 'Body' })
        const panel = sheet.element.querySelector('[role="dialog"]')

        expect(panel.getAttribute('aria-modal')).toBe('true')
        expect(document.getElementById(panel.getAttribute('aria-labelledby')).textContent).toBe('Edit album')
        expect(sheet.element.querySelector('.sheet__close').getAttribute('aria-label')).toBe('Close')
        expect(sheet.element.classList.contains('sheet--full')).toBe(true)
        sheet.close()
    })

    it('writes the title and the body as text, never as HTML', () => {
        const sheet = openSheet({ title: '<img src=x onerror=alert(1)>', content: '<b>bold</b>' })

        expect(sheet.element.querySelector('img')).toBeNull()
        expect(sheet.element.querySelector('b')).toBeNull()
        expect(sheet.body.textContent).toBe('<b>bold</b>')
        sheet.close()
    })

    it('holds the page behind while open and gives its place back when it closes', () => {
        const sheet = openSheet({ title: 'Filters' })

        expect(document.body.style.position).toBe('fixed')
        expect(document.body.style.top).toBe('-640px')
        expect(pageScrollLocks()).toBe(1)

        sheet.close()

        expect(document.body.style.position).toBe('')
        expect(document.body.style.top).toBe('')
        expect(scrolledTo).toEqual([[0, 640]])
    })

    it('a sheet over a sheet: the page is given back only when the last one closes', () => {
        const first = openSheet({ title: 'Menu' })
        const second = openSheet({ variant: 'bottom', title: 'Sure?' })

        second.close()
        expect(document.body.style.position).toBe('fixed')

        first.close()
        expect(document.body.style.position).toBe('')
        expect(scrolledTo).toEqual([[0, 640]])
    })

    it('puts the focus inside and gives it back to where it came from', () => {
        const opener = document.getElementById('opener')
        opener.focus()
        const inside = button('First')
        const sheet = openSheet({ title: 'Filters', content: inside })

        expect(document.activeElement).toBe(inside)

        sheet.close()
        expect(document.activeElement).toBe(opener)
    })

    it('keeps Tab and Shift+Tab going round inside the sheet', () => {
        const first = button('First')
        const last = button('Save')
        const sheet = openSheet({ title: 'Filters', content: first, footer: last })
        const close = sheet.element.querySelector('.sheet__close')

        // The order on the screen: close (header), First (body), Save (footer)
        last.focus()
        key('Tab')
        expect(document.activeElement).toBe(close)

        key('Tab', { shiftKey: true })
        expect(document.activeElement).toBe(last)

        document.getElementById('opener').focus() // the focus got out: Tab brings it back in
        key('Tab')
        expect(document.activeElement).toBe(close)
        sheet.close()
    })

    it('closes by its button, tells who opened it once, and leaves the page after the slide', () => {
        const onClose = vi.fn()
        const sheet = openSheet({ title: 'Filters', onClose })

        sheet.element.querySelector('.sheet__close').click()
        sheet.close() // a second close is nothing

        expect(onClose).toHaveBeenCalledTimes(1)
        expect(sheet.isOpen()).toBe(false)
        expect(sheet.element.classList.contains('sheet--closing')).toBe(true)
        expect(document.body.contains(sheet.element)).toBe(true)

        vi.advanceTimersByTime(SHEET_SLIDE_MS)
        expect(document.body.contains(sheet.element)).toBe(false)
    })

    it('leaves at once, with no slide, for who asked for less motion', () => {
        const matchMedia = window.matchMedia
        window.matchMedia = (query) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener() { }, removeEventListener() { } })
        const sheet = openSheet({ title: 'Filters' })

        sheet.close()

        expect(document.body.contains(sheet.element)).toBe(false)
        window.matchMedia = matchMedia
    })

    it('closes on Escape', () => {
        const sheet = openSheet({ title: 'Filters' })
        key('Escape')
        expect(sheet.isOpen()).toBe(false)
    })

    it('a bottom sheet has a drag handle and closes on a tap outside; a full one has neither', () => {
        const bottom = openSheet({ variant: 'bottom', title: 'Sort by' })
        expect(bottom.element.classList.contains('sheet--bottom')).toBe(true)
        expect(bottom.element.querySelector('.sheet__handle')).not.toBeNull()
        bottom.element.querySelector('.sheet__backdrop').click()
        expect(bottom.isOpen()).toBe(false)

        const full = openSheet({ title: 'Edit album' })
        expect(full.element.querySelector('.sheet__handle')).toBeNull()
        full.element.querySelector('.sheet__backdrop').click()
        expect(full.isOpen()).toBe(true)
        full.close()
    })

    it('a bottom sheet closes when dragged down far enough, and stays when let go early', () => {
        const sheet = openSheet({ variant: 'bottom', title: 'Sort by' })
        const handle = sheet.element.querySelector('.sheet__handle')
        const panel = sheet.element.querySelector('.sheet__panel')

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
        let tell = null
        window.matchMedia = (query) => ({
            matches: !query.includes('prefers-reduced-motion'),
            addEventListener: (type, listener) => { tell = listener },
            removeEventListener: () => { tell = null }
        })
        const sheet = openSheet({ title: 'Filters' })

        tell({ matches: false })

        expect(sheet.isOpen()).toBe(false)
        expect(tell).toBeNull()
        window.matchMedia = matchMedia
    })

    it('can be given a new title and a footer that stays in view', () => {
        const save = button('Save')
        const sheet = openSheet({ title: 'Edit', footer: save })

        sheet.setTitle('Edit · Brothers in Arms')

        expect(sheet.element.querySelector('.sheet__title').textContent).toBe('Edit · Brothers in Arms')
        expect(sheet.footer.contains(save)).toBe(true)
        expect(sheet.footer.classList.contains('sheet__footer')).toBe(true)
        sheet.close()
    })
})
