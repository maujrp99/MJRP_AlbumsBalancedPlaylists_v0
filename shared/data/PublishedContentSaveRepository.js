/**
 * PublishedContentSaveRepository - the Painel's save of the published texts (F82, REQ-06, REQ-08, REQ-09; ADR-0024):
 * the reading repository plus `saveTexts`. A file of its own because only the Painel saves: the site of every visitor
 * downloads the reading one alone. The store must also hand `runTransaction` and `serverTimestamp`.
 */
import { readTextsDocument, TEXTS_SCHEMA_VERSION } from '../content/texts.js'
import { buildTextsSave, findTextConflicts } from '../content/textsSave.js'
import { PublishedContentRepository, PUBLISHED, CMS_WORK, textsId } from './PublishedContentRepository.js'

export class PublishedContentSaveRepository extends PublishedContentRepository {
    /**
     * The Painel's save, in one transaction: the document with `rev` = the one read + 1 and the `previous` of the keys that
     * changed, and who saved and when in cmsWork (never in the public document). When another device saved the same key
     * in between, nothing is written and the conflict comes back key by key; a change to other keys does not stop the save.
     * @param {string} language
     * @param {{ loadedRev: number, loadedTexts: Object, edits: Record<string, string|null>, updatedBy: string }} save
     * @returns {Promise<{ status: 'saved', rev: number, changed: string[], texts: Object }
     *   | { status: 'unchanged', rev: number, texts: Object }
     *   | { status: 'conflict', rev: number, texts: Object, conflicts: Array<{ key: string, loaded: string|null, other: string|null, yours: string|null }> }>}
     */
    async saveTexts(language, { loadedRev, loadedTexts, edits, updatedBy }) {
        const id = textsId(language)
        if (typeof updatedBy !== 'string' || updatedBy === '') throw new Error('PublishedContentRepository.saveTexts: updatedBy (who saves) is missing')
        this.need('runTransaction', 'serverTimestamp')
        const { store } = this
        const ref = store.doc(store.db, PUBLISHED, id)
        const workRef = store.doc(store.db, CMS_WORK, `save_${id}`)
        return store.runTransaction(store.db, async (transaction) => {
            const snapshot = await transaction.get(ref)
            const live = snapshot.exists() ? snapshot.data() : null
            const read = readTextsDocument(live)
            const liveTexts = read.ok ? read.texts : {}
            const liveRev = Number.isInteger(live?.rev) ? live.rev : 0
            if (liveRev !== loadedRev) {
                const conflicts = findTextConflicts({ loaded: loadedTexts, live: liveTexts, edits })
                if (conflicts.length > 0) return { status: 'conflict', rev: liveRev, texts: liveTexts, conflicts }
            }
            const { data, changed } = buildTextsSave(live, edits)
            if (changed.length === 0) return { status: 'unchanged', rev: liveRev, texts: liveTexts }
            transaction.set(ref, data)
            transaction.set(workRef, {
                _schemaVersion: TEXTS_SCHEMA_VERSION, doc: id, rev: data.rev, keys: changed, updatedBy, updatedAt: store.serverTimestamp()
            })
            return { status: 'saved', rev: data.rev, changed, texts: data.texts }
        })
    }
}
