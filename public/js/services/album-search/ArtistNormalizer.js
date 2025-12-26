/**
 * ArtistNormalizer
 * Handles artist name variations to improve search hit rates.
 * e.g., "Page & Plant" -> "Robert Plant & Jimmy Page"
 */
export class ArtistNormalizer {
    constructor() {
        // Common mappings
        // TODO: Ideally fetch this from a config or backend in the future
        this.mappings = new Map([
            ['page and plant', 'robert plant & jimmy page'],
            ['page & plant', 'robert plant & jimmy page'],
            ['robert plant and jimmy page', 'robert plant & jimmy page'],
            ['led zep', 'led zeppelin'],
            ['zep', 'led zeppelin'],
            ['fab four', 'the beatles'],
            ['stones', 'the rolling stones'],
            ['acdc', 'ac/dc'],
            ['guns n roses', "guns n' roses"],
            ['simon and garfunkel', 'simon & garfunkel'],
            ['crosby stills nash and young', 'crosby, stills, nash & young'],
            ['csny', 'crosby, stills, nash & young'],
            ['elp', 'emerson, lake & palmer'],
            ['ccr', 'creedence clearwater revival']
        ]);
    }

    /**
     * Normalize artist name for search
     * @param {string} artistName
     * @returns {string} Normalized name
     */
    normalize(artistName) {
        if (!artistName) return '';
        const lower = artistName.toLowerCase().trim();
        return this.mappings.get(lower) || artistName.trim();
    }

    /**
     * Get alternative queries for fallback strategies
     * @param {string} artistName
     * @returns {string[]} List of alternative names
     */
    getAlternatives(artistName) {
        const normalized = this.normalize(artistName);
        const alternatives = [normalized];

        // Split "Artist & Artist" handling
        if (normalized.includes('&')) {
            const parts = normalized.split('&').map(s => s.trim());
            // Try "Artist AND Artist"
            alternatives.push(parts.join(' and '));
            // Try swapping "B & A"
            alternatives.push(`${parts[1]} & ${parts[0]}`);
        }

        // Remove "The" prefix
        if (normalized.toLowerCase().startsWith('the ')) {
            alternatives.push(normalized.substring(4));
        }

        return [...new Set(alternatives)]; // Unique list
    }
}
