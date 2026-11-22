/**
 * The sheets of the inventory on the phone (F83 wave 6a; the port of views/InventoryPhoneSheets.js, F76 TASK-07). The motor of the sheet stays the
 * hand-made one (ui/SheetWindow.tsx); what is inside is React. Styles: public/css/mobile/inventory.css.
 *
 *   status      the three statuses, the current one checked: two taps change it
 *   item        the named actions of one album: open, edit, its value (with «Data provided by Discogs.» beside a Discogs value), where to buy, Sell and Trade (not yet), remove
 *   filters     the view, the format and the order, applied as they are chosen
 *   actions     the actions of the whole collection, each with what it does in words
 *   jump        a letter of the artists, or a stretch of positions
 *   values      the totals in words, the rate, and why the values are the lowest asking prices
 *
 * Every choice closes its sheet first and then does what it asked for: a window that opens after (the edit window, a question) is never under the sheet.
 * What a sheet shows of an item or of the values is what they were when it was opened, as the hand-made sheet showed it.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { t, tPlural } from '../../../i18n/t.js'
import { safeUrl } from '../../../utils/safeUrl.js'
import { Icon } from '../../../ui/Icon'
import { useSheetWindow } from '../../../ui/SheetWindow'
import { BuyLinkPlace, buyLinkMarks, buyLinksOf } from '../../../models/buyLinks.js'
import { InventoryStatus, statusOf } from '../../../models/inventoryStatus.js'
import { BASE_CURRENCY, DISCOGS_CREDIT, ValueOrigin, momentText } from '../../../models/inventoryValue.js'
import { choiceOf } from '../../../models/inventorySort.js'
import {
    buyLinksNote, discogsKindNote, lowestPricesNote, noValueText, ownedNote, rateNote, sellTradeSoon, sortOptions, statusLabel, toBuyNote, valueLabel
} from '../../../i18n/inventoryTexts.js'
import { ViewMode, viewForPhone } from '../../../models/inventoryViewMode.js'
import { jumpTargets, jumpsByLetter } from '../../../models/inventoryJump.js'
import { totalText } from '../../../models/inventoryCard.js'
import { CollectionActions, actionAbout } from '../CollectionActions'
import { amountText } from '../money'
import { editItem, removeItem, viewItem } from '../inventoryActions'
import type { InventoryBridge } from '../InventoryBridge'
import type { InventoryController, InventoryItem, ItemValue, Money, ValueView } from '../types'
import { statusText } from './PhoneRow'

const STATUS_ORDER = [InventoryStatus.OWNED, InventoryStatus.NOT_OWNED, InventoryStatus.WISHLIST]
const FORMATS = ['all', 'cd', 'vinyl', 'digital']
/** The two views of the list, each with the icon the computer's switch uses (F89). */
const VIEWS: Array<[string, string, string]> = [[ViewMode.GRID, 'gallery', 'Grid'], [ViewMode.LIST, 'list', 'List']]

const Heading = ({ children }: { children: ReactNode }) => <p className="inv-sheet__heading">{children}</p>
const Note = ({ children }: { children: ReactNode }) => <p className="inv-sheet__note">{children}</p>
const Group = ({ children }: { children: ReactNode }) => <div className="inv-sheet__group">{children}</div>

/** A choice of a list: a row of 48 px, the chosen one with a check and `aria-pressed`. */
function ChoiceRow({ label, chosen, onPick, sort }: { label: string; chosen: boolean; onPick: () => void; sort?: string }) {
    return <button type="button" className="inv-choice" aria-pressed={chosen} data-sort={sort} onClick={onPick}><span>{label}</span>{chosen ? <Icon name="Check" className="inv-choice__check" /> : null}</button>
}

/** A named action of a sheet: a row of 48 px, with its icon. */
function ActionRow({ icon, label, onPick, danger = false }: { icon: string; label: string; onPick: () => void; danger?: boolean }) {
    return <button type="button" className={`inv-action${danger ? ' inv-action--danger' : ''}`} onClick={onPick}><Icon name={icon} className="inv-action__icon" /><span>{label}</span></button>
}

/** «Data provided by Discogs.», with its link: beside every value of Discogs (F75, REQ-06). */
const DiscogsCredit = ({ className }: { className: string }) => <a className={className} href="https://www.discogs.com/" target="_blank" rel="noopener">{DISCOGS_CREDIT}</a>

const unknownTitle = (item: InventoryItem) => item.title || t('inventory.phone.unknownTitle')
const unknownArtist = (item: InventoryItem) => item.artist || t('inventory.phone.unknownArtist')

// ---------------------------------------------------------------------------------------------- the status of an album

function StatusSheet({ item, close, onChoose }: { item: InventoryItem; close: () => void; onChoose: (status: string) => void }) {
    const now = statusOf(item)
    return (
        <>
            <Note>{`${unknownTitle(item)} · ${unknownArtist(item)}`}</Note>
            <div className="inv-choices" role="group" aria-label={t('inventory.sheet.status.title')}>
                {STATUS_ORDER.map(status => <ChoiceRow key={status} label={statusLabel(status)} chosen={status === now} onPick={() => { close(); if (status !== now) onChoose(status) }} />)}
            </div>
        </>
    )
}

// ---------------------------------------------------------------------------------------------- the actions of an album

/** The value of the album: the amount, where it comes from and, from Discogs, the edition and the credit. */
function ValueGroup({ item, value, money }: { item: InventoryItem; value: ItemValue; money: Money }) {
    const amount = amountText(value, money)
    const url = value.origin === ValueOrigin.DISCOGS ? safeUrl(value.release?.url) : null
    const readOn = value.origin === ValueOrigin.DISCOGS ? momentText(value.readAt) : ''
    return (
        <Group>
            <Heading>{valueLabel(item)}</Heading>
            <p className="inv-sheet__amount">{amount}</p>
            {value.origin === ValueOrigin.YOURS ? <Note>{t('inventory.sheet.item.writtenByYou')}</Note> : null}
            {!value.origin ? <Note>{noValueText(value)}</Note> : null}
            {value.origin === ValueOrigin.DISCOGS ? <Note>{`${discogsKindNote(value)}.`}</Note> : null}
            {readOn ? <Note>{t('inventory.sheet.item.readOn', { when: readOn })}</Note> : null}
            {url ? <a className="inv-link" href={url as string} target="_blank" rel="noopener">{t('inventory.sheet.item.edition')}</a> : null}
            {value.origin === ValueOrigin.DISCOGS ? <DiscogsCredit className="inv-sheet__credit" /> : null}
        </Group>
    )
}

function ItemSheet({ item, known, close, controller, bridge }: { item: InventoryItem; known: { value: ItemValue; money: Money }; close: () => void; controller: InventoryController; bridge: InventoryBridge }) {
    const links = buyLinksOf(item) as Array<{ id: string; name: string; url: string }>
    const pick = (act: () => void) => () => { close(); act() }
    return (
        <div className="inv-sheet">
            <Note>{`${unknownArtist(item)} · ${statusText(statusOf(item))}`}</Note>
            <Group>
                <ActionRow icon="Disc" label={t('inventory.sheet.item.open')} onPick={pick(() => { void viewItem(controller, bridge, item.id) })} />
                <ActionRow icon="Edit" label={t('inventory.card.edit')} onPick={pick(() => { void editItem(controller, item.id) })} />
            </Group>
            <ValueGroup item={item} value={known.value} money={known.money} />
            <Group>
                <Heading>{t('inventory.card.whereToBuy')}</Heading>
                {links.map(({ id, name, url }) => {
                    const marks = buyLinkMarks(id, BuyLinkPlace.PHONE_SHEET)
                    return <a key={id} className="inv-link" href={safeUrl(url) as string} target="_blank" rel="noopener" data-store={name} data-buy-store={marks.buyStore} data-buy-place={marks.buyPlace}>{`${name} ↗`}</a>
                })}
                <Note>{buyLinksNote()}</Note>
            </Group>
            <Group>
                <Heading>{t('inventory.sheet.item.sellOrTrade')}</Heading>
                <div className="inv-sheet__pair">
                    <button type="button" className="inv-action" disabled aria-disabled="true">{t('inventory.card.sell')}</button>
                    <button type="button" className="inv-action" disabled aria-disabled="true">{t('inventory.card.trade')}</button>
                </div>
                <Note>{sellTradeSoon()}</Note>
            </Group>
            <Group><ActionRow icon="Trash2" label={t('inventory.sheet.item.remove')} danger onPick={pick(() => { void removeItem(controller, item.id) })} /></Group>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------- the view, the format and the order

/** The three groups; each choice applies at once and the group is made anew, as the hand-made sheet made it. */
function FiltersBody({ controller }: { controller: InventoryController }) {
    const [round, setRound] = useState(0)
    const state = controller.state
    const view = viewForPhone(state)
    const sort = choiceOf(state.sorting) as string
    const choose = (apply: () => void) => () => { apply(); setRound(round + 1) }
    return (
        <div className="inv-sheet" key={round}>
            <Group>
                <Heading>{t('inventory.sheet.filters.view')}</Heading>
                <div className="inv-segments inv-segments--views" role="group" aria-label={t('inventory.sheet.filters.view')}>
                    {VIEWS.map(([mode, label, icon]) => (
                        <button key={mode} type="button" className="inv-segment inv-segment--view" aria-pressed={view === mode} data-view={mode} onClick={choose(() => controller.handleViewModeChange(mode))}>
                            <Icon name={icon} className="inv-segment__icon" /><span>{t(`inventory.sheet.filters.${label}`)}</span>
                        </button>
                    ))}
                </div>
            </Group>
            <Group>
                <Heading>{t('inventory.sheet.filters.format')}</Heading>
                <div className="inv-segments" role="group" aria-label={t('inventory.sheet.filters.format')}>
                    {FORMATS.map(code => (
                        <button key={code} type="button" className="inv-segment" aria-pressed={state.filters.format === code} data-format={code} onClick={choose(() => controller.handleFilterChange('format', code))}>{t(`inventory.sheet.format.${code}`)}</button>
                    ))}
                </div>
            </Group>
            <Group>
                <Heading>{t('inventory.sheet.filters.sort')}</Heading>
                <div className="inv-choices" role="group" aria-label={t('inventory.sheet.filters.sort')}>
                    {sortOptions().map(({ value, label }: { value: string; label: string }) => <ChoiceRow key={value} label={label} chosen={sort === value} sort={value} onPick={choose(() => controller.handleSortChoice(value))} />)}
                </div>
            </Group>
        </div>
    )
}

function FiltersFooter({ controller, close }: { controller: InventoryController; close: () => void }) {
    const count = controller.state.filteredAlbums.length
    const done = useRef<HTMLButtonElement>(null)
    // the hand-made sheet was opened with its body empty and the main button in the footer: the focus went to that button
    useEffect(() => { done.current?.focus({ preventScroll: true }) }, [])
    return <button ref={done} type="button" className="btn btn-primary" data-role="filters-done" onClick={close}>{tPlural('inventory.sheet.filters.show', count, { count })}</button>
}

// ---------------------------------------------------------------------------------------------- the actions, the jump, the values

function ActionsBody({ controller, close }: { controller: InventoryController; close: () => void }) {
    const ids = ['addSeriesAlbumsBtn', 'updateRatingsBtn', ...(controller.state.value?.source === 'on' ? ['updateValuesBtn'] : [])]
    return (
        // the sheet goes first: what the action opens (a question) is not under it
        <div className="inv-sheet" onClickCapture={(event) => { if ((event.target as Element).closest('button:not([disabled])')) close() }}>
            <ActionsList controller={controller} ids={ids} />
        </div>
    )
}

/** Each action with what it does in words (a title is not read on a phone): the same buttons as the computer's row. */
function ActionsList({ controller, ids }: { controller: InventoryController; ids: string[] }) {
    // the buttons are drawn by CollectionActions, one after the other; each goes in a group with its words
    return (
        <>
            {ids.map(id => (
                <Group key={id}>
                    <CollectionActions state={controller.state} controller={controller} extraClass="inv-collection-action" only={id} />
                    <Note>{actionAbout(id)}</Note>
                </Group>
            ))}
        </>
    )
}

function JumpBody({ controller, close, onJump }: { controller: InventoryController; close: () => void; onJump: (index: number) => void }) {
    const choice = choiceOf(controller.state.sorting) as string
    const byLetter = jumpsByLetter(choice) as boolean
    const targets = jumpTargets(controller.state.filteredAlbums, choice) as Array<{ label: string; index: number; count: number }>
    return (
        <div className={`inv-jump ${byLetter ? 'inv-jump--letters' : 'inv-jump--stretches'}`}>
            {targets.map(({ label, index, count }) => (
                <button key={index} type="button" className="inv-jump__target" aria-label={`${label}: ${tPlural('inventory.count', count, { count })}`} data-index={String(index)} onClick={() => { close(); onJump(index) }}>{label}</button>
            ))}
        </div>
    )
}

/** What the sheet says of the values, as plain text (it is text). */
function detailsOf(known: ValueView) {
    const { totals, money } = known
    return {
        totals: [
            { label: t('inventory.sheet.values.owned'), sum: totalText(totals.owned, money), note: ownedNote(totals.owned) },
            { label: t('inventory.sheet.values.toBuy'), sum: totalText(totals.toBuy, money), note: toBuyNote(totals.toBuy) }
        ],
        rate: money.currency !== BASE_CURRENCY && money.rates?.[money.currency] ? rateNote(money.currency, money.rates) : null,
        discogs: known.discogsShown ? [t('inventory.totals.discogsEach'), known.lowestShown ? lowestPricesNote() : null].filter(Boolean).join(' ') : null,
        sellerSettingsMissing: Boolean(known.sellerSettingsMissing),
        discogsShown: Boolean(known.discogsShown)
    }
}

function ValuesBody({ details }: { details: ReturnType<typeof detailsOf> }) {
    return (
        <>
            <Group>
                {details.totals.map(({ label, sum, note }) => (
                    <div key={label} className="inv-values-sheet__total"><span className="inv-values-sheet__label">{label}</span><span className="inv-values-sheet__sum">{sum}</span><span className="inv-values-sheet__count">{note}</span></div>
                ))}
            </Group>
            {details.rate ? <Note>{details.rate}</Note> : null}
            {details.sellerSettingsMissing ? (
                <p className="inv-values-sheet__seller" id="valuesSellerSettingsSheetText">
                    <strong>{t('inventory.seller.strong')}</strong>{` ${t('inventory.seller.rest')} `}
                    <a className="inv-values-sheet__link" href="https://www.discogs.com/settings/seller" target="_blank" rel="noopener">discogs.com/settings/seller</a>{t('inventory.seller.after')}
                </p>
            ) : null}
            {details.discogs ? <Note>{details.discogs}</Note> : null}
            {details.discogsShown ? <DiscogsCredit className="inv-sheet__credit" /> : null}
        </>
    )
}

// ---------------------------------------------------------------------------------------------- the six sheets

/** The sheets and the layer React draws them in (put it in the screen). */
export function usePhoneSheets(controller: InventoryController, bridge: InventoryBridge) {
    const sheet = useSheetWindow()
    const closeLabel = t('inventory.sheet.close')
    const found = (albumId: string) => controller.state.albums.find(item => item.id === albumId) ?? null
    return {
        layer: sheet.layer,
        /** The status of one album, from its row: a sheet with the three (two taps in all). */
        openStatus: (albumId: string) => {
            const item = found(albumId)
            if (item) sheet.show({ id: 'inventoryStatusSheet', title: t('inventory.sheet.status.title'), closeLabel, focusFirst: false, render: (close) => <StatusSheet item={item} close={close} onChoose={(status) => { void controller.handleStatusChange(albumId, status) }} /> })
        },
        /** «⋯» of a row: the named actions of the album. */
        openItem: (albumId: string) => {
            const item = found(albumId)
            if (!item) return
            const known = controller.valueViewOf(albumId)
            sheet.show({ id: 'inventoryItemSheet', title: unknownTitle(item), closeLabel, focusFirst: false, render: (close) => <ItemSheet item={item} known={known} close={close} controller={controller} bridge={bridge} /> })
        },
        /** The view, the format and the order; when they changed, the list is shown from its top after the sheet. */
        openFilters: () => {
            const before = [bridge.currentKey(), viewForPhone(controller.state)]
            sheet.show({
                id: 'inventoryFiltersSheet',
                title: t('inventory.sheet.filters.title'),
                closeLabel,
                focusFirst: false,
                onClose: () => { if (bridge.currentKey() !== before[0] || viewForPhone(controller.state) !== before[1]) window.scrollTo(0, 0) },
                render: () => <FiltersBody controller={controller} />,
                footer: (close) => <FiltersFooter controller={controller} close={close} />
            })
        },
        /** «⋯» of the screen: the actions of the whole collection, the same buttons as the computer's row. */
        openActions: () => sheet.show({ id: 'inventoryActionsSheet', title: t('inventory.phone.collectionActions'), closeLabel, render: (close) => <ActionsBody controller={controller} close={close} /> }),
        /** A letter or a stretch of the jump: the chunks up to it are drawn and its first row comes under the bar. */
        openJump: () => {
            const byLetter = jumpsByLetter(choiceOf(controller.state.sorting)) as boolean
            const onJump = (index: number) => {
                flushSync(() => { bridge.showUpTo(index) })
                const row = document.querySelectorAll<HTMLElement>('#inventory-grid-container .inv-row, #inventory-grid-container .inv-tile')[index]
                if (!row) return
                row.scrollIntoView({ block: 'start' })
                row.querySelector<HTMLElement>('.inv-row__open, .inv-tile__open')?.focus({ preventScroll: true })
            }
            sheet.show({ id: 'inventoryJumpSheet', title: byLetter ? t('inventory.phone.jumpArtist') : t('inventory.phone.jumpPosition'), closeLabel, focusFirst: false, render: (close) => <JumpBody controller={controller} close={close} onJump={onJump} /> })
        },
        /** «Lowest asking prices · Why?» / «About the values»: what the computer shows around its totals, in a sheet. */
        openValues: () => {
            const details = detailsOf(controller.state.value)
            sheet.show({ id: 'inventoryValuesSheet', title: details.sellerSettingsMissing ? t('inventory.sheet.values.why') : t('inventory.phone.about'), closeLabel, render: () => <ValuesBody details={details} /> })
        }
    }
}
