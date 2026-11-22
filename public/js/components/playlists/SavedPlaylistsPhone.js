/**
 * SavedPlaylistsPhone - the saved playlists on the phone (F76 polish, recheck N5).
 *
 * The anatomy of the Albums screen (components/series/SeriesPhoneSheets.js, ui/AlbumPhoneCard.js):
 * a calm list of series, each a header row - covers, name, «n batches · n playlists», a chevron
 * and a «⋯» of 44 px. Opened, a series shows its batches as rows - readable name, «n playlists ·
 * n tracks · length · date», «⋯» - and a batch opened shows its playlists as rows that open the
 * playlist's tracks. No card inside a card; nothing red on the screen: every action of a series or
 * of a batch is named in a bottom sheet, the destructive one last, in red, and it asks first (the
 * view's handlers ask, as on the computer).
 *
 * Every action calls the same handler the computer's buttons call (SavedSeriesGroup's handlers).
 * The sheets carry the class of the Albums sheets, so the five screens share one sheet row.
 * Drawn only when isPhone() (SavedSeriesGroup asks).
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { openSheet } from '../ui/Sheet.js'
import { AlbumCascade } from '../common/AlbumCascade.js'
import { batchTotals, toMillis } from '../../models/savedPlaylists.js'
import { minutes } from './PhonePlaylists.js'
import { readableBatchName, shortDate } from './batchNames.js'

const DOTS = '<svg class="phone-dots" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/** «6 playlists · 84 tracks · 5 h 12 min · 20 Nov 2026» */
export function batchFacts(batch) {
    const totals = batchTotals(batch)
    return [
        plural(totals.playlists, 'playlist'),
        plural(totals.tracks, 'track'),
        minutes(totals.durationSeconds),
        // a date never breaks across two lines
        shortDate(toMillis(batch.savedAt)).replace(/ /g, ' ')
    ].filter(Boolean).join(' · ')
}

function moreButton(label, onTap) {
    const button = SafeDOM.button({ type: 'button', className: 'phone-more', 'aria-label': label, 'aria-haspopup': 'dialog' })
    button.appendChild(SafeDOM.fromHTML(DOTS))
    button.addEventListener('click', (event) => { event.stopPropagation(); onTap() })
    return button
}

/** A row that opens and closes a box under it; the box is filled the first time (F61). */
function disclosure({ className, label, text, meta, box, fill, onToggle = () => { } }) {
    const button = SafeDOM.button({
        type: 'button', className, 'aria-expanded': String(!box.hidden), 'aria-controls': box.id
    }, [
        label,
        SafeDOM.span({ className: 'saved-phone__text' }, [text, meta]),
        SafeDOM.fromHTML(getIcon('ChevronRight', 'saved-phone__chevron'))
    ].filter(Boolean))
    button.addEventListener('click', () => {
        if (box.hidden) fill?.()
        box.hidden = !box.hidden
        button.setAttribute('aria-expanded', String(!box.hidden))
        onToggle(!box.hidden)
    })
    return button
}

/* ── Sheets ──────────────────────────────────────────────────────────────────────────────── */

function sheetRow({ icon, label, danger = false, onPick }) {
    const row = SafeDOM.button({ type: 'button', className: `albums-sheet__row${danger ? ' albums-sheet__row--danger' : ''}` }, [
        SafeDOM.fromHTML(getIcon(icon, 'albums-sheet__icon')),
        SafeDOM.span({ className: 'albums-sheet__label' }, label)
    ])
    row.addEventListener('click', onPick)
    return row
}

function showSheet({ title, about, rows, danger }) {
    let sheet = null
    const pick = (handler) => () => { sheet?.close(); handler() }
    const content = [
        about ? SafeDOM.p({ className: 'albums-sheet__about' }, about) : null,
        SafeDOM.div({ className: 'albums-sheet__list' }, rows.map(row => sheetRow({ ...row, onPick: pick(row.onPick) }))),
        danger ? SafeDOM.div({ className: 'albums-sheet__list' }, [sheetRow({ ...danger, danger: true, onPick: pick(danger.onPick) })]) : null
    ].filter(Boolean)
    sheet = openSheet({ variant: 'bottom', title, content })
    sheet.element.classList.add('albums-sheet', 'saved-phone-sheet')
    return sheet
}

/** The actions of a series: add playlists, open its albums, delete all its playlists (asked). */
export function openSeriesSheet({ series, summary, hasPlaylists, handlers }) {
    return showSheet({
        title: series.name || 'Series',
        about: summary,
        rows: [
            { icon: 'Plus', label: 'Add playlists', onPick: () => handlers.onNavigate() },
            { icon: 'Layers', label: 'Open the album series', onPick: () => handlers.onOpenSeries(series.id) }
        ],
        danger: hasPlaylists ? { icon: 'Trash', label: 'Delete all playlists of this series', onPick: () => handlers.onDeleteAll(series.id, series.name) } : null
    })
}

/** The actions of a batch: edit it, delete it (asked). The saved name is said whole here. */
export function openBatchSheet({ batch, seriesId, handlers }) {
    const shown = readableBatchName(batch.name)
    const count = batchTotals(batch).playlists
    return showSheet({
        title: shown.text,
        about: shown.machine ? `Saved as “${batch.name}”` : batchFacts(batch),
        rows: [
            { icon: 'Edit', label: 'Edit batch', onPick: () => handlers.onEditBatch(seriesId, batch.name, batch.savedAt) },
            { icon: 'Share', label: 'Export', onPick: () => handlers.onExportBatch(batch) }
        ],
        danger: { icon: 'Trash', label: 'Delete batch', onPick: () => handlers.onDeleteBatch(seriesId, batch.name, count) }
    })
}

/* ── Rows ────────────────────────────────────────────────────────────────────────────────── */

/** One playlist of an opened batch: its name and size, a tap opens its tracks; beside it, «Export» (F90). */
function playlistRow(playlist, seriesId, handlers, { batch, index }) {
    const totals = batchTotals({ playlists: [playlist] })
    const row = SafeDOM.button({
        type: 'button', className: 'saved-phone-playlist', dataset: { playlistId: playlist.id },
        'aria-label': `Open the tracks of ${playlist.name}`
    }, [
        SafeDOM.span({ className: 'saved-phone__text' }, [
            SafeDOM.span({ className: 'saved-phone-playlist__name' }, playlist.name || 'Playlist'),
            SafeDOM.span({ className: 'saved-phone__meta' }, `${plural(totals.tracks, 'track')} · ${minutes(totals.durationSeconds)}`)
        ]),
        SafeDOM.fromHTML(getIcon('ChevronRight', 'saved-phone__chevron'))
    ])
    row.addEventListener('click', () => handlers.onOpenPlaylist(seriesId, playlist.id))
    const exportButton = SafeDOM.button({ type: 'button', className: 'phone-more', 'aria-label': `Export ${playlist.name}`, 'aria-haspopup': 'dialog' })
    exportButton.appendChild(SafeDOM.fromHTML(getIcon('Share', 'saved-phone-export__icon')))
    exportButton.addEventListener('click', () => handlers.onExportPlaylist(batch, playlist, index))
    return SafeDOM.div({ className: 'saved-phone__head saved-phone-playlist-head' }, [row, exportButton])
}

/** One batch: a row that opens its playlists, and its «⋯». */
export function renderBatchRow({ batch, seriesId, handlers }) {
    const shown = readableBatchName(batch.name)
    const box = SafeDOM.div({ className: 'saved-phone-batch__playlists', id: `savedBatch_${seriesId}_${encodeURIComponent(batch.name)}` })
    box.hidden = true
    const fill = () => {
        if (box.childElementCount > 0) return
        const playlists = batch.playlists || []
        if (playlists.length === 0) box.appendChild(SafeDOM.p({ className: 'saved-phone__empty' }, 'No playlists in this batch'))
        playlists.forEach((playlist, index) => box.appendChild(playlistRow(playlist, seriesId, handlers, { batch, index })))
    }
    const main = disclosure({
        className: 'saved-phone-batch__main batch-header',
        text: SafeDOM.span({ className: 'saved-phone-batch__name' }, shown.text),
        meta: SafeDOM.span({ className: 'saved-phone__meta' }, batchFacts(batch)),
        box,
        fill
    })
    const more = moreButton(`Actions for batch ${batch.name}`, () => openBatchSheet({ batch, seriesId, handlers }))
    return SafeDOM.div({ className: 'saved-phone-batch', dataset: { seriesId, batchName: batch.name } }, [
        SafeDOM.div({ className: 'saved-phone__head' }, [main, more]),
        box
    ])
}

/**
 * The header row of a series: covers, name, what it holds; it opens the box of its batches.
 * @returns {HTMLElement}
 */
export function renderSeriesHead({ group, summary, batchesBox, hasPlaylists, handlers, onToggle }) {
    const series = group.series
    const main = disclosure({
        className: 'saved-series-toggle saved-phone-series__main',
        label: AlbumCascade.renderNode(group.thumbnails || []),
        text: SafeDOM.span({ className: 'saved-phone-series__name' }, series.name),
        meta: SafeDOM.span({ className: 'saved-series-toggle__text saved-phone__meta' }, summary),
        box: batchesBox,
        onToggle
    })
    const more = moreButton(`Actions for series ${series.name}`, () => openSeriesSheet({ series, summary, hasPlaylists, handlers }))
    return SafeDOM.div({ className: 'saved-phone__head saved-phone-series__head' }, [main, more])
}
