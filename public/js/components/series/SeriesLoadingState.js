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

export class SeriesLoadingState {
    render() {
        const phone = isPhone();
        const inner = phone
            ? SafeDOM.p({ className: 'text-muted text-center' }, LOADING_SERIES_TEXT)
            : SafeDOM.fromHTML(LOADING_SERIES_SPINNER_HTML);
        return SafeDOM.div({
            'data-testid': 'series-loading',
            className: 'flex items-center justify-center',
            style: `min-height: ${phone ? LOADING_MIN_HEIGHT.phone : LOADING_MIN_HEIGHT.computer}px`,
            role: 'status',
            'aria-live': 'polite'
        }, inner);
    }

    mount(container) {
        SafeDOM.clear(container);
        container.appendChild(this.render());
    }
}
