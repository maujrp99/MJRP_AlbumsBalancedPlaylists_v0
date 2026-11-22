/**
 * The row of an item in the list view (F83 wave 6a; the port of InventoryGridRenderer.renderRow and of what Card.js drew as the «expanded» card):
 * the cover, two buttons, the title and the artist, the ranking badges the item has, and under them the format, the value in one line and the
 * averages. A click on the row opens the window of the album, except on a link; «Edit» and «Delete» act on their own.
 */
import type { MouseEvent } from 'react'
import { t } from '../../i18n/t.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { CoverImage } from '../../ui/CoverImage'
import { Icon } from '../../ui/Icon'
import { averagesLine } from '../../models/albumAverages.js'
import { NOT_KNOWN, formatBadgeOf } from '../../models/inventoryCard.js'
import { RowValue } from './CardValue'
import { onALink, type ItemActions } from './ItemCard'
import type { InventoryItem, ItemValue, Money } from './types'

const FORMAT_COLOR: Record<string, string> = {
    vinyl: 'bg-green-900/50 text-green-400 border border-green-500/30',
    cd: 'bg-blue-900/50 text-blue-400 border border-blue-500/30',
    digital: 'bg-purple-900/50 text-purple-400',
    other: 'bg-gray-700 text-gray-300'
}

function FormatBadge({ format }: { format?: string | null }) {
    const badge = formatBadgeOf(format) as { kind: string; text: string } | null
    if (!badge) return null
    return <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${FORMAT_COLOR[badge.kind]}`}>{badge.text}</span>
}

/** The averages of an item in one small line; an item that was never read shows nothing, not a dash. */
function Averages({ item }: { item: InventoryItem }) {
    const line = averagesLine(item.averages) as string
    if (!line) return null
    return <span className="text-xs text-gray-400" data-role="averages" title={t('inventory.avg.lineHint')}>{line}</span>
}

const BADGE = 'flex items-center gap-1 text-[9px] px-1 py-0 h-auto min-h-0'

function BestEverBadge({ id }: { id: string }) {
    return (
        <div className="flex justify-start w-full">
            <a href={`https://www.besteveralbums.com/thechart.php?a=${id}`} target="_blank" rel="noopener noreferrer" className={`badge badge-primary hover:badge-accent transition-colors ${BADGE}`} title={t('inventory.rank.bestEver')}>
                <Icon name="ExternalLink" className="w-2 h-2" />{' BestEverAlbums'}
            </a>
        </div>
    )
}

function SpotifyBadge({ item }: { item: InventoryItem }) {
    // the stored address comes from a provider: a link only when it is a web address (F59)
    const url = safeUrl(item.spotifyUrl) || `https://open.spotify.com/album/${encodeURIComponent(String(item.spotifyId))}`
    return (
        <a href={url as string} target="_blank" rel="noopener noreferrer" className={`badge transition-colors hover:opacity-80 ${BADGE}`} style={{ background: '#1DB954', color: 'white', border: 'none' }} title="Spotify">
            <Icon name="Spotify" className="w-2 h-2" />{' Spotify'}
        </a>
    )
}

function UserBadge() {
    return (
        <span className={`badge transition-colors ${BADGE}`} style={{ background: '#0EA5E9', color: 'white', border: 'none' }} title={t('inventory.rank.mineHint')}>
            <Icon name="Star" className="w-2 h-2" />{` ${t('inventory.rank.mine')}`}
        </span>
    )
}

const hasUserRanking = (item: InventoryItem): boolean => Boolean(item.hasUserRanking) || (item.userRanking?.length ?? 0) > 0

/** Spotify at the left and «my ranking» at the right (a spacer keeps the second one at the right when Spotify is missing). */
function BottomRow({ item }: { item: InventoryItem }) {
    return (
        <div className="flex justify-between items-center w-full">
            {item.spotifyId ? <SpotifyBadge item={item} /> : <div />}
            {hasUserRanking(item) ? <UserBadge /> : null}
        </div>
    )
}

/** The badges of the rankings the item has: BestEverAlbums above, then Spotify at the left and «my ranking» at the right. */
export function RankingBadges({ item }: { item: InventoryItem }) {
    const bottom = Boolean(item.spotifyId) || hasUserRanking(item)
    if (!item.bestEverAlbumId && !bottom) return null
    return (
        <div className="flex flex-col gap-1 w-full mt-1">
            {item.bestEverAlbumId ? <BestEverBadge id={String(item.bestEverAlbumId)} /> : null}
            {bottom ? <BottomRow item={item} /> : null}
        </div>
    )
}

const ACTION_BUTTON = 'tech-btn tech-btn-secondary text-xs px-4 py-2 flex items-center gap-2 hover:bg-white/20'

export function ItemRow({ item, value, money, actions }: { item: InventoryItem; value: ItemValue | undefined; money: Money; actions: ItemActions }) {
    const id = item.id
    const stop = (act: (id: string) => void) => (event: MouseEvent) => { event.stopPropagation(); act(id) }
    return (
        <div className="inventory-row-wrapper relative cursor-pointer hover:bg-white/5 transition-colors rounded-xl overflow-hidden" data-album-id={id} onClick={(event) => { if (!onALink(event)) actions.onView(id) }}>
            <div className="expanded-album-card glass-panel p-6 mb-6 rounded-2xl animate-in fade-in" data-id={id}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex flex-col gap-4 shrink-0">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-white/10">
                                <CoverImage src={item.albumData?.coverUrl || item.coverUrl} alt={item.title || ''} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <button type="button" className={`${ACTION_BUTTON} edit-album-btn`} data-action="edit-modal" data-id={id} onClick={stop(actions.onEdit)}><span><Icon name="Edit" className="w-3 h-3" /></span>{` ${t('inventory.card.edit')}`}</button>
                            <button type="button" className={`${ACTION_BUTTON} delete-album-btn text-red-400`} data-action="delete-modal" data-id={id} onClick={stop(actions.onDelete)}><span><Icon name="Trash2" className="w-3 h-3" /></span>{` ${t('inventory.card.delete')}`}</button>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-w-0">
                        <h3 className="text-2xl font-bold mb-1 flex items-center gap-2"><span><Icon name="Music" className="w-6 h-6 text-accent-primary" /></span>{item.title}</h3>
                        <p className="text-accent-primary text-lg mb-3">{item.artist}</p>
                        <div className="flex flex-wrap gap-2 text-sm mb-4"><RankingBadges item={item} /></div>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <FormatBadge format={item.format} />
                            <RowValue item={item} value={value || NOT_KNOWN} money={money} />
                            <Averages item={item} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
