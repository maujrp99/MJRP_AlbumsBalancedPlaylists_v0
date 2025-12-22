/**
 * EntityCard.js
 * 
 * V3 Component Pattern: DELEGATES to existing production render functions
 * 
 * This component wraps the existing renderCompactAlbumCard() from AlbumsGridRenderer
 * to provide a component interface while maintaining 100% feature parity.
 */
import { renderCompactAlbumCard, renderExpandedAlbumCard } from '../../views/albums/AlbumsGridRenderer.js';

export default class EntityCard {
    /**
     * @param {Object} props
     * @param {Object} props.entity - The album/entity data
     * @param {string} props.type - 'album' | 'artist' | 'series' | 'ghost'
     * @param {string} props.variant - 'compact' | 'expanded'
     */
    constructor(props) {
        this.props = props;
    }

    /**
     * Returns HTML string for the card.
     * DELEGATES to production render functions for feature parity.
     */
    getHTML() {
        const { entity, type, variant = 'compact' } = this.props;

        if (type === 'ghost') {
            return this.getGhostCardHTML();
        }

        // DELEGATE to existing production functions
        if (variant === 'expanded') {
            return renderExpandedAlbumCard(entity, 0);
        }

        // Default: compact card - uses production renderCompactAlbumCard
        return renderCompactAlbumCard(entity);
    }

    /**
     * Ghost card for "Add New" functionality
     * Matches the style of compact cards but with add icon
     */
    getGhostCardHTML() {
        return `
            <div class="album-card-compact flex flex-col gap-3 h-full relative" data-action="add-new" data-ghost="true">
                <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-accent-primary hover:bg-gray-800 transition-colors group">
                    <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg class="w-8 h-8 text-gray-400 group-hover:text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-400 group-hover:text-white">Add New</span>
                </div>
            </div>
        `;
    }

    /**
     * Static factory for creating card HTML without instantiation
     */
    static renderCard(entity, variant = 'compact') {
        const card = new EntityCard({ entity, type: 'album', variant });
        return card.getHTML();
    }

    /**
     * Static factory for ghost card
     */
    static renderGhostCard() {
        const card = new EntityCard({ type: 'ghost' });
        return card.getHTML();
    }
}
