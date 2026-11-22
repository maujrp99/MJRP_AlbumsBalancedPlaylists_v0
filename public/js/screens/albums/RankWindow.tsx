/**
 * The window to rank the tracks of an album («Rank Your Album»; F83 wave 5b: it was components/ranking/UserRankModal.js).
 *
 * It shows the tracks with the BEA and Spotify ranks beside them while the person drags them into their own order, and it reports: it saves
 * through the `onSubmit` it was given (who saves, and what the screen does next, is whoever opened it), and tells `onSave` once it was saved
 * and `onClose` when it closes. The order and the rules are in rankSession.ts; the drag is the bridge to sortablejs of wave 2
 * (react-bridge/sortableTracks.ts) with this window's own profile. On the phone it is the window of RankPhone.tsx.
 *
 * What the old window did and this does the same: Back, Escape and a click outside the window (the computer) close it, or ask «Discard
 * changes?» first when the order was changed and not saved (the app's confirmation window on the computer, a sheet on the phone); Escape does
 * nothing while a sheet or the question is open; a save that works shows its notice, closes 500 ms later and only then says `onSave`; one that
 * is refused or breaks keeps the window open. What it never did and still does not (issue candidates): it does not keep the focus inside, it
 * gives the focus to nothing when it opens and to nobody when it closes, and on the computer it is not a `dialog` for a screen reader.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { BaseModal } from '../../components/ui/BaseModal.js'
import { ConfirmModal } from '../../components/ui/modals/ConfirmModal.js'
import { t } from '../../i18n/t.js'
import { formatDuration } from '../../utils/duration.js'
import { Icon } from '../../ui/Icon'
import { usePhone } from '../../react-bridge/usePhone'
import { useSortableTracks, type DragProfile } from '../../react-bridge/sortableTracks'
import { useSheetWindow } from '../../ui/SheetWindow'
import { RankPhone, keysOf } from './RankPhone'
import { RankSession, trackKey, type RankAlbum, type RankTrack, type Ranking } from './rankSession'

export interface RankRequest {
    album: RankAlbum
    /** Saves the ranking and answers whether it was saved. */
    onSubmit?: (rankings: Ranking[]) => Promise<boolean>
    /** Told once the ranking was saved (after the window closed). */
    onSave?: (rankings: Ranking[]) => void
    /** Told when the window closes. */
    onClose?: () => void
}

/** A notice of the window: it stays 2 s (5 s when it offers a way back) and outlives the window. */
export type Notify = (message: string, type?: 'success' | 'error', action?: { label: string; run: () => void }) => void

/** How the drag is set here: one list, the whole row on a computer (the handle on the phone), no group, no wait for a touch. */
export const RANK_PROFILE: DragProfile = {
    lists: '#rank-track-list',
    numberOf: () => 0,
    sortable: {
        animation: 150,
        ghostClass: 'opacity-50',
        dragClass: 'cursor-grabbing',
        onChoose: (event: { item: HTMLElement }) => event.item.classList.add('ring-2', 'ring-sky-500'),
        onUnchoose: (event: { item: HTMLElement }) => event.item.classList.remove('ring-2', 'ring-sky-500')
    },
    grabbingClass: null
}

const hasRank = (value: number | undefined): boolean => Boolean(value) && (value as number) < 999

function Track({ track, index, album }: { track: RankTrack; index: number; album: RankAlbum }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors cursor-grab group" data-track-id={trackKey(track)}>
            <div className="text-white/30 group-hover:text-white/60 transition-colors"><Icon name="GripVertical" className="w-5 h-5" /></div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-500 text-sm font-bold border border-sky-500/20" data-role="rank-number">{String(index + 1)}</div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate text-sm">{track.title}</div>
                <div className="text-xs text-white/40 truncate">{track.artist || album.artist}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {hasRank(track.rank) ? <span className="text-xs text-brand-orange" title={t('albums.rankWindow.beaTitle')}>{t('albums.rankWindow.beaBadge', { rank: track.rank as number })}</span> : null}
                {hasRank(track.spotifyRank) ? <span className="text-xs text-[#1DB954]" title={t('albums.rankWindow.spotifyTitle')}>{t('albums.rankWindow.spotifyBadge', { rank: track.spotifyRank as number })}</span> : null}
            </div>
            <div className="text-xs text-white/40 font-mono w-12 text-right">{formatDuration(track.duration)}</div>
        </div>
    )
}

interface ComputerActions {
    onBack: () => void
    onReset: () => void
    onSave: () => void
    onBackdrop: () => void
}

function RankComputer({ session, box, actions }: { session: RankSession; box: React.RefObject<HTMLDivElement | null>; actions: ComputerActions }) {
    const keys = keysOf(session.rankedOrder)
    return (
        <div className="rank-window fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" ref={box} onClick={(event) => { if (event.target === event.currentTarget) actions.onBackdrop() }}>
            <div className="glass-panel flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl m-4">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <button type="button" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" onClick={actions.onBack}>
                        <span>{t('albums.rankWindow.back')}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button type="button" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors" onClick={actions.onReset}>
                            {t('albums.rankWindow.reset')}
                        </button>
                        <button type="button" className="px-4 py-2 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium" onClick={actions.onSave}>
                            <Icon name="Save" className="w-4 h-4 inline mr-1" />
                            {t('albums.rankWindow.save')}
                        </button>
                    </div>
                </div>
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center gap-2 text-sky-500">
                        <Icon name="Music" className="w-5 h-5" />
                        <span className="text-lg font-bold">{t('albums.rankWindow.title')}</span>
                    </div>
                    <div className="text-white/60 text-sm mt-1">{`${session.album.title} - ${session.album.artist}`}</div>
                </div>
                <div className="px-4 py-2 text-sm text-white/50">{t('albums.rankWindow.instructions')}</div>
                <div id="rank-track-list" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {session.rankedOrder.map((track, index) => <Track key={keys[index]} track={track} index={index} album={session.album} />)}
                </div>
                <div className="p-4 border-t border-white/10 text-xs text-white/40">
                    <span className="text-sky-500">{'💡 '}</span>
                    {t('albums.rankWindow.tip')}
                </div>
            </div>
        </div>
    )
}

interface Props {
    request: RankRequest
    /** Takes the window off the page and tells `onClose`. */
    close: () => void
    notify: Notify
}

export function RankWindow({ request, close, notify }: Props) {
    const [session] = useState(() => new RankSession(request.album))
    useSyncExternalStore(session.subscribe, session.getVersion)
    const phone = usePhone()
    const { show, close: closeSheet, isOpen, layer } = useSheetWindow()
    const box = useRef<HTMLDivElement>(null)
    const question = useRef<(() => void) | null>(null)
    const latest = useRef({ request, close, phone })
    latest.current = { request, close, phone }

    useSortableTracks(box, {
        handle: phone ? '.rank-row__handle' : '.group',
        onMove: ({ oldIndex, newIndex }) => { session.moveTrack(oldIndex, newIndex) },
        profile: RANK_PROFILE
    })

    /** The computer's question (UAT-224): the app's confirmation window, with the phone's words. «Keep editing» leaves the window and its order as they were. */
    const askDiscard = (): void => {
        const answer = (discard: boolean): void => {
            stop()
            if (discard) close()
        }
        // Escape is «Keep editing», as in every confirmation window of the app
        const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') answer(false) }
        const window_ = ConfirmModal.render({
            title: t('albums.rankWindow.discardTitle'),
            message: t('albums.rankWindow.discardNote'),
            confirmText: t('albums.rankWindow.discard'),
            cancelText: t('albums.rankWindow.keepEditing'),
            variant: 'danger',
            onConfirm: () => answer(true),
            onCancel: () => answer(false)
        })
        const stop = (): void => {
            BaseModal.unmount(window_)
            document.removeEventListener('keydown', onKey)
            question.current = null
        }
        question.current = stop
        BaseModal.mount(window_)
        document.addEventListener('keydown', onKey)
    }

    /** The phone's question: a sheet from the bottom; «Keep editing» is first and takes the focus, «Discard» closes the window without saving. */
    const confirmDiscard = (): void => {
        if (isOpen()) return
        show({
            id: 'rankDiscardSheet',
            variant: 'bottom',
            title: t('albums.rankWindow.discardTitle'),
            closeLabel: t('ui.window.close'),
            render: (shut) => (
                <>
                    <p className="rank-discard__note">{t('albums.rankWindow.discardNote')}</p>
                    <div className="rank-discard">
                        <button type="button" className="rank-discard__keep" onClick={() => shut()}>{t('albums.rankWindow.keepEditing')}</button>
                        <button type="button" className="rank-discard__discard" onClick={() => { shut(); close() }}>{t('albums.rankWindow.discard')}</button>
                    </div>
                </>
            )
        })
    }

    /** Back and Escape. With nothing changed it closes; with an order changed and not saved it asks first. */
    const requestClose = (): void => {
        if (question.current) return
        if (!session.hasUnsavedChanges()) return close()
        if (latest.current.phone) return confirmDiscard()
        askDiscard()
    }

    const save = async (): Promise<void> => {
        const rankings = session.rankings()
        let success = false
        try {
            success = latest.current.request.onSubmit ? await latest.current.request.onSubmit(rankings) : false
        } catch (error) {
            console.error('[UserRankModal] saving the ranking failed:', error)
        }
        if (!success) {
            notify(t('albums.rankWindow.saveFailed'), 'error')
            return
        }
        session.markSaved()
        notify(t('albums.rankWindow.saved'))
        // closes a little after the confirmation
        window.setTimeout(() => {
            latest.current.close()
            latest.current.request.onSave?.(rankings)
        }, 500)
    }

    // Escape: the window asks, unless a sheet or the question is open (they take it themselves)
    const escape = useRef(requestClose)
    escape.current = requestClose
    useEffect(() => {
        const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape' && !isOpen() && !question.current) escape.current() }
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('keydown', onKey)
            question.current?.()
        }
    }, [isOpen])

    // the window is drawn for the phone or for the computer: a sheet that was open goes when that changes
    useEffect(() => () => closeSheet(), [phone, closeSheet])

    /** «Reset», with a way back for 5 seconds on the phone. */
    const resetWithUndo = (refresh: () => void): void => {
        const before = [...session.rankedOrder]
        session.reset()
        refresh()
        notify(t('albums.rankWindow.resetDone'), 'success', { label: t('albums.rankWindow.undo'), run: () => { session.restore(before); refresh() } })
    }

    /** «Move to…»: the numbers in a sheet from the bottom; one tap and the track goes there. */
    const openMoveTo = (refresh: () => void, announce: (text: string) => void): void => {
        const from = session.pickedIndex()
        if (from < 0) return
        show({
            variant: 'bottom',
            title: t('albums.rankWindow.moveToTitle', { title: session.rankedOrder[from].title }),
            closeLabel: t('ui.window.close'),
            render: (shut) => (
                <div className="rank-moveto">
                    {session.rankedOrder.map((track, index) => (
                        <button
                            key={keysOf(session.rankedOrder)[index]}
                            type="button"
                            className={`rank-moveto__number${index === from ? ' is-here' : ''}`}
                            aria-label={t(index === from ? 'albums.rankWindow.numberHere' : 'albums.rankWindow.number', { number: index + 1 })}
                            disabled={index === from}
                            onClick={() => {
                                shut()
                                if (!session.moveTrack(from, index)) return
                                announce(t('albums.rankWindow.nowNumber', { title: session.rankedOrder[index].title, number: index + 1 }))
                                refresh()
                            }}
                        >
                            {String(index + 1)}
                        </button>
                    ))}
                </div>
            )
        })
    }

    // the window is put at the end of `body`, over the page, as the hand-made one was
    return (
        <>
            {createPortal(phone
                ? <RankPhone session={session} box={box} actions={{ onBack: requestClose, onSave: () => { void save() }, onReset: resetWithUndo, onMoveTo: openMoveTo }} />
                : <RankComputer session={session} box={box} actions={{ onBack: requestClose, onReset: () => session.reset(), onSave: () => { void save() }, onBackdrop: requestClose }} />, document.body)}
            {layer}
        </>
    )
}
