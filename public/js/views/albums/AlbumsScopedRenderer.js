/**
 * AlbumsScopedRenderer
 * Renders albums grouped by series for "All Series" view
 * Part of Sprint 10 refactoring (AlbumsView modularization)
 */

import { getIcon } from '../../components/Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'

// Internal helper: wrap content in grid
function wrapInGrid(content) {
    return `
    <div class="albums-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      ${content}
    </div>`
}

/**
 * Group albums by series using fuzzy matching
 * @param {Array} albums - Array of album objects
 * @param {Array} seriesList - Array of series objects
 * @returns {Object} { seriesGroups: Map, otherAlbums: Array }
 */
function groupAlbumsBySeries(albums, seriesList) {
    const seriesGroups = new Map()

    // Initialize groups for all series to ensure order
    seriesList.forEach(series => {
        seriesGroups.set(series.id, {
            series: series,
            albums: []
        })
    })

    // "Other" bucket for albums not found in any series
    const otherAlbums = []

    albums.forEach(album => {
        let found = false

        // 1. Strict Match via Series ID (Context-Aware Architecture)
        if (album.seriesIds && Array.isArray(album.seriesIds)) {
            for (const series of seriesList) {
                if (album.seriesIds.includes(series.id)) {
                    const group = seriesGroups.get(series.id)
                    if (group) group.albums.push(album)
                    found = true
                    // Continue checking other series? An album can be in multiple. 
                    // But here we just want to ensure it's in at least one.
                    // Actually, if we want multi-series display, we shouldn't break.
                    // BUT, duplicates in "All Series" view might be confusing if not handled.
                    // The current UI design likely renders strict blocks. 
                    // Let's allow multi-grouping because the model supports it.
                }
            }
            if (found) return; // Skip fuzzy fallbacks if strict match worked
        }

        // 2. Legacy Fuzzy Match (Fallback for old cached albums without context)
        // Only run if strict match failed to find ANY series
        for (const series of seriesList) {
            const queries = series.albumQueries || []
            // Bidirectional fuzzy matching - handle both string and object formats
            const match = queries.some(q => {
                // albumQueries can be string ("Artist - Album") or object ({ artist, album })
                const queryStr = typeof q === 'string' ? q : (q.album || q.title || '');
                if (!queryStr) return false;

                const qNorm = queryStr.toLowerCase();
                const aNorm = album.title.toLowerCase();
                return qNorm.includes(aNorm) || aNorm.includes(qNorm);
            })

            if (match) {
                const group = seriesGroups.get(series.id)
                if (group) group.albums.push(album)
                found = true
                break
            }
        }
        if (!found) otherAlbums.push(album)
    })

    return { seriesGroups, otherAlbums }
}

/**
 * Render series group header with edit/delete buttons
 * @param {Object} series - Series object
 * @param {number} albumCount - Number of albums
 * @returns {string} HTML string
 */
function renderSeriesHeader(series, albumCount) {
    return `
    <div class="series-group-header flex items-center justify-between mb-6 pb-2 border-b border-white/10">
        <div class="flex items-center gap-4">
            <h2 class="text-2xl font-bold text-accent-primary">${escapeHtml(series.name)}</h2>
            <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                ${albumCount} albums
            </span>
        </div>
        <div class="series-actions flex gap-2">
            <button class="btn btn-secondary btn-sm btn-icon" data-action="edit-series" data-series-id="${series.id}" title="Edit Series">
                ${getIcon('Edit', 'w-4 h-4')}
            </button>
            <button class="btn btn-danger btn-sm btn-icon" data-action="delete-series" data-series-id="${series.id}" title="Delete Series">
                ${getIcon('Trash', 'w-4 h-4')}
            </button>
        </div>
    </div>`
}

/**
 * Render uncategorized albums header
 * @param {number} albumCount - Number of albums
 * @returns {string} HTML string
 */
function renderUncategorizedHeader(albumCount) {
    return `
    <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
        <h2 class="text-2xl font-bold text-gray-400">Uncategorized</h2>
        <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">
            ${albumCount} albums
        </span>
    </div>`
}

/**
 * Render Grouped Grid for "All Series" view (Compact Mode)
 * @param {Object} context - View context
 * @param {Array} context.albums - Filtered albums
 * @param {Array} context.seriesList - All series
 * @param {string} context.currentScope - 'SINGLE' or 'ALL'
 * @param {Function} context.renderAlbumsGrid - Grid renderer function
 * @returns {string} HTML string
 */
export function renderScopedGrid(context) {
    const { albums, seriesList, currentScope, renderAlbumsGrid } = context

    if (currentScope === 'SINGLE') {
        return wrapInGrid(renderAlbumsGrid(albums))
    }

    // "All Series" Grouping
    const { seriesGroups, otherAlbums } = groupAlbumsBySeries(albums, seriesList)

    let html = '<div class="all-series-container space-y-12">'

    // Render each series group
    seriesGroups.forEach(group => {
        if (group.albums.length === 0) return

        html += `
        <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5" data-series-id="${group.series.id}">
            ${renderSeriesHeader(group.series, group.albums.length)}
            ${wrapInGrid(renderAlbumsGrid(group.albums))}
        </div>`
    })

    // Render orphan albums
    if (otherAlbums.length > 0) {
        html += `
        <div class="series-group mt-12">
            ${renderUncategorizedHeader(otherAlbums.length)}
            ${wrapInGrid(renderAlbumsGrid(otherAlbums))}
        </div>`
    }

    html += '</div>'
    return html
}

/**
 * Render Grouped List for "All Series" view (Expanded Mode)
 * @param {Object} context - View context
 * @param {Array} context.albums - Filtered albums
 * @param {Array} context.seriesList - All series
 * @param {string} context.currentScope - 'SINGLE' or 'ALL'
 * @param {Function} context.renderExpandedList - Expanded list renderer function
 * @returns {string} HTML string
 */
export function renderScopedList(context) {
    const { albums, seriesList, currentScope, renderExpandedList } = context

    if (currentScope === 'SINGLE') {
        return renderExpandedList(albums)
    }

    // "All Series" Grouping
    const { seriesGroups, otherAlbums } = groupAlbumsBySeries(albums, seriesList)

    let html = '<div class="all-series-container space-y-12">'

    // Render each series group
    seriesGroups.forEach(group => {
        if (group.albums.length === 0) return

        html += `
        <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5" data-series-id="${group.series.id}">
            ${renderSeriesHeader(group.series, group.albums.length)}
            ${renderExpandedList(group.albums)}
        </div>`
    })

    // Render orphan albums
    if (otherAlbums.length > 0) {
        html += `
        <div class="series-group mt-12">
            ${renderUncategorizedHeader(otherAlbums.length)}
            ${renderExpandedList(otherAlbums)}
        </div>`
    }

    html += '</div>'
    return html
}
