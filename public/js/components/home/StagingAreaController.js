/**
 * The series being built on the Home (F79): the chosen albums, in their order (the order counts:
 * the Blend reads the albums in it). Each album is in it once. It moves an album one place up or down
 * (no dragging: ↑ ↓ work the same with a mouse, a keyboard and a finger), takes one out and puts it
 * back at its place (the «Undo» of a removal), adds many at once and gives the list back as it was
 * (the «Undo» of «Add all»).
 *
 * It draws nothing: every change is told through `onChange`, with the list in its order.
 */
const sameId = (a, b) => String(a) === String(b)

export class StagingAreaController {
    /** @param {{ onChange: (albums: Array<Object>) => void }} options */
    constructor({ onChange } = {}) {
        this.onChange = onChange || (() => {})
        this.selectedAlbums = []
    }

    getSelectedAlbums() {
        return this.selectedAlbums
    }

    /** @returns {boolean} whether the album of this id is in the series */
    hasAlbum(albumId) {
        return this.selectedAlbums.some(album => sameId(album.id, albumId))
    }

    addAlbum(album) {
        if (this.hasAlbum(album.id)) return
        this.selectedAlbums = [...this.selectedAlbums, album]
        this.changed()
    }

    /** @returns {number} how many of them went in (an album already in the series does not) */
    addMany(albums) {
        const fresh = albums.filter((album, index) =>
            !this.hasAlbum(album.id) && albums.findIndex(other => sameId(other.id, album.id)) === index)
        if (fresh.length === 0) return 0
        this.selectedAlbums = [...this.selectedAlbums, ...fresh]
        this.changed()
        return fresh.length
    }

    /** @returns {{ album: Object, index: number }|null} what was taken out and where it was */
    removeAlbum(albumId) {
        const index = this.selectedAlbums.findIndex(album => sameId(album.id, albumId))
        if (index < 0) return null
        const album = this.selectedAlbums[index]
        this.selectedAlbums = this.selectedAlbums.filter((_, at) => at !== index)
        this.changed()
        return { album, index }
    }

    /** Put back an album at its place (the «Undo» of a removal). */
    insertAlbum(album, index) {
        if (this.hasAlbum(album.id)) return
        const at = Math.max(0, Math.min(index, this.selectedAlbums.length))
        this.selectedAlbums = [...this.selectedAlbums.slice(0, at), album, ...this.selectedAlbums.slice(at)]
        this.changed()
    }

    /** Move a chosen album one place up (-1) or down (+1). A move past either end does nothing. */
    moveAlbum(albumId, delta) {
        const from = this.selectedAlbums.findIndex(album => sameId(album.id, albumId))
        const to = from + delta
        if (from < 0 || to < 0 || to >= this.selectedAlbums.length) return
        const next = [...this.selectedAlbums]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        this.selectedAlbums = next
        this.changed()
    }

    /** @returns {Array<Object>} the list as it is now, to give back with restore() */
    snapshot() {
        return [...this.selectedAlbums]
    }

    restore(albums) {
        this.selectedAlbums = [...albums]
        this.changed()
    }

    clear() {
        this.restore([])
    }

    changed() {
        this.onChange(this.selectedAlbums)
    }
}
