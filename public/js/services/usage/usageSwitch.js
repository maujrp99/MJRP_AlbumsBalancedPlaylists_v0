/**
 * usageSwitch - whether the app measures its use, and how (F77, REQ-04).
 *
 * The measurement is ON only when the build was given a project key (VITE_POSTHOG_KEY) AND
 * nobody turned it off:
 *   - the build: VITE_USAGE_MEASUREMENT=off builds a site that measures nothing, key or not;
 *   - the browser: localStorage `mjrp.usage` = `off` stops it on that browser, with no new build
 *     (in the console: localStorage.setItem('mjrp.usage', 'off'), then reload).
 * `mjrp.usage` = `debug` keeps the events in memory, on the page (window.__usageEvents), and sends
 * them nowhere, with or without a key: to see what would be measured.
 *
 * Pure but for readUsageFlag, which reads the storage it is given.
 */

export const USAGE_FLAG_KEY = 'mjrp.usage'

export const UsageMode = Object.freeze({ OFF: 'off', ON: 'on', DEBUG: 'debug' })

const word = (value) => String(value ?? '').trim().toLowerCase()

/**
 * @param {Object} given
 * @param {string} [given.key] - the project key given at build
 * @param {string} [given.buildSwitch] - VITE_USAGE_MEASUREMENT
 * @param {string|null} [given.flag] - what the browser keeps under USAGE_FLAG_KEY
 * @returns {'off'|'on'|'debug'}
 */
export function usageMode({ key, buildSwitch, flag } = {}) {
    if (word(flag) === UsageMode.DEBUG) return UsageMode.DEBUG
    if (word(flag) === UsageMode.OFF || word(buildSwitch) === UsageMode.OFF) return UsageMode.OFF
    return word(key) ? UsageMode.ON : UsageMode.OFF
}

/**
 * The flag of this browser, or null. A storage that cannot be read (a private window, a blocked
 * site) is no flag.
 * @param {Storage} [storage]
 * @returns {string|null}
 */
export function readUsageFlag(storage) {
    try {
        return storage ? storage.getItem(USAGE_FLAG_KEY) : null
    } catch {
        return null
    }
}
