/**
 * usageEvents - the ONE list of what the app may measure (F77, REQ-01, REQ-03, REQ-05).
 *
 * Every event has a fixed name and a fixed list of properties. A property is either a count (a
 * whole number) or one value of a closed set. No property takes free text: nothing a person
 * types (the name of a series or of a playlist, an e-mail, a search) can be sent, because there
 * is no place in an event where it would fit.
 *
 * `describeEvent(name, properties)` is the gate every client goes through before an event leaves
 * the device: an unknown name is refused; a property not on the list of the event, or with a value
 * of the wrong kind, is dropped.
 *
 * Pure: no browser API, no server API, no import. The site imports it (`@shared/usageEvents.js`,
 * through public/js/services/usage/track.js); the phone app (F78) is to import the same file, so
 * both send the same names.
 *
 * To add an event: add it here, with its properties, and say in docs/specs/behavior.md what it
 * measures. A property that would need free text is not added: it is measured as a count or as
 * one of a closed set, or not at all.
 */

/** The largest count the app could ever send (more albums, tracks or playlists than anyone has). */
const MAX_COUNT = 10_000_000

const freeze = (values) => Object.freeze([...values])
const count = Object.freeze({ kind: 'count' })
const oneOf = (values) => Object.freeze({ kind: 'oneOf', values: freeze(values) })

/** The screens, by name. Never the address: an address carries the ids of the person's series. */
export const SCREENS = freeze([
    'home', 'albums', 'series', 'playlists', 'playlists_edit', 'saved_playlists', 'inventory', 'blend', 'coming_soon', 'admin'
])

/** The recipes of the Blending Menu (public/js/algorithms/index.js; a test keeps the two equal). */
export const RECIPES = freeze(['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user', 'deep-cuts', 'least-played'])

/** The statuses of an inventory item (public/js/models/inventoryStatus.js, written with «_»). */
export const INVENTORY_STATUSES = freeze(['owned', 'not_owned', 'wishlist'])

/** Which filter, sort or search of a screen was used. Never what was searched for. */
export const FILTERS = freeze(['search', 'artist', 'year', 'source', 'mode', 'format', 'status', 'sort', 'series', 'batch'])

/** How an action that can end half done ended. */
export const OUTCOMES = freeze(['complete', 'partial', 'stopped', 'failed'])

/** Why an export did not happen, when the reason is not about the playlists (F97): the service refused the account, or nothing could be checked. */
export const EXPORT_REASONS = freeze(['refused', 'unchecked'])

/** The events, each with its properties. */
export const USAGE_EVENTS = Object.freeze({
    screen_viewed: Object.freeze({ screen: oneOf(SCREENS) }),
    // A screen in React could not be drawn (F83): the barrier of the bridge counts it, by the name of the screen and nothing else
    screen_error: Object.freeze({ screen: oneOf(SCREENS) }),
    series_created: Object.freeze({ album_count: count }),
    series_edited: Object.freeze({ album_count: count }),
    series_deleted: Object.freeze({}),
    ranking_saved: Object.freeze({ track_count: count }),
    playlists_generated: Object.freeze({ recipe: oneOf(RECIPES), playlist_count: count, track_count: count }),
    playlists_saved: Object.freeze({ playlist_count: count, batch: oneOf(['new', 'edited']) }),
    playlists_exported: Object.freeze({ target: oneOf(['spotify', 'apple_music', 'json']), outcome: oneOf(OUTCOMES), reason: oneOf(EXPORT_REASONS), playlist_count: count }),
    inventory_status_changed: Object.freeze({ from: oneOf(INVENTORY_STATUSES), to: oneOf(INVENTORY_STATUSES) }),
    inventory_value_written: Object.freeze({}),
    inventory_value_removed: Object.freeze({}),
    inventory_values_read: Object.freeze({ scope: oneOf(['all', 'one']), count, outcome: oneOf(OUTCOMES) }),
    inventory_albums_added: Object.freeze({ from: oneOf(['one', 'series']), count }),
    buy_link_opened: Object.freeze({ store: oneOf(['discogs', 'amazon', 'imusic']), place: oneOf(['card', 'album_window', 'phone_sheet']) }),
    filter_used: Object.freeze({ screen: oneOf(['albums', 'inventory', 'saved_playlists']), which: oneOf(FILTERS) }),
    sign_in: Object.freeze({ provider: oneOf(['google', 'apple']) }),
    sign_out: Object.freeze({})
})

export const EVENT_NAMES = freeze(Object.keys(USAGE_EVENTS))

const isCount = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_COUNT

const KIND_ACCEPTS = Object.freeze({
    count: (kind, value) => isCount(value),
    oneOf: (kind, value) => kind.values.includes(value)
})

const accepts = (kind, value) => KIND_ACCEPTS[kind.kind](kind, value)

/**
 * The event as it may leave the device, or why it may not.
 * @param {string} name - one of EVENT_NAMES
 * @param {Object} [properties] - what is said of it; what is not on its list is dropped
 * @returns {{ ok: true, name: string, properties: Object } | { ok: false, reason: 'unknown-event' }}
 */
export function describeEvent(name, properties = {}) {
    if (!Object.hasOwn(USAGE_EVENTS, name)) return { ok: false, reason: 'unknown-event' }
    const allowed = USAGE_EVENTS[name]
    const given = properties || {}
    const kept = Object.entries(allowed)
        .filter(([property, kind]) => Object.hasOwn(given, property) && accepts(kind, given[property]))
        .map(([property]) => [property, given[property]])
    return { ok: true, name, properties: Object.fromEntries(kept) }
}
