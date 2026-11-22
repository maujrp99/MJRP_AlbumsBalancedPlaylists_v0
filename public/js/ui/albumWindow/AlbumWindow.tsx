/**
 * AlbumWindow - the window of an album, shared by the albums screen and the inventory (F83 wave 6b; the port of components/ViewAlbumModal.js, with
 * the same HTML and the same classes). A loaded album, or an inventory item (it holds its album in `albumData`, and its own status, format, price
 * and notes): the cover, the title, the badges, what the person paid, the notes, the comparison of the tracks, and «Close».
 *
 * It holds no store and no service (`reactStaysAtTheEdge`): whoever opens it gives what it reads of the world, and it closes by calling `close`.
 *   `loadAlbum(signal)`  the album as the album load has it now (the inventory gives it, F71 UAT-220): an item keeps no tracks, or the ones of the
 *                        day it was added, so the window shows what it has, asks, and shows the album that comes. The ask is dropped on closing.
 *   `sources`            where the ratings and the Spotify popularity are in the album load, and how to ask again (./sources.ts): the albums screen
 *                        gives it; with it the window says when a source failed, with «Try again»; without it, it says nothing.
 *   `above`              what the window shows above the tracks (the inventory's «Estimated value» and «Where to buy», screens/inventory/).
 *   `phone`              whether the screen was the phone when the window was opened (it is not asked again: the hand-made one never was).
 *
 * It leaves as the hand-made one did: 200 ms of fading, then off the page. Escape (heard on the page) and a click on the backdrop close it.
 * On the phone (F76, REQ-06): a bar that stays on top with close, the title that comes to the bar when the header rolls away, and the cover,
 * blurred, behind the header. Existing defects are kept (no focus on opening or closing, no focus trap: an issue candidate).
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../../i18n/t.js'
import { Album } from '../../models/Album.js'
import { InventoryStatus, statusLabel, statusOf } from '../../models/inventoryStatus.js'
import { roundToCents } from '../../models/inventoryValue.js'
import { CoverImage } from '../CoverImage'
import { Icon } from '../Icon'
import { TracksComparison } from '../tracks/TracksComparison'
import { readSources, sourceProps, stateKey, watchSources, type AlbumSources, type SourceState } from './sources'

/** What an album, or an inventory item, is as the window is given it. */
export type AlbumInput = object

export interface AlbumWindowProps {
    album: AlbumInput
    loadAlbum?: ((signal: AbortSignal) => Promise<unknown>) | null
    sources?: AlbumSources
    above?: ReactNode
    phone: boolean
    /** Called when the window has left the page (after the fade). */
    close: () => void
    /** Called as soon as the person closes it (the load is dropped, what the window watched is let go). */
    onClosing?: () => void
}

/** The colour of the status badge of an inventory item. */
const STATUS_BADGE: Record<string, string> = {
    [InventoryStatus.OWNED]: 'badge badge-success',
    [InventoryStatus.NOT_OWNED]: 'badge badge-neutral',
    [InventoryStatus.WISHLIST]: 'badge badge-neutral'
}

const asAlbum = (data: unknown): Album => (data instanceof Album ? data : new Album(data as object))
const hasTracks = (album: Album): boolean => album.getTracks('original').length > 0 || album.getTracks('acclaim').length > 0

/** What the person paid, as the window has always written it: BRL with the comma, every other currency with «$» (an existing defect, kept). */
function paidText(value: number, currency: string): string {
    if (!value) return currency === 'USD' ? '$0.00' : 'R$ 0,00'
    const cents = roundToCents(value) // to cents first: engines round the half differently (F78)
    if (currency === 'BRL') return `R$ ${cents.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${cents.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Cover({ album }: { album: Album }) {
    return (
        <div className="w-24 h-24 md:w-32 md:h-32 bg-surface-dark rounded-xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
            {/* with no address, or one that fails to load, the stand-in (F70) */}
            <CoverImage src={album.coverUrl} alt={album.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        </div>
    )
}

function Details({ album, item, titleRef }: { album: Album; item: Record<string, unknown> | null; titleRef: RefObject<HTMLHeadingElement | null> }) {
    const kept = (item || {}) as Record<string, unknown>
    const status = item ? statusOf(item) : null
    return (
        <div className="flex-1 min-w-0 pt-1">
            <h2 ref={titleRef} className="text-2xl md:text-3xl font-bold truncate text-white leading-tight">{album.title}</h2>
            <p className="text-xl text-accent-primary font-medium mb-2">{album.artist}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-400">
                {album.year ? <span className="px-2 py-0.5 bg-surface-light rounded-md border border-white/5">{album.year}</span> : null}
                {kept.format ? <span className="badge badge-neutral uppercase text-xs tracking-wider">{String(kept.format)}</span> : null}
                {/* the status is the inventory's: an album that is not an inventory item has none to show */}
                {status ? <span className={STATUS_BADGE[status]}>{statusLabel(status).toUpperCase()}</span> : null}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 font-mono opacity-80">
                {kept.purchasePrice
                    // what the person paid: another number than what the album is worth (the «Estimated value» section)
                    ? <div className="flex items-center gap-1"><span className="text-gray-600">{t('ui.albumWindow.paid')}</span><span className="text-gray-300">{paidText(kept.purchasePrice as number, (kept.currency as string) || 'USD')}</span></div>
                    : null}
                {kept.condition
                    ? <div className="flex items-center gap-1"><span className="text-gray-600">{t('ui.albumWindow.condition')}</span><span className="text-gray-300">{String(kept.condition)}</span></div>
                    : null}
            </div>
        </div>
    )
}

/** The cover, blurred, behind the header of the window on the phone; none without a cover. */
function Glow({ coverUrl }: { coverUrl?: string }) {
    if (!coverUrl) return null
    return (
        <div className="album-window__glow md:hidden" aria-hidden="true">
            <img src={coverUrl} alt="" loading="lazy" decoding="async" />
        </div>
    )
}

/** What the window says in the place of the tracks, when it has none to show. */
const TRACKS_TEXT = { loading: 'ui.albumWindow.tracksLoading', notLoaded: 'ui.albumWindow.tracksNotLoaded', none: 'ui.albumWindow.tracksNone' } as const

interface Shown {
    album: Album
    emptyText: string
    /** A new key is a new comparison: its order starts again, as the hand-made one made a new comparison each time. */
    key: number
    state: SourceState | null
}

/** The page is listened to for Escape while the window is open. */
function useEscape(onEscape: () => void): void {
    useEffect(() => {
        const heard = (event: KeyboardEvent): void => { if (event.key === 'Escape') onEscape() }
        document.addEventListener('keydown', heard)
        return () => document.removeEventListener('keydown', heard)
    }, [])
}

/** On the phone the bar shows the title of the album while the title of the header is out of view. */
function useTitleInTheBar(options: { phone: boolean; title: RefObject<HTMLElement | null>; scroller: RefObject<HTMLElement | null>; signal: AbortSignal; setScrolled: (out: boolean) => void }): void {
    const { phone, title, scroller, signal, setScrolled } = options
    useEffect(() => {
        if (!phone || typeof IntersectionObserver !== 'function' || !title.current) return
        const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { root: scroller.current, rootMargin: '-56px 0px 0px 0px' })
        observer.observe(title.current)
        signal.addEventListener('abort', () => observer.disconnect(), { once: true })
    }, [])
}

/**
 * What the window shows in the place of the tracks: what the item keeps at once, and the album of now when it comes (the album load says a source failed,
 * or answered: the window says so and draws the album of now). `showCover` is told when the album that came has a cover the item had none of (UAT-222).
 */
function useTracks(options: { album: Album; sources?: AlbumSources; loadAlbum: AlbumWindowProps['loadAlbum']; signal: AbortSignal; showCover: (loaded: Album) => void }) {
    const { album, sources, loadAlbum, signal, showCover } = options
    const [shown, setShown] = useState<Shown>(() => ({ album, emptyText: loadAlbum ? TRACKS_TEXT.loading : TRACKS_TEXT.none, key: 0, state: readSources(sources) }))
    const current = useRef(album)
    const drawnKey = useRef(stateKey(shown.state))
    const counter = useRef(0)

    /** The comparison of the tracks of an album, or one line when there is nothing to compare. */
    const showTracks = (next: Album, emptyText: string): void => {
        current.current = next
        const state = readSources(sources)
        drawnKey.current = stateKey(state)
        counter.current += 1
        setShown({ album: next, emptyText, key: counter.current, state })
    }

    useEffect(() => {
        watchSources(sources, signal, {
            changed: () => stateKey(readSources(sources)) !== drawnKey.current,
            redraw: (state) => showTracks(state?.album ? asAlbum(state.album) : current.current, TRACKS_TEXT.none)
        })
        if (!loadAlbum) return
        loadAlbum(signal)
            .then(given => {
                if (signal.aborted) return
                const loaded = given ? asAlbum(given) : null
                if (loaded?.coverUrl && !album.coverUrl) showCover(loaded)
                if (loaded && hasTracks(loaded)) showTracks(loaded, TRACKS_TEXT.none)
                else if (!hasTracks(album)) showTracks(album, TRACKS_TEXT.notLoaded)
            })
            .catch(error => {
                console.error('[AlbumWindow] The album could not be loaded:', error)
                if (!signal.aborted && !hasTracks(album)) showTracks(album, TRACKS_TEXT.notLoaded)
            })
    }, [])
    return shown
}

/** The note the person wrote about the album, between the header and the tracks. */
function NotesBox({ notes }: { notes: unknown }) {
    if (!notes) return null
    return (
        <div className="px-6 py-4 bg-yellow-500/5 border-b border-white/5">
            <h3 className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Icon name="FileText" className="w-3 h-3" />{` ${t('ui.albumWindow.notes')}`}
            </h3>
            <p className="text-sm text-yellow-100/80 italic leading-relaxed">{`"${String(notes)}"`}</p>
        </div>
    )
}

/** The phone (F76, REQ-06): a bar that stays on top with close, and the title of the album once the header has rolled away. */
function PhoneBar({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="album-window__bar md:hidden">
            <span className="album-window__bar-title" aria-hidden="true">{title}</span>
            <button type="button" className="album-window__close" aria-label={t('ui.window.close')} onClick={onClose}><Icon name="X" className="w-6 h-6" /></button>
        </div>
    )
}

/** The comparison of the tracks of the album shown, or one line when there is nothing to compare. */
function TracksBox({ shown, sources }: { shown: Shown; sources?: AlbumSources }) {
    if (!hasTracks(shown.album)) return <p className="text-gray-400 text-center py-12" data-role="no-tracks">{t(shown.emptyText)}</p>
    // a host of its own: a comparison that was replaced starts again
    return <div key={shown.key}><TracksComparison album={shown.album} {...sourceProps(sources, shown.state)} /></div>
}

export function AlbumWindow({ album: input, loadAlbum = null, sources, above = null, phone, close, onClosing }: AlbumWindowProps) {
    // Hydrate the Album model if needed; the item (when there is one) keeps what the person wrote about the album
    const record = input as Record<string, unknown>
    const item = (record.albumData ? record : null) as Record<string, unknown> | null
    const [album] = useState(() => asAlbum(record.albumData || input))
    const [coverAlbum, setCoverAlbum] = useState(album)
    const [glow, setGlow] = useState(album.coverUrl)
    const [leaving, setLeaving] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const closing = useRef<AbortController>(new AbortController())
    const leavingNow = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const latest = useRef({ close, onClosing })
    latest.current = { close, onClosing }

    const closeWindow = (): void => {
        if (leavingNow.current) return
        leavingNow.current = true
        closing.current.abort()
        latest.current.onClosing?.()
        setLeaving(true)
        window.setTimeout(() => latest.current.close(), 200)
    }
    const showCover = (loaded: Album): void => {
        setCoverAlbum(loaded)
        setGlow(loaded.coverUrl)
    }

    // in the order the hand-made window did them: the escape key, the title for the bar, the sources, the album of now; the screen was left: what it asked for is dropped
    useEscape(closeWindow)
    useTitleInTheBar({ phone, title: titleRef, scroller: containerRef, signal: closing.current.signal, setScrolled })
    const shown = useTracks({ album, sources, loadAlbum, signal: closing.current.signal, showCover })
    useEffect(() => () => closing.current.abort(), [])

    return createPortal(
        <div
            className={`modal-overlay album-window${scrolled ? ' album-window--scrolled' : ''}`}
            style={leaving ? { opacity: 0, transition: 'opacity 0.2s' } : undefined}
            onClick={(event) => { if (event.target === event.currentTarget) closeWindow() }}
        >
            <div ref={containerRef} className={`modal-container glass-panel max-w-5xl w-full mx-4 max-h-[95vh] min-h-[75vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up${leaving ? ' animate-fade-out-down' : ''}`}>
                {phone ? <PhoneBar title={album.title} onClose={closeWindow} /> : null}
                <div className="modal-header p-6 border-b border-surface-light flex items-start gap-6 bg-surface-darker/50 backdrop-blur-md">
                    <Cover album={coverAlbum} />
                    <Details album={album} item={item} titleRef={titleRef} />
                    <button type="button" className="btn btn-ghost btn-circle hover:bg-white/10 text-gray-400 hover:text-white transition-all" data-action="close" onClick={closeWindow}><Icon name="X" className="w-8 h-8" /></button>
                    {phone ? <Glow coverUrl={glow} /> : null}
                </div>
                <NotesBox notes={item?.notes} />
                <div className="modal-content flex-1 overflow-hidden bg-surface-dark/30 relative">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                        {above}
                        <div id="modal-ranking-container"><TracksBox shown={shown} sources={sources} /></div>
                    </div>
                </div>
                <div className="modal-footer p-4 border-t border-surface-light bg-surface-darker flex justify-end gap-3">
                    <button type="button" className="btn btn-secondary px-6" onClick={closeWindow}>{t('ui.window.close')}</button>
                </div>
            </div>
        </div>,
        document.body
    )
}
