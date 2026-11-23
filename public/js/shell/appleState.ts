/**
 * appleState - the ONE answer to «is Apple Music connected?» (F88, the judge's P1-1). MusicKit keeps the
 * authorization across visits but only says so once started, and starting it loads Apple's script: so it
 * is asked ONCE, in the background, when the page is idle after the first paint, and everyone who shows
 * it (the dots on the account button, the panel, the phone's sheet) reads this answer instead of asking.
 * Until it is known nothing says «not connected»: the state is `unknown` or `checking`, never a guess.
 * The background ask is made ONLY where the browser shows a sign of an earlier authorization (hasSignOfAuthorization);
 * for everyone else nothing is loaded from Apple until the panel or the sheet is opened.
 */
import { musicKitService } from '../services/MusicKitService.js'

/** Heard on the window when the answer arrives (or fails). */
export const APPLE_STATE_EVENT = 'applemusic-state-known'

/** The longest the idle wait lasts before the check goes anyway; and, without requestIdleCallback, the wait. */
const IDLE_TIMEOUT_MS = 4000
const FALLBACK_DELAY_MS = 1500

/** What our own code leaves in this browser when Apple Music is authorized: a bare flag, no personal data. */
export const APPLE_FLAG = 'albumBlender.appleMusic.authorized'
/** The key MusicKit itself keeps after an authorization (music.<id>.media-user-token). */
const MUSICKIT_TOKEN_KEY = /^music\..*media-user-token$/

/** The part of MusicKit's service this reads. */
interface AppleService {
    isAuthorized(): boolean
    checkAuthorization(): Promise<unknown>
}
type Storage = globalThis.Storage | null
export type AppleStateName = 'connected' | 'disconnected' | 'checking' | 'failed' | 'unknown'

const browserStorage = (): Storage => { try { return window.localStorage } catch { return null } }

/**
 * Whether this browser shows a sign that Apple Music was authorized before, read from storage alone:
 * Apple's script is not loaded to find out.
 */
export function hasSignOfAuthorization(storage: Storage = browserStorage()): boolean {
    try {
        if (!storage) return false
        if (storage.getItem(APPLE_FLAG)) return true
        for (let i = 0; i < storage.length; i++) if (MUSICKIT_TOKEN_KEY.test(storage.key(i) || '')) return true
    } catch { /* storage blocked: no sign */ }
    return false
}

/** Leaves the flag after a connection, takes it away after a disconnect. */
export function rememberApple(connected: boolean, storage: Storage = browserStorage()): void {
    try {
        if (connected) storage?.setItem(APPLE_FLAG, '1')
        else storage?.removeItem(APPLE_FLAG)
    } catch { /* storage blocked: nothing to remember */ }
}

let answered = false
let failed = false
let pending: Promise<void> | null = null

/** For tests: forget everything known. */
export function forgetApple(): void {
    answered = false
    failed = false
    pending = null
}

/**
 * @returns what is true now: once the answer is
 * known the service itself is followed (a connect or a disconnect needs no new ask); `unknown` is «not asked yet».
 */
export function appleState(service: AppleService = musicKitService): AppleStateName {
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
export function askApple(service: AppleService = musicKitService, win: Window | EventTarget = window, storage: Storage = browserStorage()): Promise<void> {
    const state = appleState(service)
    if (state === 'connected' || state === 'disconnected') return Promise.resolve()
    if (pending) return pending
    failed = false
    pending = service.checkAuthorization()
        .then(() => { answered = true; rememberApple(service.isAuthorized(), storage) }, () => { failed = true }) // a failure is a state, never a line in the console
        .finally(() => {
            pending = null
            win.dispatchEvent(new Event(APPLE_STATE_EVENT))
        })
    return pending
}

/** Starts the check when the page has loaded and is idle: after the first paint, never before. */
export function checkAppleWhenIdle(win: Window = window, service: AppleService = musicKitService, storage: Storage = browserStorage()): void {
    // Nothing shows that this browser ever authorized Apple Music: nothing is loaded from Apple; the panel asks when it opens
    if (!hasSignOfAuthorization(storage)) return
    const run = () => { askApple(service, win, storage) }
    const schedule = () => {
        if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
        else win.setTimeout(run, FALLBACK_DELAY_MS)
    }
    if (win.document.readyState === 'complete') schedule()
    else win.addEventListener('load', schedule, { once: true })
}
