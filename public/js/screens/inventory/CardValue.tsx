/**
 * The lower half of an inventory card, and the line of a row of the list (F83 wave 6a; the port of views/renderers/InventoryCardValue.js, the
 * pattern the owner chose in the prototype v5.1): five lines, the SAME five in every card, so that neighbours line up.
 *
 *   1  the label of the value, by status   «In my collection · worth» | «Not mine yet · costs»
 *   2  where the value comes from (a Discogs value: «Discogs · 18 Nov» over «CD · lowest»), and the value with «≈» (a dash when there is none)
 *   3  the two averages, each with its icon
 *   4  the label of the actions            «Sell, trade or buy» | «Where to buy»
 *   5  the actions, as links
 *
 * Nothing wraps: a long text is cut, and the whole text is in its `title`. The money is written by the models (`moneyOf`: it rounds to the cent
 * before it formats), never by `Intl` here. Every address goes through `safeUrl`; a text from outside is text.
 */
import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { t } from '../../i18n/t.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { Icon } from '../../ui/Icon'
import { popularityValue, ratingValue, tracksMadeOf } from '../../models/albumAverages.js'
import { DISCOGS_CREDIT, discogsHint, noValueText, readOnText, valueLabel, ValueOrigin } from '../../models/inventoryValue.js'
import { BuyLinkPlace, SELL_TRADE_SOON, buyLinkMarks, buyLinksOf } from '../../models/buyLinks.js'
import { formatOf, isOwned, kindWordOf } from '../../models/inventoryCard.js'
import { amountText } from './money'
import type { Averages, InventoryItem, ItemValue, Money } from './types'

const LABEL = 'text-[11px] text-gray-400 uppercase tracking-widest whitespace-nowrap truncate'
/** The edge of the value: green for what is in the collection, orange for what is not. */
const EDGE = { owned: '#22c55e', other: '#f97316' }

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** "Discogs", linked to the page of the edition the value is of. */
function DiscogsName({ value }: { value: ItemValue }) {
    const url = safeUrl(value.release?.url)
    if (!url) return <>Discogs</>
    return <a href={url} target="_blank" rel="noopener" className="underline hover:text-white" title={`${DISCOGS_CREDIT} ${t('inventory.card.edition')}`}>Discogs</a>
}

/** Line 2, left: the Discogs value on two short lines that never shrink, anything else on one that gives way (its whole text is in the `title`). */
function Origin({ item, value }: { item: InventoryItem; value: ItemValue }) {
    if (value.origin === ValueOrigin.DISCOGS) {
        const tail = readOnText(value)
        return (
            <span className="min-w-0 flex flex-col text-[11px] leading-[13px] text-gray-400 whitespace-nowrap" title={discogsHint(value)}>
                <span data-role="origin-source"><DiscogsName value={value} />{tail ? ` · ${tail}` : ''}</span>
                {'\n'}
                <span data-role="origin-kind">{`CD · ${t(`inventory.card.kind.${kindWordOf(value)}`)}`}</span>
            </span>
        )
    }
    const text = value.origin === ValueOrigin.YOURS ? `${formatOf(item)} · ${t('inventory.card.writtenByYou')}` : noValueText(value)
    return <span className="min-w-0 flex text-xs text-gray-400 whitespace-nowrap" title={text}><span className="truncate">{text}</span></span>
}

/** One average: its icon, the number, and of how many tracks it was made. */
function Score({ icon, iconClass, label, hint, shown, made }: { icon: string; iconClass: string; label: string; hint: string; shown: string; made: string }) {
    return (
        <span className="flex items-center gap-1 text-xs text-gray-400" title={hint}>
            <Icon name={icon} className={iconClass} /><span className="sr-only">{label}</span><strong className="text-white">{shown}</strong>{made ? <span>{`(${made})`}</span> : null}
        </span>
    )
}

/** Line 3: the averages the item has; an item that was never read keeps the line, empty. */
function Scores({ averages }: { averages?: Averages }) {
    return (
        <>
            {isNumber(averages?.rating) ? <Score icon="Award" iconClass="w-3 h-3 text-brand-orange" label={t('inventory.avg.rating')} hint={t('inventory.avg.ratingHint')} shown={ratingValue(averages)} made={tracksMadeOf(averages?.ratedTracks, averages?.tracks)} /> : null}
            {isNumber(averages?.popularity) ? <Score icon="Spotify" iconClass="w-3 h-3 text-[#1DB954]" label={t('inventory.avg.pop')} hint={t('inventory.avg.popHint')} shown={popularityValue(averages)} made={tracksMadeOf(averages?.popTracks, averages?.tracks)} /> : null}
        </>
    )
}

const Dot = () => <span className="text-gray-400 text-xs">·</span>

const NotYet = ({ word }: { word: string }) => <span className="text-xs text-gray-400 opacity-50 cursor-not-allowed" aria-disabled="true" title={SELL_TRADE_SOON}>{word}</span>

/** Line 5: what is owned can be sold or traded one day, and its links are in its window; what is not owned shows where to buy it. */
function Actions({ item }: { item: InventoryItem }) {
    if (!isOwned(item)) {
        return (
            <>
                {buyLinksOf(item).map(({ id, name, url }: { id: string; name: string; url: string }, index: number) => {
                    const marks = buyLinkMarks(id, BuyLinkPlace.CARD)
                    return (
                        <Fragment key={id}>
                            {index > 0 ? <Dot /> : null}
                            <a href={safeUrl(url) as string} target="_blank" rel="noopener" className="text-xs text-accent-primary" data-store={name} data-buy-store={marks.buyStore} data-buy-place={marks.buyPlace}>{`${name} ↗`}</a>
                        </Fragment>
                    )
                })}
            </>
        )
    }
    return (
        <>
            <NotYet word={t('inventory.card.sell')} /><Dot /><NotYet word={t('inventory.card.trade')} /><Dot />
            <button type="button" className="text-xs text-accent-primary" data-action="view-modal" data-id={item.id}>{t('inventory.card.whereToBuy')}</button>
        </>
    )
}

/** The lower half of the card of an item. */
export function CardValue({ item, value, money }: { item: InventoryItem; value: ItemValue; money: Money }) {
    const owned = isOwned(item)
    const amount = amountText(value, money)
    const edge: CSSProperties = { borderLeft: `3px solid ${owned ? EDGE.owned : EDGE.other}` }
    return (
        <div className="border-t border-white/10 mt-2" data-role="value" data-origin={value.origin || 'none'}>
            <div className="py-2 px-3 flex flex-col gap-1" style={edge}>
                <div className={LABEL} data-line="1">{valueLabel(item)}</div>
                <div className="flex items-center justify-between gap-2" data-line="2">
                    <Origin item={item} value={value} />
                    {' '}
                    <strong className="text-lg text-white tabular-nums whitespace-nowrap" data-role="amount">{amount}</strong>
                </div>
            </div>
            <div className="py-2 flex items-center justify-between gap-2 border-t border-white/10 whitespace-nowrap" style={{ minHeight: '2.25rem' }} data-role="averages" data-line="3"><Scores averages={item.averages} /></div>
            <div className="py-2 border-t border-white/10 flex flex-col gap-1">
                <span className={LABEL} data-line="4">{owned ? t('inventory.card.sellTradeBuy') : t('inventory.card.whereToBuy')}</span>
                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden" data-line="5"><Actions item={item} /></div>
            </div>
        </div>
    )
}

/** The value of an item in one short line, for the list view. */
export function RowValue({ item, value, money }: { item: InventoryItem; value: ItemValue; money: Money }) {
    const amount = amountText(value, money)
    let line: ReactNode
    let hint: string
    if (value.origin === ValueOrigin.DISCOGS) {
        const tail = readOnText(value)
        line = <>{'CD · '}<DiscogsName value={value} />{` · ${t(`inventory.card.kind.${kindWordOf(value)}`)}${tail ? ` · ${tail}` : ''}`}</>
        hint = discogsHint(value)
    } else {
        const text = value.origin === ValueOrigin.YOURS ? `${formatOf(item)} · ${t('inventory.card.writtenByYou')}` : noValueText(value)
        line = text
        hint = text
    }
    return <span className="text-xs text-gray-400 whitespace-nowrap" data-role="value" title={hint}>{line}{' '}<strong className="text-white tabular-nums">{amount}</strong></span>
}
