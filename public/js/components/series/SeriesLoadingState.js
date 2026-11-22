/**
 * SeriesLoadingState.js - the list area of the albums screen while the series are being read (F79).
 * It takes the place of the empty state, with what the Blend screen shows for the same wait:
 * «Loading your series…» on the phone, the spinner on the computer.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { isPhone } from '../../utils/isPhone.js';
import { LOADING_SERIES_TEXT, LOADING_SERIES_SPINNER_HTML } from '../ui/LoadingSeries.js';

export class SeriesLoadingState {
    render() {
        const inner = isPhone()
            ? SafeDOM.p({ className: 'text-muted text-center py-16' }, LOADING_SERIES_TEXT)
            : SafeDOM.fromHTML(LOADING_SERIES_SPINNER_HTML);
        return SafeDOM.div({ 'data-testid': 'series-loading', role: 'status', 'aria-live': 'polite' }, inner);
    }

    mount(container) {
        SafeDOM.clear(container);
        container.appendChild(this.render());
    }
}
