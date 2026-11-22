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
 *
 * Wave 5b: a second screen drags with it (the window to rank the tracks of an album: one list, the whole row or the handle, no group, no
 * wait for a touch). What differs between the two is a `DragProfile` (which lists, which number a list has, the options handed to
 * Sortable, the class on the page while a row is in the hand); the default is the playlists screen's, so that screen is unchanged. There
 * is one bridge, not two.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import Sortable, { type SortableEvent } from 'sortablejs'

export interface TrackMove {
    fromPlaylist: number
    toPlaylist: number
    oldIndex: number
    newIndex: number
}

/** What differs from one screen to another: the lists, the number a list has, what Sortable is given, the class on the page during a drag. */
export interface DragProfile {
    /** The CSS selector of the lists of tracks, inside the box the screen gives. */
    lists: string
    /** The number of the list a row is in (`NaN` when it has none: the move is not reported). */
    numberOf: (list: HTMLElement) => number
    /** What Sortable is given besides the handle and its own callbacks (`animation`, `group`, the classes, the wait for a touch). */
    sortable: Record<string, unknown>
    /** The class the page wears while a row is in the hand; `null` for none. */
    grabbingClass: string | null
}

interface Options {
    /** The handle of the drag: the whole row on a computer, the position on the phone. */
    handle: string
    onMove: (move: TrackMove) => void
    /** Default: the playlists screen's. */
    profile?: DragProfile
}

const playlistOf = (list: HTMLElement): number => parseInt(list.closest<HTMLElement>('[data-playlist-index]')?.dataset.playlistIndex ?? '', 10)

/** The playlists screen: its boxes of tracks, any row droppable in any of them, a touch waits 100 ms before it picks a row up. */
export const PLAYLISTS_PROFILE: DragProfile = {
    lists: '.playlist-tracks',
    numberOf: playlistOf,
    sortable: { group: 'shared-tracks', animation: 150, ghostClass: 'bg-white/5', dragClass: 'opacity-100', delay: 100, delayOnTouchOnly: true, touchStartThreshold: 3 },
    grabbingClass: 'grabbing'
}

/** Puts the row back in the list and the place React gave it: the list it left, before the row that was after it. */
export function putBack(event: SortableEvent): void {
    const { item, from, oldIndex } = event
    item.remove()
    from.insertBefore(item, from.children[oldIndex ?? 0] ?? null)
}

/**
 * Safari draws the old place of the row lit after a drop by mouse. It hears no mouse while a native drag goes on, so when the row is put
 * back (taken out of the list and put in again) it looks for what is under the pointer where the drag BEGAN, lights that row with
 * `:hover`, and never takes it away when the mouse moves on (measured in WebKit on the box of reports/evidence/F83/sync-2/safari-drop;
 * Chromium takes it away at the next move). The old windows drew their lists again and never showed it. So the list is out of the
 * pointer's way while the row is put back and until the mouse moves for the first time: there is nothing to light at the old pointer.
 */
export function holdHover(list: HTMLElement): void {
    list.style.pointerEvents = 'none'
    const give = () => {
        document.removeEventListener('mousemove', give, true)
        window.clearTimeout(timer)
        list.style.pointerEvents = ''
    }
    const timer = window.setTimeout(give, 1500) // a drop by keyboard or touch never moves a mouse
    document.addEventListener('mousemove', give, true)
}

export function useSortableTracks(box: RefObject<HTMLElement | null>, options: Options): void {
    const sortables = useRef(new Map<HTMLElement, Sortable>())
    const handles = useRef(new WeakMap<HTMLElement, string>())
    const dragging = useRef(false)
    const latest = useRef(options)
    latest.current = options
    const profile = options.profile ?? PLAYLISTS_PROFILE

    const end = (event: SortableEvent) => {
        dragging.current = false
        if (profile.grabbingClass) document.body.classList.remove(profile.grabbingClass)
        holdHover(event.from)
        if (event.to !== event.from) holdHover(event.to)
        putBack(event)
        const move = { fromPlaylist: profile.numberOf(event.from), toPlaylist: profile.numberOf(event.to), oldIndex: event.oldIndex ?? NaN, newIndex: event.newIndex ?? NaN }
        if (Number.isNaN(move.fromPlaylist) || Number.isNaN(move.toPlaylist)) return
        // asked after this handler returns, as it always was: Sortable finishes the drop first
        queueMicrotask(() => latest.current.onMove(move))
    }

    // after every draw: the lists that came get a Sortable, the ones that went lose theirs, the handle follows the phone
    useLayoutEffect(() => {
        const root = box.current
        if (!root || dragging.current) return
        const present = new Set(root.querySelectorAll<HTMLElement>(profile.lists))
        sortables.current.forEach((sortable, list) => {
            if (!present.has(list)) {
                sortable.destroy()
                sortables.current.delete(list)
            }
        })
        present.forEach(list => {
            const known = sortables.current.get(list)
            if (known) {
                // the handle follows the phone: told to Sortable only when it changed
                if (handles.current.get(list) !== options.handle) {
                    known.option('handle', options.handle)
                    handles.current.set(list, options.handle)
                }
                return
            }
            handles.current.set(list, options.handle)
            sortables.current.set(list, new Sortable(list, {
                ...profile.sortable,
                handle: options.handle,
                onStart: () => { dragging.current = true; if (profile.grabbingClass) document.body.classList.add(profile.grabbingClass) },
                onEnd: end
            }))
        })
    })

    useEffect(() => () => {
        sortables.current.forEach(sortable => sortable.destroy())
        sortables.current.clear()
        if (profile.grabbingClass) document.body.classList.remove(profile.grabbingClass)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the profile of a screen is one constant
    }, [])
}
