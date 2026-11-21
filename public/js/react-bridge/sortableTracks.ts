/**
 * useSortableTracks - drag and drop of the tracks of the playlists screen, by `sortablejs`, for a React screen (F83 wave 2, TASK-14;
 * proposal § 4.5; the measurement is reports/audits/2026-11-21-mjrpalbumblender-v0-f83-wave-2-drag-and-drop.md).
 *
 * Why a bridge and not a second library: `sortablejs` moves the dragged row in the DOM by itself, and React must never meet a DOM it
 * did not write. So the bridge lets Sortable do the drag, and when the drop is over it PUTS THE ROW BACK where React had it, then tells
 * the screen what moved (`onMove`), and the screen asks the service, which changes the store; React draws the new order from the
 * store. The behaviour of today is kept as it was: the whole row is the handle on a computer, only the position on the phone, a touch
 * waits 100 ms before it picks a row up, and a row can be dropped in any list (`group`).
 *
 * The lists are found by their class (`.playlist-tracks`) inside the box the screen gives: the screen keeps its rows keyed by place,
 * so the row put back is the node React still holds. One Sortable per list, made once and kept while the list is in the page; it is
 * not made again while a drag is going on (a store that changes in the middle of a drag does not drop the row in the hand).
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import Sortable, { type SortableEvent } from 'sortablejs'

export interface TrackMove {
    fromPlaylist: number
    toPlaylist: number
    oldIndex: number
    newIndex: number
}

interface Options {
    /** The handle of the drag: the whole row on a computer, the position on the phone. */
    handle: string
    onMove: (move: TrackMove) => void
}

const LISTS = '.playlist-tracks'

const playlistOf = (list: HTMLElement): number => parseInt(list.closest<HTMLElement>('[data-playlist-index]')?.dataset.playlistIndex ?? '', 10)

/** Puts the row back in the list and the place React gave it: the list it left, before the row that was after it. */
export function putBack(event: SortableEvent): void {
    const { item, from, oldIndex } = event
    item.remove()
    from.insertBefore(item, from.children[oldIndex ?? 0] ?? null)
}

export function useSortableTracks(box: RefObject<HTMLElement | null>, options: Options): void {
    const sortables = useRef(new Map<HTMLElement, Sortable>())
    const dragging = useRef(false)
    const latest = useRef(options)
    latest.current = options

    const end = (event: SortableEvent) => {
        dragging.current = false
        document.body.classList.remove('grabbing')
        putBack(event)
        const move = { fromPlaylist: playlistOf(event.from), toPlaylist: playlistOf(event.to), oldIndex: event.oldIndex ?? NaN, newIndex: event.newIndex ?? NaN }
        if (Number.isNaN(move.fromPlaylist) || Number.isNaN(move.toPlaylist)) return
        // asked after this handler returns, as it always was: Sortable finishes the drop first
        queueMicrotask(() => latest.current.onMove(move))
    }

    // after every draw: the lists that came get a Sortable, the ones that went lose theirs, the handle follows the phone
    useLayoutEffect(() => {
        const root = box.current
        if (!root || dragging.current) return
        const present = new Set(root.querySelectorAll<HTMLElement>(LISTS))
        sortables.current.forEach((sortable, list) => {
            if (!present.has(list)) {
                sortable.destroy()
                sortables.current.delete(list)
            }
        })
        present.forEach(list => {
            const known = sortables.current.get(list)
            if (known) {
                known.option('handle', options.handle)
                return
            }
            sortables.current.set(list, new Sortable(list, {
                group: 'shared-tracks',
                animation: 150,
                ghostClass: 'bg-white/5',
                dragClass: 'opacity-100',
                handle: options.handle,
                delay: 100,
                delayOnTouchOnly: true,
                touchStartThreshold: 3,
                onStart: () => { dragging.current = true; document.body.classList.add('grabbing') },
                onEnd: end
            }))
        })
    })

    useEffect(() => () => {
        sortables.current.forEach(sortable => sortable.destroy())
        sortables.current.clear()
        document.body.classList.remove('grabbing')
    }, [])
}
