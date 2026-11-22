/**
 * The card of an item in the grid, and the selector of its status (F83 wave 6a; the port of InventoryGridRenderer.renderCard, renderStatusSelect and
 * of what Card.js made of the grid card). The hand-made card was the Card of the app made into a surface after it was drawn (the classes of the
 * cover taken off, the row of tags replaced by the five lines of the value): this is the card as it ended up, not the Card.
 *
 * A click on the card opens the window of the album, except on a link (to a store or to the edition at Discogs), which is followed and opens
 * nothing here; the buttons «Edit» and «Delete» act on their own and the click stops there.
 */
import type { MouseEvent } from 'react'
import { t } from '../../i18n/t.js'
import { CoverImage } from '../../ui/CoverImage'
import { Icon } from '../../ui/Icon'
import { InventoryStatus, STATUS_SELECT_OPTIONS, statusOf } from '../../models/inventoryStatus.js'
import { NOT_KNOWN } from '../../models/inventoryCard.js'
import { CardValue } from './CardValue'
import type { InventoryItem, ItemValue, Money } from './types'

/** The colours of the status selector on a card, and of each of its options. */
const STATUS_BORDER: Record<string, string> = {
    [InventoryStatus.OWNED]: 'border-green-500/50 text-green-400',
    [InventoryStatus.NOT_OWNED]: 'border-gray-600',
    [InventoryStatus.WISHLIST]: 'border-pink-500/50 text-pink-400'
}
const STATUS_OPTION: Record<string, string> = {
    [InventoryStatus.OWNED]: 'bg-gray-900 text-green-400',
    [InventoryStatus.NOT_OWNED]: 'bg-gray-900 text-white',
    [InventoryStatus.WISHLIST]: 'bg-gray-900 text-pink-400'
}

/** The card as a surface (F75, prototype v5.1): its own background and a faint edge. */
const SURFACE = { background: '#15151a', border: '1px solid rgba(255,255,255,.08)' }

/** A click on a link inside a card or a row is followed by the browser and opens no window. */
export const onALink = (event: MouseEvent): boolean => (event.target as Element).closest('a[href]') !== null

/**
 * The status of an item, chosen on its card. It is not controlled: the choice stays on the select until the screen is drawn again (the hand-made
 * one did the same: after a write that failed it is drawn again with what the store holds), and the `key` of the list makes it a new one then.
 */
export function StatusSelect({ id, status, onChoose }: { id: string; status: string; onChoose: (status: string) => void }) {
    return (
        <div className="absolute top-2 right-2 z-20 w-32 user-select-none">
            <div className="relative group/dropdown">
                <select
                    className={`status-select w-full appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors bg-gray-900 ${STATUS_BORDER[status]}`}
                    data-album-id={id}
                    style={{ backgroundColor: '#1f2937' }}
                    aria-label={t('inventory.card.status')}
                    defaultValue={status}
                    onChange={(event) => onChoose(event.target.value)}
                >
                    {STATUS_SELECT_OPTIONS.map(({ value, label }: { value: string; label: string }) => (
                        <option key={value} value={value} className={STATUS_OPTION[value]}>{label}</option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

const ACTION_BUTTON = 'p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors'

export interface ItemActions {
    onView: (id: string) => void
    onEdit: (id: string) => void
    onDelete: (id: string) => void
    onStatus: (id: string, status: string) => void
}

export function ItemCard({ item, value, money, actions }: { item: InventoryItem; value: ItemValue | undefined; money: Money; actions: ItemActions }) {
    const id = item.id
    const stop = (act: (id: string) => void) => (event: MouseEvent) => { event.stopPropagation(); act(id) }
    return (
        <div className="inventory-card-wrapper relative group h-full flex flex-col rounded-xl overflow-hidden" data-album-id={id} style={SURFACE}>
            <StatusSelect id={id} status={statusOf(item)} onChoose={(status) => actions.onStatus(id, status)} />
            <div className="flex-1 min-h-0 w-full">
                <div className="album-card-compact flex flex-col gap-3 relative fade-in" data-id={id} onClick={(event) => { if (!onALink(event)) actions.onView(id) }}>
                    <div
                        className="relative w-full aspect-square overflow-hidden bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        data-action="view-modal"
                        data-id={id}
                        style={{ borderRadius: '0', border: '0' }}
                    >
                        <CoverImage src={item.albumData?.coverUrl || item.coverUrl} alt={item.title || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                            <span className="bg-black/50 p-3 rounded-full backdrop-blur text-white"><Icon name="Maximize2" className="w-6 h-6" /></span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 px-1" style={{ padding: '0 12px 12px' }}>
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white text-base truncate leading-tight" title={item.title}>{item.title}</h3>
                                <p className="text-gray-400 text-sm truncate hover:text-white transition-colors">{item.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {/* the icon «Eye» does not exist in the site's icons: the hand-made button was drawn without one, and so is this */}
                                <button type="button" className={`${ACTION_BUTTON} view-album-btn`} title={t('inventory.card.view')} data-action="view-modal" data-id={id}><Icon name="Eye" className="w-4 h-4" /></button>
                                <button type="button" className={`${ACTION_BUTTON} edit-album-btn text-blue-400`} title={t('inventory.card.edit')} data-action="edit-modal" data-id={id} onClick={stop(actions.onEdit)}><Icon name="Edit" className="w-4 h-4" /></button>
                                <button type="button" className={`${ACTION_BUTTON} delete-album-btn text-red-400`} title={t('inventory.card.delete')} data-action="delete-modal" data-id={id} onClick={stop(actions.onDelete)}><Icon name="Trash2" className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <CardValue item={item} value={value || NOT_KNOWN} money={money} />
                    </div>
                </div>
            </div>
        </div>
    )
}
