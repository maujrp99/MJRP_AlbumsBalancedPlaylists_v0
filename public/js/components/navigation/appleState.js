/**
 * appleState - the ONE answer to «is Apple Music connected?» (F88, the judge's P1-1). MusicKit keeps the
 * authorization across visits but only says so once started, and starting it loads Apple's script: so it
 * is asked ONCE, in the background, when the page is idle after the first paint, and everyone who shows
 * it (the dots on the account button, the panel, the phone's sheet) reads this answer instead of asking.
 * Until it is known nothing says «not connected»: the state is `unknown` or `checking`, never a guess.
 */
import { musicKitService } from '../../services/MusicKitService.js'

/** Heard on the window when the answer arrives (or fails). */
export const APPLE_STATE_EVENT = 'applemusic-state-known'

/** The longest the idle wait lasts before the check goes anyway; and, without requestIdleCallback, the wait. */
const IDLE_TIMEOUT_MS = 4000
const FALLBACK_DELAY_MS = 1500

let answered = false
let failed = false
let pending = null

/** For tests: forget everything known. */
export function forgetApple() {
    answered = false
    failed = false
    pending = null
}

/**
 * @returns {'connected'|'disconnected'|'checking'|'failed'|'unknown'} what is true now: once the answer is
 * known the service itself is followed (a connect or a disconnect needs no new ask); `unknown` is «not asked yet».
 */
export function appleState(service = musicKitService) {
    if (service.isAuthorized()) {
        answered = true
        return 'connected'
    }
    if (answered) return 'disconnected'
    if (pending) return 'checking'
    return failed ? 'failed' : 'unknown'
}

/**
 * Asks MusicKit once; whoever asks while it is on its way gets the same wait. Never rejects: a failure is a state.
 * @returns {Promise<void>}
 */
export function askApple(service = musicKitService, win = window) {
    const state = appleState(service)
    if (state === 'connected' || state === 'disconnected') return Promise.resolve()
    if (pending) return pending
    failed = false
    pending = service.checkAuthorization()
        .then(() => { answered = true }, (error) => {
            failed = true
            console.error('[appleState] Apple Music could not be checked:', error)
        })
        .finally(() => {
            pending = null
            win.dispatchEvent(new Event(APPLE_STATE_EVENT))
        })
    return pending
}

/** Starts the check when the page has loaded and is idle: after the first paint, never before. */
export function checkAppleWhenIdle(win = window, service = musicKitService) {
    const run = () => { askApple(service, win) }
    const schedule = () => {
        if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
        else win.setTimeout(run, FALLBACK_DELAY_MS)
    }
    if (win.document.readyState === 'complete') schedule()
    else win.addEventListener('load', schedule, { once: true })
}
