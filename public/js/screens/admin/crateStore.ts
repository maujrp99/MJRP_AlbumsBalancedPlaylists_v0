/**
 * The Painel's storage of the entry page's crate, on the content repository (F82, REQ-03, REQ-08): the published crate with
 * its revision - or the fixed set of the code when nothing is published - and the save. THE SEAM of where the crate lives:
 * the path, the shape of the document, the transaction with `rev` and `previous` and the conflict are the repository's
 * (shared/data/PublishedCrateRepository: `published/crate`); this only asks, and the Painel knows nothing of them.
 */
import { readCrateDocument, validateCrate } from '@shared/content/crate.js'
import type { Sides } from './crateModel'

type Read = { exists: false } | { exists: true; data: unknown }

/** What the crate section uses of the content repository. */
export interface CrateRepository {
    readCrate: () => Promise<Read>
    readAdmin: (uid: string) => Promise<{ role?: string } | null>
    saveCrate: (ask: { loadedRev: number; sides: Sides; updatedBy: string }) => Promise<{ status: 'saved' | 'unchanged' | 'conflict'; rev: number; sides: object }>
}

/** Where the crate on the screen came from: what is published, the fixed set (nothing published), or a published crate that does not pass the check. */
export type CrateSource = 'published' | 'fixed' | 'mend'

export interface CrateRead {
    sides: Sides
    rev: number
    source: CrateSource
    /** How many albums of the published crate the check refused. */
    rejected: number
    /** The account still has its administrator record. */
    allowed: boolean
}

export interface CrateSaveAnswer {
    status: 'saved' | 'unchanged' | 'conflict'
    rev: number
    sides: Sides
}

/** The storage the crate section is given (the content repository behind it; a test hands its own). */
export interface CrateStore {
    read: () => Promise<CrateRead>
    save: (ask: { loadedRev: number; sides: Sides }) => Promise<CrateSaveAnswer>
}

export interface CrateStoreDeps {
    repository: () => Promise<CrateRepository>
    uid: () => string
    /** The fixed set of the entry page, read from the page itself (fixedCrate.ts): asked for only when it is needed. */
    fixed: () => Promise<Sides>
}

const revOf = (data: unknown): number => Number((data as { rev?: unknown } | null)?.rev) || 0

/** What was read, as the crate to work on; `fixed` gives the entry page's fixed set, when there is nothing else to start from. */
export async function crateOf(read: Read, fixed: () => Promise<Sides>): Promise<Omit<CrateRead, 'allowed'>> {
    if (!read.exists) return { sides: await fixed(), rev: 0, source: 'fixed', rejected: 0 }
    const document = readCrateDocument(read.data)
    // A document that cannot be read counts as none for the albums, but keeps its revision so the next save follows it.
    if (!document.ok) return { sides: await fixed(), rev: revOf(read.data), source: 'mend', rejected: 0 }
    const checked = validateCrate({ sideA: document.sideA, sideB: document.sideB })
    const sides = checked.sides as Sides
    const whole = checked.ok && checked.rejected.length === 0
    return { sides, rev: document.rev, source: whole ? 'published' : 'mend', rejected: checked.rejected.length }
}

export function crateStore(deps: CrateStoreDeps): CrateStore {
    return {
        async read() {
            const repository = await deps.repository()
            const [crate, record] = await Promise.all([repository.readCrate(), repository.readAdmin(deps.uid())])
            return { ...(await crateOf(crate, deps.fixed)), allowed: record?.role === 'super' }
        },
        async save(ask) {
            const answer = await (await deps.repository()).saveCrate({ ...ask, updatedBy: deps.uid() })
            return { status: answer.status, rev: answer.rev, sides: answer.sides as Sides }
        },
    }
}
