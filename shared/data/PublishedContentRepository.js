/**
 * PublishedContentRepository - the one place that knows the paths and the shape of what the CMS publishes
 * (F82, REQ-06, REQ-07, REQ-08; ADR-0024):
 *
 *   published/site                  the switches (F93)
 *   published/texts_en, texts_pt    { _schemaVersion, rev, texts: { key: text }, previous?: { key: old text | null } }
 *   cmsAdmins/{uid}                 { role } - created by the owner in the console, read by the person alone
 *   cmsWork/save_texts_<language>   { _schemaVersion, doc, rev, keys, updatedBy, updatedAt } - who saved, and when
 *   cmsWork/<id>                    the Painel's own work (the approvals of the Portuguese)
 *
 * It imports no Firestore: each side hands it a store with the names of the modular Firebase JS SDK. This class READS
 * (`db`, `doc`, `getDoc`) and writes the Painel's work area (`setDoc`); the save of the texts is its subclass
 * (PublishedContentSaveRepository.js), a file only the Painel downloads, so the site's reader carries no code of saving.
 * It does not check the texts: the Painel does, before saving (shared/content/texts.js), and every reader does again.
 */
import { TEXTS_SCHEMA_VERSION } from '../content/texts.js'

export const PUBLISHED = 'published'
export const CMS_ADMINS = 'cmsAdmins'
export const CMS_WORK = 'cmsWork'
export const TEXT_LANGUAGES = Object.freeze(['en', 'pt'])

export const textsId = (language) => {
    if (!TEXT_LANGUAGES.includes(language)) throw new Error(`PublishedContentRepository: "${language}" is not a language of the site`)
    return `texts_${language}`
}

export class PublishedContentRepository {
    /** @param {{ db: Object, doc: Function, getDoc: Function, setDoc?: Function, runTransaction?: Function, serverTimestamp?: Function }} store */
    constructor(store) {
        const missing = ['doc', 'getDoc'].filter(name => typeof store?.[name] !== 'function')
        if (missing.length > 0) throw new Error(`PublishedContentRepository needs a store that reads; missing: ${missing.join(', ')}`)
        this.store = store
    }

    need(...names) {
        const missing = names.filter(name => typeof this.store[name] !== 'function')
        if (missing.length > 0) throw new Error(`PublishedContentRepository: this store does not write; missing: ${missing.join(', ')}`)
    }

    async read(collectionName, id) {
        const snapshot = await this.store.getDoc(this.store.doc(this.store.db, collectionName, id))
        return snapshot.exists() ? { exists: true, data: snapshot.data() } : { exists: false }
    }

    /**
     * The published texts of a language. «Not found» is an answer (`exists: false`); a read that fails throws.
     * @param {string} language - `en` or `pt`
     * @returns {Promise<{ exists: false } | { exists: true, data: Object }>}
     */
    async readTexts(language) {
        return this.read(PUBLISHED, textsId(language))
    }

    /** The site document (the switches). Same answer as readTexts. */
    async readSite() {
        return this.read(PUBLISHED, 'site')
    }

    /**
     * The administrator record of a person: null when there is none, or when the rules do not show it.
     * @param {string} uid
     * @returns {Promise<{ role: string } | null>}
     */
    async readAdmin(uid) {
        if (typeof uid !== 'string' || uid === '' || uid.includes('/')) return null
        try {
            const found = await this.read(CMS_ADMINS, uid)
            return found.exists ? found.data : null
        } catch (error) {
            if (error?.code === 'permission-denied') return null
            throw error
        }
    }

    workRef(id) {
        if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) throw new Error(`PublishedContentRepository: "${id}" is not the id of a work document`)
        return this.store.doc(this.store.db, CMS_WORK, id)
    }

    /** A document of the Painel's work area, or null. @param {string} id @returns {Promise<Object|null>} */
    async readWork(id) {
        const snapshot = await this.store.getDoc(this.workRef(id))
        return snapshot.exists() ? snapshot.data() : null
    }

    /** Writes a whole document of the Painel's work area. @param {string} id @param {Object} data @returns {Promise<void>} */
    async writeWork(id, data) {
        const ref = this.workRef(id)
        this.need('setDoc')
        await this.store.setDoc(ref, { ...data, _schemaVersion: TEXTS_SCHEMA_VERSION })
    }
}
