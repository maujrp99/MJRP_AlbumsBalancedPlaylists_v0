/**
 * The title of the inventory and the counts under it (F83 wave 6a; the port of InventoryView.renderTitleRow and renderStatusCounts): «My Collection»,
 * how many albums the search and the format let through, and «✓ n Owned», «n Not Owned», «♡ n Wishlist»: each count is a button that shows only the
 * albums of its status, and all of them again when it is pressed a second time (F75, REQ-02).
 */
import { t, tPlural } from '../../i18n/t.js'
import { Icon } from '../../ui/Icon'
import { InventoryStatus } from '../../models/inventoryStatus.js'
import { statusCountLabel } from '../../i18n/inventoryTexts.js'
import type { InventoryController, InventoryState } from './types'

/** The colour of each count. */
const COUNT_BADGE: Record<string, string> = {
    [InventoryStatus.OWNED]: 'badge badge-success text-xs',
    [InventoryStatus.NOT_OWNED]: 'badge badge-neutral text-xs',
    [InventoryStatus.WISHLIST]: 'badge badge-neutral text-xs'
}

export function Header({ state, controller }: { state: InventoryState; controller: InventoryController }) {
    const stats = state.stats || {}
    const chosen = state.filters?.ownership
    const counts: Record<string, number | undefined> = {
        [InventoryStatus.OWNED]: stats.ownedCount,
        [InventoryStatus.NOT_OWNED]: stats.notOwnedCount,
        [InventoryStatus.WISHLIST]: stats.wishlistCount
    }
    return (
        <div className="header-title-row mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <h1 className="text-2xl md:text-4xl font-bold mb-0 flex items-center gap-3"><Icon name="Archive" className="w-8 h-8 text-accent-primary" />{` ${t('inventory.title')}`}</h1>
            <div className="stats-row flex flex-wrap items-center gap-4 text-sm md:text-lg w-full md:w-auto">
                <span className="text-accent-primary font-semibold">{tPlural('inventory.count', stats.totalCount || 0, { count: stats.totalCount || 0 })}</span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('inventory.statusGroup')}>
                    {Object.keys(counts).map(status => {
                        const pressed = chosen === status
                        return (
                            <button
                                key={status}
                                type="button"
                                className={COUNT_BADGE[status]}
                                data-status-count={status}
                                title={t('inventory.statusHint')}
                                aria-pressed={pressed}
                                style={pressed ? { cursor: 'pointer', outline: '2px solid #f97316', outlineOffset: '1px' } : { cursor: 'pointer' }}
                                onClick={() => controller.handleStatusCount(status)}
                            >{statusCountLabel(status, counts[status] || 0)}</button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
