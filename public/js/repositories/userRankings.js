/**
 * userRankings - the site's one ranking repository (F78, REQ-09, Ref-A): the core's
 * UserRankingRepository (shared/data/), given the site's Firestore and its app cache. It used to be
 * made at the bottom of the repository file itself; the core may not know the site's database.
 */
import { db } from '../firebase-init.js'
import { cacheManager } from '../cache/CacheManager.js'
import { UserRankingRepository } from '@shared/data/UserRankingRepository.js'
import { firestoreStore } from './firestoreStore.js'

export const userRankingRepository = new UserRankingRepository(firestoreStore(db), cacheManager)
