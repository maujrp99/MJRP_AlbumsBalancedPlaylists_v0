/**
 * The addresses F85 names: «Start» is where a series is built (it was «Home», /home); the logo
 * leads to the entry page, the site's home. Written in the code, nothing here comes from outside.
 */

/** The screen where a series is built. */
export const START_PATH = '/start'

/** The entry page for a person with an account open (`?entry` shows it to anyone: the root decision lets it be). */
export const ENTRY_PATH = '/?entry'

/**
 * Where an old /home address leads: /start, the query kept (`/home?signin` opens the sign-in window as before).
 * @param {string} search - `location.search` of the old address
 */
export const oldHomeTarget = (search) => `${START_PATH}${search || ''}`
