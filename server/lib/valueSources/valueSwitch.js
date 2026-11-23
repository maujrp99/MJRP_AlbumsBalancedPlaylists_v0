/**
 * The switch of the Discogs values (F75, REQ-10).
 *
 * The values are ON only when the server has the token of the Discogs account (DISCOGS_TOKEN) AND
 * nobody turned them off (DISCOGS_VALUES=off). Both are read from the environment on every
 * request, so turning the source off is a change of one variable of the service, with no code
 * published again: the app then shows no Discogs value, button or notice, and everything else of
 * the inventory goes on working.
 *
 * DISCOGS_VALUES_FOR (optional): the ids of the people the values are on for, separated by commas.
 * The price suggestions of Discogs are licensed for personal use (API Terms of Use, "Restricted
 * Data"): with this set, only the people named see them; for everybody else the source is off.
 * With it unset the source is on for every person signed in with an account. A guest (the login
 * the app opens by itself) never has it on: the route of the values refuses guests.
 *
 * `discogsSwitch` is the lock of the ENVIRONMENT, the emergency cut that stays. Since F93 there is a
 * second lock, the key `discogsValues` the owner sets in the CMS (lib/valueSources/cmsSwitches.js), and
 * `discogsState` puts the two together: on only with both on; off when the environment says off (the CMS
 * is not even asked); unknown when the environment allows it and the CMS key could not be read.
 */
const ON = 'on'
const OFF = 'off'
/** The CMS key could not be read (F93, REQ-08): not off, and never shown as on. Only the CMS lock can say it. */
const UNKNOWN = 'unknown'

const text = (value) => String(value || '').trim()
const namedPeople = (env) => text(env.DISCOGS_VALUES_FOR).split(',').map(text).filter(Boolean)

/**
 * @param {Object} env - the environment
 * @param {{ uid: string }|null} [user] - who asks; only read when DISCOGS_VALUES_FOR is set
 * @returns {'on'|'off'}
 */
function discogsSwitch (env = {}, user = null) {
  if (!text(env.DISCOGS_TOKEN) || text(env.DISCOGS_VALUES).toLowerCase() === OFF) return OFF
  if (user && user.anonymous) return OFF
  const people = namedPeople(env)
  if (people.length === 0) return ON
  return user && people.includes(user.uid) ? ON : OFF
}

/**
 * The two locks together.
 * @param {'on'|'off'} environmentLock - discogsSwitch(env, user)
 * @param {'on'|'off'|'unknown'} cmsKey - the key of the CMS, read only when the environment allows
 * @returns {'on'|'off'|'unknown'}
 */
function discogsState (environmentLock, cmsKey) {
  if (environmentLock !== ON) return OFF
  return cmsKey === ON || cmsKey === OFF ? cmsKey : UNKNOWN
}

module.exports = { discogsSwitch, discogsState, ON, OFF, UNKNOWN }
