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
    AIWhitelistStrategy,
    TypeSanityCheckStrategy // NEW
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
        this.sanityCheck = new TypeSanityCheckStrategy();
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
        // FIX: Find AI Strategy immediately, don't wait for loop
        const aiStrategy = this.pipeline.find(s => s.name === 'AIWhitelist');

        // Run through pipeline
        for (const strategy of this.pipeline) {
            // Skip AI Strategy in main loop (it handles Judgment Day later)
            if (strategy.name === 'AIWhitelist') {
                continue;
            }

            try {
                // Sprint 17.75-B: await in case strategy.execute is async
                const result = await strategy.execute(album, enrichedContext);

                if (result !== null) {
                    // SPRINT 17.75-C: FEEDBACK LOOP / SCORECARD PATTERN

                    // Logic:
                    // If GenreGate passed (returned null) -> It acts as an implicit "Is Electronic" or "Check Deeply".
                    // But if TitleKeyword or RemixTracks returned a result (e.g. 'EP'), we need to know if we should override.

                    // We only "Rescue" if it's Electronic.

                    // Let's use a simpler heuristic for Phase F:
                    // If the result is 'EP', 'Single', or 'Compilation', AND it's Electronic, defer to AI.

                    // Assuming EnrichedContext has genres. We can check them.
                    const isElec = enrichedContext.genres && enrichedContext.genres.length > 0 &&
                        (enrichedContext.genres.some(g =>
                            ['electronic', 'dance', 'trance', 'house', 'techno', 'edm', 'eletrônica', 'electrónica'].some(gen => g.includes(gen))
                        ));

                    if (isElec) {
                        preliminaryType = result;
                        // DO NOT RETURN. Continue to AI Strategy (Judgment Day).
                        // We break the loop so no other heuristics run.
                        break;
                    } else {
                        // Non-electronic -> Accept the result immediately (Legacy/Standard behavior), BUT run sanity check
                        return this._finalize(result, album, enrichedContext);
                    }
                }
            } catch (error) {
                console.error(`[AlbumTypeClassifier] Error in ${strategy.name}:`, error);
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
                return this._finalize(aiResult, album, enrichedContext);
            }

            // If AI returned null (shouldn't happen for whitelist, but just in case),
            // fallback to preliminary type.
        }

        if (preliminaryType) {
            return this._finalize(preliminaryType, album, enrichedContext);
        }

        // Nothing classified → Uncategorized
        console.log(`[Classify] "${album.title}" → Uncategorized (no strategy matched)`);
        return 'Uncategorized';
    }

    /**
     * Finalize classification processing (Sanity Checks)
     */
    _finalize(type, album, context) {
        // --- STEP 6: TYPE SANITY CHECK (POST-PROCESSING) ---
        // Final guard against "Albums" that are actually EPs/Singles

        // --- STEP 6: TYPE SANITY CHECK (POST-PROCESSING) ---
        // Final guard against "Albums" that are actually EPs/Singles

        const sanityContext = { ...context, currentType: type };
        const sanityCorrection = this.sanityCheck.execute(album, sanityContext);

        if (sanityCorrection) {
            console.log(`[Classifier] 🧹 Sanity Check corrected "${type}" to "${sanityCorrection}" for "${album.title}"`);
            return sanityCorrection;
        }

        return type;
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
