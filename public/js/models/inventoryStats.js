/**
 * inventoryStats
 *
 * The numbers of the inventory, as a pure rule (F58, UAT-18: the store holds the albums; what is
 * counted from them is derived here).
 */

import { InventoryStatus, countByStatus, statusOf } from './inventoryStatus.js'

/** The formats always listed, even with no album. A format outside this list is counted too. */
const KNOWN_FORMATS = Object.freeze(['cd', 'vinyl', 'dvd', 'bluray', 'digital'])

/** The currencies the inventory adds up. A price in another currency adds nothing. */
const CURRENCIES = Object.freeze(['USD', 'BRL'])

const isOwned = (album) => statusOf(album) === InventoryStatus.OWNED

/** Every album is in one of the three statuses (models/inventoryStatus.js). */
function countByOwnership(albums) {
    const counts = countByStatus(albums)
    return {
        ownedCount: counts[InventoryStatus.OWNED],
        notOwnedCount: counts[InventoryStatus.NOT_OWNED],
        wishlistCount: counts[InventoryStatus.WISHLIST]
    }
}

function countByFormat(albums) {
    const byFormat = Object.fromEntries(KNOWN_FORMATS.map(format => [format, 0]))
    albums.filter(album => album.format).forEach(album => {
        byFormat[album.format] = (byFormat[album.format] || 0) + 1
    })
    return byFormat
}

/** A price counts when it is there, is a number and is not zero. No currency means USD. */
const hasPrice = (album) => Boolean(album.purchasePrice) && !isNaN(album.purchasePrice)
const currencyOf = (album) => album.currency || 'USD'

/** What the priced albums of one currency add up to, all of them and the owned ones. */
function valueIn(currency, albums) {
    const priced = albums.filter(album => hasPrice(album) && currencyOf(album) === currency)
    const sum = (list) => list.reduce((total, album) => total + Number(album.purchasePrice), 0)
    const total = sum(priced)
    return {
        total,
        owned: sum(priced.filter(isOwned)),
        average: priced.length > 0 ? total / priced.length : 0
    }
}

/**
 * @param {Array<Object>} albums - the albums of the inventory
 * @returns {Object} totals, counts by ownership and format, and values by currency
 */
export function inventoryStatistics(albums) {
    const [usd, brl] = CURRENCIES.map(currency => valueIn(currency, albums))
    return {
        totalAlbums: albums.length,
        ...countByOwnership(albums),
        byFormat: countByFormat(albums),
        totalValueUSD: usd.total,
        totalValueBRL: brl.total,
        ownedValueUSD: usd.owned,
        ownedValueBRL: brl.owned,
        averagePriceUSD: usd.average,
        averagePriceBRL: brl.average
    }
}
