/**
 * phoneTabs - the destinations of the app on the phone and the name each screen has in the top
 * bar (F76, REQ-03). Written in the code: nothing here comes from outside.
 *
 * `route` is where a tab goes, written without its first slash (the link is always `/` + route:
 * an address of the app itself). `under` lists the beginnings of the addresses a tab stands for:
 * the tab is the current one on any of them. Playlists stands for the saved playlists (where the
 * tab goes: what the computer's top bar calls «Playlists») and for the playlists just generated
 * (decided by the agent, revisable).
 */
import { getIcon } from '../Icons.js'

export const PHONE_TABS = Object.freeze([
    { id: 'home', label: 'Home', route: 'home', icon: 'Home', under: ['/home'] },
    { id: 'albums', label: 'Albums', route: 'albums', icon: 'Disc', under: ['/albums', '/album-series', '/series'] },
    { id: 'blend', label: 'Blend', route: 'blend', icon: 'Blend', under: ['/blend'] },
    { id: 'playlists', label: 'Playlists', route: 'saved-playlists', icon: 'ListMusic', under: ['/saved-playlists', '/playlist-series', '/playlists'] },
    { id: 'inventory', label: 'Inventory', route: 'inventory', icon: 'Archive', under: ['/inventory'] }
])

/** What the top bar says on each address; the longest beginning that matches wins. */
const SCREEN_NAMES = Object.freeze([
    ['/home', 'Home'],
    ['/albums', 'Albums'],
    ['/blend', 'Blend'],
    ['/playlists/edit', 'Edit Playlists'],
    ['/playlists', 'New Playlists'],
    ['/saved-playlists', 'Playlists'],
    ['/playlist-series', 'Playlists'],
    ['/inventory', 'Inventory'],
    ['/artists', 'Series by Artist'],
    ['/genres', 'Series by Genre'],
    ['/tracks', 'Series by Track']
])

const APP_NAME = 'Album Blender'

const begins = (path, start) => path === start || path.startsWith(start + '/')

/**
 * @param {string} path - the path of the address (no query)
 * @returns {Object|null} the tab the address belongs to; null on a screen no tab stands for
 */
export function currentTab(path) {
    return PHONE_TABS.find(tab => tab.under.some(start => begins(path, start))) || null
}

/** @returns {string} the name of the screen at this address, for the top bar */
export function screenName(path) {
    const matches = SCREEN_NAMES.filter(([start]) => begins(path, start))
    if (matches.length === 0) return APP_NAME
    return matches.reduce((best, entry) => (entry[0].length > best[0].length ? entry : best))[1]
}

/** @returns {string} the tab bar, with the current destination marked for the eye and the reader */
export function renderTabBar(path) {
    const current = currentTab(path)
    const tabs = PHONE_TABS.map(tab => {
        const isCurrent = tab === current
        return `
        <a href="/${tab.route}" data-link data-tab="${tab.id}" class="phone-tabbar__tab${isCurrent ? ' is-current' : ''}"${isCurrent ? ' aria-current="page"' : ''}>
          ${getIcon(tab.icon, 'phone-tabbar__icon')}
          <span class="phone-tabbar__label">${tab.label}</span>
        </a>`
    }).join('')
    return `<nav class="phone-tabbar__tabs" aria-label="Main">${tabs}</nav>`
}
