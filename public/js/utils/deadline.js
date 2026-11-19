/**
 * A promise with a deadline (F67).
 *
 * What does not answer in time ends as a failure with a name (`DeadlineError`), so the screen
 * can say "it did not answer" instead of waiting for ever. The work behind the promise is not
 * stopped (the browser offers no way to stop a MusicKit call): its late answer is simply not
 * listened to, and the caller must ignore it by identity when it keeps state.
 */

export class DeadlineError extends Error {
    /**
     * @param {string} what - what did not answer ("the catalog")
     * @param {number} ms - the deadline that passed
     */
    constructor(what, ms) {
        super(`${what} did not answer in ${ms} ms`)
        this.name = 'DeadlineError'
        this.code = 'deadline'
        this.ms = ms
    }
}

/** @returns {boolean} true when the failure is a deadline that passed */
export function isDeadlineError(error) {
    return error?.code === 'deadline'
}

/**
 * @param {Promise} promise
 * @param {number} ms - the deadline
 * @param {string} what - what is being waited for, for the message
 * @returns {Promise} the answer of the promise, or a rejection with DeadlineError
 */
export function withDeadline(promise, ms, what) {
    let timer
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new DeadlineError(what, ms)), ms)
    })
    return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}
