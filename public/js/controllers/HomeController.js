import { AlbumSearchService } from '../services/album-search/AlbumSearchService.js';
import { SearchController } from '../components/home/SearchController.js';
import { StagingAreaController } from '../components/home/StagingAreaController.js';
import { StagingAreaRenderer } from '../views/renderers/StagingAreaRenderer.js';
import { DiscographyRenderer } from '../views/renderers/DiscographyRenderer.js';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { router } from '../router.js';
import toast from '../components/Toast.js';

export class HomeController {
    constructor(view) {
        this.view = view; // The HomeView instance (provides DOM elements)
        this.albumSearchService = new AlbumSearchService();

        // State
        this.state = {
            viewMode: 'visual', // 'visual' | 'bulk'
            seriesName: 'Start Your Series',
            isScanning: false,
            artist: null
        };

        // Initialize Sub-Controllers
        this.searchController = new SearchController(this);
        this.stagingController = new StagingAreaController(this);

        // Initialize Renderers
        this.discographyRenderer = new DiscographyRenderer(this.view.$('#discographyGrid'));
        this.stagingRenderer = new StagingAreaRenderer(this.view.$('#stagingStackContainer'));
    }

    initialize() {
        console.log('HomeController V3: Initializing...');
        this.bindEvents();
        this.searchController.initialize();
        this.stagingController.initialize();
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

        // Filter Delegation
        this.view.$delegate('#btnFilterAlbums', 'click', () => this.searchController.toggleFilter('albums'));
        this.view.$delegate('#btnFilterSingles', 'click', () => this.searchController.toggleFilter('singles'));
        this.view.$delegate('#btnFilterLive', 'click', () => this.searchController.toggleFilter('live'));
        this.view.$delegate('#btnFilterCompilations', 'click', () => this.searchController.toggleFilter('compilations'));

        // Bulk Validation
        const bulkInput = this.view.$('#bulkPasteInput');
        if (bulkInput) {
            bulkInput.addEventListener('input', (e) => this.validateBulkInput(e.target.value));
        }
    }

    validateBulkInput(text) {
        if (!text) return;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        let validCount = 0;

        lines.forEach(line => {
            if (line.includes('-')) validCount++;
        });

        const input = this.view.$('#bulkPasteInput');
        if (validCount === lines.length && lines.length > 0) {
            input.classList.add('border-green-500', 'bg-green-900/10');
            input.classList.remove('border-white/10', 'border-red-500');
        } else if (lines.length > 0) {
            input.classList.add('border-orange-500'); // Partial or invalid
            input.classList.remove('border-green-500', 'border-white/10');
        } else {
            input.classList.remove('border-green-500', 'border-orange-500', 'bg-green-900/10');
            input.classList.add('border-white/10');
        }
    }

    handleGridClick(e) {
        // Toggle Staging (Add)
        const addBtn = e.target.closest('[data-action="toggle-staging"]');
        if (addBtn) {
            const albumId = addBtn.dataset.id;
            const album = this.searchController.results?.find(a => a.id === albumId || a.appleMusicId === albumId);
            if (album) {
                this.stagingController.addAlbum(album);
            } else {
                console.warn(`Album not found in cache: ${albumId}`);
            }
            return;
        }
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

    async handleInitializeLoad() {
        const albums = this.stagingController.getSelectedAlbums();
        const seriesNameInput = this.view.$('#seriesNameInput');
        const seriesName = seriesNameInput?.value?.trim() || 'New Album Series';

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
            const albumQueries = albums.map(album => ({
                artist: album.artist,
                album: album.title,
                appleMusicId: album.id || album.appleMusicId,
                coverUrl: album.coverUrl || album.artworkTemplate,
                year: album.year
            }));

            // Create the series
            const newSeries = await albumSeriesStore.createSeries({
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
