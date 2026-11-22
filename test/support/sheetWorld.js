/**
 * The engine the scenarios of test/support/sheetScenarios.js are played on (F83 wave 8c): a screen (a React root) that holds two sheets, as a screen
 * and a question over it do, a person who presses and touches, a phone whose screen can change, and a notebook. `useSheetWindow` is the same
 * door for the hand-made engine (when the pictures were taken) and the React one (when they are compared): the host never knows which it is.
 */
import { act, createElement as h, Fragment, useLayoutEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { pageOf, focusOf } from './engineScenarios.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve() }

/** A button that takes the focus as it is drawn (the footer of the filters sheet does). */
function Autofocus({ id }) {
    const ref = useRef(null)
    useLayoutEffect(() => { ref.current?.focus({ preventScroll: true }) }, [])
    return h('button', { id, type: 'button', ref }, id)
}

/** The ids the title of each sheet takes go up by one with every sheet; the scenarios do not depend on where the count stood. */
export const withoutTheCount = (page) => page.replace(/sheetTitle\d+/g, 'sheetTitle#')

export async function makeSheetEngine() {
    const { useSheetWindow } = await import('../../public/js/ui/SheetWindow')
    const { pageScrollLocks, releasePageScroll, lockPageScroll, unlockPageScroll } = await import('../../public/js/utils/pageScrollLock.js')
    releasePageScroll()

    const log = []
    const scrolled = []
    const phoneListeners = new Set()
    const realMatchMedia = window.matchMedia
    const realScrollTo = window.scrollTo
    const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
    let phone = true
    let lessMotion = false
    window.matchMedia = (query) => ({
        get matches() { return query.includes('reduced') ? lessMotion : phone },
        addEventListener: (type, listener) => { if (!query.includes('reduced')) phoneListeners.add(listener) },
        removeEventListener: (type, listener) => { phoneListeners.delete(listener) }
    })
    window.scrollTo = (x, y) => scrolled.push([x, y])
    const scrollAt = (y) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    scrollAt(640)

    const expose = { a: null, b: null }
    function Host() {
        const a = useSheetWindow()
        const b = useSheetWindow()
        expose.a = a
        expose.b = b
        return h(Fragment, null, h('button', { id: 'opener', type: 'button' }, 'Open'), a.layer, b.layer)
    }
    const container = document.body.appendChild(document.createElement('div'))
    const root = createRoot(container)
    act(() => { root.render(h(Host)) })
    document.body.removeAttribute('style')

    const touchEvent = (type, y) => {
        const event = new Event(type, { bubbles: true })
        event.touches = y === null ? [] : [{ clientY: y }]
        event.changedTouches = y === null ? [] : [{ clientY: y }]
        return event
    }

    /** What a screen does from a tap: the calls are made inside the update of the event (a call outside it would wait for a frame the fake clock never brings). */
    const actingAs = (which) => ({
        show: (request) => { act(() => { which().show(request) }) },
        close: () => { act(() => { which().close() }) },
        setTitle: (text) => { act(() => { which().setTitle(text) }) },
        isOpen: () => which().isOpen()
    })

    return {
        h,
        Autofocus,
        a: actingAs(() => expose.a),
        b: actingAs(() => expose.b),
        opener: () => document.getElementById('opener'),
        log: (text) => { log.push(text) },
        logged: () => [...log],
        focus: focusOf,
        pinned: () => document.body.dataset.scrollLocked === 'true',
        focusById: (id) => { document.getElementById(id).focus() },
        removeCloseButton: () => { document.querySelector('.sheet__close').remove() },
        hit: async (key, target = document, extra = {}) => { act(() => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })) }); await flush() },
        touch: async (target, type, y) => { act(() => { target.dispatchEvent(touchEvent(type, y)) }); await flush() },
        setPhone: (value) => { phone = value; act(() => { for (const listener of [...phoneListeners]) listener({ matches: value }) }) },
        setLessMotion: (value) => { lessMotion = value },
        phoneListeners: () => phoneListeners.size,
        scrollAt,
        leaveTheScreen: () => { act(() => { root.unmount() }) },
        pinTheBodyLikeAWindow: () => { lockPageScroll(window) },
        unpinTheBodyLikeAWindow: () => { unlockPageScroll(window) },
        stateNow: () => ({
            body: document.body.getAttribute('style'),
            locked: document.body.dataset.scrollLocked ?? null,
            locks: pageScrollLocks(),
            scrolled: scrolled.map((at) => at.join(',')),
            focus: focusOf(),
            sheets: [...document.body.children].filter((child) => child.classList.contains('sheet')).map((child) => child.className)
        }),
        pageOf,
        teardown: async () => {
            try { act(() => { root.unmount() }) } catch { /* the scenario left the screen already */ }
            releasePageScroll()
            window.matchMedia = realMatchMedia
            window.scrollTo = realScrollTo
            if (scrollY) Object.defineProperty(window, 'scrollY', scrollY)
            else delete window.scrollY
            document.body.removeAttribute('style')
            delete document.body.dataset.scrollLocked
        }
    }
}
