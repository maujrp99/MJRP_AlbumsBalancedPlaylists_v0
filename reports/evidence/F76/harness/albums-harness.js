/**
 * F76 TASK-02 harness: mounts the real SeriesView, with its real components, CSS and the phone's
 * shell, over fixture data and a small stand-in for the controller (paging by the real model).
 * Nothing here is part of the app.
 */
import '../../../../public/css/index.css'
import '../../../../public/css/tailwind.css'
import '../../../../public/css/modals.css'
import '../../../../public/css/mobile.css'
import '../../../../public/css/mobile/screens.css'
import '../../../../public/css/safe-area.css'
import SeriesView from '../../../../public/js/views/SeriesView.js'
import { albumsStore } from '../../../../public/js/stores/albums.js'
import { albumSeriesStore } from '../../../../public/js/stores/albumSeries.js'
import { ALL_SERIES_CONTEXT } from '../../../../public/js/services/albums/albumLoading.js'
import { paginate, takeFirst, PagingMode } from '../../../../public/js/models/paging.js'
import { startPhoneShell } from '../../../../public/js/components/navigation/PhoneShell.js'

const params = new URLSearchParams(location.search)
const STATE = params.get('state') || 'ready'

// ── Fixture: 50 series, ~230 albums, long names ──────────────────────────────────────────────
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

const series = SERIES_NAMES.map((name, index) => ({ id: `s${index + 1}`, name, albumQueries: [], createdAt: index }))
const albumsBySeries = {}
let n = 0
series.forEach((item, index) => {
    const count = [3, 15, 6, 4, 8, 5, 13, 4, 6, 7][index % 10]
    albumsBySeries[item.id] = Array.from({ length: count }, () => {
        n += 1
        return {
            id: `a${n}`, title: TITLES[n % TITLES.length], artist: ARTISTS[n % ARTISTS.length], year: 1965 + (n % 40),
            coverUrl: cover(n), seriesIds: [item.id], hasUserRanking: n % 3 === 0, bestEverAlbumId: n % 2 ? String(n) : null,
            spotifyId: n % 4 ? `sp${n}` : null, tracks: [], getTracks: () => []
        }
    })
    item.albumQueries = albumsBySeries[item.id].map(album => ({ title: album.title, artist: album.artist }))
})
const everyAlbum = Object.values(albumsBySeries).flat()

if (STATE !== 'empty') albumSeriesStore.setSeries(series)
albumsStore.setAlbumsBySeries({ [ALL_SERIES_CONTEXT]: STATE === 'ready' ? everyAlbum : [], ...(STATE === 'ready' ? albumsBySeries : {}) })

// ── A stand-in for SeriesController: the same calls, the real paging model ─────────────────
const controller = {
    state: {
        currentScope: 'ALL', targetSeriesId: null,
        viewMode: params.get('view') === 'list' ? 'expanded' : 'compact',
        filters: params.get('filters') ? { artist: 'King Crimson', year: '1970s', source: '' } : { artist: '', year: '', source: '' },
        searchQuery: '', seriesSortMode: 'alpha',
        pagingMode: params.get('paging') === 'scroll' ? PagingMode.SCROLL : PagingMode.PAGES, pageSize: 10, page: 1, shownCount: 10
    },
    view: null,
    setView(view) { this.view = view },
    detachView() { this.view = null },
    async init() { },
    getState() { return { ...this.state } },
    matching() {
        const { currentScope, targetSeriesId } = this.state
        const list = currentScope === 'ALL' ? series : series.filter(item => item.id === targetSeriesId)
        return STATE === 'empty' ? [] : list
    },
    getPageView() {
        const matching = this.matching()
        const cut = this.state.pagingMode === PagingMode.SCROLL
            ? { ...takeFirst(matching, this.state.shownCount), page: 1, pages: 1 }
            : { ...paginate(matching, { page: this.state.page, size: this.state.pageSize }), hasMore: false }
        return {
            groups: cut.items.map(item => ({ series: item })),
            paging: {
                mode: this.state.pagingMode, size: this.state.pageSize, page: cut.page, pages: cut.pages, total: cut.total,
                from: cut.from, to: cut.to, hasMore: cut.hasMore, totalSeries: STATE === 'empty' ? 0 : series.length,
                albums: cut.items.reduce((sum, item) => sum + item.albumQueries.length, 0), single: this.state.currentScope !== 'ALL', unchecked: 0
            }
        }
    },
    getVisibleSeriesList() { return this.getPageView().groups.map(group => group.series) },
    getSeriesStates() { return null },
    getHeaderData() {
        const active = albumSeriesStore.getActiveSeries()
        return { title: active?.name || 'All Albums Series', description: '', seriesList: this.getVisibleSeriesList(), activeSeriesId: active?.id || null }
    },
    draw() {
        if (!this.view) return
        // As the load does: the albums of the series on screen (this page, or what the scroll loaded)
        const scoped = this.getVisibleSeriesList().flatMap(item => albumsBySeries[item.id] || [])
        this.view.updateHeader(this.getHeaderData())
        this.view.updateAlbums(STATE === 'ready' ? scoped : [], STATE === 'loading')
    },
    async loadScope(scope, seriesId) {
        this.state.currentScope = scope
        this.state.targetSeriesId = seriesId
        this.state.page = 1
        albumSeriesStore.setActiveSeries(scope === 'ALL' ? null : seriesId)
        albumsStore.setActiveAlbumSeriesId(scope === 'ALL' ? ALL_SERIES_CONTEXT : seriesId)
        this.draw()
    },
    refresh() { this.draw() },
    handleSearch(query) { this.state.searchQuery = query; this.draw() },
    handleFilterChange(type, value) { this.state.filters = { ...this.state.filters, [type]: value }; this.draw() },
    handleSort(key) { this.state.seriesSortMode = key; this.draw() },
    handleViewModeChange(mode) { this.state.viewMode = mode; this.draw() },
    handlePage(page) { this.state.page = page; this.draw() },
    handlePageSize(size) { this.state.pageSize = size; this.state.page = 1; this.draw() },
    handlePagingMode(mode) { this.state.pagingMode = mode; this.draw() },
    handleShowMore() { this.state.shownCount += this.state.pageSize; this.draw() },
    handleRefetchMetadata() { },
    retrySeries() { },
    saveRanking: async () => true
}

// The address the app would have: the top bar and the tab bar read it
const single = params.get('scope') === 'single'
history.replaceState(null, '', `/albums${single ? '?seriesId=s1' : ''}`)
startPhoneShell({ router: { afterNavigate() { } }, userStore: { getState: () => ({ currentUser: null }), subscribe() { } }, clearCaches: async () => { } })

const view = new SeriesView(controller)
const app = document.getElementById('app')
app.replaceChildren(await view.render({}))
await view.mount(single ? { seriesId: 's1' } : {})
document.body.dataset.harnessReady = 'true'
