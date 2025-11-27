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
          <h1>🎵 MJRP Playlist Generator</h1>
          <p class="tagline">Curate multi-album playlists with AI-powered acclaim rankings</p>
        </header>

        <section class="series-form card">
          <h2>Create New Series</h2>
          
          <div class="form-group">
            <label for="seriesName">Series Name</label>
            <input 
              type="text" 
              id="seriesName" 
              placeholder="e.g., Classic Rock Collection"
              class="form-control"
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label for="albumList">Albums (one per line)</label>
            <textarea 
              id="albumList" 
              rows="8" 
              placeholder="Pink Floyd - The Wall&#10;Led Zeppelin - IV&#10;The Beatles - Abbey Road&#10;Queen - A Night at the Opera"
              class="form-control mono"
            ></textarea>
            <small class="form-hint">Format: Artist - Album Title (or just Album Title)</small>
          </div>

          <div class="form-group">
            <label for="seriesNotes">Notes (optional)</label>
            <input 
              type="text" 
              id="seriesNotes" 
              placeholder="e.g., For road trip playlist"
              class="form-control"
            />
          </div>

          <button id="createSeriesBtn" class="btn btn-primary btn-large">
            <span class="btn-icon">🚀</span>
            Generate Rankings
          </button>
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

    // Setup create series button
    const createBtn = this.$('#createSeriesBtn')
    if (createBtn) {
      this.on(createBtn, 'click', () => this.handleCreateSeries())
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
      alert('⚠️ Please enter a series name')
      this.$('#seriesName')?.focus()
      return
    }

    if (!albumListText) {
      alert('⚠️ Please enter at least one album')
      this.$('#albumList')?.focus()
      return
    }

    const albumQueries = albumListText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (albumQueries.length === 0) {
      alert('⚠️ Please enter at least one album')
      return
    }

    // Create series in store
    const series = seriesStore.createSeries({
      name,
      albumQueries,
      notes: notes || ''
    })

    // Set as active series
    seriesStore.setActiveSeries(series.id)

    // Navigate to albums view to start loading
    router.navigate('/albums')
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
}
