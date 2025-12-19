import { getIcon } from '../../components/Icons.js'

/**
 * Mobile Presenter: Tracks Tabs
 * Tabbed interface for small screens.
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

            return `
                <button 
                    class="flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeClass} tab-btn"
                    data-tab="${tab.id}"
                >
                    ${getIcon(tab.icon, `w-5 h-5 ${isActive && tab.id === 'spotify' ? 'text-[#1DB954]' : (isActive && tab.id === 'acclaim' ? 'text-brand-orange' : '')}`)}
                    <span class="text-[10px] font-bold uppercase tracking-widest">${tab.label}</span>
                </button>
            `
        }).join('')
    }

    renderListItem(track) {
        // Decide what to show based on active tab
        let rightSideContent = ''

        if (this.activeTab === 'original') {
            rightSideContent = `<span class="font-mono text-white/30 text-xs">#${track.position}</span>`
        } else if (this.activeTab === 'acclaim') {
            const hasRank = track.rank && track.rank < 999
            rightSideContent = hasRank
                ? `<span class="px-2 py-1 rounded bg-brand-orange/10 text-brand-orange font-bold text-xs border border-brand-orange/20">#${track.rank}</span>`
                : `<span class="text-white/20">-</span>`
        } else if (this.activeTab === 'spotify') {
            const val = track.spotifyPopularity
            const color = val > 60 ? 'text-[#1DB954]' : 'text-white/60'
            rightSideContent = val > -1
                ? `<div class="flex flex-col items-end">
                     <span class="font-bold text-xs ${color}">${val}%</span>
                     <div class="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div class="h-full bg-[#1DB954]" style="width: ${val}%"></div>
                     </div>
                   </div>`
                : `<span class="text-white/20 text-xs">--</span>`
        }

        return `
            <div class="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 mb-2 rounded-xl">
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="text-xs text-white/30 font-mono min-w-[20px]">${track.position}</span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-bold text-white truncate">${track.title}</span>
                        <span class="text-xs text-white/40 truncate">${track.artist}</span>
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    ${rightSideContent}
                </div>
            </div>
        `
    }

    render() {
        return `
            <div class="flex flex-col h-full">
                <!-- Tabs Header -->
                <div class="flex border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
                    ${this.renderTabs()}
                </div>

                <!-- List Info -->
                <div class="px-2 mb-2 flex justify-between text-xs text-white/40 uppercase font-bold tracking-wider">
                    <span>Track List</span>
                    <span>${this.activeTab === 'spotify' ? 'Popularity' : (this.activeTab === 'acclaim' ? 'Rank' : 'Position')}</span>
                </div>

                <!-- Scrollable List -->
                <div class="flex-1 overflow-y-auto">
                    ${this.tracks.map(t => this.renderListItem(t)).join('')}
                </div>
            </div>
        `
    }

    mount(container) {
        container.innerHTML = this.render()

        const tabs = container.querySelectorAll('.tab-btn')
        tabs.forEach(btn => {
            btn.onclick = () => this.onTabChange(btn.dataset.tab)
        })
    }
}
