import { requireStore } from './store.js'

/** How many writes one Firestore batch holds. */
export const MAX_BATCH_WRITES = 500

/**
 * Base repository class for Firestore interactions (Modular SDK).
 *
 * F78, REQ-09 (Ref-A): it lives in the shared core and imports no Firestore. It is given a store
 * (shared/data/store.js): the database and the functions of the side's Firestore SDK, called with
 * the same arguments the modular Firebase JS SDK takes. The site gives the Firebase JS SDK's
 * (public/js/repositories/firestoreStore.js).
 */
export class BaseRepository {
    /**
     * @param {import('./store.js').Store} store - the database and the Firestore functions of the side
     * @param {Object} cache - Cache manager instance
     */
    constructor(store, cache) {
        if (this.constructor === BaseRepository) {
            throw new Error('BaseRepository is abstract and cannot be instantiated directly')
        }

        this.store = requireStore(store)
        this.db = store.db
        this.cache = cache
        this.collectionPath = null // Must be set by subclass as string path
        this.schemaVersion = 1 // Override in subclass if needed
    }

    /**
     * Get collection reference (modular)
     * @returns {CollectionReference}
     * @protected
     */
    getCollection() {
        if (!this.collectionPath) {
            throw new Error('Collection path not set in repository')
        }
        return this.store.collection(this.db, this.collectionPath)
    }

    /**
     * Get document reference (modular)
     * @param {string} id - Document ID
     * @returns {DocumentReference}
     * @protected
     */
    getDocRef(id) {
        return this.store.doc(this.db, this.collectionPath, id)
    }

    /**
     * Get cache key for a document
     * @param {string} id - Document ID or 'all' for collection
     * @returns {string} Cache key
     * @protected
     */
    getCacheKey(id) {
        if (!this.collectionPath) {
            throw new Error('Collection path not set in repository')
        }
        return `${this.collectionPath}:${id}`
    }

    // ========== READ OPERATIONS ==========

    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object|null>} Document data or null if not found
     */
    async findById(id) {
        // Try cache first
        const cacheKey = this.getCacheKey(id)
        const cached = await this.cache?.get(cacheKey)
        if (cached) {
            return cached
        }

        // Fetch from Firestore
        const docSnap = await this.store.getDoc(this.getDocRef(id))
        if (!docSnap.exists()) {
            return null
        }

        const data = { id: docSnap.id, ...docSnap.data() }

        // Cache result
        if (this.cache) {
            await this.cache.set(cacheKey, data)
        }

        return data
    }

    /**
     * Find all documents (with optional filters)
     * @param {Object} filters - Optional query filters
     * @returns {Promise<Array>} Array of documents
     */
    async findAll(filters = {}) {
        const constraints = []

        // Apply where filters
        if (filters.where) {
            filters.where.forEach(([field, op, value]) => {
                constraints.push(this.store.where(field, op, value))
            })
        }

        // Apply orderBy
        if (filters.orderBy) {
            const [field, direction = 'asc'] = filters.orderBy
            constraints.push(this.store.orderBy(field, direction))
        }

        // Apply limit
        if (filters.limit) {
            constraints.push(this.store.limit(filters.limit))
        }

        const q = this.store.query(this.getCollection(), ...constraints)
        const snapshot = await this.store.getDocs(q)

        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }))
    }

    /**
     * Find documents by field value
     * @param {string} fieldName - Field name
     * @param {any} value - Field value
     * @returns {Promise<Array>} Matching documents
     */
    async findByField(fieldName, value) {
        return this.findAll({
            where: [[fieldName, '==', value]]
        })
    }

    // ========== CREATE OPERATION ==========

    /**
     * Create new document
     * @param {Object} data - Document data
     * @param {WriteBatch} [batch] - Optional Firestore write batch
     * @returns {Promise<string>} Created document ID
     */
    async create(data, batch = null) {
        const docData = {
            ...data,
            createdAt: this.getServerTimestamp(),
            _schemaVersion: this.schemaVersion
        }

        // Generate a new reference (auto-ID)
        const docRef = this.store.doc(this.getCollection())

        if (batch) {
            batch.set(docRef, docData)
        } else {
            await this.store.setDoc(docRef, docData)
        }

        // Invalidate 'all' cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey('all'))
        }

        return docRef.id
    }

    /**
     * Create many documents in ONE write: all of them are stored, or none is (a Firestore batch).
     * A batch holds MAX_BATCH_WRITES writes: a longer list is refused, the caller sends it in parts.
     * @param {Object[]} dataList - the data of each document
     * @returns {Promise<string[]>} the ids of the created documents, in the order given
     */
    async createMany(dataList) {
        if (dataList.length === 0) return []
        if (dataList.length > MAX_BATCH_WRITES) {
            throw new Error(`Too many documents for one write: ${dataList.length} (a batch holds ${MAX_BATCH_WRITES})`)
        }

        const batch = this.store.writeBatch(this.db)
        const ids = dataList.map(data => {
            const docRef = this.store.doc(this.getCollection())
            batch.set(docRef, { ...data, createdAt: this.getServerTimestamp(), _schemaVersion: this.schemaVersion })
            return docRef.id
        })
        await batch.commit()

        if (this.cache) await this.cache.invalidate(this.getCacheKey('all'))
        return ids
    }

    /**
     * Update many existing documents in ONE write: all of them change, or none does (a Firestore
     * batch). A document that does not exist makes the write fail: this never creates. A batch
     * holds MAX_BATCH_WRITES writes: a longer list is refused, the caller sends it in parts.
     * @param {Array<{ id: string, data: Object }>} updates - the fields to change in each document
     * @returns {Promise<string[]>} the ids of the updated documents, in the order given
     */
    async updateMany(updates) {
        if (updates.length === 0) return []
        if (updates.length > MAX_BATCH_WRITES) {
            throw new Error(`Too many documents for one write: ${updates.length} (a batch holds ${MAX_BATCH_WRITES})`)
        }

        const batch = this.store.writeBatch(this.db)
        updates.forEach(({ id, data }) => batch.update(this.getDocRef(id), { ...data, updatedAt: this.getServerTimestamp() }))
        await batch.commit()

        if (this.cache) {
            await Promise.all([
                ...updates.map(({ id }) => this.cache.invalidate(this.getCacheKey(id))),
                this.cache.invalidate(this.getCacheKey('all'))
            ])
        }
        return updates.map(({ id }) => id)
    }

    // ========== UPSERT OPERATION ==========

    /**
     * Create or update document with specific ID (Upsert)
     * @param {string} id - Document ID
     * @param {Object} data - Document data
     * @param {WriteBatch} [batch] - Optional Firestore write batch
     * @returns {Promise<string>} Document ID
     */
    async save(id, data, batch = null) {
        const docData = {
            ...data,
            updatedAt: this.getServerTimestamp(),
            _schemaVersion: this.schemaVersion
        }

        const docRef = this.getDocRef(id)

        if (batch) {
            batch.set(docRef, docData, { merge: true })
        } else {
            await this.store.setDoc(docRef, docData, { merge: true })
        }

        // Invalidate cache
        if (this.cache) {
            if (!batch) {
                // Only invalidate immediately if not batched (or invalidate optimistic? 
                // For batch, we might want to defer invalidation, but for now we'll do it here assuming the caller commits)
                // Actually, best practice for batch is to NOT await side effects that rely on commit.
                // But cache invalidation is safe to do "optimistically" or "eagerly" usually, 
                // though strictly it should be after commit. 
                // Given the constraints, we will leave cache invalidation here as it's just clearing keys.
                await this.cache.invalidate(this.getCacheKey(id))
                await this.cache.invalidate(this.getCacheKey('all'))
            } else {
                // Queue cache invalidation? Or just do it? 
                // Doing it here is fine, it just means next read might miss cache. Refetching is safer.
                await this.cache.invalidate(this.getCacheKey(id))
                await this.cache.invalidate(this.getCacheKey('all'))
            }
        }

        return id
    }

    // ========== UPDATE OPERATION ==========

    /**
     * Update existing document
     * @param {string} id - Document ID
     * @param {Object} data - Fields to update
     * @returns {Promise<string>} Updated document ID
     */
    async update(id, data) {
        const updateData = {
            ...data,
            updatedAt: this.getServerTimestamp()
        }

        await this.store.updateDoc(this.getDocRef(id), updateData)

        // Invalidate cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey(id))
            await this.cache.invalidate(this.getCacheKey('all'))
        }

        return id
    }

    // ========== DELETE OPERATIONS ==========

    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const docRef = this.getDocRef(id)
        console.log('[BaseRepository.delete] Deleting document:', {
            id,
            path: docRef.path,
            collectionPath: this.collectionPath
        })

        try {
            await this.store.deleteDoc(docRef)
            console.log('[BaseRepository.delete] deleteDoc successful for:', docRef.path)
        } catch (error) {
            console.error('[BaseRepository.delete] deleteDoc FAILED:', error)
            throw error
        }

        // Invalidate cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey(id))
            await this.cache.invalidate(this.getCacheKey('all'))
        }
    }

    /**
     * Delete multiple documents (batch operation)
     * @param {string[]} ids - Array of document IDs
     * @returns {Promise<void>}
     */
    async deleteMany(ids) {
        const batch = this.store.writeBatch(this.db)

        ids.forEach(id => {
            batch.delete(this.getDocRef(id))
        })

        await batch.commit()

        // Invalidate cache
        if (this.cache) {
            await Promise.all([
                ...ids.map(id => this.cache.invalidate(this.getCacheKey(id))),
                this.cache.invalidate(this.getCacheKey('all'))
            ])
        }
    }

    // ========== HELPERS ==========

    /**
     * Get Firestore server timestamp
     * @returns {FieldValue}
     * @protected
     */
    getServerTimestamp() {
        return this.store.serverTimestamp()
    }

    /**
     * Check if document exists
     * @param {string} id - Document ID
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        const docSnap = await this.store.getDoc(this.getDocRef(id))
        return docSnap.exists()
    }

    /**
     * Count documents (with optional filters)
     * @param {Object} filters - Optional query filters
     * @returns {Promise<number>}
     */
    async count(filters = {}) {
        const docs = await this.findAll(filters)
        return docs.length
    }
}
