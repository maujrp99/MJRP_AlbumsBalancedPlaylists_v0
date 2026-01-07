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
    GenreGateStrategy,
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
            new GenreGateStrategy(),      // Etapa 2.5: Bifurcation (Non-electronic -> Album)
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

        let preliminaryType = null;
        let aiStrategy = null;

        // Run through pipeline
        for (const strategy of this.pipeline) {
            // Identify AI Strategy to call it explicitly later if needed
            if (strategy.name === 'AIWhitelist') {
                aiStrategy = strategy;
                continue; // Don't run AI in the normal loop yet
            }

            try {
                // Sprint 17.75-B: await in case strategy.execute is async
                const result = await strategy.execute(album, enrichedContext);

                if (result !== null) {
                    // SPRINT 17.75-C: FEEDBACK LOOP / SCORECARD PATTERN
                    // Instead of returning immediately, we check if we need AI validation.

                    const isElectronic = import('./classification/ElectronicGenreDetector.js').then(m => m.isElectronic(enrichedContext.genres)).catch(() => false);
                    // Note: We need to resolve import or use the helper function directly if available. 
                    // To keep it simple, we check enrichedContext.genres against the list if we imported it, 
                    // but since ElectronicGenreDetector is used inside strategies, let's rely on the context behavior.

                    // Better approach: Check if it's electronic using the helper if possible, 
                    // or rely on the fact that GenreGateStrategy would have returned null for Electronic.

                    // Logic:
                    // If GenreGate passed (returned null) -> It acts as an implicit "Is Electronic" or "Check Deeply".
                    // But if TitleKeyword or RemixTracks returned a result (e.g. 'EP'), we need to know if we should override.

                    // We only "Rescue" if it's Electronic.
                    // How do we know if it's Electronic here in the loop? 
                    // We can check the strategy name or re-check genres.

                    // Let's use a simpler heuristic for Phase F:
                    // If the result is 'EP', 'Single', or 'Compilation', AND it's Electronic, defer to AI.

                    // Assuming EnrichedContext has genres. We can check them.
                    const isElec = enrichedContext.genres && enrichedContext.genres.length > 0 &&
                        (enrichedContext.genres.some(g =>
                            ['electronic', 'dance', 'trance', 'house', 'techno', 'edm', 'eletrônica'].some(gen => g.includes(gen))
                        ));

                    if (isElec) {
                        preliminaryType = result;
                        // DO NOT RETURN. Continue to find AI Strategy.
                        // But we should stop running other heuristics (like TrackCount) if we already have a hit (e.g. RemixTracks).
                        // So we break the loop and go to AI?
                        break;
                    } else {
                        // Non-electronic -> Accept the result immediately (Legacy/Standard behavior)
                        return result;
                    }
                }
            } catch (error) {
                console.error(`[AlbumTypeClassifier] Error in ${strategy.name}:`, error);
                // Continue to next strategy
            }
        }

        // SPRINT 17.75-C: AI JUDGMENT DAY
        // If we have a preliminary type (or null) and we are here, it means we are either:
        // 1. Electronic album with a preliminary label (EP/Single/Comp) waiting for validation.
        // 2. Electronic album with NO label (null) waiting for classification.
        // 3. Non-electronic album that fell through everything (Uncategorized).

        // We need to reliably check "Is Electronic" again to decide to call AI.
        // Using a robust check matches GenreGate logic.
        const isElec = enrichedContext.genres.some(g =>
            ['electronic', 'dance', 'trance', 'house', 'techno', 'edm', 'eletrônica', 'electrónica'].some(gen => g.includes(gen))
        );

        if (isElec && aiStrategy) {
            // Call AI Strategy with the Preliminary Type
            // We attach it to context so AIStrategy knows what it's validating against
            const aiContext = { ...enrichedContext, preliminaryType };
            const aiResult = await aiStrategy.execute(album, aiContext);

            if (aiResult) {
                return aiResult; // AI Overrode (Studio) or Uncategorized
            }

            // If AI returned null (shouldn't happen for whitelist, but just in case),
            // fallback to preliminary type.
        }

        if (preliminaryType) {
            return preliminaryType;
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
     * Sprint 17.75-B: Made async to match async classify()
     * @param {Object[]} albums - Array of albums
     * @param {Object} context - Shared context
     * @returns {Promise<Object[]>} - Albums with type property added
     */
    async classifyAll(albums, context = {}) {
        const results = [];
        for (const album of albums) {
            const type = await this.classify(album, context);
            results.push({
                ...album,
                type,
                // Also set boolean flags for backward compatibility
                isSingle: type === 'Single',
                isCompilation: type === 'Compilation',
                isLive: type === 'Live'
            });
        }
        return results;
    }
}

// Singleton export for consistent usage across app
export const albumTypeClassifier = new AlbumTypeClassifier();
