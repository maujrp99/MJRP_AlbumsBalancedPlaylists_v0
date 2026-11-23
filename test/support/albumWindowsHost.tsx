/**
 * What the albums screen is to its windows, for the tests of the windows (F83 wave 5b): a box that holds them and draws their layer, and the
 * helpers that press, type and wait the way the tests of the hand-made windows did (what changes is the scaffold, never the assertion).
 */
import { StrictMode, act, type MutableRefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { vi } from 'vitest'
import { useAlbumWindows, type AlbumWindows } from '../../public/js/screens/albums/useAlbumWindows'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Host({ api, handlers }: { api: MutableRefObject<AlbumWindows | null>; handlers: { onSeriesUpdated: (id: string) => void; onSeriesDeleted: (id: string) => void } }) {
    const windows = useAlbumWindows(handlers)
    api.current = windows
    return <>{windows.layer}</>
}

export interface MountedWindows {
    windows: () => AlbumWindows
    onSeriesUpdated: ReturnType<typeof vi.fn>
    onSeriesDeleted: ReturnType<typeof vi.fn>
    unmount: () => Promise<void>
}

/** Draws the windows' host in the page, as the albums screen does (in the strict mode of React, the way it is developed). */
export async function mountWindows(): Promise<MountedWindows> {
    const app = document.createElement('div')
    app.id = 'windows-host' // not #app: a test may draw a screen there
    document.body.appendChild(app)
    const api: MutableRefObject<AlbumWindows | null> = { current: null }
    const onSeriesUpdated = vi.fn()
    const onSeriesDeleted = vi.fn()
    const root: Root = createRoot(app)
    await act(async () => { root.render(<StrictMode><Host api={api} handlers={{ onSeriesUpdated, onSeriesDeleted }} /></StrictMode>) })
    return {
        windows: () => api.current as AlbumWindows,
        onSeriesUpdated,
        onSeriesDeleted,
        unmount: async () => { await act(async () => { root.unmount() }); app.remove() }
    }
}

/** Lets the promises that are on their way finish (with the timers faked, only the microtasks and the immediates move). */
export const settle = async (): Promise<void> => {
    await act(async () => {
        for (let i = 0; i < 8; i++) await Promise.resolve()
        await new Promise(resolve => setImmediate(resolve))
        for (let i = 0; i < 8; i++) await Promise.resolve()
    })
}

/** Presses a control: the click, and what React draws after it. */
export const press = async (element: Element | null): Promise<void> => {
    if (!element) throw new Error('nothing to press')
    await act(async () => { (element as HTMLElement).click() })
}

/** Writes into a field the way a browser does (React owns it), and fires the `input` event. */
export const typeInto = async (field: Element | null, value: string): Promise<void> => {
    if (!field) throw new Error('no field')
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

/** Runs a change that may draw again. */
export const change = (work: () => void | Promise<void>): Promise<void> => act(async () => { await work() })
