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
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js'
import toast from '../components/Toast.js'

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
                ownership: 'all' // all, owned, wishlist
            },
            sorting: {
                field: 'addedAt',
                direction: 'desc'
            },
            sorting: {
                field: 'addedAt',
                direction: 'desc'
            },
            viewMode: 'grid', // grid, list
            viewCurrency: 'USD', // USD or BRL
            isLoading: false
        }
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
        let result = [...this.state.albums]

        // 1. Search
        const query = this.state.filters.search.toLowerCase().trim()
        if (query) {
            result = result.filter(album =>
                (album.title?.toLowerCase().includes(query)) ||
                (album.artist?.toLowerCase().includes(query)) ||
                (album.notes?.toLowerCase().includes(query))
            )
        }

        // 2. Format Filter
        if (this.state.filters.format !== 'all') {
            result = result.filter(album => {
                const fmt = album.format?.toLowerCase() || ''
                if (this.state.filters.format === 'vinyl') return fmt.includes('vinyl') || fmt.includes('lp')
                if (this.state.filters.format === 'cd') return fmt.includes('cd')
                if (this.state.filters.format === 'digital') return fmt.includes('digital')
                if (this.state.filters.format === 'dvd') return fmt.includes('dvd')
                if (this.state.filters.format === 'bluray') return fmt.includes('bluray')
                if (this.state.filters.format === 'cassette') return fmt.includes('cassette')
                return true
            })
        }

        // 3. Ownership Filter
        if (this.state.filters.ownership !== 'all') {
            result = result.filter(album => {
                const isOwned = album.owned === true
                const isWishlist = album.owned === false
                // If null/undefined, it's "Not Owned" (but not explicitly Wishlist)

                if (this.state.filters.ownership === 'owned') return isOwned
                if (this.state.filters.ownership === 'wishlist') return isWishlist
                if (this.state.filters.ownership === 'not-owned') return (!isOwned && !isWishlist) // Explicitly "Others"
                return true
            })
        }

        // 4. Sorting
        const { field, direction } = this.state.sorting
        result.sort((a, b) => {
            let valA = a[field]
            let valB = b[field]

            // Handle dates
            if (field === 'addedAt') {
                valA = new Date(valA || 0).getTime()
                valB = new Date(valB || 0).getTime()
            }
            // Handle numeric (purchasePrice)
            else if (field === 'purchasePrice') {
                valA = Number(valA) || 0
                valB = Number(valB) || 0
            }
            // Strings
            else {
                valA = String(valA || '').toLowerCase()
                valB = String(valB || '').toLowerCase()
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1
            if (valA > valB) return direction === 'asc' ? 1 : -1
            return 0
        })

        this.state.filteredAlbums = result
    }

    /**
     * Calculate aggregate stats from FILTERED result
     */
    calculateStats() {
        const albums = this.state.filteredAlbums

        // "Owned" for stats calculation context:
        // User Policy: Only count value if strictly OWNED (album.owned === true).
        // Wishlist (false) and Not-Yet-Market (null/undefined) are excluded from value.
        const ownedItems = albums.filter(a => a.owned === true)
        const wishlistItems = albums.filter(a => a.owned === false)
        const ignoredItems = albums.filter(a => a.owned !== true && a.owned !== false) // Null/Undefined

        this.state.stats.totalCount = albums.length
        this.state.stats.ownedCount = ownedItems.length
        this.state.stats.wishlistCount = wishlistItems.length

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

    async handleStatusChange(albumId, status) {
        let isOwned = null
        if (status === 'owned') isOwned = true
        else if (status === 'wishlist') isOwned = false
        // 'not-owned' remains null

        const success = await inventoryStore.updateAlbum(albumId, { owned: isOwned })
        if (success) {
            let msg = 'Updated status'
            if (isOwned === true) msg = 'Moved to Collection'
            else if (isOwned === false) msg = 'Moved to Wishlist'
            else msg = 'Marked as Not Owned'

            toast.success(msg)
            this.updateStateFromStore()
            this.refresh()
        } else {
            toast.error('Failed to update status')
        }
    }

    async handleUpdatePrice(albumId, newPrice) {
        const success = await inventoryStore.updatePrice(albumId, newPrice) // Using specific store method if available, or generic update
        // Legacy view used: await inventoryStore.updatePrice(albumId, newPrice, currency)
        // We should support currency too, or assume default.
        // Let's stick to simple update for now, or check store signature.

        if (success) {
            toast.success('Price updated')
            this.updateStateFromStore()
            this.refresh()
        } else {
            // Check if store has explicit updatePrice, otherwise try updateAlbum
            try {
                await inventoryStore.updateAlbum(albumId, { purchasePrice: newPrice })
                toast.success('Price updated')
                this.updateStateFromStore()
                this.refresh()
            } catch (e) {
                toast.error('Failed to update price')
            }
        }
    }

    async handleUpdateAlbum(albumId, updates) {
        const success = await inventoryStore.updateAlbum(albumId, updates)
        if (success) {
            toast.success('Album updated')
            this.updateStateFromStore()
            this.refresh()
        } else {
            toast.error('Failed to update album')
        }
    }

    async handleDelete(albumId) {
        const success = await inventoryStore.deleteAlbum(albumId)
        if (success) {
            toast.success('Album removed from inventory')
            this.updateStateFromStore()
            this.refresh()
        } else {
            toast.error('Failed to delete album')
        }
    }
}
