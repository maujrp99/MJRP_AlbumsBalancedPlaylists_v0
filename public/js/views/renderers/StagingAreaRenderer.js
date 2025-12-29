import { escapeHtml } from '../../utils/stringUtils.js';
import { getIcon } from '../../components/Icons.js';

export class StagingAreaRenderer {
    constructor(container) {
        this.container = container;
    }

    render(selectedAlbums) {
        if (!this.container) return;

        if (!selectedAlbums || selectedAlbums.length === 0) {
            this.container.innerHTML = `<div class="text-center text-xs text-gray-500 py-8">No albums selected yet.</div>`;
            return;
        }

        this.container.innerHTML = selectedAlbums.map((album, index) => `
            <div class="group flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-all cursor-grab active:cursor-grabbing mb-2">
                <div class="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0 relative">
                    ${album.artworkTemplate || album.coverUrl ?
                `<img src="${(album.artworkTemplate || album.coverUrl).replace('{w}', '100').replace('{h}', '100')}" class="w-full h-full object-cover" alt="art">` :
                `<div class="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] text-gray-500">?</div>`
            }
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate" title="${escapeHtml(album.title)}">${escapeHtml(album.title)}</h4>
                    <p class="text-[10px] text-gray-400 truncate">${escapeHtml(album.artist)}</p>
                </div>
                <button class="text-white bg-red-500/30 hover:bg-red-500 p-2 rounded-lg transition-all shrink-0 flex items-center justify-center"
                        data-action="remove-album"
                        data-id="${album.id}"
                        title="Remove album">
                    ${getIcon('X', 'w-5 h-5 pointer-events-none')}
                </button>
            </div>
        `).join('');
    }
}
