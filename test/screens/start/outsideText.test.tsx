/**
 * F59 slice E (UAT-199) and F83 wave 4: text that comes from outside the code is shown as text. The names the catalog gives (artist,
 * album, cover address), the name a person types for the series and the lines they paste are drawn by React, which writes text as text:
 * nothing of it runs, and a «&» stays a «&».
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => ({ createSeries: async () => ({ id: 's1' }) })) }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import { Start } from '../../../public/js/screens/start/Start'
import { StartController } from '../../../public/js/screens/start/StartController'
import { renderScreen } from '../../support/renderScreen'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { asPhone } from '../../support/startScenarios.js'

/** Text that would run as HTML if written into the page as it is. */
const TEXT = '<img src=x onerror="window.__xss=1">'
const QUOTED = '"><img src=x onerror="window.__xss=1"> \'x'
const tick = () => new Promise(resolve => setImmediate(resolve))

const nothingRan = (app: HTMLElement) => {
    expect(app.querySelectorAll('img[src="x"]')).toHaveLength(0)
    expect(app.querySelectorAll('[onerror*="__xss"]')).toHaveLength(0)
    expect((window as { __xss?: unknown }).__xss).toBeUndefined()
}

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

async function openWith(albums: Array<Record<string, unknown>>) {
    asPhone(false)
    vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
    service.scanArtist.mockResolvedValue({ albums, reclassified: null })
    const controller = new StartController()
    const screen = await renderScreen(Start, { controller }, { screen: 'start', view: { prepare: async () => { controller.initialize() }, dispose: () => controller.dispose() } })
    await screen.act(async () => { await controller.search('x'); for (let i = 0; i < 4; i++) await tick() })
    return { ...screen, controller }
}

describe('the covers, the dock and the panel', () => {
    const hostile = { id: QUOTED, title: TEXT, artist: TEXT, year: TEXT, releaseDate: '2000-01-01', type: 'Album', coverUrl: QUOTED }

    it('writes the title, the artist, the year, the id and the address of a cover as text and as attribute values, never as markup', async () => {
        const screen = await openWith([hostile])
        nothingRan(screen.app)
        const card = screen.app.querySelector<HTMLElement>('#discographyGrid .home-card')!
        expect(card.dataset.id).toBe(QUOTED)
        expect(card.querySelector('.home-card__title')!.textContent).toBe(TEXT)
        expect(screen.app.querySelector('#homeArtistName')!.textContent).toBe(TEXT)

        await screen.act(async () => { card.click() })
        nothingRan(screen.app)
        expect(screen.app.querySelector<HTMLInputElement>('#seriesNameInput')!.value).toBe(`${TEXT} selection`)
        await screen.act(async () => { screen.controller.toggleOpen() })
        nothingRan(screen.app)
        expect(screen.app.querySelector('.home-rows .home-rt strong')!.textContent).toBe(TEXT)
        expect(screen.app.querySelector('.home-rows .home-rbtn__up')!.getAttribute('aria-label')).toBe(`Move «${TEXT}» up`)
        await screen.leave()
    })

    it('keeps a name with & as it is, and a name typed by the person as text', async () => {
        const screen = await openWith([{ ...hostile, id: 'a1', title: 'Fire & Ice', artist: 'Simon &amp; Garfunkel', year: '1969', coverUrl: null }])
        await screen.act(async () => { screen.app.querySelector<HTMLElement>('#discographyGrid .home-card')!.click() })
        expect(screen.app.querySelector('.home-card__title')!.textContent).toBe('Fire & Ice')
        expect(screen.app.textContent).not.toContain('&amp;amp;')
        expect(screen.app.querySelector<HTMLInputElement>('#seriesNameInput')!.value).toBe('Simon & Garfunkel selection')
        await screen.act(async () => { screen.controller.setName(TEXT) })
        nothingRan(screen.app)
        expect(screen.app.querySelector<HTMLInputElement>('#seriesNameInput')!.value).toBe(TEXT)
        await screen.leave()
    })
})

describe('the pasted list', () => {
    it('writes what the person pasted, and the reasons, as text', async () => {
        const screen = await openWith([])
        await screen.act(async () => { screen.controller.setMode('paste', `${TEXT}\nYes - Fragile`) })
        nothingRan(screen.app)
        const first = screen.app.querySelector<HTMLInputElement>('.home-line__text')!
        expect(first.value).toBe(TEXT)
        expect(first.getAttribute('aria-label')).toContain('Line 1, add « - » between artist and album')
        await screen.leave()
    })
})
