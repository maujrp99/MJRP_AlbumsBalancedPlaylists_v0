/**
 * The window of one saved playlist: its number of tracks, how long it is and its tracks (F83 wave 1; it was
 * components/playlists/PlaylistDetailsModal.js). The shell of the window is the app's (ui/ModalWindow); what is inside is React,
 * the rows of tracks the hand-made row (react-bridge/legacy/TrackRows).
 */
import type { ReactNode } from 'react'
import { useModalWindow } from '../../ui/ModalWindow'
import { TrackRows, formatTrackDuration } from '../../react-bridge/legacy/TrackRows'
import { t } from '../../i18n/t.js'
import type { SavedPlaylist } from './types'

function Details({ playlist }: { playlist: SavedPlaylist }) {
    const tracks = playlist.tracks ?? []
    const seconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
    return (
        <>
            <div className="mb-4 text-xs text-muted flex gap-3 border-b border-white/10 pb-4">
                <span><span className="text-white font-bold">{tracks.length}</span>{` ${t('savedPlaylists.details.tracks')}`}</span>
                <span><span className="text-white font-bold">{formatTrackDuration(seconds)}</span>{` ${t('savedPlaylists.details.duration')}`}</span>
            </div>
            <TrackRows tracks={tracks} kind="compact" className="space-y-1" />
        </>
    )
}

/** Opens the window of a playlist; `layer` goes anywhere in the screen (it draws into the window, not in place). */
export function usePlaylistDetails(): { open: (playlist: SavedPlaylist | null) => void; layer: ReactNode } {
    const { show, layer } = useModalWindow()
    const open = (playlist: SavedPlaylist | null) => {
        if (!playlist) return
        show({
            id: 'playlist-modal',
            title: playlist.name ?? '',
            size: 'lg',
            footerClassName: 'flex justify-end',
            body: () => <Details playlist={playlist} />,
            footer: (close) => <button type="button" className="btn btn-secondary" onClick={close}>{t('savedPlaylists.details.close')}</button>
        })
    }
    return { open, layer }
}
