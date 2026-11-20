/**
 * F77, REQ-03, REQ-04: the real library, started with the adapter's options, in the test browser.
 *
 * The last word before an event leaves is `before_send`: here it is wrapped to record what the
 * library would send and to send nothing. Proves that the options are accepted by the version
 * installed, that the address of the page is gone from what would leave, that the event carries
 * the client's name, and that nothing is written to the browser's storage or cookies.
 */
import { describe, it, expect, afterAll, vi } from 'vitest'
import { PostHog } from 'posthog-js/dist/module.no-external'
import { posthogOptions, withoutPageAddress } from '../../../public/js/services/usage/posthogAdapter.js'

describe('the real library with the adapter options', () => {
    const wouldSend = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('no network in tests')))
    const beforeCookies = document.cookie
    const beforeStorage = localStorage.length

    const client = new PostHog()
    const options = posthogOptions('https://eu.i.posthog.com')
    client.init('project-key-for-the-test', {
        ...options,
        before_send: (event) => {
            wouldSend.push(withoutPageAddress(event))
            return null
        }
    })
    client.register({ platform: 'web' })
    client.capture('screen_viewed', { screen: 'series' })

    afterAll(() => fetchSpy.mockRestore())

    it('the event would leave with its name, its property and the name of the client', () => {
        const event = wouldSend.find(item => item.event === 'screen_viewed')
        expect(event).toBeTruthy()
        expect(event.properties).toMatchObject({ screen: 'series', platform: 'web' })
    })

    it('without the address of the page', () => {
        const event = wouldSend.find(item => item.event === 'screen_viewed')
        expect(event.properties).not.toHaveProperty('$current_url')
        expect(event.properties).not.toHaveProperty('$pathname')
        expect(event.properties).not.toHaveProperty('$referrer')
    })

    it('nothing else was captured by itself: no page view, no autocapture', () => {
        expect(wouldSend.map(item => item.event)).toEqual(['screen_viewed'])
    })

    it('nothing was written to the cookies or to the storage, and nothing was sent', () => {
        expect(document.cookie).toBe(beforeCookies)
        expect(localStorage.length).toBe(beforeStorage)
        expect(fetchSpy).not.toHaveBeenCalled()
    })
})
