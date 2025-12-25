import {
    serverTimestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    writeBatch
} from 'firebase/firestore'

/**
 * Base repository class for Firestore interactions (Modular SDK)
 */
export class BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {Object} cache - Cache manager instance
     */
    constructor(firestore, cache) {
        if (this.constructor === BaseRepository) {
            throw new Error('BaseRepository is abstract and cannot be instantiated directly')
        }

        this.db = firestore
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
        return collection(this.db, this.collectionPath)
    }

    /**
     * Get document reference (modular)
     * @param {string} id - Document ID
     * @returns {DocumentReference}
     * @protected
     */
    getDocRef(id) {
        return doc(this.db, this.collectionPath, id)
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
        const docSnap = await getDoc(this.getDocRef(id))
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
                constraints.push(where(field, op, value))
            })
        }

        // Apply orderBy
        if (filters.orderBy) {
            const [field, direction = 'asc'] = filters.orderBy
            constraints.push(orderBy(field, direction))
        }

        // Apply limit
        if (filters.limit) {
            constraints.push(limit(filters.limit))
        }

        const q = query(this.getCollection(), ...constraints)
        const snapshot = await getDocs(q)

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
        const docRef = doc(this.getCollection())

        if (batch) {
            batch.set(docRef, docData)
        } else {
            await setDoc(docRef, docData)
        }

        // Invalidate 'all' cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey('all'))
        }

        return docRef.id
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
            await setDoc(docRef, docData, { merge: true })
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

        await updateDoc(this.getDocRef(id), updateData)

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
            await deleteDoc(docRef)
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
        const batch = writeBatch(this.db)

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
        return serverTimestamp()
    }

    /**
     * Check if document exists
     * @param {string} id - Document ID
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        const docSnap = await getDoc(this.getDocRef(id))
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
