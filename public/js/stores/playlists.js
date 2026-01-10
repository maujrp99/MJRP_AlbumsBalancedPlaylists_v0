/**
 * Playlists Store - PURE STATE CONTAINER
 * 
 * Only holds state and exposes simple setters/getters.
 * All logic delegated to PlaylistsService (Sprint 19).
 */

export class PlaylistsStore {
    constructor() {
        // Core state
        this.playlists = []
        this.seriesId = null
        this.config = { playlistCount: 3, maxDuration: 75, p1p2Rule: true }

        // Sync state
        this.isDirty = false
        this.isSynchronized = true
        this.loading = false

        // Mode state
        this.mode = 'CREATING'
        this.editContext = null
        this.batchName = ''
        this.defaultBatchName = null

        // Undo state (managed by service, stored here)
        this.canUndo = false
        this.canRedo = false

        // Observer pattern
        this.listeners = new Set()
    }

    // ========== SIMPLE SETTERS ==========

    setPlaylists(playlists, seriesId = null) {
        this.playlists = playlists
        if (seriesId) this.seriesId = seriesId
        this.notify()
    }

    setSeriesId(seriesId) {
        this.seriesId = seriesId
        this.notify()
    }

    setConfig(config) {
        this.config = { ...this.config, ...config }
        this.notify()
    }

    setLoading(loading) {
        this.loading = loading
        this.notify()
    }

    setDirty(isDirty) {
        this.isDirty = isDirty
        this.notify()
    }

    setSynchronized(isSynchronized) {
        this.isSynchronized = isSynchronized
        this.notify()
    }

    setMode(mode) {
        this.mode = mode
        this.notify()
    }

    setEditContext(editContext) {
        this.editContext = editContext
        this.notify()
    }

    setBatchName(batchName) {
        this.batchName = batchName
        // Note: No notify() to prevent input re-render
    }

    setDefaultBatchName(name) {
        this.defaultBatchName = name
        this.notify()
    }

    setUndoState(canUndo, canRedo) {
        this.canUndo = canUndo
        this.canRedo = canRedo
        this.notify()
    }

    // ========== SIMPLE GETTERS ==========

    getPlaylists() {
        return this.playlists
    }

    getSeriesId() {
        return this.seriesId
    }

    getConfig() {
        return { ...this.config }
    }

    getEditContext() {
        return this.editContext
    }

    isEditingExistingBatch() {
        return this.mode === 'EDITING' && this.editContext !== null
    }

    // ========== OBSERVER PATTERN ==========

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    getState() {
        return {
            playlists: this.playlists,
            seriesId: this.seriesId,
            config: this.config,
            loading: this.loading,
            isDirty: this.isDirty,
            isSynchronized: this.isSynchronized,
            mode: this.mode,
            editContext: this.editContext,
            batchName: this.batchName,
            defaultBatchName: this.defaultBatchName,
            canUndo: this.canUndo,
            canRedo: this.canRedo
        }
    }

    reset() {
        this.playlists = []
        this.seriesId = null
        this.config = { playlistCount: 3, maxDuration: 75, p1p2Rule: true }
        this.isDirty = false
        this.isSynchronized = true
        this.loading = false
        this.mode = 'CREATING'
        this.editContext = null
        this.batchName = ''
        this.defaultBatchName = null
        this.canUndo = false
        this.canRedo = false
        this.notify()
    }
}

// Singleton instance
export const playlistsStore = new PlaylistsStore()
