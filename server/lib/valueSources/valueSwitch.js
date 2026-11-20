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
 */
const ON = 'on'
const OFF = 'off'

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

module.exports = { discogsSwitch, ON, OFF }
