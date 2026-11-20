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
import { escapeHtml } from '../../utils/stringUtils.js';
import {
    renderAlbumsGrid,
    renderExpandedList,
    wrapInGrid
} from '../../views/albums/AlbumsGridRenderer.js';
import {
    renderScopedList,
    groupAlbumsBySeries,
    renderSeriesHeader
} from '../../views/albums/AlbumsScopedRenderer.js';
import { AlbumCardRenderer } from '../ui/AlbumCardRenderer.js';
import { SafeDOM } from '../../utils/SafeDOM.js';
import { VirtualScrollObserver } from '../../utils/VirtualScrollObserver.js';
import { SeriesSkeleton } from '../ui/skeletons/SeriesSkeleton.js';
import { LoadMoreButton } from '../ui/LoadMoreButton.js';
import { cutAlbums } from '../../models/seriesExpansion.js';

export default class SeriesGridRenderer extends Component {
    /**
     * @param {Object} props
     * @param {Array} props.items - List of albums to render
     * @param {string} props.layout - 'grid' | 'list'
     * @param {string} props.scope - 'SINGLE' | 'ALL'
     * @param {Array} props.seriesList - All series for scoped rendering
     * @param {Object} props.context - Filter context { searchQuery, filters }
     * @param {Array<string>} [props.expandedSeriesIds] - series of the ALL grid drawn whole (past the first 12 albums)
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
        const { seriesGroups, otherAlbums } = groupAlbumsBySeries(albums, seriesList);
        let html = '<div class="all-series-container space-y-12">';
        let index = 0;

        // Render each series group
        seriesGroups.forEach(group => {
            if (group.albums.length === 0) {
                const display = this._emptySeriesDisplay(group.series.id);
                if (display === 'loading') {
                    html += `
                    <div class="series-group-skeleton" data-series-id="${escapeHtml(group.series.id)}" data-series-index="${index}">
                        ${SeriesSkeleton.render()}
                    </div>`;
                } else if (display === 'failed') {
                    html += this._renderFailedSeriesGroup(group.series);
                }
                // 'hidden': the series has no album to show (filtered out, or it asks for none)
                return;
            }

            // A list already cut to a page is drawn whole; an unbounded one draws 3 and the rest on scroll
            const isVisibleInitially = this.props.pageBounded ? true : index < 3;

            if (isVisibleInitially) {
                html += this._renderRealSeriesGroup(group.series, group.albums, context);
                this.renderedSeriesIds.add(group.series.id);
            } else {
                // Render Skeleton Placeholder for lazy loading
                html += `
                <div class="series-group-skeleton" data-series-id="${escapeHtml(group.series.id)}" data-series-index="${index}">
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

    /**
     * What to show for a series that has no album to draw.
     * The load state of each series comes derived from the load store (props.seriesStates);
     * a caller that does not give it falls back to the single isLoading flag.
     * @returns {'loading'|'failed'|'hidden'}
     */
    _emptySeriesDisplay(seriesId) {
        const { isLoading = false, seriesStates = null } = this.props;
        const state = seriesStates ? seriesStates[seriesId] : null;
        if (!state) return isLoading ? 'loading' : 'hidden';
        if (state.status === 'loading') return 'loading';
        if (state.status === 'failed' && state.found === 0) return 'failed';
        return 'hidden';
    }

    /** The notice of albums that did not load, with the way to try again. Empty when none failed. */
    _renderFailureNotice(series) {
        const state = this.props.seriesStates ? this.props.seriesStates[series.id] : null;
        if (!state || state.failed === 0 || state.status === 'loading') return '';
        const count = state.failed === 1 ? '1 album did not load' : `${state.failed} albums did not load`;
        return `
            <div class="series-load-failure flex items-center gap-3 mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-200" role="status">
                <span>${count}.</span>
                <button type="button" class="underline font-semibold hover:text-white" data-action="retry-series" data-series-id="${escapeHtml(series.id)}">Try again</button>
            </div>`;
    }

    /** A series whose albums all failed stays on screen, saying so. */
    _renderFailedSeriesGroup(series) {
        return `
        <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5" data-series-id="${escapeHtml(series.id)}">
            ${renderSeriesHeader(series, 0)}
            ${this._renderFailureNotice(series)}
        </div>`;
    }

    /**
     * A series with albums. In this grid it draws its first 12; the rest wait for the person to ask
     * (props.expandedSeriesIds, the state the screen keeps). The header counts every album.
     */
    _renderRealSeriesGroup(series, albums, context) {
        const expanded = (this.props.expandedSeriesIds || []).includes(series.id);
        const { shown, hidden } = cutAlbums(albums, expanded);

        return `
        <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5" data-series-id="${escapeHtml(series.id)}">
            ${renderSeriesHeader(series, albums.length)}
            ${this._renderFailureNotice(series)}
            ${wrapInGrid(renderAlbumsGrid(shown, context))}
            ${LoadMoreButton.render(series.id, hidden)}
        </div>`;
    }

    /**
     * Put the focus on one album of a series (the first one a click on "load more" brought), so the
     * keyboard goes on from there and not from the top of the page.
     * @param {string} seriesId
     * @param {number} index - position of the album in the series, from 0
     * @returns {boolean} true when the album is on screen
     */
    focusAlbum(seriesId, index) {
        const group = Array.from(this.container.querySelectorAll('.series-group'))
            .find(element => element.dataset.seriesId === seriesId);
        const card = group?.querySelector('.albums-grid')?.children[index];
        if (!card) return false;
        card.setAttribute('tabindex', '-1');
        card.focus();
        return true;
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
        const { items = [], seriesList = [], context = {} } = this.props;
        // Optimization: We could cache this map in render()
        const { seriesGroups } = groupAlbumsBySeries(items, seriesList);
        const group = seriesGroups.get(seriesId);

        if (group) {
            // FIX: Handle empty groups during hydration
            if (group.albums.length === 0) {
                if (this._emptySeriesDisplay(seriesId) !== 'hidden') {
                    // Still loading (or failed, drawn by the next render): keep the block
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
