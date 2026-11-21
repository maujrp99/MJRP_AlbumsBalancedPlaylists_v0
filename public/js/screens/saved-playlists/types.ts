/**
 * The shapes the saved playlists screen reads (stores/savedPlaylists.js, models/savedPlaylists.js): an entry of a series with
 * its batches, and the handlers the pieces of the screen call. The data comes from the controller; nothing here is written back.
 */

/** A track of a saved playlist, as the models give it: the screen reads its length, the rows read the rest. */
export interface Track {
    title?: string
    duration?: number
    [field: string]: unknown
}

export interface SavedPlaylist {
    id: string
    name?: string
    tracks?: Track[]
}

export interface Batch {
    name: string
    savedAt?: unknown
    playlists: SavedPlaylist[]
}

export interface SeriesInfo {
    id: string
    name: string
}

/** What the store keeps for a series (an entry is replaced, never mutated: the same object has not changed). */
export interface SeriesGroupData {
    seriesId: string
    series: SeriesInfo
    status: string
    error: string | null
    batches: Batch[]
    thumbnails: (string | null)[]
}

export interface ListSummary {
    total: number
    loading: number
    settled: number
}

/** What the screen draws now (SavedPlaylistsController.getList). */
export interface ListView {
    status: string
    error: string | null
    busy: boolean
    summary: ListSummary
    groups: SeriesGroupData[]
}

/** What a person can do with a series, a batch or a playlist; each one is a call to the controller (or a question first). */
export interface Handlers {
    onNavigate: () => void
    onOpenSeries: (seriesId: string) => void
    onDeleteAll: (seriesId: string, seriesName: string) => void
    onEditBatch: (seriesId: string, batchName: string, savedAt: unknown) => void
    onDeleteBatch: (seriesId: string, batchName: string, count: number) => void
    onOpenPlaylist: (seriesId: string, playlistId: string) => void
    onRetry: (seriesId: string) => void
}

/** The totals a batch shows (models/savedPlaylists.js batchTotals). */
export interface Totals {
    playlists: number
    tracks: number
    albums: number
    durationSeconds: number
}
