/**
 * Algorithm Mixins - Index
 * 
 * Exports all available mixins for algorithm composition.
 * 
 * @module algorithms/mixins
 */

export { PlaylistBalancingMixin } from './PlaylistBalancingMixin.js'
export { DurationTrimmingMixin } from './DurationTrimmingMixin.js'
export { TrackEnrichmentMixin } from './TrackEnrichmentMixin.js'

/**
 * Apply multiple mixins to a base class
 * @param {Function} Base - Base class
 * @param {...Function} mixins - Mixin functions to apply
 * @returns {Function} Extended class
 */
export function applyMixins(Base, ...mixins) {
    return mixins.reduce((acc, mixin) => mixin(acc), Base)
}
