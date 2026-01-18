/**
 * FilterUtils.js
 * 
 * Generic utilities for filtering and sorting collections.
 * Used by SeriesFilterService (Albums) and SavedPlaylistsFilterService (Series).
 */

export const FilterUtils = {

    /**
     * Normalize string for search (lowercase, trim).
     * @param {string} str 
     * @returns {string}
     */
    normalize(str) {
        if (!str) return ''
        return String(str).toLowerCase().trim()
    },

    /**
     * Check if item matches text query across multiple fields.
     * @param {Object} item - The object to check
     * @param {string[]} fields - Fields to search in (e.g. ['title', 'artist'])
     * @param {string} query - The search query
     * @returns {boolean}
     */
    textMatch(item, fields, query) {
        if (!query) return true
        const normalizedQuery = this.normalize(query)
        if (!normalizedQuery) return true

        return fields.some(field => {
            const value = this.getNestedValue(item, field)
            return this.normalize(value).includes(normalizedQuery)
        })
    },

    /**
     * Safely get nested value from object (dot notation).
     * @param {Object} item 
     * @param {string} path 
     * @returns {any}
     */
    getNestedValue(item, path) {
        if (!path) return undefined
        return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, item)
    },

    /**
     * Generic Sort function.
     * @param {Object} a 
     * @param {Object} b 
     * @param {Function|string} getter - Field name or getter function
     * @param {'asc'|'desc'} direction 
     * @returns {number}
     */
    sortBy(a, b, getter, direction = 'asc') {
        const valA = typeof getter === 'function' ? getter(a) : this.getNestedValue(a, getter)
        const valB = typeof getter === 'function' ? getter(b) : this.getNestedValue(b, getter)

        if (valA === valB) return 0

        // Handle nulls always last
        if (valA === null || valA === undefined) return 1
        if (valB === null || valB === undefined) return -1

        let result = 0
        if (valA < valB) result = -1
        if (valA > valB) result = 1

        return direction === 'asc' ? result : -result
    },

    /**
     * Generic Date Sort.
     * @param {Object} a 
     * @param {Object} b 
     * @param {string} dateField 
     * @param {'asc'|'desc'} direction 
     */
    dateSort(a, b, dateField, direction = 'desc') {
        const dateA = new Date(this.getNestedValue(a, dateField) || 0)
        const dateB = new Date(this.getNestedValue(b, dateField) || 0)

        return direction === 'asc' ? dateA - dateB : dateB - dateA
    }
}
