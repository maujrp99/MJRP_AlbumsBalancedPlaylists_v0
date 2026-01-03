import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { albumSearchService } from '../../services/album-search/AlbumSearchService.js'
import { musicKitService } from '../../services/MusicKitService.js'
import { toast } from '../Toast.js'

/**
 * Artist Scanner Component
 * Handles searching Apple Music for artist albums
 */
export class ArtistScanner {
    constructor(options = {}) {
        this.onAlbumSelected = options.onAlbumSelected || (() => { })
        this.searchResults = []
        this.filterState = { albums: true, singles: false, live: false, compilations: false }

        // DOM References
        this.elements = {}
    }

    render() {
        const input = SafeDOM.input({
            type: 'text',
            className: 'form-control flex-1',
            placeholder: 'Enter artist name (e.g., Pink Floyd, T-Rex)'
        })

        const scanBtn = SafeDOM.button({
            type: 'button',
            className: 'btn btn-primary px-4 flex items-center gap-2',
            onClick: () => this.scanArtist()
        }, [
            // Icon handling might differ if getIcon returns string. 
            // Assuming we wrap output of getIcon or use manual SVG for now to be safe, 
            // OR use innerHTML within a wrapper if we trust getIcon (we do, but SafeDOM prefers nodes).
            // Let's assume getIcon returns HTML string for now and set innerHTML of a span or wrapper.
            // But SafeDOM.span({ innerHTML: ... }) works if supported.
            // Let's use simple text for now or helper.
            SafeDOM.span({ className: 'w-4 h-4' }, '🔍'),
            'Scan'
        ])

        const searchRow = SafeDOM.div({ className: 'flex gap-2 mb-3' }, [input, scanBtn])

        // Filter Buttons
        const createFilterBtn = (type, label) => {
            return SafeDOM.button({
                type: 'button',
                className: 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5 transition-colors',
                dataset: { filter: type },
                onClick: (e) => this.toggleFilter(type, e.target)
            }, label)
        }

        const filters = SafeDOM.div({ className: 'flex flex-wrap gap-2 mb-3 hidden' }, [
            createFilterBtn('albums', 'Albums'),
            createFilterBtn('singles', 'Singles/EPs'),
            createFilterBtn('live', 'Live'),
            createFilterBtn('compilations', 'Compilations')
        ])

        // Results Area
        const resultsList = SafeDOM.div({ className: 'space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar hidden' })
        const hint = SafeDOM.p({ className: 'text-xs text-muted mt-2' }, 'Type artist name and click Scan to find albums')

        const container = SafeDOM.div({ className: 'mt-4 p-3 bg-white/5 rounded-lg' }, [
            searchRow,
            filters,
            resultsList,
            hint
        ])

        // Store references
        this.elements = {
            input,
            scanBtn,
            filters,
            resultsList,
            hint,
            filterButtons: {
                albums: filters.children[0],
                singles: filters.children[1],
                live: filters.children[2],
                compilations: filters.children[3]
            }
        }

        // Initialize default filter state UI
        this.updateFilterUI()

        // Input enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                this.scanArtist()
            }
        })

        return container
    }

    async scanArtist() {
        const query = this.elements.input.value.trim()
        if (!query) return

        const { scanBtn, hint } = this.elements

        scanBtn.disabled = true
        scanBtn.textContent = 'Scanning...'
        hint.textContent = 'Searching Apple Music...'
        hint.classList.remove('hidden')

        try {
            await musicKitService.init()
            this.searchResults = await albumSearchService.getArtistDiscography(query)

            if (this.searchResults && this.searchResults.length > 0) {
                this.elements.filters.classList.remove('hidden')
                this.elements.resultsList.classList.remove('hidden')
                this.elements.hint.classList.add('hidden')
                this.applyFilters()
            } else {
                this.elements.hint.textContent = 'No albums found.'
                this.elements.filters.classList.add('hidden')
                this.elements.resultsList.classList.add('hidden')
            }
        } catch (error) {
            console.error('Scan failed:', error)
            toast.error('Failed to search artist')
            hint.textContent = 'Search failed.'
        } finally {
            scanBtn.disabled = false
            scanBtn.textContent = 'Scan'
        }
    }

    toggleFilter(type) {
        this.filterState[type] = !this.filterState[type]
        this.updateFilterUI()
        this.applyFilters()
    }

    updateFilterUI() {
        Object.entries(this.elements.filterButtons).forEach(([type, btn]) => {
            const active = this.filterState[type]
            if (active) {
                btn.className = 'filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold'
            } else {
                btn.className = 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5'
            }
        })
    }

    applyFilters() {
        if (!this.searchResults) return

        const filtered = this.searchResults.filter(album => {
            const title = (album.title || '').toLowerCase()
            const isSingle = album.isSingle || album.albumType === 'Single'
            const isLive = album.isLive || title.includes('(live') || title.includes('[live')
            const isCompilation = album.isCompilation || title.includes('greatest hits') || title.includes('best of')
            const isEP = album.albumType === 'EP'
            const isStudioAlbum = !isSingle && !isLive && !isCompilation && !isEP

            if (isStudioAlbum && this.filterState.albums) return true
            if ((isSingle || isEP) && this.filterState.singles) return true
            if (isLive && this.filterState.live) return true
            if (isCompilation && this.filterState.compilations) return true
            return false
        })

        this.renderResults(filtered)
    }

    renderResults(results) {
        const list = this.elements.resultsList
        list.innerHTML = '' // Safe because we build children with SafeDOM below

        if (results.length === 0) {
            list.appendChild(SafeDOM.p({ className: 'text-gray-500 text-sm italic py-2' }, 'No matches for filters'))
            return
        }

        const fragment = document.createDocumentFragment()
        results.forEach(album => {
            const coverUrl = album.coverUrl?.replace('{w}', '50').replace('{h}', '50') || '/assets/images/cover_placeholder.png'

            const img = SafeDOM.img({
                src: coverUrl,
                className: 'w-10 h-10 rounded object-cover',
                alt: album.title
            })

            const info = SafeDOM.div({ className: 'flex-1 min-w-0' }, [
                SafeDOM.div({ className: 'text-sm font-medium truncate' }, album.title),
                SafeDOM.div({ className: 'text-xs text-gray-400' }, album.year || '')
            ])

            const addBtn = SafeDOM.button({
                type: 'button',
                className: 'btn btn-ghost btn-sm text-green-400 hover:text-green-300',
                onClick: (e) => {
                    e.stopPropagation()
                    this.onAlbumSelected(album)
                }
            }, '+')

            const row = SafeDOM.div({
                className: 'album-result flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors',
                onClick: () => this.onAlbumSelected(album)
            }, [img, info, addBtn])

            fragment.appendChild(row)
        })
        list.appendChild(fragment)
    }
}
