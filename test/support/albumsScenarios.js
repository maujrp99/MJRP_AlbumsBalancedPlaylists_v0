/**
 * The states of the albums screen (/albums and /albums/:seriesId) that F83 wave 5a checks, written once so the screen as it was
 * (hand-made: SeriesView and its pieces) and the screen as it is (React) are asked the same thing: the same series, the same load
 * answers, the same clicks, keys and selections, and what stands in `#app` (and in the sheet the phone opens over the page) after each
 * step, together with where the focus is. `normalize` is the one of wave 2.
 *
 * The load service (`loadService`) is a stand-in the scenario controls through `world`: what each series answers (found, pending,
 * failed, some failed), and `h.arrive` lets a series answer. The windows that stay hand-made (the album, the inventory, the ranking, the
 * edit and delete of a series) and the dialogs are stand-ins that write down what the screen asked of them in `outside`, with what it
 * gave (for the album window: what the album reads of its ratings and popularity). Apple Music is the catalog of the albums: the
 * entries in the load store are what its answer would have made (found, failed with a reason, pending), and the popularity and ratings
 * sources of an entry (`done`, `empty`, `failed`, `not-connected`) are read by the album window through what the screen gives it.
 *
 * Used by: reports/evidence/F83/wave-5a/capture-before.test.js (run once, on the hand-made screen, before it was deleted; it wrote
 * test/fixtures/albumsBeforeF83.json) and test/screens/albums/Albums.sameAsBefore.test.tsx (the React screen, against that file).
 */
import { vi } from 'vitest'
import { normalize as pageOf } from './savedPlaylistsScenarios.js'
import { router } from '../../public/js/router.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumLoadStore } from '../../public/js/stores/albumLoad.js'
import { albumsStore } from '../../public/js/stores/albums.js'
import { ownRankingsStore } from '../../public/js/stores/ownRankings.js'
import { releasePageScroll } from '../../public/js/utils/pageScrollLock.js'
import { createEntry, AlbumStatus, EnrichmentStatus, FailureReason } from '../../public/js/models/albumLoadState.js'

export const outside = []

/** `#app` as the proof compares it: the text of a field as the field holds it now, read from a copy. */
export const normalize = (element) => {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    // what a list shows is the option it has chosen (the value) and the text of each option without the white space around it, which a
    // browser does not draw: the `selected` attribute is not compared (React chooses by the property, the old screen by the attribute)
    const chosen = element.querySelectorAll('select')
    copy.querySelectorAll('select').forEach((select, i) => { select.setAttribute('data-value', chosen[i].value) })
    // the box a hand-made piece is drawn in by React takes no room and is no part of what the page says (the old page had the piece directly)
    copy.querySelectorAll('[data-legacy-host]').forEach(host => host.replaceWith(...host.childNodes))
    copy.querySelectorAll('option').forEach(option => { option.removeAttribute('selected'); option.textContent = option.textContent.trim() })
    return pageOf(copy)
}

/** Where the focus is, as words: the tag, the id, and what tells a control from another. */
export const focusOf = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'the page'
    const mark = active.id ? `#${active.id}` : `.${[...active.classList].join('.')}`
    const which = active.dataset?.id ? `[id=${active.dataset.id}]` : active.dataset?.pagerPage ? `[page=${active.dataset.pagerPage}]` : ''
    return `${active.tagName.toLowerCase()}${mark}${which}`
}

/** The window of the phone as the screen reads it, and a way to turn it into a computer and back. */
export function asPhone(phone) {
    const listeners = []
    const media = {
        matches: phone,
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }
    window.scrollTo = vi.fn((...args) => { outside.push(['scrollTo', JSON.stringify(args[0])]) })
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn(() => media)
    return { turn: (to) => { media.matches = to; [...listeners].forEach(listener => listener({ matches: to })) } }
}

export const quiet = () => {
    vi.spyOn(router, 'navigate').mockImplementation((path) => { outside.push(['navigate', path]) })
    vi.spyOn(router, 'setAddress').mockImplementation((path, options) => { outside.push(['address', path, Boolean(options?.replace)]); history.replaceState({}, '', path) }) // the real one writes the address too
}

/** A promise a scenario lets go of when it says so. */
export const held = () => {
    let release
    let refuse
    const promise = new Promise((resolve, reject) => { release = resolve; refuse = reject })
    return { promise, release, refuse }
}

// ---------------------------------------------------------------------------------------------- the world

const WORDS = ['Speak to Me', 'Breathe', 'Time', 'Money', 'Us and Them', 'Eclipse']
const tracksOf = (kind) => (kind === 'acclaim'
    ? WORDS.map((title, i) => ({ title, rank: i + 1, rating: 90 - i * 3, spotifyPopularity: 70 - i * 5 }))
    : WORDS.map((title, i) => ({ title, position: i + 1, duration: 200 + i * 31, userRank: i === 0 ? 2 : undefined })))

/** A loaded album. `extra` changes what the card shows: badges, a note about identity, no cover, no tracks. */
export const albumOf = (seriesId, n, artist, title, extra = {}) => {
    const id = `${seriesId}-a${n}`
    const { tracks = true, cover = true, ...rest } = extra
    return {
        id, title, artist, year: String(1970 + n), seriesIds: [seriesId],
        artworkTemplate: cover ? `https://img/${id}/{w}x{h}.jpg` : undefined,
        getTracks: (kind) => (tracks ? tracksOf(kind) : []),
        ...rest
    }
}

const FLOYD = [['The Wall', {}], ['Animals', { hasUserRanking: true }], ['Meddle', { bestEverAlbumId: '77' }], ['Obscured by Clouds', { spotifyId: 'sp1', spotifyUrl: 'https://open.spotify.com/album/sp1', hasUserRanking: true, bestEverAlbumId: '78' }]]
const ZEPPELIN = [['Houses of the Holy', { cover: false }], ['Physical Graffiti', { tracks: false }], ['Presence', { metadata: { identityReason: 'title-before-subtitle' } }]]
const PURPLE = [['Machine Head', {}], ['In Rock', {}]]

/** The queries of a series; what it asks of the catalog. */
const queriesOf = (artist, list) => list.map(([title]) => ({ artist, title }))

const DAY = (n) => new Date(2026, 0, n)
export const DEFAULT_SERIES = () => [
    { id: 's1', name: 'Floyd', createdAt: DAY(3), albumQueries: queriesOf('Pink Floyd', FLOYD) },
    { id: 's2', name: 'Zeppelin', createdAt: DAY(2), albumQueries: queriesOf('Led Zeppelin', ZEPPELIN) },
    { id: 's3', name: 'Purple &amp; Co', createdAt: DAY(1), albumQueries: queriesOf('Deep Purple', PURPLE) }
]
const SOURCES = { s1: FLOYD, s2: ZEPPELIN, s3: PURPLE }

/** Twelve series of one album each (a second page), and one series of fourteen albums («Load 2 more albums»). */
export const MANY_SERIES = () => Array.from({ length: 12 }, (_, i) => ({ id: `m${i + 1}`, name: `Series ${i + 1}`, createdAt: DAY(i + 1), albumQueries: [{ artist: `Artist ${i + 1}`, title: `Album ${i + 1}` }] }))
export const BIG_SERIES = () => [{ id: 'big', name: 'Big', createdAt: DAY(1), albumQueries: Array.from({ length: 14 }, (_, i) => ({ artist: 'Big Band', title: `Big Album ${i + 1}` })) }]

export const world = {
    series: DEFAULT_SERIES(),
    /** what each series answers: found (default), pending, failed (all), some-failed (the last one) */
    state: {},
    /** the albums of a query */
    make: (seriesId, query, index) => {
        const source = SOURCES[seriesId]
        const extra = source?.[index]?.[1] ?? {}
        return albumOf(seriesId, index + 1, query.artist, query.title, extra)
    },
    reset(series = DEFAULT_SERIES()) { this.series = series; this.state = {} }
}

const entryOf = (seriesId, query, index, state, last) => {
    const entry = createEntry(seriesId, query)
    const failed = state === 'failed' || (state === 'some-failed' && last)
    if (state === 'pending') return entry
    if (failed) return { ...entry, status: AlbumStatus.FAILED, error: { reason: FailureReason.NOT_FOUND, message: 'not found' } }
    return {
        ...entry, status: AlbumStatus.FOUND, album: world.make(seriesId, query, index),
        enrichment: { acclaim: EnrichmentStatus.DONE, popularity: state === 'popularity-failed' ? EnrichmentStatus.FAILED : EnrichmentStatus.EMPTY, userRanking: EnrichmentStatus.NOT_CONNECTED }
    }
}

/** What the load service would have put in the stores for the series it was asked to load (the album load itself is silenced). */
export function answer(ids) {
    const order = ids ?? world.series.map(series => series.id)
    albumLoadStore.setSeriesOrder(order)
    const bySeries = {}
    order.forEach(id => {
        const series = world.series.find(item => item.id === id)
        if (!series) return
        const state = world.state[id] ?? 'found'
        const queries = series.albumQueries
        albumLoadStore.setSeriesEntries(id, queries.map((query, index) => entryOf(id, query, index, state, index === queries.length - 1)))
        bySeries[id] = albumLoadStore.getAlbums(id)
    })
    albumsStore.setAlbumsBySeries({ ALL_SERIES_VIEW: Object.values(bySeries).flat(), ...bySeries })
}

export const loadService = {
    load: ({ scopeKey, series, fresh }) => { outside.push(['load', scopeKey, series.map(item => item.id).join(','), Boolean(fresh)]); answer(series.map(item => item.id)) },
    refreshSource: (id, source) => { outside.push(['refreshSource', id, source]) },
    retryFailed: (id) => { outside.push(['retryFailed', id]); world.state[id] = 'found'; answer() },
    reloadAlbum: (id) => { outside.push(['reloadAlbum', id]); return 1 },
    adoptAlbum: () => {}
}
export const loadModule = { albumLoadService: loadService, ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW', ALL_SCOPE: 'ALL', singleScope: (id) => `SINGLE:${id}` }

export const rankingModule = { ownRankingService: { ensureLoaded: async () => true, save: async (album, rankings) => { outside.push(['saveRanking', album.id, JSON.stringify(rankings)]); return true } } }

/** What the series service does when an album is removed: a scenario changes it. */
export const behaviour = { remove: async () => {} }
export const seriesServiceModule = {
    getSeriesService: () => ({
        removeAlbumFromSeries: (seriesId, album) => { outside.push(['removeAlbumFromSeries', seriesId, album.title ?? '', album.artist ?? '']); return behaviour.remove(seriesId, album) },
        loadFromFirestore: async () => {}
    })
}

/** The dialogs: what they answer is set by the scenario. */
export const dialogs = { confirm: true, prompt: null }
export const dialogModule = {
    dialogService: {
        confirm: async (options) => { outside.push(['confirm', options.title, options.message]); return dialogs.confirm },
        prompt: async (options) => { outside.push(['prompt', options.title, options.defaultValue]); return dialogs.prompt }
    }
}
const toasts = {
    info: (m) => outside.push(['toast', 'info', m]), success: (m) => outside.push(['toast', 'success', m]),
    error: (m) => outside.push(['toast', 'error', m]), warning: (m) => outside.push(['toast', 'warning', m])
}
export const toastModule = { default: toasts, toast: toasts }

export const albumWindowModule = {
    openAlbumWindow: (album, options) => {
        const read = options?.sources?.read?.()
        outside.push(['albumWindow', album.id, read ? JSON.stringify({ album: read.album?.id, ratings: read.ratings, popularity: read.popularity }) : 'no sources'])
    }
}
export const inventoryModule = { openAddWindow: (album) => { outside.push(['inventoryAdd', album.id]) } }
/** The windows to edit and delete a series and to rank the tracks (F83 wave 5b: React, screens/albums/useAlbumWindows) are a stand-in that writes down what the screen asked of them. */
export const windowsStandIn = {
    openEdit: (id) => { outside.push(['editSeries', id]) },
    openDelete: async (id) => { outside.push(['deleteSeries', id]) },
    openRank: (request) => { outside.push(['rankWindow', request.album.id]) },
    layer: null,
    /** what a test that needs the callbacks the screen gave can read */
    given: null
}
export const windowsModule = { useAlbumWindows: (handlers) => { windowsStandIn.given = handlers; return windowsStandIn } }

/** Puts the stores and the world as a scenario wants them, before the screen opens. */
export function prepare(scenario) {
    outside.length = 0
    releasePageScroll(window) // the hold a sheet puts on the page is counted by the module: one scenario does not inherit another's
    const store = new Map()
    vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => { store.set(k, String(v)) }, removeItem: (k) => { store.delete(k) } })
    if (scenario.storage) Object.entries(scenario.storage).forEach(([k, v]) => store.set(k, v))
    history.replaceState({}, '', scenario.address ?? '/albums')
    // what is watched for the page to come into view: written down, never fired (the screen asks for more only by a press)
    vi.stubGlobal('IntersectionObserver', class { observe(element) { outside.push(['watches', String(element.className).split(' ')[0]]) } unobserve() {} disconnect() {} })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 21, 12, 0, 0))
    world.reset(scenario.series ? scenario.series() : DEFAULT_SERIES())
    Object.assign(world.state, scenario.state ?? {})
    dialogs.confirm = true
    dialogs.prompt = null
    behaviour.remove = async () => {}
    albumSeriesStore.setSeries(world.series.map(series => ({ ...series })))
    albumSeriesStore.setActiveSeries(null)
    albumLoadStore.startGeneration(albumLoadStore.getGeneration() + 1)
    ownRankingsStore.setRecords('u1', [])
    albumsStore.reset?.()
}

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`

const grid = '#series-grid-mount'
const group = (id) => `${grid} .series-group[data-series-id="${id}"]`

/**
 * Each scenario: a name, whether it is the phone, the series and the answers it starts from (`series`, `state`), the address and what
 * the browser holds (`address`, `storage`), and what it does with the screen once mounted. `h.snap(label)` writes down `#app` (or the
 * first element that matches a selector); `h.note(label)` writes down what was asked of the world outside; `h.focus(label)` where the
 * focus is. `h.select` chooses in a list; `h.arrive(id, state)` lets a series answer.
 */
export const SCENARIOS = [
    { name: 'waiting for the first load', state: { s1: 'pending', s2: 'pending', s3: 'pending' }, run: async (h) => { h.snap('skeletons while every series waits'); h.note('what was asked') } },
    {
        name: 'series arriving one by one', state: { s1: 'pending', s2: 'pending', s3: 'pending' }, run: async (h) => {
            await h.arrive('s2')
            h.snap('one of three arrived')
            await h.arrive('s1')
            await h.arrive('s3')
            h.snap('all arrived')
        }
    },
    { name: 'all loaded, grid', run: async (h) => { h.snap('three series, nine albums'); h.focus('at the start') } },
    {
        name: 'all loaded, list', storage: { albumsViewMode: 'expanded' }, run: async (h) => {
            h.snap('the list view, with the tracks of each album')
            await h.click(`${group('s1')} .expanded-album-card[data-id="s1-a1"] [data-sort="title"]`)
            h.snap('the first album sorted by title', `${group('s1')} .expanded-album-card[data-id="s1-a1"]`)
            await h.click(`${group('s1')} .expanded-album-card[data-id="s1-a1"] [data-sort="title"]`)
            h.snap('the same column again: the other way', `${group('s1')} .expanded-album-card[data-id="s1-a1"]`)
            for (const column of ['position', 'userRank', 'rank', 'spotifyPopularity', 'duration']) {
                await h.click(`${group('s1')} .expanded-album-card[data-id="s1-a1"] [data-sort="${column}"]`)
                h.snap(`sorted by ${column}`, `${group('s1')} .expanded-album-card[data-id="s1-a1"] .tracks-table-root`)
            }
            h.focus('after the sorting')
        }
    },
    {
        name: 'switching between grid and list', run: async (h) => {
            await h.click('#viewModeList')
            h.snap('the list view')
            h.focus('after the list button')
            await h.click('#viewModeGrid')
            h.snap('the grid again')
        }
    },
    {
        name: 'one series only (the address)', address: '/albums/s2', params: { seriesId: 's2' }, run: async (h) => {
            h.snap('one series: its title, the filter, the grid')
            h.note('what was asked')
            await h.select('#filter-series', 'all')
            h.snap('back to all the series')
            h.note('after going back')
        }
    },
    {
        name: 'one series by the filter', run: async (h) => {
            await h.select('#filter-series', 's3')
            h.snap('the series chosen in the filter')
            h.focus('after the filter')
            h.note('what was asked')
        }
    },
    {
        name: 'searching', run: async (h) => {
            await h.type('#genericSearch', 'wall')
            h.snap('one album matches')
            h.focus('typing keeps the focus in the field')
            await h.type('#genericSearch', 'zzz')
            h.snap('no album matches')
            h.note('what was asked')
        }
    },
    {
        name: 'the filters', run: async (h) => {
            await h.select('#filter-artist', 'Led Zeppelin')
            h.snap('by artist')
            h.focus('after the artist')
            await h.select('#filter-artist', 'all')
            await h.select('#filter-year', '1970s')
            h.snap('by decade')
            await h.select('#filter-year', 'all')
            for (const source of ['user', 'pending', 'acclaim', 'popularity', 'ai']) {
                await h.select('#filter-source', source)
                h.snap(`by source ${source}`)
            }
            h.note('what was asked')
        }
    },
    {
        name: 'the order of the series', run: async (h) => {
            for (const order of ['count_asc', 'count_desc', 'alpha', 'alpha_desc', 'recent_asc', 'recent_desc']) {
                await h.select('#genericSort', order)
                h.snap(`order ${order}`, `${grid}`)
            }
            h.focus('after the order')
            h.snap('the bar, whole', '#series-toolbar-mount')
        }
    },
    {
        name: 'a second page of series', series: MANY_SERIES, run: async (h) => {
            h.snap('the first page, the pager above and below')
            await h.click('#series-pager-mount [data-pager-page="2"]')
            h.snap('the second page')
            h.focus('after the page')
            h.note('what was asked')
            await h.click('#series-pager-mount [data-pager-page="1"]')
            h.snap('back to the first')
        }
    },
    {
        name: 'the size of the page and scrolling', series: MANY_SERIES, run: async (h) => {
            await h.select('#series-pager-mount .series-pager-size', '20')
            h.snap('twenty series on a page')
            await h.select('#series-pager-mount .series-pager-size', '10')
            await h.click('#series-pager-mount [data-pager-mode="scroll"]')
            h.snap('the scroll form, with Load 2 more')
            await h.click('#series-pager-mount [data-pager-more]')
            h.snap('everything on screen')
            h.focus('after Load more')
            await h.click('#series-pager-mount [data-pager-mode="pages"]')
            h.snap('the pages again')
            h.note('what was asked')
        }
    },
    {
        name: 'a series with more than twelve albums', series: BIG_SERIES, run: async (h) => {
            h.snap('twelve of fourteen, Load 2 more albums', group('big'))
            await h.click(`${group('big')} [data-action="load-more-series"]`)
            h.snap('all fourteen', group('big'))
            h.focus('on the first album that arrived')
            h.note('what was asked')
        }
    },
    {
        name: 'a series where every album failed', state: { s2: 'failed' }, run: async (h) => {
            h.snap('the notice and Try again', group('s2'))
            await h.click(`${group('s2')} [data-action="retry-series"]`)
            h.snap('after Try again')
            h.note('what was asked')
        }
    },
    {
        name: 'a series where some albums failed', state: { s1: 'some-failed' }, run: async (h) => {
            h.snap('the notice above the albums', group('s1'))
            h.focus('at the start')
        }
    },
    {
        name: 'a series that asks for nothing found yet while the others are in', state: { s1: 'pending' }, run: async (h) => {
            h.snap('a skeleton for the series that waits, the others in')
        }
    },
    { name: 'popularity and ratings failed', state: { s1: 'popularity-failed' }, run: async (h) => { h.snap('the cards do not show the failure'); await h.click(`${group('s1')} .albums-grid [data-action="view-modal"]`); h.note('what the album window was given') } },
    {
        name: 'nothing in the library', series: () => [], run: async (h) => {
            h.snap('the empty state with Go and create!')
            await h.click('#emptyStateContainer button')
            h.note('what was asked')
        }
    },
    {
        name: 'the header buttons', run: async (h) => {
            await h.click('#generatePlaylistsBtn')
            h.note('blend with all')
            await h.click('a.breadcrumb-link')
            h.note('the crumb')
        }
    },
    {
        name: 'the header buttons of one series', address: '/albums/s1', params: { seriesId: 's1' }, run: async (h) => {
            await h.click('#generatePlaylistsBtn')
            h.note('blend with the series')
            h.snap('the title row', '.header-title-row')
        }
    },
    {
        name: 'the actions of a series and of an album', run: async (h) => {
            await h.click(`${group('s1')} [data-action="edit-series"]`)
            await h.click(`${group('s1')} [data-action="delete-series"]`)
            await h.click(`${group('s1')} [data-action="view-modal"][data-id="s1-a1"]`)
            await h.click(`${group('s1')} [data-action="rank-album"][data-id="s1-a2"]`)
            await h.click(`${group('s1')} [data-action="add-to-inventory"][data-id="s1-a3"]`)
            await h.click(`${group('s1')} [data-action="refetch-metadata"][data-id="s1-a4"]`)
            h.note('what was asked')
            h.focus('after the last button')
        }
    },
    {
        name: 'removing an album', run: async (h) => {
            await h.click(`${group('s1')} [data-action="remove-album"][data-id="s1-a1"]`)
            h.note('asked, removed')
            h.dialogs.confirm = false
            await h.click(`${group('s1')} [data-action="remove-album"][data-id="s1-a2"]`)
            h.note('asked, refused')
            h.dialogs.confirm = true
            h.behaviour.remove = async () => { throw new Error('boom') }
            await h.click(`${group('s1')} [data-action="remove-album"][data-id="s1-a3"]`)
            h.note('failed')
        }
    },
    {
        name: 'removing an album that the series cannot find', address: '/albums/s1', params: { seriesId: 's1' }, run: async (h) => {
            let calls = 0
            h.behaviour.remove = async () => { calls += 1; if (calls === 1) throw new Error('Could not find album query in series') }
            h.dialogs.prompt = 'The Wall'
            await h.click('#series-grid-mount [data-action="remove-album"][data-id="s1-a1"]')
            h.note('typed by hand, removed')
            h.dialogs.prompt = null
            calls = 0
            await h.click('#series-grid-mount [data-action="remove-album"][data-id="s1-a2"]')
            h.note('typed by hand, refused')
            calls = 0
            h.behaviour.remove = async () => { throw new Error('Could not find album query in series') }
            h.dialogs.prompt = 'x'
            await h.click('#series-grid-mount [data-action="remove-album"][data-id="s1-a3"]')
            h.note('typed by hand, failed too')
        }
    },
    {
        name: 'the series changes under the screen', run: async (h) => {
            await h.change(() => { albumSeriesStore.addSeries({ id: 's9', name: 'Newest', createdAt: DAY(9), albumQueries: [{ artist: 'New Band', title: 'First' }] }); world.series = [{ id: 's9', name: 'Newest', createdAt: DAY(9), albumQueries: [{ artist: 'New Band', title: 'First' }] }, ...world.series] })
            h.snap('a series added by the store, changed in place')
            h.note('what was asked')
        }
    },
    // ------------------------------------------------------------------------------------- the phone
    { name: 'all loaded, grid', phone: true, run: async (h) => { h.snap('the tiles, the bar with Filters, the phone pager'); h.focus('at the start') } },
    {
        name: 'all loaded, list', phone: true, storage: { albumsViewMode: 'expanded' }, run: async (h) => { h.snap('the rows') }
    },
    {
        name: 'the sheet of the filters', phone: true, run: async (h) => {
            await h.click('.filters-phone-button')
            h.snap('the sheet, no filter on', '.sheet')
            h.focus('in the sheet')
            await h.select('#sheetFilter_artist', 'Pink Floyd')
            h.snap('the sheet with a filter on', '.sheet')
            h.snap('the bar behind it, with the chip', '#series-toolbar-mount')
            await h.select('#sheetSort', 'alpha')
            await h.click('.sheet [data-view-mode="expanded"]')
            h.snap('the sheet after the order and the list', '.sheet')
            await h.select('#sheetFilter_year', '1970s')
            h.snap('two filters on', '.sheet')
            await h.click('.filter-sheet__clear')
            h.snap('cleared', '.sheet')
            await h.click('.sheet .filter-sheet__reload')
            h.note('Reload asked')
            h.snap('the page after Reload')
        }
    },
    {
        name: 'the chips of the filters', phone: true, run: async (h) => {
            await h.select('#filter-artist', 'Deep Purple')
            await h.click('.filters-phone-button')
            await h.select('#sheetFilter_source', 'acclaim')
            await h.click('.sheet .btn-primary')
            h.snap('the chips', '#series-toolbar-mount')
            h.focus('after Show albums')
            await h.click('.filters-chips__clear')
            h.snap('after Clear all', '#series-toolbar-mount')
            await h.select('#filter-artist', 'Deep Purple')
            h.snap('one chip', '#series-toolbar-mount')
            await h.click('.filters-chip')
            h.snap('the chip taken out', '#series-toolbar-mount')
        }
    },
    {
        name: 'the phone pager', phone: true, series: MANY_SERIES, run: async (h) => {
            h.snap('the pager above and below')
            await h.click('#series-pager-mount .series-pager-step:not(.series-pager-step--back)')
            h.snap('the second page')
            h.focus('after the step')
            await h.select('#series-pager-mount .series-pager-jump', '1')
            h.snap('back by the jump')
            await h.click('#series-pager-mount [data-pager-mode="scroll"]')
            h.snap('the scroll form')
            await h.click('#series-pager-mount [data-pager-more]')
            h.snap('all on screen')
        }
    },
    {
        name: 'the unchecked notice', phone: true, run: async (h) => {
            await h.select('#filter-source', 'acclaim')
            h.snap('the notice of albums not checked', '#series-pager-mount')
        }
    },
    {
        name: 'the sheet of an album', phone: true, run: async (h) => {
            await h.click(`${group('s1')} .album-more[data-id="s1-a4"]`)
            h.snap('with Spotify and BestEverAlbums', '.sheet')
            h.focus('in the sheet')
            await h.click('.sheet .albums-sheet__row')
            h.note('the first row')
            await h.click(`${group('s2')} .album-more[data-id="s2-a1"]`)
            h.snap('with neither', '.sheet')
            await h.click('.sheet .albums-sheet__row--danger')
            h.note('the last row')
            h.focus('after the sheet')
        }
    },
    {
        name: 'the sheet of a series', phone: true, run: async (h) => {
            await h.click(`${group('s1')} .series-more`)
            h.snap('Edit and Delete', '.sheet')
            await h.click('.sheet .albums-sheet__row')
            h.note('Edit')
            await h.click(`${group('s3')} .series-more`)
            await h.click('.sheet .albums-sheet__row--danger')
            h.note('Delete')
        }
    },
    {
        name: 'the more button of one series', phone: true, address: '/albums/s3', params: { seriesId: 's3' }, run: async (h) => {
            h.snap('the title row, with the more button', '.header-title-row')
            await h.click('.header-title-row .series-more')
            h.snap('the sheet', '.sheet')
        }
    },
    {
        name: 'turning the phone into a computer and back', phone: true, run: async (h) => {
            await h.turn(false)
            h.snap('the computer drawing')
            await h.turn(true)
            h.snap('the phone drawing again')
        }
    },
    {
        name: 'turning with the sheet open', phone: true, run: async (h) => {
            await h.click('.filters-phone-button')
            await h.turn(false)
            h.snap('the page after the turn')
            h.snap('the sheet after the turn (none when it closed)', '.sheet')
            // the focus right after this turn is not compared: see the test «a decided difference» of the same-as-before test
            h.note('what was asked')
        }
    }
]
