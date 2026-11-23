/**
 * Deleting a series (F83 wave 5b; it was `openDelete` of components/series/SeriesModals.js): the question is the confirmation dialog of the
 * app (`dialogService.confirm`, Escape is «Cancel»), not a window of its own. The saved playlists of the series go with it, so the person is
 * told how many before confirming; if they cannot be counted nothing is deleted.
 */
import { toast } from '../../stores/toasts.js'
import { t, tPlural } from '../../i18n/t.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { dialogService } from '../../ui/dialogs/dialogs'
import { getSeriesService } from '../../services/SeriesService.js'
import { SeriesEditSession } from './seriesEditSession'

/** The sentence of the question about what is saved under the series ('' when nothing is). */
export function savedPlaylistsWarning({ playlists, batches }: { playlists: number; batches: number }): string {
    if (!playlists) return ''
    return t('albums.delete.saved', {
        playlists: tPlural('albums.delete.playlists', playlists, { count: playlists }),
        batches: tPlural('albums.delete.batches', batches, { count: batches })
    })
}

export async function deleteSeriesAfterAsking(seriesId: string, onDeleted: (seriesId: string) => void): Promise<void> {
    const series = SeriesEditSession.find(seriesId)
    if (!series) {
        toast.error(t('albums.edit.notFound'))
        return
    }

    const db = albumSeriesStore.getDb()
    if (!db) {
        toast.error(t('albums.delete.noDatabase'))
        return
    }
    const service = getSeriesService(db, null, albumSeriesStore.getUserId())

    // The saved playlists of the series go with it: the person is told how many before confirming
    let saved: { playlists: number; batches: number }
    try {
        saved = await service.countSavedPlaylists(seriesId)
    } catch (error) {
        console.error('Could not count the saved playlists of the series:', error)
        toast.error(t('albums.delete.countFailed'))
        return
    }

    const confirmed = await dialogService.confirm({
        title: t('albums.delete.title'),
        message: t('albums.delete.message', { name: series.name ?? '', saved: savedPlaylistsWarning(saved) }),
        confirmText: t('albums.delete.confirm'),
        variant: 'danger'
    })
    if (!confirmed) return

    try {
        await service.deleteSeries(seriesId)
        toast.success(t('albums.delete.done'))
        onDeleted(seriesId)
    } catch (error) {
        console.error('Delete series failed:', error)
        toast.error(t('albums.delete.failed'))
    }
}
