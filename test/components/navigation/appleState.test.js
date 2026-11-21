/**
 * F88 (judge's P1-1) - the state of Apple Music is asked ONCE in the background, when the page is idle
 * after the first paint, and every place that shows it (the dots on the account button, the panel, the
 * phone's sheet) reads that one answer. Until it is known nothing says «not connected».
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appleState, askApple, checkAppleWhenIdle, forgetApple, APPLE_STATE_EVENT, hasSignOfAuthorization, rememberApple, APPLE_FLAG } from '../../../public/js/components/navigation/appleState.js'

describe('appleState: one answer, asked once', () => {
    let authorized, service, win
    beforeEach(() => {
        forgetApple()
        authorized = false
        service = { isAuthorized: vi.fn(() => authorized), checkAuthorization: vi.fn(async () => authorized) }
        win = new EventTarget()
    })

    it('knows nothing before it is asked, and asking is not done by looking', () => {
        expect(appleState(service)).toBe('unknown')
        expect(service.checkAuthorization).not.toHaveBeenCalled()
    })

    it('pending: says «checking» while the answer is on its way, and asks only once however many ask', async () => {
        let answer
        service.checkAuthorization = vi.fn(() => new Promise(resolve => { answer = resolve }))
        const first = askApple(service, win)
        const second = askApple(service, win)
        expect(appleState(service)).toBe('checking')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
        authorized = true
        answer(true)
        await Promise.all([first, second])
        expect(appleState(service)).toBe('connected')
    })

    it('authorized on an earlier visit: connected, and it is not asked again', async () => {
        service.checkAuthorization = vi.fn(async () => { authorized = true; return true }) // MusicKit says so once started
        await askApple(service, win)
        await askApple(service, win)
        expect(appleState(service)).toBe('connected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('not authorized: disconnected, and it is not asked again', async () => {
        await askApple(service, win)
        await askApple(service, win)
        expect(appleState(service)).toBe('disconnected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('failed: says «failed» (never «disconnected»), and the next ask tries again', async () => {
        service.checkAuthorization = vi.fn(async () => { throw new Error('token route down') })
        const noise = vi.spyOn(console, 'error').mockImplementation(() => { })
        await askApple(service, win)
        expect(appleState(service)).toBe('failed')
        expect(noise).not.toHaveBeenCalled() // a blocked or failed script prints nothing: the state says it where the person asked
        service.checkAuthorization = vi.fn(async () => true)
        authorized = true
        await askApple(service, win)
        expect(appleState(service)).toBe('connected')
    })

    it('an answer is remembered for the next visit: connected leaves the flag, not connected takes it away', async () => {
        const s = { length: 0, key: () => null, getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() }
        service.checkAuthorization = vi.fn(async () => { authorized = true; return true })
        await askApple(service, win, s)
        expect(s.setItem).toHaveBeenCalledWith(APPLE_FLAG, '1')
        forgetApple(); authorized = false
        service.checkAuthorization = vi.fn(async () => false)
        await askApple(service, win, s)
        expect(s.removeItem).toHaveBeenCalledWith(APPLE_FLAG)
    })

    it('announces the answer, so who shows it can draw it', async () => {
        const heard = vi.fn()
        win.addEventListener(APPLE_STATE_EVENT, heard)
        await askApple(service, win)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('a connect or a disconnect after the answer is followed, with no new ask', async () => {
        await askApple(service, win)
        authorized = true
        expect(appleState(service)).toBe('connected')
        authorized = false
        expect(appleState(service)).toBe('disconnected')
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })
})

describe('the sign that Apple Music was authorized before, without loading Apple\'s script', () => {
    const store = (entries = {}) => ({ length: Object.keys(entries).length, key: (i) => Object.keys(entries)[i], getItem: (k) => entries[k] ?? null, setItem: vi.fn(), removeItem: vi.fn() })

    it('nothing stored: no sign', () => {
        expect(hasSignOfAuthorization(store())).toBe(false)
        expect(hasSignOfAuthorization(store({ unrelated: '1' }))).toBe(false)
    })

    it('the flag our own code left when the person authorized: a sign', () => {
        expect(hasSignOfAuthorization(store({ [APPLE_FLAG]: '1' }))).toBe(true)
    })

    it('the media user token MusicKit itself keeps after an authorization: a sign', () => {
        expect(hasSignOfAuthorization(store({ 'music.abc123.media-user-token': 'x' }))).toBe(true)
    })

    it('storage that throws (blocked): no sign, no error', () => {
        const blocked = { get length() { throw new Error('blocked') } }
        expect(hasSignOfAuthorization(blocked)).toBe(false)
    })

    it('remembers a connection with a bare flag (no personal data) and forgets it on a disconnect', () => {
        const s = store()
        rememberApple(true, s)
        expect(s.setItem).toHaveBeenCalledWith(APPLE_FLAG, '1')
        rememberApple(false, s)
        expect(s.removeItem).toHaveBeenCalledWith(APPLE_FLAG)
    })
})

describe('checkAppleWhenIdle: after the first paint, never before; and only for who authorized before', () => {
    let service
    const sign = { length: 1, key: () => APPLE_FLAG, getItem: () => '1' }
    const noSign = { length: 0, key: () => null, getItem: () => null }
    beforeEach(() => {
        forgetApple()
        service = { isAuthorized: () => false, checkAuthorization: vi.fn(async () => false) }
    })

    it('waits for the page to be idle, with a timeout so it does come', () => {
        const win = Object.assign(new EventTarget(), { document: { readyState: 'complete' }, requestIdleCallback: vi.fn() })
        checkAppleWhenIdle(win, service, sign)
        expect(service.checkAuthorization).not.toHaveBeenCalled()
        expect(win.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: expect.any(Number) })
        win.requestIdleCallback.mock.calls[0][0]()
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
    })

    it('without requestIdleCallback (Safari), a short timer does the same', () => {
        vi.useFakeTimers()
        const win = Object.assign(new EventTarget(), { document: { readyState: 'complete' }, setTimeout: (fn, ms) => setTimeout(fn, ms) })
        checkAppleWhenIdle(win, service, sign)
        expect(service.checkAuthorization).not.toHaveBeenCalled()
        vi.runAllTimers()
        expect(service.checkAuthorization).toHaveBeenCalledTimes(1)
        vi.useRealTimers()
    })

    it('with no sign of an authorization: nothing is scheduled and nothing is asked, so nothing is loaded from Apple', () => {
        const win = Object.assign(new EventTarget(), { document: { readyState: 'complete' }, requestIdleCallback: vi.fn(), setTimeout: vi.fn() })
        checkAppleWhenIdle(win, service, noSign)
        expect(win.requestIdleCallback).not.toHaveBeenCalled()
        expect(win.setTimeout).not.toHaveBeenCalled()
        expect(service.checkAuthorization).not.toHaveBeenCalled()
        expect(appleState(service)).toBe('unknown') // no claim either way
    })

    it('while the page is still loading, nothing is scheduled until it has loaded', () => {
        const win = Object.assign(new EventTarget(), { document: { readyState: 'loading' }, requestIdleCallback: vi.fn() })
        checkAppleWhenIdle(win, service, sign)
        expect(win.requestIdleCallback).not.toHaveBeenCalled()
        win.dispatchEvent(new Event('load'))
        expect(win.requestIdleCallback).toHaveBeenCalledTimes(1)
    })
})
