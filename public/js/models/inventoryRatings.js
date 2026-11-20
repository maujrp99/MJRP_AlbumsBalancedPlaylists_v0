/**
 * inventoryRatings - "Update ratings" (F71, S-56), as pure rules.
 *
 * The inventory keeps, in each item, the two averages of its album (`averages`, see
 * docs/specs/data-model.md): the browser keeps loaded albums for 7 days and by the query of a
 * series, so the inventory cannot read them from there later. "Update ratings" asks the album
 * load for every album of the inventory (the one door, services/albums/AlbumAsks.js), and this
 * file makes the ask from the items and turns the answer into what is written.
 *
 * Which item an album belongs to is decided by the one rule of models/inventoryFromSeries.js
 * (`findInInventory`); this file compares no text itself.
 */

import { SourceGap } from './albumAsk.js'
import { averagesOfAlbum } from './albumAverages.js'
import { appleIdOf, findInInventory } from './inventoryFromSeries.js'

/** The id of the one series the ask is made of; it exists only inside the load while the ask waits. */
export const RATINGS_SERIES_ID = 'inventory-ratings'

/** The enrichment sources the averages are made of (models/albumLoadState.js ENRICHMENT_SOURCES). */
export const RATING_SOURCES = Object.freeze(['acclaim', 'popularity'])

/** Above this many albums the person is asked before the read starts: it takes minutes. */
export const CONFIRM_FROM = 30

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * The query of a series that asks for the album of an item: the shape `toAlbumQuery` stores
 * (models/albumQuery.js). The Apple Music id, when the item holds one, makes the load take the
 * edition the person has.
 * @param {Object} item - an inventory item
 */
export function queryOfItem(item) {
    const held = item?.albumData || {}
    const first = (...values) => values.find(Boolean) || ''
    return {
        artist: first(item?.artist, held.artist),
        title: first(item?.title, held.title),
        appleMusicId: appleIdOf(held),
        year: [item?.year, held.year].find(year => year !== undefined && year !== null) ?? null,
        coverUrl: null
    }
}

/** The one series the ask carries: a query for each item, in the order of the items. */
export const ratingsAskOf = (items) => ({ id: RATINGS_SERIES_ID, albumQueries: items.map(queryOfItem) })

// ---- What the answer becomes ----------------------------------------------------------------------

/** One average with its count: the new one, or the previous one when this time nothing came. */
function pick(name, countName, fresh, previous) {
    const useFresh = isNumber(fresh[name]) || !isNumber(previous?.[name])
    const from = useFresh ? fresh : previous
    return { [name]: from[name] ?? null, [countName]: from[countName] ?? 0 }
}

/**
 * The `averages` an item is written with after a read: what came now, and for an average that
 * came as nothing the value the item already had (a number is never overwritten by "nothing").
 * @param {Object|undefined} previous - `item.averages`
 * @param {{ rating, popularity, ratedTracks, popTracks }} fresh - of models/albumAverages.js
 * @param {string} at - ISO time of the read
 * @returns {Object|null} null when nothing came: there is nothing to write
 */
export function mergeAverages(previous, fresh, at) {
    if (!isNumber(fresh.rating) && !isNumber(fresh.popularity)) return null
    const tracks = isNumber(fresh.tracks) ? fresh.tracks : (previous?.tracks ?? null)
    return { ...pick('rating', 'ratedTracks', fresh, previous), ...pick('popularity', 'popTracks', fresh, previous), tracks, at }
}

const countGaps = (missing, matches) => missing.filter(matches).length

/**
 * The cover the album has and the item lacks (UAT-222): an album that came from a series whose
 * entry kept no cover address shows the stand-in until the album is loaded. A cover the item
 * already has is never replaced.
 * @returns {string|null}
 */
export function missingCoverOf(item, album) {
    const has = item?.albumData?.coverUrl
    const offered = album?.coverUrl
    return !has && typeof offered === 'string' && offered ? offered : null
}

/**
 * What the answer of the ask is worth.
 * @param {Object[]} items - the inventory the ask was made from
 * @param {Object} result - AlbumsResult (models/albumAsk.js)
 * @param {string} at - ISO time of the read
 * @returns {{ updates: Array<{ id: string, averages?: Object, coverUrl?: string }>, notFound: number, withoutRatings: number,
 *   popularityNotConnected: number, unanswered: number }}
 *   `notFound`: items no ready album answers for; `withoutRatings`: items whose album came but with
 *   nothing new to write; the last two count the albums a source could not give.
 */
export function planAverages(items, result, at) {
    const found = new Map()
    result.albums.forEach(album => {
        const item = findInInventory(album, items)
        if (item && !found.has(item)) found.set(item, album)
    })

    const updates = []
    let rated = 0
    found.forEach((album, item) => {
        const averages = mergeAverages(item.averages, averagesOfAlbum(album), at)
        const coverUrl = missingCoverOf(item, album)
        if (averages) rated += 1
        if (averages || coverUrl) updates.push({ id: item.id, ...(averages && { averages }), ...(coverUrl && { coverUrl }) })
    })

    const missing = result.missingSources || []
    return {
        updates,
        notFound: items.length - found.size,
        withoutRatings: found.size - rated,
        popularityNotConnected: countGaps(missing, one => one.source === 'popularity' && one.gap === SourceGap.NOT_CONNECTED),
        unanswered: countGaps(missing, one => one.gap === SourceGap.FAILED || one.gap === SourceGap.WAITING)
    }
}

// ---- What the person is told ----------------------------------------------------------------------

const albums = (number) => `${number} ${number === 1 ? 'album' : 'albums'}`

/** The question asked before a long read. */
export const ratingsQuestion = (count) => ({
    title: 'Update ratings?',
    message: `Read the ratings of ${albums(count)}? This can take a few minutes.`,
    confirmText: 'Read ratings'
})

/** What the button says: `{ phase: 'reading', done, total }` or `{ phase: 'saving' }`. */
export function ratingsProgressText({ phase, done, total }) {
    return phase === 'saving' ? 'Saving ratings…' : `Reading ratings… ${done} of ${total}`
}

/** The sentences about what was left out or kept, in the order the person cares. */
function aboutTheRest({ notFound, withoutRatings, popularityNotConnected, unanswered }) {
    const sentences = []
    if (notFound > 0) sentences.push(`${albums(notFound)} ${notFound === 1 ? 'was' : 'were'} not found.`)
    if (withoutRatings > 0) sentences.push(`${albums(withoutRatings)} had no ratings at ${withoutRatings === 1 ? 'its' : 'their'} sources.`)
    if (popularityNotConnected > 0) sentences.push(`Spotify is not connected: popularity was not read for ${albums(popularityNotConnected)}.`)
    if (unanswered > 0) sentences.push(`A source did not answer for ${albums(unanswered)}: the numbers ${unanswered === 1 ? 'it' : 'they'} had before were kept.`)
    return sentences
}

/**
 * The honest end.
 * @param {{ total: number, planned: number, saved: number, error: string|null }} result - of InventoryService.updateAverages, with the counts of planAverages
 * @returns {{ ok: boolean, text: string }}
 */
export function ratingsOutcome(result) {
    const { total, planned, saved, error } = result
    const covers = result.covers > 0 ? [`${albums(result.covers)} got ${result.covers === 1 ? 'its' : 'their'} cover.`] : []
    if (!error) return { ok: true, text: [`Ratings updated for ${saved} of ${albums(total)}.`, ...aboutTheRest(result), ...covers].join(' ') }
    if (saved === 0) return { ok: false, text: 'No ratings were saved: the write failed and your inventory is as it was. Try again.' }
    return { ok: false, text: `Saved ratings for ${saved} of ${albums(planned)}, then a write failed. Run Update ratings again to save the rest.` }
}
