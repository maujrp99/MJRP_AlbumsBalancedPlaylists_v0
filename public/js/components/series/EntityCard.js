/**
 * EntityCard.js
 * 
 * Renders a single card for an Album, Artist, or Genre.
 * Supports different variants based on context (Grid, List, Compact).
 */
/**
 * EntityCard.js
 * 
 * Renders a single card for an Album, Artist, or Genre.
 * Supports different variants based on context (Grid, List, Compact).
 * Note: Does NOT extend Component because it returns HTML string, doesn't mount itself.
 */
// import Component from '../base/Component.js'; // Not needed

export default class EntityCard {
    /**
     * @param {Object} props
     * @param {Object} props.entity - The data object (Album/Artist)
     * @param {string} props.type - 'album' | 'artist' | 'series' | 'ghost'
     * @param {string} props.variant - 'default' | 'compact'
     * @param {Function} props.onClick - Click handler
     * @param {Function} props.onAction - Context menu handler
     */
    constructor(props) {
        this.props = props;
    }

    /**
     * Generates the HTML string for the card.
     * We return string instead of render() to container because GridRenderer often concatenates.
     */
    getHTML() {
        const { entity, type, variant = 'default' } = this.props;

        if (type === 'ghost') {
            return this.getGhostCardHTML();
        }

        const isCompact = variant === 'compact';
        // Fallback image logic
        const image = entity.coverUrl || entity.imageUrl || '/assets/placeholder-disk.png';
        const title = entity.title || entity.name || 'Unknown Title';
        const subtitle = entity.artist || entity.description || '';

        // CSS Classes
        const baseClass = "group relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1";
        const compactClass = "flex flex-row items-center p-2 gap-3";

        if (isCompact) {
            return `
                <div class="${baseClass} ${compactClass}" data-id="${entity.id}" data-type="${type}">
                   <img src="${image}" class="w-12 h-12 rounded object-cover" loading="lazy" />
                   <div class="flex-1 min-w-0">
                       <h4 class="font-bold text-white truncate">${title}</h4>
                       <p class="text-xs text-gray-400 truncate">${subtitle}</p>
                   </div>
                </div>
            `;
        }

        // Default Grid Card
        return `
            <div class="${baseClass} flex flex-col h-full" data-id="${entity.id}" data-type="${type}">
                <div class="relative w-full aspect-square overflow-hidden bg-gray-900">
                    <img src="${image}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    
                    <!-- Hover Actions -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                        <button class="action-btn p-3 bg-green-500 rounded-full hover:scale-110 shadow-lg text-black" title="Quick Blend">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="action-btn p-3 bg-gray-200 rounded-full hover:scale-110 shadow-lg text-black" title="More Options">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="font-bold text-white text-base leading-tight mb-1 line-clamp-2">${title}</h3>
                    <p class="text-sm text-gray-400 line-clamp-1">${subtitle}</p>
                    
                    <!-- Meta Tags (if any) -->
                    ${this.renderMetaTags(entity)}
                </div>
            </div>
        `;
    }

    getGhostCardHTML() {
        return `
            <div class="group relative bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-green-500 hover:bg-gray-800 transition-colors" data-action="add-new">
                <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <i class="fas fa-plus text-2xl text-gray-400 group-hover:text-green-500"></i>
                </div>
                <span class="text-sm font-medium text-gray-400 group-hover:text-white">Add New</span>
            </div>
        `;
    }

    renderMetaTags(entity) {
        if (!entity.releaseDate && !entity.year) return '';
        const year = new Date(entity.releaseDate || entity.year).getFullYear();
        return `<div class="mt-2 flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">${year}</span>
        </div>`;
    }

    render() {
        if (this.container) {
            this.container.innerHTML = this.getHTML();
        }
    }
}
