/**
 * The albums of the phone (F83 wave 6a; the port of the lists of InventoryPhoneRow.js and InventoryPhoneTile.js and of InventoryView.renderPhoneGrid):
 * the rows (or the cards of the gallery of covers, for someone who chose it) in chunks of 50 with how many are drawn and «Show 50 more», or what stands
 * in their place: the ghosts while the inventory loads, the empty inventory that says what fills it, and the filtered one that offers to clear the filters.
 */
import { flushSync } from 'react-dom'
import { t } from '../../../i18n/t.js'
import { Icon } from '../../../ui/Icon'
import { ViewMode, viewForPhone } from '../../../models/inventoryViewMode.js'
import { moreOf, valuesOf } from '../../../models/inventoryCard.js'
import { addSeriesAlbums } from '../inventoryActions'
import type { InventoryBridge } from '../InventoryBridge'
import type { InventoryController, InventoryState } from '../types'
import { PhoneRow, PhoneTile, type PhoneActions } from './PhoneRow'

/** While the inventory loads: rows (or covers) of the same size, empty. */
function Ghosts({ gallery }: { gallery: boolean }) {
    const kind = gallery ? 'inv-tile' : 'inv-row'
    return (
        <div role="status" className="inv-loading">
            <span className="sr-only">{t('inventory.loading')}</span>
            <ul className={gallery ? 'inv-tiles' : 'inv-rows'}>
                {Array.from({ length: 6 }, (_, index) => (
                    <li key={index} className={`${kind} ${kind}--ghost`} aria-hidden="true"><span className={`${kind}__cover`} /><span className="inv-ghost inv-ghost--title" /><span className="inv-ghost inv-ghost--artist" /></li>
                ))}
            </ul>
        </div>
    )
}

/** Nothing to show: an empty inventory says what fills it; a filtered one offers to clear the filters. */
function Empty({ hasItems, controller }: { hasItems: boolean; controller: InventoryController }) {
    if (hasItems) {
        return (
            <div className="inv-empty" data-empty="filtered">
                <Icon name="Search" className="inv-empty__icon" />
                <p className="inv-empty__title">{t('inventory.phone.noMatch.title')}</p>
                <p className="inv-empty__text">{t('inventory.phone.noMatch.text')}</p>
                <button type="button" className="btn btn-secondary" data-phone-action="clear-filters" onClick={() => {
                    controller.handleFilterChange('search', '')
                    controller.handleFilterChange('format', 'all')
                    controller.handleFilterChange('ownership', 'all')
                }}>{t('inventory.phone.noMatch.clear')}</button>
            </div>
        )
    }
    return (
        <div className="inv-empty" data-empty="inventory">
            <Icon name="Archive" className="inv-empty__icon" />
            <p className="inv-empty__title">{t('inventory.phone.empty.title')}</p>
            <p className="inv-empty__text">{t('inventory.phone.empty.text')}</p>
            <button type="button" className="btn btn-primary" data-phone-action="add-series" onClick={() => { void addSeriesAlbums(controller) }}>{t('inventory.action.series.label')}</button>
        </div>
    )
}

/** Under the rows: how many are drawn, and the button for the next chunk. */
function More({ total, shown, bridge }: { total: number; shown: number; bridge: InventoryBridge }) {
    const more = moreOf(total, shown) as { all: boolean; total: number; shown?: number; next?: number }
    if (more.all) return <p className="inv-more__count">{total === 1 ? t('inventory.more.one') : t('inventory.more.all', { count: total })}</p>
    return (
        <div className="inv-more">
            <p className="inv-more__count">{t('inventory.more.showing', { shown: more.shown ?? 0, total })}</p>
            <button type="button" className="btn btn-secondary inv-more__button" data-phone-action="more-rows" onClick={() => {
                // the next chunk is drawn first; the focus goes to its first row, and the page does not move
                const first = bridge.phoneShown
                flushSync(() => { bridge.showMoreRows() })
                document.querySelectorAll<HTMLElement>('#inventory-grid-container .inv-row, #inventory-grid-container .inv-tile')[first]?.querySelector<HTMLElement>('.inv-row__open, .inv-tile__open')?.focus({ preventScroll: true })
            }}>{t('inventory.more.next', { next: more.next ?? 0 })}</button>
        </div>
    )
}

export function PhoneList({ state, bridge, controller, actions }: { state: InventoryState; bridge: InventoryBridge; controller: InventoryController; actions: PhoneActions }) {
    const gallery = viewForPhone(state) === ViewMode.GRID
    if (state.isLoading) return <Ghosts gallery={gallery} />
    if (state.filteredAlbums.length === 0) return <Empty hasItems={state.albums.length > 0} controller={controller} />
    const shown = bridge.keepPhoneShown(state)
    const known = valuesOf(state)
    const items = state.filteredAlbums
    const rows = items.slice(0, shown).map(item => (gallery
        ? <PhoneTile key={bridge.cardKey(item.id)} item={item} value={known.values.get(item.id)} money={known.money} actions={actions} />
        : <PhoneRow key={bridge.cardKey(item.id)} item={item} value={known.values.get(item.id)} money={known.money} actions={actions} />))
    return (
        <>
            <ul className={gallery ? 'inv-tiles' : 'inv-rows'} aria-label={t('inventory.phone.albums')}>{rows}</ul>
            <More total={items.length} shown={Math.min(shown, items.length)} bridge={bridge} />
        </>
    )
}
