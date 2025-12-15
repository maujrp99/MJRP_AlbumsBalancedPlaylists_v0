import { BaseView } from './BaseView.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { router } from '../router.js'
import { getIcon } from '../components/Icons.js'
import { db } from '../app.js'
import { CacheManager } from '../cache/CacheManager.js'
import { MigrationUtility } from '../migration/MigrationUtility.js'
import { Autocomplete } from '../components/Autocomplete.js'
import { optimizedAlbumLoader as albumLoader } from '../services/OptimizedAlbumLoader.js'
import toast from '../components/Toast.js'

/**
 * HomeView
 * Landing page with series creation and recent series list
 */

export class HomeView extends BaseView {
  constructor() {
    super()
    this.migrationUtility = new MigrationUtility(db, new CacheManager())
    this.showMigrationBanner = false
    this.selectedAlbums = [] // Visual Staging Area
    this.isBulkMode = false  // Toggle between visual/text
  }

  async render(params) {
    const recentSeries = albumSeriesStore.getSeries()
    this.showMigrationBanner = !this.migrationUtility.isMigrationComplete() && this.migrationUtility.hasLocalStorageData()

    return `
      <div class="home-view container max-w-7xl mx-auto px-4">
        ${this.showMigrationBanner ? this.renderMigrationBanner() : ''}

        <!-- Hero Banner -->
        <section class="hero-banner relative rounded-3xl overflow-hidden mb-12 fade-in min-h-[320px] md:min-h-[400px] flex items-center shadow-2xl border border-white/10 group w-full">
          <!-- Background Image -->
          <div class="absolute inset-0 z-0 bg-black">
            <img src="/assets/images/hero_bg.svg" alt="Hero Background" class="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
          </div>

          <!-- Content -->
          <div class="relative z-10 pt-2 px-8 pb-8 md:pt-4 md:px-12 md:pb-12 flex flex-col items-start gap-4 max-w-3xl">
            <!-- Logo & Title Row -->
            <div class="flex items-center gap-4 mb-2">
              <div class="logo-icon w-24 h-24 md:w-28 md:h-28 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img src="/assets/images/newMJRPlogo.png" alt="MJRP Logo" class="w-full h-full object-contain">
              </div>
              <h1 class="text-2xl md:text-4xl font-syne font-extrabold text-white leading-tight tracking-wide md:whitespace-nowrap">
                The Album Playlist Synthesizer
              </h1>
              <img 
                src="/assets/images/newMJRPlogorealistic.png?v=${Date.now()}" 
                alt="MJRP Logo" 
                class="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0"
              />
            </div>
            
            <p class="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-2xl border-l-4 border-orange-500/50 pl-4 mb-6">
              Create balanced playlists from critically acclaimed albums, mixing their ranked tracks
            </p>

            <button id="goToInventoryBtn" class="btn btn-secondary flex items-center gap-2">
              ${getIcon('Archive', 'w-5 h-5')}
              Manage Inventory
            </button>
          </div>
        </section>

        <!-- 2. Main Interface -->
        <form id="seriesForm" class="tech-interface space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div id="formError" class="alert alert-warning" style="display: none;"></div>

            <!-- Row 1: Series Name -->
            <div class="tech-panel tech-green-accent">
                <div class="tech-header-bar">
                    <span class="tech-title">01 // Series Configuration</span>
                </div>
                <div class="p-6 bg-black/40">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Series Name</label>
                    <input 
                        type="text" 
                        id="seriesName" 
                        class="tech-input w-full p-4 rounded text-xl"
                        placeholder="e.g., 'Summer Vibes 2024'"
                        autocomplete="off"
                    />
                </div>
            </div>

            <!-- Row 2: Operation Deck (Artist | Search) -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
                
                <!-- Toggle Mode -->
                <button type="button" id="toggleBulkModeBtn" class="absolute -top-8 right-0 text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest">
                  ${getIcon('FileText', 'w-3 h-3')}
                  Switch to Bulk Mode
                </button>

                <!-- Left: Artist Filter -->
                <div id="artistPanel" class="col-span-12 md:col-span-4 tech-panel tech-green-accent h-fit">
                    <div class="tech-header-bar">
                        <span class="tech-title">02a // Artist Filter</span>
                        ${getIcon('User', 'w-4 h-4 text-tech-green opacity-50')}
                    </div>
                    <div class="p-4 tech-grid-bg min-h-[150px] flex flex-col gap-4">
                        <div class="relative">
                            <input 
                                type="text" 
                                id="artistFilterInput"
                                class="tech-input w-full p-3 rounded pl-10 neon-border-green focus:border-green-400"
                                placeholder="Type Artist Name..."
                                autocomplete="off"
                            >
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tech-green">
                                ${getIcon('Search', 'w-4 h-4')}
                            </div>
                            <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <button type="button" id="clearArtistBtn" class="text-gray-500 hover:text-white hidden p-1">
                                    ${getIcon('X', 'w-3 h-3')}
                                </button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 leading-relaxed">
                            Filtering by artist unlocks the verified discography grid.
                        </p>
                    </div>
                </div>

                <!-- Right: Album Selector (Swappable) -->
                <div id="selectionPanel" class="col-span-12 md:col-span-8 tech-panel tech-orange-accent">
                    <div class="tech-header-bar">
                        <span class="tech-title" id="selectionTitle">02b // Select Album</span>
                    </div>
                    
                    <div class="p-4 bg-black/20 min-h-[300px] relative">
                         <!-- A. Global Search (Default) -->
                         <div id="autocompleteWrapper" class="transition-opacity duration-300">
                             <!-- Autocomplete injects here -->
                         </div>

                         <!-- B. Artist Results Grid (Overlay/Replacement) -->
                         <div id="artistResultsContainer" class="hidden absolute inset-0 z-10 bg-black/90 p-4 overflow-y-auto custom-scrollbar">
                             <div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <span class="text-tech-green font-bold tracking-wide">DISCOGRAPHY SCAN</span>
                                <button type="button" id="closeArtistResultsBtn" class="text-xs text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
                                    Close View ${getIcon('X', 'w-3 h-3')}
                                </button>
                             </div>
                             <div id="artistResultsGrid" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 <!-- Dynamic Items -->
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Row 3: Staging Area -->
            <div class="tech-panel tech-orange-accent">
                <div class="tech-header-bar">
                    <span class="tech-title">03 // Staging Area</span>
                    <span class="text-accent-primary font-mono text-sm count-badge hidden">(0)</span>
                </div>
                <div id="stagingGrid" class="p-6 grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 min-h-[140px] tech-grid-bg">
                    <!-- Dynamic Staging Area -->
                    <div class="col-span-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        ${getIcon('Layers', 'w-12 h-12 mb-2')}
                        <p class="font-mono text-xs uppercase tracking-widest">Awaiting Selection</p>
                    </div>
                </div>
            </div>

            <!-- Notes (Hidden in collapsed toggle or simpler) -->
            <div class="tech-panel">
                <div class="p-4 bg-black/40">
                     <input type="text" id="seriesNotes" class="bg-transparent border-none w-full text-sm text-gray-400 focus:text-white focus:outline-none" placeholder="> Add optional mission notes...">
                </div>
            </div>

            <!-- Action -->
            <div class="flex justify-center pt-4">
                <button type="submit" id="createSeriesBtn" class="tech-btn-primary px-8 py-4 text-base rounded-2xl w-full md:w-auto md:max-w-sm">
                    Initialize Load Sequence ${getIcon('ArrowRight', 'ml-2 w-4 h-4 inline-block')}
                </button>
            </div>

            <!-- Bulk Mode Fallback (Hidden) -->
            <div id="bulkModeContainer" class="hidden tech-panel p-6">
                <textarea id="albumList" class="form-control mono text-sm h-64" placeholder="Artist - Album"></textarea>
            </div>
        </form>

        <!-- Footer / Recent -->
        <section class="mt-20 border-t border-white/5 pt-12 opacity-50 hover:opacity-100 transition-opacity">
           <h3 class="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6 text-center">Recent Operations</h3>
           <div class="series-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                ${this.renderRecentSeries(recentSeries)}
           </div>
        </section>

      </div>
    `
  }

  renderMigrationBanner() {
    return `
      <div class="migration-banner glass-panel px-8 py-3 mb-8 mx-auto max-w-fit flex flex-col md:flex-row items-center justify-center gap-6 border border-accent-primary/30 rounded-full relative overflow-hidden group shadow-[0_0_20px_rgba(255,136,0,0.15)] hover:border-accent-primary/60 transition-colors">
        <!-- Subtle Glow -->
        <div class="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/5 opacity-30"></div>
        
        <div class="relative z-10 flex items-center gap-3">
          <div class="text-accent-primary shrink-0 animate-pulse">
            ${getIcon('Database', 'w-5 h-5')}
          </div>
          <div class="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-center md:text-left">
            <h3 class="text-sm font-bold text-white whitespace-nowrap">Data Migration Available</h3>
            <span class="hidden md:inline text-white/20">|</span>
            <p class="text-gray-400 text-xs md:text-sm">Old data detected. Update database to keep history.</p>
          </div>
        </div>

        <button id="startMigrationBtn" class="btn btn-primary btn-sm relative z-10 whitespace-nowrap rounded-full px-6 text-xs shadow-lg hover:scale-105 transition-transform">
          Migrate Now
          ${getIcon('ArrowRight', 'w-3 h-3 ml-1')}
        </button>
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
          ${s.status === 'complete' ? '<span class="badge badge-success">Complete</span>' : ''}
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
    const unsubscribe = albumSeriesStore.subscribe((state) => {
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

    // Migration Button
    const migrationBtn = this.$('#startMigrationBtn')
    if (migrationBtn) {
      this.on(migrationBtn, 'click', () => this.handleMigration())
    }

    // Inventory Button
    const inventoryBtn = this.$('#goToInventoryBtn')
    if (inventoryBtn) {
      this.on(inventoryBtn, 'click', () => router.navigate('/inventory'))
    }

    // Initialize Autocomplete
    this.initAutocomplete()

    // Mode Toggle
    const toggleBtn = this.$('#toggleBulkModeBtn')
    if (toggleBtn) {
      this.on(toggleBtn, 'click', () => this.toggleBulkMode())
    }

    // Artist Filter Logic
    const artistInput = this.$('#artistFilterInput')

    if (artistInput) {
      let debounceTimer;
      this.on(artistInput, 'input', (e) => {
        const query = e.target.value.trim()
        clearTimeout(debounceTimer)

        if (query.length > 2) {
          debounceTimer = setTimeout(() => this.searchArtists(query), 500)
        } else {
          this.closeArtistResults()
        }
      })
    }

    // Close Artist Results
    const closeArtistBtn = this.$('#closeArtistResultsBtn')
    if (closeArtistBtn) {
      this.on(closeArtistBtn, 'click', () => this.closeArtistResults())
    }

    // Artist Grid Delegation
    const artistResultsGrid = this.$('#artistResultsGrid')
    if (artistResultsGrid) {
      this.on(artistResultsGrid, 'click', (e) => {
        const card = e.target.closest('.artist-album-card')
        if (card) {
          // Parse data from card
          const albumData = JSON.parse(decodeURIComponent(card.dataset.json))
          this.toggleAlbumSelection(albumData, card)
        }
      })
    }

    // Staging Grid Delegation (Remove buttons)
    const stagingGrid = this.$('#stagingGrid')
    if (stagingGrid) {
      this.on(stagingGrid, 'click', (e) => {
        const removeBtn = e.target.closest('.remove-album-btn')
        if (removeBtn) {
          const index = parseInt(removeBtn.dataset.index)
          this.removeAlbum(index)
        }
      })
    }
  }

  toggleBulkMode() {
    this.isBulkMode = !this.isBulkMode
    const visualContainer = this.$('#visualModeContainer')
    const bulkContainer = this.$('#bulkModeContainer')
    const toggleBtnText = this.$('#toggleBulkModeBtn .mode-text')

    if (this.isBulkMode) {
      visualContainer.classList.add('hidden')
      bulkContainer.classList.remove('hidden')
      if (toggleBtnText) toggleBtnText.textContent = 'Switch to Visual Search'

      // SYNC: Visual -> Text
      const textarea = this.$('#albumList')
      if (textarea && this.selectedAlbums.length > 0) {
        const textContent = this.selectedAlbums.map(a => `${a.artist} - ${a.album}`).join('\n')
        // Append or Replace? Let's append to be safe if user typed something
        if (textarea.value.trim().length > 0 && !textarea.value.endsWith('\n')) {
          textarea.value += '\n'
        }
        textarea.value += textContent
      }

    } else {
      bulkContainer.classList.add('hidden')
      visualContainer.classList.remove('hidden')
      if (toggleBtnText) toggleBtnText.textContent = 'Switch to Bulk Paste'
      // We do NOT sync Text -> Visual automatically as parsing covers is hard without fetching
    }
  }

  async searchArtists(artistName) {
    // 1. Show Container
    const container = this.$('#artistResultsContainer')
    const wrapper = this.$('#autocompleteWrapper')
    const grid = this.$('#artistResultsGrid')

    if (!container || !grid) return

    container.classList.remove('hidden')
    wrapper.classList.add('opacity-50', 'pointer-events-none') // Dim background

    // 2. Fetch
    grid.innerHTML = `<div class="col-span-full text-center py-8 text-accent-secondary animate-pulse">Searching discography for "${artistName}"...</div>`

    try {
      const results = await albumLoader.findByArtist(artistName)

      if (results.length === 0) {
        grid.innerHTML = `
                  <div class="col-span-full text-center py-8 text-gray-500">
                      <p>No albums found for "${artistName}"</p>
                      <button class="btn btn-sm btn-ghost mt-2" id="useManualSearch">Try Manual Search</button>
                  </div>
              `
        return
      }

      // 3. Render
      grid.innerHTML = results.map(album => {
        const isSelected = this.selectedAlbums.some(a => a.id === album.id)
        const coverUrl = albumLoader.getArtworkUrl(album, 200)
        const json = encodeURIComponent(JSON.stringify(album))

        return `
                <div class="artist-album-card cursor-pointer group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-orange-500 shadow-[0_0_15px_rgba(255,85,0,0.5)]' : 'border-transparent hover:border-white/20'}" data-json="${json}" data-id="${album.id}">
                    <img src="${coverUrl}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all ${isSelected ? 'opacity-100 scale-105' : ''}">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-2 flex flex-col justify-end">
                        <p class="text-white text-xs font-bold truncate">${album.album}</p>
                        <p class="text-gray-400 text-[10px]">${album.year}</p>
                    </div>

                    ${isSelected ? `
                        <div class="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                            ${getIcon('Check', 'w-3 h-3')}
                        </div>
                    ` : ''}
                </div>
              `
      }).join('')

    } catch (err) {
      console.error(err)
      grid.innerHTML = `<div class="col-span-full text-center text-red-400">Error loading albums</div>`
    }
  }

  closeArtistResults() {
    const container = this.$('#artistResultsContainer')
    const wrapper = this.$('#autocompleteWrapper')
    if (container) container.classList.add('hidden')
    if (wrapper) wrapper.classList.remove('opacity-50', 'pointer-events-none')
  }

  toggleAlbumSelection(album, cardEl) {
    const index = this.selectedAlbums.findIndex(a => a.id === album.id)

    if (index >= 0) {
      // Remove
      this.removeAlbum(index)
      // Update Card UI locally without re-render entire grid
      if (cardEl) {
        cardEl.classList.remove('border-orange-500', 'shadow-[0_0_15px_rgba(255,85,0,0.5)]')
        cardEl.classList.add('border-transparent')
        const check = cardEl.querySelector('.bg-orange-500')
        if (check) check.remove()
      }
    } else {
      // Add
      this.handleAlbumSelect(album)
      // Update Card UI
      if (cardEl) {
        cardEl.classList.add('border-orange-500', 'shadow-[0_0_15px_rgba(255,85,0,0.5)]')
        cardEl.classList.remove('border-transparent')
        // Add checkmark if not exists
        if (!cardEl.querySelector('.bg-orange-500')) {
          cardEl.innerHTML += `
                    <div class="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                        ${getIcon('Check', 'w-3 h-3')}
                    </div>
                 `
        }
      }
    }
  }

  async initAutocomplete() {
    const wrapper = this.$('#autocompleteWrapper')

    if (wrapper) {
      // Start loading data
      albumLoader.load().catch(console.error)

      const autocomplete = new Autocomplete({
        placeholder: 'Or search for any album directly...',
        loader: {
          search: async (q, limit) => {
            // Standard global search
            return albumLoader.search(q, limit)
          },
          getArtworkUrl: (item, size) => albumLoader.getArtworkUrl(item, size)
        },
        onSelect: (item) => this.handleAlbumSelect(item)
      })

      wrapper.appendChild(autocomplete.render())
    }
  }

  handleAlbumSelect(item) {
    // 1. Add to state
    this.selectedAlbums.push(item)

    // 2. Render Grid
    this.renderStagingGrid()

    // 3. Update counter
    this.updateCountBadge()

    // 4. Feedback
    // Optional: scroll to grid if needed
  }

  removeAlbum(index) {
    this.selectedAlbums.splice(index, 1)
    this.renderStagingGrid()
    this.updateCountBadge()
  }

  updateCountBadge() {
    const badge = this.$('.count-badge')
    if (badge) {
      badge.textContent = `(${this.selectedAlbums.length})`
      badge.classList.toggle('hidden', this.selectedAlbums.length === 0)
    }
  }

  renderStagingGrid() {
    const grid = this.$('#stagingGrid')
    if (!grid) return

    if (this.selectedAlbums.length === 0) {
      grid.innerHTML = `
             <div class="col-span-full flex flex-col items-center justify-center text-gray-500 py-8 opacity-60">
                ${getIcon('Search', 'w-10 h-10 mb-2')}
                <p>Search and select albums above</p>
             </div>
          `
      return
    }

    grid.innerHTML = this.selectedAlbums.map((album, index) => {
      const coverUrl = albumLoader.getArtworkUrl(album, 300)

      return `
            <div class="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-white/10 shadow-lg animate-in zoom-in duration-300">
                <img src="${coverUrl}" alt="${album.album}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <p class="text-white font-bold text-sm truncate shadow-black drop-shadow-md">${album.album}</p>
                    <p class="text-gray-300 text-xs truncate shadow-black drop-shadow-md">${album.artist}</p>
                </div>

                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="remove-album-btn bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-110" data-index="${index}" title="Remove">
                        ${getIcon('X', 'w-4 h-4')}
                    </button>
                </div>
            </div>
          `
    }).join('')
  }

  async handleMigration() {
    if (!confirm('Start migration? This will move your local data to the new database structure.')) return

    const btn = this.$('#startMigrationBtn')
    const originalText = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin mr-2')} Migrating...`

    try {
      const result = await this.migrationUtility.migrate('user-id', (current, total, message) => {
        // Optional: Update a progress bar or status text
        console.log(`[Migration] ${Math.round(current)}%: ${message}`)
        btn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin mr-2')} ${Math.round(current)}%`
      })

      if (result.success) {
        toast.success(`Migration Complete! Migrated: ${result.seriesMigrated} series, ${result.albumsMigrated} albums.`)
        // Reload to refresh stores
        window.location.reload()
      } else {
        toast.warning('Migration finished with errors. Check console for details.')
        console.error('Migration errors:', result.errors)
      }
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Migration failed: ' + error.message)
    } finally {
      btn.disabled = false
      btn.innerHTML = originalText
    }
  }

  async handleCreateSeries() {
    const name = this.$('#seriesName')?.value.trim()
    const notes = this.$('#seriesNotes')?.value.trim()
    const albumListText = this.$('#albumList')?.value.trim()

    let albumQueries = []

    if (this.isBulkMode) {
      // Bulk Mode: Parse Textarea
      if (!albumListText) {
        this.showErrorMessage('⚠️ Please enter at least 2 albums (one per line)')
        this.$('#albumList')?.focus()
        return
      }
      albumQueries = albumListText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

    } else {
      // Visual Mode: Use State
      if (this.selectedAlbums.length < 2) {
        this.showErrorMessage('⚠️ Please select at least 2 albums')
        return
      }
      albumQueries = this.selectedAlbums.map(a => `${a.artist} - ${a.album}`)
    }

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

    try {
      // FIX: Await the async creation (Firestore + LocalStorage)
      const createdSeries = await albumSeriesStore.createSeries(series)

      // Navigate to albums view with seriesId
      router.navigate(`/albums?seriesId=${createdSeries.id}`)
    } catch (error) {
      console.error('Failed to create series:', error)
      this.showErrorMessage('Failed to create series. Please try again.')
    }
  }

  handleResumeSeries(seriesId) {
    albumSeriesStore.setActiveSeries(seriesId)
    router.navigate(`/albums?seriesId=${seriesId}`)
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
