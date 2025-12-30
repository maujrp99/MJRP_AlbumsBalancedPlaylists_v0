import { getIcon } from '../../components/Icons.js'
import { SafeDOM } from '../../utils/SafeDOM.js'

/**
 * Mobile Presenter: Tracks Tabs
 * Tabbed interface for small screens.
 * REFACTORED: SafeDOM implementation (Sprint 15 Phase 4.3)
 */
export class TracksTabs {
    constructor({ tracks, activeTab, onTabChange }) {
        this.tracks = tracks
        this.activeTab = activeTab // 'original', 'acclaim', 'spotify'
        this.onTabChange = onTabChange
    }

    renderTabs() {
        const tabs = [
            { id: 'original', label: 'Original', icon: 'List' },
            { id: 'acclaim', label: 'Acclaim', icon: 'Award' },
            { id: 'spotify', label: 'Spotify', icon: 'SpotifyConfig' }
        ]

        return tabs.map(tab => {
            const isActive = this.activeTab === tab.id
            const activeClass = isActive
                ? 'text-white border-b-2 border-brand-orange bg-white/5'
                : 'text-white/50 border-b-2 border-transparent hover:text-white/80'

            const iconColor = (isActive && tab.id === 'spotify') ? 'text-[#1DB954]'
                : (isActive && tab.id === 'acclaim' ? 'text-brand-orange' : '')

            const btn = SafeDOM.button({
                className: `flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeClass} tab-btn`,
                dataset: { tab: tab.id },
                onClick: () => this.onTabChange(tab.id)
            }, [
                SafeDOM.fromHTML(getIcon(tab.icon, `w-5 h-5 ${iconColor}`)),
                SafeDOM.span({ className: 'text-[10px] font-bold uppercase tracking-widest' }, tab.label)
            ])

            return btn
        })
    }

    renderListItem(track) {
        // Decide what to show based on right side content
        let rightSideContent

        if (this.activeTab === 'original') {
            rightSideContent = SafeDOM.span({ className: 'font-mono text-white/30 text-xs' }, `#${track.position}`)
        } else if (this.activeTab === 'acclaim') {
            const hasRank = track.rank && track.rank < 999
            if (hasRank) {
                rightSideContent = SafeDOM.span({
                    className: 'px-2 py-1 rounded bg-brand-orange/10 text-brand-orange font-bold text-xs border border-brand-orange/20'
                }, `#${track.rank}`)
            } else {
                rightSideContent = SafeDOM.span({ className: 'text-white/20' }, '-')
            }
        } else if (this.activeTab === 'spotify') {
            const val = track.spotifyPopularity
            if (val > -1) {
                const color = val > 60 ? 'text-[#1DB954]' : 'text-white/60'
                rightSideContent = SafeDOM.div({ className: 'flex flex-col items-end' }, [
                    SafeDOM.span({ className: `font-bold text-xs ${color}` }, `${val}%`),
                    SafeDOM.div({ className: 'w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden' }, [
                        SafeDOM.div({
                            className: 'h-full bg-[#1DB954]',
                            style: { width: `${val}%` }
                        })
                    ])
                ])
            } else {
                rightSideContent = SafeDOM.span({ className: 'text-white/20 text-xs' }, '--')
            }
        }

        return SafeDOM.div({
            className: 'flex items-center justify-between p-4 border-b border-white/5 bg-white/5 mb-2 rounded-xl'
        }, [
            SafeDOM.div({ className: 'flex items-center gap-3 overflow-hidden' }, [
                SafeDOM.span({ className: 'text-xs text-white/30 font-mono min-w-[20px]' }, String(track.position)),
                SafeDOM.div({ className: 'flex flex-col min-w-0' }, [
                    SafeDOM.span({ className: 'text-sm font-bold text-white truncate' }, track.title),
                    SafeDOM.span({ className: 'text-xs text-white/40 truncate' }, track.artist)
                ])
            ]),
            SafeDOM.div({ className: 'flex-shrink-0 ml-4' }, rightSideContent)
        ])
    }

    render() {
        const tabsHeader = SafeDOM.div({
            className: 'flex border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10'
        }, this.renderTabs())

        const rightLabel = this.activeTab === 'spotify' ? 'Popularity'
            : (this.activeTab === 'acclaim' ? 'Rank' : 'Position')

        const infoRow = SafeDOM.div({
            className: 'px-2 mb-2 flex justify-between text-xs text-white/40 uppercase font-bold tracking-wider'
        }, [
            SafeDOM.span({}, 'Track List'),
            SafeDOM.span({}, rightLabel)
        ])

        const listContainer = SafeDOM.div({
            className: 'flex-1 overflow-y-auto'
        }, this.tracks.map(t => this.renderListItem(t)))

        return SafeDOM.div({ className: 'flex flex-col h-full' }, [
            tabsHeader, infoRow, listContainer
        ])
    }

    mount(container) {
        SafeDOM.clear(container)
        container.appendChild(this.render())
    }
}
