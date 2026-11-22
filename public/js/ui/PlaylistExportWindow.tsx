/**
 * PlaylistExportWindow - the one window of the export (F90; written in React in F83 sync 2, it was views/playlists/PlaylistExportWindow.js).
 *
 * The edit screen and the saved playlists screen open the same window: the three ways out, in the order Apple Music, Spotify, the JSON
 * file. Each one calls the export the edit screen always called (the hand-made modules behind react-bridge/legacy/OutputWindows): this
 * window only chooses and hands over what to export. It writes nothing of the batch.
 *
 * Apple Music asks first in which folder the playlists go (AppleFolderStep) and writes its progress on the step's «Export» button; the
 * window stays to show it. Spotify has its own window and the file is handed to the browser, so the window gives way to them.
 *
 * What to export is given: the playlists, the series (the default Apple Music folder), the batch and the position each playlist has in
 * it (so one playlist is named as the export of the whole batch would name it). With none given, the playlists on the edit screen are
 * exported, as always. On the phone the window is a sheet from the bottom (the motor of ui/SheetWindow); on the computer, a small
 * window (ui/ModalShell) that closes on Escape and on the backdrop, keeps Tab inside and gives the focus back to what opened it.
 */
import { flushSync } from 'react-dom'
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ModalShell } from './ModalShell'
import { useSheetWindow } from './SheetWindow'
import { Icon } from './Icon'
import { AppleFolderStep, type FolderChoice } from './AppleFolderStep'
import { exportJson, exportToAppleMusic, listAppleFolders, openSpotifyExport } from '../react-bridge/legacy/OutputWindows'
import { isPhone } from '../utils/isPhone.js'
import { t } from '../i18n/t.js'

const WINDOW_ID = 'playlist-export-window'

/** What the window is asked to export, and how it is asked. */
export interface ExportJob {
    /** The playlists; none given: the ones on the edit screen. */
    playlists?: unknown[]
    /** The series (the default Apple Music folder). */
    seriesName?: string
    batchName?: string
    /** The position of each playlist in its batch (1-based). */
    positions?: number[]
    /** What the window is called. */
    title?: string
    /** Open straight on the Apple Music folder step. */
    start?: 'apple'
    /** What gets the focus back on close (none given: what had it when the window opened). */
    opener?: HTMLElement | null
}

type What = Pick<ExportJob, 'playlists' | 'seriesName' | 'batchName' | 'positions'>

/** The destinations, in the order they are offered. */
export const DESTINATIONS = Object.freeze([
    { id: 'apple', icon: 'Apple', key: 'exportWindow.apple' },
    { id: 'spotify', icon: 'Spotify', key: 'exportWindow.spotify' },
    { id: 'json', icon: 'Download', key: 'exportWindow.json' }
] as const)

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'

/** What a screen says about itself to the window: the series the playlists belong to when the job does not name one (the edit screen: the open series). */
export interface ExportDefaults {
    seriesName?: () => string | undefined
}

/** The series the playlists belong to: the one given (the saved playlists screen), else the screen's own, else the name the export always used. */
const seriesNameOf = (given: string | undefined, defaults: ExportDefaults): string => given || defaults.seriesName?.() || 'MJRP Playlists'

/** Tab and Shift+Tab go round inside the window, never out to the page behind it. */
function keepFocusInside(event: KeyboardEvent, panel: HTMLElement): void {
    const inside = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (inside.length === 0) return
    const first = inside[0]
    const last = inside[inside.length - 1]
    const outside = !panel.contains(document.activeElement)
    if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault()
        last.focus({ preventScroll: true })
    } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault()
        first.focus({ preventScroll: true })
    }
}

/** Give the focus back to what opened the window, if it is still on the page. */
function giveFocusBack(opener: Element | null): void {
    const target = opener as HTMLElement | null
    if (target?.focus && document.contains(target)) target.focus({ preventScroll: true })
}

/** The rows, or the step of the Apple Music folder; the title follows what is shown. `close` gives the window back. */
function ExportBody({ what, defaults, title, start, phone, close, setTitle }: {
    what: What
    defaults: ExportDefaults
    title: string
    start?: 'apple'
    phone: boolean
    close: () => void
    setTitle: (text: string) => void
}) {
    const [view, setView] = useState<'rows' | 'step'>(start === 'apple' ? 'step' : 'rows')
    const box = useRef<HTMLDivElement>(null)
    const rowsTitle = start === 'apple' ? t('exportWindow.title') : title // the title says what the window shows

    // What is shown changed: the title says it, and the first thing to act on takes the focus
    useLayoutEffect(() => {
        setTitle(view === 'rows' ? rowsTitle : title)
        box.current?.querySelector<HTMLElement>('[data-export="apple"], input[type="radio"]:checked, button')?.focus({ preventScroll: true })
    }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

    const pick = (id: (typeof DESTINATIONS)[number]['id']) => {
        if (id === 'apple') { setView('step'); return }
        close()
        if (id === 'spotify') void openSpotifyExport(what)
        else void exportJson(what)
    }

    const onExport = useCallback((folder: FolderChoice, report: (text: string | null) => void) => {
        void exportToAppleMusic(report, { ...what, ...folder })
    }, [what])

    if (view === 'step') {
        return (
            <div ref={box} className="flex flex-col gap-3">
                <AppleFolderStep seriesName={seriesNameOf(what.seriesName, defaults)} loadFolders={listAppleFolders} onBack={() => setView('rows')} onExport={onExport} />
            </div>
        )
    }
    return (
        <div ref={box} className={phone ? 'albums-sheet__list' : 'flex flex-col gap-3'}>
            {DESTINATIONS.map(destination => phone ? (
                <button key={destination.id} type="button" className="albums-sheet__row" data-export={destination.id} onClick={() => pick(destination.id)}>
                    <Icon name={destination.icon} className="albums-sheet__icon" />
                    <span className="albums-sheet__label">{t(destination.key)}</span>
                </button>
            ) : (
                <button key={destination.id} type="button" className={`btn ${destination.id === 'apple' ? 'btn-primary' : 'btn-secondary'} w-full flex items-center justify-center gap-2`} data-export={destination.id} onClick={() => pick(destination.id)}>
                    <Icon name={destination.icon} className="w-5 h-5" />
                    <span>{t(destination.key)}</span>
                </button>
            ))}
        </div>
    )
}

interface Opened {
    job: ExportJob
    from: Element | null
}

/** The window of the computer: Escape and the backdrop close it, Tab stays inside. */
function ExportDialog({ opened, defaults, onClose }: { opened: Opened; defaults: ExportDefaults; onClose: () => void }) {
    const { title: given, start, ...what } = opened.job
    delete (what as ExportJob).opener // what is exported never carries the button that opened the window
    const initial = given ?? t('exportWindow.title')
    const [title, setTitle] = useState(initial)

    useLayoutEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const panel = document.getElementById(WINDOW_ID)
            if (!panel) return
            if (event.key === 'Tab') { keepFocusInside(event, panel); return }
            if (event.key !== 'Escape') return
            event.stopPropagation()
            onClose()
        }
        document.addEventListener('keydown', onKey, true)
        return () => document.removeEventListener('keydown', onKey, true)
    }, [onClose])

    return (
        <ModalShell id={WINDOW_ID} title={title} size="sm" onClose={onClose} closeOnBackdrop>
            <ExportBody what={what} defaults={defaults} title={initial} start={start} phone={false} close={onClose} setTitle={setTitle} />
        </ModalShell>
    )
}

/**
 * Opens the export window. `layer` goes anywhere in the screen (it draws into the window, not in place). Opened from a tap, never from
 * an effect; leaving the screen takes it off the page.
 */
export function usePlaylistExport(defaults: ExportDefaults = {}): { open: (job?: ExportJob) => void; layer: ReactNode } {
    const [opened, setOpened] = useState<Opened | null>(null)
    const sheet = useSheetWindow()

    const closeDialog = useCallback((from: Element | null) => {
        flushSync(() => setOpened(null))
        giveFocusBack(from)
    }, [])

    const open = (job: ExportJob = {}) => {
        const from = job.opener || document.activeElement
        if (isPhone()) {
            const { title: given, start, ...what } = job
            delete what.opener
            const title = given ?? t('exportWindow.title')
            sheet.show({
                id: WINDOW_ID,
                variant: 'bottom',
                title,
                className: 'albums-sheet saved-phone-sheet',
                closeLabel: t('exportWindow.close'),
                focusFirst: false,
                onClose: () => giveFocusBack(from),
                render: (close) => <ExportBody what={what} defaults={defaults} title={title} start={start} phone close={close} setTitle={sheet.setTitle} />
            })
            return
        }
        setOpened({ job, from })
    }

    const layer = (
        <>
            {opened ? <ExportDialog key={WINDOW_ID} opened={opened} defaults={defaults} onClose={() => closeDialog(opened.from)} /> : null}
            {sheet.layer}
        </>
    )
    return { open, layer }
}
