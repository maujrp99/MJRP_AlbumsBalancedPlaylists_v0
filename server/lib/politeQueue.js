/**
 * politeQueue - the one owner of the pace with an outside source that is scraped (F52, slice 3).
 *
 * Whoever talks to the source hands each request to `run(task, { deadlineAt })`. The queue decides
 * when it starts:
 *   - at most `concurrency` requests at once, served in the order they came;
 *   - at least `minIntervalMs` between two starts;
 *   - when the source says "busy" (the caller's `busyOf(error)` tells), nobody starts until the
 *     wait ends. The wait is the one the source asked for (Retry-After), or one that grows:
 *     baseMs, baseMs x factor, ... up to maxMs. A success ends the growth. The same request is
 *     asked again after the wait, up to `maxAttempts` times.
 *
 * It never sleeps past the deadline of a request: a wait that would end after `deadlineAt` fails
 * at once, without touching the source, as a PaceError:
 *   reason 'busy'      the source asked to wait; `retryAfterMs` says for how long from now
 *   reason 'deadline'  the queue is too long for this request's time
 *
 * PER INSTANCE: the pace lives in the memory of one server process. Two instances of the server
 * are two queues; "the server owns the pace" is true only with one instance.
 *
 * No real time here: `now` and `sleep` are injected (the defaults are the real ones).
 */

class PaceError extends Error {
  /**
   * @param {'busy'|'deadline'} reason
   * @param {Object} [options]
   * @param {number} [options.retryAfterMs] - how long the source is to be left alone, from now
   * @param {Error} [options.cause] - what the source answered, when it did
   */
  constructor (reason, { retryAfterMs = null, cause } = {}) {
    super(reason === 'busy' ? 'the source asked to wait' : 'the wait for a turn passes the deadline')
    this.name = 'PaceError'
    this.reason = reason
    this.retryAfterMs = retryAfterMs
    if (cause) this.cause = cause
  }
}

const realSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * @param {Object} options
 * @param {number} options.concurrency - requests running at once
 * @param {number} options.minIntervalMs - between two starts
 * @param {{ baseMs: number, factor: number, maxMs: number }} options.backoff - the growing wait
 * @param {number} options.maxAttempts - how many times one request is asked while the source says "busy"
 * @param {number} [options.maxRetryAfterMs] - the longest wait accepted from the source's Retry-After
 * @param {Function} options.busyOf - (error) => { retryAfterMs: number|null } when the error means "busy", else null
 * @param {Function} [options.now] - () => ms
 * @param {Function} [options.sleep] - (ms) => Promise
 */
function createPoliteQueue ({
  concurrency, minIntervalMs, backoff, maxAttempts, maxRetryAfterMs = backoff.maxMs, busyOf,
  now = () => Date.now(), sleep = realSleep
}) {
  let running = 0
  const waiting = [] // resolvers of who waits for a slot, oldest first
  let nextStartAt = 0 // no request starts before this
  let pausedUntil = 0 // the source asked to wait until this
  let busyStreak = 0 // "busy" answers in a row, for the growing wait

  const acquire = () => {
    if (running < concurrency) {
      running++
      return Promise.resolve()
    }
    return new Promise(resolve => waiting.push(resolve))
  }
  const release = () => {
    const next = waiting.shift()
    if (next) next() // the slot goes straight to who waited longest
    else running--
  }

  /** Wait for the pace and for the pause, never past the deadline. */
  async function waitTurn (deadlineAt) {
    for (;;) {
      const startAt = Math.max(nextStartAt, pausedUntil)
      const wait = startAt - now()
      if (wait <= 0 && now() <= deadlineAt) break
      if (startAt > deadlineAt || now() > deadlineAt) {
        const paused = pausedUntil > now()
        throw new PaceError(paused ? 'busy' : 'deadline', { retryAfterMs: paused ? pausedUntil - now() : null })
      }
      await sleep(wait)
    }
    nextStartAt = now() + minIntervalMs
  }

  /** The source said "busy": nobody starts before the wait ends. */
  function slowDown (retryAfterMs) {
    busyStreak++
    const asked = typeof retryAfterMs === 'number' && retryAfterMs >= 0
    const wait = asked
      ? Math.min(maxRetryAfterMs, retryAfterMs)
      : Math.min(backoff.maxMs, backoff.baseMs * backoff.factor ** (busyStreak - 1))
    pausedUntil = Math.max(pausedUntil, now() + wait)
  }

  /**
   * @param {Function} task - () => Promise, one request to the source
   * @param {Object} [options]
   * @param {number} [options.deadlineAt] - the time (ms) after which this request is of no use
   * @returns {Promise<*>} what the task gave
   * @throws {PaceError} when the turn would come too late; anything else the task threw, as it came
   */
  async function run (task, { deadlineAt = Infinity } = {}) {
    await acquire()
    try {
      for (let attempt = 1; ; attempt++) {
        await waitTurn(deadlineAt)
        try {
          const value = await task()
          busyStreak = 0
          return value
        } catch (error) {
          const busy = busyOf(error)
          if (!busy) throw error
          slowDown(busy.retryAfterMs)
          if (attempt >= maxAttempts) throw new PaceError('busy', { retryAfterMs: pausedUntil - now(), cause: error })
        }
      }
    } finally {
      release()
    }
  }

  return { run }
}

/** A queue that paces nothing: each task runs at once. For the tests of who uses a queue. */
const noPace = Object.freeze({ run: (task) => task() })

module.exports = { createPoliteQueue, PaceError, noPace }
