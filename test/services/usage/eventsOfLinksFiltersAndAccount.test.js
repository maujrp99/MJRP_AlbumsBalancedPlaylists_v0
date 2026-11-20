/**
 * F77, REQ-02: the buy links carry the store and the place they are in (the one listener of
 * usageWiring.js measures the click); the filters of three screens are measured once per choice
 * (a search when it starts, never what was searched); the sign-in by its provider and the
 * sign-out, after they worked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const auth = vi.hoisted(() => ({ logout: vi.fn(async () => { }), signInWithGoogle: vi.fn(async () => ({})), signInWithApple: vi.fn(async () => ({})) }))
const mocks = vi.hoisted(() => ({
    load: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), reloadAlbum: vi.fn(() => 1) },
    ranking: { ensureLoaded: vi.fn(async () => true), save: vi.fn(async () => true) }
}))

vi.mock('@shared/services/AuthService.js', () => ({ authService: auth }))
vi.mock('../../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn() } }))
vi.mock('../../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
vi.mock('../../../public/js/utils/reloadApp.js', () => ({ reloadApp: vi.fn() }))
vi.mock('../../../public/js/services/albums/albumLoading.js', () => ({
    albumLoadService: mocks.load, ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW', ALL_SCOPE: 'ALL', singleScope: (id) => `SINGLE:${id}`
}))
vi.mock('../../../public/js/services/ranking/ownRanking.js', () => ({ ownRankingService: mocks.ranking }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/stores/albums.js', () => ({
    albumsStore: { subscribe: () => () => { }, setActiveAlbumSeriesId: vi.fn(), getAlbums: () => [] }
}))

import { recordUsage, stopRecording } from '../../helpers/usageRecorder.js'
import { filterUseOf } from '../../../public/js/models/filterUse.js'
import { buyLinksOf } from '../../../public/js/models/buyLinks.js'
import { cardValueBlock } from '../../../public/js/views/renderers/InventoryCardValue.js'
import { createBuyLinksSection, createPhoneBuyLinks } from '../../../public/js/components/InventoryValueSection.js'
import { openItemSheet } from '../../../public/js/views/InventoryPhoneSheets.js'
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { signOut } from '../../../public/js/components/navigation/AuthNav.js'
import { showLoginModal } from '../../../public/js/components/LoginModal.js'
import { SavedPlaylistsView } from '../../../public/js/views/SavedPlaylistsView.js'

const notOwned = { id: 'i1', artist: 'Joni Mitchell', title: 'Hejira', owned: null }
const linksIn = (root) => [...root.querySelectorAll('a[data-buy-store]')].map(link => [link.dataset.buyStore, link.dataset.buyPlace])
const html = (text) => {
    const host = document.createElement('div')
    host.innerHTML = text
    return host
}

let sent
beforeEach(async () => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })
    sent = await recordUsage()
})
afterEach(() => {
    stopRecording()
    vi.restoreAllMocks()
})

describe('each buy link says its store and where it is', () => {
    const ALL = ['discogs', 'amazon', 'imusic']

    it('the links of the model carry the id of the store', () => {
        expect(buyLinksOf(notOwned).map(link => link.id)).toEqual(ALL)
    })

    it('on the card of the inventory', () => {
        const block = html(cardValueBlock(notOwned, { origin: null, reason: 'waiting' }, { currency: 'USD', rates: null }))
        expect(linksIn(block)).toEqual(ALL.map(store => [store, 'card']))
    })

    it('in the album window, on the computer and on the phone', () => {
        expect(linksIn(createBuyLinksSection(notOwned))).toEqual(ALL.map(store => [store, 'album_window']))
        expect(linksIn(createPhoneBuyLinks(notOwned))).toEqual(ALL.map(store => [store, 'album_window']))
    })

    it('in the sheet of the album on the phone', () => {
        openItemSheet(notOwned, { value: { origin: null, reason: 'waiting' }, money: { currency: 'USD', rates: null } }, {})
        expect(linksIn(document.body)).toEqual(ALL.map(store => [store, 'phone_sheet']))
    })
})

describe('filterUseOf', () => {
    it('a filter set to something that filters, and new', () => {
        expect(filterUseOf('albums', 'artist', 'Radiohead', '')).toEqual({ screen: 'albums', which: 'artist' })
        expect(filterUseOf('inventory', 'ownership', 'owned', 'all')).toEqual({ screen: 'inventory', which: 'status' })
        expect(filterUseOf('saved_playlists', 'seriesId', 'sA', 'all')).toEqual({ screen: 'saved_playlists', which: 'series' })
    })

    it('not a filter cleared, not the same choice again, not an unknown filter', () => {
        expect(filterUseOf('albums', 'artist', '', 'Radiohead')).toBeNull()
        expect(filterUseOf('inventory', 'format', 'all', 'cd')).toBeNull()
        expect(filterUseOf('inventory', 'format', 'cd', 'cd')).toBeNull()
        expect(filterUseOf('albums', 'viewMode', 'grid', 'list')).toBeNull()
    })

    it('a search once, when it starts; never what was typed', () => {
        expect(filterUseOf('albums', 'search', 'r', '')).toEqual({ screen: 'albums', which: 'search' })
        expect(filterUseOf('albums', 'search', 'ra', 'r')).toBeNull()
    })
})

describe('filter_used on the albums screen', () => {
    it('a filter, a search when it starts, an order', () => {
        const controller = new SeriesController()
        controller.handleFilterChange('artist', 'Radiohead')
        controller.handleSearch('o')
        controller.handleSearch('ok')
        controller.handleSort('alpha')

        expect(sent).toEqual([
            ['filter_used', { screen: 'albums', which: 'artist' }],
            ['filter_used', { screen: 'albums', which: 'search' }],
            ['filter_used', { screen: 'albums', which: 'sort' }]
        ])
    })
})

describe('filter_used on the saved playlists', () => {
    it('the series and the batch chosen, never their names', () => {
        const view = { filterState: { search: '', seriesId: 'all', batchName: 'all', sort: 'updated_desc' }, update: vi.fn() }
        SavedPlaylistsView.prototype.handleFilterChange.call(view, 'seriesId', 'sA')
        SavedPlaylistsView.prototype.handleFilterChange.call(view, 'batchName', 'My secret batch')

        expect(sent).toEqual([
            ['filter_used', { screen: 'saved_playlists', which: 'series' }],
            ['filter_used', { screen: 'saved_playlists', which: 'batch' }]
        ])
    })
})

describe('sign_in and sign_out', () => {
    it('sign_in with the provider, after the sign-in worked', async () => {
        showLoginModal()
        document.querySelector('#appleLoginBtn').click()
        await vi.waitFor(() => expect(sent).toEqual([['sign_in', { provider: 'apple' }]]))
    })

    it('not when the sign-in failed', async () => {
        auth.signInWithGoogle.mockRejectedValueOnce(Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' }))
        showLoginModal()
        document.querySelector('#googleLoginBtn').click()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(sent).toEqual([])
    })

    it('sign_out, after the sign-out worked', async () => {
        await signOut()
        expect(sent).toEqual([['sign_out', {}]])
    })
})
