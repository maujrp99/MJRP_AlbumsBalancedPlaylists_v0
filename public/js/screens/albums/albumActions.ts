/**
 * What a press on an album does on the albums screen (F83 wave 5a): the port of the second half of components/series/SeriesEventHandler.js.
 * The album asked for is looked for, at the moment of the press, among the albums of the store (never kept from the draw). Removing an
 * album asks first, calls the series service, tells the person with a notice, and when the service cannot find the query of the album in
 * the series, asks the person to type it (the second question); every way ends with the screen redrawn from the store.
 */
import { t } from '../../i18n/t.js'
import { albumsStore } from '../../stores/albums.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { dialogService } from '../../services/DialogService.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { toast } from '../../components/Toast.js'
import { openAlbumWindow, openInventoryAdd, openRankWindow } from '../../react-bridge/legacy/AlbumWindows'
import type { AlbumAction } from './AlbumCard'
import type { Album, AlbumsController } from './types'

export interface ActionDeps {
    controller: AlbumsController
    /** The phone's «⋯»: the sheet of an album; the choice comes back as an action. */
    openAlbumSheet: (album: Album, onAction: (action: AlbumAction) => void) => void
}

const CANNOT_FIND = 'Could not find album query in series'

/** The series an album is removed from: the one in the address (`?seriesId=`), or the group the card stands in. */
const seriesOfRemoval = (groupSeriesId: string | null): string | null => new URLSearchParams(window.location.search).get('seriesId') || groupSeriesId

async function removeByHand(deps: ActionDeps, album: Album, seriesId: string | null): Promise<void> {
    const series = albumSeriesStore.getById(seriesId) || albumSeriesStore.getActiveSeries()
    if (!series || !series.albumQueries) {
        toast.error(t('albums.remove.failed', { reason: CANNOT_FIND }))
        return
    }
    const options = series.albumQueries.map((query: string | { title?: string }) => (typeof query === 'string' ? query : (query.title || JSON.stringify(query))))
    const list = `${options.slice(0, 10).join('\n')}${options.length > 10 ? `\n${t('albums.remove.manualMore')}` : ''}`
    const typed = await dialogService.prompt({
        title: t('albums.remove.manualTitle'),
        message: t('albums.remove.manualMessage', { list }),
        defaultValue: album.title,
        confirmText: t('albums.remove.manualConfirm')
    })
    if (!typed) return
    try {
        const service = getSeriesService(albumSeriesStore.getDb(), null, albumSeriesStore.getUserId())
        await service.removeAlbumFromSeries(seriesId, { title: typed, artist: '' })
        toast.success(t('albums.remove.manualDone'))
        deps.controller.refresh()
    } catch (error) {
        toast.error(t('albums.remove.manualFailed', { reason: (error as Error).message }))
    }
}

async function removeAlbum(deps: ActionDeps, album: Album, groupSeriesId: string | null): Promise<void> {
    const confirmed = await dialogService.confirm({
        title: t('albums.remove.title'),
        message: t('albums.remove.message', { title: album.title, artist: album.artist }),
        confirmText: t('albums.remove.confirm'),
        variant: 'danger'
    })
    if (!confirmed) return
    try {
        const seriesId = seriesOfRemoval(groupSeriesId)
        const service = getSeriesService(albumSeriesStore.getDb(), null, albumSeriesStore.getUserId())
        await service.removeAlbumFromSeries(seriesId, album)
        toast.success(t('albums.remove.done'))
        deps.controller.refresh()
    } catch (error) {
        const reason = (error as Error).message
        if (reason.includes(CANNOT_FIND)) {
            const seriesId = seriesOfRemoval(groupSeriesId)
            if (albumSeriesStore.getById(seriesId) || albumSeriesStore.getActiveSeries()) {
                await removeByHand(deps, album, seriesId)
                return
            }
        }
        toast.error(t('albums.remove.failed', { reason }))
    }
}

/** The album asked for is the one the store holds now. */
export async function runAlbumAction(deps: ActionDeps, action: AlbumAction, albumId: string, groupSeriesId: string | null): Promise<void> {
    const album = (albumsStore.getAlbums() as Album[]).find(item => item.id === albumId)
    if (!album) {
        console.warn('[albums] Album not found:', albumId)
        return
    }
    switch (action) {
        case 'view-modal':
            await openAlbumWindow(album, deps.controller.sourcesOf(albumId))
            break
        case 'album-more':
            deps.openAlbumSheet(album, (picked) => { void runAlbumAction(deps, picked, albumId, groupSeriesId) })
            break
        case 'add-to-inventory':
            await openInventoryAdd(album)
            break
        case 'remove-album':
            await removeAlbum(deps, album, groupSeriesId)
            break
        case 'rank-album':
            await openRankWindow(album, (rankings) => deps.controller.saveRanking(album, rankings), () => toast.success(t('albums.rank.saved', { title: album.title })))
            break
        case 'refetch-metadata':
            deps.controller.handleRefetchMetadata(album)
            break
    }
}
