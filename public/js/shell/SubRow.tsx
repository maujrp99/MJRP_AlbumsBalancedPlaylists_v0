/**
 * SubRow - the line under the bar (F88; F83 sync of main: was components/navigation/subRow.js): it takes the place of the Series dropdown and of
 * the playlist places of the phone's menu. Only Albums and Playlists have one. A kind of series that is not there yet is shown, and is not a
 * link (F63: a click goes nowhere).
 */
import { t } from '../i18n/t.js'

interface Item {
    label: string
    href?: string
    under?: readonly string[]
    soon?: boolean
}

const begins = (path: string, start: string): boolean => path === start || path.startsWith(start + '/')

/** The places of each line, each with the beginnings of the addresses it stands for (the texts are read when the line is drawn). */
const lines = (): ReadonlyArray<{ label: string; starts: readonly string[]; items: readonly Item[] }> => [
    {
        label: t('shell.m.albumsLine'),
        starts: ['/albums'],
        items: [
            { label: t('shell.series.byAlbum'), href: '/albums', under: ['/albums'] },
            { label: t('shell.series.byArtist'), soon: true },
            { label: t('shell.series.byGenre'), soon: true },
            { label: t('shell.series.byTrack'), soon: true }
        ]
    },
    {
        label: t('shell.m.playlistsLine'),
        starts: ['/saved-playlists', '/playlists', '/playlist-series'],
        items: [
            { label: t('shell.m.savedPlaylists'), href: '/saved-playlists', under: ['/saved-playlists'] },
            { label: t('shell.m.newPlaylists'), href: '/playlists', under: ['/playlists'] },
            { label: t('shell.m.playlistSeries'), href: '/playlist-series', under: ['/playlist-series'] }
        ]
    }
]

/** The line the screen has, each item marked `current` where it is the screen; null where there is none. */
export function subRowFor(path: string): { label: string; items: Array<Item & { current: boolean }> } | null {
    const row = lines().find(candidate => candidate.starts.some(start => begins(path, start)))
    if (!row) return null
    return { label: row.label, items: row.items.map(item => ({ ...item, current: Boolean(item.under?.some(start => begins(path, start))) })) }
}

export function SubRow({ path }: { path: string }) {
    const row = subRowFor(path)
    if (!row) return null
    return (
        <nav className="sub-row" aria-label={row.label}>
            {row.items.map(item => (item.soon
                ? <span key={item.label} aria-disabled="true">{`${item.label} `}<span className="sub-soon">{t('shell.series.soon')}</span></span>
                : <a key={item.label} href={item.href} data-link="" className={item.current ? 'cur' : undefined} aria-current={item.current ? 'page' : undefined}>{item.label}</a>
            ))}
        </nav>
    )
}
