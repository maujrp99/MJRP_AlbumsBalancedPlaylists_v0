/**
 * Results - what the search of the catalog shows on the Start screen (F67 states, F79 words; the old views/HomeView.js `renderResults`,
 * `drawResults`, `drawFilters`, `drawArtistLine`, `markCards`, `drawAfter` and the «stage» card of views/renderers/DiscographyRenderer.js,
 * the same elements and classes): the three steps (first visit), the wait, the artist with the type chips and «Add all», the grid of covers
 * (numbered when chosen), «not found», «no answer». One place, drawn from the state of the scan.
 *
 * The old grid was made again at each step of the scan and at each filter, and the chosen covers were only marked: here the grid is keyed on
 * the number of times the controller drew it (so a cover that had the focus loses it at the same moments), and the cards on their album.
 */
import { Icon } from '../../ui/Icon'
import { CoverImage } from '../../ui/CoverImage'
import { t, tPlural } from '../../i18n/t.js'
import { ScanStatus } from '../../models/scanState.js'
import { PICKER_FILTERS, countByFilter, visibleAlbums } from '../../models/albumPicker.js'
import { addAllLabel, typesLine, type SeriesAlbum } from './homeSeries'
import { badgeWords, failureTitle, gestureWord, yearOf } from './text'
import type { StartController } from './StartController'

/** The ids of the type chips, by the key of the filter (models/albumPicker.js). */
const FILTER_BUTTON_IDS: Record<string, string> = {
    albums: 'btnFilterAlbums', eps: 'btnFilterEPs', singles: 'btnFilterSingles',
    live: 'btnFilterLive', compilations: 'btnFilterCompilations', uncategorized: 'btnFilterUncategorized'
}
const SKELETONS = { phone: 4, computer: 12 }
const COVER_SIZE = '300'

interface CardProps {
    album: SeriesAlbum
    place: number
    phone: boolean
    onPick: (id: string) => void
}

/** The card of an album: a button, so the keyboard and the screen reader reach it as one. Chosen: the ring and its place in the series. */
function ResultCard({ album, place, phone, onPick }: CardProps) {
    const year = yearOf(album)
    const badges = badgeWords(album)
    const cover = album.coverUrl ? album.coverUrl.replace('{w}', COVER_SIZE).replace('{h}', COVER_SIZE) : null
    const gesture = gestureWord(phone)
    const label = place > 0
        ? t('start.card.in', { title: album.title ?? '', year, number: place, gesture })
        : t('start.card.add', { title: album.title ?? '', year, gesture })
    return (
        <button type="button" className={`home-card${place > 0 ? ' is-in' : ''}`} data-action="pick-album" data-id={album.id} aria-pressed={place > 0} aria-label={label} onClick={() => onPick(album.id)}>
            <span className="home-card__cover">
                <CoverImage src={cover} alt="" className="home-card__img" loading="lazy" />
                <span className="home-card__mark" data-n={String(place)}>{place ? String(place) : <Icon name="Plus" className="home-card__plus" />}</span>
            </span>
            <span className="home-card__title">{album.title}</span>
            <span className="home-card__year">{badges.length ? `${year} · ${badges.join(', ')}` : year}</span>
        </button>
    )
}

function Step({ n, step }: { n: number; step: 'find' | 'add' | 'create' }) {
    return (
        <li>
            <strong className="home-how__n">{String(n)}</strong>
            <span><strong>{t(`start.how.${step}.verb`)}</strong>{` ${t(`start.how.${step}.rest`)}`}</span>
        </li>
    )
}

function Message({ controller, kind }: { controller: StartController; kind: 'empty' | 'failed' }) {
    const scan = controller.scan!
    if (kind === 'empty') {
        return (
            <>
                <strong>{t('start.empty.title', { query: scan.query })}</strong>
                <span>{t('start.empty.hint')}</span>
                <button type="button" className="home-btn" data-home-mode="paste" onClick={() => controller.setMode('paste')}>{t('start.empty.paste')}</button>
            </>
        )
    }
    const chosen = controller.chosenAtScan
    return (
        <>
            <strong>{failureTitle(scan)}</strong>
            <span>{chosen > 0 ? tPlural('start.failed.keeps', chosen, { count: chosen }) : t('start.failed.keeps.none')}</span>
            <button type="button" id="btnScanRetry" className="home-btn" onClick={() => { void controller.picker.retry() }}>{t('start.failed.retry')}</button>
        </>
    )
}

/** What the results draw from the state of the scan and of the series: computed in one place. */
function readResults(controller: StartController) {
    const scan = controller.scan!
    const paste = controller.state.mode === 'paste'
    const status = paste ? 'paste' : scan.status
    const filters = controller.picker.filters as Record<string, boolean>
    const albums = controller.albums()
    const created = controller.isCreated()
    const results = scan.status === ScanStatus.RESULTS
    const visible = results ? (visibleAlbums(scan.albums, filters) as SeriesAlbum[]) : []
    return {
        scan, status, filters, created, visible,
        counts: countByFilter(scan.albums) as Record<string, number>,
        places: new Map(albums.map((album, index) => [String(album.id), index + 1])),
        addAll: results && !created ? addAllLabel(visible, albums.map(album => album.id), filters) : '',
        line: results ? typesLine(filters, visible.length, scan.classifying) : ''
    }
}

type ResultsRead = ReturnType<typeof readResults>

function Chips({ controller, read }: { controller: StartController; read: ResultsRead }) {
    return (
        <div id="home-toolbar" className="home-chips" role="group" aria-label={t('start.artist.types')}>
            {PICKER_FILTERS.map((filter: { key: string }) => {
                const on = Boolean(read.filters[filter.key])
                const id = FILTER_BUTTON_IDS[filter.key]
                const count = read.counts[filter.key]
                return (
                    <button key={filter.key} type="button" id={id} className={`home-chip${on ? ' is-on' : ''}`} aria-pressed={on} data-filter={filter.key} onClick={() => controller.picker.toggleFilter(filter.key)}>
                        <span className="filter-btn-text">{t(`start.filter.${filter.key}`)}</span>
                        <span className="filter-btn-count" id={`${id}Count`}>{count > 0 ? ` · ${count}` : ''}</span>
                    </button>
                )
            })}
        </div>
    )
}

/** The grid: skeleton covers while the catalog is asked, the covers when it answered; nothing in any other state (the grid is hidden). */
function GridContent({ controller, read, phone }: { controller: StartController; read: ResultsRead; phone: boolean }) {
    if (read.status === ScanStatus.SCANNING) {
        return <>{Array.from({ length: phone ? SKELETONS.phone : SKELETONS.computer }, (_, i) => <span key={i} className="home-skel" aria-hidden="true" />)}</>
    }
    if (read.status !== ScanStatus.RESULTS) return null
    if (read.visible.length === 0) return <div className="col-span-full text-center text-gray-500 py-10">{t('start.grid.none')}</div>
    return (
        <>
            {read.visible.map(album => (
                <ResultCard key={album.id} album={album} place={read.created ? 0 : read.places.get(String(album.id)) || 0} phone={phone} onPick={(id) => controller.clickCard(id)} />
            ))}
        </>
    )
}

const messageKindOf = (status: string): 'empty' | 'failed' | null => (status === ScanStatus.EMPTY ? 'empty' : status === ScanStatus.FAILED ? 'failed' : null)

/** The box of the message keeps the role and the tone of the last message it wrote until it writes another. */
const roleOf = (last: StartController['lastMessage']): 'alert' | 'status' | undefined => (last === 'failed' ? 'alert' : last ? 'status' : undefined)

/** «Saved and won't change here», above the covers after the series was created. */
function afterText(controller: StartController, phone: boolean): string {
    const created = controller.state.created
    return controller.isCreated() && created ? t(phone ? 'start.after.saved.tap' : 'start.after.saved.click', { name: created.name }) : ''
}

export function Results({ controller, phone }: { controller: StartController; phone: boolean }) {
    if (!controller.scan) return null
    const read = readResults(controller)
    const { scan, status, created } = read
    const messageKind = messageKindOf(status)
    const last = controller.lastMessage

    return (
        <section id="homeResults" className="home-results">
            <p id="homeAfter" className="home-after" role="status" hidden={!created}>
                {afterText(controller, phone)}
            </p>
            <ol id="homeHow" className="home-how" hidden={status !== ScanStatus.IDLE}>
                <Step n={1} step="find" /><Step n={2} step="add" /><Step n={3} step="create" />
            </ol>
            <p id="homeWait" className="home-wait" role="status" hidden={status !== ScanStatus.SCANNING}>
                {status === ScanStatus.SCANNING ? t('start.wait', { query: scan.query }) : ''}
            </p>
            <div id="homeMessage" className={`home-msg${last === 'failed' ? ' is-error' : ''}`} role={roleOf(last)} hidden={!messageKind}>
                {messageKind ? <Message controller={controller} kind={messageKind} /> : null}
            </div>
            <header id="homeArtist" className="home-artist" hidden={status !== ScanStatus.RESULTS}>
                <div className="home-artist__t">
                    <h2 id="homeArtistName">{scan.artist || scan.query}</h2>
                    <span id="statusArtistName" role="status" aria-live="polite">{read.line}</span>
                </div>
                <Chips controller={controller} read={read} />
                <button type="button" id="btnAddAll" className="home-btn is-ghost home-addall" hidden={!read.addAll} onClick={() => controller.addAll()}>
                    {read.addAll ? <><Icon name="Plus" className="home-ico" />{` ${read.addAll}`}</> : null}
                </button>
            </header>
            <div id="discographyGrid" className="home-grid" hidden={status !== ScanStatus.RESULTS && status !== ScanStatus.SCANNING} key={controller.gridDraws}>
                <GridContent controller={controller} read={read} phone={phone} />
            </div>
        </section>
    )
}
