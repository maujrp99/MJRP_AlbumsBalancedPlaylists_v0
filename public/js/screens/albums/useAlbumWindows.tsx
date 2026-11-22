/**
 * The windows of the albums screen (F83 wave 5b): the window to edit a series with its album picker, the question to delete a series, and
 * the window to rank the tracks of an album. The screen asks for one when a button is pressed (`openEdit`, `openDelete`, `openRank`) and
 * draws `layer`, where the windows are (each puts itself at the end of `body`, over the page, as the hand-made ones did).
 *
 * The notices of the ranking window are kept here, not in the window: a notice outlives the window that said it (it stays 2 s, 5 s with a way
 * back), as the hand-made one, which was an element of its own in `body`, did.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { toast } from '../../components/Toast.js'
import { t } from '../../i18n/t.js'
import { RankWindow, type Notify, type RankRequest } from './RankWindow'
import { SeriesEditWindow } from './SeriesEdit'
import { SeriesEditSession } from './seriesEditSession'
import { deleteSeriesAfterAsking } from './seriesDelete'

export interface AlbumWindows {
    openEdit: (seriesId: string) => void
    openDelete: (seriesId: string) => Promise<void>
    openRank: (request: RankRequest) => void
    /** What the screen draws so the windows are in the page. */
    layer: ReactNode
}

interface Handlers {
    onSeriesUpdated: (seriesId: string) => void
    onSeriesDeleted: (seriesId: string) => void
}

interface Notice {
    id: number
    text: string
    error: boolean
    action?: { label: string; run: () => void }
}

const NOTICE_MS = 2000
const NOTICE_WITH_ACTION_MS = 5000

function Notices({ notices, remove }: { notices: Notice[]; remove: (id: number) => void }) {
    return createPortal(
        <>
            {notices.map(notice => (
                <div key={notice.id} className={`rank-toast fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-[60] ${notice.error ? 'bg-red-500 text-white' : 'bg-sky-500 text-white'} animate-in slide-in-from-bottom-4`} role="status">
                    {notice.text}
                    {notice.action ? (
                        <button type="button" className="rank-toast__action" onClick={() => { remove(notice.id); notice.action?.run() }}>{notice.action.label}</button>
                    ) : null}
                </div>
            ))}
        </>,
        document.body
    )
}

export function useAlbumWindows({ onSeriesUpdated, onSeriesDeleted }: Handlers): AlbumWindows {
    const [edit, setEdit] = useState<SeriesEditSession | null>(null)
    const [rank, setRank] = useState<{ key: number; request: RankRequest } | null>(null)
    const [notices, setNotices] = useState<Notice[]>([])
    const latest = useRef({ onSeriesUpdated, onSeriesDeleted })
    latest.current = { onSeriesUpdated, onSeriesDeleted }
    const counter = useRef(0)
    const timers = useRef(new Set<number>())

    const openEdit = useCallback((seriesId: string): void => {
        const series = SeriesEditSession.find(seriesId)
        if (!series) {
            toast.error(t('albums.edit.notFound'))
            return
        }
        const session: SeriesEditSession = new SeriesEditSession(series, {
            onUpdated: (id) => latest.current.onSeriesUpdated(id),
            close: () => setEdit(current => (current === session ? null : current))
        })
        setEdit(session)
    }, [])

    const openDelete = useCallback((seriesId: string): Promise<void> => deleteSeriesAfterAsking(seriesId, (id) => latest.current.onSeriesDeleted(id)), [])

    const remove = useCallback((id: number): void => setNotices(current => current.filter(notice => notice.id !== id)), [])
    const notify = useCallback<Notify>((text, type = 'success', action) => {
        counter.current += 1
        const id = counter.current
        setNotices(current => [...current, { id, text, error: type === 'error', action }])
        const timer = window.setTimeout(() => { timers.current.delete(timer); remove(id) }, action ? NOTICE_WITH_ACTION_MS : NOTICE_MS)
        timers.current.add(timer)
    }, [remove])
    useEffect(() => () => { timers.current.forEach(timer => window.clearTimeout(timer)); timers.current.clear() }, [])

    const openRank = useCallback((request: RankRequest): void => {
        counter.current += 1
        const key = counter.current
        setRank({ key, request })
    }, [])

    /** The window goes off the page first, then `onClose` is told (so what it held is let go before whoever asked hears of it). */
    const closeRank = useCallback((key: number, request: RankRequest): void => {
        flushSync(() => setRank(current => (current?.key === key ? null : current)))
        request.onClose?.()
    }, [])

    const layer = (
        <>
            {edit ? <SeriesEditWindow session={edit} /> : null}
            {rank ? <RankWindow key={rank.key} request={rank.request} close={() => closeRank(rank.key, rank.request)} notify={notify} /> : null}
            <Notices notices={notices} remove={remove} />
        </>
    )
    return { openEdit, openDelete, openRank, layer }
}
