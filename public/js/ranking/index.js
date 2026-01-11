/**
 * Ranking Strategies Registry
 * Exports all available ranking strategies.
 */
import { BalancedRankingStrategy } from './BalancedRankingStrategy.js'
import { SpotifyRankingStrategy } from './SpotifyRankingStrategy.js'
import { BEARankingStrategy } from './BEARankingStrategy.js'
import { UserRankingStrategy } from './UserRankingStrategy.js'

export {
    BalancedRankingStrategy,
    SpotifyRankingStrategy,
    BEARankingStrategy,
    UserRankingStrategy
}

/**
 * Get a strategy instance by ID
 * @param {string} id - Strategy ID ('balanced', 'spotify', 'bea', 'user')
 * @returns {RankingStrategy} Strategy instance (defaulting to Balanced)
 */
export function createRankingStrategy(id) {
    switch (id) {
        case 'spotify':
            return new SpotifyRankingStrategy()
        case 'bea':
            return new BEARankingStrategy()
        case 'user':
            return new UserRankingStrategy()
        case 'balanced':
        case 'combined':  // Alias for balanced (used by Blending Menu UI)
        default:
            return new BalancedRankingStrategy()
    }
}

