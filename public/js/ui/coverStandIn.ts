/**
 * coverStandIn - what an album cover shows when it has no image of its own (F70, UAT-63; moved here from components/ui/coverImage.js in F83 wave 8b: the
 * image itself is drawn by ui/CoverImage.tsx, and the hand-made `coverImage()` that drew it as an element left with the last hand-made screen).
 *
 * When there is no address, or when the address fails to load, the image shows the same stand-in everywhere: the albums screen, the album picker, the
 * series being built, the inventory, the saved playlists and the album window. A cover is an image marked `data-cover`; one that already shows the
 * stand-in is marked `data-cover-stand-in` and is left alone, so a stand-in that failed would not be set again (no loop).
 *
 * The failure is heard once, on the document: `error` does not bubble, but it is seen on the way down (capture), so it works for an image React drew
 * as for one written into the page as text, and the page's rules ask for no inline handler. The stand-in is an inline SVG (the page's policy allows
 * `data:` images): nothing is asked of the network to show it.
 */

const STAND_IN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="No cover">'
    + '<rect width="96" height="96" fill="#1f2937"/>'
    + '<g fill="none" stroke="#6b7280" stroke-width="3">'
    + '<circle cx="48" cy="48" r="24"/><circle cx="48" cy="48" r="7"/>'
    + '</g></svg>'

/** What a cover shows when it has no image of its own. */
export const COVER_STAND_IN = `data:image/svg+xml,${encodeURIComponent(STAND_IN_SVG)}`

/** Put the stand-in in the place of a cover, once. */
function showStandIn(img: HTMLImageElement): void {
    img.dataset.coverStandIn = 'true'
    img.setAttribute('src', COVER_STAND_IN)
}

const isCoverWithoutStandIn = (node: EventTarget | null): node is HTMLImageElement =>
    node instanceof HTMLImageElement && node.dataset.cover === 'true' && node.dataset.coverStandIn !== 'true'

const watched = new WeakSet<Document>()

/** Hear the covers of a document that fail to load. Asked any number of times, it listens once. */
export function watchCovers(root: Document = document): void {
    if (watched.has(root)) return
    watched.add(root)
    root.addEventListener('error', (event) => {
        if (isCoverWithoutStandIn(event.target)) showStandIn(event.target)
    }, true)
}
