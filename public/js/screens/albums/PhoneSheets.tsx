/**
 * The sheets of the phone of the albums screen (F83 wave 5a; the port of components/series/SeriesPhoneSheets.js): the actions of an album
 * and of a series behind the «⋯» button. The sheet is ui/SheetWindow.tsx; what is inside is React.
 * Choosing an action closes the sheet, then does it.
 */
import type { ReactNode } from 'react'
import { t, tPlural } from '../../i18n/t.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { Icon } from '../../ui/Icon'
import { useSheetWindow } from '../../ui/SheetWindow'
import type { AlbumAction } from './AlbumCard'
import type { Album } from './types'

function ActionRow({ icon, label, danger = false, onPick }: { icon: string; label: string; danger?: boolean; onPick: () => void }) {
    return (
        <button type="button" className={`albums-sheet__row${danger ? ' albums-sheet__row--danger' : ''}`} onClick={onPick}>
            <Icon name={icon} className="albums-sheet__icon" /><span className="albums-sheet__label">{label}</span>
        </button>
    )
}

function LinkRow({ icon, label, to }: { icon: string; label: string; to: string }) {
    return (
        <a className="albums-sheet__row" href={safeUrl(to) as string} target="_blank" rel="noopener noreferrer">
            <Icon name={icon} className="albums-sheet__icon" /><span className="albums-sheet__label">{label}</span><Icon name="ExternalLink" className="albums-sheet__out" />
        </a>
    )
}

const List = ({ children }: { children: ReactNode }) => <div className="albums-sheet__list">{children}</div>

function AlbumSheet({ album, close, onAction }: { album: Album; close: () => void; onAction: (action: AlbumAction) => void }) {
    const pick = (action: AlbumAction) => () => { close(); onAction(action) }
    const ranked = Boolean(album.hasUserRanking) || (album.userRanking?.length ?? 0) > 0
    const about = [album.artist, album.year].filter(Boolean).join(' · ')
    return (
        <>
            {about ? <p className="albums-sheet__about">{about}</p> : null}
            <List>
                <ActionRow icon="Maximize2" label={t('albums.sheet.view')} onPick={pick('view-modal')} />
                <ActionRow icon="Star" label={ranked ? t('albums.sheet.rankEdit') : t('albums.sheet.rank')} onPick={pick('rank-album')} />
                <ActionRow icon="Archive" label={t('albums.sheet.inventory')} onPick={pick('add-to-inventory')} />
                <ActionRow icon="RefreshCw" label={t('albums.sheet.refetch')} onPick={pick('refetch-metadata')} />
                {album.spotifyId ? <LinkRow icon="Spotify" label={t('albums.sheet.spotify')} to={safeUrl(album.spotifyUrl) || `https://open.spotify.com/album/${encodeURIComponent(album.spotifyId)}`} /> : null}
                {album.bestEverAlbumId ? <LinkRow icon="Award" label={t('albums.sheet.bestEver')} to={`https://www.besteveralbums.com/thechart.php?a=${encodeURIComponent(String(album.bestEverAlbumId))}`} /> : null}
            </List>
            <List><ActionRow icon="Trash" label={t('albums.sheet.remove')} danger onPick={pick('remove-album')} /></List>
        </>
    )
}

export interface SeriesActions {
    onEdit: () => void
    onDelete: () => void
}

function SeriesSheet({ albumCount, close, actions }: { albumCount: number; close: () => void; actions: SeriesActions }) {
    return (
        <>
            {Number.isFinite(albumCount) ? <p className="albums-sheet__about">{tPlural('albums.sheet.albums', albumCount, { count: albumCount })}</p> : null}
            <List><ActionRow icon="Edit" label={t('albums.sheet.editSeries')} onPick={() => { close(); actions.onEdit() }} /></List>
            <List><ActionRow icon="Trash" label={t('albums.sheet.deleteSeries')} danger onPick={() => { close(); actions.onDelete() }} /></List>
        </>
    )
}

/** The two sheets, and the layer React draws them in (put it in the screen). */
export function usePhoneSheets() {
    const sheet = useSheetWindow()
    const closeLabel = t('albums.sheet.close')
    return {
        layer: sheet.layer,
        openAlbum: (album: Album, onAction: (action: AlbumAction) => void) => sheet.show({
            title: album.title || t('albums.sheet.album'), className: 'albums-sheet', closeLabel,
            render: (close) => <AlbumSheet album={album} close={close} onAction={onAction} />
        }),
        openSeries: (name: string | undefined, albumCount: number, actions: SeriesActions) => sheet.show({
            title: name || t('albums.sheet.series'), className: 'albums-sheet', closeLabel,
            render: (close) => <SeriesSheet albumCount={albumCount} close={close} actions={actions} />
        })
    }
}
