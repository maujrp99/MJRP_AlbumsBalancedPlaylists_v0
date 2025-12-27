import { escapeHtml } from '../../utils/stringUtils.js';

export class StagingAreaRenderer {
    constructor(container) {
        this.container = container;
    }

    render(selectedAlbums) {
        if (!this.container) return;

        if (!selectedAlbums || selectedAlbums.length === 0) {
            this.container.innerHTML = `<div class="text-center text-xs text-gray-500 py-4">Stack is empty.</div>`;
            return;
        }

        this.container.innerHTML = selectedAlbums.map((album, index) => `
            <div class="group flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-all cursor-grab active:cursor-grabbing mb-2">
                <div class="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0">
                    <!-- Placeholder Cover - In a real app we'd need to store the artwork URL too -->
                    <div class="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] text-gray-500">
                        ${index + 1}
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate" title="${escapeHtml(album.title)}">${escapeHtml(album.title)}</h4>
                    <p class="text-[10px] text-gray-400 truncate">${escapeHtml(album.artist)}</p>
                </div>
                <button class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                        onclick="window.controller.stagingController.removeAlbum('${album.id}')">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }
}
