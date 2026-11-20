/**
 * The value source of an album (F75): the price Discogs suggests for the CD edition of the album
 * that most people have, in three conditions of the disc. It sits beside the ranking sources
 * (lib/rankingSources) and answers the same way: one typed outcome, and a failure of the outside
 * is THROWN as an UpstreamError, so "it failed" is never read as "there is none".
 *
 *   found           with { release: { id, title, url }, conditions: { mint, nearMint, veryGoodPlus }, currency, readAt }
 *   not_found       Discogs has no CD edition the identity rule accepts as this album
 *   no_value        the edition exists and Discogs suggests no price for the three conditions; with { release }
 *   not_configured  the switch is off (lib/valueSources/valueSwitch.js): Discogs was not asked
 *
 * Which edition: the masters of a search by artist and title are LISTED, the one identity rule
 * (shared/albumIdentity.js) says which one is the album, and of its CD versions the one with the
 * most copies in collections is taken. With no master, or a master with no CD version, the CD
 * releases of a second search are listed and the rule picks again. A known edition (`releaseId`)
 * skips all of that: only the price is asked.
 *
 * The pace (DISCOGS_PACE): one request at a time and never more than one a second, through the
 * polite queue; when the `X-Discogs-Ratelimit-Remaining` header says the minute is spent the queue
 * waits a minute before the next one; a 429 is told as `upstream_busy` with the wait, and is not
 * asked again here. ONE token, the one of the account: the limit is never dodged with a second key
 * (Discogs API Terms of Use). The queue is PER INSTANCE of the server.
 *
 * Nothing is kept here after the request: a price of Discogs may not be stored longer than needed
 * nor shown when older than six hours (the app keeps it in the browser, for six hours).
 * The token leaves this file only in the header of a request to Discogs: never in a log line, in
 * a message of an error, or in an answer.
 */
const axios = require('axios')
const { UpstreamError, upstreamErrorFrom } = require('../outcome')
const { createPoliteQueue, PaceError } = require('../politeQueue')
const { loadAlbumIdentity } = require('../albumIdentity')
const { found, none, SOURCE_OUTCOMES } = require('../rankingSources/sourceOutcome')
const { discogsSwitch, ON } = require('./valueSwitch')
const { suggestionsOf, candidatesOf, readingsOfLabel, mostCollectedCd, releaseUrl } = require('./discogsParse')
const { version: SERVER_VERSION } = require('../../package.json')

const NAME = 'Discogs'
const API = 'https://api.discogs.com'
/** Discogs asks for a User-Agent that says which application calls, with where to find it. */
const USER_AGENT = `AlbumBlender/${SERVER_VERSION} +https://mjrp-playlist-generator.web.app`
const NO_VALUE = 'no_value'

/** How long one request to Discogs may take. The whole album request has 20 s (services/valueService.js). */
const REQUEST_TIMEOUT_MS = 8000
/** The window of the limit of Discogs: so many requests per minute. */
const LIMIT_WINDOW_MS = 60 * 1000
/** With this many requests left in the minute, or fewer, the queue waits for the next minute. */
const REQUESTS_KEPT_IN_RESERVE = 1
const SEARCH_PAGE = 25
const VERSIONS_PAGE = 100

/**
 * The pace with Discogs, per instance of the server: 60 requests a minute with a token. Decided by
 * the agent on 2026-11-20 from the documented limit; the live limit is read from the headers.
 */
const DISCOGS_PACE = Object.freeze({
  concurrency: 1, // one request to Discogs at a time
  minIntervalMs: 1100, // between two starts: under 60 a minute
  backoff: Object.freeze({ baseMs: 30000, factor: 2, maxMs: 120000 }), // the wait after a 429 with no Retry-After
  maxAttempts: 1, // a 429 is told to the app, with the wait; it is not asked again here
  maxRetryAfterMs: 5 * 60 * 1000
})

/** Retry-After in seconds, as ms; null when absent or unreadable. */
function retryAfterMsOf (headers) {
  const seconds = Number(headers && headers['retry-after'])
  return headers && headers['retry-after'] !== undefined && Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : null
}

/** What the polite queue asks: is this failure Discogs saying "you asked too much" (429), and for how long? */
const busyOfDiscogs = () => (err) => {
  const response = err && err.response
  if (!response || response.status !== 429) return null
  return { retryAfterMs: retryAfterMsOf(response.headers) }
}

/** Discogs answered 404: there is no such page. Never leaves this file. */
class NoSuchPage extends Error {
  /** @param {string} said - what Discogs wrote in the answer (its `message`), cut short */
  constructor (said) {
    super('no such page')
    this.said = said
  }
}

/** The sentence Discogs sends with a refusal, as text and cut short: it goes to a log line. */
const saidBy = (err) => String((err.response.data && err.response.data.message) || '').slice(0, 200)

/** The queue said the turn would come too late. */
function failureOfPace (err) {
  if (err.reason === 'busy') return new UpstreamError('upstream_busy', `${NAME}: asked to wait`, { retryAfterMs: err.retryAfterMs })
  return new UpstreamError('upstream_timeout', `${NAME}: no turn in the queue within the time of the request`)
}

/** What a failed request is: the message names the status, never the address or a header. */
function failureOf (err) {
  if (err instanceof PaceError) return failureOfPace(err)
  const status = err && err.response && err.response.status
  if (status === 404) return new NoSuchPage(saidBy(err))
  if (status === 401 || status === 403) return new UpstreamError('upstream_unauthorized', `${NAME}: HTTP ${status}, the token was refused`)
  return upstreamErrorFrom(err, NAME)
}

const release = (id, title) => ({ id, title: title || null, url: releaseUrl(id) })

/** The candidate the identity rule accepts as the album asked for, or null. */
function accepted ({ pickAlbum }, asked, candidates) {
  const picked = pickAlbum(asked, candidates, (candidate) =>
    readingsOfLabel(candidate.label).map(reading => ({ ...reading, year: candidate.year })))
  return picked.found ? picked.candidate : null
}

/**
 * @param {Object} [deps]
 * @param {Object} [deps.http] - { get(url, config) }, axios by default
 * @param {Object} [deps.pace] - lib/politeQueue.js: { run, pause }
 * @param {Object} [deps.env] - the environment, read on every ask (the switch and the token)
 * @param {Function} [deps.now] - () => ms
 * @param {Function} [deps.loadIdentity] - () => Promise<the identity rule>
 * @param {Object} [deps.logger] - { warn }
 */
function createDiscogsSource ({ http = axios, pace = discogsPace, env = process.env, now = () => Date.now(), loadIdentity = loadAlbumIdentity, logger = console } = {}) {
  const configFor = (params, deadlineAt) => ({
    params,
    timeout: Math.min(REQUEST_TIMEOUT_MS, Math.max(1, deadlineAt - now())),
    headers: { 'User-Agent': USER_AGENT, Authorization: `Discogs token=${String(env.DISCOGS_TOKEN).trim()}`, Accept: 'application/json' }
  })

  /** The headers say how many requests are left in the minute: with none to spare, the queue waits. */
  function heedLimit (headers) {
    const left = Number(headers && headers['x-discogs-ratelimit-remaining'])
    const said = headers && headers['x-discogs-ratelimit-remaining'] !== undefined && Number.isFinite(left)
    if (said && left <= REQUESTS_KEPT_IN_RESERVE) pace.pause(LIMIT_WINDOW_MS)
  }

  /** The one door to Discogs. A failure leaves it as an UpstreamError (or NoSuchPage), already logged. */
  async function get (path, params, deadlineAt) {
    if (deadlineAt - now() <= 0) throw new UpstreamError('upstream_timeout', `${NAME}: the time of the request is over`)
    try {
      const response = await pace.run(() => http.get(`${API}${path}`, configFor(params, deadlineAt)), { deadlineAt })
      heedLimit(response.headers)
      return response.data
    } catch (err) {
      const failure = failureOf(err)
      if (failure instanceof UpstreamError) logger.warn(`[Discogs] request failed: ${failure.message}`)
      throw failure
    }
  }

  const search = (type, asked, title, deadlineAt) => get('/database/search', {
    type, artist: asked.artist, release_title: title, per_page: SEARCH_PAGE, ...(type === 'release' && { format: 'CD' })
  }, deadlineAt)

  /** The CD edition most people have of the album asked for, or null when Discogs has none. */
  async function findRelease (asked, deadlineAt) {
    const identity = await loadIdentity()
    const title = identity.titlesToSearch(asked)[0] || asked.title
    const master = accepted(identity, asked, candidatesOf(await search('master', asked, title, deadlineAt), 'master'))
    const version = master
      ? mostCollectedCd(await get(`/masters/${master.id}/versions`, { format: 'CD', per_page: VERSIONS_PAGE }, deadlineAt))
      : null
    if (version) return release(version.id, version.title)
    const single = accepted(identity, asked, candidatesOf(await search('release', asked, title, deadlineAt), 'release'))
    return single ? release(single.id, single.edition) : null
  }

  /**
   * The price page of an edition. A 404 HERE is not "no CD edition" (the edition was just found):
   * Discogs has no price page to give this account for it. It is told as "no value", and what
   * Discogs said goes to the log, so the reason can be read.
   */
  async function priceOf (edition, deadlineAt) {
    try {
      return await get(`/marketplace/price_suggestions/${edition.id}`, {}, deadlineAt)
    } catch (err) {
      if (!(err instanceof NoSuchPage)) throw err
      logger.warn(`[Discogs] HTTP 404 on the price page: ${err.said}`)
      return null
    }
  }

  async function read ({ artist, title, year, releaseId }, deadlineAt) {
    const edition = releaseId ? release(releaseId) : await findRelease({ artist, title, year }, deadlineAt)
    if (!edition) return none(SOURCE_OUTCOMES.NOT_FOUND)
    const suggestion = suggestionsOf(await priceOf(edition, deadlineAt))
    if (!suggestion) return none(NO_VALUE, { release: edition })
    return found({ release: edition, ...suggestion, readAt: new Date(now()).toISOString() })
  }

  /**
   * @param {{ artist: string, title: string, year?: number|string, releaseId?: number }} album
   * @param {{ deadlineAt?: number }} [options] - the time (ms) when the request of the app is over
   * @returns {Promise<Object>} found | not_found | no_value | not_configured
   * @throws {UpstreamError} upstream_unauthorized | upstream_busy | upstream_timeout | upstream_failed
   */
  async function ask (album, { deadlineAt = Infinity } = {}) {
    if (discogsSwitch(env) !== ON) return none(SOURCE_OUTCOMES.NOT_CONFIGURED)
    try {
      return await read(album, deadlineAt)
    } catch (err) {
      if (err instanceof NoSuchPage) return none(SOURCE_OUTCOMES.NOT_FOUND)
      throw err
    }
  }

  return { name: NAME, ask }
}

/** The queue of the running server: one for every request to Discogs of this instance. */
const discogsPace = createPoliteQueue({ ...DISCOGS_PACE, busyOf: busyOfDiscogs() })

module.exports = { createDiscogsSource, DISCOGS_PACE, busyOfDiscogs, NO_VALUE }
