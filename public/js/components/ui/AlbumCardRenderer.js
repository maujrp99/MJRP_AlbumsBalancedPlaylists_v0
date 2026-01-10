/**
 * AlbumCardRenderer.js
 * 
 * Centralized rendering logic for Album Entities as components.
 * Ported and consolidated from AlbumsGridRenderer.js and Card.js adapters.
 */
import { albumLoader } from '../../services/AlbumLoader.js';
import { getIcon } from '../Icons.js';
import { escapeHtml } from '../../utils/stringUtils.js';
import { Card } from './Card.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

export class AlbumCardRenderer {
    /**
     * Render a Compact Album Card (Grid view)
     * @param {Object} album 
     * @returns {string} HTML string
     */
    static renderCompact(album) {
        const coverUrl = albumLoader.getArtworkUrl(album, 300);

        const cardProps = {
            variant: 'grid',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: coverUrl,
            badge: album.year,
            actions: [
                { icon: 'Plus', label: 'Add', action: 'add-to-inventory' },
                { icon: 'Trash', label: 'Remove', action: 'remove-album' }
            ]
        };

        return Card.renderHTML(cardProps);
    }

    /**
     * Render an Expanded Album Card (List/Detail view)
     * @param {Object} album 
     * @param {number} idx - For animation delay
     * @returns {string} HTML string
     */
    static renderExpanded(album, idx = 0) {
        const coverUrl = albumLoader.getArtworkUrl(album, 150);

        const cardProps = {
            variant: 'expanded',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: coverUrl,
            content: SafeDOM.fromHTML(`
                <div class="flex flex-wrap gap-2 text-sm mb-4">
                     ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
                     <span class="badge badge-neutral">${album.tracks?.length || 0} tracks</span>
                </div>
                <!-- Ranking UI Container -->
                <div class="ranking-comparison-container mt-6" data-album-id="${album.id}"></div>
            `),
            actions: [
                { icon: 'Plus', label: 'Inventory', action: 'add-to-inventory' },
                { icon: 'Trash', label: 'Remove', action: 'remove-album', class: 'tech-btn-danger' }
            ]
        };

        return `
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: ${idx * 50}ms">
                ${Card.renderHTML(cardProps)}
            </div>
        `;
    }

    /**
     * Render tracklist helpers (if needed separate from comparison component)
     */
    static renderTracklist(album, type = 'ranked') {
        const tracks = type === 'ranked'
            ? [...(album.tracks || [])].sort((a, b) => (b.rating || 0) - (a.rating || 0))
            : (album.tracksOriginalOrder || album.tracks || []);

        if (tracks.length === 0) return '<p class="text-muted text-sm">No tracks available</p>';

        const title = type === 'ranked' ? 'Ranked by BestEverAlbums' : 'Original Album Order';
        const icon = type === 'ranked' ? 'TrendingUp' : 'List';
        const accent = type === 'ranked' ? 'text-accent-primary' : 'text-accent-secondary';

        return `
            <div class="tracklist-section">
                <h4 class="text-sm font-bold mb-3 flex items-center gap-2 ${accent}">
                    ${getIcon(icon, 'w-4 h-4')}
                    ${title}
                </h4>
                <div class="tracks-list-compact space-y-1 text-sm">
                    ${tracks.map((track, idx) => `
                        <div class="track-row-compact flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5">
                            <span class="track-pos w-6 text-xs text-muted text-center">${idx + 1}</span>
                            <span class="track-name flex-1 truncate">${escapeHtml(track.title || track.name)}</span>
                            ${track.rating > 0 ? `<span class="track-rating badge badge-sm">⭐ ${track.rating}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
