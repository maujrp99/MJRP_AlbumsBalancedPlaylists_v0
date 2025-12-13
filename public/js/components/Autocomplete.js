import { getIcon } from './Icons.js'

/**
 * Autocomplete Component
 * Provides a search input with dropdown results
 */
export class Autocomplete {
    constructor(options = {}) {
        this.placeholder = options.placeholder || 'Search...'
        this.onSelect = options.onSelect || (() => { })
        this.loader = options.loader
        this.minChars = 2

        this.element = null
        this.input = null
        this.resultsList = null
        this.debounceTimer = null
    }

    render() {
        // Create container
        this.element = document.createElement('div')
        this.element.className = 'autocomplete-container relative w-full z-20'

        this.element.innerHTML = `
      <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
          ${getIcon('Search', 'w-5 h-5')}
        </div>
        <input 
          type="text" 
          class="form-control pl-10 w-full bg-white/5 border-white/10 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all rounded-xl py-3 text-white placeholder-gray-500" 
          placeholder="${this.placeholder}"
          autocomplete="off"
        >
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span class="loader-spinner hidden w-5 h-5 border-2 border-white/20 border-t-accent-primary rounded-full animate-spin"></span>
        </div>
      </div>
      
      <div class="results-dropdown hidden absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar z-50">
        <!-- Results injected here -->
      </div>
    `

        this.input = this.element.querySelector('input')
        this.resultsList = this.element.querySelector('.results-dropdown')
        this.spinner = this.element.querySelector('.loader-spinner')

        this.attachEvents()
        return this.element
    }

    attachEvents() {
        this.input.addEventListener('input', (e) => {
            const query = e.target.value
            clearTimeout(this.debounceTimer)

            if (query.length < this.minChars) {
                this.hideResults()
                return
            }

            this.spinner.classList.remove('hidden')
            this.debounceTimer = setTimeout(() => this.performSearch(query), 300)
        })

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.hideResults()
            }
        })

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideResults()
        })
    }

    async performSearch(query) {
        try {
            const results = await this.loader.search(query, 50) // Increased from 10 to show more options
            this.renderResults(results)
        } finally {
            this.spinner.classList.add('hidden')
        }
    }

    renderResults(results) {
        if (results.length === 0) {
            this.resultsList.innerHTML = `
        <div class="p-4 text-center text-gray-500 text-sm">
          No albums found. Keep typing or add manually below.
        </div>
      `
        } else {
            this.resultsList.innerHTML = results.map((item, index) => {
                // Use loader's getArtworkUrl for dynamic sizing (100px for thumbnails)
                const coverUrl = this.loader?.getArtworkUrl
                    ? this.loader.getArtworkUrl(item, 100)
                    : (item.artworkTemplate?.replace('{w}', 100).replace('{h}', 100) || item.coverUrl)

                return `
        <div class="result-item p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors" data-index="${index}">
          <div class="w-10 h-10 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
            ${coverUrl
                        ? `<img src="${coverUrl}" alt="" class="w-full h-full object-cover" loading="lazy" />`
                        : `<div class="w-full h-full flex items-center justify-center text-gray-600">${getIcon('Music', 'w-5 h-5')}</div>`
                    }
          </div>
          <div class="flex flex-col flex-1 min-w-0">
            <span class="text-white font-medium truncate">${item.album}</span>
            <span class="text-xs text-accent-primary truncate">${item.artist} <span class="text-gray-500">• ${item.year}</span></span>
          </div>
          <div class="text-white/20 flex-shrink-0">
            ${getIcon('Plus', 'w-4 h-4')}
          </div>
        </div>
      `}).join('')

            // Attach click events to items
            this.resultsList.querySelectorAll('.result-item').forEach((el, index) => {
                el.addEventListener('click', () => {
                    this.selectItem(results[index])
                })
            })
        }

        this.showResults()
    }

    selectItem(item) {
        this.input.value = '' // Clear input
        this.hideResults()
        this.onSelect(item)
    }

    showResults() {
        this.resultsList.classList.remove('hidden')
    }

    hideResults() {
        this.resultsList.classList.add('hidden')
    }
}
