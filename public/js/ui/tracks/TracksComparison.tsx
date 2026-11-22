/**
 * TracksComparison - the tracks of an album, compared across their sources (F83 wave 6b; the port of components/ranking/TracksRankingComparison.js).
 * It is the album window's: the table on the computer and the tabs on the phone are both drawn (the stylesheet shows one), the order is its own
 * (it sorts by hand: the popularity starts from the highest; the album card of the albums screen sorts by models/albumTrackRows.js, and the two
 * stay two), and above them one line for each source that did not answer, with «Try again».
 *
 * It never talks to Spotify (F69): where the popularity of the album is comes in `popularity`, and asking for it again goes out through
 * `popularity.onAsk`, to the album load. The caller gives it a `key` that changes when it wants a new comparison (the order starts again).
 */
import { useState } from 'react'
import { t } from '../../i18n/t.js'
import type { Album } from '../../models/Album.js'
import { mergedTracksOf } from '../../models/albumAverages.js'
import { describePopularity } from '../../models/popularityState.js'
import { describeRatings } from '../../models/ratingsState.js'
import { TracksTable, type TrackRowData } from './TracksTable'
import { TracksTabs, type TrackOrder } from './TracksTabs'

export interface SourceLine {
    status?: string
    onAsk: (albumId: string) => void
}

export interface TracksComparisonProps {
    album: Album
    /** The state of the Spotify popularity of the album in the album load, and how to ask for it again. Without it no line is shown. */
    popularity?: SourceLine | null
    /** The same for the ratings (the acclaim) of the album: when the source did not answer, one line says so (UAT-244). */
    ratings?: SourceLine | null
}

type Line = { text: string; action: string | null; quiet: boolean } | null

/** The button that asks the album load for a source again; the load redraws the album. */
function AskButton({ label, source, albumId }: { label: string; source: SourceLine; albumId: string }) {
    const [asked, setAsked] = useState(false)
    return (
        <button
            type="button"
            className="enrich-btn min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
            disabled={asked}
            onClick={() => { setAsked(true); source.onAsk(albumId) }}
        >{asked ? t('ui.tracks.asking') : label}</button>
    )
}

/** One line about one source: quiet when nothing is wrong, a box with «Try again» when it failed. */
function Notice({ name, line, source, albumId }: { name: string; line: Line; source: SourceLine | null | undefined; albumId: string }) {
    if (!line) return null
    return (
        <div className={`${name} flex justify-between items-center mb-4 ${line.quiet ? 'px-1' : 'bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl'}`}>
            <span className={line.quiet ? 'text-gray-400 text-sm' : 'text-blue-400 text-sm'}>{line.text}</span>
            {line.action && source ? <AskButton label={line.action} source={source} albumId={albumId} /> : null}
        </div>
    )
}

export function TracksComparison({ album, popularity = null, ratings = null }: TracksComparisonProps) {
    const tracks = mergedTracksOf(album) as TrackRowData[] // the same tracks, merged again each draw: nothing here is kept from an earlier one
    const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'position', direction: 'asc' })
    const [tab, setTab] = useState<TrackOrder>('original')
    // the hand-made comparison made the table and the tabs again at each press: what had the focus (a tab) lost it. Kept: a new key each time.
    const [drawn, setDrawn] = useState(0)

    const sorted = [...tracks].sort((a, b) => {
        let valA = a[sort.field] as number
        let valB = b[sort.field] as number
        // Special handling for missing data
        if (valA === -1) valA = -999999
        if (sort.field === 'spotifyPopularity') {
            // Higher is better. Default direction for popularity is DESC.
            if (a.spotifyPopularity === -1) valA = -Infinity
            if (b.spotifyPopularity === -1) valB = -Infinity
        }
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1
        return 0
    })

    // Toggle the direction when the same field is pressed; a new field starts from its own (rank and position from the first, popularity from the highest)
    const sortBy = (field: string): void => {
        setDrawn(count => count + 1)
        setSort(current => (current.field === field
            ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            : { field, direction: field === 'spotifyPopularity' ? 'desc' : 'asc' }))
    }

    // A tab orders the tracks the way its source does
    const pickTab = (next: TrackOrder): void => {
        setDrawn(count => count + 1)
        setTab(next)
        if (next === 'original') setSort({ field: 'position', direction: 'asc' })
        else if (next === 'acclaim') setSort({ field: 'rank', direction: 'asc' })
        else if (next === 'spotify') setSort({ field: 'spotifyPopularity', direction: 'desc' })
    }

    const ratingsLine = describeRatings(ratings?.status ?? '') as Line
    const popularityLine = (album.spotifyId ? null : describePopularity(popularity?.status ?? '')) as Line

    return (
        <div className="tracks-ranking-comparison w-full space-y-6">
            <Notice name="ratings-notice" line={ratingsLine} source={ratings} albumId={album.id ?? ''} />
            <Notice name="popularity-notice" line={popularityLine} source={popularity} albumId={album.id ?? ''} />
            <div className="tracks-table-container hidden md:block">
                <TracksTable key={drawn} tracks={sorted} sortField={sort.field} sortDirection={sort.direction} onSort={sortBy} />
            </div>
            <div className="tracks-tabs-container md:hidden">
                <TracksTabs key={drawn} tracks={sorted} activeTab={tab} onTabChange={pickTab} albumArtist={album.artist} />
            </div>
        </div>
    )
}
