/**
 * The albums of the computer (F83 wave 6a; the port of InventoryGridRenderer.render): the grid of cards, the list of rows, the line that says the
 * inventory is loading, and the line that says nothing passes the filters. The whole box is made anew at each full draw (its `key`), as the hand-made
 * screen drew it anew: the covers are asked again, a status selector goes back to what the store holds. A card whose value moved is swapped alone.
 */
import { t } from '../../i18n/t.js'
import { valuesOf } from '../../models/inventoryCard.js'
import { ItemCard, type ItemActions } from './ItemCard'
import { ItemRow } from './ItemRow'
import type { InventoryBridge } from './InventoryBridge'
import type { InventoryState } from './types'

export function Grid({ state, bridge, actions }: { state: InventoryState; bridge: InventoryBridge; actions: ItemActions }) {
    const { filteredAlbums, viewMode, isLoading } = state
    if (isLoading) return <div className="p-8 text-center text-muted">{t('inventory.loading')}</div>
    if (filteredAlbums.length === 0) return <div className="p-12 text-center text-muted border border-dashed border-white/10 rounded-xl">{t('inventory.empty.filtered')}</div>
    const known = valuesOf(state)
    return viewMode === 'list' ? (
        <div className="albums-list space-y-3 fade-in">
            {filteredAlbums.map(item => <ItemRow key={bridge.cardKey(item.id)} item={item} value={known.values.get(item.id)} money={known.money} actions={actions} />)}
        </div>
    ) : (
        <div className="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
            {filteredAlbums.map(item => <ItemCard key={bridge.cardKey(item.id)} item={item} value={known.values.get(item.id)} money={known.money} actions={actions} />)}
        </div>
    )
}
