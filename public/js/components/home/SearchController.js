export class SearchController {
    constructor(homeController) {
        this.home = homeController; // Parent Controller
        this.service = homeController.albumSearchService;
        this.filterState = { albums: true, singles: false, live: false, compilations: false };
    }

    initialize() {
        // Bind Input Events
        const input = this.home.view.$('#artistScanInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.searchArtist(input.value);
            });
        }

        this.home.view.$delegate('#btnScanArtist', 'click', () => {
            if (input) this.searchArtist(input.value);
        });
    }

    async searchArtist(query) {
        if (!query.trim()) return;

        console.log(`Searching logic for: ${query}`);
        this.home.state.isScanning = true;
        this.home.view.setLoading(true);

        try {
            // 1. Get Artist Data
            const results = await this.service.getArtistDiscography(query);
            this.results = results; // Cache for lookup

            // 2. Sort by Date Newest -> Oldest (Requirement)
            // 2. Sort by Date Newest -> Oldest (Requirement)
            if (results && Array.isArray(results)) {
                console.log(`[SearchController] Sorting ${results.length} albums...`);
                results.sort((a, b) => {
                    // Use exposed releaseDate or fallback to raw attributes
                    const dateA = new Date(a.releaseDate || (a.raw && a.raw.attributes && a.raw.attributes.releaseDate) || 0);
                    const dateB = new Date(b.releaseDate || (b.raw && b.raw.attributes && b.raw.attributes.releaseDate) || 0);
                    return dateB - dateA; // Descending
                });
            }

            // 3. Render
            console.log(`[SearchController] Rendering ${results.length} albums.`);
            // this.home.discographyRenderer.render(results);
            this.applyFilters(); // Apply initial filters (Albums Only by default)

            // 4. Update Status UI
            if (results && results.length > 0) {
                this.home.state.artist = { name: results[0].artist };
                const statusEl = this.home.view.$('#statusArtistName');
                if (statusEl) statusEl.textContent = `→ ${results[0].artist}`;
            } else {
                console.warn('[SearchController] No results found.');
                const statusEl = this.home.view.$('#statusArtistName');
                if (statusEl) statusEl.textContent = '→ Not Found';
                alert('No albums found for this artist.');
            }

        } catch (error) {
            console.error('Search failed', error);
            alert('Artist not found or API error.');
        } finally {
            this.home.state.isScanning = false;
            this.home.view.setLoading(false);
        }
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

        updateBtn('#btnFilterAlbums', this.filterState.albums);
        updateBtn('#btnFilterSingles', this.filterState.singles);
        updateBtn('#btnFilterLive', this.filterState.live);
        updateBtn('#btnFilterCompilations', this.filterState.compilations);
    }

    applyFilters() {
        if (!this.results) return;

        console.log('[SearchController] Applying filters:', this.filterState);

        const filtered = this.results.filter(album => {
            // Use data from AlbumSearchService (now properly mapped)
            const title = (album.title || '').toLowerCase();

            // Type detection with multiple fallbacks
            const isSingle = album.isSingle || album.albumType === 'Single' || album.type === 'Single';
            const isLive = album.isLive || album.albumType === 'Live' || album.type === 'Live' ||
                title.includes('(live') || title.includes('[live');
            const isCompilation = album.isCompilation || album.albumType === 'Compilation' || album.type === 'Compilation' ||
                title.includes('greatest hits') || title.includes('best of') ||
                title.includes('anthology') || title.includes('collection');
            const isEP = album.albumType === 'EP' || album.type === 'EP';

            // Studio album = not single, not live, not compilation, not EP
            const isStudioAlbum = !isSingle && !isLive && !isCompilation && !isEP;

            // Check if enabled
            if (isStudioAlbum && this.filterState.albums) return true;
            if ((isSingle || isEP) && this.filterState.singles) return true;
            if (isLive && this.filterState.live) return true;
            if (isCompilation && this.filterState.compilations) return true;

            return false;
        });

        console.log(`[SearchController] Filtered ${this.results.length} -> ${filtered.length}`);
        this.home.discographyRenderer.render(filtered);
    }
}
