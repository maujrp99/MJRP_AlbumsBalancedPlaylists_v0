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

        return `
            <div class="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-white/20 hover-card cursor-pointer transition-colors bg-white/5"
                 data-id="${album.id}">
                <div class="absolute inset-0 bg-gray-800/50">
                    <img src="${coverUrl}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="${title}" loading="lazy" />
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/80 to-transparent">
                    <h3 class="text-white font-bold text-sm leading-tight" title="${title}">${title}</h3>
                    <p class="text-gray-400 text-xs truncate">${year}</p>
                </div>

                <!-- Add Action Overlay -->
                <button class="absolute top-2 right-2 bg-white/10 hover:bg-orange-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                        onclick="window.controller.stagingController.addAlbum({id: '${album.id}', title: '${title.replace(/'/g, "\\'")}', artist: '${artist.replace(/'/g, "\\'")}'})">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }
}
