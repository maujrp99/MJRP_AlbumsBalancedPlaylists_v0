/**
 * The pieces of the album picker panel (F83 wave 5b; ported from components/album-picker/pickerParts.js and
 * views/renderers/DiscographyRenderer.js): the filter button, the Scan button, the message of the panel and the album card. Each draws
 * the markup and the classes the hand-made piece drew (the proof of wave 5b compares them); the words come from the dictionary (`ui.picker.*`).
 */
import { t } from '../../i18n/t.js'
import { CATALOG_DEADLINE_SECONDS, ScanFailure, ScanStatus } from '../../models/scanState.js'
import { badgeCodesOf } from '../../models/albumPicker.js'
import { CoverImage } from '../CoverImage'
import { Icon } from '../Icon'
import type { PickerAlbum, Scan } from './pickerController'

const FILTER_ON = 'filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0'
const FILTER_OFF = 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0'
const PANEL_ICONS: Record<string, string> = { idle: 'Search', empty: 'Search', failed: 'AlertTriangle' }

/** A filter button: icon, label and the count of albums it has. */
export function FilterButton({ filter, active, count, onToggle }: { filter: { key: string; icon: string }; active: boolean; count: number; onToggle: () => void }) {
    return (
        <button type="button" className={active ? FILTER_ON : FILTER_OFF} data-filter={filter.key} aria-pressed={active} onClick={onToggle}>
            <Icon name={filter.icon} className="w-3 h-3" />
            <span className="filter-btn-text">{t(`ui.picker.filter.${filter.key}`)}</span>
            <span className="filter-btn-count text-[10px] opacity-70">{count > 0 ? ` (${count})` : ''}</span>
        </button>
    )
}

/** The Scan button: busy and not to be pressed while the catalog is asked. */
export function ScanButton({ busy, onScan }: { busy: boolean; onScan: () => void }) {
    const className = `btn btn-primary px-4 flex items-center gap-2${busy ? ' opacity-60 cursor-wait' : ''}`
    return (
        <button type="button" className={className} data-action="scan-artist" disabled={busy} aria-busy={busy ? 'true' : undefined} onClick={onScan}>
            {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="ScanLine" className="w-4 h-4" />}
            <span>{busy ? t('ui.picker.scanning') : t('ui.picker.scan')}</span>
        </button>
    )
}

/** The line under the field: where the scan is, in words. */
export function statusLineOf(scan: Scan): string {
    switch (scan.status) {
        case ScanStatus.SCANNING: return t('ui.picker.scanning')
        case ScanStatus.RESULTS: return t(scan.classifying ? 'ui.picker.status.confirming' : 'ui.picker.status.results', { artist: scan.artist ?? '' })
        case ScanStatus.EMPTY: return t('ui.picker.status.empty')
        case ScanStatus.FAILED: return t('ui.picker.status.failed')
        default: return ''
    }
}

interface PanelText {
    kind: string
    title: string
    detail: string
    retry: boolean
}

/** The message of the panel for a state without albums, or null (the results are the panel). */
export function panelOf(scan: Scan): PanelText | null {
    switch (scan.status) {
        case ScanStatus.IDLE: return { kind: 'idle', title: t('ui.picker.idle.title'), detail: '', retry: false }
        case ScanStatus.SCANNING: return { kind: 'scanning', title: t('ui.picker.scanning.title', { query: scan.query }), detail: t('ui.picker.scanning.detail'), retry: false }
        case ScanStatus.EMPTY: return { kind: 'empty', title: t('ui.picker.empty.title', { query: scan.query }), detail: t('ui.picker.empty.detail'), retry: false }
        case ScanStatus.FAILED: return {
            kind: 'failed',
            title: scan.failure === ScanFailure.TIMEOUT ? t('ui.picker.failed.timeout', { seconds: CATALOG_DEADLINE_SECONDS }) : t('ui.picker.failed.error'),
            detail: t('ui.picker.failed.detail'),
            retry: true
        }
        default: return null
    }
}

/** The message of the panel: idle, scanning, empty or failed with «Try again». */
export function ScanPanel({ panel, onRetry }: { panel: PanelText; onRetry: () => void }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center text-gray-600 space-y-4 py-8" data-scan-panel={panel.kind}>
            {panel.kind === 'scanning'
                ? <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
                : <Icon name={PANEL_ICONS[panel.kind] ?? 'Search'} className="w-12 h-12 opacity-20" />}
            <p className={panel.kind === 'failed' ? 'text-gray-300' : ''}>{panel.title}</p>
            {panel.detail ? <p className="text-xs text-gray-500">{panel.detail}</p> : null}
            {panel.retry ? (
                <button type="button" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-colors" data-action="scan-retry" onClick={onRetry}>
                    {t('ui.picker.retry')}
                </button>
            ) : null}
        </div>
    )
}

/** The edition and type badges of a card: one rule for every screen (models/albumPicker.js), said in the language of the site. */
const badgesOf = (album: PickerAlbum): string[] => (badgeCodesOf(album) as string[]).map(code => t(`ui.picker.badge.${code.toLowerCase()}`))

/** The card of an album of the scan: it carries `data-action="pick-album"` and the id of its album. */
export function PickerCard({ album, onPick }: { album: PickerAlbum; onPick: (id: string) => void }) {
    // an album the catalog gave no cover for shows the stand-in
    const cover = album.coverUrl ? album.coverUrl.replace('{w}', '300').replace('{h}', '300') : null
    return (
        <div className="group cursor-pointer flex flex-col" data-action="pick-album" data-id={album.id} onClick={() => onPick(album.id)}>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-orange-500/50 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all">
                <CoverImage src={cover} alt={album.title ?? ''} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] pointer-events-none">
                    {badgesOf(album).map(word => (
                        <span key={word} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">{word}</span>
                    ))}
                </div>
                <div className="absolute top-2 right-2 bg-black/40 group-hover:bg-orange-500 text-white p-1.5 rounded-full transition-all pointer-events-none">
                    <Icon name="Plus" className="w-4 h-4" />
                </div>
            </div>
            <div className="mt-3 pl-1">
                <h3 className="text-white font-bold text-sm leading-tight group-hover:text-orange-500 transition-colors line-clamp-2" title={album.title}>{album.title}</h3>
                <p className="text-gray-400 text-xs truncate mt-0.5">{album.year || t('ui.picker.yearUnknown')}</p>
            </div>
        </div>
    )
}
