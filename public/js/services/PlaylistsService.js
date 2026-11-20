/**
 * PlaylistsService.js
 * 
 * Service layer for ALL playlist operations:
 * - Saving the playlists on screen as a batch (the save rule: saveCurrentBatch)
 * - CRUD orchestration (through PlaylistRepository; no Firestore call here)
 * - Computation (stats, duration)
 * - Edits of the set on screen (move, reorder and remove a track, remove and rename a playlist)
 * - Undo/Redo history of those edits
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

/** The set with the tracks of one playlist replaced: a new set, the given one is left as it is. */
const withTracks = (playlists, playlistIndex, change) => playlists.map((playlist, index) =>
    (index === playlistIndex ? { ...playlist, tracks: change(playlist.tracks || []) } : playlist))

/** The tracks with one more at a position: a new list. */
const insertedAt = (tracks, position, track) => [...tracks.slice(0, position), track, ...tracks.slice(position)]

export class PlaylistsService {
    /**
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager
     * @param {StorageService} [storageService]
     * @param {PlaylistHistoryService} [historyService]
     * @param {Object} [options]
     * @param {Function} [options.playlistRepositoryFor] - (userId, seriesId) => the repository of the playlists of that series
     * @param {Function} [options.currentUserId] - () => the id of the person on the app now (whose draft the browser keeps)
     * @param {Function} [options.signedInUserId] - () => the id of the person signed in: whose series a save or a read
     *   goes to when the caller names nobody. Given where the service is put together (playlists/playlistsWiring.js).
     */
    constructor(db, cacheManager, storageService, historyService, options = {}) {
        this.db = db
        this.cacheManager = cacheManager
        this.playlistRepositoryFor = options.playlistRepositoryFor ||
            ((userId, seriesId) => new PlaylistRepository(this.db, this.cacheManager, userId || 'anonymous-user', seriesId))
        this.currentUserId = options.currentUserId || (() => albumSeriesStore.getUserId())
        this.signedInUserId = options.signedInUserId || (() => null)

        // Dependencies
        this.storage = storageService || new StorageService()
        this.history = historyService || new PlaylistHistoryService()

        // The set of playlists the history is of (see "UNDO / REDO"), and whether it came with unsaved work
        this._followed = null
        this._dirtyAtStart = false
    }

    // ========== EDITS OF THE SET ON SCREEN ==========
    //
    // Every edit builds a new set (the one on screen is not changed in place), records it as a
    // step of the history and shows it. See "UNDO / REDO" below for the history itself.

    moveTrack(fromPlaylistIndex, toPlaylistIndex, trackIndex, newIndex) {
        const playlists = playlistsStore.getPlaylists()
        const from = playlists[fromPlaylistIndex]
        const to = playlists[toPlaylistIndex]
        const track = from?.tracks?.[trackIndex]
        if (!track || !to) return
        if (fromPlaylistIndex === toPlaylistIndex && trackIndex === newIndex) return // dropped where it was

        const taken = withTracks(playlists, fromPlaylistIndex, tracks => tracks.filter((_, index) => index !== trackIndex))
        const next = withTracks(taken, toPlaylistIndex, tracks => insertedAt(tracks, newIndex, track))
        this._applyEdit(next, `Moved track from ${from.name} to ${to.name}`)
    }

    reorderTrack(playlistIndex, oldIndex, newIndex) {
        const playlists = playlistsStore.getPlaylists()
        const playlist = playlists[playlistIndex]
        const track = playlist?.tracks?.[oldIndex]
        if (!track || oldIndex === newIndex) return

        const next = withTracks(playlists, playlistIndex,
            tracks => insertedAt(tracks.filter((_, index) => index !== oldIndex), newIndex, track))
        this._applyEdit(next, `Reordered track in ${playlist.name}`)
    }

    removeTrack(playlistIndex, trackIndex) {
        const playlists = playlistsStore.getPlaylists()
        const playlist = playlists[playlistIndex]
        const removedTrack = playlist?.tracks?.[trackIndex]
        if (!removedTrack) return

        const next = withTracks(playlists, playlistIndex, tracks => tracks.filter((_, index) => index !== trackIndex))
        this._applyEdit(next, `Removed "${removedTrack.title}" from ${playlist.name}`)
    }

    /**
     * Take a whole playlist out of the working set (the saved batch changes only on save).
     * @returns {Object|null} the playlist removed
     */
    removePlaylist(playlistIndex) {
        const playlists = playlistsStore.getPlaylists()
        const removed = playlists[playlistIndex]
        if (!removed) return null

        this._applyEdit(playlists.filter((_, index) => index !== playlistIndex), `Removed playlist ${removed.name}`)
        return removed
    }

    /**
     * Give a playlist of the working set the title the person typed. The title is the playlist's
     * own (`name` and `title`, the two fields the screens, the save and the exports read), so it
     * is saved with the batch and comes back when the batch is opened again.
     * @returns {boolean} false when there is no such playlist, or the title is empty or the same
     */
    renamePlaylist(playlistIndex, typedTitle) {
        const playlists = playlistsStore.getPlaylists()
        const playlist = playlists[playlistIndex]
        const title = (typedTitle || '').trim()
        if (!playlist || !title || title === (playlist.title || playlist.name)) return false

        const next = playlists.map((item, index) => (index === playlistIndex ? { ...item, name: title, title } : item))
        this._applyEdit(next, `Renamed ${playlist.name} to ${title}`)
        return true
    }

    /** One edit: a step of the history, then the screen. */
    _applyEdit(next, description) {
        const seriesId = playlistsStore.getSeriesId()
        this._followScreen()
        this.history.createSnapshot(next, seriesId, description)
        this._show(next, seriesId)
    }

    /** Show a set this service produced (an edit, an undo, a redo) and say what follows from it. */
    _show(playlists, seriesId) {
        this._followed = playlists
        playlistsStore.setPlaylists(playlists, seriesId)
        playlistsStore.setDirty(this._dirtyAtStart || this.history.getStats().index > 0)
        playlistsStore.setSynchronized(false)
        this.updateUndoState()
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

    // ========== UNDO / REDO ==========
    //
    // The history holds the steps of ONE set of playlists: the one this service last showed. Its
    // first step is that set as it came to the screen (generated, restored, or a saved batch
    // opened), so the first edit can be undone. Whoever puts another set on screen (the blend,
    // "generate again", opening a batch, a save) makes the history start again: a step of another
    // set is never brought back. What the buttons read is the store (`canUndo`, `canRedo`).

    createSnapshot(playlists, seriesId, description) {
        this.history.createSnapshot(playlists, seriesId, description)
        this.updateUndoState()
    }

    /**
     * Make the history follow the set on screen. When that set is not the one this service last
     * showed, the history starts again from it.
     * @returns {boolean} whether the history was started again
     */
    _followScreen() {
        const onScreen = playlistsStore.getPlaylists()
        if (onScreen === this._followed) return false
        this._startHistory(onScreen, playlistsStore.getSeriesId(), 'As it came to the screen')
        return true
    }

    /** The history of a set starts at the set itself, with the unsaved work it already carried. */
    _startHistory(playlists, seriesId, description) {
        this.history.clear()
        this.history.createSnapshot(playlists, seriesId, description)
        this._followed = playlists
        this._dirtyAtStart = playlistsStore.getState().isDirty === true
    }

    undo() {
        return this._travel(() => this.history.undo())
    }

    redo() {
        return this._travel(() => this.history.redo())
    }

    /** One step back or forward, when the history is of the set on screen and has that step. */
    _travel(step) {
        const restarted = this._followScreen()
        const state = restarted ? null : step()
        if (!state) {
            if (restarted) this.updateUndoState()
            return false
        }
        this._show(state.playlists, state.seriesId)
        return true
    }

    updateUndoState() {
        const stats = this.history.getStats()
        const current = playlistsStore.getState()
        if (current.canUndo === !!stats.canUndo && current.canRedo === !!stats.canRedo) return
        playlistsStore.setUndoState(!!stats.canUndo, !!stats.canRedo)
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
     * Keep the draft and the history in step with the store, whoever changes it (the blend screen
     * writes the generated playlists straight into the store). Changes made in the same turn are
     * handled once.
     * @returns {Function} stops watching
     */
    watchStore() {
        let scheduled = false
        return playlistsStore.subscribe(() => {
            if (scheduled) return
            scheduled = true
            queueMicrotask(() => {
                scheduled = false
                // another set on screen: the buttons of undo and redo answer for it, not for the old one
                if (this._followScreen()) this.updateUndoState()
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

        const draft = this._draftFor(seriesId)
        if (!draft) return false

        playlistsStore.setMode('CREATING')
        playlistsStore.setEditContext(null)
        playlistsStore.setConfig(draft.config || {})
        playlistsStore.setBatchName(draft.batchName || '')
        playlistsStore.setDefaultBatchName(draft.defaultBatchName || null)
        playlistsStore.setPlaylists(draft.playlists, draft.seriesId)
        playlistsStore.setDirty(draft.isDirty === true)
        playlistsStore.setSynchronized(false)
        this._startHistory(draft.playlists, draft.seriesId, 'Restored after reload')
        this.updateUndoState()
        console.log(`[PlaylistsService] Restored ${draft.playlists.length} unsaved playlists of series ${draft.seriesId}`)

        return true
    }

    /** The draft kept in the browser, when it is whole, of this person and of this series; else null. */
    _draftFor(seriesId) {
        const draft = this.storage.load(STORAGE_KEY)
        const whole = !!draft && Array.isArray(draft.playlists) && draft.playlists.length > 0 && !!draft.seriesId
        if (!whole) return null
        if (!draft.userId || draft.userId !== this.currentUserId()) return null // someone else's, or from an older version
        if (seriesId && draft.seriesId !== seriesId) return null
        return draft
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
     * @param {string} [params.userId] - whose series; the person signed in when not given
     * @param {string} params.batchName - see resolveBatchName
     * @returns {Promise<{status: 'saved'|'already-saving', batchName?: string, seriesId?: string, playlists?: Array}>}
     * @throws when there is no name to save under, or the write fails (nothing was changed)
     */
    async saveCurrentBatch({ userId = this.signedInUserId(), batchName } = {}) {
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

        this._showSaved(stored, batchName, seriesId, savedAt)
        return { status: 'saved', batchName, seriesId, playlists: stored }
    }

    /**
     * The saved batch is now the one being edited (also after a rename: the next save replaces
     * the new name), with nothing left to save, and it is the new starting point of the history.
     */
    _showSaved(stored, batchName, seriesId, savedAt) {
        const onScreen = stored.map(playlist => ({ ...playlist, updatedAt: savedAt }))
        playlistsStore.setPlaylists(onScreen, seriesId)
        this.setEditMode(batchName, seriesId, savedAt)
        playlistsStore.setDirty(false)
        playlistsStore.setSynchronized(true)
        this._startHistory(onScreen, seriesId, 'Saved')
        this.updateUndoState()
        this.saveToLocalStorage()
    }

    // ========== FIRESTORE CRUD ==========

    /**
     * The playlists of one saved batch of a series of the person signed in, in the order they
     * were saved. It only reads: what goes on screen is decided by who asked.
     * @param {string} seriesId
     * @param {string} batchName
     * @returns {Promise<Array>} empty when the series has no batch of that name
     */
    async findBatch(seriesId, batchName) {
        const wanted = batchName.trim()
        const all = await this.playlistRepositoryFor(this.signedInUserId(), seriesId).findAll()
        return all
            .filter(playlist => playlist.batchName && playlist.batchName.trim() === wanted)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
    }

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
        playlistsStore.setPlaylists(playlists, seriesId)
        playlistsStore.setDirty(false)
        playlistsStore.setSynchronized(false)
        this._startHistory(playlists, seriesId, 'Initial generation')
        this.updateUndoState()
        this.saveToLocalStorage()
    }

    reset() {
        this.history.clear()
        this._followed = null
        this._dirtyAtStart = false
        this.clearLocalStorage()
        playlistsStore.reset()
    }
}
