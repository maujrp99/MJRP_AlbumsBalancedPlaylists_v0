/**
 * LegacySeriesModals - the windows to edit a series and to delete one (components/series/SeriesModals.js and SeriesEditModal.js, which
 * hold the one album picker) inside the albums screen (F83 wave 5a; TEMPORARY, listed in bridgesOnlyShrink; ported in wave 5b with the
 * album picker panel, which the Start screen also uses).
 *
 * It does what the hand-made screen did: one box, the windows' markup written in it once and mounted (their own listeners), and taken
 * down when the screen goes. The screen asks for a window through the handle: `handle.current.openEdit(seriesId)` / `openDelete(seriesId)`.
 */
import { useLayoutEffect, useRef, type MutableRefObject } from 'react'
import SeriesModals from '../../components/series/SeriesModals.js'
import { escapeHtml } from '../../utils/stringUtils.js'

export interface SeriesModalsHandle {
    openEdit: (seriesId: string) => void
    openDelete: (seriesId: string) => void
}

interface Props {
    handle: MutableRefObject<SeriesModalsHandle | null>
    onUpdated: (seriesId: string) => void
    onDeleted: (seriesId: string) => void
}

export function LegacySeriesModals({ handle, onUpdated, onDeleted }: Props) {
    const box = useRef<HTMLDivElement>(null)
    const latest = useRef({ onUpdated, onDeleted })
    latest.current = { onUpdated, onDeleted }

    useLayoutEffect(() => {
        const element = box.current
        if (!element) return undefined
        const windows = new SeriesModals({
            onSeriesUpdated: (seriesId: string) => latest.current.onUpdated(seriesId),
            onSeriesDeleted: (seriesId: string) => latest.current.onDeleted(seriesId),
            escapeHtml
        })
        element.innerHTML = windows.render()
        windows.mount(element)
        handle.current = { openEdit: (seriesId) => windows.openEdit(seriesId), openDelete: (seriesId) => windows.openDelete(seriesId) }
        return () => {
            handle.current = null
            windows.unmount?.()
            element.replaceChildren()
        }
    }, [handle])

    return <div id="series-modals-mount" ref={box} />
}
