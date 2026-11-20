import { SafeDOM } from '../../utils/SafeDOM.js'
import { formatDuration } from '../../utils/duration.js'

/**
 * The tracks of the album window on the phone (F76, REQ-06): it is drawn only below 768 px
 * (TracksRankingComparison puts it in a `md:hidden` box; the computer shows TracksTable).
 *
 * One segmented control picks the order (the album's, BestEverAlbums', Spotify's): three short
 * labels that fit one line. Each row is the track number, the title on a line of its own (it
 * wraps, it is never cut), and below it the two references and the duration, so nothing competes
 * with the title for the line (audit finding 3). Styles: public/css/mobile/album-window.css.
 */

/** The three orders; the label is short so the three fit one line, the name says it whole. */
export const TRACK_ORDERS = Object.freeze([
    { id: 'original', label: 'Original', name: 'The order of the album' },
    { id: 'acclaim', label: 'BEA', name: 'The BestEverAlbums rank' },
    { id: 'spotify', label: 'Spotify', name: 'The Spotify popularity' }
])

const NONE = '—'
const hasRank = (track) => Boolean(track.rank) && track.rank < 999
const hasPopularity = (track) => typeof track.spotifyPopularity === 'number' && track.spotifyPopularity > -1

export class TracksTabs {
    /**
     * @param {Object} props
     * @param {Array<Object>} props.tracks - in the order to show
     * @param {'original'|'acclaim'|'spotify'} props.activeTab
     * @param {Function} props.onTabChange - (id) => void
     * @param {string} [props.albumArtist] - a track's own artist is shown only when it is another
     */
    constructor({ tracks, activeTab, onTabChange, albumArtist = '' }) {
        this.tracks = tracks
        this.activeTab = activeTab
        this.onTabChange = onTabChange
        this.albumArtist = albumArtist
    }

    renderTabs() {
        return TRACK_ORDERS.map(order => {
            const on = this.activeTab === order.id
            return SafeDOM.button({
                type: 'button',
                className: `tracks-tabs__segment phone-segmented__option tab-btn${on ? ' is-on' : ''}`, // css/mobile.css § 11
                dataset: { tab: order.id },
                'aria-pressed': String(on),
                'aria-label': order.name,
                onClick: () => this.onTabChange(order.id)
            }, order.label)
        })
    }

    /** One reference of a track (its BEA rank, its Spotify popularity); the one of the order on is lit. */
    renderReference(source, label, value) {
        const lit = this.activeTab === source ? ' is-on' : ''
        return SafeDOM.span({ className: `tracks-tabs__ref${lit}` }, [
            SafeDOM.span({ className: 'tracks-tabs__ref-label' }, label),
            SafeDOM.text(` ${value}`)
        ])
    }

    renderListItem(track) {
        const references = [
            this.renderReference('acclaim', 'BEA', hasRank(track) ? `#${track.rank}` : NONE),
            this.renderReference('spotify', 'Spotify', hasPopularity(track) ? `${track.spotifyPopularity}%` : NONE)
        ]
        const ownArtist = track.artist && track.artist !== this.albumArtist
            ? SafeDOM.span({ className: 'tracks-tabs__artist' }, track.artist)
            : null

        return SafeDOM.li({ className: 'tracks-tabs__row' }, [
            SafeDOM.span({ className: 'tracks-tabs__number' }, String(track.position)),
            SafeDOM.div({ className: 'tracks-tabs__main' }, [
                SafeDOM.span({ className: 'tracks-tabs__title' }, track.title),
                ownArtist,
                SafeDOM.span({ className: 'tracks-tabs__refs' }, references)
            ].filter(Boolean)),
            SafeDOM.span({ className: 'tracks-tabs__time' }, formatDuration(track.duration))
        ])
    }

    render() {
        const bar = SafeDOM.div({ className: 'tracks-tabs__bar', role: 'group', 'aria-label': 'Order the tracks by' }, this.renderTabs())
        const list = SafeDOM.create('ol', { className: 'tracks-tabs__list' }, this.tracks.map(t => this.renderListItem(t)))
        return SafeDOM.div({ className: 'tracks-tabs' }, [bar, list])
    }

    mount(container) {
        SafeDOM.clear(container)
        container.appendChild(this.render())
    }
}
