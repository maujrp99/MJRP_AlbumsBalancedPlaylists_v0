/**
 * LegacyTracksTable - the table of the tracks of an album (components/ranking/TracksTable.js) inside the album card of the albums screen
 * (F83 wave 5a; TEMPORARY, listed in bridgesOnlyShrink). The window of the album, which the inventory (wave 6) also uses, holds the same
 * table, so it is ported once, with that window.
 *
 * The hand-made table draws a node; here the node is put in a box that takes no room of its own (`display: contents`) and is made again
 * when the rows, the column or the direction change. A press on a column header asks the card for the other direction (the hand-made
 * screen replaced the table by a new one: here the card keeps the column and the direction and this draws it again).
 */
import { useLayoutEffect, useRef } from 'react'
import { TracksTable } from '../../components/ranking/TracksTable.js'
import { trackRowsOf } from '../../models/albumTrackRows.js'

/** The album whose tracks the table shows: the screen's own shape, read through its tracks. */
interface Album {
    id: string
    getTracks: (kind: string) => Array<Record<string, unknown>>
}

export interface TrackSort {
    field: string
    direction: 'asc' | 'desc'
}

export function LegacyTracksTable({ album, sort, onSort }: { album: Album; sort: TrackSort; onSort: (sort: TrackSort) => void }) {
    const box = useRef<HTMLDivElement>(null)
    const latest = useRef(onSort)
    latest.current = onSort

    useLayoutEffect(() => {
        const element = box.current
        if (!element) return undefined
        const tracks = trackRowsOf(album, { sortField: sort.field, sortDirection: sort.direction })
        const table = new TracksTable({ tracks, sortField: sort.field, sortDirection: sort.direction, onSort: () => {} })
        const node = table.render()
        node.dataset.albumId = album.id
        element.replaceChildren(node)
        const press = (event: Event) => {
            const header = (event.target as Element).closest<HTMLElement>('[data-sort]')
            if (!header) return
            event.preventDefault()
            event.stopPropagation()
            latest.current({ field: header.dataset.sort ?? '', direction: (header.dataset.direction || 'asc') === 'asc' ? 'desc' : 'asc' })
        }
        element.addEventListener('click', press)
        return () => {
            element.removeEventListener('click', press)
            element.replaceChildren()
        }
    }, [album, sort.field, sort.direction])

    return <div ref={box} style={{ display: 'contents' }} data-legacy-host="tracks" />
}
