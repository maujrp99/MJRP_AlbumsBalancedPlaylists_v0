/**
 * The bar of the phone (F83 wave 6a; the port of InventoryView.renderPhoneBar and fillPhoneProgress, F76 TASK-07): the search, «A–Z» (or «1–N»), «Filters»
 * with how many are on, and «⋯»; under them the line that says what an action of the collection is doing, with «Stop» for the values. It stays under the
 * top bar. The search is the same field as the computer's (screens/inventory/Filters.tsx `useSearchField`).
 */
import { t } from '../../../i18n/t.js'
import { Icon } from '../../../ui/Icon'
import { choiceOf } from '../../../models/inventorySort.js'
import { jumpsByLetter } from '../../../models/inventoryJump.js'
import { phoneProgress } from '../../../models/inventoryCard.js'
import { useSearchField } from '../Filters'
import type { InventoryController, InventoryState } from '../types'
import { MoreIcon } from './PhoneRow'

/** The order the screen opens in: another one counts as a filter on, on the «Filters» button. */
const DEFAULT_SORT = 'artist'

export interface BarActions {
    onJump: () => void
    onFilters: () => void
    onActions: () => void
}

/** The line under the search while an action of the collection runs; hidden when nothing does. */
function Progress({ state, controller }: { state: InventoryState; controller: InventoryController }) {
    const now = phoneProgress(state) as { which: string; text: string | null; stop: boolean } | null
    const words: Record<string, string> = { series: t('inventory.phone.progress.series'), ratings: t('inventory.phone.progress.ratings'), values: t('inventory.phone.progress.values') }
    return (
        <div id="inventoryPhoneProgress" className="inv-bar__progress" role="status" hidden={!now}>
            {now ? <span className="inv-bar__progress-text">{now.text || words[now.which]}</span> : null}
            {now?.stop ? <button type="button" className="btn btn-secondary btn-sm" data-phone-action="stop-values" onClick={() => controller.handleStopValues()}>{t('inventory.phone.stop')}</button> : null}
        </div>
    )
}

/** «Filters» with how many are on: the format and the order, when they are not what the screen opens in. */
function FiltersButton({ state, onPress }: { state: InventoryState; onPress: () => void }) {
    const on = (state.filters.format !== 'all' ? 1 : 0) + (choiceOf(state.sorting) !== DEFAULT_SORT ? 1 : 0)
    return (
        <button type="button" className="inv-bar__button" data-phone-action="filters" data-on={String(on)} aria-label={on ? t('inventory.phone.filtersOn', { on }) : t('inventory.phone.filters')} onClick={onPress}>
            <svg className="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
            {on ? <span className="inv-bar__badge" aria-hidden="true">{String(on)}</span> : null}
        </button>
    )
}

export function PhoneBar({ state, controller, actions }: { state: InventoryState; controller: InventoryController; actions: BarActions }) {
    const search = useSearchField(controller, state.filters.search || '')
    const byLetter = jumpsByLetter(choiceOf(state.sorting)) as boolean
    return (
        <div className="inv-bar" id="inventoryPhoneBar">
            <div className="inv-bar__row">
                <div className="inv-bar__field">
                    <span className="inv-bar__search-icon"><Icon name="Search" className="inv-icon" /></span>
                    <input ref={search} type="search" id="inventorySearch" placeholder={t('inventory.search.phonePlaceholder')} aria-label={t('inventory.search.label')} enterKeyHint="search" className="inv-bar__search" defaultValue={state.filters.search || ''} />
                </div>
                <button type="button" className="inv-bar__button" data-phone-action="jump" aria-label={byLetter ? t('inventory.phone.jumpArtist') : t('inventory.phone.jumpPosition')} disabled={state.filteredAlbums.length === 0} onClick={actions.onJump}>{byLetter ? 'A–Z' : '1–N'}</button>
                <FiltersButton state={state} onPress={actions.onFilters} />
                <button type="button" className="inv-bar__button" data-phone-action="actions" aria-label={t('inventory.phone.collectionActions')} onClick={actions.onActions}><MoreIcon /></button>
            </div>
            <Progress state={state} controller={controller} />
        </div>
    )
}
