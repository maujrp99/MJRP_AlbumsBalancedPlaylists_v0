/**
 * SeriesGridHelper.js
 * 
 * Extracted from SeriesView.js (Sprint 19 Track A)
 * Contains grid refresh and ranking hydration logic.
 */
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { applyEnrichmentToAlbums } from '../../helpers/SpotifyEnrichmentHelper.js';
import { TracksRankingComparison } from '../../components/ranking/TracksRankingComparison.js';

/**
 * Refresh grid with filtered albums
 * @param {SeriesView} view - The view instance
 * @param {Array} providedAlbums - Optional albums array
 */
export async function refreshGrid(view, providedAlbums = null) {
    if (!view.components.grid) return;

    const filteredAlbums = providedAlbums || view.lastRenderedAlbums || [];
    const allSeries = albumSeriesStore.getSeries();

    // Apply cached enrichment
    try {
        await applyEnrichmentToAlbums(filteredAlbums, {
            fetchIfMissing: false,
            silent: true
        });
    } catch (e) {
        console.warn('[SeriesView] Enrichment application failed:', e.message);
    }

    const { searchQuery, filters } = view.controller
        ? view.controller.getState()
        : { searchQuery: '', filters: {} };

    view.components.grid.update({
        items: filteredAlbums,
        layout: view.viewMode === 'compact' ? 'grid' : 'list',
        scope: view.currentScope,
        seriesList: allSeries,
        context: { searchQuery, filters }
    });

    // Hydrate ranking components for expanded view
    if (view.viewMode === 'expanded') {
        hydrateRankingContainers(filteredAlbums);
    }

    view.updateEmptyState(filteredAlbums.length);
}

/**
 * Hydrate TracksRankingComparison components
 * @param {Array} albums - Filtered albums
 */
function hydrateRankingContainers(albums) {
    const gridMount = document.getElementById('series-grid-mount');
    if (!gridMount) return;

    const rankingContainers = gridMount.querySelectorAll('.ranking-comparison-container');
    console.log(`[SeriesView] Hydrating ${rankingContainers.length} ranking containers`);

    rankingContainers.forEach(el => {
        const albumId = el.dataset.albumId;
        const album = albums.find(a => a.id === albumId);
        if (album) {
            new TracksRankingComparison({ album }).mount(el);
        }
    });
}
