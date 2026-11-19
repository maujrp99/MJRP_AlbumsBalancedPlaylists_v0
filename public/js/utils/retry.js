/**
 * retry - call again after a failure that may pass, with growing waits and jitter (DP-23).
 *
 * Knows nothing about the project: the caller says which failures may pass (`shouldRetry`) and
 * how to wait (`pause`). There is a ceiling on the number of attempts and on each wait.
 * Use it only for a call that is safe to repeat and that already has a deadline (DP-22).
 */

const defaultPause = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * The wait before new attempt number `retryIndex` (0 for the first new attempt):
 * min(capMs, baseMs × 2^retryIndex), of which the upper half is drawn ("equal jitter").
 * @returns {number} milliseconds, between half the step and the whole step
 */
export function backoffWaitMs(retryIndex, { baseMs = 1000, capMs = 8000, random = Math.random } = {}) {
    const step = Math.min(capMs, baseMs * 2 ** retryIndex)
    const half = step / 2
    return Math.round(half + random() * half)
}

/**
 * @param {Function} attempt - (attemptNumber) => Promise<any>; attemptNumber starts at 0
 * @param {Object} [options]
 * @param {number} [options.retries=2] - new attempts after the first call
 * @param {number} [options.baseMs=1000] - the first wait, before the draw
 * @param {number} [options.capMs=8000] - no wait is longer than this
 * @param {Function} [options.shouldRetry] - (error) => boolean; a failure that will not pass is thrown at once
 * @param {Function} [options.pause] - (ms) => Promise<void>
 * @param {Function} [options.random] - () => number in [0, 1]
 * @param {Function} [options.onRetry] - ({ attempt, waitMs, error }) => void, before each wait
 * @returns {Promise<any>} what `attempt` returned; throws the last real error when it gives up
 */
export async function retryWithBackoff(attempt, {
    retries = 2,
    baseMs = 1000,
    capMs = 8000,
    shouldRetry = () => true,
    pause = defaultPause,
    random = Math.random,
    onRetry = null
} = {}) {
    for (let attemptNumber = 0; ; attemptNumber++) {
        try {
            return await attempt(attemptNumber)
        } catch (error) {
            if (attemptNumber >= retries || !shouldRetry(error)) throw error
            const waitMs = backoffWaitMs(attemptNumber, { baseMs, capMs, random })
            if (onRetry) onRetry({ attempt: attemptNumber + 1, waitMs, error })
            await pause(waitMs)
        }
    }
}
