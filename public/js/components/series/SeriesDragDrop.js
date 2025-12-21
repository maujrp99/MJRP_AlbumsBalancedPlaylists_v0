/**
 * SeriesDragDrop.js
 * 
 * Wrapper for SortableJS to handle drag-and-drop reordering.
 * Can be attached to any grid or list container.
 */
import Component from '../base/Component.js';
// Assumes Sortable is available globally via CDN or import map, 
// strictly we should import it if using a bundler, but for this vanilla setup it might be window.Sortable
// We'll assume window.Sortable as per current architecture or try import.

export default class SeriesDragDrop extends Component {
    /**
     * @param {Object} props
     * @param {HTMLElement} props.targetContainer - The DOM element to make sortable
     * @param {Function} props.onReorder - (evt) => void
     * @param {boolean} props.disabled - Toggle sorting
     */
    constructor(props) {
        super(props);
        this.sortableInstance = null;
    }

    render() {
        // No visual rendering, this is a behavioral component.
        // It initializes Sortable on the target.
    }

    onMount() {
        this.initSortable();
    }

    onUpdate() {
        // If disabled state changed, update option
        if (this.sortableInstance) {
            this.sortableInstance.option('disabled', !!this.props.disabled);
        }
    }

    onUnmount() {
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
            this.sortableInstance = null;
        }
    }

    initSortable() {
        const { targetContainer, onReorder, disabled } = this.props;

        if (!targetContainer || !window.Sortable) {
            console.warn('SeriesDragDrop: Missing container or SortableJS library.');
            return;
        }

        this.sortableInstance = new Sortable(targetContainer, {
            animation: 150,
            ghostClass: 'bg-green-500/20', // Tailwind class for ghost element
            handle: '.group', // Drag by the card itself
            delay: 100, // Slight delay to prevent accidental drags on touch
            delayOnTouchOnly: true,
            disabled: !!disabled,
            onEnd: (evt) => {
                const { oldIndex, newIndex, item } = evt;
                if (oldIndex !== newIndex && onReorder) {
                    onReorder({
                        oldIndex,
                        newIndex,
                        id: item.dataset.id
                    });
                }
            }
        });
    }
}
