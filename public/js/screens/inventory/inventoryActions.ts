/**
 * What the inventory screen asks of the windows and dialogs outside it (F83 wave 6a): the question before removing an item, the two questions
 * of the actions of the collection, and the two windows that stay hand-made until wave 6b (the album window with its value section, and the window
 * to edit an item), reached through react-bridge/legacy/AlbumWindows.ts (listed in bridgesOnlyShrink). Each window is asked for by `import()` when
 * pressed, as the hand-made screen did: none is in the first download of the screen.
 */
import { t } from '../../i18n/t.js'
import { dialogService } from '../../services/DialogService.js'
import { openInventoryEdit, openInventoryView } from '../../react-bridge/legacy/AlbumWindows'
import type { InventoryBridge } from './InventoryBridge'
import type { InventoryController, InventoryItem } from './types'

const find = (controller: InventoryController, albumId: string): InventoryItem | null => controller.state.albums.find(item => item.id === albumId) ?? null

const confirmWith = { confirm: (options: object) => dialogService.confirm(options) as Promise<boolean> }

export async function addSeriesAlbums(controller: InventoryController): Promise<void> {
    await controller.handleAddSeriesAlbums(confirmWith)
}

export async function updateRatings(controller: InventoryController): Promise<void> {
    await controller.handleUpdateRatings(confirmWith)
}

export async function removeItem(controller: InventoryController, albumId: string): Promise<void> {
    const album = find(controller, albumId)
    if (!album) return
    const confirmed = await dialogService.confirm({
        title: t('inventory.remove.title'),
        message: t('inventory.remove.message', { title: album.title ?? '' }),
        confirmText: t('inventory.remove.confirm'),
        variant: 'danger'
    })
    if (confirmed) await controller.handleDelete(albumId)
}

export async function editItem(controller: InventoryController, albumId: string): Promise<void> {
    const album = find(controller, albumId)
    if (!album) return
    await openInventoryEdit(album, async (id: string, updates: object) => { await controller.handleUpdateAlbum(id, updates) })
}

/** The window of the album: what the item keeps, the album of now from the album load, and the value section the controller answers for. */
export async function viewItem(controller: InventoryController, bridge: InventoryBridge, albumId: string): Promise<void> {
    const album = find(controller, albumId)
    if (!album) return
    bridge.openWindow = await openInventoryView(album, {
        loadAlbum: (signal: AbortSignal) => controller.albumOfItem(album, signal),
        value: {
            view: () => controller.valueViewOf(albumId),
            onWrite: (text: string) => controller.handleWriteValue(albumId, text),
            onForget: () => controller.handleForgetValue(albumId),
            onRead: () => controller.handleReadValue(albumId)
        }
    })
}
