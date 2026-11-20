/**
 * ownRanking - where the ranking service is put together with its real sources (like
 * services/albums/albumLoading.js for the album load: the one place that knows the repository).
 */

import { ownRankingsStore } from '../../stores/ownRankings.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { userRankingRepository } from '../../repositories/userRankings.js'
import { OwnRankingService } from './OwnRankingService.js'
import { track } from '../usage/track.js'

export const ownRankingService = new OwnRankingService({
    store: ownRankingsStore,
    getUserId: () => albumSeriesStore.getUserId(),
    getAllRankings: (userId) => userRankingRepository.getAllRankings(userId),
    saveRanking: (userId, albumId, data) => userRankingRepository.saveRanking(userId, albumId, data),
    measure: track
})
