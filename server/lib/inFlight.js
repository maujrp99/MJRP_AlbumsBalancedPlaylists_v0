/**
 * inFlight - identical requests that arrive at the same time share one piece of work (F52, slice 3).
 *
 * `share(key, start)`: when work for that key is already running, the caller joins it and gets the
 * same result (or the same failure); otherwise `start()` runs. The key is forgotten the moment the
 * work ends: nothing is remembered from one request to the next, neither a result nor a failure.
 * It is not a cache.
 *
 * PER INSTANCE: the map lives in the memory of one server process.
 */
function createInFlight () {
  const flying = new Map() // Map<key, Promise>

  /**
   * @param {string} key
   * @param {Function} start - () => Promise, called only when nothing is running for the key
   * @returns {{ promise: Promise, joined: boolean }} joined: the work was already running
   */
  function share (key, start) {
    const running = flying.get(key)
    if (running) return { promise: running, joined: true }

    const promise = Promise.resolve().then(start).finally(() => flying.delete(key))
    flying.set(key, promise)
    return { promise, joined: false }
  }

  return { share, size: () => flying.size }
}

module.exports = { createInFlight }
