/**
 * The Painel's state (F82, REQ-06, REQ-08, REQ-09; TASK-01 and the panel's side of TASK-14): what was read, what the owner
 * changed, and every state a save can be in: the confirmation of what goes live, saving, saved, refused by the check,
 * failed with the reason, and the conflict between two devices (as it was, the other, yours).
 *
 * The storage is given (`ContentStore`); the save itself, its `rev` and its `previous` are the content repository's.
 */
import { useCallback, useEffect, useState } from 'react'
import { textOf, type KitValues } from '../../ui/admin-kit/index'
import { failureOf, type ContentStore, type SaveAnswer, type Stored } from './kitPorts'
import { LOCALES, editsOf, isPending, toKitValues, unsavedKeys, withEdit, type Dict, type Locale, type TextKind } from './model'

export type Check = { ok: true; warning: string | null } | { ok: false; reason: string }
export type Edits = Record<Locale, Record<string, string | null>>
type Conflict = Extract<SaveAnswer, { status: 'conflict' }>

export type SaveState =
    | { step: 'idle' }
    | { step: 'confirm' }
    | { step: 'saving' }
    | { step: 'saved'; count: number; approved: boolean }
    | { step: 'invalid'; count: number }
    | { step: 'failed'; reason: 'network' | 'rules' | 'session' | 'other'; detail: string }
    | { step: 'conflict'; locale: Locale; conflict: Conflict; edits: Edits; approving: string[] }

export type Phase = 'reading' | 'failed' | 'denied' | 'ready'

export interface PanelDeps {
    store: ContentStore
    kindOf: (key: string) => TextKind
    /** The site's own check of a text against the English of the code (shared/content). */
    check: (text: string, english: string, kind: TextKind) => Check
    /** Told what is live after a save, so the site behind the Painel speaks the new text at once. */
    published?: (locale: Locale, texts: Dict) => void
}

const NO_EDITS = (): Edits => ({ en: {}, pt: {} })
const REASONS = { refused: 'rules', 'session-expired': 'session', 'save-failed': 'other' } as const

/** The failed state of a save, from what the database said. */
export function failedState(error: unknown): SaveState {
    const { failure, message } = failureOf(error)
    const offline = failure === 'save-failed' && (!message || /unavailable|deadline|network/.test(message))
    return { step: 'failed', reason: offline ? 'network' : REASONS[failure], detail: message ?? '' }
}

const advance = (stored: Stored, locale: Locale, answer: { rev: number; texts: Dict }): Stored => ({
    ...stored,
    sources: { ...stored.sources, published: { ...stored.sources.published, [locale]: answer.texts } },
    revs: { ...stored.revs, [locale]: answer.rev },
})

/** The edits as the repository takes them: a text put back to the code's leaves the published document (`null`). */
export function forSave(stored: Stored, saved: KitValues, values: KitValues, only?: readonly string[]): Edits {
    const edits = NO_EDITS()
    for (const locale of LOCALES) {
        for (const [key, text] of Object.entries(editsOf(saved, values, locale))) {
            if (only && !only.includes(key)) continue
            edits[locale][key] = text === stored.sources.code[locale][key] ? null : text
        }
    }
    return edits
}

export const countOf = (edits: Edits): number => new Set(LOCALES.flatMap((locale) => Object.keys(edits[locale]))).size

export type SaveRun = { stored: Stored; saved: number } | { stored: Stored; locale: Locale; conflict: Conflict }

/** Saves each language's edits on the revision read; stops at the first conflict, with nothing of that language written. */
export async function saveAll(store: ContentStore, start: Stored, edits: Edits, published?: PanelDeps['published']): Promise<SaveRun> {
    let stored = start
    let saved = 0
    for (const locale of LOCALES) {
        if (!Object.keys(edits[locale]).length) continue
        const answer = await store.saveTexts(locale, { loadedRev: stored.revs[locale], loadedTexts: stored.sources.published[locale], edits: edits[locale] as Dict })
        if (answer.status === 'conflict') return { stored, locale, conflict: answer }
        stored = advance(stored, locale, answer)
        saved += Object.keys(edits[locale]).length
        published?.(locale, answer.texts)
    }
    return { stored, saved }
}

/** The edits that fail the check, by key: nothing is saved while one does (the first barrier of REQ-06). */
export function invalidEdits(deps: Pick<PanelDeps, 'check' | 'kindOf'>, stored: Stored, edits: Edits): string[] {
    const bad: string[] = []
    for (const locale of LOCALES) {
        for (const [key, text] of Object.entries(edits[locale])) {
            if (text === null) continue
            const english = stored.sources.code.en[key]
            if (english === undefined || !deps.check(text, english, deps.kindOf(key)).ok) bad.push(key)
        }
    }
    return bad
}

/** The values with the conflicting keys given up: they take what is live now. */
function withTheirs(values: KitValues, locale: Locale, conflict: Conflict, code: Dict): KitValues {
    return conflict.conflicts.reduce((next, { key, other }) => withEdit(next, key, locale, other ?? code[key] ?? ''), values)
}

function withoutKeys(edits: Edits, locale: Locale, keys: readonly string[]): Edits {
    const kept = Object.fromEntries(Object.entries(edits[locale]).filter(([key]) => !keys.includes(key)))
    return { ...edits, [locale]: kept }
}

export interface Panel {
    phase: Phase
    stored: Stored | null
    saved: KitValues
    values: KitValues
    save: SaveState
    unsaved: string[]
    read: () => void
    edit: (key: string, locale: Locale, text: string) => void
    discard: () => void
    askSave: () => void
    back: () => void
    confirm: () => void
    approve: (keys: readonly string[]) => void
    resolve: (choice: 'mine' | 'theirs') => void
}

export function usePanel(deps: PanelDeps): Panel {
    const [phase, setPhase] = useState<Phase>('reading')
    const [stored, setStored] = useState<Stored | null>(null)
    const [saved, setSaved] = useState<KitValues>({})
    const [values, setValues] = useState<KitValues>({})
    const [save, setSave] = useState<SaveState>({ step: 'idle' })
    // The read in course: a later read, or leaving the screen, makes an earlier answer be ignored.
    const [turn] = useState(() => ({ count: 0 }))

    const read = useCallback(() => {
        const mine = ++turn.count
        setPhase('reading')
        deps.store.read().then((now) => {
            if (mine !== turn.count) return
            const pairs = toKitValues(now.sources)
            setStored(now); setSaved(pairs); setValues(pairs); setSave({ step: 'idle' })
            setPhase(now.allowed ? 'ready' : 'denied')
        }, () => { if (mine === turn.count) setPhase('failed') })
    }, [deps.store, turn])
    useEffect(() => {
        read()
        return () => { turn.count++ }
    }, [read, turn])

    /** Runs a save and puts its end on the screen; `approving` are the keys whose Portuguese is approved with it. */
    const run = async (from: Stored, now: KitValues, edits: Edits, approving: string[]) => {
        setSave({ step: 'saving' })
        try {
            const result = await saveAll(deps.store, from, edits, deps.published)
            if ('conflict' in result) {
                setStored(result.stored); setSaved(toKitValues(result.stored.sources))
                setSave({ step: 'conflict', locale: result.locale, conflict: result.conflict, edits, approving })
                return
            }
            let next = result.stored
            if (approving.length) {
                const approved = [...new Set([...next.sources.approved, ...approving])]
                await deps.store.saveApproved(approved)
                next = { ...next, sources: { ...next.sources, approved } }
            }
            const pairs = toKitValues(next.sources)
            // An approval saves only its own keys: the other changes not saved stay on the screen.
            const after = approving.length ? Object.fromEntries(Object.keys(now).map((key) => [key, approving.includes(key) ? pairs[key] : now[key]])) : pairs
            setStored(next); setSaved(pairs); setValues(after)
            const count = approving.length || result.saved
            setSave(count ? { step: 'saved', count, approved: approving.length > 0 } : { step: 'idle' })
        } catch (error) {
            setSave(failedState(error))
        }
    }

    const checked = (edits: Edits, approving: string[]) => {
        if (!stored) return
        const bad = invalidEdits(deps, stored, edits)
        if (bad.length) setSave({ step: 'invalid', count: bad.length })
        else void run(stored, values, edits, approving)
    }

    return {
        phase, stored, saved, values, save,
        unsaved: unsavedKeys(saved, values),
        read,
        edit: (key, locale, text) => { setValues((now) => withEdit(now, key, locale, text)); if (save.step !== 'saving') setSave({ step: 'idle' }) },
        discard: () => { setValues(saved); setSave({ step: 'idle' }) },
        askSave: () => setSave({ step: 'confirm' }),
        back: () => setSave({ step: 'idle' }),
        confirm: () => { if (stored) checked(forSave(stored, saved, values), []) },
        approve: (keys) => {
            const waiting = keys.filter((key) => isPending(values, key) && textOf(values, key, 'pt'))
            if (stored && waiting.length) checked({ en: {}, pt: forSave(stored, saved, values, waiting).pt }, waiting)
        },
        resolve: (choice) => {
            if (save.step !== 'conflict' || !stored) return
            const { locale, conflict, edits, approving } = save
            const from = advance(stored, locale, conflict)
            const lost = conflict.conflicts.map((entry) => entry.key)
            const mine = choice === 'mine'
            const now = mine ? values : withTheirs(values, locale, conflict, from.sources.code[locale])
            setValues(now)
            void run(from, now, mine ? edits : withoutKeys(edits, locale, lost), approving)
        },
    }
}
