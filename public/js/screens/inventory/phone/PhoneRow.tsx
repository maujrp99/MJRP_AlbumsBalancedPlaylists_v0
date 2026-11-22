/**
 * The inventory on the phone (F83 wave 6a; the port of views/renderers/InventoryPhoneRow.js and InventoryPhoneTile.js, F76 TASK-07 and F89): one
 * compact row per album, or one card of the gallery of covers, with the same pieces and the same actions. Styles: public/css/mobile/inventory.css.
 *
 *   [cover 64]  Title, up to two lines               ≈ $12.40
 *               Artist                               Discogs
 *               [✓ Owned ▾]  ★ 78.4 · ◉ 42%           [⋯]
 *
 * A tap on the row (or the card) opens the window of the album, as «View» does on the computer; the status button opens a short sheet with the
 * three statuses; «⋯» opens the sheet of the named actions of the album. What the row leaves out of the card (the two labels, the store links, Sell
 * and Trade, the number of tracks behind each average) is in the «⋯» sheet or in the window of the album.
 */
import { t } from '../../../i18n/t.js'
import { CoverImage } from '../../../ui/CoverImage'
import { Icon } from '../../../ui/Icon'
import { popularityValue, ratingValue } from '../../../models/albumAverages.js'
import { statusLabel, statusOf } from '../../../models/inventoryStatus.js'
import { NOT_KNOWN, STATUS_MARK, formatOf, originOf } from '../../../models/inventoryCard.js'
import { amountText } from '../money'
import type { Averages, InventoryItem, ItemValue, Money } from '../types'

/** Three dots: the «⋯» of a row and of the screen. */
export const MoreIcon = () => (
    <svg className="inv-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
)

/** The arrow that says a status pill can be tapped; the row and the card of the gallery draw the same one. */
export const Chevron = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
)

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** The status as the row shows it: "✓ Owned", "Not Owned", "♡ Wishlist". */
export const statusText = (status: string): string => `${(STATUS_MARK as Record<string, string>)[status] || ''}${statusLabel(status)}`

/** What the row says of where the value comes from: short, the long words are in the «⋯» sheet. */
export function originText(value: ItemValue): string {
    const origin = originOf(value) as { kind: string; date?: string; text?: string }
    if (origin.kind === 'discogs') return ['Discogs', origin.date].filter(Boolean).join(' · ')
    if (origin.kind === 'yours') return t('inventory.phone.yours')
    return origin.text as string
}

/** The two averages, in one short line; an album never read shows nothing. */
export function Scores({ averages }: { averages?: Averages }) {
    const one = (icon: string, label: string, shown: string) => (
        <span className="inv-row__score"><Icon name={icon} className="inv-row__score-icon" /><span className="sr-only">{label}</span>{shown}</span>
    )
    return (
        <>
            {isNumber(averages?.rating) ? one('Award', t('inventory.avg.rating'), ratingValue(averages)) : null}
            {isNumber(averages?.popularity) ? one('Spotify', t('inventory.avg.pop'), popularityValue(averages)) : null}
        </>
    )
}

export const hasScores = (averages?: Averages): boolean => isNumber(averages?.rating) || isNumber(averages?.popularity)

export interface PhoneActions {
    onView: (id: string) => void
    onStatus: (id: string) => void
    onMore: (id: string) => void
}

const coverOf = (item: InventoryItem, className: string) => (
    <CoverImage src={item.albumData?.coverUrl || item.coverUrl || null} alt="" loading="lazy" decoding="async" className={className} />
)

const titleOf = (item: InventoryItem) => item.title || t('inventory.phone.unknownTitle')
const artistOf = (item: InventoryItem) => item.artist || t('inventory.phone.unknownArtist')

/** One row of the phone. */
export function PhoneRow({ item, value, money, actions }: { item: InventoryItem; value: ItemValue | undefined; money: Money; actions: PhoneActions }) {
    const id = item.id
    const title = titleOf(item)
    const artist = artistOf(item)
    const status = statusOf(item)
    const known = value || NOT_KNOWN
    const amount = amountText(known as ItemValue, money)
    return (
        <li className="inv-row" data-album-id={id} data-status={status}>
            <button type="button" className="inv-row__open" data-action="view-modal" data-id={id} aria-label={t('inventory.phone.open', { title, artist })} onClick={() => actions.onView(id)} />
            {coverOf(item, 'inv-row__cover')}
            <div className="inv-row__text"><span className="inv-row__title">{title}</span><span className="inv-row__artist">{artist}</span></div>
            <div className="inv-row__value" data-role="value" data-origin={known.origin || 'none'}>
                <strong className="inv-row__amount" data-role="amount">{amount}</strong>
                <span className="inv-row__origin">{originText(known)}</span>
            </div>
            <div className="inv-row__bar">
                <button type="button" className="inv-row__status" data-phone-action="status" data-album-id={id} data-status={status} aria-haspopup="dialog" aria-label={t('inventory.phone.statusLabel', { status: statusLabel(status) })} onClick={() => actions.onStatus(id)}>
                    <span className="inv-row__pill">{statusText(status)}<Chevron className="inv-row__chevron" /></span>
                </button>
                <span className="inv-row__scores" data-role="averages"><Scores averages={item.averages} /></span>
                <button type="button" className="inv-row__more" data-phone-action="more" data-album-id={id} aria-haspopup="dialog" aria-label={t('inventory.phone.actionsFor', { title })} onClick={() => actions.onMore(id)}><MoreIcon /></button>
            </div>
        </li>
    )
}

/** One card of the gallery: the cover, the title and the artist, the value with the format and where it comes from, the averages when it has them, the status and «⋯». */
export function PhoneTile({ item, value, money, actions }: { item: InventoryItem; value: ItemValue | undefined; money: Money; actions: PhoneActions }) {
    const id = item.id
    const title = titleOf(item)
    const artist = artistOf(item)
    const status = statusOf(item)
    const known = value || NOT_KNOWN
    const amount = amountText(known as ItemValue, money)
    const origin = `${formatOf(item)} · ${originText(known)}`
    return (
        <li className="inv-tile" data-album-id={id} data-status={status}>
            <button type="button" className="inv-tile__open" data-action="view-modal" data-id={id} aria-label={t('inventory.phone.open', { title, artist })} onClick={() => actions.onView(id)} />
            {coverOf(item, 'inv-tile__cover')}
            <div className="inv-tile__text"><span className="inv-tile__title">{title}</span><span className="inv-tile__artist">{artist}</span></div>
            <div className="inv-tile__value" data-role="value" data-origin={known.origin || 'none'}>
                <strong className="inv-tile__amount" data-role="amount">{amount}</strong>
                <span className="inv-tile__origin" title={origin}>{origin}</span>
            </div>
            {hasScores(item.averages) ? <div className="inv-tile__scores" data-role="averages"><Scores averages={item.averages} /></div> : null}
            <div className="inv-tile__bar">
                <button type="button" className="inv-tile__status" data-phone-action="status" data-album-id={id} data-status={status} aria-haspopup="dialog" aria-label={t('inventory.phone.statusLabel', { status: statusLabel(status) })} onClick={() => actions.onStatus(id)}>
                    <span className="inv-tile__pill"><span className="inv-tile__pill-text">{statusText(status)}</span><Chevron className="inv-tile__chevron" /></span>
                </button>
                <button type="button" className="inv-tile__more" data-phone-action="more" data-album-id={id} aria-haspopup="dialog" aria-label={t('inventory.phone.actionsFor', { title })} onClick={() => actions.onMore(id)}><MoreIcon /></button>
            </div>
        </li>
    )
}
