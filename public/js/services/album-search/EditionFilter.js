/**
 * EditionFilter
 * Filters and categorizes albums based on edition type (Standard, Deluxe, etc.)
 */
export class EditionFilter {
    /**
     * Filter albums by active filters
     * @param {Array} albums - List of album objects
     * @param {Object} activeFilters - { types: [], editions: [] }
     * @returns {Array} Filtered albums
     */
    apply(albums, activeFilters) {
        if (!activeFilters) return albums;

        return albums.filter(album => {
            const title = album.attributes.name.toLowerCase();

            // Type Filter (Album, Single, Compilation, Live)
            // This requires the album object to have been enriched/classified previously,
            // or we classify on the fly. Assuming enriched for now or mapped.
            // For raw search results, we infer type.

            // Edition Filter
            if (activeFilters.editions && activeFilters.editions.length > 0) {
                const isStandard = !this.isDeluxe(title) && !this.isLive(title);
                const isDeluxe = this.isDeluxe(title);
                const isRemaster = title.includes('remaster');

                // If "Standard" is checked, include standard albums
                if (activeFilters.editions.includes('standard') && isStandard) return true;
                // If "Deluxe" is checked, include deluxe
                if (activeFilters.editions.includes('deluxe') && isDeluxe) return true;
                // If "Remaster" is checked, include remaster
                if (activeFilters.editions.includes('remaster') && isRemaster) return true;

                return false; // Exclude if no match
            }

            return true;
        });
    }

    isDeluxe(title) {
        return title.includes('deluxe') || title.includes('expanded') || title.includes('edition') || title.includes('bonus tracks');
    }

    isLive(title) {
        return title.includes('live') || title.includes('concert') || title.includes('tour');
    }

    isCompilation(album) {
        return album.attributes?.isCompilation === true || album.attributes?.name?.toLowerCase().includes('greatest hits');
    }
}
