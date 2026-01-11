/**
 * Algorithm Registry - Factory and registry for playlist generation algorithms
 * 
 * Provides access to all available algorithms and their metadata.
 * 
 * @module algorithms/index
 */

import { MJRPBalancedCascadeAlgorithm } from './MJRPBalancedCascadeAlgorithm.js'
// Top N algorithms for Blending Menu
// Top N algorithms for Blending Menu Recipes
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { TopNPopularAlgorithm } from './TopNPopularAlgorithm.js'
import { TopNAcclaimedAlgorithm } from './TopNAcclaimedAlgorithm.js'
import { TopNUserAlgorithm } from './TopNUserAlgorithm.js'

/**
 * Registry of all available algorithms
 * @type {Map<string, typeof BaseAlgorithm>}
 */
const algorithms = new Map()

// Register all algorithms (order matters for UI display)
algorithms.set('mjrp-balanced-cascade', MJRPBalancedCascadeAlgorithm) // RECOMMENDED first
// Top N algorithms (Blending Menu flavors)
// Sprint 17.5: Consolidated to 2 generic flavors
// Sprint 20: Added User-Generated-Rank flavor
algorithms.set('top-n-popular', TopNPopularAlgorithm)
algorithms.set('top-n-acclaimed', TopNAcclaimedAlgorithm)
algorithms.set('top-n-user', TopNUserAlgorithm)

/**
 * Get algorithm class by ID
 * @param {string} id - Algorithm ID
 * @returns {typeof BaseAlgorithm|null}
 */
export function getAlgorithm(id) {
    return algorithms.get(id) || null
}

/**
 * Get all available algorithms with metadata
 * @returns {Array<{id: string, name: string, badge: string, description: string, isRecommended: boolean}>}
 */
export function getAllAlgorithms() {
    const result = []
    for (const [id, AlgorithmClass] of algorithms) {
        const meta = AlgorithmClass.getMetadata()
        result.push({
            id,
            ...meta
        })
    }
    return result
}

/**
 * Get the recommended algorithm
 * @returns {{id: string, AlgorithmClass: typeof BaseAlgorithm}|null}
 */
export function getRecommendedAlgorithm() {
    for (const [id, AlgorithmClass] of algorithms) {
        const meta = AlgorithmClass.getMetadata()
        if (meta.isRecommended) {
            return { id, AlgorithmClass }
        }
    }
    // Fallback to first algorithm if none marked as recommended
    const first = algorithms.entries().next().value
    return first ? { id: first[0], AlgorithmClass: first[1] } : null
}

/**
 * Create algorithm instance by ID
 * @param {string} id - Algorithm ID
 * @param {Object} opts - Algorithm options
 * @returns {BaseAlgorithm|null}
 */
export function createAlgorithm(id, opts = {}) {
    const AlgorithmClass = getAlgorithm(id)
    if (!AlgorithmClass) {
        console.warn(`[AlgorithmRegistry] Unknown algorithm: ${id}`)
        return null
    }
    return new AlgorithmClass(opts)
}

// Export algorithm classes for direct import if needed
// Export algorithm classes for direct import if needed
export { MJRPBalancedCascadeAlgorithm } from './MJRPBalancedCascadeAlgorithm.js'
// Top N algorithms
export { TopNAlgorithm } from './TopNAlgorithm.js'
export { TopNPopularAlgorithm } from './TopNPopularAlgorithm.js'
export { TopNAcclaimedAlgorithm } from './TopNAcclaimedAlgorithm.js'
export { TopNUserAlgorithm } from './TopNUserAlgorithm.js'


