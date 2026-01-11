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
import { TracksTable } from '../ranking/TracksTable.js';

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
                // Sprint 20: User Ranking button (Dynamically styled)
                {
                    icon: 'Star',
                    // Dynamic Label & Style based on state
                    label: album.hasUserRanking ? 'Ranked' : 'Rank It',
                    action: 'rank-album',
                    // Add checkmark if ranked, distinct styling
                    class: album.hasUserRanking
                        ? 'text-sky-400 font-bold bg-sky-500/20 ring-1 ring-sky-500/50'
                        : 'text-sky-500 hover:text-sky-400'
                },
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
    /**
     * Render an Expanded Album Card (List/Detail view)
     * Uses Card.renderHTML with 'expanded' variant
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
                
                <!-- Detailed Ranked Table (Print 3 Style) -->
                ${AlbumCardRenderer.renderDetailedTable(album)}
            `),
            actions: [
                // Sprint 20: User Ranking button
                {
                    icon: 'Star',
                    label: album.hasUserRanking ? 'Ranked' : 'Rank It',
                    action: 'rank-album',
                    class: album.hasUserRanking
                        ? 'text-sky-400 font-bold bg-sky-500/20 ring-1 ring-sky-500/50'
                        : 'text-sky-500 hover:text-sky-400'
                },
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
     * Render Detailed Track Table (Reusing TracksTable Component)
     * Matches the UI of the Compact View Modal exactly.
     */
    static renderDetailedTable(album, options = {}) {
        const { sortField = 'rank', sortDirection = 'asc' } = options;

        // 1. Normalize Tracks (same logic as TracksRankingComparison to ensure data shape)
        const enrichedTracks = album.getTracks('acclaim')
        const enrichedMap = new Map()
        const norm = (str) => str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || ''
        enrichedTracks.forEach(t => enrichedMap.set(norm(t.title), t))

        const tracks = album.getTracks('original').map((track, idx) => {
            const enriched = enrichedMap.get(norm(track.title))
            return {
                ...track,
                rank: enriched?.rank || track.rank || 999,
                userRank: track.userRank, // Ensure userRank is passed through (injected by Controller)
                rating: enriched?.rating || track.rating || null,
                spotifyPopularity: (enriched?.spotifyPopularity !== undefined) ? Number(enriched.spotifyPopularity) : (track.spotifyPopularity || -1),
                position: Number(track.position) || (idx + 1),
                duration: enriched?.duration || track.duration || 0
            }
        })

        // 2. Dynamic Sort
        tracks.sort((a, b) => {
            let valA, valB;

            // Value extraction strategy
            switch (sortField) {
                case 'rank':
                case 'userRank':
                    // Low number is better. Missing/High = bad.
                    valA = (a[sortField] && a[sortField] < 999) ? Number(a[sortField]) : 999999;
                    valB = (b[sortField] && b[sortField] < 999) ? Number(b[sortField]) : 999999;
                    break;
                case 'rating':
                case 'spotifyPopularity':
                case 'duration':
                    // High number is usually better/bigger, but let's treat strictly numeric.
                    valA = Number(a[sortField]) || -1;
                    valB = Number(b[sortField]) || -1;
                    break;
                default: // title, etc.
                    valA = a[sortField] || '';
                    valB = b[sortField] || '';
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        })

        if (tracks.length === 0) return '<p class="text-muted text-sm">No tracks available</p>';

        // 3. Render using shared component
        // We create an instance and render it.
        // Note: Event listeners (sorting) won't persist if this string is injected via innerHTML,
        // but it ensures VISUAL consistency as requested.
        const table = new TracksTable({
            tracks: tracks,
            sortField: sortField,
            sortDirection: sortDirection,
            onSort: () => { }        // No-op for static view
        });

        // TracksTable.render() returns a DOM Node
        const tableNode = table.render();
        // ARCH-FIX: Add albumId directly to the table root for easy event delegation context
        tableNode.dataset.albumId = album.id;

        // Return outerHTML for string injection
        return tableNode.outerHTML;
    }
}
