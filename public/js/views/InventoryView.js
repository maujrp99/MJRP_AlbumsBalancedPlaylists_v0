import { BaseView } from './BaseView.js'
import { InventoryController } from '../controllers/InventoryController.js'
import { InventoryGridRenderer } from './renderers/InventoryGridRenderer.js'
import { inventoryStore } from '../stores/inventory.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { redrawKeepingField } from '../utils/keepField.js'
import { InventoryStatus, statusCountLabel } from '../models/inventoryStatus.js'
import { SORT_OPTIONS, choiceOf } from '../models/inventorySort.js'
import { SourceState } from '../models/inventoryValue.js'
import { showDiscogsNotice } from '../components/Footer.js'
import { renderNotices, renderTotals } from './renderers/InventoryValueHeader.js'

/** The action that puts every album of the person's series in the inventory (F71). */
const ADD_SERIES_ALBUMS_ID = 'addSeriesAlbumsBtn'
const ADD_SERIES_ALBUMS_LABEL = 'Add the albums of my series'

/** The action that reads the Avg Rating and the Avg Pop of every album of the inventory (F71, S-56). */
const UPDATE_RATINGS_ID = 'updateRatingsBtn'
const UPDATE_RATINGS_LABEL = 'Update ratings'

/** The action that reads the value of every album from Discogs (F75, REQ-09). It exists only while the source is on. */
const UPDATE_VALUES_ID = 'updateValuesBtn'
const UPDATE_VALUES_LABEL = 'Update values'
const TOTALS_ID = 'inventoryTotals'
const NOTICES_ID = 'inventoryNotices'

/** The colour of each count of the header. */
const COUNT_BADGE = Object.freeze({
  [InventoryStatus.OWNED]: 'badge badge-success text-xs',
  [InventoryStatus.NOT_OWNED]: 'badge badge-neutral text-xs',
  [InventoryStatus.WISHLIST]: 'badge badge-neutral text-xs'
})

export class InventoryView extends BaseView {
  constructor() {
    super()
    this.controller = new InventoryController(this)
  }

  async mount() {
    // Subscribe to store updates
    this.subscriptions.push(inventoryStore.subscribe(() => {
      this.controller.updateStateFromStore()
      this.controller.refresh()
    }))

    await this.controller.initialize()
  }

  /** The screen was left: it hears the store no more and draws nothing more (F73, UAT-215). */
  destroy() {
    this.left = true
    // What the ask for the ratings still waits for is dropped
    this.controller.dispose()
    super.destroy()
  }

  /**
   * Render the view state
   * @param {Object} input - Route params (from Router) or State object (from Controller)
   */
  async render(input) {
    // Determine if input is state or route params
    const isUpdate = input && Array.isArray(input.filteredAlbums)
    const state = isUpdate ? input : this.controller.state

    const container = SafeDOM.div({ className: 'inventory-view container pb-20' })

    const header = SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
      SafeDOM.fromHTML(Breadcrumb.render('/inventory')),
      this.renderTitleRow(state),
      this.renderTotals(state),
      this.renderNotices(state),
      this.renderFilters(state)
    ])
    // The app says it uses the Discogs API while the Discogs values are on (components/Footer.js)
    showDiscogsNotice(state.value?.source === SourceState.ON)

    container.appendChild(header)

    // Grid Container
    const gridContainer = SafeDOM.div({ id: 'inventory-grid-container' })
    // Using fromHTML for the grid content as it comes from Renderer (string based)
    gridContainer.appendChild(SafeDOM.fromHTML(InventoryGridRenderer.render(state)))
    container.appendChild(gridContainer)

    // If called by Controller (Update), manually update DOM
    if (isUpdate) {
      const app = document.getElementById('app')
      if (app && !this.left) {
        // the field in use (the search) is handed back with its text and cursor (utils/keepField.js)
        redrawKeepingField(app, () => {
          SafeDOM.clear(app)
          app.appendChild(container)
        })
        this.attachEventListeners() // Re-attach for delegated events inside grid
      }
    }

    return container
  }

  /** "My Collection" and the counts of what the search and the format let through; each count filters by its status. */
  renderTitleRow(state) {
    const stats = state.stats || {}
    const titleRow = SafeDOM.div({ className: 'header-title-row mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between' })

    const h1 = SafeDOM.h1({ className: 'text-2xl md:text-4xl font-bold mb-0 flex items-center gap-3' })
    h1.appendChild(SafeDOM.fromHTML(getIcon('Archive', 'w-8 h-8 text-accent-primary')))
    h1.appendChild(SafeDOM.text(' My Collection'))

    const statsRow = SafeDOM.div({ className: 'stats-row flex flex-wrap items-center gap-4 text-sm md:text-lg w-full md:w-auto' })
    statsRow.appendChild(SafeDOM.span({ className: 'text-accent-primary font-semibold' }, `${stats.totalCount || 0} ${stats.totalCount === 1 ? 'album' : 'albums'}`))
    statsRow.appendChild(this.renderStatusCounts(stats, state.filters?.ownership))

    titleRow.appendChild(h1)
    titleRow.appendChild(statsRow)
    return titleRow
  }

  /**
   * "✓ n Owned", "n Not Owned", "♡ n Wishlist" (models/inventoryStatus.js): each one is a button
   * that shows only the items of its status, and all of them again when pressed a second time
   * (F75, REQ-02). The status selector left the filters row.
   */
  renderStatusCounts(stats, chosen) {
    const counts = {
      [InventoryStatus.OWNED]: stats.ownedCount,
      [InventoryStatus.NOT_OWNED]: stats.notOwnedCount,
      [InventoryStatus.WISHLIST]: stats.wishlistCount
    }
    return SafeDOM.div({ className: 'flex flex-wrap gap-2', role: 'group', 'aria-label': 'Filter by status' }, Object.keys(counts).map(status => {
      const pressed = chosen === status
      const button = SafeDOM.button({
        type: 'button',
        className: COUNT_BADGE[status],
        dataset: { statusCount: status },
        title: 'Show only these albums; press again to show all',
        'aria-pressed': String(pressed),
        onClick: () => this.controller.handleStatusCount(status)
      }, statusCountLabel(status, counts[status] || 0))
      button.style.cursor = 'pointer'
      if (pressed) {
        button.style.outline = '2px solid #f97316'
        button.style.outlineOffset = '1px'
      }
      return button
    }))
  }

  /** The strip under the title: the two totals and the currency (F75, REQ-07, REQ-08). */
  renderTotals(state) {
    const strip = SafeDOM.div({ id: TOTALS_ID, className: 'glass-panel p-4 mb-6 flex flex-wrap items-center gap-4' })
    strip.appendChild(SafeDOM.fromHTML(renderTotals(state.value)))
    return strip
  }

  /** The notices of the values, between the totals and the filters: a run under way, or albums waiting for a value. */
  renderNotices(state) {
    const notices = SafeDOM.div({ id: NOTICES_ID })
    notices.appendChild(SafeDOM.fromHTML(renderNotices(state.value)))
    return notices
  }

  /**
   * The two actions of the toolbar are real buttons, reached by the keyboard. While one runs it is
   * disabled and says what is being done, and the other one waits (the controller refuses both).
   */
  renderAddSeriesAlbums(state = {}) {
    const button = this.renderActionButton({
      id: ADD_SERIES_ALBUMS_ID,
      icon: 'Plus',
      title: 'Put every album of your series in the inventory, as Not Owned',
      onClick: () => this.handleAddSeriesAlbums()
    }, ADD_SERIES_ALBUMS_LABEL)
    this.applyAction(button, ADD_SERIES_ALBUMS_LABEL, state.seriesAdd, state.ratings?.busy)
    return button
  }

  /** "Update ratings": reads the Avg Rating and the Avg Pop of every album and keeps them in the items. */
  renderUpdateRatings(state = {}) {
    const button = this.renderActionButton({
      id: UPDATE_RATINGS_ID,
      icon: 'Star',
      title: 'Read the BestEverAlbums rating and the Spotify popularity of every album, to order the inventory by them',
      onClick: () => this.handleUpdateRatings()
    }, UPDATE_RATINGS_LABEL)
    this.applyAction(button, UPDATE_RATINGS_LABEL, state.ratings, state.seriesAdd?.busy)
    return button
  }

  renderActionButton({ id, icon, title, onClick }, label) {
    const button = SafeDOM.button({
      type: 'button',
      id,
      className: 'btn btn-secondary flex items-center gap-2 whitespace-nowrap',
      title,
      onClick
    })
    button.appendChild(SafeDOM.fromHTML(getIcon(icon, 'w-4 h-4')))
    button.appendChild(SafeDOM.span({ dataset: { role: 'label' } }, label))
    return button
  }

  /**
   * "Update values": reads the value of every album from Discogs. Drawn only while the source is
   * on (REQ-10): with it off there is no button, no value of Discogs and no notice.
   */
  renderUpdateValues(state = {}) {
    if (state.value?.source !== SourceState.ON) return null
    const button = this.renderActionButton({
      id: UPDATE_VALUES_ID,
      icon: 'RefreshCw',
      title: 'Read the estimated value of every album from Discogs',
      onClick: () => this.controller.handleUpdateValues()
    }, UPDATE_VALUES_LABEL)
    this.applyAction(button, UPDATE_VALUES_LABEL, state.value.run)
    return button
  }

  /**
   * A run of "Update values" moved, or one album of it changed: the button, the notice, the totals
   * and that album's card are drawn in place. The screen is not drawn whole for each album.
   * @param {Object} state - of the controller
   * @param {string} [itemId] - the item whose card changed
   */
  showValues(state, itemId = null) {
    if (this.left) return
    const button = document.getElementById(UPDATE_VALUES_ID)
    if (button) this.applyAction(button, UPDATE_VALUES_LABEL, state.value.run)
    this.redraw(TOTALS_ID, renderTotals(state.value))
    this.redraw(NOTICES_ID, renderNotices(state.value))
    if (itemId) this.redrawCard(state, itemId)
    this.openWindow?.redrawValue()
  }

  redraw(id, html) {
    const place = document.getElementById(id)
    if (!place) return
    SafeDOM.clear(place)
    place.appendChild(SafeDOM.fromHTML(html))
  }

  /** One card (or one row of the list) drawn again where it is. */
  redrawCard(state, itemId) {
    const item = state.albums.find(one => one.id === itemId)
    const wrapper = [...document.querySelectorAll('#inventory-grid-container [data-album-id]')]
      .find(node => node.dataset.albumId === itemId && node.matches('.inventory-card-wrapper, .inventory-row-wrapper'))
    if (!item || !wrapper) return
    const html = wrapper.matches('.inventory-row-wrapper')
      ? InventoryGridRenderer.renderRow(item, state.value)
      : InventoryGridRenderer.renderCard(item, state.value)
    wrapper.replaceWith(SafeDOM.fromHTML(html))
  }

  /** `own`: what this action is doing; `locked`: the other action is running. */
  applyAction(button, idleLabel, { busy = false, text = null } = {}, locked = false) {
    button.disabled = Boolean(busy || locked)
    button.setAttribute('aria-busy', String(Boolean(busy)))
    const label = button.querySelector('[data-role="label"]')
    if (label) label.textContent = text || idleLabel
  }

  /** The controller says what an action is doing: the buttons change, the screen is not drawn again. */
  showSeriesAdd(seriesAdd) { this.showActions({ seriesAdd }) }

  showRatings(ratings) { this.showActions({ ratings }) }

  /** `changes`: the state of the action that just changed; the other one is read from the controller. */
  showActions(changes) {
    const { seriesAdd, ratings } = { ...this.controller.state, ...changes }
    const add = document.getElementById(ADD_SERIES_ALBUMS_ID)
    const read = document.getElementById(UPDATE_RATINGS_ID)
    if (add) this.applyAction(add, ADD_SERIES_ALBUMS_LABEL, seriesAdd, ratings.busy)
    if (read) this.applyAction(read, UPDATE_RATINGS_LABEL, ratings, seriesAdd.busy)
  }

  async handleAddSeriesAlbums() {
    const { dialogService } = await import('../services/DialogService.js')
    await this.controller.handleAddSeriesAlbums({ confirm: (options) => dialogService.confirm(options) })
  }

  async handleUpdateRatings() {
    const { dialogService } = await import('../services/DialogService.js')
    await this.controller.handleUpdateRatings({ confirm: (options) => dialogService.confirm(options) })
  }

  renderFilters(state) {
    const { filters, viewMode } = state

    const container = SafeDOM.div({ className: 'filters-section glass-panel p-4 mb-6' })
    const row = SafeDOM.div({ className: 'filters-row flex flex-wrap gap-3 items-center' })

    // Search
    const searchDiv = SafeDOM.div({ className: 'search-bar relative flex-1 min-w-[200px]' })
    searchDiv.appendChild(SafeDOM.span({ className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' }, [SafeDOM.fromHTML(getIcon('Search', 'w-5 h-5'))]))
    searchDiv.appendChild(SafeDOM.input({
      type: 'search',
      id: 'inventorySearch',
      placeholder: 'Search collection...',
      className: 'form-control pl-10 w-full',
      value: filters.search || ''
    }))
    row.appendChild(searchDiv)

    // Format Filter
    const formatDiv = SafeDOM.div({ className: 'filter-dropdown relative' })
    const formatSelect = SafeDOM.select({ id: 'formatFilter', className: 'form-control appearance-none cursor-pointer pr-8' }, [
      SafeDOM.option({ value: 'all' }, 'All Formats'),
      SafeDOM.option({ value: 'cd', selected: filters.format === 'cd' }, 'CD'),
      SafeDOM.option({ value: 'vinyl', selected: filters.format === 'vinyl' }, 'Vinyl'),
      SafeDOM.option({ value: 'digital', selected: filters.format === 'digital' }, 'Digital')
    ])
    formatDiv.appendChild(formatSelect)
    formatDiv.appendChild(SafeDOM.span({ className: 'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400' }, [SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))]))
    row.appendChild(formatDiv)

    // The status is chosen with the counts of the header (F75, REQ-02): no status selector here

    // Order (F71, S-56)
    const sortDiv = SafeDOM.div({ className: 'filter-dropdown relative' })
    const sortSelect = SafeDOM.select({ id: 'inventorySort', className: 'form-control appearance-none cursor-pointer pr-8', 'aria-label': 'Sort by' },
      SORT_OPTIONS.map(({ value, label }) => SafeDOM.option({ value, selected: choiceOf(state.sorting) === value }, label)))
    sortDiv.appendChild(sortSelect)
    sortDiv.appendChild(SafeDOM.span({ className: 'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400' }, [SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))]))
    row.appendChild(sortDiv)

    // View Mode
    const viewBtn = SafeDOM.button({
      id: 'toggleViewMode',
      className: `btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`,
      title: 'Toggle grid/list view'
    })
    viewBtn.appendChild(SafeDOM.fromHTML(getIcon(viewMode === 'grid' ? 'Grid' : 'List', 'w-5 h-5')))
    row.appendChild(viewBtn)

    // Add the albums of my series (F71)
    row.appendChild(this.renderAddSeriesAlbums(state))

    // Update ratings (F71, S-56)
    row.appendChild(this.renderUpdateRatings(state))

    // Update values (F75, REQ-09): only while the Discogs values are on
    const updateValues = this.renderUpdateValues(state)
    if (updateValues) row.appendChild(updateValues)

    container.appendChild(row)
    return container
  }

  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('inventorySearch')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.controller.handleFilterChange('search', e.target.value)
      })
    }

    // Filters
    document.getElementById('formatFilter')?.addEventListener('change', (e) => {
      this.controller.handleFilterChange('format', e.target.value)
    })

    // The currency of the values, and the action of a notice ("Stop", "Read them now")
    document.getElementById(TOTALS_ID)?.addEventListener('click', (e) => {
      const code = e.target.closest('[data-currency]')?.dataset.currency
      if (code) this.controller.handleCurrencyChoice(code)
    })
    document.getElementById(NOTICES_ID)?.addEventListener('click', (e) => {
      const action = e.target.closest('[data-notice-action]')?.dataset.noticeAction
      if (action === 'stop-values') this.controller.handleStopValues()
      if (action === 'read-values') this.controller.handleUpdateValues()
    })

    document.getElementById('inventorySort')?.addEventListener('change', (e) => {
      this.controller.handleSortChoice(e.target.value)
    })

    document.getElementById('toggleViewMode')?.addEventListener('click', () => {
      const current = this.controller.state.viewMode
      this.controller.handleViewModeChange(current === 'grid' ? 'list' : 'grid')
    })

    // Grid Delegation for Buttons
    const grid = document.getElementById('inventory-grid-container')
    if (grid) {
      grid.addEventListener('click', (e) => {
        // A link to a store, or to the page of an edition at Discogs, is followed: it opens no window here
        if (e.target.closest('a[href]')) return
        const target = e.target.closest('.view-album-btn, .edit-album-btn, .delete-album-btn, .inventory-row-wrapper, .expanded-album-card, .album-card-compact, [data-action="view-modal"]')
        if (!target) return

        const albumId = target.dataset.albumId || target.dataset.id
        if (!albumId) return

        // Prioritize Delete/Edit buttons inside the card/row
        if (target.classList.contains('delete-album-btn')) {
          e.stopPropagation()
          this.handleDeleteWithModal(albumId)
        } else if (target.classList.contains('edit-album-btn')) {
          e.stopPropagation()
          this.handleEditWithModal(albumId)
        } else {
          // Default action is View
          this.handleViewWithModal(albumId)
        }
      })

      // Status Select Change
      grid.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
          const albumId = e.target.dataset.albumId
          const status = e.target.value
          this.controller.handleStatusChange(albumId, status)
        }
      })
    }
  }

  async handleDeleteWithModal(albumId) {
    const { dialogService } = await import('../services/DialogService.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    const confirmed = await dialogService.confirm({
      title: 'Remove from Inventory?',
      message: `Are you sure you want to remove "${album.title}" from your collection?`,
      confirmText: 'Remove',
      variant: 'danger'
    })

    if (confirmed) {
      await this.controller.handleDelete(albumId)
    }
  }

  async handleEditWithModal(albumId) {
    const { InventoryEditModal } = await import('../components/InventoryEditModal.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    InventoryEditModal.open(album, async (id, updates) => {
      await this.controller.handleUpdateAlbum(id, updates)
    })
  }

  async handleViewWithModal(albumId) {
    const { showViewAlbumModal } = await import('../components/ViewAlbumModal.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return
    // The window asks the album load for the album of now: an item keeps no tracks of its own (UAT-220).
    // It shows what the album is worth and where to buy it (F75), and asks the controller for every change.
    this.openWindow = await showViewAlbumModal(album, {
      loadAlbum: (signal) => this.controller.albumOfItem(album, signal),
      value: {
        view: () => this.controller.valueViewOf(albumId),
        onWrite: (text) => this.controller.handleWriteValue(albumId, text),
        onForget: () => this.controller.handleForgetValue(albumId),
        onRead: () => this.controller.handleReadValue(albumId)
      }
    })
  }
}
