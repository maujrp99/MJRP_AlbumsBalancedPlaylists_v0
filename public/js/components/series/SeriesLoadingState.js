/**
 * SeriesLoadingState.js - the list area of the albums screen while the series are being read (F79).
 * It takes the place of the empty state, with what the Blend screen shows for the same wait:
 * «Loading your series…» on the phone, the spinner on the computer.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { isPhone } from '../../utils/isPhone.js';
import { LOADING_SERIES_TEXT, LOADING_SERIES_SPINNER_HTML } from '../ui/LoadingSeries.js';

/**
 * The height of the empty card it stands in for, measured on the built site (391 px at 1280, 282 px at 393), so the
 * «Last updated» footer sits where it will sit and does not jump when the card or the list arrives. The grid above
 * keeps its own space while it is invisible (SeriesViewUpdater), so only the card's height is needed here.
 */
export const LOADING_MIN_HEIGHT = Object.freeze({ computer: 391, phone: 282 });

/**
 * Where the loading content goes. The grid above is invisible but keeps its space (its «No albums match» message),
 * so the block keeps its own place and height (the footer does not move, and neither does the box when the empty
 * card or the list arrives) and only its CONTENT is lifted over that slot with a transform, which moves no layout:
 * the spinner then sits right under the filters.
 * @param {{ gridHeight?: number, phone: boolean }} facts - gridHeight: the height the invisible grid takes
 * @returns {{ lift: number, minHeight: number }} px: how far the content rises, and the block's height
 */
export function loadingPlacement({ gridHeight = 0, phone }) {
    const lift = Math.max(0, Math.round(gridHeight) || 0);
    return { lift, minHeight: phone ? LOADING_MIN_HEIGHT.phone : LOADING_MIN_HEIGHT.computer };
}

export class SeriesLoadingState {
    /** @param {{ gridHeight?: number }} [options] */
    constructor({ gridHeight = 0 } = {}) {
        this.gridHeight = gridHeight;
    }

    render() {
        const phone = isPhone();
        const inner = phone
            ? SafeDOM.p({ className: 'text-muted text-center py-8' }, LOADING_SERIES_TEXT)
            : SafeDOM.fromHTML(LOADING_SERIES_SPINNER_HTML);
        const { lift, minHeight } = loadingPlacement({ gridHeight: this.gridHeight, phone });
        const content = SafeDOM.div({ 'data-testid': 'series-loading-content', style: `transform: translateY(-${lift}px)` }, inner);
        return SafeDOM.div({
            'data-testid': 'series-loading',
            className: 'flex items-start justify-center',
            style: `min-height: ${minHeight}px`,
            role: 'status',
            'aria-live': 'polite'
        }, content);
    }

    mount(container) {
        SafeDOM.clear(container);
        container.appendChild(this.render());
    }
}
