/**
 * Algorithm Registry - Factory and registry for playlist generation algorithms
 * 
 * Provides access to all available algorithms and their metadata.
 * 
 * @module algorithms/index
 */

import { LegacyRoundRobinAlgorithm } from './LegacyRoundRobinAlgorithm.js'
import { SDraftOriginalAlgorithm } from './SDraftOriginalAlgorithm.js'
import { MJRPBalancedCascadeAlgorithm } from './MJRPBalancedCascadeAlgorithm.js'
import { MJRPBalancedCascadeV0Algorithm } from './MJRPBalancedCascadeV0Algorithm.js'

/**
 * Registry of all available algorithms
 * @type {Map<string, typeof BaseAlgorithm>}
 */
const algorithms = new Map()

// Register all algorithms (order matters for UI display)
algorithms.set('mjrp-balanced-cascade', MJRPBalancedCascadeAlgorithm) // RECOMMENDED first
algorithms.set('mjrp-cascade-v0', MJRPBalancedCascadeV0Algorithm)
algorithms.set('s-draft-original', SDraftOriginalAlgorithm)
algorithms.set('legacy-roundrobin', LegacyRoundRobinAlgorithm)

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
export { LegacyRoundRobinAlgorithm } from './LegacyRoundRobinAlgorithm.js'
export { SDraftOriginalAlgorithm } from './SDraftOriginalAlgorithm.js'
export { MJRPBalancedCascadeAlgorithm } from './MJRPBalancedCascadeAlgorithm.js'
export { MJRPBalancedCascadeV0Algorithm } from './MJRPBalancedCascadeV0Algorithm.js'


