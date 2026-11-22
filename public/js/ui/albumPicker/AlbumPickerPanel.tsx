/**
 * The album picker as one block, to put inside another screen (the window to edit a series). F83 wave 5b: the port of
 * components/album-picker/AlbumPickerPanel.js.
 *
 * It is a frame for the one picker (pickerController.ts): the field and the Scan button, the status line, the filter buttons and the album
 * cards, all drawn from the picker's state with the pieces of PickerParts.tsx. It decides nothing: a press asks the controller. The service
 * that scans an artist is given by the screen (a piece of `ui/` reaches no service).
 */
import { useEffect, useRef, useState } from 'react'
import { t } from '../../i18n/t.js'
import { PICKER_FILTERS, countByFilter, defaultFilters } from '../../models/albumPicker.js'
import { ScanStatus, idleScan } from '../../models/scanState.js'
import { AlbumPickerController, type Counts, type Filters, type PickerAlbum, type PickerOptions, type Scan } from './pickerController'
import { FilterButton, PickerCard, ScanButton, ScanPanel, panelOf, statusLineOf } from './PickerParts'

interface Props {
    service: PickerOptions['service']
    /** What the window does with a picked album. */
    onPick: (album: PickerAlbum) => void
    /** Where the picker warns (the site's notices): a piece of ui/ holds no store. */
    warn: (message: string) => void
}

const FILTERS = PICKER_FILTERS as ReadonlyArray<{ key: string; icon: string }>

export function AlbumPickerPanel({ service, onPick, warn }: Props) {
    const [scan, setScan] = useState<Scan>(() => idleScan() as Scan)
    const [filters, setFilters] = useState<Filters>(() => defaultFilters() as Filters)
    const [counts, setCounts] = useState<Counts>(() => countByFilter([]) as Counts)
    const [albums, setAlbums] = useState<PickerAlbum[]>([])
    const controller = useRef<AlbumPickerController | null>(null)
    const field = useRef<HTMLInputElement>(null)
    const latestPick = useRef(onPick)
    latestPick.current = onPick

    // one controller for as long as the panel is in the page (the strict mode runs this twice: the first is let go and a fresh one made)
    useEffect(() => {
        const made = new AlbumPickerController({
            service,
            emptyQueryMessage: () => t('ui.picker.typeFirst'),
            warn,
            onPick: (album) => latestPick.current(album),
            view: {
                drawScan: setScan,
                drawFilters: (nextFilters, nextCounts) => { setFilters(nextFilters); setCounts(nextCounts) },
                drawAlbums: setAlbums
            }
        })
        controller.current = made
        made.start()
        return () => {
            made.dispose()
            controller.current = null
        }
    }, [service])

    const scanNow = () => { void controller.current?.searchArtist(field.current?.value ?? '') }
    const panel = panelOf(scan)

    return (
        <div className="mt-4 p-3 bg-white/5 rounded-lg" data-album-picker="true">
            <div className="flex gap-2 mb-2">
                <input
                    ref={field}
                    type="text"
                    className="form-control flex-1"
                    placeholder={t('ui.picker.artistPlaceholder')}
                    aria-label={t('ui.picker.artistLabel')}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        scanNow()
                    }}
                />
                <ScanButton busy={scan.status === ScanStatus.SCANNING} onScan={scanNow} />
            </div>
            <p className="text-xs text-gray-300 font-bold min-h-4 mb-2" role="status" aria-live="polite">{statusLineOf(scan)}</p>
            <div className="flex flex-wrap gap-2 mb-3">
                {FILTERS.map(filter => (
                    <FilterButton key={filter.key} filter={filter} active={Boolean(filters[filter.key])} count={counts[filter.key] ?? 0} onToggle={() => controller.current?.toggleFilter(filter.key)} />
                ))}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1" data-picker-grid="true">
                {panel
                    ? <ScanPanel key={panel.kind} panel={panel} onRetry={() => { void controller.current?.retry() }} />
                    : <Cards albums={albums} onPick={(id) => controller.current?.pick(id)} />}
            </div>
        </div>
    )
}

function Cards({ albums, onPick }: { albums: PickerAlbum[]; onPick: (id: string) => void }) {
    if (albums.length === 0) return <div className="col-span-full text-center text-gray-500 py-10">{t('ui.picker.noneOfTheTypes')}</div>
    return <>{albums.map(album => <PickerCard key={album.id} album={album} onPick={onPick} />)}</>
}
