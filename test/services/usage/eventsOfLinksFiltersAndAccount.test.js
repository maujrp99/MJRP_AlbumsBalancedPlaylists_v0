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

vi.mock('@/services/auth/signIn.js', () => ({ authService: auth }))
vi.mock('../../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn(), isAuthenticated: () => false, getUserProfile: async () => null, login: vi.fn() } }))
vi.mock('../../../public/js/stores/toasts.js', () => {
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
import { createElement } from 'react'
import { CardValue } from '../../../public/js/screens/inventory/CardValue'
import { InventoryBridge } from '../../../public/js/screens/inventory/InventoryBridge'
import { usePhoneSheets } from '../../../public/js/screens/inventory/phone/Sheets'
import { BuyLinks, PhoneBuyLinks } from '../../../public/js/ui/inventoryItem/BuyLinks'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const roots = []
/** A piece of the inventory screen drawn on its own in the page (the whole screen is not loaded here: the album load is a stand-in in this file). */
const draw = async (element) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    roots.push(root)
    await act(async () => { root.render(element) })
    return host
}
const undraw = async () => { await act(async () => { roots.splice(0).forEach(root => root.unmount()) }) }
const press = async (button) => { await act(async () => { button.click() }) }
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { signOut } from '../../../public/js/shell/signOut'
import { startOn } from '../../support/renderShell'
import { openLoginWindow } from '../../../public/js/stores/loginWindow.js'

// the window to sign in is the shell's (React, F83 wave 3): opened as the screens open it, then clicked
const openSignIn = async () => {
    const shell = await startOn('/start')
    await shell.act(async () => { openLoginWindow() })
    return shell
}

const notOwned = { id: 'i1', artist: 'Joni Mitchell', title: 'Hejira', owned: null }
const linksIn = (root) => [...root.querySelectorAll('a[data-buy-store]')].map(link => [link.dataset.buyStore, link.dataset.buyPlace])

/** A piece that opens the sheet of an album of the phone when its button is pressed (the sheet is React since F83 wave 6a). */
function SheetHost({ controller }) {
    const sheets = usePhoneSheets(controller, new InventoryBridge())
    return createElement('div', null, createElement('button', { id: 'open', type: 'button', onClick: () => sheets.openItem('i1') }, 'open'), sheets.layer)
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

    it('on the card of the inventory', async () => {
        const block = await draw(createElement(CardValue, { item: notOwned, value: { origin: null, reason: 'waiting' }, money: { currency: 'USD', rates: null } }))
        expect(linksIn(block)).toEqual(ALL.map(store => [store, 'card']))
        await undraw()
    })

    it('in the album window, on the computer and on the phone', async () => {
        expect(linksIn(await draw(createElement(BuyLinks, { album: notOwned })))).toEqual(ALL.map(store => [store, 'album_window']))
        expect(linksIn(await draw(createElement(PhoneBuyLinks, { album: notOwned })))).toEqual(ALL.map(store => [store, 'album_window']))
        await undraw()
    })

    it('in the sheet of the album on the phone', async () => {
        window.matchMedia = () => ({ matches: true, addEventListener() { }, removeEventListener() { } })
        window.scrollTo = () => { }
        const controller = { state: { albums: [notOwned] }, valueViewOf: () => ({ value: { origin: null, reason: 'waiting' }, money: { currency: 'USD', rates: null } }) }
        await draw(createElement(SheetHost, { controller }))
        await press(document.getElementById('open'))
        expect(linksIn(document.querySelector('#inventoryItemSheet'))).toEqual(ALL.map(store => [store, 'phone_sheet']))
        await undraw()
        document.querySelectorAll('.sheet').forEach(node => node.remove())
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

// filter_used on the saved playlists: the screen moved to React (F83 wave 1); its test is
// test/screens/saved-playlists/SavedPlaylists.usage.test.tsx.

describe('sign_in and sign_out', () => {
    it('sign_in with the provider, after the sign-in worked', async () => {
        const shell = await openSignIn()
        await shell.act(async () => { document.querySelector('#appleLoginBtn').click() })
        await vi.waitFor(() => expect(sent).toEqual([['sign_in', { provider: 'apple' }]]))
        shell.stop()
    })

    it('not when the sign-in failed', async () => {
        auth.signInWithGoogle.mockRejectedValueOnce(Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' }))
        const shell = await openSignIn()
        await shell.act(async () => { document.querySelector('#googleLoginBtn').click() })
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(sent).toEqual([])
        shell.stop()
    })

    it('sign_out, after the sign-out worked', async () => {
        await signOut()
        expect(sent).toEqual([['sign_out', {}]])
    })
})
