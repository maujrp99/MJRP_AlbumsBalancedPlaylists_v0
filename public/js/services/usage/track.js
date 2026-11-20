/**
 * track - the app's one door to the measurement of use (F77, REQ-01, REQ-04).
 *
 * Every place that measures calls `track(name, properties)` or `screen(name)`, after the action
 * it measures has worked. Nothing else of the app knows which service measures: this file checks
 * the event against the shared list (`shared/usageEvents.js`, which drops what is not on it) and
 * hands it to the adapter in use. Which adapter, and whether there is one, is decided once, when
 * the app starts (services/usage/usageWiring.js).
 *
 *   off      no adapter: track does nothing (the default, and what tests see)
 *   loading  the adapter is on its way: up to MAX_WAITING events wait for it, then go in order
 *   on       each event goes to the adapter at once
 *
 * The measurement never stands in the way of the app: track never throws, never waits, and an
 * adapter that fails to load or to send turns into "nothing was measured", said in the console.
 */
import { describeEvent } from '@shared/usageEvents.js'

/** How many events wait while the adapter loads (a first screen and a few actions; never a leak). */
const MAX_WAITING = 100

const state = { mode: 'off', adapter: null, waiting: [] }

/** 'off' | 'loading' | 'on' */
export const usageState = () => state.mode

function deliver(event) {
    if (state.adapter) {
        state.adapter.send(event)
        return
    }
    if (state.waiting.length < MAX_WAITING) state.waiting.push(event)
}

/**
 * Measure one thing the person did.
 * @param {string} name - one of the events of shared/usageEvents.js
 * @param {Object} [properties] - what is said of it; what the list does not allow is dropped
 * @returns {boolean} true when the event was handed on (or is waiting for the adapter)
 */
export function track(name, properties = {}) {
    if (state.mode === 'off') return false
    try {
        const event = describeEvent(name, properties)
        if (!event.ok) {
            console.warn(`[usage] "${name}" is not an event of shared/usageEvents.js: not sent`)
            return false
        }
        deliver(event)
        return true
    } catch (error) {
        console.warn('[usage] the event could not be handed on:', error?.message || error)
        return false
    }
}

/**
 * The person opened a screen.
 * @param {string} name - one of SCREENS of shared/usageEvents.js (a name, never an address)
 */
export const screen = (name) => track('screen_viewed', { screen: name })

/** Turn the measurement off: nothing is sent from now on, and what was waiting is dropped. */
export function stopUsage() {
    state.mode = 'off'
    state.adapter = null
    state.waiting = []
}

/**
 * Turn the measurement on with the adapter `loadAdapter` gives. The events of the meantime wait.
 * @param {{ loadAdapter: () => Promise<{ send: Function }> }} options
 * @returns {Promise<void>} settles when the adapter is in use, or the measurement is off again
 */
export async function startUsage({ loadAdapter }) {
    state.mode = 'loading'
    try {
        const adapter = await loadAdapter()
        state.adapter = adapter
        state.mode = 'on'
        const waiting = state.waiting
        state.waiting = []
        waiting.forEach(event => adapter.send(event))
    } catch (error) {
        stopUsage()
        console.warn('[usage] the measurement could not start, nothing will be measured:', error?.message || error)
    }
}
