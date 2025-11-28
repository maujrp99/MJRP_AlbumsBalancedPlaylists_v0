import { BaseView } from './BaseView.js'
import { seriesStore } from '../stores/series.js'
import { router } from '../router.js'
import { getIcon } from '../components/Icons.js'

/**
 * HomeView
 * Landing page with series creation and recent series list
 */

export class HomeView extends BaseView {
  async render(params) {
    const recentSeries = seriesStore.getSeries()

    return `
      <div class="home-view container">
        <!-- Hero Banner -->
        <section class="hero-banner relative rounded-3xl overflow-hidden mb-8 fade-in min-h-[320px] md:min-h-[400px] flex items-center shadow-2xl border border-white/10 group w-full">
          <!-- Background Image -->
          <div class="absolute inset-0 z-0 bg-black">
            <img src="/assets/images/hero_bg.svg" alt="Hero Background" class="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
          </div>

          <!-- Content -->
          <div class="relative z-10 pt-2 px-8 pb-8 md:pt-4 md:px-12 md:pb-12 flex flex-col items-start gap-4 max-w-3xl">
            <!-- Logo & Title Row -->
            <div class="flex items-center gap-4 mb-2">
              <div class="logo-icon w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm border border-white/10 shrink-0">
                 ${getIcon('MJRPLogo', 'w-8 h-8 md:w-10 md:h-10')}
              </div>
              <h1 class="text-2xl md:text-4xl font-syne font-extrabold text-white leading-tight tracking-wide md:whitespace-nowrap">
                The Album Playlist Synthesizer
              </h1>
            </div>
            
            <p class="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-2xl border-l-4 border-orange-500/50 pl-4">
              Create balanced playlists from critically acclaimed albums, mixing their ranked tracks
            </p>
          </div>
        </section>

        <section class="create-series glass-panel fade-in p-8 md:p-12" style="animation-delay: 0.1s">
          <h2 class="text-center text-2xl md:text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Start Creating your New Series of Playlists</h2>
          
          <form id="seriesForm" class="series-form">
            <div id="formError" class="alert alert-warning" style="display: none;"></div>

            <div class="form-group mb-8">
              <label for="seriesName" class="block mb-3 text-sm font-bold tracking-wide text-gray-300 uppercase">Playlists Series Name</label>
              <input 
                type="text" 
                id="seriesName" 
                class="form-control"
                placeholder="e.g., Classic Rock Collection"
                autocomplete="off"
              />
            </div>

            <div class="form-group mb-8">
              <label for="albumList" class="block mb-3 text-sm font-bold tracking-wide text-gray-300 uppercase">
                Albums 
                <span class="text-muted text-xs ml-2 font-normal normal-case opacity-60"> (Minimum 2 albums required, one per line. Format: Artist - Album)</span>
              </label>
              <textarea 
                id="albumList" 
                class="form-control mono"
                rows="6" 
                placeholder="The Rolling Stones - Let It Bleed&#10;Pink Floyd - The Wall&#10;Jimi Hendrix - Electric Ladyland"
              ></textarea>
            </div>

            <div class="form-group mb-8">
              <label for="seriesNotes" class="block mb-3 text-sm font-bold tracking-wide text-gray-300 uppercase">Notes (Optional)</label>
              <textarea 
                id="seriesNotes" 
                class="form-control"
                placeholder="Add some context about this series..."
                rows="2"
              ></textarea>
            </div>

            <div class="form-actions flex flex-col items-center">
              <p class="form-helper-text text-center mb-6 text-sm text-gray-400 max-w-lg">Create your series of playlists by loading the albums, viewing their tracks' ranking, then generating the playlists.</p>
              <button type="submit" id="createSeriesBtn" class="btn btn-primary btn-large px-12 py-4 text-lg">
                ${getIcon('Rocket', 'w-6 h-6')}
                Load Albums
              </button>
            </div>
          </form>

        </section>

        <section class="recent-series mt-12 fade-in" style="animation-delay: 0.2s">
          <h2 class="text-center text-2xl md:text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Recent Series</h2>
          <div class="series-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.renderRecentSeries(recentSeries)}
          </div>
        </section>
      </div>
    `
  }

  renderRecentSeries(series) {
    if (series.length === 0) {
      return `
        <div class="empty-state text-center p-8 glass-panel">
          <div class="text-brand-orange mb-4 flex justify-center opacity-50">
            ${getIcon('FileText', 'w-16 h-16')}
          </div>
          <p class="text-lg font-semibold">No series created yet</p>
          <p class="text-muted text-sm">Create your first series above to get started!</p>
        </div>
      `
    }

    return series.slice(0, 6).map(s => `
      <div class="series-card glass-panel group hover:scale-[1.02] transition-all duration-300" data-series-id="${s.id}">
        <div class="series-card-header flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold truncate pr-2"><span class="text-muted font-normal text-sm uppercase tracking-wide mr-1">Series:</span> ${this.escapeHtml(s.name)}</h3>
          <span class="badge ${s.status === 'complete' ? 'badge-success' : 'badge-warning'}">
            ${s.status.charAt(0).toUpperCase() + s.status.slice(1)}
          </span>
        </div>
        
        <div class="series-meta flex gap-4 mb-4 text-sm text-muted">
          <span class="flex items-center gap-1">
            ${getIcon('Music', 'w-4 h-4')}
            ${s.albumQueries?.length || 0} albums
          </span>
          <span class="flex items-center gap-1">
            ${getIcon('History', 'w-4 h-4')}
            ${this.formatTimestamp(s.updatedAt)}
          </span>
        </div>
        
        ${s.notes ? `<p class="series-notes text-sm text-muted mb-4 line-clamp-2">${this.escapeHtml(s.notes)}</p>` : ''}
        
        <div class="series-actions pt-4 border-t border-white/5">
          <button 
            class="btn btn-secondary btn-sm w-full justify-center group-hover:bg-white/10 transition-colors" 
            data-action="resume" 
            data-id="${s.id}">
            Continue ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180')}
          </button>
        </div>
      </div>
    `).join('')
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  async mount(params) {
    this.container = document.getElementById('app')

    // Subscribe to series store for updates
    const unsubscribe = seriesStore.subscribe((state) => {
      this.updateRecentSeries(state.series)
    })
    this.subscriptions.push(unsubscribe)

    // Setup create series form
    const form = this.$('#seriesForm')
    if (form) {
      this.on(form, 'submit', (e) => {
        e.preventDefault()
        this.handleCreateSeries()
      })
    }

    // Setup Enter key on inputs
    const nameInput = this.$('#seriesName')
    const albumList = this.$('#albumList')

    if (nameInput) {
      this.on(nameInput, 'keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          albumList?.focus()
        }
      })
    }

    // Event delegation for resume buttons
    this.on(this.container, 'click', (e) => {
      if (e.target.dataset.action === 'resume') {
        const seriesId = e.target.dataset.id
        this.handleResumeSeries(seriesId)
      }
    })
  }

  async handleCreateSeries() {
    const name = this.$('#seriesName')?.value.trim()
    const albumListText = this.$('#albumList')?.value.trim()
    const notes = this.$('#seriesNotes')?.value.trim()

    if (!name) {
      this.showErrorMessage('⚠️ Please enter a series name')
      this.$('#seriesName')?.focus()
      return
    }

    if (!albumListText) {
      this.showErrorMessage('⚠️ Please enter at least 2 albums (one per line)')
      this.$('#albumList')?.focus()
      return
    }

    const albumQueries = albumListText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (albumQueries.length < 2) {
      this.showErrorMessage('⚠️ Minimum 2 albums required for balanced playlists.<br>Please add at least one more album.')
      this.$('#albumList')?.focus()
      return
    }

    // Clear any previous errors
    this.hideErrorMessage()

    // Create series
    const series = {
      id: `series_${Date.now()}`,
      name,
      notes,
      albumQueries,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdSeries = seriesStore.createSeries(series)
    seriesStore.setActiveSeries(createdSeries.id)

    // Navigate to albums view with seriesId
    router.navigate(`/albums?seriesId=${createdSeries.id}`)
  }

  handleResumeSeries(seriesId) {
    seriesStore.setActiveSeries(seriesId)
    router.navigate('/albums')
  }

  updateRecentSeries(series) {
    const grid = this.$('.series-grid')
    if (grid) {
      grid.innerHTML = this.renderRecentSeries(series)
    }
  }

  showErrorMessage(message) {
    const errorEl = this.$('#formError')
    if (errorEl) {
      errorEl.innerHTML = message
      errorEl.style.display = 'block'
      // Scroll to error if needed
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  hideErrorMessage() {
    const errorEl = this.$('#formError')
    if (errorEl) {
      errorEl.style.display = 'none'
    }
  }

  update() {
    // Update timestamp if we add one to HomeView
  }
}
