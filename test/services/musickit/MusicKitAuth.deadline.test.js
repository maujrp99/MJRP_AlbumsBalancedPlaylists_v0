/**
 * F67 - starting MusicKit has a deadline: a token route, a script or a `configure` that never
 * answers ends as a failure with a name, and the next ask starts again from zero.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MusicKitAuth, MUSICKIT_INIT_DEADLINE_MS } from '../../../public/js/services/musickit/MusicKitAuth.js'
import { isDeadlineError } from '../../../public/js/utils/deadline.js'

const tokenAnswer = () => ({ ok: true, json: async () => ({ token: 'test-token' }) })

describe('MusicKitAuth.init: deadline (F67)', () => {
    let auth

    beforeEach(() => {
        vi.useFakeTimers()
        auth = new MusicKitAuth()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        delete window.MusicKit
        document.head.querySelectorAll('script[src*="musickit"]').forEach(script => script.remove())
    })

    const expectDeadline = async () => {
        const seen = auth.init().catch(error => error)
        await vi.advanceTimersByTimeAsync(MUSICKIT_INIT_DEADLINE_MS)
        const error = await seen
        expect(isDeadlineError(error)).toBe(true)
        expect(error.message).toContain('MusicKit')
    }

    it('the deadline is a named constant of 10 seconds', () => {
        expect(MUSICKIT_INIT_DEADLINE_MS).toBe(10000)
    })

    it('a token route that never answers fails by deadline', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
        await expectDeadline()
    })

    it('a configure that never answers fails by deadline', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => tokenAnswer()))
        window.MusicKit = { configure: vi.fn(() => new Promise(() => {})), getInstance: vi.fn() }
        await expectDeadline()
        expect(window.MusicKit.configure).toHaveBeenCalledTimes(1)
    })

    it('a script that loads but never says it is ready fails by deadline', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => tokenAnswer()))
        const seen = auth.init().catch(error => error)
        await vi.advanceTimersByTimeAsync(0)
        document.head.querySelector('script[src*="musickit"]').onload()
        await vi.advanceTimersByTimeAsync(MUSICKIT_INIT_DEADLINE_MS)
        expect(isDeadlineError(await seen)).toBe(true)
    })

    it('after a deadline the next ask starts again and can succeed', async () => {
        const fetchMock = vi.fn(() => new Promise(() => {}))
        vi.stubGlobal('fetch', fetchMock)
        await expectDeadline()

        const instance = { storefrontId: 'us' }
        fetchMock.mockImplementation(async () => tokenAnswer())
        window.MusicKit = { configure: vi.fn(async () => {}), getInstance: () => instance }

        await expect(auth.init()).resolves.toBe(instance)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(auth.isReady()).toBe(true)
    })

    it('a late end of a start that already missed its deadline does not mark MusicKit as ready', async () => {
        let answerToken
        vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { answerToken = () => resolve(tokenAnswer()) })))
        window.MusicKit = { configure: vi.fn(() => new Promise(() => {})), getInstance: vi.fn() }
        await expectDeadline()

        answerToken()
        await vi.advanceTimersByTimeAsync(0)

        expect(auth.isReady()).toBe(false)
    })

    it('the script already on the page when it finishes loading is ready at once (no wait for an event that already passed)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => tokenAnswer()))
        const instance = { storefrontId: 'us' }
        const started = auth.init()
        await vi.advanceTimersByTimeAsync(0)

        // The script ran (MusicKit is there, its `musickitloaded` event already fired) and only then `onload` comes
        window.MusicKit = { configure: vi.fn(async () => {}), getInstance: () => instance }
        document.head.querySelector('script[src*="musickit"]').onload()

        await expect(started).resolves.toBe(instance)
    })

    it('two asks at the same time share one start', async () => {
        const fetchMock = vi.fn(async () => tokenAnswer())
        vi.stubGlobal('fetch', fetchMock)
        window.MusicKit = { configure: vi.fn(async () => {}), getInstance: () => ({}) }

        await Promise.all([auth.init(), auth.init()])

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
