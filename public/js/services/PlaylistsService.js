/**
 * PlaylistsService.js
 * 
 * Service layer for ALL playlist operations:
 * - Saving the playlists on screen as a batch (the save rule: saveCurrentBatch)
 * - CRUD orchestration (through PlaylistRepository; no Firestore call here)
 * - Computation (stats, duration)
 * - Track operations (move, reorder, remove)
 * - Undo/Redo history
 * - The draft kept in the browser: playlists not saved yet survive a reload (saveToLocalStorage, restoreDraft)
 * - Export helpers
 * 
 * Extracted from PlaylistsStore (Sprint 19).
 * Refactored for modularity (Track C).
 */

import { PlaylistRepository } from '../repositories/PlaylistRepository.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { StorageService } from './infra/StorageService.js'
import { PlaylistHistoryService } from './playlists/PlaylistHistoryService.js'

const STORAGE_KEY = 'current_playlists' // prefix will be added by service

export class PlaylistsService {
    /**
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager
     * @param {StorageService} [storageService]
     * @param {PlaylistHistoryService} [historyService]
     * @param {Object} [options]
     * @param {Function} [options.playlistRepositoryFor] - (userId, seriesId) => the repository of the playlists of that series
     * @param {Function} [options.currentUserId] - () => the id of the person on the app now
     */
    constructor(db, cacheManager, storageService, historyService, options = {}) {
        this.db = db
        this.cacheManager = cacheManager
        this.playlistRepositoryFor = options.playlistRepositoryFor ||
            ((userId, seriesId) => new PlaylistRepository(this.db, this.cacheManager, userId || 'anonymous-user', seriesId))
        this.currentUserId = options.currentUserId || (() => albumSeriesStore.getUserId())

        // Dependencies
        this.storage = storageService || new StorageService()
        this.history = historyService || new PlaylistHistoryService()
    }

    // ========== TRACK OPERATIONS ==========

    moveTrack(fromPlaylistIndex, toPlaylistIndex, trackIndex, newIndex) {
        const playlists = [...playlistsStore.getPlaylists()]
        const fromPlaylist = playlists[fromPlaylistIndex]
        const toPlaylist = playlists[toPlaylistIndex]
        const seriesId = playlistsStore.getSeriesId()

        const [track] = fromPlaylist.tracks.splice(trackIndex, 1)
        toPlaylist.tracks.splice(newIndex, 0, track)

        this.history.createSnapshot(playlists, seriesId,
            `Moved track from ${fromPlaylist.name} to ${toPlaylist.name}`)

        this._updateState(playlists, seriesId)
    }

    reorderTrack(playlistIndex, oldIndex, newIndex) {
        const playlists = [...playlistsStore.getPlaylists()]
        const playlist = playlists[playlistIndex]
        const seriesId = playlistsStore.getSeriesId()

        const [track] = playlist.tracks.splice(oldIndex, 1)
        playlist.tracks.splice(newIndex, 0, track)

        this.history.createSnapshot(playlists, seriesId,
            `Reordered track in ${playlist.name}`)

        this._updateState(playlists, seriesId)
    }

    removeTrack(playlistIndex, trackIndex) {
        const playlists = [...playlistsStore.getPlaylists()]
        const playlist = playlists[playlistIndex]
        const seriesId = playlistsStore.getSeriesId()

        if (!playlist?.tracks) return

        const [removedTrack] = playlist.tracks.splice(trackIndex, 1)

        this.history.createSnapshot(playlists, seriesId,
            `Removed "${removedTrack.title}" from ${playlist.name}`)

        this._updateState(playlists, seriesId)
    }

    /**
     * Take a whole playlist out of the working set (the saved batch changes only on save).
     * @returns {Object|null} the playlist removed
     */
    removePlaylist(playlistIndex) {
        const playlists = playlistsStore.getPlaylists()
        const removed = playlists[playlistIndex]
        if (!removed) return null

        const seriesId = playlistsStore.getSeriesId()
        const remaining = playlists.filter((_, index) => index !== playlistIndex)
        this.history.createSnapshot(remaining, seriesId, `Removed playlist ${removed.name}`)
        this._updateState(remaining, seriesId)
        return removed
    }

    _updateState(playlists, seriesId) {
        playlistsStore.setPlaylists(playlists, seriesId)
        playlistsStore.setDirty(true)
        playlistsStore.setSynchronized(false)
        this.saveToLocalStorage()
    }

    // ========== COMPUTATION ==========

    calculateStats(playlists) {
        let totalTracks = 0
        let totalDuration = 0

        playlists.forEach(playlist => {
            if (playlist.tracks) {
                totalTracks += playlist.tracks.length
                totalDuration += playlist.tracks.reduce((sum, track) => {
                    return sum + (track.duration || track.durationSeconds || 0)
                }, 0)
            }
        })

        return { totalTracks, totalDuration: Math.round(totalDuration / 60) }
    }

    getPlaylistDuration(playlistIndex) {
        const playlist = playlistsStore.getPlaylists()[playlistIndex]
        if (!playlist?.tracks) return 0

        return playlist.tracks.reduce((total, track) => {
            return total + (track.duration || track.durationSeconds || 0)
        }, 0) / 60
    }

    prepareForExport(playlist) {
        return {
            name: playlist.name || playlist.title || 'Untitled Playlist',
            description: playlist.description || 'Generated by Album Blender',
            tracks: (playlist.tracks || []).map(track => ({
                title: track.title,
                artist: track.artist,
                duration: track.duration || track.durationSeconds,
                spotifyId: track.spotifyId || null,
                appleMusicId: track.appleMusicId || null
            }))
        }
    }

    // ========== MODE MANAGEMENT ==========

    setEditMode(batchName, seriesId, savedAt) {
        playlistsStore.setMode('EDITING')
        playlistsStore.setEditContext({
            originalBatchName: batchName,
            currentBatchName: batchName,
            seriesId,
            savedAt
        })
        playlistsStore.setBatchName(batchName)
        console.log('[PlaylistsService] Mode: EDITING')
    }

    setCreateMode() {
        playlistsStore.setMode('CREATING')
        playlistsStore.setEditContext(null)
        playlistsStore.setBatchName('')
        console.log('[PlaylistsService] Mode: CREATING')
    }

    applyBatchName(batchName) {
        const playlists = playlistsStore.getPlaylists()
        const timestamp = new Date().toISOString()

        playlists.forEach(playlist => {
            playlist.batchName = batchName
            playlist.savedAt = timestamp
        })

        playlistsStore.setBatchName(batchName)
        playlistsStore.setPlaylists(playlists)
    }

    // ========== UNDO/REDO (Delegated) ==========

    createSnapshot(playlists, seriesId, description) {
        this.history.createSnapshot(playlists, seriesId, description)
        this.updateUndoState()
    }

    undo() {
        const state = this.history.undo()
        if (state) {
            playlistsStore.setPlaylists(state.playlists, state.seriesId)
            playlistsStore.setDirty(true)
            this.updateUndoState()
            return true
        }
        return false
    }

    redo() {
        const state = this.history.redo()
        if (state) {
            playlistsStore.setPlaylists(state.playlists, state.seriesId)
            playlistsStore.setDirty(true)
            this.updateUndoState()
            return true
        }
        return false
    }

    updateUndoState() {
        const stats = this.history.getStats()
        playlistsStore.setUndoState(stats.canUndo, stats.canRedo)
    }

    // ========== DRAFT IN THE BROWSER ==========
    //
    // The set of playlists on screen that is not in the database yet (generated, maybe edited,
    // never saved) is kept in the browser as a draft, so a reload of the page does not lose it.
    // One draft at a time, written with the id of the person it belongs to and read back only
    // for that person. A set that is saved is not a draft: the database has it.

    /**
     * Keep the browser's draft in step with what is on screen. Called on every change of the
     * store (see watchStore) and after the operations of this service.
     *
     * - playlists not saved yet on screen: they are the draft;
     * - a saved batch on screen: there is no draft (it took the draft's place);
     * - nothing on screen: the draft is left alone (a page starts empty before the draft is read).
     */
    saveToLocalStorage() {
        const state = playlistsStore.getState()
        if (!state.seriesId || state.playlists.length === 0) return

        if (state.mode !== 'CREATING') {
            this.storage.remove(STORAGE_KEY)
            return
        }

        this.storage.save(STORAGE_KEY, {
            userId: this.currentUserId(),
            playlists: state.playlists, // Store is pure, safe to save directly
            seriesId: state.seriesId,
            config: state.config,
            batchName: state.batchName,
            defaultBatchName: state.defaultBatchName,
            isDirty: state.isDirty,
            timestamp: Date.now()
        })
    }

    /**
     * Keep the draft in step with the store, whoever changes it (the blend screen writes the
     * generated playlists straight into the store). Changes made in the same turn are written once.
     * @returns {Function} stops watching
     */
    watchStore() {
        let scheduled = false
        return playlistsStore.subscribe(() => {
            if (scheduled) return
            scheduled = true
            queueMicrotask(() => {
                scheduled = false
                this.saveToLocalStorage()
            })
        })
    }

    /**
     * Put the draft back on screen: the playlists this person generated for this series and did
     * not save. Does nothing when there is something on screen already.
     *
     * @param {Object} params
     * @param {string|null} params.seriesId - the series of the screen being opened; null when the address does not say
     * @returns {boolean} whether a draft was restored
     */
    restoreDraft({ seriesId = null } = {}) {
        if (playlistsStore.getPlaylists().length > 0) return false

        const draft = this.storage.load(STORAGE_KEY)
        if (!draft || !Array.isArray(draft.playlists) || draft.playlists.length === 0 || !draft.seriesId) return false
        if (!draft.userId || draft.userId !== this.currentUserId()) return false // someone else's, or from an older version
        if (seriesId && draft.seriesId !== seriesId) return false

        this.history.clear()
        this.createSnapshot(draft.playlists, draft.seriesId, 'Restored after reload')
        playlistsStore.setMode('CREATING')
        playlistsStore.setEditContext(null)
        playlistsStore.setConfig(draft.config || {})
        playlistsStore.setBatchName(draft.batchName || '')
        playlistsStore.setDefaultBatchName(draft.defaultBatchName || null)
        playlistsStore.setPlaylists(draft.playlists, draft.seriesId)
        playlistsStore.setDirty(draft.isDirty === true)
        playlistsStore.setSynchronized(false)
        console.log(`[PlaylistsService] Restored ${draft.playlists.length} unsaved playlists of series ${draft.seriesId}`)

        return true
    }

    clearLocalStorage() {
        this.storage.remove(STORAGE_KEY)
    }

    // ========== SAVE ==========

    /**
     * The name a save will use: what the person typed, or, for playlists not saved yet, the
     * name suggested when they were generated.
     * @returns {string|null} null when there is no name to save under
     */
    resolveBatchName(typedName) {
        const typed = (typedName || '').trim()
        if (typed) return typed
        if (playlistsStore.isEditingExistingBatch()) return null
        return playlistsStore.defaultBatchName || null
    }

    /**
     * Is there work on screen that the database does not have? Tracks moved or removed, a
     * playlist removed, or a saved batch given another name.
     */
    hasUnsavedChanges() {
        const state = playlistsStore.getState()
        if (state.playlists.length === 0) return false
        if (state.isDirty) return true
        const original = state.editContext?.originalBatchName
        return playlistsStore.isEditingExistingBatch() && !!state.batchName && !!original &&
            state.batchName.trim() !== original
    }

    /**
     * Save the playlists on screen as one batch. The whole rule of a save lives here:
     *
     * - one save at a time: a call made while a save is on its way does nothing;
     * - the series is the one the playlists on screen belong to (`playlistsStore.seriesId`),
     *   never the series that happens to be active elsewhere;
     * - when an already saved batch is being edited, the new playlists and the removal of the
     *   ones they replace go in ONE atomic write: a failure leaves the saved batch as it was;
     * - the state on screen changes only after the write is confirmed.
     *
     * @param {Object} params
     * @param {string} params.userId
     * @param {string} params.batchName - see resolveBatchName
     * @returns {Promise<{status: 'saved'|'already-saving', batchName?: string, seriesId?: string, playlists?: Array}>}
     * @throws when there is no name to save under, or the write fails (nothing was changed)
     */
    async saveCurrentBatch({ userId, batchName } = {}) {
        if (playlistsStore.getState().isSaving) return { status: 'already-saving' }

        const name = this.resolveBatchName(batchName)
        if (!name) throw new Error('Batch name required')
        // An empty save of a batch being edited would only delete it: deleting is another action
        if (playlistsStore.getPlaylists().length === 0) throw new Error('There are no playlists to save')

        playlistsStore.setSaving(true)
        try {
            return await this._writeCurrentBatch(userId, name)
        } finally {
            playlistsStore.setSaving(false)
        }
    }

    async _writeCurrentBatch(userId, batchName) {
        const seriesId = playlistsStore.getSeriesId()
        if (!seriesId || !this.db) {
            throw new Error('Cannot save: Missing database or Series ID')
        }

        const editContext = playlistsStore.isEditingExistingBatch() ? playlistsStore.getEditContext() : null
        if (editContext?.seriesId && editContext.seriesId !== seriesId) {
            throw new Error('Cannot save: the playlists on screen are not from the series of the batch being edited')
        }

        const savedAt = new Date().toISOString()
        // A copy: the playlists on screen stay as they are until the write is confirmed
        const playlists = JSON.parse(JSON.stringify(playlistsStore.getPlaylists()))
            .map(playlist => ({ ...playlist, batchName, savedAt, updatedAt: savedAt }))

        const repository = this.playlistRepositoryFor(userId, seriesId)
        const replacedName = editContext?.originalBatchName || null
        const replacedIds = replacedName
            ? (await repository.findAll()).filter(p => p.batchName === replacedName).map(p => p.id)
            : []

        let stored
        try {
            stored = await repository.replaceBatch(playlists, replacedIds)
        } catch (err) {
            if (err?.code === 'not-found') {
                throw new Error('the series of these playlists no longer exists')
            }
            throw err
        }
        console.log(`[PlaylistsService] Saved batch "${batchName}": ${stored.length} playlists`)

        // The saved batch is now the one being edited (also after a rename: the next save replaces the new name)
        playlistsStore.setPlaylists(stored.map(playlist => ({ ...playlist, updatedAt: savedAt })), seriesId)
        this.setEditMode(batchName, seriesId, savedAt)
        playlistsStore.setDirty(false)
        playlistsStore.setSynchronized(true)
        this.saveToLocalStorage()

        return { status: 'saved', batchName, seriesId, playlists: stored }
    }

    // ========== FIRESTORE CRUD ==========

    async loadBatch(userId, seriesId) {
        if (!seriesId || !this.db) return []

        const repo = this.playlistRepositoryFor(userId, seriesId)
        const playlists = await repo.findAll()

        if (playlists?.length > 0) {
            playlistsStore.setPlaylists(playlists, seriesId)
            playlistsStore.setSynchronized(true)
            playlistsStore.setDirty(false)
            this.saveToLocalStorage()
        }

        return playlists || []
    }

    async deleteBatch(userId, seriesId, batchName) {
        if (!seriesId || !this.db) {
            throw new Error('Cannot delete: Missing database or Series ID')
        }

        const repo = this.playlistRepositoryFor(userId, seriesId)
        const all = await repo.findAll()
        const toDelete = all.filter(p => p.batchName === batchName)

        // one atomic write: the batch goes whole or stays whole
        await repo.deleteMany(toDelete.map(p => p.id))
        console.log(`[PlaylistsService] Deleted ${toDelete.length} playlists`)
    }

    // ========== INITIALIZATION ==========

    initializeWithPlaylists(playlists, seriesId) {
        this.history.clear() // Reset history on new init
        this.createSnapshot(playlists, seriesId, 'Initial generation')
        playlistsStore.setPlaylists(playlists, seriesId)
        playlistsStore.setDirty(false)
        playlistsStore.setSynchronized(false)
        this.saveToLocalStorage()
    }

    reset() {
        this.history.clear()
        this.clearLocalStorage()
        playlistsStore.reset()
    }
}

// Singleton factory
let _instance = null

export function getPlaylistsService(db, cacheManager) {
    if (!_instance && db) {
        const storage = new StorageService()
        const history = new PlaylistHistoryService()
        _instance = new PlaylistsService(db, cacheManager, storage, history)
        _instance.watchStore()
    }
    return _instance
}
