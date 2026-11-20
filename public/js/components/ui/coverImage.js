/**
 * coverImage - the one way an album cover is drawn (F70, UAT-63).
 *
 * `coverImage({ src, alt, className, ... })` gives the <img> of a cover. When there is no address,
 * or when the address fails to load, the image shows the same stand-in everywhere: the albums
 * screen, the album picker, the series being built, the inventory, the saved playlists and the
 * album window.
 *
 * Most cards are written into the page as text (`outerHTML`), where a listener put on the image
 * would be lost, and the page's rules ask for no inline handler. So the failure is heard once, on
 * the document: `error` does not bubble, but it is seen on the way down (capture). A cover is an
 * image marked `data-cover`; one that already shows the stand-in is marked `data-cover-stand-in`
 * and is left alone, so a stand-in that failed would not be set again (no loop).
 *
 * The stand-in is an inline SVG (the page's policy allows `data:` images): nothing is asked of
 * the network to show it.
 */

import { SafeDOM } from '../../utils/SafeDOM.js'

const STAND_IN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="No cover">'
    + '<rect width="96" height="96" fill="#1f2937"/>'
    + '<g fill="none" stroke="#6b7280" stroke-width="3">'
    + '<circle cx="48" cy="48" r="24"/><circle cx="48" cy="48" r="7"/>'
    + '</g></svg>'

/** What a cover shows when it has no image of its own. */
export const COVER_STAND_IN = `data:image/svg+xml,${encodeURIComponent(STAND_IN_SVG)}`

const hasAddress = (src) => typeof src === 'string' && src.trim().length > 0

/** Put the stand-in in the place of a cover, once. */
function showStandIn(img) {
    img.dataset.coverStandIn = 'true'
    img.setAttribute('src', COVER_STAND_IN)
}

const isCoverWithoutStandIn = (node) =>
    node instanceof HTMLImageElement && node.dataset.cover === 'true' && node.dataset.coverStandIn !== 'true'

const watched = new WeakSet()

/**
 * Hear the covers of a document that fail to load. Asked any number of times, it listens once.
 * @param {Document} [root]
 */
export function watchCovers(root = document) {
    if (watched.has(root)) return
    watched.add(root)
    root.addEventListener('error', (event) => {
        if (isCoverWithoutStandIn(event.target)) showStandIn(event.target)
    }, true)
}

/**
 * The image of an album cover.
 * @param {Object} props - what SafeDOM.img takes (alt, className, loading, style...), and:
 * @param {string|null} [props.src] - the address of the cover; with none, the stand-in is shown
 * @returns {HTMLImageElement}
 */
export function coverImage({ src, dataset = {}, ...props } = {}) {
    watchCovers()
    const img = SafeDOM.img({ ...props, dataset: { ...dataset, cover: 'true' } })
    if (hasAddress(src)) img.setAttribute('src', src)
    else showStandIn(img)
    return img
}
