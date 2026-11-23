/** The part of sortablejs the bridge uses (the package ships no types and the site takes no new dependency for them). */
declare module 'sortablejs' {
    export interface SortableEvent {
        item: HTMLElement
        from: HTMLElement
        to: HTMLElement
        oldIndex?: number
        newIndex?: number
    }
    export interface SortableOptions {
        group?: string
        animation?: number
        ghostClass?: string
        dragClass?: string
        handle?: string
        delay?: number
        delayOnTouchOnly?: boolean
        touchStartThreshold?: number
        onStart?: (event: SortableEvent) => void
        onEnd?: (event: SortableEvent) => void
    }
    export default class Sortable {
        constructor(element: HTMLElement, options?: SortableOptions)
        option(name: 'handle', value: string): void
        destroy(): void
    }
}
