/**
 * Ranking Strategies Registry
 * Exports all available ranking strategies.
 */
import { BalancedRankingStrategy } from './BalancedRankingStrategy.js'
import { SpotifyRankingStrategy } from './SpotifyRankingStrategy.js'
import { BEARankingStrategy } from './BEARankingStrategy.js'

export {
    BalancedRankingStrategy,
    SpotifyRankingStrategy,
    BEARankingStrategy
}

/**
 * Get a strategy instance by ID
 * @param {string} id - Strategy ID ('balanced', 'spotify', 'bea')
 * @returns {RankingStrategy} Strategy instance (defaulting to Balanced)
 */
export function createRankingStrategy(id) {
    switch (id) {
        case 'spotify':
            return new SpotifyRankingStrategy()
        case 'bea':
            return new BEARankingStrategy()
        case 'balanced':
        default:
            return new BalancedRankingStrategy()
    }
}
