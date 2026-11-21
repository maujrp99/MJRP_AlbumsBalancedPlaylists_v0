/**
 * subRow - the line under the bar (F88): it takes the place of the Series dropdown and of the
 * playlist places of the phone's menu. Only Albums and Playlists have one. A kind of series that is
 * not there yet is shown, and is not a link (F63: a click goes nowhere).
 */
import { MENU_TEXT } from './menuText.js'

const begins = (path, start) => path === start || path.startsWith(start + '/')

const ALBUMS = Object.freeze({
    label: MENU_TEXT.albumsLine,
    starts: ['/albums'],
    items: [
        { label: MENU_TEXT.byAlbum, href: '/albums', under: ['/albums'] },
        { label: MENU_TEXT.byArtist, soon: true },
        { label: MENU_TEXT.byGenre, soon: true },
        { label: MENU_TEXT.byTrack, soon: true }
    ]
})

const PLAYLISTS = Object.freeze({
    label: MENU_TEXT.playlistsLine,
    starts: ['/saved-playlists', '/playlists', '/playlist-series'],
    items: [
        { label: MENU_TEXT.savedPlaylists, href: '/saved-playlists', under: ['/saved-playlists'] },
        { label: MENU_TEXT.newPlaylists, href: '/playlists', under: ['/playlists'] },
        { label: MENU_TEXT.playlistSeries, href: '/playlist-series', under: ['/playlist-series'] }
    ]
})

/**
 * @param {string} path
 * @returns {{label: string, items: Array}|null} the line the screen has, each item marked `current` where it is the screen; null where there is none
 */
export function subRowFor(path) {
    const row = [ALBUMS, PLAYLISTS].find(candidate => candidate.starts.some(start => begins(path, start)))
    if (!row) return null
    return { label: row.label, items: row.items.map(item => ({ ...item, current: Boolean(item.under?.some(start => begins(path, start))) })) }
}

function renderItem(item) {
    if (item.soon) return `<span aria-disabled="true">${item.label} <span class="sub-soon">${MENU_TEXT.soon}</span></span>`
    return `<a href="${item.href}" data-link${item.current ? ' class="cur" aria-current="page"' : ''}>${item.label}</a>`
}

/** @returns {string} the line's navigation, or '' where the screen has none */
export function renderSubRow(path) {
    const row = subRowFor(path)
    if (!row) return ''
    return `<nav class="sub-row" aria-label="${row.label}">${row.items.map(renderItem).join('')}</nav>`
}
