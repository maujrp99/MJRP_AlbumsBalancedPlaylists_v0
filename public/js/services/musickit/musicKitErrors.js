/**
 * The answers of Apple Music a caller must be able to tell from any other failure (F98, UAT-307), as services/spotify/spotifyErrors.js
 * does for Spotify.
 *
 * What MusicKit throws was not read from a real refused account (the stand-ins of the tests and of the browser proof throw an Error with
 * a `status`). So the reading has slack: the error code MusicKit documents (on `errorCode` or `name`), the status of the answer wherever
 * it is kept, and, last, the words. What is not recognised stays what it was: a failure, never a refusal and never «not found».
 */

/**
 * Apple Music refused the person: no subscription, an authorization that was revoked or expired, 401 or 403 of the API. It is not
 * "not found": nothing was looked for. `detail` keeps what Apple said, for the console.
 */
export class AppleMusicRefusedError extends Error {
    /** @param {string|null} detail - the message of Apple Music, when it gave one */
    constructor(detail = null) {
        super('Apple Music did not allow this account.')
        this.name = 'AppleMusicRefusedError'
        this.detail = detail
    }
}

/** The person did not authorize: Apple's window was closed, or the answer was no. Only the person can change that. */
export class AppleMusicAuthorizationError extends Error {
    /** @param {string|null} detail - what MusicKit said, when it said something */
    constructor(detail = null) {
        super('Apple Music was not authorized.')
        this.name = 'AppleMusicAuthorizationError'
        this.detail = detail
    }
}

/** The codes of MusicKit that mean «not for this person, as things are». */
const REFUSAL_CODES = Object.freeze(['ACCESS_DENIED', 'AUTHORIZATION_ERROR', 'UNAUTHORIZED_ERROR', 'SUBSCRIPTION_ERROR', 'TOKEN_EXPIRED'])
const REFUSAL_STATUS = Object.freeze([401, 403])
const REFUSAL_WORDS = /\b(401|403)\b|forbidden|unauthorized/i

/** The status of the answer, wherever the error keeps it. */
function statusOf(error) {
    const kept = [error.status, error.response?.status, error.data?.status, error.httpStatusCode]
    return Number(kept.find(status => status !== undefined && status !== null)) || null
}

/**
 * Did Apple Music refuse the person?
 * @param {unknown} error - what a call to MusicKit threw
 * @returns {boolean}
 */
export function isRefusal(error) {
    if (!error) return false
    if (error instanceof AppleMusicRefusedError) return true
    if (REFUSAL_CODES.includes(error.errorCode) || REFUSAL_CODES.includes(error.name)) return true
    const status = statusOf(error)
    if (status) return REFUSAL_STATUS.includes(status)
    return REFUSAL_WORDS.test(String(error.message || ''))
}

/**
 * The error to throw for a failure of a MusicKit call: the refusal with its name, or the error as it came.
 * @param {unknown} error
 * @returns {unknown}
 */
export function namedError(error) {
    if (error instanceof AppleMusicRefusedError || !isRefusal(error)) return error
    return new AppleMusicRefusedError(error?.message || null)
}
