/**
 * SeriesPhoneSheets - the actions of an album and of a series, named, in a bottom sheet of the
 * phone (F76, REQ-05; audit findings 2 and 7). Styles: public/css/mobile/albums.css.
 *
 * Opened by the 44 px «⋯» of an album (AlbumPhoneCard) and of a series header (renderSeriesHeader).
 * The sheet only says and reports: each row closes it and hands its action back to who opened it,
 * which calls the same handlers the computer's buttons call. The one that removes is last, in red,
 * apart from the others, and asks for a confirmation (SeriesEventHandler.handleRemoveAlbum).
 */
import { openSheet } from '../ui/Sheet.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { getIcon } from '../Icons.js'

/** One named action: an icon of 22 px and a label, the whole row a target of 52 px. */
function actionRow({ icon, label, danger = false, onPick }) {
    const row = SafeDOM.button({ type: 'button', className: `albums-sheet__row${danger ? ' albums-sheet__row--danger' : ''}` }, [
        SafeDOM.fromHTML(getIcon(icon, 'albums-sheet__icon')),
        SafeDOM.span({ className: 'albums-sheet__label' }, label)
    ])
    row.addEventListener('click', onPick)
    return row
}

/** A link out of the app (the sources of the ranking), in a new tab, as the computer's badges. */
function linkRow({ icon, label, href }) {
    return SafeDOM.a({ className: 'albums-sheet__row', href, target: '_blank', rel: 'noopener noreferrer' }, [
        SafeDOM.fromHTML(getIcon(icon, 'albums-sheet__icon')),
        SafeDOM.span({ className: 'albums-sheet__label' }, label),
        SafeDOM.fromHTML(getIcon('ExternalLink', 'albums-sheet__out'))
    ])
}

function list(rows) {
    return SafeDOM.div({ className: 'albums-sheet__list' }, rows.filter(Boolean))
}

/** @returns {Array<{icon, label, href}>} where the album can be seen outside the app */
export function albumLinks(album) {
    const links = []
    if (album?.spotifyId) {
        const href = safeUrl(album.spotifyUrl) || `https://open.spotify.com/album/${encodeURIComponent(album.spotifyId)}`
        links.push({ icon: 'Spotify', label: 'Open in Spotify', href })
    }
    if (album?.bestEverAlbumId) {
        links.push({ icon: 'Award', label: 'See on BestEverAlbums', href: `https://www.besteveralbums.com/thechart.php?a=${encodeURIComponent(album.bestEverAlbumId)}` })
    }
    return links
}

/**
 * The actions of one album.
 * @param {Object} album
 * @param {(action: string) => void} onAction - 'view-modal' | 'rank-album' | 'add-to-inventory' | 'refetch-metadata' | 'remove-album'
 * @returns {Object} the sheet (openSheet)
 */
export function openAlbumActions(album, onAction) {
    let sheet = null
    const pick = (action) => () => { sheet?.close(); onAction(action) }
    const ranked = !!album.hasUserRanking || (album.userRanking?.length > 0)
    const about = [album.artist, album.year].filter(Boolean).join(' · ')

    const content = [
        about ? SafeDOM.p({ className: 'albums-sheet__about' }, about) : null,
        list([
            actionRow({ icon: 'Maximize2', label: 'View album and tracks', onPick: pick('view-modal') }),
            actionRow({ icon: 'Star', label: ranked ? 'Edit my ranking' : 'Rank the tracks', onPick: pick('rank-album') }),
            actionRow({ icon: 'Archive', label: 'Add to inventory', onPick: pick('add-to-inventory') }),
            actionRow({ icon: 'RefreshCw', label: 'Fetch the details again', onPick: pick('refetch-metadata') }),
            ...albumLinks(album).map(linkRow)
        ]),
        list([actionRow({ icon: 'Trash', label: 'Remove from this series', danger: true, onPick: pick('remove-album') })])
    ].filter(Boolean)

    sheet = openSheet({ variant: 'bottom', title: album.title || 'Album', content })
    sheet.element.classList.add('albums-sheet')
    return sheet
}

/**
 * The actions of one series: edit it, delete it (the delete asks for a confirmation itself).
 * @param {{ name: string, albumCount?: number }} series
 * @param {{ onEdit: Function, onDelete: Function }} handlers
 * @returns {Object} the sheet (openSheet)
 */
export function openSeriesActions(series, { onEdit, onDelete }) {
    let sheet = null
    const pick = (handler) => () => { sheet?.close(); handler?.() }
    const count = Number.isFinite(series.albumCount) ? `${series.albumCount} ${series.albumCount === 1 ? 'album' : 'albums'}` : ''

    const content = [
        count ? SafeDOM.p({ className: 'albums-sheet__about' }, count) : null,
        list([actionRow({ icon: 'Edit', label: 'Edit series', onPick: pick(onEdit) })]),
        list([actionRow({ icon: 'Trash', label: 'Delete series', danger: true, onPick: pick(onDelete) })])
    ].filter(Boolean)

    sheet = openSheet({ variant: 'bottom', title: series.name || 'Series', content })
    sheet.element.classList.add('albums-sheet')
    return sheet
}
