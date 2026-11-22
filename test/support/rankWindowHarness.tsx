/**
 * What the tests of the ranking window share (F83 wave 5b): the drop of a row the way the drag library does it, the screen as a phone or a computer, and a way to open the window with callbacks the test can read.
 */
import { vi, type Mock } from 'vitest'
import { act } from 'react'
import { mountWindows, settle, type MountedWindows } from './albumWindowsHost'
import type { RankAlbum } from '../../public/js/screens/albums/rankSession'
import { lists, type DragList } from './sortableStandIn'

export { lists }

/** The list of the tracks that is alive now. */
export const liveList = (): DragList => {
    const found = [...lists].reverse().find(item => !item.dead && item.element.isConnected)
    if (!found) throw new Error('no drag list alive')
    return found
}

/** Drops the row `from` at place `to`, as the drag library does: it moves the row, then says so. */
export async function drop(from: number, to: number): Promise<void> {
    const list = liveList()
    const item = list.element.children[from] as HTMLElement
    await act(async () => {
        list.options.onChoose?.({ item })
        const rows = [...list.element.children]
        rows.splice(from, 1)
        rows.splice(to, 0, item)
        rows.forEach(row => list.element.appendChild(row))
        list.options.onUnchoose?.({ item })
        list.options.onEnd?.({ item, from: list.element, to: list.element, oldIndex: from, newIndex: to })
    })
    await settle()
}

/** The screen as a phone or a computer; `turn` changes it and tells whoever listens. */
export function asScreen(phone: boolean): { turn: (to: boolean) => Promise<void> } {
    const listeners: Array<(event: { matches: boolean }) => void> = []
    const state = { phone }
    window.scrollTo = (() => {}) as typeof window.scrollTo // the sheet gives the page its place back; jsdom has no scroll
    window.matchMedia = ((query: string) => ({
        get matches() { return /max-width/.test(query) && state.phone },
        addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => { if (/max-width/.test(query)) listeners.push(listener) },
        removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    })) as unknown as typeof window.matchMedia
    return {
        turn: async (to: boolean) => {
            state.phone = to
            await act(async () => { listeners.slice().forEach(listener => listener({ matches: to })) })
        }
    }
}

export interface OpenedRank {
    mounted: MountedWindows
    onSubmit: Mock<[unknown], Promise<boolean>>
    onSave: Mock
    onClose: Mock
}

/** Opens the window to rank `album`, with callbacks to read. */
export async function openRank(album: RankAlbum, onSubmit: (rankings: unknown) => Promise<boolean> = async () => true): Promise<OpenedRank> {
    const mounted = await mountWindows()
    const submit = vi.fn(onSubmit)
    const onSave = vi.fn()
    const onClose = vi.fn()
    await act(async () => { mounted.windows().openRank({ album, onSubmit: submit, onSave, onClose }) })
    return { mounted, onSubmit: submit, onSave, onClose }
}

