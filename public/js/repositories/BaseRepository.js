import { serverTimestamp } from 'firebase/firestore'

/**
 * Base repository class for Firestore interactions
 */
export class BaseRepository {
    /**
     * @param {firebase.firestore.Firestore} firestore - Firestore instance
     * @param {Object} cache - Cache manager instance
     */
    constructor(firestore, cache) {
        if (this.constructor === BaseRepository) {
            throw new Error('BaseRepository is abstract and cannot be instantiated directly')
        }

        this.db = firestore
        this.cache = cache
        this.collection = null // Must be set by subclass
        this.schemaVersion = 1 // Override in subclass if needed
    }

    /**
     * Get cache key for a document
     * @param {string} id - Document ID or 'all' for collection
     * @returns {string} Cache key
     * @protected
     */
    getCacheKey(id) {
        if (!this.collection) {
            throw new Error('Collection path not set in repository')
        }
        return `${this.collection.path}:${id}`
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
        const doc = await this.collection.doc(id).get()
        if (!doc.exists) {
            return null
        }

        const data = { id: doc.id, ...doc.data() }

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
        let query = this.collection

        // Apply filters
        if (filters.where) {
            filters.where.forEach(([field, op, value]) => {
                query = query.where(field, op, value)
            })
        }

        if (filters.orderBy) {
            const [field, direction = 'asc'] = filters.orderBy
            query = query.orderBy(field, direction)
        }

        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        const snapshot = await query.get()
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
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
     * @returns {Promise<string>} Created document ID
     */
    async create(data) {
        const docData = {
            ...data,
            createdAt: this.getServerTimestamp(),
            _schemaVersion: this.schemaVersion
        }

        const docRef = await this.collection.add(docData)

        // Invalidate 'all' cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey('all'))
        }

        return docRef.id
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

        await this.collection.doc(id).update(updateData)

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
        await this.collection.doc(id).delete()

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
        const batch = this.db.batch()

        ids.forEach(id => {
            batch.delete(this.collection.doc(id))
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
     * @returns {firebase.firestore.FieldValue}
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
        const doc = await this.collection.doc(id).get()
        return doc.exists
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
