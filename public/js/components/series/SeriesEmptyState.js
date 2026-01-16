/**
 * SeriesEmptyState.js
 * 
 * Extracted from SeriesView.js (Sprint 19 Track A)
 * Renders the empty state when no albums exist in a series.
 * 
 * FIX #159: Added delay + re-check + fade-in to prevent flash during transitions
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { albumsStore } from '../../stores/albums.js';
import { SeriesSkeleton } from '../ui/skeletons/SeriesSkeleton.js';

export class SeriesEmptyState {
    constructor(options = {}) {
        this.message = options.message || 'No albums in library';
        this.subMessage = options.subMessage || 'Create a series from the home page to get started';
        this.ctaText = options.ctaText || 'Go to Home';
        this.ctaHref = options.ctaHref || '/home';
        this.container = null;
        this._mountTimeout = null;
    }

    render() {
        // FIX #159 (F): Add fade-in animation class
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

        // FIX #159 (E): Show skeleton immediately while waiting
        console.log('[SeriesEmptyState] 🔄 Mounting with 1s delay...');
        container.innerHTML = SeriesSkeleton.render();

        // FIX #159 (E): Delay before showing empty state
        this._mountTimeout = setTimeout(() => {
            // FIX #159 (H): Re-check store before rendering
            const actualCount = albumsStore.getAlbums().length;
            console.log(`[SeriesEmptyState] ⏰ Delay finished. Actual album count: ${actualCount}`);

            if (actualCount > 0) {
                console.log('[SeriesEmptyState] ✅ Albums arrived, not showing empty state');
                SafeDOM.clear(container);
                return;
            }

            console.log('[SeriesEmptyState] 📭 Truly empty, showing empty state with fade-in');
            SafeDOM.clear(container);
            container.appendChild(this.render());
        }, 300); // 300ms delay
    }

    unmount() {
        // FIX #159 (E): Cancel pending mount if unmounted early
        if (this._mountTimeout) {
            console.log('[SeriesEmptyState] 🚫 Cancelling pending mount');
            clearTimeout(this._mountTimeout);
            this._mountTimeout = null;
        }
        if (this.container) {
            SafeDOM.clear(this.container);
        }
    }
}
