/**
 * One series on the saved playlists list: its header with the actions (Add, Open Series, Delete All), its batches and, when its
 * playlists could not be read, a notice with «try again» (F83 wave 1; it was components/playlists/SavedSeriesGroup.js).
 * It draws the entry it is given (stores/savedPlaylists.js) and asks for nothing. On the phone it is a header row that opens
 * the batches, closed until opened (F76), and every action is in a sheet (PhoneParts.tsx).
 */
import { useState } from 'react'
import { Icon } from '../../ui/Icon'
import { SeriesPlaylistsStatus } from '../../models/savedPlaylists.js'
import { t } from '../../i18n/t.js'
import { BatchCard } from './BatchCard'
import { BatchRow, SeriesHead } from './PhoneParts'
import type { Handlers, SeriesGroupData } from './types'

function Failure({ showingOlder, onRetry }: { showingOlder: boolean; onRetry: () => void }) {
    return (
        <div className="series-failed flex items-center gap-3 text-red-400 mb-4" role="alert">
            <span>{t(showingOlder ? 'savedPlaylists.series.failedStale' : 'savedPlaylists.series.failed')}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>{t('savedPlaylists.tryAgain')}</button>
        </div>
    )
}

function Header({ group, hasPlaylists, handlers }: { group: SeriesGroupData; hasPlaylists: boolean; handlers: Handlers }) {
    const { id, name } = group.series
    return (
        <div className="group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
            <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-accent-primary flex items-center gap-2">
                    <Icon name="Layers" className="w-6 h-6" />{` ${name}`}
                </h2>
                <span className="saved-series-id text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8">
                    {t('savedPlaylists.series.id', { id: id.slice(0, 8) })}
                </span>
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    className="btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors"
                    onClick={() => handlers.onNavigate()}
                >
                    <Icon name="Plus" className="w-4 h-4" />{` ${t('savedPlaylists.series.add')}`}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors"
                    onClick={() => handlers.onOpenSeries(id)}
                >
                    {`${t('savedPlaylists.series.open')} `}<Icon name="ArrowLeft" className="w-4 h-4 rotate-180 ml-1" />
                </button>
                {hasPlaylists ? (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title={t('savedPlaylists.series.deleteAllTitle')}
                        aria-label={t('savedPlaylists.series.deleteAllLabel', { name })}
                        onClick={() => handlers.onDeleteAll(id, name)}
                    >
                        <Icon name="Trash" className="w-4 h-4" />
                    </button>
                ) : null}
            </div>
        </div>
    )
}

function ComputerSeries({ group, handlers }: { group: SeriesGroupData; handlers: Handlers }) {
    const seriesId = group.series.id
    const failed = group.status === SeriesPlaylistsStatus.FAILED
    return (
        <div className="series-group glass-panel p-6 rounded-xl animate-scale-in" data-series-id={seriesId} data-status={group.status}>
            <Header group={group} hasPlaylists={group.batches.length > 0} handlers={handlers} />
            {failed ? <Failure showingOlder={group.batches.length > 0} onRetry={() => handlers.onRetry(seriesId)} /> : null}
            <div className="saved-series-batches" id={`savedSeriesBatches_${seriesId}`}>
                {group.batches.map(batch => (
                    <BatchCard key={batch.name} batch={batch} seriesId={seriesId} seriesName={group.series.name} thumbnails={group.thumbnails} handlers={handlers} />
                ))}
            </div>
        </div>
    )
}

function PhoneSeries({ group, startsOpen, onToggle, handlers }: {
    group: SeriesGroupData
    startsOpen: boolean
    onToggle: (seriesId: string, open: boolean) => void
    handlers: Handlers
}) {
    const [open, setOpen] = useState(startsOpen)
    const seriesId = group.series.id
    const boxId = `savedSeriesBatches_${seriesId}`
    const failed = group.status === SeriesPlaylistsStatus.FAILED
    return (
        <div className="series-group saved-phone-series" data-series-id={seriesId} data-status={group.status}>
            <SeriesHead group={group} open={open} boxId={boxId} handlers={handlers} onToggle={() => { setOpen(!open); onToggle(seriesId, !open) }} />
            {failed ? <Failure showingOlder={group.batches.length > 0} onRetry={() => handlers.onRetry(seriesId)} /> : null}
            <div className="saved-series-batches" id={boxId} hidden={!open}>
                {group.batches.map(batch => <BatchRow key={batch.name} batch={batch} seriesId={seriesId} seriesName={group.series.name} handlers={handlers} />)}
            </div>
        </div>
    )
}

export function SeriesGroup({ group, phone, startsOpen, onToggle, handlers }: {
    group: SeriesGroupData
    phone: boolean
    startsOpen: boolean
    onToggle: (seriesId: string, open: boolean) => void
    handlers: Handlers
}) {
    const failed = group.status === SeriesPlaylistsStatus.FAILED
    if (group.batches.length === 0 && !failed) return null
    return phone
        ? <PhoneSeries group={group} startsOpen={startsOpen} onToggle={onToggle} handlers={handlers} />
        : <ComputerSeries group={group} handlers={handlers} />
}
