import { albumSearchService } from '../services/album-search/AlbumSearchService.js';
import { AlbumPickerController } from '../components/album-picker/AlbumPickerController.js';
import { StagingAreaController } from '../components/home/StagingAreaController.js';
import { StagingAreaRenderer } from '../views/renderers/StagingAreaRenderer.js';
import { DiscographyRenderer } from '../views/renderers/DiscographyRenderer.js';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { getSeriesService } from '../services/SeriesService.js';
import { router } from '../router.js';
import toast from '../components/Toast.js';
import { toAlbumQuery } from '../models/albumQuery.js';
import { decodeEntities } from '../models/text.js';
import { readPastedList, bulkInputState, bulkOutcome, toStagedAlbum, SkipReason } from '../models/bulkPaste.js';

export class HomeController {
    constructor(view) {
        this.view = view; // The HomeView instance (provides DOM elements)
        // One search service for the whole app: the AI list of an artist is asked (and paid) once
        this.albumSearchService = albumSearchService;

        // State
        this.state = {
            viewMode: 'visual', // 'visual' | 'bulk'
            seriesName: 'Start Your Series'
        };

        // Initialize Renderers
        this.discographyRenderer = new DiscographyRenderer(this.view.$('#discographyGrid'));
        this.stagingRenderer = new StagingAreaRenderer(this.view.$('#stagingStackContainer'));

        // Initialize Sub-Controllers
        this.stagingController = new StagingAreaController(this);
        // The one album picker (F57). The Home is its frame, and what the Home does with a pick is
        // the seam: the album goes to the staging stack of the new series.
        this.picker = new AlbumPickerController({
            service: this.albumSearchService,
            view: {
                drawScan: (scan) => this.view.renderScan(scan),
                drawFilters: (filters, counts) => this.view.renderFilters(filters, counts),
                drawAlbums: (albums) => this.discographyRenderer.render(albums)
            },
            onPick: (album) => this.stagingController.addAlbum(album)
        });
    }

    initialize() {
        console.log('HomeController V3: Initializing...');
        this.bindEvents();
        this.picker.start();
        this.stagingController.initialize();
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose() {
        this.picker.dispose();
    }

    bindEvents() {
        // Mode Toggles
        this.view.$delegate('#btnModeVisual', 'click', () => this.setMode('visual'));
        this.view.$delegate('#btnModeBulk', 'click', () => this.setMode('bulk'));

        // Footer Actions
        this.view.$delegate('#btnInitializeLoad', 'click', () => this.handleInitializeLoad());

        // Grid Delegation - Register directly on grid for proper event bubbling
        const grid = this.view.$('#discographyGrid');
        if (grid) {
            grid.addEventListener('click', (e) => this.handleGridClick(e));
        }

        // Stack Delegation - Register directly on staging container
        const stack = this.view.$('#stagingStackContainer');
        if (stack) {
            stack.addEventListener('click', (e) => this.handleStackClick(e));
        }

        // The album picker: every handler is delegated from #app and reads the field at the time
        // of the event, so a Home drawn again still answers (F67)
        const typed = () => this.view.$('#artistScanInput')?.value || '';
        this.view.$delegate('#artistScanInput', 'keydown', (e) => {
            if (e.key === 'Enter') this.picker.searchArtist(typed());
        });
        this.view.$delegate('#btnScanArtist', 'click', () => this.picker.searchArtist(typed()));
        this.view.$delegate('#btnScanRetry', 'click', () => this.picker.retry());
        this.view.$delegate('#home-toolbar [data-filter]', 'click', (e, button) => this.picker.toggleFilter(button.dataset.filter));

        // Bulk Validation & Action
        const bulkInput = this.view.$('#bulkPasteInput');
        if (bulkInput) {
            bulkInput.addEventListener('input', (e) => this.validateBulkInput(e.target.value));
        }
        this.view.$delegate('#btnProcessBulk', 'click', () => this.handleBulkProcess());
    }

    /** The box shows, as the person types, whether every line is an album. */
    validateBulkInput(text) {
        this.view.setBulkInputState(bulkInputState(text));
    }

    handleGridClick(e) {
        const card = e.target.closest('[data-action="pick-album"]');
        if (!card) return;
        if (!this.picker.pick(card.dataset.id)) console.warn(`Album not found in the scan: ${card.dataset.id}`);
    }

    handleStackClick(e) {
        // Remove Album
        const removeBtn = e.target.closest('[data-action="remove-album"]');
        if (removeBtn) {
            const albumId = removeBtn.dataset.id;
            this.stagingController.removeAlbum(albumId);
        }
    }

    setMode(mode) {
        this.state.viewMode = mode;
        this.view.updateModeUI(mode);
    }

    /**
     * "Process List": every line that is an album is searched and selected; a line that cannot go
     * in is skipped and listed in the screen with the reason, and the other lines go on (F63).
     */
    async handleBulkProcess() {
        const input = this.view.$('#bulkPasteInput');
        const pasted = readPastedList(input ? input.value : '');

        if (pasted.entries.length === 0 && pasted.skipped.length === 0) {
            toast.warning('Please paste some "Artist - Album" lines first.');
            return;
        }

        this.view.setBulkBusy(true);
        try {
            const searched = await this.stageBulkEntries(pasted.entries);
            this.showBulkOutcome(bulkOutcome({
                added: searched.added,
                skipped: [...pasted.skipped, ...searched.skipped]
            }));
        } finally {
            this.view.setBulkBusy(false);
        }
    }

    /**
     * Search each line in the catalog and select what is found. One line never stops the others.
     * @param {Array<{ line: number, text: string, artist: string, title: string }>} entries
     * @returns {Promise<{ added: number, skipped: Array<{ line: number, text: string, reason: string }> }>}
     */
    async stageBulkEntries(entries) {
        let added = 0;
        const skipped = [];
        for (const entry of entries) {
            const reason = await this.stageBulkEntry(entry);
            if (reason) skipped.push({ line: entry.line, text: entry.text, reason });
            else added++;
        }
        return { added, skipped };
    }

    /**
     * @returns {Promise<string|null>} null when the album was selected, or why it was not (SkipReason)
     */
    async stageBulkEntry({ artist, title }) {
        let results;
        try {
            results = await this.albumSearchService.search(artist, title, { limit: 1 });
        } catch (error) {
            console.error(`[Bulk] Search failed for: ${artist} - ${title}`, error);
            return SkipReason.SEARCH_FAILED;
        }

        const match = results?.[0];
        if (!match) return SkipReason.NOT_FOUND;
        if (this.stagingController.getSelectedAlbums().some(album => album.id === match.id)) return SkipReason.ALREADY_SELECTED;

        this.stagingController.addAlbum(toStagedAlbum(match));
        return null;
    }

    /** Say what happened: a toast, the skipped lines under the box, and the box left with what can be fixed. */
    showBulkOutcome(outcome) {
        toast[outcome.tone](outcome.message);
        this.view.renderBulkReport(outcome.report);

        const input = this.view.$('#bulkPasteInput');
        if (input) input.value = outcome.leftInBox;
        this.validateBulkInput(outcome.leftInBox);
    }

    async handleInitializeLoad() {
        const albums = this.stagingController.getSelectedAlbums();
        const seriesNameInput = this.view.$('#seriesNameInput');
        const seriesName = decodeEntities(seriesNameInput?.value || '').trim() || 'New Album Series';

        if (albums.length === 0) {
            toast.error('Please select at least one album to initialize.');
            return;
        }

        try {
            // Show loading state
            const btn = this.view.$('#btnInitializeLoad');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="animate-pulse">Creating Series...</span>';
            }

            // Create album queries from selected albums
            // One shape, written in one place, with plain text (models/albumQuery.js)
            const albumQueries = albums.map(toAlbumQuery);

            // Create the series via Service
            const db = albumSeriesStore.getDb()
            if (!db) {
                toast.error('Database not initialized')
                return
            }
            const service = getSeriesService(db, null, albumSeriesStore.getUserId())
            const newSeries = await service.createSeries({
                name: seriesName,
                albumQueries: albumQueries,
                status: 'pending'
            });

            toast.success(`Created series: ${seriesName} with ${albums.length} albums`);

            // Navigate to the new series in albums view (Music Series -> By Album)
            router.navigate(`/albums/${newSeries.id}`);

        } catch (error) {
            console.error('[HomeController] Failed to create series:', error);
            toast.error('Failed to create series: ' + error.message);

            // Reset button
            const btn = this.view.$('#btnInitializeLoad');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>Initialize Load Sequence</span>';
            }
        }
    }
}
