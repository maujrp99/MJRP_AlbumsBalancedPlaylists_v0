import { AlbumSearchService } from '../services/album-search/AlbumSearchService.js';
import { SearchController } from '../components/home/SearchController.js';
import { StagingAreaController } from '../components/home/StagingAreaController.js';
import { StagingAreaRenderer } from '../views/renderers/StagingAreaRenderer.js';
import { DiscographyRenderer } from '../views/renderers/DiscographyRenderer.js';

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
    }

    setMode(mode) {
        this.state.viewMode = mode;
        this.view.updateModeUI(mode);
    }

    async handleInitializeLoad() {
        const albums = this.stagingController.getSelectedAlbums();
        if (albums.length === 0) {
            alert('Please select at least one album to initialize.');
            return;
        }
        // Proceed to Load Sequence (Navigate or Logic)
        console.log('Initializing Load with:', albums);
        // window.location.hash = '#inventory'; // Example navigation
    }
}
