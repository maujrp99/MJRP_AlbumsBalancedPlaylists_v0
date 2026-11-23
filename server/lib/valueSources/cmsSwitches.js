/**
 * cmsSwitches - the feature switches the owner sets in the CMS, as the server reads them (F93,
 * REQ-02 and REQ-08; ADR-0024).
 *
 * The switches live in ONE public Firestore document, `published/site` (field `switches`). The
 * server reads it by REST, with no credential (the rules let everybody read `published/*`), and
 * checks the map with the same validator the Painel and the site use (shared/content/switches.js).
 * Today it is used for one key, the Discogs one (`discogsValues`); Firestore's own types are decoded
 * here, so nothing of the transport leaks into the core.
 *
 * The three states of a key, and the care that keeps them apart:
 *   on / off   the document was read (or it does not exist: 404 is an answer, nobody turned anything
 *              on) and the key says so, or says nothing and its default is applied
 *   unknown    the read failed (the rules refused it, the service is down, the network, the 1.5 s
 *              deadline, an answer that is not a document) and there is no recent good reading.
 *              Unknown is NEVER turned into off, and it is always said in the log.
 *
 * Time: a reading is kept 60 s (FRESH_MS); a read has 1.5 s (READ_DEADLINE_MS) and the requests that
 * arrive while it runs share it; a failed read is not tried again before 60 s; the last good reading
 * stands while a read fails, for at most 10 minutes (STALE_LIMIT_MS), then the answer is unknown.
 * The first request of a new instance has nothing kept, so it WAITS for the read (up to 1.5 s).
 */
const axios = require('axios')
const { createBudget } = require('../timeBudget')
const { loadSwitches } = require('../contentCore')

const DEFAULT_PROJECT_ID = 'mjrp-playlist-generator' // the same project the logins are checked against (lib/auth/guards.js)
const FRESH_MS = 60 * 1000
const STALE_LIMIT_MS = 10 * 60 * 1000
const READ_DEADLINE_MS = 1500

const ON = 'on'
const OFF = 'off'
const UNKNOWN = 'unknown'

/** The REST address of the document (public, read with no credential). */
function siteDocumentUrl (env = {}) {
  const project = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/published/site`
}

const SCALARS = Object.freeze({
  booleanValue: (value) => value,
  stringValue: (value) => value,
  integerValue: (value) => Number(value),
  doubleValue: (value) => value,
  nullValue: () => null
})

/** A Firestore value as a plain value; anything the switches do not use comes out as text, so the validator refuses it. */
function plainOf (value) {
  if (!value || typeof value !== 'object') return undefined
  const type = Object.keys(value)[0]
  if (Object.prototype.hasOwnProperty.call(SCALARS, type)) return SCALARS[type](value[type])
  if (type === 'mapValue') return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, inner]) => [key, plainOf(inner)]))
  if (type === 'arrayValue') return (value.arrayValue.values || []).map(plainOf)
  return `[${type || 'unsupported'}]`
}

/** The HTTP status an error of the client carries, or 0. */
const statusOf = (err) => (err && err.response && err.response.status) || 0

const isDocument = (body) => Boolean(body) && typeof body === 'object' && (body.fields === undefined || (typeof body.fields === 'object' && body.fields !== null))

/**
 * @param {Object} deps
 * @param {Object} [deps.http] - { get(url, config) }, axios by default
 * @param {Object} [deps.env] - the environment (FIREBASE_PROJECT_ID)
 * @param {Function} [deps.now] - () => ms
 * @param {number} [deps.deadlineMs] - how long one read may take
 * @param {Object} [deps.logger]
 */
function createCmsSwitches ({ http = axios, env = process.env, now = () => Date.now(), deadlineMs = READ_DEADLINE_MS, logger = console } = {}) {
  let last = null // { values, at }: the last good reading
  let nextTryAt = 0
  let inFlight = null
  let failure = null // why the last read failed, until one works

  /** The body of the document, or null when it does not exist (404 is an answer); throws when it could not be read. */
  async function fetchBody () {
    let response
    try {
      response = await createBudget({ ms: deadlineMs }).race(http.get(siteDocumentUrl(env), { timeout: deadlineMs, headers: { Accept: 'application/json' } }), 'Firestore')
    } catch (err) {
      if (statusOf(err) === 404) return null
      throw new Error(statusOf(err) ? `HTTP ${statusOf(err)}` : String((err && err.message) || err))
    }
    if (!isDocument(response && response.data)) throw new Error('the answer is not a Firestore document')
    return response.data
  }

  /** One read of the document. @returns {Promise<Object>} the `values` of the validated switches; throws when it could not be read */
  async function readOnce () {
    const body = await fetchBody()
    const field = body && body.fields ? body.fields.switches : undefined
    const { validateSwitches } = await loadSwitches()
    const { values, rejected } = validateSwitches(field === undefined ? {} : plainOf(field))
    if (rejected.length > 0) {
      logger.warn(`[CmsSwitches] switches refused, read as not set: ${rejected.map(({ key, reason }) => `${key === null ? '(the map)' : key} (${reason})`).join(', ')}`)
    }
    return values
  }

  async function refresh () {
    try {
      last = { values: await readOnce(), at: now() }
      failure = null
    } catch (err) {
      failure = err.message
      logger.warn(`[CmsSwitches] the switches of the CMS could not be read: ${failure}`)
    }
    nextTryAt = now() + FRESH_MS
  }

  /** Reads when it is time (and waits for it), else uses what is kept. */
  async function current () {
    if (now() >= nextTryAt && !inFlight) inFlight = refresh().finally(() => { inFlight = null })
    if (inFlight) await inFlight
    if (last && now() - last.at <= STALE_LIMIT_MS) return last.values
    if (last) logger.warn(`[CmsSwitches] the last good reading is older than ten minutes: the switches are unknown (${failure || 'no new reading'})`)
    return null
  }

  /**
   * The Discogs key of the CMS.
   * @returns {Promise<'on'|'off'|'unknown'>} never throws
   */
  async function discogsValues () {
    const values = await current()
    if (values === null) return UNKNOWN
    const { switchValue } = await loadSwitches()
    return switchValue('discogsValues', values) ? ON : OFF
  }

  return { discogsValues }
}

module.exports = { createCmsSwitches, siteDocumentUrl, FRESH_MS, STALE_LIMIT_MS, READ_DEADLINE_MS, ON, OFF, UNKNOWN }
