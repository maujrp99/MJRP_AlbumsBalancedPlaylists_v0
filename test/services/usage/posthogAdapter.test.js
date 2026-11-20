/**
 * F77, REQ-03, REQ-04: the PostHog adapter, set for privacy while the product has one person and
 * no consent screen. The real library is never started here: a fake client records what the
 * adapter asks of it.
 */
import { describe, it, expect } from 'vitest'
import {
    createPosthogAdapter, posthogOptions, withoutPageAddress, DEFAULT_HOST, PAGE_ADDRESS_PROPERTIES
} from '../../../public/js/services/usage/posthogAdapter.js'

const fakeClient = () => {
    const calls = { init: [], capture: [], register: [], identify: [] }
    return {
        calls,
        init: (key, options) => calls.init.push({ key, options }),
        capture: (name, properties) => calls.capture.push({ name, properties }),
        register: (properties) => calls.register.push(properties),
        identify: (...args) => calls.identify.push(args)
    }
}

describe('the options the library is started with', () => {
    const options = posthogOptions('https://eu.i.posthog.com')

    it('nothing is captured by itself: no autocapture, no page views, no recording, no heatmaps, no errors', () => {
        expect(options).toMatchObject({
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false,
            disable_session_recording: true,
            capture_heatmaps: false,
            capture_dead_clicks: false,
            capture_exceptions: false,
            capture_performance: false,
            rageclick: false
        })
    })

    it('nothing is kept in the browser: memory only, no cookie', () => {
        expect(options.persistence).toBe('memory')
        expect(options.disable_persistence).toBe(true)
    })

    it('no person profile, no referrer, no campaign parameters, and Do Not Track is respected', () => {
        expect(options).toMatchObject({
            person_profiles: 'never',
            save_referrer: false,
            save_campaign_params: false,
            mask_personal_data_properties: true,
            disable_capture_url_hashes: true,
            respect_dnt: true
        })
    })

    it('no code is loaded from outside and no flags are asked for', () => {
        expect(options).toMatchObject({
            disable_external_dependency_loading: true,
            advanced_disable_flags: true,
            disable_surveys: true,
            disable_web_experiments: true,
            disable_product_tours: true,
            disable_conversations: true
        })
    })

    it('the address of the page never leaves: every event goes through withoutPageAddress', () => {
        expect(options.before_send).toBe(withoutPageAddress)
        expect(options.property_denylist).toEqual(PAGE_ADDRESS_PROPERTIES)
    })

    it('the host is the one given, and the EU cloud when none is', () => {
        expect(options.api_host).toBe('https://eu.i.posthog.com')
        expect(DEFAULT_HOST).toBe('https://eu.i.posthog.com')
        expect(posthogOptions('').api_host).toBe(DEFAULT_HOST)
        expect(posthogOptions(undefined).api_host).toBe(DEFAULT_HOST)
        expect(posthogOptions('https://us.i.posthog.com').api_host).toBe('https://us.i.posthog.com')
    })
})

describe('withoutPageAddress', () => {
    it('takes out of an event the address of the page, the referrer and what the library sets on a person', () => {
        const event = {
            event: 'screen_viewed',
            properties: {
                screen: 'series',
                $current_url: 'https://site.web.app/albums/SERIES_ID?q=radiohead',
                $pathname: '/albums/SERIES_ID',
                $referrer: 'https://www.google.com/',
                $referring_domain: 'www.google.com',
                $browser: 'Safari'
            },
            $set: { $current_url: 'x' },
            $set_once: { $initial_current_url: 'x' }
        }
        const sent = withoutPageAddress(event)

        expect(sent.properties).toEqual({ screen: 'series', $browser: 'Safari' })
        expect(sent).not.toHaveProperty('$set')
        expect(sent).not.toHaveProperty('$set_once')
    })

    it('an event with no properties passes', () => {
        expect(withoutPageAddress({ event: 'sign_out' })).toEqual({ event: 'sign_out' })
        expect(withoutPageAddress(null)).toBeNull()
    })
})

describe('createPosthogAdapter', () => {
    it('starts the library with the key and the options, and says which client sends', () => {
        const client = fakeClient()
        createPosthogAdapter({ key: 'project-key', host: 'https://eu.i.posthog.com', client })

        expect(client.calls.init).toHaveLength(1)
        expect(client.calls.init[0].key).toBe('project-key')
        expect(client.calls.init[0].options.api_host).toBe('https://eu.i.posthog.com')
        expect(client.calls.register).toEqual([{ platform: 'web' }])
    })

    it('sends the event checked by the port, by its name, with its properties', () => {
        const client = fakeClient()
        const adapter = createPosthogAdapter({ key: 'project-key', client })
        adapter.send({ ok: true, name: 'buy_link_opened', properties: { store: 'amazon', place: 'card' } })

        expect(client.calls.capture).toEqual([{ name: 'buy_link_opened', properties: { store: 'amazon', place: 'card' } }])
    })

    it('never tells the service who the person is', () => {
        const client = fakeClient()
        const adapter = createPosthogAdapter({ key: 'project-key', client })
        adapter.send({ ok: true, name: 'sign_in', properties: { provider: 'google' } })

        expect(client.calls.identify).toEqual([])
    })
})
