/**
 * So many calls per person per window (F59, slice C).
 *
 * createRateLimiter({ limit, windowMs }) is an Express middleware that comes AFTER requireUser:
 * it counts by `req.user.uid`. Over the limit it answers 429 with `Retry-After` in seconds.
 * The count lives in the memory of this server instance: with more than one instance each one
 * counts on its own, so the real ceiling is `limit` times the number of instances. That is
 * enough to stop one login from spending without end; it is not a billing guarantee.
 */
const { failure, respond } = require('./outcome')

function createRateLimiter ({ limit, windowMs, now = () => Date.now() }) {
  const seen = new Map() // uid -> { count, startedAt }

  function forget (moment) {
    for (const [uid, entry] of seen) {
      if (moment - entry.startedAt >= windowMs) seen.delete(uid)
    }
  }

  function limiter (req, res, next) {
    const uid = req.user && req.user.uid
    if (!uid) return respond(res, failure('unauthorized'))

    const moment = now()
    forget(moment)

    const entry = seen.get(uid) || { count: 0, startedAt: moment }
    if (entry.count >= limit) {
      const waitSeconds = Math.max(1, Math.ceil((entry.startedAt + windowMs - moment) / 1000))
      return respond(res, failure('rate_limited', { retryAfterSeconds: waitSeconds }))
    }
    entry.count += 1
    seen.set(uid, entry)
    return next()
  }

  limiter.size = () => seen.size
  return limiter
}

module.exports = { createRateLimiter }
