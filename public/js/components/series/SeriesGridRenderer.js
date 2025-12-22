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
import EntityCard from './EntityCard.js';
import {
    renderAlbumsGrid,
    renderExpandedList,
    wrapInGrid
} from '../../views/albums/AlbumsGridRenderer.js';
import { renderScopedGrid, renderScopedList } from '../../views/albums/AlbumsScopedRenderer.js';

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

        if (scope === 'ALL' && seriesList.length > 0) {
            // Use scoped renderer for ALL series view
            if (layout === 'grid') {
                contentHtml = renderScopedGrid({
                    albums: items,
                    seriesList,
                    currentScope: scope,
                    renderAlbumsGrid: (albums) => renderAlbumsGrid(albums, context)
                });
            } else {
                contentHtml = renderScopedList({
                    albums: items,
                    seriesList,
                    currentScope: scope,
                    renderExpandedList: (albums) => renderExpandedList(albums, context)
                });
            }
        } else {
            // SINGLE series or no grouping
            if (layout === 'grid') {
                // Use production wrapInGrid + renderAlbumsGrid
                const cardsHtml = renderAlbumsGrid(items, context);
                const ghostHtml = EntityCard.renderGhostCard();
                contentHtml = wrapInGrid(cardsHtml + ghostHtml);
            } else {
                // Expanded list view
                contentHtml = renderExpandedList(items, context);
            }
        }

        this.container.innerHTML = `
            <div id="series-grid-inner" class="pb-8">
                ${contentHtml}
            </div>
        `;

        this.gridElement = this.container.querySelector('#series-grid-inner');
    }

    /**
     * Append more items to existing grid (for lazy loading)
     * @param {Array} newItems - Items to append
     */
    appendItems(newItems) {
        if (!this.gridElement || !newItems?.length) return;

        const { context = {} } = this.props;

        // Find the grid container within (could be nested in scoped view)
        const gridContainer = this.gridElement.querySelector('.albums-grid') || this.gridElement;

        // Find ghost card to insert before it
        const ghostCard = gridContainer.querySelector('[data-ghost="true"]');

        // Create new cards HTML
        const newCardsHtml = newItems.map(album => EntityCard.renderCard(album, 'compact')).join('');

        // Create fragment and insert
        const temp = document.createElement('div');
        temp.innerHTML = newCardsHtml;

        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }

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
