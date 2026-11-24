/**
 * ExportReportParts - the pieces the report of an export is made of, shared by the two windows that end on one (F98): the Spotify window
 * (ui/SpotifyExportWindow.tsx, which had them) and the report of the Apple Music export (ui/AppleExportReport.tsx).
 *
 *   ReportHeading  the sign, the heading and the sentence under it. It is the result of the export: a status region, so a screen reader
 *                  is told, and its heading takes the focus when the report appears, so the keyboard and the reader are where the news is.
 *                  A result with something left out has its own sign (amber), never the one of a clean success.
 *   Names          a titled list of names (playlists not created, with no track found...); nothing when the list is empty
 *   TrackNames     a count of tracks that opens into their names: the ones not found, or the ones that could not be checked
 *
 * They draw what they are given: no store, no service, no words of their own but the ones of the keys they are handed.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import { broken } from './recipe/broken'
import { t, tPlural } from '../i18n/t.js'

/** How many names a list of tracks shows before it counts the rest. */
export const NAMES_AT_MOST = 10

/** How a report ended, as models/exportOutcome.js `exportEnding` says it. */
export type Ending = 'complete' | 'left-out' | 'stopped' | 'failed'

const SIGNS: Record<'bad' | 'warn', { box: string; icon: string }> = {
    bad: { box: 'bg-red-500/20', icon: 'text-red-400' },
    warn: { box: 'bg-yellow-500/20', icon: 'text-yellow-400' }
}

/**
 * The top of a report. `okClass` is the colour of the service's own sign of success (Spotify's green is Spotify's).
 * `children` is the sentence under the heading: why it stopped, or what was left out.
 */
export function ReportHeading({ ending, okClass, title, children }: { ending: Ending; okClass: string; title: string; children?: ReactNode }) {
    const heading = useRef<HTMLHeadingElement>(null)
    // The report appeared: the focus goes to its heading (it is read, and Tab goes on from there)
    useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
    const sign = ending === 'complete' ? null : SIGNS[ending === 'left-out' ? 'warn' : 'bad']
    return (
        <div className="text-center" role="status" aria-live="polite">
            {sign ? (
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${sign.box}`}><Icon name="AlertTriangle" className={`w-8 h-8 ${sign.icon}`} /></div>
            ) : (
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${okClass}`}><Icon name="Check" className="w-8 h-8 text-white" /></div>
            )}
            <h3 ref={heading} tabIndex={-1} data-export-heading="true" className="text-xl font-bold text-white mb-2 focus:outline-none">{title}</h3>
            {children}
        </div>
    )
}

/** A titled list of names; nothing when the list is empty. */
export function Names({ title, names }: { title: string; names: string[] }) {
    if (names.length === 0) return null
    return (
        <div className="bg-white/5 rounded-xl p-4 text-sm">
            <p className="text-yellow-400 mb-2">{`${title} (${names.length})`}</p>
            <ul className="space-y-1 text-white/80">{names.map((name, index) => <li key={index}>{`• ${name}`}</li>)}</ul>
        </div>
    )
}

/** A count of tracks that opens into their names. `summary` is a key with a singular and a plural; `more`, the key of «...and N more». */
export function TrackNames({ summary, more, tracks }: { summary: string; more: string; tracks: string[] }) {
    if (tracks.length === 0) return null
    return (
        <details>
            <summary className="text-yellow-400 cursor-pointer hover:text-yellow-300 flex items-center gap-2">
                <Icon name="AlertTriangle" className="w-4 h-4" />
                {broken(tPlural(summary, tracks.length, { count: tracks.length }), 28, 24)}
            </summary>
            <ul className="mt-2 space-y-1 text-white/60 max-h-32 overflow-y-auto pl-6">
                {tracks.slice(0, NAMES_AT_MOST).map((track, index) => <li key={index} className="truncate">{`• ${track}`}</li>)}
                {tracks.length > NAMES_AT_MOST ? <li className="text-white/40">{t(more, { count: tracks.length - NAMES_AT_MOST })}</li> : null}
            </ul>
        </details>
    )
}
