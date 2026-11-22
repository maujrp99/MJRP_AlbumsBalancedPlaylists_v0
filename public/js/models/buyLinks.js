/**
 * buyLinks - "Where to buy" (F75, REQ-11): the ONE place that makes the address of a store for an
 * album. Each link opens the store on a search for the artist, the title and "CD"; the app reads
 * no price from those stores.
 *
 * An affiliate tag, the day the owner has the accounts, is added here and nowhere else: one entry
 * in AFFILIATE_PARAMETERS per store. Today there is none, and no address carries one.
 */

/** store -> { parameter name: value } to add to its address. Empty: the app earns nothing from these links today. */
const AFFILIATE_PARAMETERS = Object.freeze({})

const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

/** The stores, in the order the screen shows them. `address` gets the artist and the title as written. */
const STORES = Object.freeze([
    {
        id: 'discogs',
        name: 'Discogs',
        address: (artist, title) => ['https://www.discogs.com/search/', { q: `${artist} ${title}`, format_exact: 'CD', type: 'release' }]
    },
    {
        id: 'amazon',
        name: 'Amazon',
        address: (artist, title) => ['https://www.amazon.com/s', { k: `${artist} ${title} CD` }]
    },
    {
        id: 'imusic',
        name: 'iMusic',
        address: (artist, title) => ['https://imusic.br.com/search', { query: `${artist} ${title} CD` }]
    }
])

const withParameters = (base, parameters) => `${base}?${new URLSearchParams(parameters).toString()}`

/**
 * The links of an album, one per store.
 * @param {{ artist?: string, title?: string }} album
 * @returns {Array<{ id: string, name: string, url: string }>} empty when the album has neither artist nor title
 */
export function buyLinksOf(album) {
    const artist = text(album?.artist)
    const title = text(album?.title)
    if (!artist && !title) return []
    return STORES.map(store => {
        const [base, parameters] = store.address(artist, title)
        const search = Object.fromEntries(Object.entries(parameters).map(([name, value]) => [name, text(value)]))
        return { id: store.id, name: store.name, url: withParameters(base, { ...search, ...AFFILIATE_PARAMETERS[store.id] }) }
    })
}

/**
 * Where a link is on the screen, for the measurement of use (F77, `buy_link_opened`): the card of
 * the inventory, the album window (computer and phone), the sheet of the album on the phone.
 */
export const BuyLinkPlace = Object.freeze({ CARD: 'card', ALBUM_WINDOW: 'album_window', PHONE_SHEET: 'phone_sheet' })

/**
 * The marks a buy link carries so that a click on it is measured (services/usage/usageWiring.js
 * listens for them): the id of the store and the place. Never the album.
 * @param {string} storeId - `id` of a link of buyLinksOf
 * @param {string} place - one of BuyLinkPlace
 * @returns {{ buyStore: string, buyPlace: string }} for a `dataset`
 */
export const buyLinkMarks = (storeId, place) => ({ buyStore: storeId, buyPlace: place })

/** The same marks, as attributes of an HTML string (the values are ids, never text from outside). */
export const buyLinkAttributes = (storeId, place) => `data-buy-store="${storeId}" data-buy-place="${place}"`
