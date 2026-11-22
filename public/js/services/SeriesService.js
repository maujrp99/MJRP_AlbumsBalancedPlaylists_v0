/**
 * SeriesService.js
 * 
 * Service layer for ALL album series operations:
 * - CRUD (create, update, delete series)
 * - Album management (add, remove albums of a series; the albums themselves are loaded by the
 *   album load, services/albums/, never here)
 * - LocalStorage persistence
 * - User context management
 * 
 * Extracted from AlbumSeriesStore (Sprint 19).
 */

import { SeriesRepository } from '@shared/data/SeriesRepository.js'
import { firestoreStore } from '../repositories/firestoreStore.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { cacheManager } from '../cache/CacheManager.js'
import { StorageService } from './infra/StorageService.js'
import { UserSyncService } from './auth/UserSyncService.js'
import { alreadyAskedFor, indexOfQueryFor } from '../models/askedAlbum.js'
import { track } from './usage/track.js'

const STORAGE_KEY = 'series' // prefix will be added

export class SeriesService {
    constructor(db, userId, storageService, userSyncService) {
        this.db = db
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(firestoreStore(db), cacheManager, this.userId)

        // Dependencies
        this.storage = storageService || new StorageService()
        this.userSync = userSyncService || new UserSyncService()

        // Update store context
        albumSeriesStore.setDb(db)
        albumSeriesStore.setUserId(this.userId)
    }

    // ========== CONTEXT MANAGEMENT ==========

    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(firestoreStore(this.db), cacheManager, this.userId)
        albumSeriesStore.setUserId(this.userId)
    }

    async handleUserChange(state) {
        const newUser = state.currentUser
        const newUserId = newUser ? newUser.uid : 'anonymous-user'
        const currentUserId = albumSeriesStore.getUserId()

        await this.userSync.handleUserChange(newUser, currentUserId, async () => {
            // Migration Callback
            if (albumSeriesStore.getSeries().length > 0) {
                const seriesToMigrate = [...albumSeriesStore.getSeries()]
                console.log(`[SeriesService] Found ${seriesToMigrate.length} series to migrate`)

                // We need to temporarily set the new ID to perform the save, managed by repo
                // Actually relying on UserSyncService to orchestrate this via DataSyncService
                // But for now, we'll keep the logic local but cleaner
                this.setUserId(newUserId)
                const count = await this.userSync.migrateSeries(this.repository, seriesToMigrate)
                if (count > 0) await this.loadFromFirestore()
            }
        })

        // If simply switching user without migration
        if (currentUserId !== newUserId && currentUserId !== 'anonymous-user') {
            this.setUserId(newUserId)
            await this.loadFromFirestore().catch(err => console.error('Reload failed:', err))
        }
    }

    // ========== CRUD ==========

    async createSeries(seriesData) {
        const series = {
            name: seriesData.name || 'Untitled Series',
            albumQueries: seriesData.albumQueries || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: seriesData.status || 'pending',
            notes: seriesData.notes || ''
        }

        const id = await this.repository.create(series)
        series.id = id

        albumSeriesStore.addSeries(series)
        albumSeriesStore.setActiveSeries(id)
        this.saveToLocalStorage()
        track('series_created', { album_count: series.albumQueries.length })

        return series
    }

    async updateSeries(id, updates) {
        await this.repository.update(id, { ...updates, updatedAt: new Date() })
        albumSeriesStore.updateSeriesById(id, updates)
        this.saveToLocalStorage()
        track('series_edited', { album_count: updates.albumQueries?.length })

        // The albums on screen are not touched here: whoever shows the series asks the album
        // load again, and it reconciles (an album added loads, an album removed leaves).
    }

    /**
     * What a series has saved under it, to tell the person before the series is deleted
     * @param {string} id
     * @returns {Promise<{playlists: number, batches: number}>}
     */
    async countSavedPlaylists(id) {
        const playlists = await this.repository.findPlaylists(id)
        const batches = new Set(playlists.map(playlist => playlist.batchName || 'Saved Playlists'))
        return { playlists: playlists.length, batches: batches.size }
    }

    /**
     * Delete a series and the playlists saved under it (one write: all of it or none of it)
     */
    async deleteSeries(id) {
        await this.repository.deleteWithPlaylists(id)
        albumSeriesStore.removeSeriesById(id)
        this.saveToLocalStorage()
        track('series_deleted')

        // The albums of the series leave the screen when the album load is asked again without it
    }

    async loadFromFirestore() {
        albumSeriesStore.setLoading(true)
        albumSeriesStore.setError(null)

        try {
            // Every series of the account. No limit: a cut at 20 hid the rest with no notice (UAT-24).
            // No orderBy in the query either: Firestore leaves out a document that lacks the ordered
            // field, so the order is applied here, where a series without a date still shows, last.
            const firestoreSeries = await this.repository.findAll({})

            const toDate = (value) => {
                if (!value) return null
                const date = value.toDate ? value.toDate() : new Date(value)
                return Number.isNaN(date.getTime()) ? null : date
            }
            const series = firestoreSeries
                .map(s => ({ ...s, createdAt: toDate(s.createdAt), updatedAt: toDate(s.updatedAt) }))
                .sort((a, b) => (b.updatedAt?.getTime() ?? -Infinity) - (a.updatedAt?.getTime() ?? -Infinity))

            albumSeriesStore.setSeries(series)
            this.saveToLocalStorage()
            return series
        } catch (error) {
            albumSeriesStore.setError(error.message)
            throw error
        } finally {
            albumSeriesStore.setLoading(false)
            albumSeriesStore.markRead() // the read ended, well or badly: the screens stop saying «loading»
        }
    }

    // ========== ALBUM MANAGEMENT ==========

    async addAlbumToSeries(seriesId, album) {
        const series = albumSeriesStore.getById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []

        // The series already asks for this album? Decided by the one identity rule (F55)
        const exists = alreadyAskedFor(albumQueries, album)

        if (!exists) {
            albumQueries.push({ id: album.id || null, title: album.title, artist: album.artist })
            // The album load reconciles the series: the new album is found and enriched through the queue
            await this.updateSeries(seriesId, { albumQueries })
        }
    }

    async removeAlbumFromSeries(seriesId, album) {
        const series = albumSeriesStore.getById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []

        // The query that keeps the id of the album is that album (legacy data). Otherwise the one
        // identity rule says which query asked for it (F55): no text is compared here.
        const byId = albumQueries.findIndex(query => !!query?.id && query.id === album.id)
        const matchIndex = byId !== -1 ? byId : indexOfQueryFor(albumQueries, album)

        if (matchIndex === -1) {
            throw new Error(`Could not find album "${album.title}" in series`)
        }

        albumQueries.splice(matchIndex, 1)
        await this.updateSeries(seriesId, { albumQueries })

        console.log(`[SeriesService] 🗑️ Successfully removed album "${album.title}" from series "${series.name}" (ID: ${seriesId})`)


    }



    async enrichAllAlbums(seriesId, onProgress) {
        // Stub - actual enrichment via dedicated enrichment services
        console.log(`[SeriesService] enrichAllAlbums called for ${seriesId}`)
        if (onProgress) onProgress({ current: 0, total: 0, status: 'pending' })
    }

    // ========== LOCALSTORAGE (Delegated) ==========

    saveToLocalStorage() {
        const series = albumSeriesStore.getSeries()
        this.storage.save(STORAGE_KEY, series)
    }

    loadFromLocalStorage() {
        const data = this.storage.load(STORAGE_KEY)
        if (data) {
            const series = data.map(s => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt)
            }))
            albumSeriesStore.setSeries(series)
            return true
        }
        return false
    }

    reset() {
        this.storage.remove(STORAGE_KEY)
        albumSeriesStore.reset()
    }
}

// Singleton factory
let _instance = null

export function getSeriesService(db, cacheManager, userId) {
    if (!_instance && db) {
        const storage = new StorageService()
        const userSync = new UserSyncService()
        _instance = new SeriesService(db, userId, storage, userSync)
    } else if (_instance && userId && _instance.userId !== userId) {
        _instance.setUserId(userId)
    }
    return _instance
}
