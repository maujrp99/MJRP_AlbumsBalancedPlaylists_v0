/**
 * albumLoadHold
 *
 * The hold of the album load, as pure functions (F58; arch.md, "Carga da tela de álbuns"). The
 * app's own server said "sign in", "wait" or "the ratings source is busy": nothing failed, the
 * load waits. The hold is state, `{ reason, until }` or null, kept in AlbumLoadStore:
 *
 *   reason  one of HoldReason (models/albumLoadState.js)
 *   until   the time, in ms, the hold ends by itself; null for "sign in", which only the person
 *           (or a new load) ends
 *
 * These functions say what the hold becomes and what follows from a change. They start no timer,
 * stop no queue and tell nobody: LoadHold (services/albums/LoadHold.js) does that.
 */

import { HoldReason } from './albumLoadState.js'

const isSignIn = (hold) => hold?.reason === HoldReason.UNAUTHORIZED

/**
 * The hold after the server said `heard`. "Sign in" wins over "wait" and has no end of its own;
 * "wait" stretches the hold to the latest time asked and never shortens it. The same object comes
 * back when nothing changed.
 * @param {{ reason: string, until: number|null }|null} hold - the hold in force
 * @param {{ reason: string, retryAfterMs?: number }} heard - what a port's error carried
 * @param {number} now - ms
 * @returns {{ reason: string, until: number|null }}
 */
export function holdAfter(hold, { reason, retryAfterMs = 0 }, now) {
    if (isSignIn(hold)) return hold
    if (reason === HoldReason.UNAUTHORIZED) return { reason, until: null }

    const until = now + retryAfterMs
    if (!hold) return { reason, until }
    return until > hold.until ? { ...hold, until } : hold
}

/** The person is told when a hold starts and when a "wait" becomes "sign in"; not when it stretches. */
export function isNewsToThePerson(before, after) {
    return !before || (isSignIn(after) && !isSignIn(before))
}

/**
 * Does the queue that only talks to the app's server stop? Yes when that server said "wait" to
 * it, or "sign in" to anyone. The other queues also reach other sources, so they go on.
 * @param {{ reason: string }} hold - the hold after what was heard
 * @param {boolean} heardOnServerQueue - the answer came to a task of that queue
 * @returns {boolean}
 */
export function stopsServerQueue(hold, heardOnServerQueue) {
    return heardOnServerQueue || isSignIn(hold)
}

/** In how many ms the hold ends by itself, or null when it does not ("sign in", no hold). */
export function resumesIn(hold, now) {
    if (!hold || hold.until === null) return null
    return Math.max(0, hold.until - now)
}
