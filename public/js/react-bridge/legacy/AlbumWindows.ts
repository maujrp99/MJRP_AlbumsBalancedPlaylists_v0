/**
 * AlbumWindows - the windows the albums screen opens that stay hand-made (F83 wave 5a; TEMPORARY, listed in bridgesOnlyShrink; they are
 * ported in wave 5b and with the inventory, wave 6): the window of the album (tracks, ratings, popularity; the inventory uses it too), the
 * window «Add to inventory», and the window to rank the tracks (it writes the person's own ranking). Each is asked for when pressed, by
 * `import()`, as the screen asks for any window: none is in the first download of the screen.
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

/** `onSubmit` writes the ranking (it answers whether it was saved); `onSaved` is told once it was. */
export async function openRankWindow(album: Album, onSubmit: (rankings: unknown) => Promise<boolean>, onSaved: () => void): Promise<void> {
    const { UserRankModal } = await import('../../components/ranking/UserRankModal.js')
    new UserRankModal({ album, onSubmit, onSave: onSaved } as never).show()
}
