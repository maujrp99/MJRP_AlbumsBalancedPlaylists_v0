/**
 * AppleExportReport - the end of an export to Apple Music, drawn in the export window (F98, UAT-307).
 *
 * Until F98 the end of this export was a row of notices that went away by themselves, written in English by the service, with no way to
 * try again. Now the window stays on the report of the export (services/AppleMusicExportService.js): what was created and where, what was
 * not and why, the tracks the catalogue does not have apart from the ones that could not be checked, and what the person can do next. It is
 * made of the pieces of the Spotify window's report (ui/ExportReportParts.tsx): the same heading that takes the focus and is a status region,
 * the same lists. A result with something left out is never headed as a clean success.
 *
 * «Try again» runs the export again to the same folder; while it runs the button carries the progress, as the «Export» button of the folder
 * step does. It is offered when another try could bring something (models/exportOutcome.js `worthAnotherTry`): not when the catalogue
 * answered and had none.
 *
 * Every sentence is from the dictionary of the language (F98, UAT-308); a name a person wrote, and what Apple Music itself said, go in as
 * they are. `ui/` imports no store, service or controller: the report and the two actions are given.
 */
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { Names, ReportHeading, TrackNames, type Ending } from './ExportReportParts'
import { t, tPlural } from '../i18n/t.js'
import { appleFailureText, appleNextStepText } from '../i18n/exportTexts.js'
import { exportEnding, worthAnotherTry } from '../models/exportOutcome.js'

interface Created { name: string; tracks: number; total: number; alreadyThere?: boolean }
interface Failure { kind: string; detail?: string | null }
/** What AppleMusicExportService answers (its own rules are in services/AppleMusicExportService.js). */
export interface AppleReport {
    folder: { name: string | null; created: boolean; none?: boolean }
    created: Created[]
    failed: Array<{ name: string; detail?: string | null }>
    empty: string[]
    notFound: string[]
    unchecked?: number
    uncheckedTracks?: string[]
    notCreated: string[]
    failure: Failure | null
}

const HEADINGS: Record<Ending, string> = {
    complete: 'appleReport.end.complete', 'left-out': 'exportReport.leftOut', stopped: 'appleReport.end.partial', failed: 'appleReport.end.failed'
}

/** Where the playlists went: the folder, no folder, or the top of the library when the folder could not be made. */
function folderLine(report: AppleReport): { text: string; warned: boolean } {
    if (report.folder.none) return { text: t('appleReport.folder.none'), warned: false }
    const name = report.folder.name ?? ''
    return report.folder.created ? { text: t('appleReport.folder.in', { name }), warned: false } : { text: t('appleReport.folder.notCreated', { name }), warned: true }
}

/** The playlists that are in the library, and where. */
function CreatedList({ report }: { report: AppleReport }) {
    if (report.created.length === 0) return null
    const where = folderLine(report)
    return (
        <div className="bg-white/5 rounded-xl p-4 text-sm">
            <p className="text-white/60 mb-2">{t('appleReport.created', { count: report.created.length })}</p>
            <ul className="space-y-2">
                {report.created.map((playlist, index) => (
                    <li key={index}>
                        <span className="text-white">{playlist.name}</span>{' '}
                        <span className="text-white/60">{tPlural('appleReport.createdTracks', playlist.tracks, { count: playlist.tracks })}</span>{' '}
                        {playlist.alreadyThere ? <span className="text-white/40">{t('appleReport.alreadyThere')}</span> : null}
                    </li>
                ))}
            </ul>
            <p className={`mt-3 ${where.warned ? 'text-yellow-400' : 'text-white/60'}`} data-apple-folder-line="true">{where.text}</p>
        </div>
    )
}

/** The sentence under the heading: why it stopped (with the next step, when there is one), or that something was left out. */
function Under({ report, ending }: { report: AppleReport; ending: Ending }): ReactNode {
    const { failure } = report
    if (failure) {
        const next = appleNextStepText(failure)
        return (
            <>
                <p className="text-white/80">{appleFailureText(failure)}</p>
                {next ? <p className="text-sm text-white/80 mt-2" data-apple-next-step="true">{next}</p> : null}
            </>
        )
    }
    return ending === 'left-out' || ending === 'failed' ? <p className="text-white/80">{t('exportReport.leftOutNote')}</p> : null
}

export function AppleExportReport({ report, progress, onRetry, onClose }: {
    report: AppleReport
    /** The progress of the export that «Try again» started (a text while it runs), or null. */
    progress: string | null
    onRetry: () => void
    onClose: () => void
}) {
    const ending = exportEnding(report) as Ending
    const tracks = [...report.notFound, ...(report.uncheckedTracks ?? [])]
    return (
        <div className="flex flex-col gap-4" data-apple-report={ending}>
            <ReportHeading ending={ending} okClass="bg-green-600" title={t(HEADINGS[ending])}><Under report={report} ending={ending} /></ReportHeading>

            <CreatedList report={report} />
            <Names title={t('appleReport.failed')} names={report.failed.map(item => (item.detail ? t('appleReport.failedItem', { name: item.name, detail: item.detail }) : item.name))} />
            <Names title={t('appleReport.notCreated')} names={report.notCreated} />
            <Names title={t('appleReport.empty')} names={report.empty} />
            {tracks.length > 0 ? (
                <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                    <TrackNames summary="appleReport.notFound" more="appleReport.notFoundMore" tracks={report.notFound} />
                    <TrackNames summary="appleReport.uncheckedCount" more="appleReport.uncheckedMore" tracks={report.uncheckedTracks ?? []} />
                </div>
            ) : null}

            {worthAnotherTry(report) ? (
                <>
                    <button type="button" className="btn btn-primary w-full justify-center" data-apple-retry="true" disabled={progress !== null} onClick={onRetry}>
                        {progress === null ? <><Icon name="RefreshCw" className="w-5 h-5" />{` ${t('appleReport.retry')}`}</> : <><Icon name="Apple" className="w-5 h-5" />{` ${progress}`}</>}
                    </button>
                    <p className="text-xs text-white/40 text-center">{report.failure || report.failed.length > 0 ? t('appleReport.retryNote') : t('exportReport.retryPartialNote', { service: 'Apple Music' })}</p>
                </>
            ) : null}
            <button type="button" className="btn btn-ghost w-full justify-center" data-apple-report-close="true" onClick={onClose}>{t('appleReport.close')}</button>
        </div>
    )
}
