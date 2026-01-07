/**
 * Classification Strategies - Barrel Export
 * 
 * Part of ARCH-18: Album Classification Modularization
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md
 */

// Base
export { BaseStrategy } from './BaseStrategy.js';

// Strategies (in pipeline order)
export { AppleMetadataStrategy } from './AppleMetadataStrategy.js';
export { TitleKeywordStrategy } from './TitleKeywordStrategy.js';
export { GenreGateStrategy } from './GenreGateStrategy.js'; // Etapa 2.5
export { RemixTracksStrategy } from './RemixTracksStrategy.js';
export { TrackCountStrategy } from './TrackCountStrategy.js';
export { AIWhitelistStrategy } from './AIWhitelistStrategy.js';
export { TypeSanityCheckStrategy } from './TypeSanityCheckStrategy.js';


// Helpers
export {
    ElectronicGenreDetector,
    isElectronic,
    isProgRock,
    ELECTRONIC_GENRES,
    PROG_ROCK_GENRES
} from './ElectronicGenreDetector.js';
