/**
 * The door of the Painel's routes (F82, REQ-13): the administrator only.
 *
 * The administrator is the same person the database rules call so (firestore.rules, isCmsAdmin):
 * signed in with a real account (never the anonymous login the app opens by itself) and with a
 * record `cmsAdmins/{uid}` whose `role` is "super". The login is checked the way every other door
 * checks it (verifyIdToken.js); the record is read through the Firestore REST API WITH THE PERSON'S
 * OWN LOGIN - the rules let each person read only their own record - so this server holds no
 * credential for it, and a person the rules would refuse is refused here too.
 *
 *   401  unauthorized   reason session-expired        no login, or one that does not check
 *   403  unauthorized   reason not-an-administrator   a guest; no record; a record with another role
 *   503  upstream_busy  reason service-unavailable    the login or the record could not be checked:
 *                                                     nobody goes through
 *   429  rate_limited   reason too-many-requests      too many knocks of one person in the hour: the
 *                                                     record is not read (the limit comes BEFORE it)
 * The body is the one error format of the server (lib/outcome.js) with the name of the failure in
 * `reason`, for the Painel to show. The log says the status of the read, never the login nor the person.
 */
const { AuthError } = require('./verifyIdToken')
const { bearerOf } = require('./requireUser')
const { failure, respond } = require('../outcome')

const DEFAULT_PROJECT_ID = 'mjrp-playlist-generator' // the same project the logins are checked against (guards.js)
const READ_DEADLINE_MS = 3000
const ADMIN_ROLE = 'super'

const SESSION_EXPIRED = () => failure('unauthorized', { reason: 'session-expired' })
const NOT_AN_ADMINISTRATOR = () => failure('unauthorized', { status: 403, reason: 'not-an-administrator' })
const UNAVAILABLE = () => failure('upstream_busy', { reason: 'service-unavailable' })

/** The REST address of one person's record. */
function adminRecordUrl (env = {}, uid) {
  const project = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/cmsAdmins/${encodeURIComponent(uid)}`
}

const statusOf = (err) => (err && err.response && err.response.status) || 0

/**
 * @param {Object} deps
 * @param {Object} deps.verifier - { verify(token) -> { uid, anonymous } } (verifyIdToken.js)
 * @param {Object} deps.http - { get(url, config) }, axios in the server
 * @param {Object} [deps.env] - FIREBASE_PROJECT_ID
 * @param {Object} [deps.logger]
 * @param {number} [deps.deadlineMs] - how long the read of the record may take
 * @param {Function} [deps.attempts] - a limit per signed-in person (lib/rateLimit.js), counted BEFORE the record is read:
 *        whoever is not the administrator cannot repeat that read against Firestore without end
 */
function requireCmsAdmin ({ verifier, http, env = {}, logger = console, deadlineMs = READ_DEADLINE_MS, attempts }) {
  const warn = (reason, detail) => { if (logger && logger.warn) logger.warn('admin_refused', { reason, detail }) }

  /** 'super' | another text | null (no usable role); throws the HTTP error of the read. */
  async function roleOf (uid, token) {
    const response = await http.get(adminRecordUrl(env, uid), {
      timeout: deadlineMs,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const body = response && response.data
    if (!body || typeof body !== 'object') throw new Error('the answer is not a Firestore document')
    const role = body.fields && body.fields.role
    return role && typeof role.stringValue === 'string' ? role.stringValue : null
  }

  /** The person of a login that checks and is not a guest: { user }, or { refused } with the answer. */
  async function personOf (token) {
    let user
    try {
      user = await verifier.verify(token)
    } catch (error) {
      const unavailable = error instanceof AuthError && error.code === 'unavailable'
      warn(unavailable ? 'login-not-checked' : 'login-refused', (error && error.message) || 'no detail')
      return { refused: unavailable ? UNAVAILABLE() : SESSION_EXPIRED() }
    }
    return user.anonymous ? { refused: NOT_AN_ADMINISTRATOR() } : { user }
  }

  /** The answer to a read of the record that failed. Only the status or the network code goes to the log: the error of the client carries the login in its headers. */
  function refusalOfRead (error) {
    const status = statusOf(error)
    warn('record-not-read', status ? `HTTP ${status}` : ((error && error.code) || 'no answer'))
    // 401: Firestore refuses the login itself. 404: no record. 403: the rules refuse the read. Anything else: not known, nobody goes through
    const known = { 401: SESSION_EXPIRED, 403: NOT_AN_ADMINISTRATOR, 404: NOT_AN_ADMINISTRATOR }
    return (known[status] || UNAVAILABLE)()
  }

  /** Why this person is not let in, or null when the record says they are the administrator. */
  async function refusalFor (user, token) {
    let role
    try {
      role = await roleOf(user.uid, token)
    } catch (error) {
      return refusalOfRead(error)
    }
    return role === ADMIN_ROLE ? null : NOT_AN_ADMINISTRATOR()
  }

  return async function cmsAdminDoor (req, res, next) {
    const token = bearerOf(req)
    if (!token) return respond(res, SESSION_EXPIRED())
    const { user, refused } = await personOf(token)
    if (refused) return respond(res, refused)
    // The limit counts by `req.user.uid` and answers by itself (429) when the person is over it: then the record is not read
    req.user = user
    if (attempts && !withinTheLimit(attempts, req, res)) return undefined
    const notAdministrator = await refusalFor(user, token)
    if (notAdministrator) {
      delete req.user
      return respond(res, notAdministrator)
    }
    return next()
  }
}

/** Runs a limiter of lib/rateLimit.js and says whether the person may go on (it has already answered when not). */
function withinTheLimit (limiter, req, res) {
  let passed = false
  limiter(req, res, () => { passed = true })
  return passed
}

module.exports = { requireCmsAdmin, adminRecordUrl, ADMIN_ROLE, READ_DEADLINE_MS }
