/**
 * Wires the door and the limit of the server's routes to the real world (F59, slice C).
 * The only file here that knows Google's address and the environment.
 *
 *   paid    routes that spend the AI key: a signed-in person with an account (no guests), few calls
 *   costly  routes that make the server work (scraping): any signed-in person, more calls
 *   value   the route that reads a price from Discogs with the token of the owner's account
 *           (F75): a signed-in person with an account (no guests), with a limit of its own, so
 *           that reading the values of an inventory does not spend the calls of the AI routes
 *   admin   the routes of the Painel (F82): the administrator only - a person with an account whose
 *           record `cmsAdmins/{uid}` says role "super" - with a limit of its own. This door has no
 *           switch: REQUIRE_SIGN_IN=false does not open it
 *
 * Switches (all optional; with none set the routes are CLOSED to who is not signed in):
 *   REQUIRE_SIGN_IN=false             turns the door off (local experiments only; warns at start)
 *   PAID_ROUTES_ALLOW_ANONYMOUS=true  lets guests use the paid routes
 *   PAID_CALLS_PER_HOUR, COSTLY_CALLS_PER_HOUR, VALUE_CALLS_PER_HOUR   the limits per person (defaults 60, 900 and 900)
 *   TRANSLATE_CALLS_PER_HOUR          the limit of the administrator's translations (default 120)
 *   ADMIN_CHECKS_PER_HOUR             the limit of knocks on the administrator's door per signed-in person, counted before
 *                                     the record is read (default 600)
 *   FIREBASE_PROJECT_ID               the project whose logins are accepted
 */
const axios = require('axios')
const { createIdTokenVerifier } = require('./verifyIdToken')
const { requireUser } = require('./requireUser')
const { requireCmsAdmin } = require('./requireCmsAdmin')
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

function buildGuards (env = {}, { fetchKeys = fetchGoogleKeys, logger = console, http = axios } = {}) {
  const verifier = createIdTokenVerifier({
    projectId: env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
    fetchKeys
  })
  // The administrator's door is the same with or without the switch below: it is never open
  const admin = [
    // two limits per person: the knocks on the door, counted BEFORE the record is read (a signed-in person who is not the
    // administrator cannot hammer Firestore through this server), and, after the door, the translations of the administrator
    requireCmsAdmin({
      verifier, http, env, logger,
      attempts: createRateLimiter({ limit: positiveNumber(env.ADMIN_CHECKS_PER_HOUR, 600), windowMs: HOUR_MS, reason: 'too-many-requests' })
    }),
    createRateLimiter({ limit: positiveNumber(env.TRANSLATE_CALLS_PER_HOUR, 120), windowMs: HOUR_MS, reason: 'too-many-requests' })
  ]

  if (env.REQUIRE_SIGN_IN === 'false') {
    if (logger && logger.warn) logger.warn('Sign-in is NOT required on the paid routes (REQUIRE_SIGN_IN=false). Never in production.')
    const open = (req, res, next) => next()
    return { paid: [open], costly: [open], value: [open], admin, required: false }
  }

  return {
    required: true,
    admin,
    paid: [
      requireUser({ verifier, allowAnonymous: env.PAID_ROUTES_ALLOW_ANONYMOUS === 'true', logger }),
      createRateLimiter({ limit: positiveNumber(env.PAID_CALLS_PER_HOUR, 60), windowMs: HOUR_MS })
    ],
    costly: [
      requireUser({ verifier, allowAnonymous: true, logger }),
      createRateLimiter({ limit: positiveNumber(env.COSTLY_CALLS_PER_HOUR, 900), windowMs: HOUR_MS })
    ],
    value: [
      requireUser({ verifier, allowAnonymous: false, logger }),
      createRateLimiter({ limit: positiveNumber(env.VALUE_CALLS_PER_HOUR, 900), windowMs: HOUR_MS })
    ]
  }
}

module.exports = { buildGuards, GOOGLE_KEYS_URL }
