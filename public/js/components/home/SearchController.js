export class SearchController {
    constructor(homeController) {
        this.home = homeController; // Parent Controller
        this.service = homeController.albumSearchService;
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
        // this.home.view.setLoading(true);

        try {
            // 1. Get Artist Data
            const results = await this.service.getArtistDiscography(query);

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
            this.home.discographyRenderer.render(results);

            // 4. Update Status UI
            if (results && results.length > 0) {
                this.home.state.artist = { name: results[0].artist };
                const statusEl = this.home.view.$('#statusArtistName');
                if (statusEl) statusEl.textContent = results[0].artist;
            } else {
                console.warn('[SearchController] No results found.');
                const statusEl = this.home.view.$('#statusArtistName');
                if (statusEl) statusEl.textContent = "Not Found";
                alert('No albums found for this artist.');
            }

        } catch (error) {
            console.error('Search failed', error);
            alert('Artist not found or API error.');
        } finally {
            this.home.state.isScanning = false;
        }
    }
}
