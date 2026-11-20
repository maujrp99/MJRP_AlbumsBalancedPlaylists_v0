/**
 * InventoryController.js
 * 
 * Manages the business logic and state for the Inventory View.
 * Follows V3 Architecture: Decoupled Logic (Controller) <-> UI (View/Renderer).
 * 
 * Responsibilities:
 * - Fetching data from InventoryStore / AlbumLoader
 * - Filtering and Sorting Logic
 * - Handling User Actions (Update Price, Status, Delete)
 * - Computing Stats
 * 
 * @module controllers/InventoryController
 */

import { inventoryStore } from '../stores/inventory.js'
import { inventoryService, readSeriesOfThePerson } from '../services/inventory/inventoryWiring.js'
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js'
import toast from '../components/Toast.js'
import { filterInventory, statusCountsFor } from '../models/inventoryFilter.js'
import { InventoryStatus, ownedValueOf, statusChangeMessage, statusOf } from '../models/inventoryStatus.js'
import { confirmationText, nothingToAddText, outcomeText, progressText } from '../models/inventoryFromSeries.js'
import { sortInventory, sortingFor } from '../models/inventorySort.js'
import { CONFIRM_FROM, ratingsOutcome, ratingsProgressText, ratingsQuestion } from '../models/inventoryRatings.js'

/** The button "Add the albums of my series" at rest. */
const SERIES_ADD_IDLE = Object.freeze({ busy: false, text: null })

/** The button "Update ratings" at rest. */
const RATINGS_IDLE = Object.freeze({ busy: false, text: null })

/** What the person is asked before the albums of the series are written. */
const seriesAddQuestion = (plan) => ({
    title: 'Add the albums of your series?',
    message: confirmationText(plan),
    confirmText: `Add ${plan.toAdd.length === 1 ? '1 album' : `${plan.toAdd.length} albums`}`
})

export class InventoryController {
    constructor(view) {
        this.view = view

        // Internal State
        this.state = {
            albums: [],
            filteredAlbums: [],
            stats: {
                totalValue: 0,
                totalCount: 0,
                vinylCount: 0,
                cdCount: 0
            },
            filters: {
                search: '',
                format: 'all', // all, vinyl, cd
                ownership: 'all' // all, owned, not-owned, wishlist (models/inventoryStatus.js)
            },
            // "Add the albums of my series": busy while it reads and writes, with what it is doing
            seriesAdd: SERIES_ADD_IDLE,
            // "Update ratings": busy while it reads the albums and saves the averages
            ratings: RATINGS_IDLE,
            sorting: sortingFor('artist'),
            viewMode: 'grid', // grid, list
            viewCurrency: 'USD', // USD or BRL
            isLoading: false
        }

        // Aborted when the screen closes: the ask for the ratings is dropped (F71, S-56)
        this._leaving = new AbortController()
    }

    /** The album of an item as the album load has it now, for the window of the item. */
    albumOfItem(item, signal) {
        return inventoryService.albumOfItem(item, { signal })
    }

    /** The screen closes: what the ask for the ratings still waits for is dropped. */
    dispose() {
        this._leaving.abort()
    }

    /**
     * Initialize controller: load data and listeners
     */
    async initialize() {
        this.loadSettings()
        // Fire and forget loader (covers will appear via hydration or re-render if we triggered correctly)
        // Ideally we should re-render when covers load. 
        optimizedAlbumLoader.load().catch(console.warn)
        await this.loadData()
    }

    /**
     * Load persistent view settings from localStorage
     */
    loadSettings() {
        const savedView = localStorage.getItem('mjrp_inventory_view_mode')
        if (savedView) this.state.viewMode = savedView

        const savedCurrency = localStorage.getItem('inventoryCurrency')
        if (savedCurrency) this.state.viewCurrency = savedCurrency
    }

    /**
     * Fetch fresh data from store/loader
     */
    async loadData() {
        this.state.isLoading = true
        this.view.render(this.state) // Optimistic load state

        try {
            // Ensure store is populated
            if (inventoryStore.getAlbums().length === 0) {
                // Trigger a sync if needed, though usually App initializes it.
                // For now, assume store has data or we wait for subscription.
            }

            this.updateStateFromStore()
        } catch (error) {
            console.error('[InventoryController] Load error:', error)
            toast.error('Failed to load inventory')
        } finally {
            this.state.isLoading = false
            this.refresh()
        }
    }

    /**
     * Update internal state from Store and re-calculate
     */
    updateStateFromStore() {
        const allAlbums = inventoryStore.getAlbums()
        this.state.albums = allAlbums
        this.applyFiltersAndSort()
        this.calculateStats()
    }

    /**
     * Apply current filters and sorting to generate filteredAlbums
     */
    applyFiltersAndSort() {
        // 1-3. Search, format and status (models/inventoryFilter.js)
        const result = filterInventory(this.state.albums, this.state.filters)

        // 4. Sorting (models/inventorySort.js)
        sortInventory(result, this.state.sorting)

        this.state.filteredAlbums = result
    }

    /**
     * Calculate aggregate stats from FILTERED result
     */
    calculateStats() {
        const albums = this.state.filteredAlbums

        // Only what is OWNED adds to the value: Wishlist and Not Owned are left out of it.
        const ownedItems = albums.filter(a => statusOf(a) === InventoryStatus.OWNED)

        // The three counts are of the items that pass the search and the format: choosing a
        // status does not turn the other two into zero (models/inventoryFilter.js)
        const counts = statusCountsFor(this.state.albums, this.state.filters)

        this.state.stats.totalCount = albums.length
        this.state.stats.ownedCount = counts[InventoryStatus.OWNED]
        this.state.stats.notOwnedCount = counts[InventoryStatus.NOT_OWNED]
        this.state.stats.wishlistCount = counts[InventoryStatus.WISHLIST]

        // Sum Value separated by currency (Default to USD if missing)
        this.state.stats.ownedValueUSD = ownedItems
            .filter(a => !a.currency || a.currency === 'USD')
            .reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0)

        this.state.stats.ownedValueBRL = ownedItems
            .filter(a => a.currency === 'BRL')
            .reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0)

        // Counts by Format
        this.state.stats.vinylCount = albums.filter(a => (a.format?.toLowerCase() || '').includes('vinyl')).length
        this.state.stats.cdCount = albums.filter(a => (a.format?.toLowerCase() || '').includes('cd')).length
    }

    /**
     * Trigger view update
     */
    refresh() {
        this.view.render(this.state)
    }

    // =========================================
    // User Action Handlers
    // =========================================

    handleFilterChange(type, value) {
        if (type in this.state.filters) {
            this.state.filters[type] = value
            this.applyFiltersAndSort()
            this.calculateStats()
            this.refresh()
        }
    }

    handleSortChange(field) {
        if (this.state.sorting.field === field) {
            // Toggle direction
            this.state.sorting.direction = this.state.sorting.direction === 'asc' ? 'desc' : 'asc'
        } else {
            this.state.sorting.field = field
            this.state.sorting.direction = 'asc' // Default for new field
        }
        this.applyFiltersAndSort()
        this.refresh()
    }

    /**
     * The order the person chose (models/inventorySort.js SORT_OPTIONS): the controller only passes
     * the choice, the model says how items compare.
     * @param {string} value - the field of one of the choices
     */
    handleSortChoice(value) {
        this.state.sorting = sortingFor(value)
        this.applyFiltersAndSort()
        this.refresh()
    }

    handleViewModeChange(mode) {
        this.state.viewMode = mode
        localStorage.setItem('mjrp_inventory_view_mode', mode)
        this.refresh()
    }

    handleCurrencyChange() {
        this.state.viewCurrency = this.state.viewCurrency === 'USD' ? 'BRL' : 'USD'
        // Persist if needed (legacy used 'inventoryCurrency')
        localStorage.setItem('inventoryCurrency', this.state.viewCurrency)
        this.refresh()
    }

    /**
     * Change the status of an item (Owned, Not Owned, Wishlist). The service throws when the
     * write fails; the screen then goes back to what the store holds.
     * @param {string} albumId - the inventory item
     * @param {string} status - one of InventoryStatus
     */
    async handleStatusChange(albumId, status) {
        try {
            await inventoryService.updateAlbum(albumId, { owned: ownedValueOf(status) })
            toast.success(statusChangeMessage(status))
        } catch (error) {
            console.error('[InventoryController] Failed to update status:', error)
            toast.error('Failed to update status')
        }
        this.updateStateFromStore()
        this.refresh()
    }

    /**
     * "Add the albums of my series" (F71): every album of the person's series that is not in the
     * inventory goes in as Not Owned. The person sees what will happen and confirms before
     * anything is written; with nothing to add, a notice says so and nothing is written.
     * @param {Object} options
     * @param {Function} options.confirm - (dialog options) => Promise<boolean>, the app's confirmation
     */
    async handleAddSeriesAlbums({ confirm }) {
        if (this._isBusy()) return
        try {
            const plan = await this._planSeriesAlbums()
            if (!plan) return
            if (!await confirm(seriesAddQuestion(plan))) return
            await this._writeSeriesAlbums(plan.toAdd)
        } finally {
            this._showSeriesAdd(SERIES_ADD_IDLE)
        }
    }

    /** @returns {Promise<Object|null>} the plan when there is something to add; null when not (the person was told why) */
    async _planSeriesAlbums() {
        this._showSeriesAdd({ busy: true, text: 'Reading your series…' })
        let plan
        try {
            plan = await inventoryService.planSeriesAlbums(await readSeriesOfThePerson())
        } catch (error) {
            console.error('[InventoryController] Could not read the series or the inventory:', error)
            toast.error('Could not read your series and your inventory. Nothing was added.')
            return null
        }
        if (plan.skipped.length > 0) console.info('[InventoryController] Entries of the series that are not added:', plan.skipped)
        if (plan.toAdd.length > 0) return plan
        toast.info(nothingToAddText(plan))
        return null
    }

    async _writeSeriesAlbums(albums) {
        const total = albums.length
        this._showSeriesAdd({ busy: true, text: progressText({ added: 0, total }) })
        const result = await inventoryService.addAlbumsAsNotOwned(albums, {
            onProgress: (step) => this._showSeriesAdd({ busy: true, text: progressText(step) })
        })
        const outcome = outcomeText(result)
        if (outcome.ok) toast.success(outcome.text)
        else toast.error(outcome.text)
    }

    /** The state of the button, kept for the next full draw and shown at once without one. */
    _showSeriesAdd(seriesAdd) {
        this.state.seriesAdd = seriesAdd
        this.view.showSeriesAdd?.(seriesAdd)
    }

    /** One of the two actions of the toolbar is running: the other waits. */
    _isBusy() {
        return this.state.seriesAdd.busy || this.state.ratings.busy
    }

    /**
     * "Update ratings" (F71, S-56): read the Avg Rating and the Avg Pop of every album of the
     * inventory and keep them in the items. With more than CONFIRM_FROM albums the person is
     * asked first (it takes minutes). Leaving the screen drops the ask (`dispose`).
     * @param {Object} options
     * @param {Function} options.confirm - (dialog options) => Promise<boolean>, the app's confirmation
     */
    async handleUpdateRatings({ confirm }) {
        if (this._isBusy()) return
        const total = this.state.albums.length
        if (total === 0) {
            toast.info('Your inventory has no albums yet. There are no ratings to read.')
            return
        }
        // The button is busy from the question on: a second press while it is open does nothing
        this._showRatings({ busy: true, text: 'Reading ratings…' })
        try {
            if (total > CONFIRM_FROM && !await confirm(ratingsQuestion(total))) return
            if (this._leaving.signal.aborted) return
            await this._updateRatings()
        } finally {
            this._showRatings(RATINGS_IDLE)
        }
    }

    async _updateRatings() {
        let result
        try {
            result = await inventoryService.updateAverages({
                signal: this._leaving.signal,
                onProgress: (step) => this._showRatings({ busy: true, text: ratingsProgressText(step) })
            })
        } catch (error) {
            console.error('[InventoryController] Could not update the ratings:', error)
            toast.error('Could not update the ratings. Your inventory was not changed.')
            return
        }
        if (result.aborted) return
        const outcome = ratingsOutcome(result)
        if (outcome.ok) toast.success(outcome.text)
        else toast.error(outcome.text)
    }

    _showRatings(ratings) {
        this.state.ratings = ratings
        this.view.showRatings?.(ratings)
    }

    /**
     * Change the price of an item. The service keeps the item's currency when none is given, shows
     * the new price at once and puts the old one back when the write fails (it throws then).
     * @param {string} albumId - the inventory item
     * @param {number} newPrice
     * @param {string} [currency] - only when the person chose another one
     */
    async handleUpdatePrice(albumId, newPrice, currency) {
        try {
            await inventoryService.updatePrice(albumId, newPrice, currency)
            toast.success('Price updated')
        } catch (error) {
            console.error('[InventoryController] Failed to update price:', error)
            toast.error('Failed to update price')
        }
        // Either way the store says what is true now: the new price, or the old one put back
        this.updateStateFromStore()
        this.refresh()
    }

    async handleUpdateAlbum(albumId, updates) {
        const success = await inventoryService.updateAlbum(albumId, updates)
        if (success) {
            toast.success('Album updated')
            this.updateStateFromStore()
            this.refresh()
        } else {
            toast.error('Failed to update album')
        }
    }

    async handleDelete(albumId) {
        // The service removes from the cloud and from the store's list; it throws when the cloud refuses (UAT-01)
        try {
            await inventoryService.removeAlbum(albumId)
        } catch (error) {
            console.error('[InventoryController] Failed to remove album:', error)
            toast.error('Failed to delete album')
            return
        }
        toast.success('Album removed from inventory')
        this.updateStateFromStore()
        this.refresh()
    }
}
