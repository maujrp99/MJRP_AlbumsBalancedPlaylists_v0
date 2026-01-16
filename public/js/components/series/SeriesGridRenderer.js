/**
 * SeriesGridRenderer.js
 * 
 * V3 Component Pattern: DELEGATES to existing production render functions
 * 
 * This component wraps existing AlbumsGridRenderer and AlbumsScopedRenderer
 * to provide a component interface while maintaining 100% feature parity.
 * 
 * Supports:
 * - Compact grid view (via wrapInGrid + renderAlbumsGrid)
 * - Expanded list view (via renderExpandedList)
 * - Scoped rendering for ALL/SINGLE series (via renderScopedGrid/List)
 * - Lazy loading via appendItems()
 */
import Component from '../base/Component.js';
import {
    renderAlbumsGrid,
    renderExpandedList,
    wrapInGrid
} from '../../views/albums/AlbumsGridRenderer.js';
import {
    renderScopedGrid,
    renderScopedList,
    groupAlbumsBySeries,
    renderSeriesHeader
} from '../../views/albums/AlbumsScopedRenderer.js';
import { Card } from '../ui/Card.js';
import { AlbumCardRenderer } from '../ui/AlbumCardRenderer.js';
import { SafeDOM } from '../../utils/SafeDOM.js';
import { VirtualScrollObserver } from '../../utils/VirtualScrollObserver.js';
import { SeriesSkeleton } from '../ui/skeletons/SeriesSkeleton.js';

export default class SeriesGridRenderer extends Component {
    /**
     * @param {Object} props
     * @param {Array} props.items - List of albums to render
     * @param {string} props.layout - 'grid' | 'list'
     * @param {string} props.scope - 'SINGLE' | 'ALL'
     * @param {Array} props.seriesList - All series for scoped rendering
     * @param {Object} props.context - Filter context { searchQuery, filters }
     */
    constructor(config) {
        super(config);
        this.gridElement = null;
        // Initialize Observer with 200px margin (load before user sees it)
        this.observer = new VirtualScrollObserver({ rootMargin: '0px 0px 400px 0px', threshold: 0.01 });
        // Track rendered series to prevent duplicates
        this.renderedSeriesIds = new Set();
    }

    render() {
        const {
            items = [],
            layout = 'grid',
            scope = 'SINGLE',
            seriesList = [],
            context = {}
        } = this.props;

        let contentHtml;

        // Disconnect previous observer
        this.observer.disconnect();
        this.renderedSeriesIds.clear();

        if (scope === 'ALL' && seriesList.length > 0) {
            // VIRTUALIZED RENDERING STRATEGY
            if (layout === 'grid') {
                contentHtml = this._renderVirtualScopedGrid(items, seriesList, context);
            } else {
                // List view virtualization not prioritized yet, fallback to standard
                contentHtml = renderScopedList({
                    albums: items,
                    seriesList,
                    currentScope: scope,
                    renderExpandedList: (albums) => renderExpandedList(albums, context)
                });
            }
        } else {
            // SINGLE series or no grouping (Standard Render)
            if (layout === 'grid') {
                const cardsHtml = renderAlbumsGrid(items, context);
                contentHtml = wrapInGrid(cardsHtml);
            } else {
                contentHtml = renderExpandedList(items, context);
            }
        }

        // SafeDOM Rendering
        const innerDiv = SafeDOM.div({
            id: 'series-grid-inner',
            className: 'pb-8'
        }, SafeDOM.fromHTML(contentHtml));

        SafeDOM.replaceChildren(this.container, innerDiv);
        this.gridElement = this.container.querySelector('#series-grid-inner');

        // Post-render: Attach Observers to Skeletons
        this._attachObservers();
    }

    /**
     * Virtual Strategy: Renders first 3 series real + Skeletons for rest
     * FIX #152: Now distinguishes between loading state (show skeleton) and filtered state (skip)
     */
    _renderVirtualScopedGrid(albums, seriesList, context) {
        const { isLoading = false } = this.props; // FIX #152: Get isLoading state
        const { seriesGroups, otherAlbums } = groupAlbumsBySeries(albums, seriesList);
        let html = '<div class="all-series-container space-y-12">';
        let index = 0;

        // Render each series group
        seriesGroups.forEach(group => {
            // FIX #152: Distinguish between loading (show skeleton) and filtered (skip)
            if (group.albums.length === 0) {
                if (isLoading) {
                    // Loading state: Show skeleton placeholder
                    html += `
                    <div class="series-group-skeleton" data-series-id="${group.series.id}" data-series-index="${index}">
                        ${SeriesSkeleton.render()}
                    </div>`;
                }
                // Filtered state (isLoading=false): Skip this series entirely
                return;
            }

            const isVisibleInitially = index < 3; // Render first 3 immediately

            if (isVisibleInitially) {
                html += this._renderRealSeriesGroup(group.series, group.albums, context);
                this.renderedSeriesIds.add(group.series.id);
            } else {
                // Render Skeleton Placeholder for lazy loading
                html += `
                <div class="series-group-skeleton" data-series-id="${group.series.id}" data-series-index="${index}">
                    ${SeriesSkeleton.render()}
                </div>`;
            }
            index++;
        });

        // Render orphan albums (Always at bottom, usually rendered real or skeleton?)
        // Let's render real for now as it's usually the "rest"
        if (otherAlbums.length > 0) {
            html += `
            <div class="series-group mt-12">
                <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                    <h2 class="text-2xl font-bold text-gray-400">Uncategorized</h2>
                    <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">${otherAlbums.length} albums</span>
                </div>
                ${wrapInGrid(renderAlbumsGrid(otherAlbums, context))}
            </div>`;
        }

        html += '</div>';
        return html;
    }

    _renderRealSeriesGroup(series, albums, context) {
        const INITIAL_LIMIT = 12;
        const total = albums.length;
        const shouldCap = total > INITIAL_LIMIT;

        const shownAlbums = shouldCap ? albums.slice(0, INITIAL_LIMIT) : albums;

        let html = `
        <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5" data-series-id="${series.id}">
            ${renderSeriesHeader(series, total)}
            ${wrapInGrid(renderAlbumsGrid(shownAlbums, context))}
            ${shouldCap ? LoadMoreButton.render(series.id, total, shownAlbums.length) : ''}
        </div>`;

        return html;
    }

    _attachObservers() {
        if (!this.gridElement) return;

        const skeletons = this.gridElement.querySelectorAll('.series-group-skeleton');
        skeletons.forEach(skeleton => {
            this.observer.observe(skeleton, (entry) => {
                this._hydrateSkeleton(entry.target);
            });
        });
    }

    _attachEventListeners() {
        if (!this.gridElement) return;

        // Use Event Delegation on the main container
        // This handles both initial buttons and lazy-loaded ones
        this.gridElement.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="load-more-series"]');
            if (btn) {
                this._handleLoadMore(e, btn);
            }
        });
    }

    _handleLoadMore(e, btn) {
        const seriesId = btn.dataset.seriesId;
        const groupEl = btn.closest('.series-group');
        const gridEl = groupEl.querySelector('.albums-grid');

        // Find data
        const { items = [], seriesList = [] } = this.props;
        // Optimization: Use cached map if available, or just filtering
        // Since we don't have the Group Map cached easily without re-running grouping...
        // We can just find the albums for this series.
        // Or re-run grouping (it's consistent).
        const { seriesGroups } = groupAlbumsBySeries(items, seriesList);
        const group = seriesGroups.get(seriesId);

        if (!group) return;

        // Render *all* albums (or just the remaining ones?)
        // Easiest: Render all remaining and append.

        const INITIAL_LIMIT = 12;
        const remainingAlbums = group.albums.slice(INITIAL_LIMIT);

        // Render new cards
        // Context needed? Yes.
        const { context = {} } = this.props;
        const newCardsHtml = renderAlbumsGrid(remainingAlbums, context);

        // Append to grid
        const fragment = SafeDOM.fromHTML(newCardsHtml);
        gridEl.appendChild(fragment);

        // Remove button
        // Maybe animate removal?
        btn.parentElement.remove(); // Remove the wrapper div
    }

    _hydrateSkeleton(element) {
        const seriesId = element.dataset.seriesId;
        if (this.renderedSeriesIds.has(seriesId)) return;

        // Find data for this series
        // We need access to 'albums' and 'seriesList' again. 
        // Ideally we shouldn't re-process grouping.
        // Optimization: Store mapped groups in a property during render?
        // Or re-group (expensive-ish). 
        // Better: We can store the *data* needed to render on the element? No, too big.
        // We will re-group for now (it's fast enough for 50 items) or cache it.

        this._hydrateSeriesGroup(element, seriesId);
    }

    _hydrateSeriesGroup(element, seriesId) {
        const { items = [], seriesList = [], context = {}, isLoading = false } = this.props;
        // Optimization: We could cache this map in render()
        const { seriesGroups } = groupAlbumsBySeries(items, seriesList);
        const group = seriesGroups.get(seriesId);

        if (group) {
            // FIX: Handle empty groups during hydration
            if (group.albums.length === 0) {
                if (isLoading) {
                    // Still loading, keep skeleton
                    return;
                } else {
                    // Loaded but empty (filtered out) - Remove element
                    element.remove();
                    this.renderedSeriesIds.add(seriesId); // Mark handled
                    return;
                }
            }

            const realHtml = this._renderRealSeriesGroup(group.series, group.albums, context);
            // Replace Outer HTML (Skeleton Div) with Real Group Div

            // Create temp container
            const temp = document.createElement('div');
            temp.innerHTML = realHtml;
            const newNode = temp.firstElementChild;

            // Fade in effect
            newNode.classList.add('animate-in', 'zoom-in');

            element.replaceWith(newNode);
            this.renderedSeriesIds.add(seriesId);
        }
    }

    /**
     * Append more items to existing grid (for lazy loading)
     * @param {Array} newItems - Items to append
     */
    appendItems(newItems) {
        if (!this.gridElement || !newItems?.length) return;

        const { context = {} } = this.props;
        const gridContainer = this.gridElement.querySelector('.albums-grid') || this.gridElement;
        const ghostCard = gridContainer.querySelector('[data-ghost="true"]');
        const newCardsHtml = newItems.map(album => AlbumCardRenderer.renderCompact(album)).join('');
        const fragment = SafeDOM.fromHTML(newCardsHtml);

        if (ghostCard) {
            ghostCard.parentNode.insertBefore(fragment, ghostCard);
        } else {
            gridContainer.appendChild(fragment);
        }
    }

    /**
     * Get current item count (for lazy loading state)
     */
    getItemCount() {
        const gridContainer = this.gridElement?.querySelector('.albums-grid') || this.gridElement;
        if (!gridContainer) return 0;
        return gridContainer.querySelectorAll('[data-album-id]').length;
    }
}
