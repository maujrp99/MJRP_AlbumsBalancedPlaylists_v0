/**
 * phoneTabs - the destinations of the app on the phone and the name each screen has in the top bar (F76, REQ-03; F83 wave 3 as data in
 * TypeScript). Written in the code: nothing here comes from outside; the words come from the dictionary when they are drawn.
 *
 * `route` is where a tab goes, written without its first slash (the link is always `/` + route: an address of the app itself). `under`
 * lists the beginnings of the addresses a tab stands for: the tab is the current one on any of them. Playlists stands for the saved
 * playlists (where the tab goes: what the computer's top bar calls «Playlists») and for the playlists just generated (decided by the agent,
 * revisable). Albums also stands for the other kinds of series (artist, genre, track): today's «Music Series» item of the computer's menu lit on
 * them, and it is the item the Albums stop replaces (F88). The icon of each stop is the home's own (StopIcon).
 */
import { t } from '../i18n/t.js'

export interface PhoneTab {
    id: string
    labelKey: string
    route: string
    under: readonly string[]
}

export const PHONE_TABS: readonly PhoneTab[] = Object.freeze([
    { id: 'home', labelKey: 'shell.phone.tabStart', route: 'start', under: ['/start'] },
    { id: 'albums', labelKey: 'shell.phone.tabAlbums', route: 'albums', under: ['/albums', '/album-series', '/series', '/artists', '/genres', '/tracks'] },
    { id: 'blend', labelKey: 'shell.phone.tabBlend', route: 'blend', under: ['/blend'] },
    { id: 'playlists', labelKey: 'shell.phone.tabPlaylists', route: 'saved-playlists', under: ['/saved-playlists', '/playlist-series', '/playlists'] },
    { id: 'inventory', labelKey: 'shell.phone.tabInventory', route: 'inventory', under: ['/inventory'] }
])

/** What the top bar says on each address (the key of its name); the longest beginning that matches wins. */
const SCREEN_NAMES: ReadonlyArray<readonly [string, string]> = Object.freeze([
    ['/start', 'shell.phone.screenStart'],
    ['/albums', 'shell.phone.screenAlbums'],
    ['/blend', 'shell.phone.screenBlend'],
    ['/playlists/edit', 'shell.phone.screenEditPlaylists'],
    ['/playlists', 'shell.phone.screenNewPlaylists'],
    ['/saved-playlists', 'shell.phone.screenPlaylists'],
    ['/playlist-series', 'shell.phone.screenPlaylists'],
    ['/inventory', 'shell.phone.screenInventory'],
    ['/artists', 'shell.phone.screenArtists'],
    ['/genres', 'shell.phone.screenGenres'],
    ['/tracks', 'shell.phone.screenTracks']
] as const)

const begins = (path: string, start: string): boolean => path === start || path.startsWith(start + '/')

/** The tab the address belongs to; null on a screen no tab stands for. */
export function currentTab(path: string): PhoneTab | null {
    return PHONE_TABS.find(tab => tab.under.some(start => begins(path, start))) ?? null
}

/** The name of the screen at this address, for the top bar. */
export function screenName(path: string): string {
    const matches = SCREEN_NAMES.filter(([start]) => begins(path, start))
    if (matches.length === 0) return t('shell.phone.appName')
    return t(matches.reduce((best, entry) => (entry[0].length > best[0].length ? entry : best))[1])
}
