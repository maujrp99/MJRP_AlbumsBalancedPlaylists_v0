/**
 * SeriesLoading - what the albums screen shows while the series are being read, instead of its empty state (F79; the port of
 * components/series/SeriesLoadingState.js of `main`, and the rule is models/albumsListState.js, the same file).
 *
 * The hand-made screen kept the grid above invisible, kept the block below as tall as the empty card, and LIFTED the content over the grid's
 * slot by a number it measured once (the height of the grid at that moment). That number can be stale: the independent judge saw, in WebKit,
 * the content land about 130 px too low when the grid was 52 px tall at the first paint. Here nothing is measured: the layout does it.
 *
 *   in the grid's own slot   `LoadingSlot` is drawn inside `#series-grid-mount`, which is `relative` while it waits, pinned to the top of the
 *                            slot (`absolute inset-x-0 top-0`): the grid is still there but invisible (`visibility: hidden` on the mount,
 *                            `visible` on the content), so it keeps the space it will keep when the empty card or the list arrives, and
 *                            the content sits right under the filters whatever height the grid has at any moment. Invisible, not just
 *                            empty: the browser does not count a hidden box as a layout shift when the list arrives, as on `main`;
 *   the reserved height      `LoadingReserve` stands where the empty card will stand, with its height (391 px on the computer, 282 px on the
 *                            phone, measured on the built site), so the «Last updated» line does not jump when the card arrives.
 */
import { LoadingSeries } from '../../ui/LoadingSeries'

/** The height of the empty card, measured on the built site (1280 px: 391; 393 px: 282). */
export const LOADING_MIN_HEIGHT = Object.freeze({ computer: 391, phone: 282 })

/** The words or the spinner, at the top of the grid's slot; it says what is going on to whoever listens (`role="status"`). */
export function LoadingSlot({ phone }: { phone: boolean }) {
    return (
        <div data-testid="series-loading" className="visible absolute inset-x-0 top-0 flex items-start justify-center" role="status" aria-live="polite">
            <LoadingSeries phone={phone} />
        </div>
    )
}

/** The room of the empty card, empty itself: it holds the place and says nothing. */
export function LoadingReserve({ phone }: { phone: boolean }) {
    return <div data-testid="series-loading-reserve" aria-hidden="true" style={{ minHeight: `${phone ? LOADING_MIN_HEIGHT.phone : LOADING_MIN_HEIGHT.computer}px` }} />
}
