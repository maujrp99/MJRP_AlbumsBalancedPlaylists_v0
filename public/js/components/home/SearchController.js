export class SearchController {
    constructor(homeController) {
        this.home = homeController; // Parent Controller
        this.service = homeController.albumSearchService;
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

                // ARCH-18: Calculate and update filter counts
                const counts = this.calculateTypeCounts();
                this.home.view.updateFilterCounts(counts);
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

        // ARCH-18: Update all filter buttons including EP and Uncategorized
        updateBtn('#btnFilterAlbums', this.filterState.albums);
        updateBtn('#btnFilterEPs', this.filterState.eps);
        updateBtn('#btnFilterSingles', this.filterState.singles);
        updateBtn('#btnFilterLive', this.filterState.live);
        updateBtn('#btnFilterCompilations', this.filterState.compilations);
        updateBtn('#btnFilterUncategorized', this.filterState.uncategorized);
    }

    applyFilters() {
        if (!this.results) return;

        console.log('[SearchController] Applying filters:', this.filterState);

        const filtered = this.results.filter(album => {
            // ARCH-18: Use album.type directly from classification pipeline
            const type = album.type || 'Uncategorized';

            // Map filter state to album types
            if (type === 'Album' && this.filterState.albums) return true;
            if (type === 'EP' && this.filterState.eps) return true;
            if (type === 'Single' && this.filterState.singles) return true;
            if (type === 'Live' && this.filterState.live) return true;
            if (type === 'Compilation' && this.filterState.compilations) return true;
            if (type === 'Uncategorized' && this.filterState.uncategorized) return true;

            return false;
        });

        console.log(`[SearchController] Filtered ${this.results.length} -> ${filtered.length}`);
        this.home.discographyRenderer.render(filtered);
    }

    /**
     * ARCH-18: Calculate counts for each type from results
     * @returns {Object} - { Album: n, EP: n, Single: n, Compilation: n, Live: n, Uncategorized: n }
     */
    calculateTypeCounts() {
        if (!this.results) return {};

        const counts = {
            Album: 0,
            EP: 0,
            Single: 0,
            Compilation: 0,
            Live: 0,
            Uncategorized: 0
        };

        this.results.forEach(album => {
            const type = album.type || 'Uncategorized';
            if (counts.hasOwnProperty(type)) {
                counts[type]++;
            } else {
                counts.Uncategorized++;
            }
        });

        console.log('[SearchController] Type counts:', counts);
        return counts;
    }
}
