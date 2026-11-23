/**
 * The Painel's storage on the content repository (F82, REQ-06 to REQ-08; TASK-01, the adapter): the published texts of the
 * two languages with their revisions, the approvals of the Portuguese (`cmsWork/approved_pt`) and the save. The paths, the
 * shape of the documents, the transaction with `rev` and `previous` and the conflict are the repository's
 * (shared/data/PublishedContentRepository); this only asks.
 */
import type { ContentStore, SaveAnswer, Stored } from './kitPorts'
import type { Dict, Locale } from './model'

/** The work document that keeps the keys whose Portuguese the owner approved. */
export const APPROVED_ID = 'approved_pt'

type Read = { exists: false } | { exists: true; data: unknown }

/** What the Painel uses of the content repository. */
export interface ContentRepository {
    readTexts: (locale: Locale) => Promise<Read>
    readAdmin: (uid: string) => Promise<{ role?: string } | null>
    readWork: (id: string) => Promise<Record<string, unknown> | null>
    writeWork: (id: string, data: Record<string, unknown>) => Promise<void>
    saveTexts: (locale: Locale, ask: { loadedRev: number; loadedTexts: Dict; edits: Dict; updatedBy: string }) => Promise<SaveAnswer>
}

export interface ContentStoreDeps {
    /** The repository that also saves (its file comes down only with the Painel). */
    repository: () => Promise<ContentRepository>
    /** The administrator's id, for `updatedBy` and for the read of his own record. */
    uid: () => string
    code: Record<Locale, Dict>
    /** Reads a stored texts document (shared/content: `readTextsDocument`). */
    readDocument: (data: unknown) => { ok: true; rev: number; texts: Dict } | { ok: false }
}

const NOTHING = { rev: 0, texts: {} as Dict }

function textsOf(read: Read, readDocument: ContentStoreDeps['readDocument']): { rev: number; texts: Dict } {
    if (!read.exists) return NOTHING
    const document = readDocument(read.data)
    // A document that cannot be read counts as none for the texts, but keeps its revision so the next save follows it.
    return document.ok ? { rev: document.rev, texts: document.texts } : { rev: Number((read.data as { rev?: unknown } | null)?.rev) || 0, texts: {} }
}

const keysOf = (work: Record<string, unknown> | null): string[] => (Array.isArray(work?.keys) ? work.keys.filter((key): key is string => typeof key === 'string') : [])

export function contentStore(deps: ContentStoreDeps): ContentStore {
    return {
        async read(): Promise<Stored> {
            const repository = await deps.repository()
            const [en, pt, record] = await Promise.all([repository.readTexts('en'), repository.readTexts('pt'), repository.readAdmin(deps.uid())])
            const allowed = record?.role === 'super'
            const approved = allowed ? keysOf(await repository.readWork(APPROVED_ID)) : []
            const texts = { en: textsOf(en, deps.readDocument), pt: textsOf(pt, deps.readDocument) }
            return {
                sources: { code: deps.code, published: { en: texts.en.texts, pt: texts.pt.texts }, approved },
                revs: { en: texts.en.rev, pt: texts.pt.rev },
                allowed,
            }
        },
        async saveTexts(locale, ask) {
            return (await deps.repository()).saveTexts(locale, { ...ask, updatedBy: deps.uid() })
        },
        async saveApproved(keys) {
            await (await deps.repository()).writeWork(APPROVED_ID, { keys: [...keys].sort() })
        },
    }
}
