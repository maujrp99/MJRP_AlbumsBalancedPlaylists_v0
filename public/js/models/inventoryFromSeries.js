/**
 * inventoryFromSeries - "add the albums of my series" (F71, S-54), as pure rules.
 *
 * The list comes from the album queries the series store: artist, title, year, cover address and
 * Apple Music id. ONE rule, whatever screens were opened before: an inventory item made this way
 * carries what the query carries and nothing else (no tracks, no notes of any catalog). No album
 * is loaded, so nothing is asked of Apple Music.
 *
 * One album once. Two albums are the same when
 *   - both have an Apple Music id and it is the same one; or
 *   - both have the id the app gives a loaded album (`stableAlbumId`) and it is the same one; or
 *   - the one identity rule says so (shared/albumIdentity.js, first tier: the same title or an
 *     edition of it, by the same artist). This file compares no text itself.
 * That is asked between each album of the series and the items of the inventory, and between the
 * albums of the series themselves. It is also what "add from an album card" asks before it writes.
 */

import { askedAlbum, compareAlbumIdentity } from './askedAlbum.js'
import { stableAlbumId } from './ownRanking.js'

/** Why an entry of a series is not added. */
export const SkipReason = Object.freeze({
    ALREADY_IN_INVENTORY: 'already-in-inventory',
    REPEATED_IN_SERIES: 'repeated-in-series',
    INCOMPLETE: 'incomplete'
})

/** The mark an item made here keeps in `albumData.metadata.addedFrom`: how to tell it from the others. */
export const ADDED_FROM_SERIES = 'series'

const APPLE_MUSIC = 'Apple Music'
const COVER_SIZE = '600'

const isObject = (value) => typeof value === 'object' && value !== null

/** The cover address of a query; one stored with its size left open ({w}x{h}) gets a size. */
function coverOf(query) {
    if (!isObject(query) || typeof query.coverUrl !== 'string' || !query.coverUrl) return null
    return query.coverUrl.replace('{w}', COVER_SIZE).replace('{h}', COVER_SIZE)
}

const appleIdOfQuery = (query) => (isObject(query) && query.appleMusicId ? String(query.appleMusicId) : null)

/**
 * The album an inventory item holds (`albumData`) for a query of a series.
 * @param {string|Object} query - as the series stores it
 * @returns {{ id: string, title: string, artist: string, year: number|string|null, coverUrl: string|null,
 *   appleMusicId: string|null, metadata: { addedFrom: string } } | null} null when the query has no artist or no title
 */
export function inventoryAlbumFromQuery(query) {
    const { artist, title, year } = askedAlbum(query)
    if (!artist || !title) return null
    return {
        id: stableAlbumId(artist, title),
        title,
        artist,
        year: year ?? null,
        coverUrl: coverOf(query),
        appleMusicId: appleIdOfQuery(query),
        metadata: { addedFrom: ADDED_FROM_SERIES }
    }
}

/** The Apple Music id of an album: the one a series stored, or the one the catalog loaded it by. */
export function appleIdOf(album) {
    if (album?.appleMusicId) return String(album.appleMusicId)
    const { source, sourceId } = album?.metadata || {}
    return source === APPLE_MUSIC && sourceId ? String(sourceId) : null
}

/** What is compared of an album: its two ids and its names. */
const keysOfAlbum = (album) => ({
    id: album?.id ? String(album.id) : null,
    appleId: appleIdOf(album),
    artist: album?.artist || '',
    title: album?.title || ''
})

/** The same, of an inventory item: the ids are the held album's, the names are the item's own. */
function keysOfItem(item) {
    const { artist, title, albumData } = item || {}
    const held = keysOfAlbum(albumData)
    return { ...held, artist: artist || held.artist, title: title || held.title }
}

/** With no artist on one side the names prove nothing: the rule would accept any artist. */
const sameByNames = (one, other) => Boolean(one.artist && other.artist) && compareAlbumIdentity(one, other).same

const sameId = (one, other) => one !== null && one === other

const isSameAlbum = (one, other) =>
    sameId(one.appleId, other.appleId) || sameId(one.id, other.id) || sameByNames(one, other)

/**
 * The albums seen so far, to ask "is this one among them?": the ids are looked up, the names are
 * asked of the rule one by one (the rule owns how a title is read).
 */
function createKnownAlbums() {
    const byId = new Map()
    const byAppleId = new Map()
    const all = []
    const remember = (map, key, entry) => { if (key !== null && !map.has(key)) map.set(key, entry) }
    return {
        add(keys, value) {
            const entry = { keys, value }
            all.push(entry)
            remember(byId, keys.id, entry)
            remember(byAppleId, keys.appleId, entry)
        },
        find(keys) {
            const found = byAppleId.get(keys.appleId) || byId.get(keys.id) || all.find(entry => sameByNames(keys, entry.keys))
            return found ? found.value : null
        }
    }
}

/**
 * Is this album in the inventory?
 * @param {Object} album - { id, artist, title, appleMusicId?, metadata? }: a loaded album or one made from a query
 * @param {Array<Object>} items - the items of the inventory
 * @returns {Object|null} the item that holds it, or null
 */
export function findInInventory(album, items) {
    const keys = keysOfAlbum(album)
    return (items || []).find(item => isSameAlbum(keys, keysOfItem(item))) || null
}

/** Every entry of every series, in order: the series as given, the queries as stored. */
const entriesOf = (series) => (series || []).flatMap(one =>
    (one?.albumQueries || []).map(query => ({ query, series: one?.name || '' })))

const skipped = (query, series, reason) => {
    const { artist, title } = askedAlbum(query)
    return { artist, title, series, reason }
}

/**
 * What "add the albums of my series" will do: which albums go in and which entries do not.
 * Nothing is changed: the inventory items are only read.
 *
 * @param {Array<{ name?: string, albumQueries?: Array<string|Object> }>} series - the person's series
 * @param {Array<Object>} items - the inventory as it is
 * @returns {{ toAdd: Array<Object>, skipped: Array<{ artist: string, title: string, series: string, reason: string }>,
 *   seriesCount: number, alreadyThere: number, repeated: number, incomplete: number }}
 *   `toAdd`: one album per album to write (inventoryAlbumFromQuery), the first entry met of each;
 *   `seriesCount`: the series that have albums; `alreadyThere`: how many albums of the inventory
 *   the series ask for (each one once, whatever the number of series).
 */
export function planSeriesAlbums(series, items) {
    const inventory = createKnownAlbums()
    ;(items || []).forEach(item => inventory.add(keysOfItem(item), item))
    const planned = createKnownAlbums()
    const plan = { toAdd: [], skipped: [] }
    const itemsAskedFor = new Set()
    const skip = (entry, reason) => plan.skipped.push(skipped(entry.query, entry.series, reason))

    entriesOf(series).forEach(entry => {
        const album = inventoryAlbumFromQuery(entry.query)
        if (!album) return skip(entry, SkipReason.INCOMPLETE)

        const keys = keysOfAlbum(album)
        const item = inventory.find(keys)
        if (item) {
            itemsAskedFor.add(item)
            return skip(entry, SkipReason.ALREADY_IN_INVENTORY)
        }
        if (planned.find(keys)) return skip(entry, SkipReason.REPEATED_IN_SERIES)

        planned.add(keys, album)
        plan.toAdd.push(album)
    })

    const count = (reason) => plan.skipped.filter(one => one.reason === reason).length
    return {
        ...plan,
        seriesCount: (series || []).filter(one => (one?.albumQueries || []).length > 0).length,
        alreadyThere: itemsAskedFor.size,
        repeated: count(SkipReason.REPEATED_IN_SERIES),
        incomplete: count(SkipReason.INCOMPLETE)
    }
}

// ---- What the person is told ----------------------------------------------------------------------
// A rule gives a code and the numbers; the words are in the dictionary of the screen (i18n/inventoryTexts.js).

/**
 * The question asked before anything is written, as the parts the screen says one after the other.
 * @param {Object} plan - of planSeriesAlbums, with something to add
 * @returns {Array<{ code: string, count: number, series?: number }>}
 */
export function confirmationOf(plan) {
    const { alreadyThere, repeated, incomplete } = plan
    const parts = [{ code: 'willAdd', count: plan.toAdd.length, series: plan.seriesCount }]
    if (alreadyThere > 0) parts.push({ code: 'alreadyThere', count: alreadyThere })
    if (repeated > 0) parts.push({ code: 'repeated', count: repeated })
    if (incomplete > 0) parts.push({ code: 'incomplete', count: incomplete })
    return parts
}

/** What is said when the plan has nothing to add: every album is already there, or the series have none. */
export const nothingToAddOf = (plan) => (plan.alreadyThere > 0 ? 'alreadyThere' : 'noAlbums')

/** What the button says while the albums are written: `counting` before the first is written, `adding` after. */
export const progressOf = ({ added, total }) => (added > 0 ? { code: 'adding', added, total } : { code: 'counting', total })

/**
 * The honest end, as the parts the screen says one after the other.
 * @param {{ added: number, total: number, error: string|null, reloaded?: boolean }} result - of InventoryService.addAlbumsAsNotOwned
 * @returns {{ ok: boolean, parts: Array<Object> }}
 */
export function outcomeOf({ added, total, error, reloaded = true }) {
    if (!error) return { ok: true, parts: [{ code: 'added', count: added }, ...(reloaded ? [] : [{ code: 'reload' }])] }
    if (added === 0) return { ok: false, parts: [{ code: 'noneAdded' }] }
    return { ok: false, parts: [{ code: 'partlyAdded', added, total }, { code: 'notAdded', count: total - added }] }
}
