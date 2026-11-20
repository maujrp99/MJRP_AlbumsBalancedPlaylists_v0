/**
 * F77, REQ-01, REQ-04: the app's one door to the measurement.
 *
 * `track` checks the event against the shared list and hands it to the adapter in use. With the
 * measurement off it does nothing; with the adapter still loading, the events wait for it; when
 * anything fails, the app goes on as if nothing was measured. It never throws.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { track, screen, startUsage, stopUsage, usageState } from '../../../public/js/services/usage/track.js'

const fakeAdapter = () => {
    const sent = []
    return { sent, send: (event) => sent.push(event) }
}

beforeEach(() => {
    stopUsage()
    vi.spyOn(console, 'warn').mockImplementation(() => { })
})

describe('with the measurement off (REQ-04)', () => {
    it('track and screen do nothing and say so', () => {
        expect(usageState()).toBe('off')
        expect(track('sign_out')).toBe(false)
        expect(screen('home')).toBe(false)
    })
})

describe('with an adapter', () => {
    it('the event goes to the adapter, cleaned by the shared list', async () => {
        const adapter = fakeAdapter()
        await startUsage({ loadAdapter: async () => adapter })

        expect(track('series_created', { album_count: 3, name: 'My 90s' })).toBe(true)
        expect(adapter.sent).toEqual([{ ok: true, name: 'series_created', properties: { album_count: 3 } }])
    })

    it('screen(name) is the event screen_viewed', async () => {
        const adapter = fakeAdapter()
        await startUsage({ loadAdapter: async () => adapter })

        screen('inventory')
        expect(adapter.sent.map(event => [event.name, event.properties])).toEqual([['screen_viewed', { screen: 'inventory' }]])
    })

    it('a name that is not on the list is not sent, and the console says why', async () => {
        const adapter = fakeAdapter()
        await startUsage({ loadAdapter: async () => adapter })

        expect(track('page_opened', {})).toBe(false)
        expect(adapter.sent).toEqual([])
        expect(console.warn).toHaveBeenCalled()
    })

    it('the events of the time the adapter was loading are sent when it arrives, in order', async () => {
        const adapter = fakeAdapter()
        let arrive
        const started = startUsage({ loadAdapter: () => new Promise(resolve => { arrive = resolve }) })

        expect(usageState()).toBe('loading')
        track('screen_viewed', { screen: 'home' })
        track('sign_in', { provider: 'google' })
        arrive(adapter)
        await started

        expect(usageState()).toBe('on')
        expect(adapter.sent.map(event => event.name)).toEqual(['screen_viewed', 'sign_in'])
    })

    it('no more than a hundred events wait for the adapter', async () => {
        const adapter = fakeAdapter()
        let arrive
        const started = startUsage({ loadAdapter: () => new Promise(resolve => { arrive = resolve }) })
        for (let index = 0; index < 150; index++) track('sign_out')
        arrive(adapter)
        await started

        expect(adapter.sent).toHaveLength(100)
    })
})

describe('nothing that fails in the measurement reaches the app', () => {
    it('an adapter that cannot be loaded turns the measurement off, and the waiting events are dropped', async () => {
        const started = startUsage({ loadAdapter: async () => { throw new Error('blocked by the browser') } })
        track('sign_out')
        await started

        expect(usageState()).toBe('off')
        expect(track('sign_out')).toBe(false)
    })

    it('an adapter that throws on send does not throw into the app', async () => {
        await startUsage({ loadAdapter: async () => ({ send: () => { throw new Error('quota') } }) })

        expect(() => track('sign_out')).not.toThrow()
        expect(track('sign_out')).toBe(false)
    })

    it('properties that are not an object do not throw', async () => {
        const adapter = fakeAdapter()
        await startUsage({ loadAdapter: async () => adapter })

        expect(() => track('sign_out', null)).not.toThrow()
        expect(() => track('series_created', 'text')).not.toThrow()
    })
})
