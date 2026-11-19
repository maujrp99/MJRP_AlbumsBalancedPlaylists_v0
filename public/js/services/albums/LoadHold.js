/**
 * LoadHold
 *
 * The hold of the album load, in force (F52; a collaborator of AlbumLoadService since F58). A
 * port may throw an error with `hold: { reason, retryAfterMs? }` when the app's own server said
 * "sign in", "wait" or "the ratings source is busy". That is not a failure of the album: the ask
 * waits and goes again when the hold ends.
 *
 * What the hold IS, and what it becomes, are the pure rules of models/albumLoadHold.js. This
 * object does what follows from them, and only that:
 *   - publishes each change of the hold (the service writes it into AlbumLoadStore, so whoever
 *     reads the load learns of a hold from the store, like any other change);
 *   - stops and starts the queue that only talks to the app's server;
 *   - ends a "wait" by itself, at the time the server gave;
 *   - tells the person once per hold, and "sign in" once per load;
 *   - adds a task to a queue so that a hold is waited for and the task asked again (add()).
 *
 * It imports no store, no network and no screen: the queue and the two doors out are given.
 */

import { TaskCancelledError } from '../../utils/TaskQueue.js'
import { HoldReason } from '../../models/albumLoadState.js'
import { holdAfter, isNewsToThePerson, stopsServerQueue, resumesIn } from '../../models/albumLoadHold.js'

export class LoadHold {
    /**
     * @param {Object} deps
     * @param {TaskQueue} deps.serverQueue - the queue that only talks to the app's server
     * @param {Function} deps.publish - (hold|null) => void, on every change of the hold
     * @param {Function} [deps.onNotice] - ({ reason, until }) => void, what the person is told
     * @param {Function} [deps.now]
     */
    constructor({ serverQueue, publish, onNotice = null, now = () => Date.now() }) {
        this.serverQueue = serverQueue
        this.publish = publish
        this.onNotice = onNotice
        this.now = now
        this._hold = null // { reason, until } while the server asked to hold
        this._timer = null // ends a "wait" at its time
        this._ended = null // Promise that resolves when the hold in force ends
        this._release = null
        this._saidSignIn = false // "sign in" is told once per load, however many times it is heard
    }

    /** The hold in force: `{ reason, until }` or null. */
    get current() {
        return this._hold
    }

    /**
     * The server said "sign in" or "wait" to a task of `queue`: start a hold, or stretch the one
     * in force.
     * @param {{ reason: string, retryAfterMs?: number }} heard
     * @param {TaskQueue} queue - the queue of the task that heard it
     */
    hear(heard, queue) {
        const now = this.now()
        const before = this._hold
        const after = holdAfter(before, heard, now)

        if (stopsServerQueue(after, queue === this.serverQueue)) this.serverQueue.pause()
        if (after === before) return

        this._put(after)
        this._endBy(resumesIn(after, now))
        if (isNewsToThePerson(before, after)) this._tell(after)
    }

    /** End the hold now: the server queue starts again and what was waiting is asked again. */
    end() {
        if (!this._hold) return
        const release = this._release
        this._hold = null
        this._ended = null
        this._release = null
        clearTimeout(this._timer)
        this.serverQueue.resume()
        this.publish(null)
        release()
    }

    /** End the hold only if it is of this reason (a "sign in" ends when the person asks again). */
    endIf(reason) {
        if (this._hold?.reason === reason) this.end()
    }

    /** A new load: no hold, and "sign in" may be said again. */
    startLoad() {
        this.end()
        this._saidSignIn = false
    }

    /**
     * Add a task to a queue. If it ends with an error that carries a hold, nothing has failed: wait
     * for the hold to end and add it again. Any other error, and a hold of a load that is no longer
     * the current one, goes on to the caller.
     * @param {TaskQueue} queue
     * @param {Function} task - (context) => Promise
     * @param {Object} options - the options of TaskQueue.add
     * @param {Function} isCurrent - () => boolean, false once the load that asked is over
     */
    async add(queue, task, options, isCurrent) {
        // The hold starts inside the task, before the queue frees its slot: no other ask starts in between
        const heldTask = async (context) => {
            try {
                return await task(context)
            } catch (error) {
                if (error?.hold && isCurrent()) this.hear(error.hold, queue)
                throw error
            }
        }
        for (;;) {
            try {
                return await queue.add(heldTask, options)
            } catch (error) {
                if (!error?.hold || !isCurrent()) throw error
                if (this._ended) await this._ended
                if (!isCurrent()) throw new TaskCancelledError()
            }
        }
    }

    _put(hold) {
        if (!this._hold) this._ended = new Promise(resolve => { this._release = resolve })
        this._hold = hold
        this.publish(hold)
    }

    /** A hold with a time ends by itself then; one without ("sign in") waits to be ended. */
    _endBy(ms) {
        clearTimeout(this._timer)
        this._timer = ms === null ? null : setTimeout(() => this.end(), ms)
    }

    /** One notice per hold; "sign in" only once per load, even if the screen asks and hears it again. */
    _tell(hold) {
        const signIn = hold.reason === HoldReason.UNAUTHORIZED
        if (signIn && this._saidSignIn) return
        if (signIn) this._saidSignIn = true
        if (this.onNotice) this.onNotice({ reason: hold.reason, until: hold.until })
    }
}
