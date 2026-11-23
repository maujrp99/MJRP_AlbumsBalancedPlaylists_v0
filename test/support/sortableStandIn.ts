/**
 * The drag library's stand-in for the tests of the windows that drag tracks (F83 wave 5b): it keeps the options each list was given. It
 * imports nothing of the app, so a `vi.mock('sortablejs', ...)` factory can load it while the module that asks for the library is loading.
 */
export interface DragList {
    element: HTMLElement
    options: Record<string, unknown> & { onChoose?: (e: unknown) => void; onUnchoose?: (e: unknown) => void; onEnd?: (e: unknown) => void }
    dead: boolean
}
export const lists: DragList[] = []

/** `vi.mock('sortablejs', () => sortableStandIn)`: a stand-in that keeps what it was given. */
export function SortableStandIn(this: DragList, element: HTMLElement, options: DragList['options']) {
    this.element = element
    this.options = options
    this.dead = false
    lists.push(this)
}
SortableStandIn.create = (element: HTMLElement, options: DragList['options']) => new (SortableStandIn as unknown as new (e: HTMLElement, o: DragList['options']) => DragList)(element, options)
SortableStandIn.prototype.destroy = function destroy(this: DragList) { this.dead = true }
SortableStandIn.prototype.option = function option(this: DragList, name: string, value?: unknown) {
    if (value === undefined) return this.options[name]
    this.options[name] = value
}

export const sortableStandIn = { default: SortableStandIn }
