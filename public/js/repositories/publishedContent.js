/**
 * publishedContent - the site's side of the CMS's published content (F82, REQ-10; ADR-0024): the core's
 * PublishedContentRepository (shared/data/), given the site's Firestore. The only place of the site that talks to
 * `published/*`, `cmsAdmins/*` and `cmsWork/*`.
 *
 * Two repositories, because of the weight: the one everybody downloads READS (the site's reader, at start); the one that
 * SAVES needs the database's transaction, whose file comes down only when the Painel asks for it.
 */
import { db } from '../firebase-init.js'
import { PublishedContentRepository } from '@shared/data/PublishedContentRepository.js'
import { firestoreStore } from './firestoreStore.js'

const store = firestoreStore(db)

/** Reads what was published (the texts, the switches, the administrator's own record). */
export const publishedContent = new PublishedContentRepository(store)

/**
 * The repository that also saves (the Painel): the save is a transaction.
 * @returns {Promise<import('@shared/data/PublishedContentSaveRepository.js').PublishedContentSaveRepository>}
 */
export async function publishedContentWriter() {
    const { savingRepository } = await import('./publishedContentWriter.js')
    return savingRepository(store)
}
