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
