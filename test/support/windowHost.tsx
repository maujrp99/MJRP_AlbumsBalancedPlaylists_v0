/**
 * The scaffold of the tests of the windows in React (F83 wave 6b: the album window, the tracks table, the comparison and the tabs). The tests of the
 * hand-made windows built a node (`showViewAlbumModal(...)`, `new TracksTable(...).render()`) and read it by selector; the same tests are taken over
 * with this: a window is opened the way the screens open it, a piece is drawn into a box of the page, every change goes through `act`, and the test
 * goes on reading the DOM with `querySelector`. What changes is the scaffold, never the assertion.
 *
 *   show(item, options)   the album window as the screens open it (with `options.value`, the inventory's, with the value section above the tracks)
 *   draw(element)         a piece on its own, in a box on the page (taken away by `undraw`)
 *   press(node)           a click and what React draws after it
 *   run(change)           a call that may draw (a source that changed, a redraw of the value) and what React draws after it
 *   closeWindows()        every window opened by `show` goes off the page
 */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { openAlbumWindow } from '../../public/js/ui/albumWindow/openAlbumWindow'
import { openInventoryView } from '../../public/js/ui/inventoryItem/inventoryWindows'
import { closeAllWindows } from '../../public/js/ui/windowLayer'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tick = () => new Promise(resolve => setImmediate(resolve))

/** The window, opened; `overlay` is its element, `handle` what the screen holds of it. */
export async function show(item: Record<string, unknown>, options: Record<string, any> = {}): Promise<{ overlay: HTMLElement; handle: any }> {
    let handle: unknown
    await act(async () => {
        handle = options.value ? await openInventoryView(item, options as never) : await openAlbumWindow(item, options)
        for (let i = 0; i < 4; i++) await tick()
    })
    return { overlay: [...document.querySelectorAll<HTMLElement>('.modal-overlay')].at(-1)!, handle }
}

export async function press(node: HTMLElement): Promise<void> {
    await act(async () => { node.click(); for (let i = 0; i < 4; i++) await tick() })
}

export async function run(change: () => unknown): Promise<void> {
    await act(async () => { await change(); for (let i = 0; i < 4; i++) await tick() })
}

export const closeWindows = (): Promise<void> => act(async () => { closeAllWindows() })

const roots: Root[] = []

export async function draw(element: ReactElement): Promise<HTMLElement> {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    roots.push(root)
    await act(async () => { root.render(element) })
    return host
}

export async function undraw(): Promise<void> {
    await act(async () => { roots.splice(0).forEach(root => root.unmount()) })
}
