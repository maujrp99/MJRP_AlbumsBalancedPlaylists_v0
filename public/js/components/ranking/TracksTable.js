import { getIcon } from '../../components/Icons.js'
import { SafeDOM } from '../../utils/SafeDOM.js'

/**
 * Desktop Presenter: Tracks Table
 * Sortable table with visual bars for popularity and badges for rank.
 * REFACTORED: SafeDOM implementation (Sprint 15 Phase 4.3)
 */
export class TracksTable {
    constructor({ tracks, sortField, sortDirection, onSort }) {
        this.tracks = tracks
        // Default sort: original album position (Sprint 20)
        this.sortField = sortField || 'position'
        this.sortDirection = sortDirection || 'asc'
        this.onSort = onSort
    }

    renderHeaders() {
        // Column order per Sprint 20 spec: #, Title, MY RANK (NEW), BestEverAlbums, Popularity, Time
        const headers = [
            { id: 'position', label: '#', icon: 'Hash', width: 'w-16' },
            { id: 'title', label: 'Track Name', width: 'flex-1' },
            { id: 'userRank', label: 'My Rank', icon: 'Star', width: 'w-24', align: 'center' },  // NEW Sprint 20
            { id: 'rank', label: 'BestEverAlbums', icon: 'Award', width: 'w-32', align: 'center' },
            { id: 'spotifyPopularity', label: 'Popularity', icon: 'SpotifyConfig', width: 'w-48', align: 'left' },
            { id: 'duration', label: 'Time', icon: 'Clock', width: 'w-20', align: 'right' }
        ]

        return headers.map(h => {
            const isActive = this.sortField === h.id
            const dirIcon = isActive
                ? (this.sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown')
                : null

            const headerChildren = []
            if (h.icon) headerChildren.push(SafeDOM.fromHTML(getIcon(h.icon, 'w-3 h-3 text-white/50')))
            headerChildren.push(SafeDOM.span({}, h.label))

            if (isActive) {
                headerChildren.push(
                    SafeDOM.span({ className: 'text-brand-orange' },
                        SafeDOM.fromHTML(getIcon(dirIcon, 'w-3 h-3'))
                    )
                )
            }

            return SafeDOM.div({
                className: `flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50 cursor-pointer hover:text-white transition-colors select-none sort-header ${h.width} ${h.align === 'center' ? 'justify-center' : ''} ${h.align === 'right' ? 'justify-end' : ''}`,
                dataset: {
                    sort: h.id,
                    direction: this.sortDirection
                },
                onClick: () => this.onSort(h.id)
            }, headerChildren) // SafeDOM handles array of nodes
        })
    }

    renderRow(track) {
        // Format Duration (ms -> mm:ss)
        const ms = Number(track.duration) || 0
        const min = Math.floor(ms / 60000)
        const sec = ((ms % 60000) / 1000).toFixed(0).padStart(2, '0')
        const time = ms > 1000 ? `${min}:${sec}` : '--:--'

        // Data Checks
        const hasRank = track.rank && track.rank < 999
        const hasPop = track.spotifyPopularity != null && track.spotifyPopularity > -1
        const positionDisplay = track.position >= 999 ? '-' : track.position

        // Color scheme: Acclaim = Orange, Popularity = Spotify Green
        const spotifyGreen = 'bg-[#1DB954]'

        // -- Columns --

        // 1. Position
        const posCol = SafeDOM.div({
            className: 'w-16 px-4 py-3 text-white/50 font-mono text-sm group-hover:text-white'
        }, String(positionDisplay))

        // 2. Title & Artist
        const titleCol = SafeDOM.div({ className: 'flex-1 px-4 py-3 min-w-0' }, [
            SafeDOM.div({
                className: 'font-medium text-white truncate group-hover:text-brand-orange transition-colors'
            }, track.title),
            SafeDOM.div({
                className: 'text-xs text-white/30 truncate'
            }, track.artist)
        ])

        // 3. User Rank (NEW Sprint 20 - Incandescent Blue)
        const hasUserRank = track.userRank && track.userRank < 999
        let userRankContent
        if (hasUserRank) {
            userRankContent = SafeDOM.span({
                className: 'inline-flex items-center justify-center w-8 h-8 rounded-full ' +
                    'bg-sky-500/10 text-sky-500 text-sm font-bold border border-sky-500/20 ' +
                    'shadow-lg shadow-sky-500/5',
                title: 'Your Rank'
            }, `#${track.userRank}`)
        } else {
            userRankContent = SafeDOM.span({ className: 'text-white/30 text-xs' }, '-')
        }
        const userRankCol = SafeDOM.div({
            className: 'w-24 px-4 py-3 flex justify-center'
        }, userRankContent)

        // 4. Acclaim Rank (BestEverAlbums - Orange)
        let claimContent
        if (hasRank) {
            const badges = [
                SafeDOM.span({
                    className: 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold border border-brand-orange/20 shadow-lg shadow-brand-orange/5'
                }, `#${track.rank}`)
            ]

            if (track.rating) {
                badges.push(SafeDOM.span({
                    className: 'flex items-center gap-1 text-sm font-bold text-white/90'
                }, [
                    SafeDOM.span({ className: 'text-brand-orange' }, '★'),
                    SafeDOM.text(Number(track.rating).toFixed(0))
                ]))
            }

            claimContent = SafeDOM.div({ className: 'flex items-center gap-2' }, badges)
        } else {
            claimContent = SafeDOM.span({ className: 'text-white/10 text-xs' }, '-')
        }

        const acclaimCol = SafeDOM.div({
            className: 'w-32 px-4 py-3 flex justify-center'
        }, claimContent)


        // 4. Spotify Popularity
        let popContent
        if (hasPop) {
            const popColorClass = track.spotifyPopularity > 80 ? 'text-[#1DB954]' : 'text-white/60'
            const popBarWidth = `${track.spotifyPopularity}%`

            const details = SafeDOM.div({ className: 'flex flex-col gap-1 flex-1 max-w-[100px]' }, [
                SafeDOM.div({ className: 'flex justify-between items-end text-[10px] text-white/40 uppercase font-bold tracking-wider' }, [
                    SafeDOM.span({}, 'Score'),
                    SafeDOM.span({ className: popColorClass }, `${track.spotifyPopularity}%`)
                ]),
                SafeDOM.div({ className: 'h-1.5 w-full bg-white/10 rounded-full overflow-hidden' }, [
                    SafeDOM.div({
                        className: `h-full ${spotifyGreen} rounded-full`,
                        style: { width: popBarWidth }
                    })
                ])
            ])

            const badges = []
            if (track.spotifyRank) {
                badges.push(SafeDOM.span({
                    className: 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-sm font-bold border border-[#1DB954]/20 shadow-lg shadow-[#1DB954]/5'
                }, `#${track.spotifyRank}`))
            }
            badges.push(details)

            popContent = SafeDOM.div({ className: 'flex items-center gap-2' }, badges)

        } else {
            popContent = SafeDOM.span({ className: 'text-white/10 text-xs' }, 'Not linked')
        }

        const spotifyCol = SafeDOM.div({ className: 'w-48 px-4 py-3' }, popContent)


        // 6. Duration
        const durationCol = SafeDOM.div({
            className: 'w-20 px-4 py-3 text-right text-white/50 font-mono text-xs group-hover:text-white'
        }, time)


        // Column order: position, title, userRank (NEW), acclaim, spotify, duration
        return SafeDOM.div({
            className: 'group flex items-center border-b border-white/5 hover:bg-white/5 transition-colors'
        }, [posCol, titleCol, userRankCol, acclaimCol, spotifyCol, durationCol])
    }


    render() {
        // Wrapper
        const statsHeader = this.renderStatsHeader()

        const headerRow = SafeDOM.div({
            className: 'flex items-center bg-white/5 border-b border-white/10'
        }, this.renderHeaders())

        const trackRows = this.tracks.map(t => this.renderRow(t))
        const listContainer = SafeDOM.div({
            className: 'divide-y divide-white/5'
        }, trackRows)

        // Footer removed (Sprint 20: Stats moved to header)
        // const footer = this.renderFooter()

        return SafeDOM.div({
            className: 'tracks-table-root bg-black/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm'
        }, [statsHeader, headerRow, listContainer])
    }

    renderStatsHeader() {
        return SafeDOM.div({
            className: 'p-3 bg-white/5 border-b border-white/10 flex justify-end gap-6 text-xs'
        }, [
            // User Rank Stats
            SafeDOM.div({ className: 'flex items-center gap-2 text-white/50' }, [
                SafeDOM.fromHTML(getIcon('Star', 'w-3 h-3 text-sky-500')),
                SafeDOM.span({}, [
                    SafeDOM.text('My Avg: '),
                    SafeDOM.strong({ className: 'text-white' }, this.calculateAvg('userRank', true))
                ])
            ]),
            // Acclaim Stats
            SafeDOM.div({ className: 'flex items-center gap-2 text-white/50' }, [
                SafeDOM.fromHTML(getIcon('Award', 'w-3 h-3 text-brand-orange')),
                SafeDOM.span({}, [
                    SafeDOM.text('Avg Rank: '),
                    SafeDOM.strong({ className: 'text-white' }, this.calculateAvg('rank', true))
                ])
            ]),
            // Popularity Stats
            SafeDOM.div({ className: 'flex items-center gap-2 text-white/50' }, [
                SafeDOM.fromHTML(getIcon('SpotifyConfig', 'w-3 h-3 text-[#1DB954]')),
                SafeDOM.span({}, [
                    SafeDOM.text('Avg Pop: '),
                    SafeDOM.strong({ className: 'text-white' }, `${this.calculateAvg('spotifyPopularity', false)}%`)
                ])
            ])
        ])
    }



    calculateAvg(field, excludeUnranked) {
        const valid = this.tracks.filter(t => excludeUnranked ? (t[field] && t[field] < 999) : (t[field] != null && t[field] > -1))
        if (!valid.length) return '-'
        const sum = valid.reduce((acc, t) => acc + t[field], 0)
        return (sum / valid.length).toFixed(1)
    }

    mount(container) {
        SafeDOM.clear(container)
        container.appendChild(this.render())
    }
}
