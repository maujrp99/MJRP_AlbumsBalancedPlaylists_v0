/**
 * Wires the door and the limit of the server's routes to the real world (F59, slice C).
 * The only file here that knows Google's address and the environment.
 *
 *   paid    routes that spend the AI key: a signed-in person with an account (no guests), few calls
 *   costly  routes that make the server work (scraping): any signed-in person, more calls
 *
 * Switches (all optional; with none set the routes are CLOSED to who is not signed in):
 *   REQUIRE_SIGN_IN=false             turns the door off (local experiments only; warns at start)
 *   PAID_ROUTES_ALLOW_ANONYMOUS=true  lets guests use the paid routes
 *   PAID_CALLS_PER_HOUR, COSTLY_CALLS_PER_HOUR   the limits per person (defaults 60 and 900)
 *   FIREBASE_PROJECT_ID               the project whose logins are accepted
 */
const axios = require('axios')
const { createIdTokenVerifier } = require('./verifyIdToken')
const { requireUser } = require('./requireUser')
const { createRateLimiter } = require('../rateLimit')

const GOOGLE_KEYS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const DEFAULT_PROJECT_ID = 'mjrp-playlist-generator'
const HOUR_MS = 60 * 60 * 1000

async function fetchGoogleKeys () {
  const response = await axios.get(GOOGLE_KEYS_URL, { timeout: 5000 })
  const cacheControl = String((response.headers && response.headers['cache-control']) || '')
  const maxAge = /max-age=(\d+)/.exec(cacheControl)
  return { keys: response.data || {}, maxAgeSeconds: maxAge ? Number(maxAge[1]) : 300 }
}

function positiveNumber (value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function buildGuards (env = {}, { fetchKeys = fetchGoogleKeys, logger = console } = {}) {
  if (env.REQUIRE_SIGN_IN === 'false') {
    if (logger && logger.warn) logger.warn('Sign-in is NOT required on the paid routes (REQUIRE_SIGN_IN=false). Never in production.')
    const open = (req, res, next) => next()
    return { paid: [open], costly: [open], required: false }
  }

  const verifier = createIdTokenVerifier({
    projectId: env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
    fetchKeys
  })

  return {
    required: true,
    paid: [
      requireUser({ verifier, allowAnonymous: env.PAID_ROUTES_ALLOW_ANONYMOUS === 'true', logger }),
      createRateLimiter({ limit: positiveNumber(env.PAID_CALLS_PER_HOUR, 60), windowMs: HOUR_MS })
    ],
    costly: [
      requireUser({ verifier, allowAnonymous: true, logger }),
      createRateLimiter({ limit: positiveNumber(env.COSTLY_CALLS_PER_HOUR, 900), windowMs: HOUR_MS })
    ]
  }
}

module.exports = { buildGuards, GOOGLE_KEYS_URL }
