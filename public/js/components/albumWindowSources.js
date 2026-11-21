/**
 * albumWindowSources (F52 UAT-244, F69 UAT-245)
 *
 * How the album window knows where the ratings and the Spotify popularity of its album are in the
 * album load, and asks for them again. The window never reaches the load itself: whoever opens it
 * gives `sources`:
 *   read()            -> { album?, ratings, popularity } (EnrichmentStatus of each source), or null
 *   ask(albumId, src) -> asks the load for 'acclaim' or 'popularity' again
 *   watch(listener)   -> calls the listener when the load changes; returns the function that stops it
 */

/** What the comparison of the tracks is given about each source: its state and how to ask again. */
export function sourceProps(sources, state) {
    if (!sources || !state) return {}
    return {
        ratings: { status: state.ratings, onAsk: (albumId) => sources.ask(albumId, 'acclaim') },
        popularity: { status: state.popularity, onAsk: (albumId) => sources.ask(albumId, 'popularity') }
    }
}

/** What the window drew from the state of the sources: the window draws again only when it changes. */
export const stateKey = (state) => (state ? `${state.ratings}|${state.popularity}` : '')

/** The state of the sources now, or null when the window has no load behind it. */
export const readSources = (sources) => sources?.read?.() ?? null

/**
 * Draw the window again when the load changes the state of a source, until the window closes.
 * @param {Object|null} sources
 * @param {AbortSignal} signal - aborted when the window closes
 * @param {{ changed: Function, redraw: Function }} handlers - changed() tells whether the state is
 *        not the one drawn; redraw(state) draws it
 */
export function watchSources(sources, signal, { changed, redraw }) {
    if (!sources?.watch) return
    const stop = sources.watch(() => {
        if (!signal.aborted && changed()) redraw(readSources(sources))
    })
    signal.addEventListener('abort', stop)
}
