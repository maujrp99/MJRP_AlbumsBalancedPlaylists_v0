import toast from '../Toast.js';
import { isDeadlineError } from '../../utils/deadline.js';
import {
    ScanStatus, ScanFailure, idleScan, canStartScan, startScan, scanFound, scanFailed, scanReclassified, countAlbumTypes
} from '../../models/scanState.js';

/** The filter button that shows each album type. */
const FILTER_OF_TYPE = Object.freeze({
    Album: 'albums', EP: 'eps', Single: 'singles', Live: 'live', Compilation: 'compilations', Uncategorized: 'uncategorized'
});

/** Newest first, by release date. A new list: the one given is not changed. */
function newestFirst(albums) {
    const released = (album) => new Date(album.releaseDate || album.raw?.attributes?.releaseDate || 0);
    return [...albums].sort((a, b) => released(b) - released(a));
}

/**
 * The scan of the Home (F67).
 *
 * Owner of the scan's state (`this.scan`, rules in models/scanState.js). Every change goes
 * through `_setScan`, which draws the screen from the state: there is no other place that says
 * what the Scan button, the status line or the panel show.
 */
export class SearchController {
    constructor(homeController) {
        this.home = homeController; // Parent Controller
        this.service = homeController.albumSearchService;
        this.scan = idleScan();
        this.disposed = false;
        // ARCH-18: Updated filter state to include EP and Uncategorized
        this.filterState = {
            albums: true,
            eps: false,
            singles: false,
            live: false,
            compilations: false,
            uncategorized: false
        };
    }

    /** The albums of the scan on screen (what the grid click looks up). */
    get results() {
        return this.scan.albums;
    }

    initialize() {
        // Every handler is delegated from #app and reads the field at the time of the event:
        // nothing here holds a DOM node, so a Home drawn again still answers.
        const typed = () => this.home.view.$('#artistScanInput')?.value || '';

        this.home.view.$delegate('#artistScanInput', 'keydown', (e) => {
            if (e.key === 'Enter') this.searchArtist(typed());
        });
        this.home.view.$delegate('#btnScanArtist', 'click', () => this.searchArtist(typed()));
        this.home.view.$delegate('#btnScanRetry', 'click', () => this.searchArtist(this.scan.query));

        this._draw();
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose() {
        this.disposed = true;
    }

    /**
     * Scan the catalog for an artist. One scan at a time: while one runs, another ask does nothing.
     * Ends when the catalog answered (or failed, or missed its deadline); the AI list, when it is
     * needed, arrives after and classifies the albums on screen again.
     */
    async searchArtist(query) {
        if (this.scan.status === ScanStatus.SCANNING) return;
        if (!canStartScan(this.scan, query)) {
            toast.warning('Type an artist name first.');
            return;
        }

        const { generation, query: text } = this._setScan(startScan(this.scan, query));

        try {
            const { albums, reclassified } = await this.service.scanArtist(text);
            this._setScan(scanFound(this.scan, generation, { albums: newestFirst(albums), classifying: Boolean(reclassified) }));
            if (reclassified) this._applyAiList(generation, reclassified);
        } catch (error) {
            console.error('[SearchController] Scan failed', error);
            this._setScan(scanFailed(this.scan, generation, isDeadlineError(error) ? ScanFailure.TIMEOUT : ScanFailure.ERROR));
        }
    }

    /** The AI list arrives after the first render: the albums shown are classified again. */
    async _applyAiList(generation, reclassified) {
        let albums = null;
        try {
            albums = await reclassified;
        } catch (error) {
            console.warn('[SearchController] AI list failed, keeping the first classification', error);
        }
        this._setScan(scanReclassified(this.scan, generation, albums ? newestFirst(albums) : null));
    }

    /** The one way the scan's state changes: keep it, then draw from it. */
    _setScan(next) {
        if (next === this.scan) return next;
        this.scan = next;
        this.home.state.isScanning = next.status === ScanStatus.SCANNING;
        this.home.state.artist = next.artist ? { name: next.artist } : null;
        this._draw();
        return next;
    }

    _draw() {
        if (this.disposed) return;
        this.home.view.renderScan(this.scan);
        this.home.view.updateFilterCounts(countAlbumTypes(this.scan.albums));
        this.applyFilters();
    }

    // Filter Logic
    toggleFilter(type) {
        if (!this.filterState) this.filterState = { albums: true, singles: false, live: false };

        // Toggle state
        this.filterState[type] = !this.filterState[type];

        // Update UI
        this.updateFilterUI();

        // Re-render
        this.applyFilters();
    }

    updateFilterUI() {
        const updateBtn = (id, active) => {
            const btn = this.home.view.$(id);
            if (!btn) return;
            if (active) {
                btn.className = "filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all";
            } else {
                btn.className = "filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-2 transition-all";
            }
        };

        // ARCH-18: Update all filter buttons including EP and Uncategorized
        updateBtn('#btnFilterAlbums', this.filterState.albums);
        updateBtn('#btnFilterEPs', this.filterState.eps);
        updateBtn('#btnFilterSingles', this.filterState.singles);
        updateBtn('#btnFilterLive', this.filterState.live);
        updateBtn('#btnFilterCompilations', this.filterState.compilations);
        updateBtn('#btnFilterUncategorized', this.filterState.uncategorized);
    }

    applyFilters() {
        // Only the results state has albums in the grid: in the others the panel shows a message
        if (this.scan.status !== ScanStatus.RESULTS) return;

        // ARCH-18: album.type comes from the classification pipeline; a type with no filter is not shown
        const filtered = this.results.filter(album => Boolean(this.filterState[FILTER_OF_TYPE[album.type || 'Uncategorized']]));

        this.home.discographyRenderer.render(filtered);
    }
}
