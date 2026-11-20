/**
 * F76 (REQ-12) - one place answers "is this the phone?": a screen up to 767 px wide, asked of the
 * screen itself (matchMedia), and heard again when the phone turns or the window is resized.
 */
import { describe, it, expect, vi } from 'vitest'
import { isPhone, onPhoneChange, PHONE_QUERY } from '../../public/js/utils/isPhone.js'

/** A window whose width the test sets; matchMedia answers the phone's query from it. */
function windowOf(width) {
    const listeners = new Set()
    const media = {
        get matches() { return win.width <= 767 },
        addEventListener: (type, listener) => listeners.add(listener),
        removeEventListener: (type, listener) => listeners.delete(listener)
    }
    const win = {
        width,
        asked: [],
        matchMedia(query) { win.asked.push(query); return media },
        resizeTo(next) {
            const before = media.matches
            win.width = next
            if (media.matches !== before) listeners.forEach(listener => listener({ matches: media.matches }))
        },
        listeners
    }
    return win
}

describe('isPhone', () => {
    it('is the phone up to 767 px, and not from 768 px', () => {
        expect(isPhone(windowOf(393))).toBe(true)
        expect(isPhone(windowOf(767))).toBe(true)
        expect(isPhone(windowOf(768))).toBe(false)
        expect(isPhone(windowOf(1280))).toBe(false)
    })

    it('asks the screen with the query the stylesheets write', () => {
        const win = windowOf(393)
        isPhone(win)
        expect(win.asked).toEqual([PHONE_QUERY])
        expect(PHONE_QUERY).toBe('(max-width: 767px)')
    })

    it('is not the phone where the width cannot be asked', () => {
        expect(isPhone({})).toBe(false)
    })
})

describe('onPhoneChange', () => {
    it('tells when the screen becomes a phone and when it stops being one', () => {
        const win = windowOf(1280)
        const heard = vi.fn()
        onPhoneChange(heard, win)

        win.resizeTo(393)
        win.resizeTo(500) // still a phone: nothing to tell
        win.resizeTo(852) // the phone lying down is not "the phone"

        expect(heard.mock.calls).toEqual([[true], [false]])
    })

    it('stops telling when asked to', () => {
        const win = windowOf(1280)
        const heard = vi.fn()
        const stop = onPhoneChange(heard, win)

        stop()
        win.resizeTo(393)

        expect(heard).not.toHaveBeenCalled()
        expect(win.listeners.size).toBe(0)
    })

    it('does nothing where the screen cannot be heard', () => {
        expect(() => onPhoneChange(() => { }, {})()).not.toThrow()
    })
})
