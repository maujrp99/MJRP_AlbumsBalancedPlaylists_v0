/**
 * The state of the Painel's crate section (F82, REQ-03, REQ-09): the crate read (published, or the fixed set), what the
 * owner changed, the search of an album to add, and every state a save can be in: the confirmation of what goes live,
 * saving, saved, failed with the reason, and the conflict when the crate changed on another device.
 *
 * The storage and the search are given (`CrateStore`, `search`); the save itself, its `rev` and its `previous` are the
 * content repository's.
 */
import { useCallback, useEffect, useState } from 'react'
import { sameCrate } from '@shared/content/crate.js'
import type { SearchAnswer, SearchReason } from './appleAlbums'
import { added, countState, moved, removed, sentAcross, type Album, type CountState, type Side, type Sides } from './crateModel'
import type { CrateRead, CrateStore } from './crateStore'
import { failedState, type Phase } from './usePanel'

export type CrateSave =
    | { step: 'idle' }
    | { step: 'confirm' }
    | { step: 'saving' }
    | { step: 'saved' }
    | { step: 'failed'; reason: 'network' | 'rules' | 'session' | 'other'; detail: string }
    | { step: 'conflict'; rev: number; theirs: Sides }

export type Search =
    | { step: 'idle' }
    | { step: 'busy' }
    | { step: 'found'; albums: Album[] }
    | { step: 'none' }
    | { step: 'failed'; reason: SearchReason }

export interface CrateDeps {
    store: CrateStore
    /** Apple Music's catalogue, by the server's route (appleAlbums.ts). */
    search: (query: string) => Promise<SearchAnswer>
}

export interface Crate {
    phase: Phase
    read: CrateRead | null
    saved: Sides
    sides: Sides
    counts: Record<Side, CountState>
    /** There is something to save, and each side holds what the crate can draw. */
    unsaved: boolean
    valid: boolean
    save: CrateSave
    found: Search
    reread: () => void
    move: (side: Side, from: number, to: number) => void
    across: (side: Side, index: number) => void
    remove: (side: Side, index: number) => void
    add: (side: Side, album: Album) => void
    discard: () => void
    askSave: () => void
    back: () => void
    confirm: () => void
    resolve: (choice: 'mine' | 'theirs') => void
    seek: (query: string) => void
}

const EMPTY: Sides = { a: [], b: [] }

function failedSave(error: unknown): CrateSave {
    const state = failedState(error)
    return state.step === 'failed' ? state : { step: 'failed', reason: 'other', detail: '' }
}

const searchOf = (answer: SearchAnswer): Search => {
    if (!answer.ok) return { step: 'failed', reason: answer.reason }
    return answer.albums.length ? { step: 'found', albums: answer.albums } : { step: 'none' }
}

export function useCrate(deps: CrateDeps): Crate {
    const [phase, setPhase] = useState<Phase>('reading')
    const [read, setRead] = useState<CrateRead | null>(null)
    const [sides, setSides] = useState<Sides>(EMPTY)
    const [save, setSave] = useState<CrateSave>({ step: 'idle' })
    const [found, setFound] = useState<Search>({ step: 'idle' })
    // The read and the search in course: a later one, or leaving the screen, makes an earlier answer be ignored.
    const [turn] = useState(() => ({ read: 0, search: 0 }))

    const reread = useCallback(() => {
        const mine = ++turn.read
        setPhase('reading')
        deps.store.read().then((now) => {
            if (mine !== turn.read) return
            setRead(now); setSides(now.sides); setSave({ step: 'idle' })
            setPhase(now.allowed ? 'ready' : 'denied')
        }, () => { if (mine === turn.read) setPhase('failed') })
    }, [deps.store, turn])
    useEffect(() => {
        reread()
        return () => { turn.read++; turn.search++ }
    }, [reread, turn])

    const saved = read?.sides ?? EMPTY
    const counts = countState(sides)
    const valid = counts.a === 'ok' && counts.b === 'ok'
    // A published crate that does not pass the check is mended by saving what is on the screen, even untouched.
    const unsaved = phase === 'ready' && (!sameCrate(saved, sides) || read?.source === 'mend')

    const change = (next: (now: Sides) => Sides) => { setSides(next); if (save.step !== 'saving') setSave({ step: 'idle' }) }

    const run = async (loadedRev: number) => {
        if (!read) return
        setSave({ step: 'saving' })
        try {
            const answer = await deps.store.save({ loadedRev, sides })
            if (answer.status === 'conflict') { setSave({ step: 'conflict', rev: answer.rev, theirs: answer.sides }); return }
            setRead({ ...read, sides: answer.sides, rev: answer.rev, source: 'published', rejected: 0 })
            setSides(answer.sides)
            setSave({ step: 'saved' })
        } catch (error) {
            setSave(failedSave(error))
        }
    }

    return {
        phase, read, saved, sides, counts, unsaved, valid, save, found, reread,
        move: (side, from, to) => change((now) => moved(now, side, from, to)),
        across: (side, index) => change((now) => sentAcross(now, side, index)),
        remove: (side, index) => change((now) => removed(now, side, index)),
        add: (side, album) => change((now) => added(now, side, album)),
        discard: () => { setSides(saved); setSave({ step: 'idle' }) },
        askSave: () => { if (unsaved && valid) setSave({ step: 'confirm' }) },
        back: () => setSave({ step: 'idle' }),
        confirm: () => { if (read && valid) void run(read.rev) },
        resolve: (choice) => {
            if (save.step !== 'conflict') return
            if (choice === 'mine') void run(save.rev)
            else reread()
        },
        seek: (query) => {
            const text = query.trim()
            if (!text) { turn.search++; setFound({ step: 'idle' }); return }
            const mine = ++turn.search
            setFound({ step: 'busy' })
            void deps.search(text).then((answer) => { if (mine === turn.search) setFound(searchOf(answer)) })
        },
    }
}
