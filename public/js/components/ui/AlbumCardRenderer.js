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
     * Redesigned Sprint 22: Bordered Card, Vertical Actions, Refetch Button
     * @param {Object} album 
     * @returns {string} HTML string
     */
    /**
     * Render the Visual Header Component (Reusable)
     * Includes Full Width Cover + Horizontal Action Bar
     * extracted for reuse in both Grid and List views per user request.
     * @param {Object} album
     * @returns {HTMLElement} DOM Element (Container with Cover+Actions)
     */
    static renderVisualHeader(album) {
        const coverUrl = albumLoader.getArtworkUrl(album, 300); // Consistent quality

        // 1. Cover (Full Width / Aspect Square)
        const coverImg = SafeDOM.img({
            src: coverUrl,
            alt: album.title,
            className: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
            loading: 'lazy'
        });

        const coverSection = SafeDOM.div({
            className: 'relative aspect-square overflow-hidden group border-b border-white/5',
            dataset: { action: 'view-modal', id: album.id }
        }, [
            coverImg,
            // Hover overlay
            SafeDOM.div({ className: 'absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer' }, [
                SafeDOM.fromHTML(getIcon('Maximize2', 'w-10 h-10 text-white drop-shadow-lg'))
            ])
        ]);

        // 2. Actions Bar (Horizontal, immediately below cover)
        // Refetch button as last item
        const actions = [
            { icon: 'Star', label: album.hasUserRanking ? 'Ranked' : 'Rank', action: 'rank-album', class: album.hasUserRanking ? 'text-sky-400 bg-sky-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5' },
            { icon: 'Plus', label: 'Add', action: 'add-to-inventory', class: 'text-gray-400 hover:text-white hover:bg-white/5' },
            { icon: 'Trash', label: 'Del', action: 'remove-album', class: 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' },
            { icon: 'RefreshCw', label: 'Refetch', action: 'refetch-metadata', class: 'text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 ml-auto' }
        ];

        const actionsBar = SafeDOM.div({
            className: 'flex items-center justify-between p-2 border-b border-white/5 bg-gray-900/50'
        }, actions.map(btn => {
            const b = SafeDOM.button({
                className: `flex-1 flex justify-center items-center py-1.5 rounded mx-0.5 transition-colors ${btn.class}`,
                title: btn.label,
                dataset: { action: btn.action, id: album.id }
            });
            b.appendChild(SafeDOM.fromHTML(getIcon(btn.icon, 'w-4 h-4')));
            return b;
        }));

        const container = SafeDOM.div({ className: 'flex flex-col bg-gray-800' }, [coverSection, actionsBar]);
        return container;
    }

    /**
     * Render a Compact Album Card (Grid view)
     * Redesigned Sprint 22: Bordered Card, Vertical Actions, Refetch Button
     * @param {Object} album 
     * @returns {string} HTML string
     */
    static renderCompact(album) {
        // Reuse visual header (Cover + Actions)
        const visualHeader = this.renderVisualHeader(album);

        // 3. Details Section
        const titleEl = SafeDOM.h3({
            className: 'font-bold text-white text-base leading-tight line-clamp-2 mb-1 pt-2',
            title: album.title
        }, album.title);

        // Artist + Year Row (Year pushed to right, bordered, smaller)
        const artistRow = SafeDOM.div({ className: 'flex justify-between items-center gap-2 mb-2' }, [
            SafeDOM.span({ className: 'text-sm text-gray-400 truncate min-w-0', title: album.artist }, album.artist),
            album.year ? SafeDOM.span({ className: 'text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5 shrink-0 tabular-nums' }, album.year) : null
        ]);

        // Badges Row (Smaller font size requested: text-[10px] or text-xs)
        const badgesRow = SafeDOM.div({ className: 'flex flex-wrap gap-1 mt-auto pb-2 text-xs opacity-90' },
            Card.renderRankingBadge(album) ? [Card.renderRankingBadge(album)] : []
        );

        const detailsSection = SafeDOM.div({ className: 'px-3 flex flex-col flex-1 bg-gray-800' }, [
            titleEl,
            artistRow,
            badgesRow
        ]);

        // Card Container
        const card = SafeDOM.div({
            className: 'flex flex-col rounded-xl overflow-hidden border border-white/10 bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 isolate',
            dataset: { id: album.id }
        }, [visualHeader, detailsSection]);

        return card.outerHTML;
    }

    /**
     * Render an Expanded Album Card (List/Detail view)
     * Redesigned Sprint 22: Consistent visual look with Grid layout (shared Header)
     * @param {Object} album 
     * @param {number} idx - For animation delay
     * @returns {string} HTML string
     */
    static renderExpanded(album, idx = 0) {
        // 1. Visual Header (Cover + Actions) - Reused from Grid
        // Wrapped in a fixed width container for List View sidebar
        const visualHeader = this.renderVisualHeader(album);

        const leftColumn = SafeDOM.div({
            className: 'w-32 md:w-40 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 self-start'
        }, [visualHeader]);

        // 3. Info Section
        const titleEl = SafeDOM.h3({ className: 'text-xl font-bold text-white leading-tight' }, [
            SafeDOM.text(album.title),
            album.year ? SafeDOM.span({ className: 'text-gray-400 font-normal ml-2 text-base' }, `(${album.year})`) : null
        ]);

        // Artist only (Refetch moved to visual header)
        const artistRow = SafeDOM.div({ className: 'flex items-center gap-3 mb-2' }, [
            SafeDOM.p({ className: 'text-lg text-accent-primary' }, album.artist)
        ]);

        const badgesRow = SafeDOM.div({ className: 'flex flex-wrap gap-1 mt-auto' },
            Card.renderRankingBadge(album) ? [Card.renderRankingBadge(album)] : []
        );

        const infoCol = SafeDOM.div({ className: 'flex-1 min-w-0' }, [
            titleEl,
            artistRow,
            badgesRow,
            // Track Table Injection
            SafeDOM.fromHTML(this.renderDetailedTable(album))
        ]);

        // Layout Assembly
        const innerLayout = SafeDOM.div({ className: 'flex gap-4' }, [
            leftColumn,
            infoCol
        ]);

        const card = SafeDOM.div({
            className: 'expanded-album-card glass-panel p-6 mb-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2',
            style: { animationDelay: `${idx * 50}ms` },
            dataset: { id: album.id }
        }, [innerLayout]);

        return card.outerHTML;
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
                rating: (enriched && enriched.rating !== undefined && enriched.rating !== null) ? enriched.rating : (track.rating !== undefined ? track.rating : null),
                spotifyPopularity: (enriched?.spotifyPopularity !== undefined && enriched?.spotifyPopularity !== null) ? Number(enriched.spotifyPopularity) : (track.spotifyPopularity || -1),
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
