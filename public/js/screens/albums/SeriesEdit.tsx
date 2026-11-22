/**
 * The window to edit a series (F83 wave 5b; it was components/series/SeriesEditModal.js): the name, the albums of the series, and the one
 * album picker (F57) to add more. The state and the rules are in seriesEditSession.ts; this draws them in the shell of the window of the app.
 *
 * The list is made again at each change, as the hand-made one was (`session.draws` is in the keys of the rows), so a button that was pressed
 * is gone and the focus goes back to the page. The window has no Escape, no click on the backdrop and no focus trap, as before.
 */
import { useSyncExternalStore } from 'react'
import { t } from '../../i18n/t.js'
import { parseAlbumQuery } from '../../models/albumQuery.js'
import { SaveStatus } from '../../models/seriesDraft.js'
import { albumSearchService } from '../../services/album-search/AlbumSearchService.js'
import { AlbumPickerPanel } from '../../ui/albumPicker/AlbumPickerPanel'
import { Icon } from '../../ui/Icon'
import { ModalShell } from '../../ui/ModalShell'
import { PROBLEM_TEXT, type AlbumQuery, type SeriesEditSession } from './seriesEditSession'

const WINDOW_ID = 'edit-series-modal'

function Row({ session, query, index }: { session: SeriesEditSession; query: AlbumQuery; index: number }) {
    const { artist, title } = parseAlbumQuery(query) as { artist: string; title: string }
    const last = session.albumQueries.length - 1
    return (
        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg mb-1" data-album-row="true">
            <span className="text-sm truncate flex-1">{artist ? `${artist} - ${title}` : title}</span>
            {session.phone ? <MoveButtons session={session} index={index} title={title} last={last} /> : null}
            <button type="button" className="btn btn-ghost btn-sm text-red-400 hover:text-red-300" title={t('albums.edit.remove')} aria-label={t('albums.edit.removeNamed', { title })} data-action="remove-album" onClick={() => session.removeAlbumAt(index)}>x</button>
        </div>
    )
}

/** On the phone each album moves up and down by a tap (F76): no drag. */
function MoveButtons({ session, index, title, last }: { session: SeriesEditSession; index: number; title: string; last: number }) {
    return (
        <>
            <button type="button" className="series-move-btn" aria-label={t('albums.edit.moveUp', { title })} data-action="move-up" disabled={index === 0} onClick={() => session.moveAlbumAt(index, -1)}>
                <Icon name="ArrowUp" className="w-5 h-5 pointer-events-none" />
            </button>
            <button type="button" className="series-move-btn series-move-btn--down" aria-label={t('albums.edit.moveDown', { title })} data-action="move-down" disabled={index === last} onClick={() => session.moveAlbumAt(index, 1)}>
                <Icon name="ArrowUp" className="w-5 h-5 pointer-events-none" />
            </button>
        </>
    )
}

function Albums({ session }: { session: SeriesEditSession }) {
    return (
        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3" data-series-albums="true">
            {session.albumQueries.length === 0
                ? <p key={'empty' + String(session.draws)} className="text-gray-500 text-sm italic">{t('albums.edit.none')}</p>
                : session.albumQueries.map((query, index) => <Row key={`${session.draws}-${index}`} session={session} query={query} index={index} />)}
        </div>
    )
}

export function SeriesEditWindow({ session }: { session: SeriesEditSession }) {
    useSyncExternalStore(session.subscribe, session.getVersion)
    const busy = session.save.status === SaveStatus.SAVING
    const message = session.save.status === SaveStatus.FAILED ? t(PROBLEM_TEXT[session.save.problem ?? ''] ?? PROBLEM_TEXT['write-failed']) : ''
    const footer = (
        <>
            <button type="button" className="btn btn-ghost" data-action="close-modal" onClick={() => session.close()}>{t('albums.edit.cancel')}</button>
            <button type="button" className="btn btn-primary" data-action="save-series" disabled={busy} aria-busy={busy ? 'true' : undefined} onClick={() => { void session.saveChanges() }}>
                {busy ? t('albums.edit.saving') : t('albums.edit.save')}
            </button>
        </>
    )
    return (
        <ModalShell id={WINDOW_ID} title={t('albums.edit.title')} size="lg" onClose={() => session.close()} footer={footer}>
            <div>
                <label className="block text-sm font-medium mb-2">{t('albums.edit.nameLabel')}</label>
                <input type="text" className="form-control w-full mb-6" defaultValue={session.name} placeholder={t('albums.edit.namePlaceholder')} onInput={(event) => { session.name = event.currentTarget.value }} />
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">{t('albums.edit.albumsLabel')}</label>
                    <span className="badge badge-neutral text-xs" data-series-count="true">{t('albums.edit.count', { count: session.albumQueries.length })}</span>
                </div>
                <Albums session={session} />
                <AlbumPickerPanel service={albumSearchService} onPick={(album) => session.addAlbum(album)} />
                <p className={`text-sm text-red-400 mt-3${message ? '' : ' hidden'}`} role="alert">{message}</p>
            </div>
        </ModalShell>
    )
}
