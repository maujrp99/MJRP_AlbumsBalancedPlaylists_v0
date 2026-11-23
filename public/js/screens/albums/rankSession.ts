/**
 * The state of the window to rank the tracks of an album (F83 wave 5b; it was the state of components/ranking/UserRankModal.js): the order
 * on screen, the order as it was when the window opened (or last saved), the track picked on the phone. The window draws from it and asks
 * it; it holds no drawing and reaches nothing outside (who saves is whoever opened the window, by `onSubmit`).
 *
 * A person's ranking is their own data, so the rules here are the ones of the old window, to the letter:
 * - it starts from the ranking the album already has (UAT-187): the tracks with a rank first, by rank; the tracks without one after, in the
 *   order of the record. «Reset» goes back to the order of the record;
 * - what is saved is every track of the order on screen, numbered from 1 (`{ trackTitle, userRank }`), the ones without a rank of their
 *   own included, after the ranked ones: a partial ranking is saved as the order the person left on screen.
 */

export interface RankTrack {
    id?: string
    title: string
    artist?: string
    position?: number
    userRank?: number | null
    rank?: number
    spotifyRank?: number
    duration?: number
}

export interface RankAlbum {
    id?: string
    title: string
    artist: string
    tracks?: RankTrack[]
}

/** What is handed to whoever saves. */
export interface Ranking {
    trackTitle: string
    userRank: number
}

/** A track is known by its id, or by its title when it has none. */
export const trackKey = (track: RankTrack): string => track.id || track.title

const isRanked = (track: RankTrack): boolean => track.userRank !== null && track.userRank !== undefined

export class RankSession {
    readonly album: RankAlbum
    /** The tracks in the order of the record. */
    readonly tracks: RankTrack[]
    /** The order on screen. */
    rankedOrder: RankTrack[]
    /** The track picked to move without dragging (the phone), or null. */
    pickedId: string | null = null
    private savedOrder: string
    private version = 0
    private readonly listeners = new Set<() => void>()

    constructor(album: RankAlbum) {
        this.album = album
        this.tracks = [...(album.tracks ?? [])].sort((a, b) => (a.position || 0) - (b.position || 0))
        this.rankedOrder = [
            ...this.tracks.filter(isRanked).sort((a, b) => (a.userRank as number) - (b.userRank as number)),
            ...this.tracks.filter(track => !isRanked(track))
        ]
        this.savedOrder = this.orderKey()
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    getVersion = (): number => this.version

    private touch(): void {
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    /** The order on screen as one string of track ids (to compare with the order saved). */
    private orderKey(): string {
        return this.rankedOrder.map(trackKey).join('\u0000')
    }

    /** Whether the order on screen differs from the one the window opened with (or last saved). */
    hasUnsavedChanges(): boolean {
        return this.orderKey() !== this.savedOrder
    }

    /** Where the track picked is in the order, or -1. */
    pickedIndex(): number {
        return this.rankedOrder.findIndex(track => trackKey(track) === this.pickedId)
    }

    /** Picks a track (or lets it go: the same track again, or null). */
    pick(id: string | null): void {
        this.pickedId = id && this.pickedId !== id ? id : null
        this.touch()
    }

    /** Moves a track of the order on screen from one place to another (0-based; a place past the ends is the end). Whether the order changed. */
    moveTrack(from: number, to: number): boolean {
        const last = this.rankedOrder.length - 1
        const target = Math.max(0, Math.min(last, to))
        if (from < 0 || from > last || target === from) return false
        const [track] = this.rankedOrder.splice(from, 1)
        this.rankedOrder.splice(target, 0, track)
        this.touch()
        return true
    }

    /** Goes back to the order of the record. */
    reset(): void {
        this.rankedOrder = [...this.tracks]
        this.touch()
    }

    /** Puts an order back (the «Undo» of a reset). */
    restore(order: RankTrack[]): void {
        this.rankedOrder = order
        this.touch()
    }

    /** What is handed to whoever saves: every track of the order on screen, numbered from 1. */
    rankings(): Ranking[] {
        return this.rankedOrder.map((track, index) => ({ trackTitle: track.title, userRank: index + 1 }))
    }

    /** The order on screen is now the one saved: «changed» is measured from here. */
    markSaved(): void {
        this.savedOrder = this.orderKey()
    }
}
