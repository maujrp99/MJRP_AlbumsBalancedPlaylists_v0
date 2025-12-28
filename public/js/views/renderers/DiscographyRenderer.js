import { escapeHtml } from '../../utils/stringUtils.js';

export class DiscographyRenderer {
    constructor(container) {
        this.container = container; // The grid container element
    }

    render(albums) {
        if (!this.container) return;

        if (!albums || albums.length === 0) {
            this.container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">No albums found.</div>`;
            return;
        }

        this.container.innerHTML = albums.map(album => this.createAlbumCard(album)).join('');
        // Re-Lucide
        if (window.lucide) window.lucide.createIcons();
    }

    createAlbumCard(album) {
        const title = escapeHtml(album.title);
        const artist = escapeHtml(album.artist);
        const year = album.year || 'Unknown';
        const coverUrl = album.coverUrl ? album.coverUrl.replace('{w}', '300').replace('{h}', '300') : '/assets/images/cover_placeholder.png';

        // Badge Logic
        const badges = [];
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('deluxe')) badges.push('Deluxe');
        if (lowerTitle.includes('remaster')) badges.push('Remaster');
        if (lowerTitle.includes('live') || album.isLive) badges.push('Live');
        if (album.isSingle) badges.push('Single');
        if (album.isCompilation) badges.push('Comp');

        const badgeHtml = badges.map(b =>
            `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">${b}</span>`
        ).join('');

        return `
            <div class="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer transition-all bg-white/5"
                 data-action="toggle-staging"
                 data-id="${album.id}">
                <div class="absolute inset-0 bg-gray-800/50">
                    <img src="${coverUrl}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" alt="${title}" loading="lazy" />
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <!-- Badges (Top Left) -->
                <div class="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] pointer-events-none">
                    ${badgeHtml}
                </div>
                
                <!-- Click Indicator (Top Right) - Always Visible -->
                <div class="absolute top-2 right-2 bg-black/40 group-hover:bg-orange-500 text-white p-1.5 rounded-full transition-all pointer-events-none">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </div>
                
                <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <h3 class="text-white font-bold text-sm leading-tight" title="${title}">${title}</h3>
                    <p class="text-gray-400 text-xs truncate">${year}</p>
                </div>
            </div>
        `;
    }
}
