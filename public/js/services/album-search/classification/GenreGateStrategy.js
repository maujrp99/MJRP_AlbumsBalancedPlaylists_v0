/**
 * GenreGateStrategy - Etapa 2.5 do Funil (Bifurcation Point)
 * 
 * Acts as a gatekeeper to separate classification logic by genre.
 * - Non-Electronic: Returns 'Album' immediately (trusts Apple API/Metadata).
 * - Electronic: Returns null (passes through to heuristics funnel).
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/plan.md#76-refinement-genre-bifurcation
 */

import { BaseStrategy } from './BaseStrategy.js';
import { isElectronic } from './ElectronicGenreDetector.js';

export class GenreGateStrategy extends BaseStrategy {
    name = 'GenreGate';

    execute(album, context) {
        const genres = context.genres || [];

        // If NOT electronic, we trust the album is an Album (since it passed AppleMetadata & TitleKeyword)
        // This prevents Rock/Pop/Jazz albums with low track counts from being misclassified as EPs/Singles
        // and skips unnecessary AI processing.
        if (!isElectronic(genres)) {
            this.log(album.title, 'Album', `Non-electronic genre (${genres[0] || 'unknown'}), trusting metadata`);
            return 'Album';
        }

        // If Electronic, continue to the heuristics funnel (Remix -> TrackCount -> AI)
        return null;
    }
}
