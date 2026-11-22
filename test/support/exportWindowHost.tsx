/**
 * What a screen is to the export window, for its tests (F83 sync 2): a box that holds the window and draws its layer, and the helpers
 * that open it, pick a folder and type into the field the way the tests of the hand-made window did (what changes is the scaffold,
 * never the assertion). `openPlaylistExport(job)` opens the window as the hand-made function of the same name did.
 */
import { StrictMode, act, type MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'
import { usePlaylistExport, type ExportJob } from '../../public/js/ui/PlaylistExportWindow'
import * as playlistExports from '../../public/js/controllers/playlistExportEntries.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Api = ReturnType<typeof usePlaylistExport>

function Host({ api }: { api: MutableRefObject<Api | null> }) {
    const exportWindow = usePlaylistExport({ exports: playlistExports })
    api.current = exportWindow
    return <>{exportWindow.layer}</>
}

const roots: Array<{ unmount: () => void }> = []

/** Takes every window opened by the test off the page, the way leaving the screen does (before the page is wiped: a root must not outlive its nodes). */
export function unmountAll(): void {
    act(() => { while (roots.length) roots.pop()?.unmount() })
}

/** Opens the window from a tap, in a screen that holds it (in the strict mode of React, the way it is developed). */
export function openPlaylistExport(job: ExportJob = {}): void {
    const app = document.createElement('div')
    document.body.appendChild(app)
    const api: MutableRefObject<Api | null> = { current: null }
    const root = createRoot(app)
    roots.push(root)
    act(() => { root.render(<StrictMode><Host api={api} /></StrictMode>) })
    act(() => { (api.current as Api).open(job) })
}

/** Lets what is on its way (a promise answered, a draw scheduled) arrive. */
export const settle = (): Promise<void> => act(async () => { await new Promise(resolve => setTimeout(resolve, 25)) })

/** A press, as a person makes it: React is told. */
export const press = (element: Element | null): void => { act(() => { (element as HTMLElement).click() }) }

/** Types into a field the way a person does: the value the page keeps is told, and the field says it changed. */
export function typeInto(field: HTMLInputElement, value: string): void {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    act(() => {
        set?.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
    })
}
