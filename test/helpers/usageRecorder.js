/**
 * The measurement of use (F77) as the tests see it: the real port (services/usage/track.js), so
 * the shared list checks every event, with an adapter that keeps what it is given.
 */
import { startUsage, stopUsage } from '../../public/js/services/usage/track.js'

/**
 * Turn the measurement on for a test. Call `stopRecording()` after it (an afterEach).
 * @returns {Promise<Array<[string, Object]>>} the events sent from now on: [name, properties]
 */
export async function recordUsage() {
    const sent = []
    await startUsage({ loadAdapter: async () => ({ send: ({ name, properties }) => sent.push([name, properties]) }) })
    return sent
}

export const stopRecording = stopUsage
