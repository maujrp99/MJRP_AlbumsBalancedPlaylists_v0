/**
 * TracksTabs - the tracks of the album window on the phone (F76, REQ-06; F83 wave 6b: the port of components/ranking/TracksTabs.js, with the same
 * HTML and the same classes). It is drawn with the table and the stylesheet shows one of them (`md:hidden`: only below 900 px).
 *
 * One segmented control picks the order (the album's, BestEverAlbums', Spotify's): three short labels that fit one line. Each row is the
 * track number, the title on a line of its own (it wraps, it is never cut), and below it the two references and the duration, so nothing
 * competes with the title for the line (audit finding 3). Styles: public/css/mobile/album-window.css.
 */
import { t } from '../../i18n/t.js'
import { formatDuration } from '../../utils/duration.js'
import type { TrackRowData } from './TracksTable'

export type TrackOrder = 'original' | 'acclaim' | 'spotify'

/** The three orders; the label is short so the three fit one line, the name says it whole. */
export const TRACK_ORDERS: ReadonlyArray<{ id: TrackOrder; label: string; name: string }> = [
    { id: 'original', label: 'ui.tracks.order.original', name: 'ui.tracks.order.originalName' }, // UAT-230
    { id: 'acclaim', label: 'ui.tracks.order.acclaim', name: 'ui.tracks.order.acclaimName' },
    { id: 'spotify', label: 'ui.tracks.order.spotify', name: 'ui.tracks.order.spotifyName' }
]

const NONE = '—'
const hasRating = (track: TrackRowData): boolean => typeof track.rating === 'number' && Number.isFinite(track.rating)
const hasPopularity = (track: TrackRowData): boolean => typeof track.spotifyPopularity === 'number' && track.spotifyPopularity > -1

interface Reference {
    source: TrackOrder
    kind: string
    label: string
    name: string
    value: string
    mark?: string
}

/**
 * One reference of a track (its BEA rating, its Spotify popularity), in the colour of its source (`--bea`, `--spotify`: the colours of the
 * computer's table, UAT-228); the one of the order on is lit.
 */
function Ref({ active, reference }: { active: TrackOrder; reference: Reference }) {
    const lit = active === reference.source ? ' is-on' : ''
    return (
        <span className={`tracks-tabs__ref tracks-tabs__ref--${reference.kind}${lit}`} aria-label={`${reference.name} ${reference.value}`}>
            <span className="tracks-tabs__ref-label" aria-hidden="true">{reference.label}</span>
            <span aria-hidden="true">{` ${reference.mark ?? ''}${reference.value}`}</span>
        </span>
    )
}

function Item({ track, active, albumArtist }: { track: TrackRowData; active: TrackOrder; albumArtist: string }) {
    const ownArtist = track.artist && track.artist !== albumArtist ? <span className="tracks-tabs__artist">{track.artist}</span> : null
    return (
        <li className="tracks-tabs__row">
            <span className="tracks-tabs__number">{String(track.position)}</span>
            <div className="tracks-tabs__main">
                <span className="tracks-tabs__title">{track.title}</span>
                {ownArtist}
                <span className="tracks-tabs__refs">
                    <Ref active={active} reference={{ source: 'acclaim', kind: 'bea', label: t('ui.tracks.order.acclaim'), name: t('ui.tracks.beaRating'), ...(hasRating(track) ? { mark: '★ ', value: Number(track.rating).toFixed(0) } : { value: NONE }) }} />
                    <Ref active={active} reference={{ source: 'spotify', kind: 'spotify', label: t('ui.tracks.order.spotify'), name: t('ui.tracks.spotifyPopularity'), value: hasPopularity(track) ? `${track.spotifyPopularity}%` : NONE }} />
                </span>
            </div>
            <span className="tracks-tabs__time">{formatDuration(track.duration)}</span>
        </li>
    )
}

export interface TracksTabsProps {
    /** In the order to show. */
    tracks: TrackRowData[]
    activeTab: TrackOrder
    onTabChange: (tab: TrackOrder) => void
    /** A track's own artist is shown only when it is another. */
    albumArtist?: string
}

export function TracksTabs({ tracks, activeTab, onTabChange, albumArtist = '' }: TracksTabsProps) {
    return (
        <div className="tracks-tabs">
            <div className="tracks-tabs__bar" role="group" aria-label={t('ui.tracks.orderBy')}>
                {TRACK_ORDERS.map(order => {
                    const on = activeTab === order.id
                    return (
                        <button
                            key={order.id}
                            type="button"
                            className={`tracks-tabs__segment phone-segmented__option tab-btn${on ? ' is-on' : ''}`}
                            data-tab={order.id}
                            aria-pressed={String(on) as 'true' | 'false'}
                            aria-label={t(order.name)}
                            onClick={() => onTabChange(order.id)}
                        >{t(order.label)}</button>
                    )
                })}
            </div>
            <ol className="tracks-tabs__list">
                {tracks.map((track, index) => <Item key={index} track={track} active={activeTab} albumArtist={albumArtist} />)}
            </ol>
        </div>
    )
}
