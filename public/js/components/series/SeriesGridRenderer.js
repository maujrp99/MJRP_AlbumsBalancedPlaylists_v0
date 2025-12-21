/**
 * SeriesGridRenderer.js
 * 
 * Responsible for rendering the main grid of entities (Albums, etc).
 * It uses EntityCard.js for individual items.
 */
import Component from '../base/Component.js';
import EntityCard from './EntityCard.js';

export default class SeriesGridRenderer extends Component {
    /**
     * @param {Object} props
     * @param {Array} props.items - List of entities to render
     * @param {string} props.layout - 'grid' | 'list'
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { items = [], layout = 'grid' } = this.props;

        // Define Layout Classes
        const gridClasses = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6";
        const listClasses = "flex flex-col gap-2";

        const layoutClass = layout === 'list' ? listClasses : gridClasses;

        // Generate Items HTML
        const itemsHTML = items.map(item => {
            const card = new EntityCard({ entity: item, type: 'album' }); // TODO: Make type dynamic
            return card.getHTML();
        }).join('');

        // Ghost Card (Add New) - Always appended at the end
        const ghostCard = new EntityCard({ type: 'ghost' });
        const ghostHTML = ghostCard.getHTML();

        this.container.innerHTML = `
            <div class="${layoutClass} pb-20">
                ${itemsHTML}
                ${ghostHTML}
            </div>
        `;
    }
}
