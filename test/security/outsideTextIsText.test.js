/**
 * F59 slice E (UAT-199): text that comes from outside the code is shown as text.
 *
 * Names of albums, tracks, artists, series and playlists, notes, the message of an error and what
 * is read from the URL reach the page through these renderers. A name that looks like HTML has to
 * appear as the characters it is made of and create no element.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// the login of the app is Firebase's: the shell is drawn without it here (what is under test is how the shell writes a person's name and picture)
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { CompactCard, ExpandedCard } from '../../public/js/screens/albums/AlbumCard'
import { SeriesGroups } from '../../public/js/screens/albums/SeriesGroups'
import { Album } from '../../public/js/models/Album.js'
import { Grid } from '../../public/js/screens/inventory/Grid'
import { InventoryBridge } from '../../public/js/screens/inventory/InventoryBridge'
import { Router } from '../../public/js/router.js'
import { Breadcrumb, playlistsTrail } from '../../public/js/ui/Breadcrumb'
import { BlendSeriesSelector } from '../../public/js/components/blend/BlendSeriesSelector.js'
import { SpotifyExportModal } from '../../public/js/components/SpotifyExportModal.js'
import { startOn } from '../support/renderShell'
import { PickerCard } from '../../public/js/ui/albumPicker/PickerParts'
import { FilterToolbar } from '../../public/js/ui/FilterToolbar'

/** Text that would run as HTML if written into the page as it is. */
const TEXT = '<img src=x onerror="window.__xss=1">'
/** Text that would leave a quoted attribute value and then run. */
const QUOTED = '"><img src=x onerror="window.__xss=1"> \'x'
const AMPERSAND = 'Jimmy Page & Robert Plant'

let host
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** Draw a React element in the page, as the albums screen does (the cards and the series header are React since F83 wave 5a). */
const drawReact = async (element) => {
    await act(async () => { createRoot(host).render(element) })
    return host
}
const noop = () => { }
const groupActions = { retry: noop, loadMore: noop, edit: noop, remove: noop, more: noop }

/** Draw an HTML string or a node in the page, as the screens do. */
const draw = (rendered) => {
    if (typeof rendered === 'string') host.innerHTML = rendered
    else host.appendChild(rendered)
    return host
}

/** Nothing was created from the text, nothing ran, and each text is on screen as it was given. */
const expectOnlyText = (container, ...texts) => {
    // the img of the text itself; a cover drawn by the code (which may carry its own fallback) is not one
    expect(container.querySelectorAll('img[src="x"]').length).toBe(0)
    expect(container.querySelectorAll('[onerror*="__xss"]').length).toBe(0)
    expect(window.__xss).toBeUndefined()
    for (const text of texts) expect(container.textContent).toContain(text)
}

beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    delete window.__xss
})

afterEach(() => {
    host.remove()
    document.body.querySelectorAll('.modal-overlay').forEach(node => node.remove())
})

describe('text from outside is shown as text', () => {
    const album = (overrides = {}) => new Album({
        id: QUOTED, title: TEXT, artist: TEXT, year: 1971, coverUrl: QUOTED,
        tracks: [{ id: 't1', title: TEXT, artist: TEXT, rank: 1, rating: 90, duration: 200 }],
        ...overrides
    })

    it('album card, compact and expanded', async () => {
        await drawReact(createElement(CompactCard, { album: album(), act: noop }))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('h3').textContent).toBe(TEXT)

        await drawReact(createElement(ExpandedCard, { album: album(), index: 0, act: noop }))
        expectOnlyText(host, TEXT)
    })

    it('album card keeps a name with & as it is', async () => {
        await drawReact(createElement(CompactCard, { album: album({ title: AMPERSAND, artist: AMPERSAND }), act: noop }))
        expect(host.querySelector('h3').textContent).toBe(AMPERSAND)
        expect(host.textContent).not.toContain('&amp;')
    })

    // the track row and the card of a playlist are React (F83 wave 2): test/screens/playlists/outsideText.test.tsx

    // the header of a series is the one of its group on the albums screen (it takes the albums of the series to be drawn at all)
    const groupOf = (series) => createElement(SeriesGroups, {
        albums: [{ id: 'a1', title: 'Quiet', artist: 'Quiet', seriesIds: [series.id], tracks: [], getTracks: () => [] }], seriesList: [series], scope: 'ALL', layout: 'grid',
        context: { searchQuery: '', filters: {} }, isLoading: false, seriesStates: null, expandedSeriesIds: [], phone: false, act: noop, actions: groupActions
    })

    it('series header: the name and the id on the buttons', async () => {
        await drawReact(groupOf({ id: QUOTED, name: TEXT }))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('h2').textContent).toBe(TEXT)
        expect(host.querySelector('[data-action="edit-series"]').dataset.seriesId).toBe(QUOTED)
        expect(host.querySelector('[data-action="delete-series"]').dataset.seriesId).toBe(QUOTED)
    })

    it('series header keeps a name with & as it is', async () => {
        await drawReact(groupOf({ id: 's1', name: AMPERSAND }))
        expect(host.querySelector('h2').textContent).toBe(AMPERSAND)
    })

    it('series card of the blending menu', () => {
        const selector = new BlendSeriesSelector()
        draw(selector.renderSeriesCard({ id: QUOTED, name: TEXT, albumQueries: [] }))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('.blend-series-card').dataset.seriesId).toBe(QUOTED)
        expect(host.querySelector('h4').textContent).toBe(TEXT)
    })

    // The saved playlists card (batch name and playlist names) moved with its screen to React (F83 wave 1): its test is
    // test/screens/saved-playlists/outsideText.test.tsx, with the same assertions.

    /** The albums of the inventory in React (F83 wave 6a: screens/inventory/Grid.tsx), the card of the grid or the row of the list. */
    const inventoryGrid = (item, viewMode) => createElement(Grid, {
        state: { filteredAlbums: [item], viewMode, isLoading: false },
        bridge: new InventoryBridge(),
        actions: { onView: noop, onEdit: noop, onDelete: noop, onStatus: noop }
    })
    const owned = () => ({ id: QUOTED, title: TEXT, artist: TEXT, format: TEXT, owned: true, purchasePrice: 10, currency: 'USD', notes: TEXT })

    it('inventory card: title, artist, format and id', async () => {
        await drawReact(inventoryGrid(owned(), 'grid'))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('.inventory-card-wrapper').dataset.albumId).toBe(QUOTED)
        expect(host.querySelector('.status-select').dataset.albumId).toBe(QUOTED)
    })

    it('inventory row: title, artist, format and id', async () => {
        await drawReact(inventoryGrid(owned(), 'list'))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('.inventory-row-wrapper').dataset.albumId).toBe(QUOTED)
    })

    it("the router's error screen: the message of the error", async () => {
        host.id = 'app'
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
        const router = new Router()
        await router.renderView(() => ({ render: () => { throw new Error(TEXT) } }), {})
        quiet.mockRestore()

        expect(host.textContent).toContain('View Error')
        expectOnlyText(host, TEXT)
    })

    it('breadcrumb: the trail of the playlists screen is text, whatever the address says', async () => {
        await drawReact(createElement(Breadcrumb, { crumbs: playlistsTrail(false), onNavigate: noop }))
        expect(host.querySelector('img')).toBeNull()
        expect(window.__xss).toBeUndefined()
        expect(host.querySelector('.breadcrumb-current').textContent).toBe('Playlists')
    })

    it('Spotify export dialog: the playlist name, the message and the tracks not found', () => {
        const modal = new SpotifyExportModal()
        modal.playlistName = QUOTED
        modal.notFoundTracks = [{ artist: TEXT, title: TEXT }]

        modal.state = 'IDLE'
        draw(modal.render())
        expectOnlyText(host)
        expect(host.querySelector('#playlistNameInput').value).toBe(QUOTED)

        // the end of an export: the names it created or not, the reason it stopped, the tracks not found
        modal.state = 'DONE'
        modal.report = {
            mode: 'separate', totalTracks: 2, matchCount: 1,
            created: [{ name: TEXT, url: QUOTED, tracks: 1, total: 1, alreadyThere: true }],
            incomplete: [{ name: TEXT, url: QUOTED, tracks: 1, total: 2 }],
            empty: [TEXT], notCreated: [TEXT],
            failure: { kind: 'reconnect', message: TEXT }
        }
        draw(modal.render())
        expectOnlyText(host, TEXT)
        expect(host.querySelector('a.created-playlist-link')).toBeNull() // an address that is not a web address is no link

        modal.progress = { current: 0, total: 0, message: TEXT }
        modal.state = 'MATCHING'
        draw(modal.render())
        expectOnlyText(host, TEXT)
    })

    it('account panel (the top menu of the computer; the phone menu is drawn in React too): the name, the e-mail and the picture address of the person (the picture is not drawn: the initial is)', async () => {
        // the shell in React (F83 wave 3, F88) draws the person in the panel of the bar
        const shell = await startOn('/start', { user: { isAnonymous: false, displayName: TEXT, email: TEXT, photoURL: QUOTED, providerData: [] } })
        const bar = document.getElementById('header-container')

        expectOnlyText(bar, TEXT)
        expect(bar.querySelectorAll('img').length).toBe(1) // the mark of the site, and nothing the person sent
        expect(bar.querySelector('.top-acct__initial').textContent).toBe(TEXT.trim().charAt(0).toUpperCase())
        shell.stop()
    })

    it('album picker card (series edit): title, id, year and cover address', async () => {
        await drawReact(createElement(PickerCard, { album: { id: QUOTED, title: TEXT, artist: TEXT, year: TEXT, type: 'Album', coverUrl: QUOTED }, onPick: () => { } }))

        expectOnlyText(host, TEXT)
        expect(host.querySelector('[data-action="pick-album"]').dataset.id).toBe(QUOTED)
        expect(host.querySelectorAll('img').length).toBe(1)
        expect(host.querySelector('img').getAttribute('src')).toBe(QUOTED)
    })

    it('filter list: an artist name with quotes is the value of its option', async () => {
        const name = 'The "Quoted" <b> & Sons'
        await drawReact(createElement(FilterToolbar, {
            searchQuery: '', onSearch: noop, sortOptions: [], currentSort: '', onSort: noop,
            filterGroups: [{ id: 'artist', label: 'All artists', value: 'all', onChange: noop, options: [{ value: name, label: name }] }]
        }))

        const option = host.querySelectorAll('option')[1]
        expect(option.value).toBe(name)
        expect(option.textContent.trim()).toBe(name)
        expect(host.querySelector('b')).toBeNull()
    })
})
