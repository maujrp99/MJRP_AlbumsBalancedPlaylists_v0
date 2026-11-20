/**
 * Async routes that answer when they break (F59).
 *
 * Express 4 does not catch a rejected async handler: the request hangs and Node may end the
 * process on the unhandled rejection. `asyncRoute` hands the error to Express; `errorResponder`
 * is the last middleware and answers 500 (or the 4xx of a request it could not read) with no
 * detail of the error; the detail goes to the log. The answer is built by lib/outcome.js (F52).
 */
const { failure, respond, UpstreamError } = require('./outcome')

function asyncRoute (handler) {
  return function (req, res, next) {
    return Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next)
  }
}

function errorResponder (logger = console) {
  return function (err, req, res, next) {
    logger.error('route_failed', { method: req && req.method, path: req && req.path, err: (err && err.message) || String(err) })
    if (res.headersSent) return next(err)
    // A request the server could not read (bad JSON, body too large) is the caller's error
    const status = Number(err && (err.status || err.statusCode))
    if (status >= 400 && status < 500) return respond(res, failure('invalid_request', { status }))
    // An outside source that failed and that no service turned into a result: still a typed failure
    if (err instanceof UpstreamError) return respond(res, failure(err.code))
    return respond(res, failure('internal'))
  }
}

module.exports = { asyncRoute, errorResponder }
