/**
 * «Where to buy» - the three stores, each on a search for this album on CD (F75, REQ-11; F83 wave 6b: the port of the second half of
 * components/InventoryValueSection.js, with the same HTML and the same classes). The computer draws a box with the three buttons; the phone (F76,
 * recheck N7) draws one line, folded, so the tracks start on the first screen. Every address goes through `safeUrl`; every link carries the marks the
 * measurement of use listens for (services/usage/usageWiring.js: the store and the place, never the album).
 */
import { t } from '../../i18n/t.js'
import { BUY_LINKS_NOTE, BuyLinkPlace, buyLinksOf } from '../../models/buyLinks.js'
import { safeUrl } from '../../utils/safeUrl.js'
import type { ItemLike } from './types'


const BOX = 'bg-black/20 rounded-xl border border-white/10 p-3'

/** The links of an item: the item holds the artist and the title, or its album does. */
const linksOf = (album: ItemLike) => buyLinksOf(album) as Array<{ id: string; name: string; url: string }>

export function BuyLinks({ album }: { album: ItemLike }) {
    return (
        <div className={`${BOX} mb-6`} data-role="where-to-buy" style={{ padding: '1rem' }}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('inventory.value.whereToBuy')}</h3>
            <p className="text-sm text-gray-400 mb-3">{BUY_LINKS_NOTE}</p>
            <div className="flex flex-wrap gap-3">
                {linksOf(album).map(({ id, name, url }) => (
                    <a key={id} className="btn btn-secondary" href={safeUrl(url) as string} target="_blank" rel="noopener" data-store={name} data-buy-store={id} data-buy-place={BuyLinkPlace.ALBUM_WINDOW}>{`${name} ↗`}</a>
                ))}
            </div>
        </div>
    )
}

/** «Where to buy» on the phone: the three stores in one row, and what the links are. */
export function PhoneBuyLinks({ album }: { album: ItemLike }) {
    return (
        <div className="value-fold value-fold--buy" data-role="where-to-buy">
            <p className="value-fold__label">{t('inventory.value.whereToBuy')}</p>
            <div className="value-fold__stores">
                {linksOf(album).map(({ id, name, url }) => (
                    <a key={id} className="value-fold__store" href={safeUrl(url) as string} target="_blank" rel="noopener" data-store={name} data-buy-store={id} data-buy-place={BuyLinkPlace.ALBUM_WINDOW}>{`${name} ↗`}</a>
                ))}
            </div>
            <p className="value-fold__note">{BUY_LINKS_NOTE}</p>
        </div>
    )
}
