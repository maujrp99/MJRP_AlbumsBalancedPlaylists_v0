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

/** What the album window says above the links. */
export const BUY_LINKS_NOTE = 'Each link opens the store on this album, on CD. The app earns nothing from these links today.'
/** Why "Sell" and "Trade" cannot be pressed. */
export const SELL_TRADE_SOON = 'Selling and trading between collectors: not in the app yet'
