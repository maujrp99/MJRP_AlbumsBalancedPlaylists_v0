/**
 * The series being built on the Home (F79): the chosen albums, in their order (the order counts:
 * the Blend reads the albums in it). Each album is in it once. It moves an album one place up or down
 * (no dragging: ↑ ↓ work the same with a mouse, a keyboard and a finger), takes one out and puts it
 * back at its place (the «Undo» of a removal), adds many at once and gives the list back as it was
 * (the «Undo» of «Add all»).
 *
 * It draws nothing: every change is told through `onChange`, with the list in its order.
 */
import type { SeriesAlbum } from './homeSeries'

const sameId = (a: unknown, b: unknown): boolean => String(a) === String(b)

export class StagingAreaController {
    private selectedAlbums: SeriesAlbum[] = []
    private readonly onChange: (albums: SeriesAlbum[]) => void

    constructor({ onChange }: { onChange?: (albums: SeriesAlbum[]) => void } = {}) {
        this.onChange = onChange || (() => {})
    }

    getSelectedAlbums(): SeriesAlbum[] {
        return this.selectedAlbums
    }

    /** @returns {boolean} whether the album of this id is in the series */
    hasAlbum(albumId: unknown): boolean {
        return this.selectedAlbums.some(album => sameId(album.id, albumId))
    }

    addAlbum(album: SeriesAlbum): void {
        if (this.hasAlbum(album.id)) return
        this.selectedAlbums = [...this.selectedAlbums, album]
        this.changed()
    }

    /** @returns {number} how many of them went in (an album already in the series does not) */
    addMany(albums: SeriesAlbum[]): number {
        const fresh = albums.filter((album: SeriesAlbum, index: number) =>
            !this.hasAlbum(album.id) && albums.findIndex(other => sameId(other.id, album.id)) === index)
        if (fresh.length === 0) return 0
        this.selectedAlbums = [...this.selectedAlbums, ...fresh]
        this.changed()
        return fresh.length
    }

    /** @returns {{ album: Object, index: number }|null} what was taken out and where it was */
    removeAlbum(albumId: unknown): { album: SeriesAlbum; index: number } | null {
        const index = this.selectedAlbums.findIndex(album => sameId(album.id, albumId))
        if (index < 0) return null
        const album = this.selectedAlbums[index]
        this.selectedAlbums = this.selectedAlbums.filter((_: SeriesAlbum, at: number) => at !== index)
        this.changed()
        return { album, index }
    }

    /** Put back an album at its place (the «Undo» of a removal). */
    insertAlbum(album: SeriesAlbum, index: number): void {
        if (this.hasAlbum(album.id)) return
        const at = Math.max(0, Math.min(index, this.selectedAlbums.length))
        this.selectedAlbums = [...this.selectedAlbums.slice(0, at), album, ...this.selectedAlbums.slice(at)]
        this.changed()
    }

    /** Move a chosen album one place up (-1) or down (+1). A move past either end does nothing. */
    moveAlbum(albumId: unknown, delta: number): void {
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
    snapshot(): SeriesAlbum[] {
        return [...this.selectedAlbums]
    }

    restore(albums: SeriesAlbum[]): void {
        this.selectedAlbums = [...albums]
        this.changed()
    }

    clear(): void {
        this.restore([])
    }

    private changed(): void {
        this.onChange(this.selectedAlbums)
    }
}
