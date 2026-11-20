/**
 * posthogAdapter - the measurement sent to PostHog (F77, REQ-04). The ONLY file of the app that
 * imports the library: test/architecture/usageBehindThePort.test.js fails on any other.
 *
 * It is loaded lazily, by usageWiring.js, only when the measurement is on: with the switch off the
 * library is never downloaded and nothing is asked of any measurement host.
 *
 * The build used is `posthog-js/dist/module.no-external`: no code is ever loaded from PostHog
 * (no replay, no surveys, no toolbar). https://posthog.com/docs/libraries/js
 *
 * The options are set for privacy while the product has one person and no consent screen
 * (each one documented at https://posthog.com/docs/libraries/js/config, and in the types of the
 * package, @posthog/types/dist/posthog-config.d.ts):
 *   - nothing captured by itself: autocapture, page views and page leaves, session recording,
 *     heatmaps, dead clicks, rage clicks, exceptions and performance are off. The app sends its own
 *     events, and the screen by its name, never by its address (which holds the ids of a series);
 *   - nothing kept in the browser: `persistence: 'memory'` and `disable_persistence`: no cookie,
 *     no localStorage. The anonymous id lives as long as the page;
 *   - no person profile (`person_profiles: 'never'`); no referrer, no campaign parameters, the
 *     personal parameters of an address masked, the hash of an address not read;
 *   - no request for flags, surveys, experiments, tours or chat;
 *   - `before_send` takes the address of the page out of every event (withoutPageAddress), and
 *     `property_denylist` names the same properties;
 *   - identify is never called: the anonymous id of the service is enough.
 * The IP: the `ip` option has no effect any more. What keeps the IP out is the project setting
 * "IP data capture configuration" (Settings > Project > Privacy), off by default in the EU cloud.
 */
import posthog from 'posthog-js/dist/module.no-external'

/** The EU cloud: IP capture is off by default there, and the data stays under the GDPR. */
export const DEFAULT_HOST = 'https://eu.i.posthog.com'

/** What the library puts in an event that says where the person was or came from. */
export const PAGE_ADDRESS_PROPERTIES = Object.freeze([
    '$current_url', '$pathname', '$referrer', '$referring_domain',
    '$initial_current_url', '$initial_pathname', '$initial_referrer', '$initial_referring_domain',
    '$prev_pageview_pathname', '$prev_pageview_url'
])

/**
 * The event without the address of the page and without what the library would set on a person.
 * @param {Object|null} event - what the library is about to send (CaptureResult)
 * @returns {Object|null}
 */
export function withoutPageAddress(event) {
    if (!event) return event
    const sent = { ...event }
    delete sent.$set
    delete sent.$set_once
    if (sent.properties) {
        sent.properties = { ...sent.properties }
        PAGE_ADDRESS_PROPERTIES.forEach(name => delete sent.properties[name])
    }
    return sent
}

/**
 * @param {string} [host] - where the events go; the EU cloud when none is given
 * @returns {Object} the options of posthog.init
 */
export function posthogOptions(host) {
    return {
        api_host: host || DEFAULT_HOST,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        capture_performance: false,
        rageclick: false,
        persistence: 'memory',
        disable_persistence: true,
        person_profiles: 'never',
        save_referrer: false,
        save_campaign_params: false,
        mask_personal_data_properties: true,
        disable_capture_url_hashes: true,
        respect_dnt: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        disable_surveys: true,
        disable_web_experiments: true,
        disable_product_tours: true,
        disable_conversations: true,
        property_denylist: PAGE_ADDRESS_PROPERTIES,
        before_send: withoutPageAddress
    }
}

/**
 * @param {Object} given
 * @param {string} given.key - the project key (public by nature: it only lets one send events)
 * @param {string} [given.host]
 * @param {Object} [given.client] - the library; a fake one in tests
 * @returns {{ send: (event: { name: string, properties: Object }) => void }}
 */
export function createPosthogAdapter({ key, host, client = posthog }) {
    client.init(key, posthogOptions(host))
    // Which client sent the event: the phone app (F78) registers its own
    client.register({ platform: 'web' })
    return { send: ({ name, properties }) => client.capture(name, properties) }
}
