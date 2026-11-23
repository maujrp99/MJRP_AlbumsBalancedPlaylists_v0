/** What the playlists screen holds of a playlist and a track: the fields it reads (a playlist is the model of the service's set). */
import type { RowTrack } from '../../ui/TrackRow'

export interface Playlist {
    id?: string
    name?: string
    title?: string
    batchName?: string
    tracks?: RowTrack[]
    _meta?: { algorithmId?: string; rankingId?: string; [field: string]: unknown }
}

/** What a screen of the playlists does when the person acts: the controller and the service behind it decide. */
export interface PlaylistActions {
    removeTrack: (playlistIndex: number, trackIndex: number) => void
    deletePlaylist: (playlistIndex: number) => void
    renamePlaylist: (playlistIndex: number, title: string) => void
}
