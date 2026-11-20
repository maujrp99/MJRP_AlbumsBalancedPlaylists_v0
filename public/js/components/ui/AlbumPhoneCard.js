/**
 * AlbumPhoneCard - an album of the albums screen, as the phone draws it (F76, REQ-05).
 * Styles: public/css/mobile/albums.css. Drawn only when isPhone(): the computer keeps the cards
 * of AlbumCardRenderer.
 *
 * Two forms, both with the cover as the hero and no icon-only buttons side by side:
 *   tile  the grid: the cover, the title in up to two lines, the artist and the year;
 *   row   the list: one compact line per album (cover of 56 px, title, artist · year, badges).
 * A tap on the album opens the album window (data-action="view-modal", as on the computer);
 * the 44 px «⋯» (data-action="album-more") opens a bottom sheet with every action named
 * (components/series/SeriesPhoneSheets.js). Outside text goes in as text (SafeDOM).
 */
import { albumLoader } from '../../services/AlbumLoader.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { coverImage } from './coverImage.js'
import { identityNotice } from '../../models/askedAlbum.js'

/** The «⋯» drawn in the app's stroke (no icon of the set says «more»). */
const MORE_ICON = '<svg class="album-more__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'

/** @returns {Array<string>} the short names of where the album's ranking comes from */
export function albumBadgeLabels(album) {
    const hasUserRanking = !!album?.hasUserRanking || (album?.userRanking?.length > 0)
    return [
        hasUserRanking ? 'My ranking' : null,
        album?.bestEverAlbumId ? 'BestEverAlbums' : null,
        album?.spotifyId ? 'Spotify' : null
    ].filter(Boolean)
}

/** The 44 px button that opens the album's actions. */
export function renderMoreButton(album) {
    const button = SafeDOM.button({
        type: 'button',
        className: 'album-more',
        'aria-label': `Actions for ${album.title || 'this album'}`,
        dataset: { action: 'album-more', id: album.id }
    })
    button.appendChild(SafeDOM.fromHTML(MORE_ICON))
    return button
}

function cover(album, size) {
    return coverImage({
        src: albumLoader.getArtworkUrl(album, size),
        alt: '',
        className: 'album-cover__img',
        loading: 'lazy'
    })
}

function artistLine(album) {
    return [album.artist, album.year].filter(Boolean).join(' · ')
}

function badges(album, className, itemClass) {
    const labels = albumBadgeLabels(album)
    if (labels.length === 0) return null
    return SafeDOM.span({ className }, labels.map(label => SafeDOM.span({ className: itemClass }, label)))
}

function notice(album, className) {
    const text = identityNotice(album)
    return text ? SafeDOM.span({ className, dataset: { identityNote: 'true' } }, text) : null
}

/**
 * The album in the phone's grid.
 * @returns {string} HTML
 */
export function renderPhoneTile(album) {
    const open = { action: 'view-modal', id: album.id }
    const coverButton = SafeDOM.button({ type: 'button', className: 'album-tile__cover', 'aria-label': `Open ${album.title || 'album'}`, dataset: open }, [cover(album, 300)])
    const text = SafeDOM.button({ type: 'button', className: 'album-tile__text', dataset: open }, [
        SafeDOM.span({ className: 'album-tile__title' }, album.title || ''),
        SafeDOM.span({ className: 'album-tile__artist' }, artistLine(album)),
        badges(album, 'album-tile__badges', 'album-tile__badges-item'),
        notice(album, 'album-tile__notice')
    ].filter(Boolean))

    const tile = SafeDOM.div({ className: 'album-tile', dataset: { id: album.id } }, [
        coverButton,
        SafeDOM.div({ className: 'album-tile__meta' }, [text, renderMoreButton(album)])
    ])
    return tile.outerHTML
}

/**
 * The album as one compact line of the phone's list.
 * @returns {string} HTML
 */
export function renderPhoneRow(album) {
    const main = SafeDOM.button({ type: 'button', className: 'album-row__main', dataset: { action: 'view-modal', id: album.id } }, [
        SafeDOM.span({ className: 'album-row__cover' }, [cover(album, 120)]),
        SafeDOM.span({ className: 'album-row__text' }, [
            SafeDOM.span({ className: 'album-row__title' }, album.title || ''),
            SafeDOM.span({ className: 'album-row__artist' }, artistLine(album)),
            badges(album, 'album-row__badges', 'album-row__badges-item'),
            notice(album, 'album-row__notice')
        ].filter(Boolean))
    ])
    const row = SafeDOM.div({ className: 'album-row', dataset: { id: album.id } }, [main, renderMoreButton(album)])
    return row.outerHTML
}
