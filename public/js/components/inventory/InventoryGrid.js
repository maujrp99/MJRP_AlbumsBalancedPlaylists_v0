/**
 * InventoryGrid.js
 * 
 * High-level component for displaying the User's Inventory.
 * Reuses SeriesGridRenderer for visualization but attaches specific Inventory event handlers.
 */
import Component from '../base/Component.js';
import SeriesGridRenderer from '../series/SeriesGridRenderer.js';

export default class InventoryGrid extends Component {
    /**
     * @param {Object} props
     * @param {Array} props.items - Inventory Items
     * @param {Function} props.onItemClick - (item) => void
     * @param {Function} props.onItemAction - (action, item) => void
     */
    constructor(props) {
        super(props);
        this.gridRenderer = null;
    }

    render() {
        // Create a wrapper for the grid
        this.container.innerHTML = `
            <div class="inventory-grid-wrapper h-full">
                <!-- Grid Mount Point -->
                <div id="inventory-grid-mount"></div>
                
                <!-- Zero State -->
                <div id="inventory-empty-state" class="hidden flex flex-col items-center justify-center h-64 text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-3"></i>
                    <p>Your inventory is empty.</p>
                </div>
            </div>
        `;

        this.mountGrid();
    }

    mountGrid() {
        const mountPoint = this.container.querySelector('#inventory-grid-mount');
        if (!mountPoint) return;

        const { items = [] } = this.props;

        if (items.length === 0) {
            this.container.querySelector('#inventory-empty-state').classList.remove('hidden');
        }

        this.gridRenderer = new SeriesGridRenderer({
            container: mountPoint,
            props: {
                items: items,
                layout: 'grid'
            }
        });
        this.gridRenderer.mount();
    }

    onMount() {
        // Event Delegation for Inventory Specifics
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('[data-id]');
            const actionBtn = e.target.closest('[data-action]');

            if (!card) return;

            const id = card.dataset.id;
            const item = this.props.items.find(i => i.id === id);

            if (actionBtn) {
                // Handle specific button click (e.g., Context Menu, Quick Add)
                const action = actionBtn.dataset.action;
                this.props.onItemAction?.(action, item);
                e.stopPropagation();
            } else {
                // Handle card click (Selection/Navigation)
                this.props.onItemClick?.(item);
            }
        });
    }

    onUpdate() {
        const { items = [] } = this.props;

        // Toggle Empty State
        const emptyState = this.container.querySelector('#inventory-empty-state');
        if (emptyState) {
            if (items.length === 0) emptyState.classList.remove('hidden');
            else emptyState.classList.add('hidden');
        }

        // Update Grid
        if (this.gridRenderer) {
            this.gridRenderer.update({ items });
        }
    }
}
