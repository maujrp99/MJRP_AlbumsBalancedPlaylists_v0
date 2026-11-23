/**
 * SavedPlaylistsController
 *
 * What the saved playlists screen asks for and what it is told. The list is read by
 * SavedPlaylistsReader and kept in SavedPlaylistsStore (arch.md, "Leitura das playlists
 * guardadas", F61): this controller asks the reader, hands the screen what the store holds and
 * turns the person's actions (edit, delete, try again) into calls. It reads nothing itself and
 * knows no repository.
 *
 * @module controllers/SavedPlaylistsController
 * @since Sprint 15 (ARCH-12); the read moved to the reader in F61; moved from components/playlists to controllers (F83 wave 1,
 *   with the screen in React: it was never a component, and it was given a `view` it did not use)
 */

import { savedPlaylistsReader, savedPlaylistsStore } from '../services/playlists/savedPlaylistsReading.js'
import { getPlaylistsService } from '../services/playlists/playlistsWiring.js'
import { ListStatus, SeriesPlaylistsStatus as Status } from '../models/savedPlaylists.js'
import { router } from '../router.js'
import toast from '../stores/toasts.js'
import { t } from '../i18n/t.js'

/** A series is on the list when it has playlists to show or a failure to tell. */
const isListed = (entry) => entry.status === Status.READY || entry.status === Status.FAILED

export class SavedPlaylistsController {
    /**
     * @param {Object} [deps]
     * @param {Object} [deps.reader] - SavedPlaylistsReader
     * @param {import('../stores/savedPlaylists.js').SavedPlaylistsStore} [deps.store] - SavedPlaylistsStore
     */
    constructor({ reader = savedPlaylistsReader, store = savedPlaylistsStore } = {}) {
        this.reader = reader
        this.store = store
    }

    // ========== THE LIST ==========

    /** Ask for the list. A load already on its way is joined; what was read before stays on screen. */
    open() {
        return this.reader.load()
    }

    /** Read everything again (the Refresh button, "try again" on a list that failed). */
    reload() {
        return this.reader.load({ fresh: true })
    }

    /** Read the playlists of one series again. */
    retrySeries(seriesId) {
        return this.reader.refreshSeries(seriesId)
    }

    /**
     * Be told when the list changes.
     * @param {Function} listener
     * @returns {Function} unsubscribe
     */
    subscribe(listener) {
        return this.store.subscribe(listener)
    }

    /**
     * What the screen draws now.
     * @returns {{ status: string, error: string|null, busy: boolean, summary: Object, groups: Array<Object> }}
     *   `groups` are the store's entries of the series that have playlists or a failure, in the
     *   order of the list; an entry that is the same object has not changed.
     */
    getList() {
        return {
            status: this.store.getListStatus(),
            error: this.store.getListError(),
            busy: this.store.isBusy(),
            summary: this.store.getSummary(),
            groups: this.store.getEntries().filter(isListed)
        }
    }

    /** True until the first answer about the list of series arrives. */
    isFirstLoad() {
        const status = this.store.getListStatus()
        const waiting = status === ListStatus.IDLE || status === ListStatus.LOADING
        return waiting && this.store.getEntries().length === 0
    }

    /** A playlist on the list, by series and id; null when it is not there. */
    findPlaylist(seriesId, playlistId) {
        const playlists = this.store.getEntry(seriesId)?.playlists || []
        return playlists.find(playlist => playlist.id === playlistId) || null
    }

    // ========== NAVIGATION ==========

    async editBatch(seriesId, batchName, savedAt) {
        // Set context in store so PlaylistsView knows we are editing
        getPlaylistsService().setEditMode(batchName, seriesId, savedAt)

        // Legacy PlaylistsController expects 'edit' param to trigger initialization
        const encodedName = encodeURIComponent(batchName)
        router.navigate(`/playlists/edit?seriesId=${seriesId}&edit=${encodedName}`)
    }

    navigateBlend() {
        router.navigate('/blend')
    }

    openSeriesManager(seriesId) {
        router.navigate(`/albums?seriesId=${seriesId}`)
    }

    // ========== DELETES ==========

    /** Delete one batch; only its series is read again. */
    async deleteBatch(seriesId, batchName) {
        try {
            await this.reader.removeBatch(seriesId, batchName)
            toast.success(t('savedPlaylists.toast.deletedBatch', { name: batchName }))
            return true
        } catch (error) {
            toast.error(t('savedPlaylists.toast.deleteBatchFailed'))
            console.error('[SavedPlaylistsController] deleteBatch failed:', error)
            return false
        }
    }

    /** Delete every saved playlist of a series; the series and its albums stay. */
    async deleteAllPlaylists(seriesId, seriesName) {
        try {
            await this.reader.removeAll(seriesId)
            toast.success(t('savedPlaylists.toast.deletedAll', { name: seriesName }))
            return true
        } catch (error) {
            toast.error(t('savedPlaylists.toast.deleteAllFailed'))
            console.error('[SavedPlaylistsController] deleteAllPlaylists failed:', error)
            return false
        }
    }
}
