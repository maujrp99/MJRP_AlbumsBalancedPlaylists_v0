/**
 * AlbumsBridge - what the controller draws into (F83 wave 5a). The controller (controllers/SeriesController.js, hand-written, one for the
 * whole session) talks to a «view» with `setLoading`, `updateAlbums` and `updateHeader`; this is that view for the screen in React. It
 * draws nothing: it keeps what the controller last said (the albums on this page and whether the load is on) and a number that goes up at
 * each notice, which the screen reads (`useSyncExternalStore`) to draw again. The screen reads the rest from the controller and the stores
 * at the moment it draws, as the hand-made screen read them at the moment of the notice.
 *
 * It also keeps what lived with the hand-made view: the series the person opened whole (past the first 12 albums), forgotten when the
 * scope changes, and the name the top bar of the phone shows (a series name, or none for all of them).
 */
import { SeriesExpansion } from '../../models/seriesExpansion.js'
import { nameThisScreen } from '../../stores/screenName.js'
import type { Album, AlbumsController, HeaderData } from './types'

export class AlbumsBridge {
    private listeners = new Set<() => void>()
    private version = 0
    albums: Album[] = []
    isLoading = false
    /** The series the person opened whole; it lives with the screen: a new visit starts empty, a change of scope empties it. */
    readonly expansion = new SeriesExpansion()

    constructor(private readonly controller: AlbumsController) {}

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    /** How many notices the controller has given: the screen makes its list anew each time. */
    getVersion = (): number => this.version

    private tell(): void {
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    setLoading(isLoading: boolean): void {
        this.isLoading = isLoading
    }

    updateAlbums(albums: Album[], isLoading = false): void {
        const state = this.controller.getState()
        this.expansion.syncScope(state.currentScope === 'ALL' ? 'ALL' : `SINGLE:${state.targetSeriesId}`)
        this.albums = albums
        this.isLoading = isLoading
        this.tell()
    }

    updateHeader(data: HeaderData | null): void {
        // the phone's top bar names the series on screen; all of them: «Albums»
        if (data) nameThisScreen(data.activeSeriesId ? data.title : '')
        this.tell()
    }

    /** The screen is left: the controller lives on, so it is told to stop drawing here. */
    dispose(): void {
        this.controller.detachView(this)
        this.listeners.clear()
    }
}
