/**
 * publishedContentWriter - the repository that SAVES the published texts, for the Painel (F82, REQ-08; ADR-0024): the
 * core's PublishedContentSaveRepository. A file of its own, asked for only by `publishedContentWriter()` of
 * publishedContent.js: who only reads the site never downloads it.
 *
 * The save is one batch locked by the rules of the database (shared/data/batchTransaction.js), not the SDK's transaction:
 * that code lives in the same file as the rest of the SDK, which every visitor downloads, and only the administrator saves.
 */
import { PublishedContentSaveRepository } from '@shared/data/PublishedContentSaveRepository.js'
import { batchTransaction } from '@shared/data/batchTransaction.js'

/**
 * @param {import('@shared/data/store.js').Store} store - the site's store (firestoreStore.js)
 * @returns {PublishedContentSaveRepository}
 */
export const savingRepository = (store) => new PublishedContentSaveRepository({ ...store, runTransaction: batchTransaction(store) })
