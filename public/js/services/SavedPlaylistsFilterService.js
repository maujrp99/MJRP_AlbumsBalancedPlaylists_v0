/**
 * SavedPlaylistsFilterService.js
 * 
 * Logic for filtering and sorting Saved Series.
 * Uses Generic FilterUtils.
 */

import { FilterUtils } from '../utils/FilterUtils.js'

export const SavedPlaylistsFilterService = {

    /**
     * Filter and Sort Series list.
     * @param {Array} seriesList - List of Series objects
     * @param {Object} criteria - Filter criteria
     * @param {string} criteria.search - Search query
     * @param {string} criteria.seriesId - Exact Series ID Match (Dropdown)
     * @param {string} criteria.batchName - Exact Batch Name Match (Dropdown)
     * @param {string} criteria.sort - Sort key ('updated_desc', 'name_asc', 'name_desc')
     * @returns {Array} Filtered and Sorted list
     */
    filterSeries(seriesList, criteria = {}) {
        if (!seriesList || !Array.isArray(seriesList)) return []

        let filtered = [...seriesList]

        // 1. Text Search (Name)
        if (criteria.search) {
            filtered = filtered.filter(series =>
                FilterUtils.textMatch(series, ['name'], criteria.search)
                // TODO: Add batch name search? 
                // The current structure of series puts batches inside.
                // If we want to search by batch name, we'd need to check if any batch matches.
                || (series.batches && series.batches.some(b => FilterUtils.textMatch(b, ['name'], criteria.search)))
            )
        }

        // 2. Series Dropdown (Exact Match)
        if (criteria.seriesId && criteria.seriesId !== 'all') {
            filtered = filtered.filter(s => String(s.id) === String(criteria.seriesId))
        }

        // 3. Batch Dropdown (Exact Match)
        if (criteria.batchName && criteria.batchName !== 'all') {
            // Check if series contains the batch
            filtered = filtered.filter(s =>
                s.batches && s.batches.some(b => b.name === criteria.batchName)
            )
        }

        // 4. Sorting
        const sortKey = criteria.sort || 'updated_desc'

        switch (sortKey) {
            case 'name_asc':
                filtered.sort((a, b) => FilterUtils.sortBy(a, b, 'name', 'asc'))
                break
            case 'name_desc':
                filtered.sort((a, b) => FilterUtils.sortBy(a, b, 'name', 'desc'))
                break
            case 'updated_desc':
            default:
                filtered.sort((a, b) => FilterUtils.dateSort(a, b, 'updatedAt', 'desc'))
                break
        }

        return filtered
    },

    /**
     * Get unique generic values for dropdowns
     * @param {Array} seriesList 
     * @returns {Object} { seriesNames: [], batchNames: [] }
     */
    getDropdownOptions(seriesList) {
        if (!seriesList) return { seriesOptions: [], batchOptions: [] }

        // Series Options
        const seriesOptions = seriesList.map(s => ({ value: s.id, label: s.name }))

        // Batch Options (Deep extraction)
        const batchSet = new Set()
        seriesList.forEach(s => {
            if (s.batches) {
                s.batches.forEach(b => {
                    if (b.name) batchSet.add(b.name)
                })
            }
        })
        const batchOptions = Array.from(batchSet).sort().map(name => ({ value: name, label: name }))

        return { seriesOptions, batchOptions }
    }
}
