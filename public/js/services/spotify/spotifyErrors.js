/**
 * The answers of Spotify a caller must be able to tell from any other failure (F62; the refusal, F97).
 */

/** The access cannot be used and could not be renewed: only the person can connect again. */
export class SpotifyReconnectError extends Error {
    constructor() {
        super('Spotify needs you to connect again.')
        this.name = 'SpotifyReconnectError'
    }
}

/**
 * Spotify asked to wait (429). The text keeps "Rate Limited", which older callers look for.
 */
export class SpotifyRateLimitError extends Error {
    /** @param {number|null} retryAfterSeconds - what Spotify asked for, when it said */
    constructor(retryAfterSeconds = null) {
        super(retryAfterSeconds
            ? `Spotify asked to wait ${retryAfterSeconds} seconds before the next request (Rate Limited).`
            : 'Spotify asked to wait before the next request (Rate Limited).')
        this.name = 'SpotifyRateLimitError'
        this.retryAfterSeconds = retryAfterSeconds
    }
}

/**
 * Spotify refused the call (403): the account may not use this app (F97, UAT-302). While the app is in Spotify's
 * «Development mode» only the accounts on its user list are served; every call of any other account is answered 403.
 * It is not "not found": nothing was looked for. `detail` keeps what Spotify said, for the console.
 */
export class SpotifyRefusedError extends Error {
    /** @param {string|null} detail - the message of Spotify, when it gave one */
    constructor(detail = null) {
        super('Spotify did not allow this account.')
        this.name = 'SpotifyRefusedError'
        this.detail = detail
    }
}
