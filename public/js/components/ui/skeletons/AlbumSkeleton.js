import { SafeDOM } from '../../../utils/SafeDOM.js';

export class AlbumSkeleton {
    /**
     * Renders a single Album Card skeleton
     * Matches the dimensions of the Compact Album Card
     */
    static render() {
        // We return an HTML string for performance using SafeDOM where possible
        // but for high-volume skeletons, template literals are faster if safe.
        // Using SafeDOM.div structure but returning innerHTML or element.

        // Structure:
        // div.group.relative.aspect-square...
        //   div.skeleton (Cover)
        // div.mt-2.space-y-1
        //   div.skeleton-line.medium
        //   div.skeleton-line.short

        return `
            <div class="animate-pulse">
                <div class="bg-white/5 rounded-xl aspect-square w-full mb-2 border border-white/5 relative overflow-hidden">
                    <div class="absolute inset-0 skeleton opacity-20"></div>
                </div>
                <div class="space-y-2">
                    <div class="h-3 bg-white/10 rounded w-3/4"></div>
                    <div class="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
            </div>
        `;
    }
}
