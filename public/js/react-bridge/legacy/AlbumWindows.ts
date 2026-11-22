/**
 * AlbumWindows - the windows the albums screen opens that stay hand-made (F83 wave 5a; TEMPORARY, listed in bridgesOnlyShrink; they are
 * ported with the inventory, wave 6): the window of the album (tracks, ratings, popularity; the inventory uses it too) and the window
 * «Add to inventory». Each is asked for when pressed, by `import()`, as the screen asks for any window: none is in the first download of the
 * screen. (The windows to edit and delete a series and to rank the tracks were ported in wave 5b: screens/albums/.)
 */

/** An album the screen holds (the shapes are the screen's; the windows read what they need of it). */
type Album = object

/** What the album window reads of the album's sources: given by the controller (`sourcesOf`). */
export type AlbumSources = object | undefined

export async function openAlbumWindow(album: Album, sources: AlbumSources): Promise<void> {
    const { showViewAlbumModal } = await import('../../components/ViewAlbumModal.js')
    showViewAlbumModal(album, { sources })
}

export async function openInventoryAdd(album: Album): Promise<void> {
    const { InventoryAddModal } = await import('../../components/InventoryAddModal.js')
    InventoryAddModal.open(album, () => {})
}

/** What the window of the album asks of the inventory (components/ViewAlbumModal.js `options.value`). */
interface ValueHost {
    view: () => unknown
    onWrite: (text: string) => Promise<boolean>
    onForget: () => Promise<boolean>
    onRead: () => Promise<void>
}

/** The window of the album opened by the inventory: it also shows the value of the item and where to buy it; the handle redraws that section. */
export async function openInventoryView(item: Album, options: { loadAlbum: (signal: AbortSignal) => Promise<unknown>; value: ValueHost }): Promise<{ redrawValue: () => void }> {
    const { showViewAlbumModal } = await import('../../components/ViewAlbumModal.js')
    const handle = await showViewAlbumModal(item, options)
    return handle as HTMLElement & { redrawValue: () => void }
}

/** The window to edit an item of the inventory (hand-made until wave 6b); `onSave(id, updates)` is called when the person saves. */
export async function openInventoryEdit(item: Album, onSave: (id: string, updates: object) => Promise<void>): Promise<void> {
    const { InventoryEditModal } = await import('../../components/InventoryEditModal.js')
    InventoryEditModal.open(item, onSave)
}
