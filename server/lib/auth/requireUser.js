/**
 * The door of the routes that cost money or work (F59, slice C).
 *
 * requireUser({ verifier, allowAnonymous }) is an Express middleware. It reads the login from
 * `Authorization: Bearer <token>`, has it checked, and puts `{ uid, anonymous }` in `req.user`.
 *   401  no login, or one that does not check
 *   403  a guest (anonymous login) on a route that is not for guests
 *   503  the login could not be checked (the keys are unavailable): nobody goes through
 * The answer never says why a login was refused; the reason goes to the log. The body is the one
 * error format of the server (lib/outcome.js): `unauthorized` for 401 and 403, `upstream_busy` for 503.
 */
const { AuthError } = require('./verifyIdToken')
const { failure, respond } = require('../outcome')

function bearerOf (req) {
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || ''
  const match = /^Bearer\s+(\S+)$/.exec(String(header))
  return match ? match[1] : undefined
}

function requireUser ({ verifier, allowAnonymous = false, logger = console }) {
  return async function (req, res, next) {
    let user
    try {
      user = await verifier.verify(bearerOf(req))
    } catch (error) {
      const unavailable = error instanceof AuthError && error.code === 'unavailable'
      if (logger && logger.warn) logger.warn('login_refused', { path: req.path, reason: (error && error.message) || String(error) })
      if (unavailable) return respond(res, failure('upstream_busy'))
      return respond(res, failure('unauthorized'))
    }
    if (user.anonymous && !allowAnonymous) {
      return respond(res, failure('unauthorized', { status: 403 }))
    }
    req.user = user
    return next()
  }
}

module.exports = { requireUser }
