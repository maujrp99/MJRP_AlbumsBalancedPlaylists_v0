import { BaseView } from './BaseView.js'
import { seriesStore } from '../stores/series.js'
import { router } from '../router.js'

/**
 * HomeView
 * Landing page with series creation and recent series list
 */

export class HomeView extends BaseView {
  async render(params) {
    const recentSeries = seriesStore.getSeries()

    return `
      <div class="home-view">
        <header class="hero">
          <h1>🎵 MJRP Playlist Generator v2.0</h1>
          <p class="hero-subtitle">Create balanced playlists from critically acclaimed albums</p>
        </header>

        <section class="create-series">
          <h2>Create New Series</h2>
          
          <form id="seriesForm" class="series-form">
            <div id="formError" class="alert alert-warning" style="display: none;"></div>

            <div class="form-group">
              <label for="seriesName">Series Name</label>
              <input 
                type="text" 
                id="seriesName" 
                class="form-control"
                placeholder="e.g., Classic Rock Collection"
                autocomplete="off"
              />
            </div>

            <div class="form-group">
              <label for="albumList">
                Albums (one per line)
                <span class="form-hint">Minimum 2 albums required. Format: Artist - Album</span>
              </label>
              <textarea 
                id="albumList" 
                class="form-control mono"
                rows="6" 
                placeholder="The Rolling Stones - Let It Bleed&#10;Pink Floyd - The Wall&#10;Jimi Hendrix - Electric Ladyland"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="seriesNotes">Notes (Optional)</label>
              <textarea 
                id="seriesNotes" 
                class="form-control"
                placeholder="Add some context about this series..."
                rows="2"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" id="createSeriesBtn" class="btn btn-primary btn-large" style="width: 100%;">
                <span class="btn-icon">🚀</span>
                Generate Rankings
              </button>
            </div>
          </form>

          <div style="margin-top: 2rem; text-align: center; border-top: 1px solid #333; padding-top: 1rem;">
            <p style="color: #808080; font-size: 0.9rem; margin-bottom: 0.5rem;">Troubleshooting Tools</p>
            <button type="button" class="btn btn-secondary btn-sm" id="clearCacheBtn">
              🗑️ Clear Cache & Reset
            </button>
          </div>
        </section>

        <section class="recent-series">
          <h2>Recent Series</h2>
          <div class="series-grid">
            ${this.renderRecentSeries(recentSeries)}
          </div>
        </section>
      </div>
    `
  }

  renderRecentSeries(series) {
    if (series.length === 0) {
      return `
        <div class="empty-state">
          <p class="empty-icon">📝</p>
          <p class="empty-text">No series created yet</p>
          <p class="empty-hint">Create your first series above to get started!</p>
        </div>
      `
    }

    return series.slice(0, 6).map(s => `
      <div class="series-card" data-series-id="${s.id}">
        <div class="series-card-header">
          <h3>${this.escapeHtml(s.name)}</h3>
          <span class="series-status ${s.status}">${s.status}</span>
        </div>
        
        <div class="series-meta">
          <span class="badge">
            <span class="badge-icon">💿</span>
            ${s.albumQueries?.length || 0} albums
          </span>
          <span class="timestamp">${this.formatTimestamp(s.updatedAt)}</span>
        </div>
        
        ${s.notes ? `<p class="series-notes">${this.escapeHtml(s.notes)}</p>` : ''}
        
        <div class="series-actions">
          <button 
            class="btn btn-secondary btn-sm" 
            data-action="resume" 
            data-id="${s.id}">
            Continue →
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

    // Clear Cache button
    const clearCacheBtn = this.$('#clearCacheBtn')
    if (clearCacheBtn) {
      this.on(clearCacheBtn, 'click', () => {
        if (confirm('Clear all cached album data? This will force fresh data from the backend.')) {
          localStorage.clear()
          alert('✅ Cache cleared! Page will reload.')
          location.reload()
        }
      })
    }

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
