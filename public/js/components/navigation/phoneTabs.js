/**
 * phoneTabs - the destinations of the app on the phone and the name each screen has in the top
 * bar (F76, REQ-03). Written in the code: nothing here comes from outside.
 *
 * `route` is where a tab goes, written without its first slash (the link is always `/` + route:
 * an address of the app itself). `under` lists the beginnings of the addresses a tab stands for:
 * the tab is the current one on any of them. Playlists stands for the saved playlists (where the
 * tab goes: what the computer's top bar calls «Playlists») and for the playlists just generated
 * (decided by the agent, revisable). Albums also stands for the other kinds of series (artist, genre, track):
 * today's «Music Series» item of the computer's menu lit on them, and it is the item the Albums stop replaces (F88).
 */
export const PHONE_TABS = Object.freeze([
    { id: 'home', label: 'Start', route: 'start', under: ['/start'] },
    { id: 'albums', label: 'Albums', route: 'albums', under: ['/albums', '/album-series', '/series', '/artists', '/genres', '/tracks'] },
    { id: 'blend', label: 'Blend', route: 'blend', under: ['/blend'] },
    { id: 'playlists', label: 'Playlists', route: 'saved-playlists', under: ['/saved-playlists', '/playlist-series', '/playlists'] },
    { id: 'inventory', label: 'Inventory', route: 'inventory', under: ['/inventory'] }
])

/** What the top bar says on each address; the longest beginning that matches wins. */
const SCREEN_NAMES = Object.freeze([
    ['/start', 'Start'],
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

