import { getIcon } from '../Icons.js';
import { escapeHtml } from '../../utils/stringUtils.js';

export class LoadMoreButton {
    /**
     * The button that asks for the albums a series holds back. It only says and reports: the click
     * is heard by the screen's event handler, by its data-action.
     * @param {string} seriesId - ID of the series
     * @param {number} hidden - how many albums the series holds back
     * @returns {string} HTML, empty when nothing is held back
     */
    static render(seriesId, hidden) {
        if (!(hidden > 0)) return '';
        const label = hidden === 1 ? 'Load 1 more album' : `Load ${hidden} more albums`;

        return `
        <div class="col-span-full flex justify-center mt-4 w-full">
            <button type="button" class="btn btn-secondary text-sm flex items-center gap-2 group load-more-btn px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
                data-series-id="${escapeHtml(seriesId)}"
                data-action="load-more-series">
                <span>${label}</span>
                ${getIcon('ChevronDown', 'w-4 h-4 transition-transform group-hover:translate-y-1')}
            </button>
        </div>`;
    }
}
