/**
 * timeBudget - the whole time one request of the app may take on this server (F52, slice 3).
 *
 * The app waits a fixed time for an answer and then gives up. The server has to answer before
 * that, whatever the outside source is doing: `createBudget({ ms })` fixes the deadline when the
 * request arrives, the work below reads `deadlineAt` to stop asking the source, and `race(work)`
 * answers `upstream_timeout` at the deadline even if the work is still running.
 *
 * No real time here: `now`, `setTimer` and `clearTimer` are injected (the defaults are the real ones).
 */
const { UpstreamError } = require('./outcome')

/**
 * @param {Object} options
 * @param {number} options.ms - the whole time of the request
 * @param {Function} [options.now] - () => ms
 * @param {Function} [options.setTimer] - (fn, ms) => handle
 * @param {Function} [options.clearTimer] - (handle) => void
 */
function createBudget ({ ms, now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout }) {
  const deadlineAt = now() + ms

  /**
   * @param {Promise} work
   * @param {string} source - the name for the log, e.g. 'BestEverAlbums'
   * @returns {Promise<*>} what the work gave, or its own error, when it ended in time
   * @throws {UpstreamError} upstream_timeout when the deadline came first (the work is not stopped
   *         here: it stops itself at its next step, by reading `deadlineAt`)
   */
  function race (work, source) {
    let timer
    const deadline = new Promise((resolve, reject) => {
      timer = setTimer(() => reject(new UpstreamError('upstream_timeout', `${source}: no answer within ${ms} ms`)), Math.max(0, deadlineAt - now()))
    })
    return Promise.race([work, deadline]).finally(() => clearTimer(timer))
  }

  return { deadlineAt, remainingMs: () => Math.max(0, deadlineAt - now()), race }
}

module.exports = { createBudget }
