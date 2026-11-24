/**
 * PublishedCrateRepository - the crate of albums of the entry page in the published content (F82, REQ-03, REQ-08, REQ-09;
 * F95; ADR-0024): where it lives and how the Painel saves it. THE ONE PLACE that knows its path and its shape:
 *
 *   published/crate      { _schemaVersion, rev, sideA: [line], sideB: [line] } - an album is one line of text
 *                        (the line, the albums and the limits of a side: shared/content/crate.js)
 *   cmsWork/save_crate   { _schemaVersion, doc, rev, keys, previous, updatedBy, updatedAt } - who saved, when, and the
 *                        earlier value of the side the save changed (the last save only: F82 REQ-08). Only the
 *                        administrator reads it: the public document carries nothing but the crate
 *
 * A file of its own, beside the repository of the texts, because only the Painel uses it: the site of every visitor
 * downloads neither. The entry page does not use it either: it reads the same document by the database's public address,
 * with no SDK (public/splash/publishedCrate.js). The store is the one the Painel's save already has (`doc`, `getDoc`,
 * `runTransaction`, `serverTimestamp`).
 *
 * The database's rules list the document `crate` and check every album of it (firestore.rules, validCrate). The owner
 * publishes the rules by hand: until the published rules have those lines the save is refused, and the Painel says so.
 */
import { buildCrateSave, readCrateDocument, sameCrate, validateCrate, CRATE_SCHEMA_VERSION } from '../content/crate.js'
import { PublishedContentRepository, PUBLISHED, CMS_WORK } from './PublishedContentRepository.js'

/** The document of the entry page's crate of albums. */
export const CRATE_ID = 'crate'

export class PublishedCrateRepository extends PublishedContentRepository {
    /**
     * The published crate. «Not found» is an answer (`exists: false`); a read that fails throws.
     * @returns {Promise<{ exists: false } | { exists: true, data: Object }>}
     */
    async readCrate() {
        return this.read(PUBLISHED, CRATE_ID)
    }

    /**
     * The Painel's save of the crate, in one transaction, as the texts': the document with `rev` = the one read + 1, and in
     * cmsWork (never in the public document) who saved, when, and the earlier value of the side that changed. The crate is
     * one thing: when another device saved a different crate in between, nothing is written and what is live comes back.
     * @param {{ loadedRev: number, sides: { a: Object[], b: Object[] }, updatedBy: string }} save
     * @returns {Promise<{ status: 'saved'|'unchanged'|'conflict', rev: number, sides: { a: Object[], b: Object[] } }>}
     */
    async saveCrate({ loadedRev, sides, updatedBy }) {
        if (typeof updatedBy !== 'string' || updatedBy === '') throw new Error('PublishedCrateRepository.saveCrate: updatedBy (who saves) is missing')
        const checked = validateCrate({ sideA: sides?.a, sideB: sides?.b })
        if (!checked.ok || checked.rejected.length > 0) throw new Error(`PublishedCrateRepository.saveCrate: the crate does not pass the check (${checked.ok ? checked.rejected[0].reason : checked.reason})`)
        this.need('runTransaction', 'serverTimestamp')
        const { store } = this
        const ref = store.doc(store.db, PUBLISHED, CRATE_ID)
        const workRef = store.doc(store.db, CMS_WORK, `save_${CRATE_ID}`)
        return store.runTransaction(store.db, async (transaction) => {
            const snapshot = await transaction.get(ref)
            const live = snapshot.exists() ? snapshot.data() : null
            const read = readCrateDocument(live)
            const liveSides = read.ok ? { a: read.sideA, b: read.sideB } : null
            const liveRev = Number.isInteger(live?.rev) ? live.rev : 0
            if (liveSides && sameCrate(liveSides, checked.sides)) return { status: 'unchanged', rev: liveRev, sides: liveSides }
            if (liveRev !== loadedRev) return { status: 'conflict', rev: liveRev, sides: liveSides ?? { a: [], b: [] } }
            const { data, previous, changed } = buildCrateSave(live, checked.sides)
            transaction.set(ref, data)
            transaction.set(workRef, {
                _schemaVersion: CRATE_SCHEMA_VERSION, doc: CRATE_ID, rev: data.rev, keys: changed, previous, updatedBy, updatedAt: store.serverTimestamp()
            })
            return { status: 'saved', rev: data.rev, sides: checked.sides }
        })
    }
}
