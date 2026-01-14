import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';

export class LoadMoreButton {
    /**
     * Render the Load More button HTML
     * @param {string} seriesId - ID of the series
     * @param {number} totalAlbums - Total count
     * @param {number} shownAlbums - Currently shown count
     */
    static render(seriesId, totalAlbums, shownAlbums) {
        const remaining = totalAlbums - shownAlbums;
        if (remaining <= 0) return '';

        return `
        <div class="col-span-full flex justify-center mt-4 w-full">
            <button class="btn btn-secondary text-sm flex items-center gap-2 group load-more-btn px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors" 
                data-series-id="${seriesId}"
                data-action="load-more-series">
                <span>Load ${remaining} more albums</span>
                ${getIcon('ChevronDown', 'w-4 h-4 transition-transform group-hover:translate-y-1')}
            </button>
        </div>`;
    }
}
