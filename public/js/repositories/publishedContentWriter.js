/**
 * publishedContentWriter - the repository that SAVES the published texts, for the Painel (F82, REQ-08; ADR-0024): the
 * core's PublishedContentSaveRepository with the database's transaction. A file of its own, asked for only by
 * `publishedContentWriter()` of publishedContent.js: who only reads the site never downloads it.
 */
import { runTransaction } from 'firebase/firestore'
import { PublishedContentSaveRepository } from '@shared/data/PublishedContentSaveRepository.js'

/**
 * @param {import('@shared/data/store.js').Store} store - the site's store (firestoreStore.js)
 * @returns {PublishedContentSaveRepository}
 */
export const savingRepository = (store) => new PublishedContentSaveRepository({ ...store, runTransaction: (...args) => runTransaction(...args) })
