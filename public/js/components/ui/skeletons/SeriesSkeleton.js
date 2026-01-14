import { AlbumSkeleton } from './AlbumSkeleton.js';

export class SeriesSkeleton {
    /**
     * Renders a Series Group Skeleton
     * Contains: Header Skeleton + Grid of Album Skeletons
     */
    static render() {
        // 1. Header Skeleton
        const headerHtml = `
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2 animate-pulse">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-white/5 relative overflow-hidden">
                        <div class="absolute inset-0 skeleton opacity-20"></div>
                    </div>
                    <div class="space-y-2">
                        <div class="h-6 w-48 bg-white/10 rounded"></div>
                        <div class="h-3 w-24 bg-white/5 rounded"></div>
                    </div>
                </div>
                <div class="h-8 w-32 bg-white/5 rounded-full"></div>
            </div>
        `;

        // 2. Grid Skeleton (6 items by default)
        const cards = Array(6).fill(0).map(() => AlbumSkeleton.render()).join('');

        const gridHtml = `
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                ${cards}
            </div>
        `;

        return `
            <div class="mb-12 p-4 md:p-6 rounded-2xl border border-white/5 bg-black/20">
                ${headerHtml}
                ${gridHtml}
            </div>
        `;
    }
}
