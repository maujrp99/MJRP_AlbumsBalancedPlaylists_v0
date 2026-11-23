/**
 * sources (F52 UAT-244, F69 UAT-245; F83 wave 6b: the port of components/albumWindowSources.js)
 *
 * How the album window knows where the ratings and the Spotify popularity of its album are in the album load, and asks for them again. The
 * window never reaches the load itself: whoever opens it gives `sources`:
 *   read()            -> { album?, ratings, popularity } (EnrichmentStatus of each source), or null
 *   ask(albumId, src) -> asks the load for 'acclaim' or 'popularity' again
 *   watch(listener)   -> calls the listener when the load changes; returns the function that stops it
 */

/** The state of the two sources, as the album load says it. */
export interface SourceState {
    album?: object | null
    ratings?: string
    popularity?: string
}

export interface AlbumSources {
    read?: () => SourceState | null
    ask: (albumId: string, source: 'acclaim' | 'popularity') => void
    watch?: (listener: () => void) => () => void
}

/** What the comparison of the tracks is given about each source: its state and how to ask again. */
export interface SourceProps {
    ratings?: { status?: string; onAsk: (albumId: string) => void }
    popularity?: { status?: string; onAsk: (albumId: string) => void }
}

export function sourceProps(sources: AlbumSources | null | undefined, state: SourceState | null): SourceProps {
    if (!sources || !state) return {}
    return {
        ratings: { status: state.ratings, onAsk: (albumId) => sources.ask(albumId, 'acclaim') },
        popularity: { status: state.popularity, onAsk: (albumId) => sources.ask(albumId, 'popularity') }
    }
}

/** What the window drew from the state of the sources: the window draws again only when it changes. */
export const stateKey = (state: SourceState | null): string => (state ? `${state.ratings}|${state.popularity}` : '')

/** The state of the sources now, or null when the window has no load behind it. */
export const readSources = (sources: AlbumSources | null | undefined): SourceState | null => sources?.read?.() ?? null

/**
 * Draw the window again when the load changes the state of a source, until the window closes.
 * @param signal - aborted when the window closes
 * @param handlers - `changed()` tells whether the state is not the one drawn; `redraw(state)` draws it
 */
export function watchSources(sources: AlbumSources | null | undefined, signal: AbortSignal, { changed, redraw }: { changed: () => boolean; redraw: (state: SourceState | null) => void }): void {
    if (!sources?.watch) return
    const stop = sources.watch(() => {
        if (!signal.aborted && changed()) redraw(readSources(sources))
    })
    signal.addEventListener('abort', stop)
}
