/**
 * F59 slice E (UAT-199): text that comes from outside the code is shown as text.
 *
 * Names of albums, tracks, artists, series and playlists, notes, the message of an error and what
 * is read from the URL reach the page through these renderers. A name that looks like HTML has to
 * appear as the characters it is made of and create no element.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { AlbumCardRenderer } from '../../public/js/components/ui/AlbumCardRenderer.js'
import { Album } from '../../public/js/models/Album.js'
import { renderSeriesHeader } from '../../public/js/views/albums/AlbumsScopedRenderer.js'
import { InventoryGridRenderer } from '../../public/js/views/renderers/InventoryGridRenderer.js'
import { Router } from '../../public/js/router.js'
import { Breadcrumb } from '../../public/js/components/Breadcrumb.js'
import { BlendSeriesSelector } from '../../public/js/components/blend/BlendSeriesSelector.js'
import { SpotifyExportModal } from '../../public/js/components/SpotifyExportModal.js'
import { AuthNav } from '../../public/js/components/navigation/AuthNav.js'
import { DiscographyRenderer } from '../../public/js/views/renderers/DiscographyRenderer.js'
import FilterToolbar from '../../public/js/components/ui/FilterToolbar.js'

/** Text that would run as HTML if written into the page as it is. */
const TEXT = '<img src=x onerror="window.__xss=1">'
/** Text that would leave a quoted attribute value and then run. */
const QUOTED = '"><img src=x onerror="window.__xss=1"> \'x'
const AMPERSAND = 'Jimmy Page & Robert Plant'

let host

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

    it('album card, compact and expanded', () => {
        draw(AlbumCardRenderer.renderCompact(album()))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('h3').textContent).toBe(TEXT)

        draw(AlbumCardRenderer.renderExpanded(album(), 0))
        expectOnlyText(host, TEXT)
    })

    it('album card keeps a name with & as it is', () => {
        draw(AlbumCardRenderer.renderCompact(album({ title: AMPERSAND, artist: AMPERSAND })))
        expect(host.querySelector('h3').textContent).toBe(AMPERSAND)
        expect(host.textContent).not.toContain('&amp;')
    })

    // the track row and the card of a playlist are React (F83 wave 2): test/screens/playlists/outsideText.test.tsx

    it('series header: the name and the id on the buttons', () => {
        draw(renderSeriesHeader({ id: QUOTED, name: TEXT }, 3))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('h2').textContent).toBe(TEXT)
        expect(host.querySelector('[data-action="edit-series"]').dataset.seriesId).toBe(QUOTED)
        expect(host.querySelector('[data-action="delete-series"]').dataset.seriesId).toBe(QUOTED)
    })

    it('series header keeps a name with & as it is', () => {
        draw(renderSeriesHeader({ id: 's1', name: AMPERSAND }, 1))
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

    it('inventory card and inventory row: title, artist, format and id', () => {
        const owned = { id: QUOTED, title: TEXT, artist: TEXT, format: TEXT, owned: true, purchasePrice: 10, currency: 'USD', notes: TEXT }

        draw(InventoryGridRenderer.render({ filteredAlbums: [owned], viewMode: 'grid', isLoading: false }))
        expectOnlyText(host, TEXT)
        expect(host.querySelector('.inventory-card-wrapper').dataset.albumId).toBe(QUOTED)
        expect(host.querySelector('.status-select').dataset.albumId).toBe(QUOTED)

        draw(InventoryGridRenderer.render({ filteredAlbums: [owned], viewMode: 'list', isLoading: false }))
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

    it('breadcrumb: an address read from the URL', () => {
        const path = `/playlists/${QUOTED}`
        draw(Breadcrumb.render(path, {}))
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

    it('account menu: the name, the e-mail and the picture address of the person', () => {
        const nav = new AuthNav({ loading: false, currentUser: { isAnonymous: false, displayName: TEXT, email: TEXT, photoURL: QUOTED, providerData: [] } })

        draw(nav.renderDesktop())
        expectOnlyText(host, TEXT)
        expect(host.querySelectorAll('img').length).toBe(1)
        expect(host.querySelector('img').getAttribute('src')).toBe(QUOTED)

        draw(nav.renderMobile())
        expectOnlyText(host, TEXT)
        expect(host.querySelector('img').getAttribute('src')).toBe(QUOTED)
    })

    it('album picker card (Home and series edit): title, id, year and cover address', () => {
        new DiscographyRenderer(host).render([{ id: QUOTED, title: TEXT, artist: TEXT, year: TEXT, type: 'Album', coverUrl: QUOTED }])

        expectOnlyText(host, TEXT)
        expect(host.querySelector('[data-action="pick-album"]').dataset.id).toBe(QUOTED)
        expect(host.querySelectorAll('img').length).toBe(1)
        expect(host.querySelector('img').getAttribute('src')).toBe(QUOTED)
    })

    it('filter list: an artist name with quotes is the value of its option', () => {
        const toolbar = new FilterToolbar({ container: host, props: {} })
        const name = 'The "Quoted" <b> & Sons'
        draw(toolbar.renderFilterGroup({ id: 'artist', label: 'All artists', value: 'all', options: [{ value: name, label: name }] }))

        const option = host.querySelectorAll('option')[1]
        expect(option.value).toBe(name)
        expect(option.textContent.trim()).toBe(name)
        expect(host.querySelector('b')).toBeNull()
    })
})
