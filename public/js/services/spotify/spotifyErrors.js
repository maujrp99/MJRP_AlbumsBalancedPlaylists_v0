/**
 * The two answers of Spotify a caller must be able to tell from any other failure (F62).
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
