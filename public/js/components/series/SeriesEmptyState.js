/**
 * SeriesEmptyState.js
 * 
 * Extracted from SeriesView.js (Sprint 19 Track A)
 * Renders the empty state when no albums exist in a series.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';

export class SeriesEmptyState {
    constructor(options = {}) {
        this.message = options.message || 'No albums in library';
        this.subMessage = options.subMessage || 'Create a series from the home page to get started';
        this.ctaText = options.ctaText || 'Go to Home';
        this.ctaHref = options.ctaHref || '/home';
        this.container = null;
    }

    render() {
        return SafeDOM.div({ className: 'empty-state text-center py-16 glass-panel animate-fade-in-delayed' }, [
            SafeDOM.div({ className: 'text-6xl mb-6 opacity-30' }, [
                SafeDOM.fromHTML(getIcon('Music', 'w-24 h-24 mx-auto'))
            ]),
            SafeDOM.h2({ className: 'text-2xl font-bold mb-2' }, this.message),
            SafeDOM.p({ className: 'text-muted mb-8' }, this.subMessage),
            SafeDOM.button({
                className: 'btn btn-primary',
                onclick: () => window.location.href = this.ctaHref
            }, [
                SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4 mr-2')),
                ` ${this.ctaText}`
            ])
        ]);
    }

    mount(container) {
        this.container = container;
        SafeDOM.clear(container);
        container.appendChild(this.render());
    }

    unmount() {
        if (this.container) {
            SafeDOM.clear(this.container);
        }
    }
}
