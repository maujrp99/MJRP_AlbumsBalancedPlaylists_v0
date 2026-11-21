/**
 * Visual recheck batch (2026-11-21): the albums screen through the F76 harness seam, extended.
 * Copy of reports/evidence/F76/harness/albums-harness.js, with: the real filterSeries / countAlbums /
 * deriveSeriesState in the stand-in controller (so groups are { series, queries, keys } and the
 * count and the per-series state come from the real models), a per-series state mix, album notices,
 * the real Footer. Nothing here is part of the app.
 *
 * Query: state=ready|loading  view=list  scope=single&seriesId=s5  states=mix  notices=1  paging=scroll
 */
import '../../../../../../public/js/services/platform/platformWiring.js'
import '../../../../../../public/css/index.css'
import '../../../../../../public/css/tailwind.css'
import '../../../../../../public/css/modals.css'
import '../../../../../../public/css/mobile.css'
import '../../../../../../public/css/mobile/screens.css'
import '../../../../../../public/css/safe-area.css'
import SeriesView from '../../../../../../public/js/views/SeriesView.js'
import { albumsStore } from '../../../../../../public/js/stores/albums.js'
import { albumSeriesStore } from '../../../../../../public/js/stores/albumSeries.js'
import { ALL_SERIES_CONTEXT } from '../../../../../../public/js/services/albums/albumLoading.js'
import { paginate, takeFirst, PagingMode } from '../../../../../../public/js/models/paging.js'
import { startPhoneShell } from '../../../../../../public/js/components/navigation/PhoneShell.js'
import { Footer } from '../../../../../../public/js/components/Footer.js'
import { Album } from '../../../../../../public/js/models/Album.js'
import { filterSeries } from '../../../../../../public/js/models/seriesFilter.js'
import { countAlbums } from '../../../../../../public/js/models/seriesCounts.js'
import { deriveSeriesState, AlbumStatus, FailureReason, EnrichmentStatus, createEntry } from '../../../../../../public/js/models/albumLoadState.js'
import { Reason } from '../../../../../../public/js/models/askedAlbum.js'

const params = new URLSearchParams(location.search)
const STATE = params.get('state') || 'ready'
const MIX = params.get('states') === 'mix'
const NOTICES = !!params.get('notices')

// ── Fixture: 50 series, ~230 albums, long names (as F76) ─────────────────────────────────────
const SERIES_NAMES = [
    'Alternative R&B/Psychedelic/Avant-garde Soul of the Seventies', 'Prog Rock Essentials', 'King Crimson', 'Brazilian Tropicália and MPB',
    'Pink Floyd', 'Jazz Fusion', 'The Beatles: the whole catalogue', 'Krautrock', 'Post-punk and New Wave 1978-1984', 'Radiohead',
    'Singer-songwriters', 'Soul Classics', 'Genesis', 'Yes', 'Shoegaze', 'Hip-Hop Golden Age', 'Bossa Nova', 'Ambient', 'David Bowie',
    'Funk', 'Folk Revival', 'Electronic Pioneers', 'Metal', 'Blues', 'Rush', 'Talking Heads', 'Joni Mitchell', 'Steely Dan',
    'Canterbury Scene', 'Afrobeat', 'Dream Pop', 'Grunge', 'Britpop', 'Trip-Hop', 'Neo-Soul', 'Math Rock', 'Chamber Pop',
    'Clube da Esquina', 'Motown', 'Stax', 'Laurel Canyon', 'Brian Eno', 'Can', 'Kate Bush', 'Prince', 'Stevie Wonder',
    'Miles Davis', 'John Coltrane', 'Caetano Veloso', 'Milton Nascimento'
]
const TITLES = [
    'In the Court of the Crimson King (An Observation by King Crimson)', 'Larks\' Tongues in Aspic', 'Red', 'Discipline',
    'The Dark Side of the Moon', 'Wish You Were Here', 'Animals', 'Selling England by the Pound', 'Close to the Edge',
    'Clube da Esquina', 'OK Computer', 'Kid A', 'Remain in Light', 'Hounds of Love', 'Aja', 'Blue', 'Songs in the Key of Life',
    'Purple Rain', 'Low', 'Station to Station', 'Kind of Blue', 'A Love Supreme', 'Tago Mago', 'Moving Pictures',
    'Another Green World', 'Loveless', 'Mezzanine', 'Voodoo', 'Spiderland', 'What\'s Going On'
]
const ARTISTS = ['King Crimson', 'Pink Floyd', 'Genesis', 'Yes', 'Milton Nascimento & Lô Borges', 'Radiohead', 'Talking Heads', 'Kate Bush', 'Steely Dan', 'Joni Mitchell', 'Stevie Wonder', 'Prince and The Revolution', 'David Bowie', 'Miles Davis', 'John Coltrane', 'Can', 'Rush', 'Brian Eno', 'My Bloody Valentine', 'Massive Attack']

const cover = (seed) => {
    const hue = (seed * 47) % 360
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},60%,18%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="${30 + (seed % 40)}" cy="${35 + (seed % 30)}" r="${12 + (seed % 14)}" fill="rgba(255,255,255,.18)"/></svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// which series gets which treatment (ids are s1..s50, in the order above)
const EMPTY_IDS = MIX ? new Set(['s4']) : new Set()                    // asks for no album
const ALL_FAILED_IDS = MIX ? new Set(['s6']) : new Set()               // every album failed
const SOME_FAILED = MIX ? { s5: [1] } : (NOTICES ? { s3: [2] } : {})   // series id -> indexes of albums that failed (not found)
const LOADING_IDS = MIX ? new Set(['s1', 's8']) : new Set()            // s1 nothing yet, s8 partly
const IDENTITY = NOTICES ? [Reason.TITLE_BEFORE_SUBTITLE, Reason.TITLE_WITHOUT_PARENTHESES, Reason.TITLE_WRITTEN_OTHERWISE] : []

const series = SERIES_NAMES.map((name, index) => ({ id: `s${index + 1}`, name, albumQueries: [], createdAt: index }))
const entriesBySeries = {}
const albumsBySeries = {}
let n = 0
series.forEach((item, index) => {
    const count = EMPTY_IDS.has(item.id) ? 0 : [3, 15, 6, 4, 8, 5, 13, 4, 6, 7][index % 10]
    const entries = []
    const albums = []
    for (let i = 0; i < count; i++) {
        n += 1
        const title = TITLES[n % TITLES.length]
        const artist = ARTISTS[n % ARTISTS.length]
        const year = 1965 + (n % 40)
        const reason = item.id === 's1' ? IDENTITY[i] : null
        // an album accepted by a second-tier rule was ASKED by a shorter name
        const asked = reason ? { artist, title: title.split(' (')[0].split(':')[0], year } : { artist, title, year }
        const album = Object.assign(new Album({
            id: `a${n}`, title: reason ? `${asked.title}: the Complete Sessions` : title, artist, year, coverUrl: cover(n),
            bestEverAlbumId: n % 2 ? String(n) : null, spotifyId: n % 4 ? `sp${n}` : null,
            metadata: reason ? { identityReason: reason } : {}
        }), { seriesIds: [item.id], hasUserRanking: n % 3 === 0 })
        item.albumQueries.push(asked)
        const entry = createEntry(item.id, asked)
        entry.album = album
        entry.status = AlbumStatus.FOUND
        entry.enrichment = { acclaim: EnrichmentStatus.DONE, popularity: EnrichmentStatus.DONE, userRanking: EnrichmentStatus.DONE }
        if (STATE === 'loading' || (LOADING_IDS.has(item.id) && (item.id === 's1' || i >= 3))) { entry.status = AlbumStatus.PENDING; entry.album = null }
        else if (ALL_FAILED_IDS.has(item.id) || (SOME_FAILED[item.id] || []).includes(i)) {
            entry.status = AlbumStatus.FAILED; entry.album = null
            entry.error = { reason: FailureReason.NOT_FOUND }
        }
        entries.push(entry)
        if (entry.album) albums.push(entry.album)
    }
    entriesBySeries[item.id] = entries
    albumsBySeries[item.id] = albums
})

albumSeriesStore.setSeries(series)
albumsStore.setAlbumsBySeries({ [ALL_SERIES_CONTEXT]: Object.values(albumsBySeries).flat(), ...albumsBySeries })

const albumsOfEntries = (group) => (entriesBySeries[group.series.id] || [])
    .filter(entry => entry.status === AlbumStatus.FOUND && entry.album && group.keys.has(entry.key))
    .map(entry => entry.album)

// ── A stand-in for SeriesController: the same calls; getPageView as the real one (filterSeries, ───
// paginate/takeFirst, countAlbums); a redraw per tick (renderFromStore), no debounce, as the real one
const controller = {
    state: {
        currentScope: 'ALL', targetSeriesId: null,
        viewMode: params.get('view') === 'list' ? 'expanded' : 'compact',
        filters: { artist: '', year: '', source: '' },
        searchQuery: '', seriesSortMode: 'alpha',
        pagingMode: params.get('paging') === 'scroll' ? PagingMode.SCROLL : PagingMode.PAGES, pageSize: 10, page: 1, shownCount: 10
    },
    view: null, _scheduled: false, drawCount: 0,
    setView(view) { this.view = view },
    detachView() { this.view = null },
    async init() { },
    getState() { return { ...this.state, filters: { ...this.state.filters } } },
    getPageView() {
        const isAll = this.state.currentScope === 'ALL'
        const matching = filterSeries(series, {
            seriesId: isAll ? null : this.state.targetSeriesId,
            artist: this.state.filters.artist, year: this.state.filters.year, source: this.state.filters.source,
            search: this.state.searchQuery
        })
        const cut = this.state.pagingMode === PagingMode.SCROLL
            ? { ...takeFirst(matching, this.state.shownCount), page: 1, pages: 1 }
            : { ...paginate(matching, { page: this.state.page, size: this.state.pageSize }), hasMore: false }
        this.state.page = cut.page
        return {
            groups: cut.items,
            paging: {
                mode: this.state.pagingMode, size: this.state.pageSize, page: cut.page, pages: cut.pages,
                total: cut.total, from: cut.from, to: cut.to, hasMore: cut.hasMore,
                totalSeries: series.length, albums: countAlbums(cut.items), single: !isAll, unchecked: 0
            }
        }
    },
    getVisibleSeriesList() { return this.getPageView().groups.map(group => group.series) },
    getSeriesStates() { return Object.fromEntries(series.map(item => [item.id, deriveSeriesState(entriesBySeries[item.id])])) },
    getHeaderData() {
        const active = albumSeriesStore.getActiveSeries()
        return { title: active?.name || 'All Albums Series', description: '', seriesList: this.getVisibleSeriesList(), activeSeriesId: active?.id || null }
    },
    draw() {
        if (!this.view) return
        this.drawCount += 1
        const { groups } = this.getPageView()
        this.view.updateHeader(this.getHeaderData())
        this.view.updateAlbums(groups.flatMap(albumsOfEntries), STATE === 'loading')
    },
    /** One redraw per tick, however many things changed in it (as SeriesController.renderFromStore) */
    renderFromStore() {
        if (this._scheduled) return
        this._scheduled = true
        queueMicrotask(() => { this._scheduled = false; this.draw() })
    },
    resetPaging() { this.state.page = 1; this.state.shownCount = this.state.pageSize },
    async loadScope(scope, seriesId) {
        this.state.currentScope = scope
        this.state.targetSeriesId = seriesId
        this.state.filters = { artist: '', year: '', source: '' }
        this.state.searchQuery = ''
        this.resetPaging()
        albumSeriesStore.setActiveSeries(scope === 'ALL' ? null : seriesId)
        albumsStore.setActiveAlbumSeriesId(scope === 'ALL' ? ALL_SERIES_CONTEXT : seriesId)
        this.draw()
    },
    refresh() { this.draw() },
    handleSearch(query) { this.state.searchQuery = query; this.resetPaging(); this.renderFromStore() },
    handleFilterChange(type, value) { this.state.filters = { ...this.state.filters, [type]: value }; this.resetPaging(); this.renderFromStore() },
    handleSort(key) { this.state.seriesSortMode = key; this.resetPaging(); this.renderFromStore() },
    handleViewModeChange(mode) { this.state.viewMode = mode; this.draw() },
    handlePage(page) { this.state.page = page; this.renderFromStore() },
    handlePageSize(size) { this.state.pageSize = size; this.resetPaging(); this.renderFromStore() },
    handlePagingMode(mode) { this.state.pagingMode = mode; this.resetPaging(); this.renderFromStore() },
    handleShowMore() { this.state.shownCount += this.state.pageSize; this.renderFromStore() },
    handleRefetchMetadata() { },
    retrySeries() { },
    saveRanking: async () => true
}
window.harnessController = controller

const single = params.get('scope') === 'single'
const singleId = params.get('seriesId') || 's5'
history.replaceState(null, '', `/albums${single ? `?seriesId=${singleId}` : ''}`)
startPhoneShell({ router: { afterNavigate() { } }, userStore: { getState: () => ({ currentUser: null }), subscribe() { } }, clearCaches: async () => { } })

const view = new SeriesView(controller)
const app = document.getElementById('app')
app.replaceChildren(await view.render({}))
await view.mount(single ? { seriesId: singleId } : {})

// the real footer, as app.js mounts it
const footer = new Footer({ clearCaches: async () => { }, reload: () => { } })
document.getElementById('footer-container').innerHTML = footer.render()
footer.attachListeners()
document.body.dataset.harnessReady = 'true'
