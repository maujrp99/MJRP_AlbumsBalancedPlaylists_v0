/**
 * SpotifyExportWindow - the window of the export to Spotify (F62; written in React in F83 wave 8a, it was components/SpotifyExportModal.js, the last
 * hand-made window of the site).
 *
 * It draws what the hand-made window drew, element by element and text by text, and does what it did: one export at a time, the progress while it
 * runs (searching, creating, adding), and the end on the report of the export (SpotifyExportService): what was created, each with its link; what
 * was not; why it stopped; and what the person can do next - connect again when the access could not be renewed, try again otherwise. The page
 * behind it is not touched. It is a box of its own at the end of `body` (the phone gives it the bottom edge by `#spotify-export-modal`, css/mobile.css).
 *
 * What the window does not do, as it never did (kept on purpose; listed in the proof of wave 8a): it does not close on Escape, does not keep Tab inside,
 * does not take the focus when it opens nor give it back when it closes, and has no role of a dialog. The backdrop and the buttons close it, but not
 * while the export works. It is redrawn whole at each word of the export (a fresh `key`), as the hand-made one rewrote its HTML: the animation of its
 * panel and of the spinner starts again, and the focus goes to the page. When the report appears the focus goes to its heading, and the result
 * is a status region (F98): the pieces of the report are the ones the Apple Music report uses too (ui/ExportReportParts.tsx).
 *
 * Every sentence is the window's, from the dictionary of the language (F98, UAT-308): the service gives a kind of failure, a stage and names.
 *
 * `ui/` imports no store, service or controller: the playlists on the edit screen, the open series, the export and the sign-in come as `deps`
 * from whoever opens it (controllers/playlistExportEntries.js).
 */
import { Fragment, useRef, useState, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Icon } from './Icon'
import { showWindow } from './windowLayer'
import { broken } from './recipe/broken'
import { safeUrl } from '../utils/safeUrl.js'
import { t, tPlural } from '../i18n/t.js'
import { leftSomethingOut, worthAnotherTry } from '../models/exportOutcome.js'
import { Names, ReportHeading, TrackNames, type Ending } from './ExportReportParts'

type Stage = 'IDLE' | 'MATCHING' | 'CREATING' | 'ADDING' | 'DONE'
type Mode = 'merge' | 'separate'

interface Created { name: string; url?: string; tracks: number; total: number; alreadyThere?: boolean }
/** Why the export stopped: a kind, the seconds Spotify asked to wait (a rate limit), and what Spotify itself said (`detail`). Never a sentence. */
interface Failure { kind: string; retryAfterSeconds?: number | null; detail?: string | null }
/** What a stage of the export is about: the track searched, the playlist created, the playlist and how many tracks are added. */
interface ProgressNames { title?: string; name?: string; count?: number }
/** What SpotifyExportService answers (its own rules are in services/SpotifyExportService.js). */
export interface SpotifyReport {
    mode: Mode
    totalTracks: number
    matchCount: number
    created: Created[]
    incomplete: Created[]
    empty: string[]
    notCreated: string[]
    /** How many tracks could not be checked: their search failed (F97). Never counted as not found. */
    unchecked?: number
    failure: Failure | null
}
interface Track { artist: string; title: string }
interface Playlist { name: string; title?: string; tracks?: unknown[] }

/** What the window asks of the world; the callbacks the service is given are told the stage, the count and a message, and each track not found. */
export interface SpotifyExportDeps {
    /** The playlists on the edit screen (used when none were given). */
    playlists: () => unknown[]
    /** The name of the open series. */
    seriesName: () => string | undefined
    exportPlaylists: (
        playlists: unknown[],
        options: { mode: Mode; name: string },
        handlers: { onProgress: (stage: string, current: number, total: number, names: ProgressNames) => void; onNotFound: (track: Track) => void; onUnchecked: (track: Track) => void }
    ) => Promise<SpotifyReport>
    /** Leaves the page to sign in to Spotify again. */
    login: () => void
    /** A warning to the person (the notice of the site). */
    warn: (text: string) => void
}

/** What the saved playlists screen gives: the playlists to export and the series they belong to; none given: the ones on the edit screen. */
export interface SpotifyGiven { playlists: unknown[]; seriesName?: string }

const GREEN = '#1DB954'
const GREEN_GRADIENT = 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)'
const PRIMARY = 'w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]'

/** The report of an export that broke where the service did not foresee. */
const brokenReport = (error: unknown): SpotifyReport => ({
    mode: 'merge', totalTracks: 0, matchCount: 0, created: [], incomplete: [], empty: [], notCreated: [],
    failure: { kind: 'broken', detail: (error as { message?: string } | null)?.message || null }
})

const STAGE_TEXT: Record<string, string> = { MATCHING: 'spotifyWindow.stage.matching', CREATING: 'spotifyWindow.stage.creating', ADDING: 'spotifyWindow.stage.adding' }

/** What is being done right now, in the language of the app: the service gives the stage and the names. */
function progressText(stage: string, names: ProgressNames | undefined): string {
    const { title = '', name = '', count = 0 } = names ?? {}
    if (stage === 'MATCHING') return t('spotifyWindow.progress.searching', { title })
    if (stage === 'CREATING') return t('spotifyWindow.progress.creating', { name })
    return stage === 'ADDING' ? tPlural('spotifyWindow.progress.adding', count, { count, name }) : ''
}

/** The failures said with a sentence of their own, whatever else the failure carries. */
const FAILURE_TEXT: Record<string, string> = {
    reconnect: 'spotifyWindow.failure.reconnect',
    refused: 'spotifyWindow.refused',
    unchecked: 'spotifyWindow.unchecked',
    'not-found': 'spotifyWindow.failure.notFound'
}

/** Why the export stopped, in the language of the app. What Spotify itself said goes inside a sentence of the window. */
function failureText(failure: Failure): string {
    if (FAILURE_TEXT[failure.kind]) return t(FAILURE_TEXT[failure.kind])
    if (failure.kind === 'rate-limit') {
        return failure.retryAfterSeconds ? t('spotifyWindow.failure.rateLimitFor', { seconds: failure.retryAfterSeconds }) : t('spotifyWindow.failure.rateLimit')
    }
    if (failure.detail) return t('spotifyWindow.failure.said', { detail: failure.detail })
    return t(failure.kind === 'broken' ? 'spotifyWindow.end.brokenMessage' : 'spotifyWindow.failure.silent')
}

const HEADINGS: Record<Ending, string> = {
    complete: 'spotifyWindow.end.complete', 'left-out': 'exportReport.leftOut', stopped: 'spotifyWindow.end.partial', failed: 'spotifyWindow.end.failed'
}

interface Model {
    state: Stage
    progress: { current: number; total: number; message: string }
    report: SpotifyReport | null
    /** How many times the hand-made window rewrote its HTML: the box under the container is made again at each. */
    draws: number
}

function Header({ canClose, onClose }: { canClose: boolean; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
                    <Icon name="Spotify" className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('spotifyWindow.title')}</h2>
            </div>
            {canClose ? (
                <button id="closeModalBtn" aria-label={t('spotifyWindow.close')} className="close-modal-btn p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={onClose}>
                    <Icon name="X" className="w-5 h-5" />
                </button>
            ) : null}
        </div>
    )
}

interface IdleProps {
    playlists: Playlist[]
    onePlaylist: boolean
    mode: Mode
    name: string
    onMode: (mode: Mode) => void
    onName: (name: string) => void
    onStart: () => void
}

function Idle({ playlists, onePlaylist, mode, name, onMode, onName, onStart }: IdleProps) {
    const totalTracks = playlists.reduce((sum, playlist) => sum + (playlist.tracks?.length || 0), 0)
    const note = onePlaylist ? t('spotifyWindow.note.one') : t(`spotifyWindow.note.${mode}`)
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm text-white/60 mb-2">{t('spotifyWindow.nameLabel')}</label>
                <input
                    type="text"
                    id="playlistNameInput"
                    defaultValue={name}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#1DB954] transition-colors"
                    placeholder={t('spotifyWindow.namePlaceholder')}
                    onInput={(event) => onName((event.target as HTMLInputElement).value)}
                />
            </div>

            <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {onePlaylist ? null : (
                    <>
                        <label className="block text-sm text-white/60">{t('spotifyWindow.modeLabel')}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="exportMode" value="merge" defaultChecked={mode === 'merge'} className="accent-[#1DB954]" onChange={() => onMode('merge')} />
                                <span className="text-sm text-white">{t('spotifyWindow.mode.merge')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="exportMode" value="separate" defaultChecked={mode === 'separate'} className="accent-[#1DB954]" onChange={() => onMode('separate')} />
                                <span className="text-sm text-white">{t('spotifyWindow.mode.separate')}</span>
                            </label>
                        </div>
                        <div className="h-px bg-white/10 my-2" />
                    </>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('spotifyWindow.count.playlists')}</span>
                    <span className="text-white font-medium">{playlists.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('spotifyWindow.count.tracks')}</span>
                    <span className="text-white font-medium">{totalTracks}</span>
                </div>
            </div>

            <button id="startExportBtn" className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ background: GREEN_GRADIENT }} onClick={onStart}>
                <Icon name="Spotify" className="w-5 h-5" />
                {broken(t('spotifyWindow.title'), 20, 16)}
            </button>

            <p id="exportModeNote" className="text-xs text-white/40 text-center">{note}</p>
        </div>
    )
}

function Progress({ model }: { model: Model }) {
    const { current, total, message } = model.progress
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0
    return (
        <div className="space-y-6 py-4">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style={{ background: GREEN }}>
                    <Icon name="Spotify" className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{t(STAGE_TEXT[model.state])}</h3>
                <p className="text-sm text-white/60 truncate max-w-[280px] mx-auto">{message}</p>
            </div>

            {model.state === 'MATCHING' ? (
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">{`${current} / ${total}`}</span>
                        <span className="text-white font-medium">{`${percentage}%`}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, background: GREEN }} />
                    </div>
                </div>
            ) : (
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    )
}

/** The playlists that are in Spotify, each with the link that opens it. */
function CreatedList({ created }: { created: Created[] }) {
    if (created.length === 0) return null
    return (
        <div className="bg-white/5 rounded-xl p-4 text-sm">
            <p className="text-white/60 mb-2">{t('spotifyWindow.created', { count: created.length })}</p>
            <ul className="space-y-2">
                {created.map((playlist, index) => {
                    const url = safeUrl(playlist.url) // the address comes from Spotify: a link only when it is a web address (F59)
                    return (
                        <li key={index} className="flex items-center justify-between gap-3">
                            <span className="min-w-0">
                                <span className="text-white">{playlist.name}</span>{' '}
                                <span className="text-white/60">{tPlural('spotifyWindow.createdTracks', playlist.tracks, { count: playlist.tracks })}</span>{' '}
                                {playlist.alreadyThere ? <span className="text-white/40">{t('spotifyWindow.alreadyThere')}</span> : null}
                            </span>
                            {url ? (
                                <a className="created-playlist-link shrink-0 text-[#1DB954] hover:underline inline-flex items-center gap-1" href={url} target="_blank" rel="noopener">
                                    <Icon name="ExternalLink" className="w-4 h-4" />{` ${t('spotifyWindow.open')}`}
                                </a>
                            ) : null}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

/** How many tracks were found in Spotify, the ones that were not, and the ones that could not be checked. */
function MatchSummary({ report, missing, unchecked }: { report: SpotifyReport; missing: string[]; unchecked: string[] }) {
    if (!report.totalTracks) return null
    if (report.failure?.kind === 'refused' && report.matchCount === 0) return null
    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-white/60">{t('spotifyWindow.matched')}</span>
                <span className="text-[#1DB954] font-medium">{`${report.matchCount} / ${report.totalTracks}`}</span>
            </div>
            <TrackNames summary="spotifyWindow.notFound" more="spotifyWindow.notFoundMore" tracks={missing} />
            <TrackNames summary="spotifyWindow.uncheckedCount" more="spotifyWindow.uncheckedMore" tracks={unchecked} />
        </div>
    )
}

/**
 * What the person can do after the report: connect again, try again, close. A refusal of Spotify has no button: trying again is refused again.
 * `again` (F98): there is something another try could bring; with no failure, it is what was left out, and the note says what trying again does.
 */
function NextSteps({ failure, again, onReconnect, onRetry, onClose }: { failure: Failure | null; again: boolean; onReconnect: () => void; onRetry: () => void; onClose: () => void }) {
    let next: ReactNode = null
    if (failure?.kind === 'reconnect') {
        next = (
            <>
                <button id="reconnectSpotifyBtn" className={PRIMARY} style={{ background: GREEN_GRADIENT }} onClick={onReconnect}>
                    <Icon name="Spotify" className="w-5 h-5" />{` ${t('spotifyWindow.reconnect')}`}
                </button>
                <p className="text-xs text-white/40 text-center">{t('spotifyWindow.reconnectNote')}</p>
            </>
        )
    } else if (failure?.kind === 'refused') {
        next = <p id="spotifyRefusedNote" className="text-sm text-white/80 text-center">{t('spotifyWindow.refusedNote')}</p>
    } else if (again) {
        next = (
            <>
                <button id="retryExportBtn" className={PRIMARY} style={{ background: GREEN_GRADIENT }} onClick={onRetry}>
                    <Icon name="RefreshCw" className="w-5 h-5" />{` ${t('spotifyWindow.retry')}`}
                </button>
                <p className="text-xs text-white/40 text-center">{failure ? t('spotifyWindow.retryNote') : t('exportReport.retryPartialNote', { service: 'Spotify' })}</p>
            </>
        )
    }
    return (
        <>
            {next}
            <button className="close-modal-btn w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors" onClick={onClose}>
                {broken(t('spotifyWindow.close'), 16, 12)}
            </button>
        </>
    )
}

/** The end of an export: what it created, what it did not, why it stopped, what to do next. */
function Report({ report, missing, unchecked, onReconnect, onRetry, onClose }: { report: SpotifyReport; missing: Track[]; unchecked: Track[]; onReconnect: () => void; onRetry: () => void; onClose: () => void }) {
    const { failure } = report
    const done = report.created.length + report.incomplete.length
    let ending: Ending = leftSomethingOut(report) ? 'left-out' : 'complete'
    if (failure) ending = done > 0 ? 'stopped' : 'failed'
    const said = (track: Track) => `${track.artist} - ${track.title}`
    let under: ReactNode = null
    if (failure) under = <p className="text-white/80">{failureText(failure)}</p>
    else if (ending === 'left-out') under = <p className="text-white/80">{t('exportReport.leftOutNote')}</p>
    return (
        <div className="space-y-5 py-4">
            <ReportHeading ending={ending} okClass="bg-[#1DB954]" title={t(HEADINGS[ending])}>{under}</ReportHeading>

            <CreatedList created={report.created} />
            <Names title={t('spotifyWindow.incomplete')} names={report.incomplete.map(item => t('spotifyWindow.incompleteItem', { name: item.name, tracks: item.tracks, total: item.total }))} />
            <Names title={t('spotifyWindow.notCreated')} names={report.notCreated} />
            <Names title={t('spotifyWindow.empty')} names={report.empty} />
            <MatchSummary report={report} missing={missing.map(said)} unchecked={unchecked.map(said)} />
            <NextSteps failure={failure} again={worthAnotherTry(report)} onReconnect={onReconnect} onRetry={onRetry} onClose={onClose} />
        </div>
    )
}

/** The name the Spotify playlist gets unless the person types another: the series, and with one playlist given, the series and the playlist. */
function defaultNameOf(given: SpotifyGiven | null, deps: SpotifyExportDeps): string {
    const series = given?.seriesName || deps.seriesName() || t('spotifyWindow.defaultName')
    if (!given || given.playlists.length !== 1) return series
    const only = given.playlists[0] as Playlist
    return `${series} - ${only.title || only.name}`
}

interface Run {
    deps: SpotifyExportDeps
    playlists: Playlist[]
    options: { mode: Mode; name: string }
    redraw: (change: Partial<Model>) => void
    notFound: Track[]
    unchecked: Track[]
}

/** Run the export and end on its report; a failure the service did not foresee is a report too. */
async function runExport({ deps, playlists, options, redraw, notFound, unchecked }: Run): Promise<void> {
    let report: SpotifyReport
    try {
        report = await deps.exportPlaylists(playlists, options, {
            onProgress: (stage, current, total, names) => redraw({ state: stage as Stage, progress: { current, total, message: progressText(stage, names) } }),
            onNotFound: (track) => { notFound.push(track) },
            onUnchecked: (track) => { unchecked.push(track) }
        })
    } catch (error) {
        console.error('[SpotifyExportWindow] Export failed:', error)
        report = brokenReport(error)
    }
    redraw({ state: 'DONE', report })
}

/** What the window keeps: where the export is, what the person chose, and the one export that may run. */
function useSpotifyExport(given: SpotifyGiven | null, deps: SpotifyExportDeps, close: () => void) {
    const [model, setModel] = useState<Model>({ state: 'IDLE', progress: { current: 0, total: 0, message: '' }, report: null, draws: 1 })
    const [mode, setMode] = useState<Mode>('merge')
    const onePlaylist = Boolean(given) && (given as SpotifyGiven).playlists.length === 1
    const name = useRef<string | null>(null)
    if (name.current === null) name.current = defaultNameOf(given, deps)
    const exporting = useRef(false) // one export at a time
    const closed = useRef(false)
    const notFound = useRef<Track[]>([])
    const unchecked = useRef<Track[]>([])
    const playlistsToExport = (): Playlist[] => (given ? given.playlists : deps.playlists()) as Playlist[]

    /** The hand-made window rewrote its HTML at each of these: the page is drawn at once, and made again. */
    const redraw = (change: Partial<Model>) => {
        if (closed.current) return
        flushSync(() => setModel(before => ({ ...before, ...change, draws: before.draws + 1 })))
    }
    const leave = () => { closed.current = true; close() }

    /** Run the export with the name and the mode chosen, and end on its report. One at a time. */
    const start = async () => {
        if (exporting.current) return
        const playlists = playlistsToExport()
        if (playlists.length === 0) { deps.warn(t('spotifyWindow.nothing')); return }

        exporting.current = true
        notFound.current = []
        unchecked.current = []
        try {
            await runExport({ deps, playlists, redraw, notFound: notFound.current, unchecked: unchecked.current, options: { mode: onePlaylist ? 'merge' : mode, name: name.current as string } })
        } finally {
            exporting.current = false
        }
    }
    return { model, mode, setMode, onePlaylist, name, notFound, unchecked, playlistsToExport, leave, start: () => { void start() } }
}

function SpotifyExportWindow({ given, deps, close }: { given: SpotifyGiven | null; deps: SpotifyExportDeps; close: () => void }) {
    const { model, mode, setMode, onePlaylist, name, notFound, unchecked, playlistsToExport, leave, start } = useSpotifyExport(given, deps, close)
    const canClose = model.state === 'IDLE' || model.state === 'DONE'

    let content: ReactNode
    if (model.state === 'IDLE') {
        content = <Idle playlists={playlistsToExport()} onePlaylist={onePlaylist} mode={mode} name={name.current as string} onMode={setMode} onName={(value) => { name.current = value }} onStart={start} />
    } else if (model.state === 'DONE' && model.report) {
        content = <Report report={model.report} missing={notFound.current} unchecked={unchecked.current} onReconnect={deps.login} onRetry={start} onClose={leave} />
    } else {
        content = <Progress model={model} />
    }

    return createPortal(
        <div id="spotify-export-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Fragment key={model.draws}>
                <div className="modal-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (canClose) leave() }} />
                <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <Header canClose={canClose} onClose={leave} />
                    {content}
                </div>
            </Fragment>
        </div>,
        document.body
    )
}

/** Opens the window over the page. `given`: the playlists and the series the saved playlists screen hands over; none given: the playlists on the edit screen. */
export function showSpotifyExportWindow(given: SpotifyGiven | undefined, deps: SpotifyExportDeps): void {
    showWindow((close) => <SpotifyExportWindow given={given?.playlists ? given : null} deps={deps} close={close} />)
}
