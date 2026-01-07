/**
 * AlbumTypeClassifier - Orchestrator for Classification Pipeline
 * 
 * Implements Chain of Responsibility pattern to classify albums through a funnel of strategies.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md
 * @see docs/technical/specs/sprint17.75-classification-modularization/plan.md#1-logic-flow
 */

import {
    AppleMetadataStrategy,
    TitleKeywordStrategy,
    RemixTracksStrategy,
    TrackCountStrategy,
    AIWhitelistStrategy
} from './classification/index.js';

export class AlbumTypeClassifier {
    constructor() {
        // Pipeline order matches the funnel in spec.md
        this.pipeline = [
            new AppleMetadataStrategy(),  // Etapa 1: Apple isSingle/isCompilation
            new TitleKeywordStrategy(),   // Etapa 2: Title patterns
            new RemixTracksStrategy(),    // Etapa 3: Remix track detection
            new TrackCountStrategy(),     // Etapa 4: Track count + duration
            new AIWhitelistStrategy()     // Etapa 5: AI for electronic
        ];
    }

    /**
     * Classify an album through the pipeline
     * Sprint 17.75-B: Made async to support lazy AI fetching in AIWhitelistStrategy
     * @param {Object} album - Album data with raw.attributes, title, trackCount
     * @param {Object} context - Context with getAiList(), genres, etc.
     * @returns {Promise<string>} - Album type: Album, Single, EP, Compilation, Live, Uncategorized
     */
    async classify(album, context = {}) {
        // Build enriched context
        const enrichedContext = this._buildContext(album, context);

        // Run through pipeline
        for (const strategy of this.pipeline) {
            try {
                // Sprint 17.75-B: await in case strategy.execute is async
                const result = await strategy.execute(album, enrichedContext);
                if (result !== null) {
                    return result; // Classified!
                }
            } catch (error) {
                console.error(`[AlbumTypeClassifier] Error in ${strategy.name}:`, error);
                // Continue to next strategy
            }
        }

        // Nothing classified → Uncategorized
        console.log(`[Classify] "${album.title}" → Uncategorized (no strategy matched)`);
        return 'Uncategorized';
    }

    /**
     * Build enriched context for strategies
     */
    _buildContext(album, providedContext) {
        const attributes = album.raw?.attributes || {};
        const genres = (attributes.genreNames || []).map(g => g.toLowerCase());

        return {
            // Provided context (aiList, etc.)
            ...providedContext,

            // Computed values
            genres,
            trackCount: album.trackCount || attributes.trackCount || 0,
            durationMin: (attributes.durationInMillis || 0) / 60000,
            releaseYear: attributes.releaseDate ?
                parseInt(attributes.releaseDate.substring(0, 4)) : null
        };
    }

    /**
     * Classify multiple albums
     * @param {Object[]} albums - Array of albums
     * @param {Object} context - Shared context
     * @returns {Object[]} - Albums with type property added
     */
    classifyAll(albums, context = {}) {
        return albums.map(album => ({
            ...album,
            type: this.classify(album, context),
            // Also set boolean flags for backward compatibility
            isSingle: this.classify(album, context) === 'Single',
            isCompilation: this.classify(album, context) === 'Compilation',
            isLive: this.classify(album, context) === 'Live'
        }));
    }
}

// Singleton export for consistent usage across app
export const albumTypeClassifier = new AlbumTypeClassifier();
