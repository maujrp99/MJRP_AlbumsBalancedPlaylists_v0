import { getIcon } from '../../components/Icons.js'

/**
 * Desktop Presenter: Tracks Table
 * Sortable table with visual bars for popularity and badges for rank.
 */
export class TracksTable {
    constructor({ tracks, sortField, sortDirection, onSort }) {
        this.tracks = tracks
        this.sortField = sortField
        this.sortDirection = sortDirection
        this.onSort = onSort
    }

    renderHeaders() {
        const headers = [
            { id: 'position', label: '#', icon: 'Hash', width: 'w-16' },
            { id: 'title', label: 'Track Name', width: 'flex-1' },
            { id: 'rank', label: 'Acclaim', icon: 'Award', width: 'w-32', align: 'center' },
            { id: 'spotifyPopularity', label: 'Popularity', icon: 'SpotifyConfig', width: 'w-48', align: 'left' }, // Changed align to left for bars
            { id: 'duration', label: 'Time', icon: 'Clock', width: 'w-24', align: 'right' }
        ]

        return headers.map(h => {
            const isActive = this.sortField === h.id
            const dirIcon = isActive
                ? (this.sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown')
                : ''

            return `
                <div 
                    class="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50 cursor-pointer hover:text-white transition-colors ${h.width} ${h.align === 'center' ? 'justify-center' : ''} ${h.align === 'right' ? 'justify-end' : ''}"
                    onclick="window.dispatchEvent(new CustomEvent('reorder-tracks', { detail: '${h.id}' }))"
                >
                    ${h.icon ? getIcon(h.icon, 'w-3 h-3') : ''}
                    <span>${h.label}</span>
                    ${isActive ? `<span class="text-brand-orange">${getIcon(dirIcon, 'w-3 h-3')}</span>` : ''}
                </div>
            `
        }).join('')
    }

    renderRow(track) {
        // Format Duration (ms -> mm:ss)
        const ms = track.duration
        const min = Math.floor(ms / 60000)
        const sec = ((ms % 60000) / 1000).toFixed(0).padStart(2, '0')
        const time = ms > 0 ? `${min}:${sec}` : '--:--'

        // Data Checks
        const hasRank = track.rank && track.rank < 999
        const hasPop = track.spotifyPopularity > -1

        // Popularity Bar Color Logic
        // < 30: red, < 60: yellow, >= 60: green
        const popColor = track.spotifyPopularity < 30 ? 'bg-red-500' :
            track.spotifyPopularity < 60 ? 'bg-yellow-500' : 'bg-[#1DB954]'

        return `
            <div class="group flex items-center border-b border-white/5 hover:bg-white/5 transition-colors">
                
                <!-- Position -->
                <div class="w-16 px-4 py-3 text-white/50 font-mono text-sm group-hover:text-white">
                    ${track.position}
                </div>

                <!-- Title -->
                <div class="flex-1 px-4 py-3 min-w-0">
                    <div class="font-medium text-white truncate group-hover:text-brand-orange transition-colors">
                        ${track.title}
                    </div>
                    <div class="text-xs text-white/30 truncate">${track.artist}</div>
                </div>

                <!-- Acclaim Rank -->
                <div class="w-32 px-4 py-3 flex justify-center">
                    ${hasRank
                ? `<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold border border-brand-orange/20 shadow-lg shadow-brand-orange/5">#${track.rank}</span>`
                : `<span class="text-white/10 text-xs">-</span>`
            }
                </div>

                <!-- Spotify Popularity -->
                <div class="w-48 px-4 py-3">
                    ${hasPop
                ? `
                            <div class="flex flex-col gap-1 w-full max-w-[140px]">
                                <div class="flex justify-between items-end text-[10px] text-white/40 uppercase font-bold tracking-wider">
                                    <span>Score</span>
                                    <span class="${track.spotifyPopularity > 80 ? 'text-[#1DB954]' : 'text-white/60'}">${track.spotifyPopularity}%</span>
                                </div>
                                <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full ${popColor} rounded-full" style="width: ${track.spotifyPopularity}%"></div>
                                </div>
                            </div>
                          `
                : `<span class="text-white/10 text-xs">Not linked</span>`
            }
                </div>

                <!-- Duration -->
                <div class="w-24 px-4 py-3 text-right text-sm text-white/40 font-mono">
                    ${time}
                </div>

            </div>
        `
    }

    render() {
        return `
            <div class="bg-black/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm">
                <!-- Header -->
                <div class="flex items-center bg-white/5 border-b border-white/10">
                    ${this.renderHeaders()}
                </div>

                <!-- Rows -->
                <div class="divide-y divide-white/5">
                    ${this.tracks.map(t => this.renderRow(t)).join('')}
                </div>

                <!-- Footer / Totals -->
                <div class="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-8 text-sm">
                    <div class="flex items-center gap-2 text-white/60">
                         ${getIcon('Award', 'w-4 h-4 text-brand-orange')}
                         <span>Avg Rank: <strong class="text-white">${this.calculateAvg('rank', true)}</strong></span>
                    </div>
                    <div class="flex items-center gap-2 text-white/60">
                         ${getIcon('SpotifyConfig', 'w-4 h-4 text-[#1DB954]')}
                         <span>Avg Pop: <strong class="text-white">${this.calculateAvg('spotifyPopularity', false)}%</strong></span>
                    </div>
                </div>
            </div>
        `
    }

    calculateAvg(field, excludeUnranked) {
        const valid = this.tracks.filter(t => excludeUnranked ? (t[field] && t[field] < 999) : (t[field] > -1))
        if (!valid.length) return '-'
        const sum = valid.reduce((acc, t) => acc + t[field], 0)
        return (sum / valid.length).toFixed(1)
    }

    mount(container) {
        container.innerHTML = this.render()

        // Attach event listeners for custom sort event (hacky but works for simple decoupling)
        // Better: Attach click listeners directly
        // But for now, let's re-bind the onclicks in renderHeaders closer to "React-style" 
        // by attaching handlers to the generated DOM
        const headers = container.querySelectorAll('.cursor-pointer') // Select header divs
        headers.forEach((h, i) => {
            // We need to map index back to ID. 
            const ids = ['position', 'title', 'rank', 'spotifyPopularity', 'duration']
            h.onclick = () => this.onSort(ids[i])
        })
    }
}
