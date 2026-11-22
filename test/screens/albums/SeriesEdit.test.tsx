/**
 * F57 - the "Edit Series" window (carried over in F83 wave 5b from test/components/series/SeriesEditModal.test.js: the window is React now, so
 * it is drawn by the host of the windows and every press goes through `act`; what the tests assert is what they asserted).
 * The search for albums is the one album picker, the same as the Start screen's (same states, same filters, same card); what the window does
 * with a pick is add it to the series being edited. Saving answers at once: the button is busy and cannot be clicked twice, a failure is said
 * in the window and what the person picked stays. No alert().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn() }))
const seriesService = vi.hoisted(() => ({ updateSeries: vi.fn() }))
const store = vi.hoisted(() => ({ series: [] as unknown[], db: {} as object | null }))
const toast = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => seriesService }))
vi.mock('../../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getSeries: () => store.series, getDb: () => store.db, getUserId: () => 'user-1' }
}))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { act } from 'react'
import { HomeView } from '../../support/startHarness.js'
import { DeadlineError } from '../../../public/js/utils/deadline.js'
import { mountWindows, press, settle, typeInto, type MountedWindows } from '../../support/albumWindowsHost'

const album = (title: string, type = 'Album', releaseDate = '2015-03-15') => ({
    id: `id-${title}`, title, artist: 'Kendrick Lamar', year: releaseDate.slice(0, 4), type, releaseDate, coverUrl: 'https://img/{w}x{h}.jpg'
})
const deferred = <T,>() => {
    let resolve!: (value: T) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}

describe('Edit Series window (F57)', () => {
    let mounted: MountedWindows
    const modal = () => document.getElementById('edit-series-modal')
    const $ = (selector: string) => modal()!.querySelector<HTMLElement>(selector)
    const $$ = (selector: string) => [...modal()!.querySelectorAll<HTMLElement>(selector)]
    const picker = () => $('[data-album-picker]')!
    const scanButton = () => $('[data-action="scan-artist"]') as HTMLButtonElement
    const saveButton = () => $('[data-action="save-series"]') as HTMLButtonElement
    const type = (text: string) => typeInto(picker().querySelector('input'), text)
    const cardTitles = () => $$('[data-picker-grid] h3').map(h => h.textContent)
    const listed = () => $$('[data-series-albums] [data-album-row]').map(row => row.textContent!.replace(/x$/, ''))
    const scan = async (text: string, answer: unknown) => {
        service.scanArtist.mockResolvedValueOnce(answer)
        await type(text)
        await press(scanButton())
        await settle()
    }

    beforeEach(async () => {
        store.series = [{ id: 's1', name: 'Rap', albumQueries: ['Kendrick Lamar - DAMN.'] }]
        store.db = {}
        service.scanArtist.mockReset()
        seriesService.updateSeries.mockReset()
        Object.values(toast).forEach(mock => mock.mockClear())
        window.alert = vi.fn()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})

        mounted = await mountWindows()
        await act(async () => { mounted.windows().openEdit('s1') })
    })

    afterEach(async () => {
        await mounted.unmount()
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    describe('the album picker inside it', () => {
        it('opens with the series and the picker waiting for an artist', () => {
            expect(($('input[placeholder="Series Name"]') as HTMLInputElement).value).toBe('Rap')
            expect(listed()).toEqual(['Kendrick Lamar - DAMN.'])
            expect($('[data-picker-grid]')!.textContent).toContain('Search for an artist to begin scanning.')
            expect(scanButton().disabled).toBe(false)
        })

        it('has the same filter buttons as the Start screen, in the same order', async () => {
            // the Start screen (the old Home), in React since F83 wave 4: its chips are the ones the picker rules give
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const start = new HomeView()
            app.appendChild(await start.render({}))
            await start.mount({})
            const homeLabels = [...app.querySelectorAll('#home-toolbar [data-filter]')].map(b => [(b as HTMLElement).dataset.filter, b.querySelector('.filter-btn-text')!.textContent])
            start.destroy()
            app.remove()

            const modalLabels = $$('[data-album-picker] [data-filter]').map(b => [b.dataset.filter, b.querySelector('.filter-btn-text')!.textContent])

            expect(modalLabels).toEqual(homeLabels)
            expect(modalLabels.map(([, label]) => label)).toEqual(['Studio', 'EPs', 'Singles', 'Live', 'Compendiums', 'Other'])
        })

        it('answers the click at once: button busy and disabled, the wait in the panel', async () => {
            service.scanArtist.mockReturnValue(new Promise(() => {}))
            await type('kendrick lamar')

            await press(scanButton())

            expect(scanButton().disabled).toBe(true)
            expect(scanButton().getAttribute('aria-busy')).toBe('true')
            expect(scanButton().textContent).toContain('Scanning…')
            expect($('[data-picker-grid]')!.textContent).toContain('Searching the catalog for «kendrick lamar»…')
            expect(service.scanArtist).toHaveBeenCalledWith('kendrick lamar')
        })

        it('the Enter key takes the same path as the click, and does not submit anything', async () => {
            service.scanArtist.mockResolvedValue({ albums: [album('DAMN.')], reclassified: null })
            await type('kendrick lamar')
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })

            await act(async () => { picker().querySelector('input')!.dispatchEvent(event) })
            await settle()

            expect(event.defaultPrevented).toBe(true)
            expect(cardTitles()).toEqual(['DAMN.'])
        })

        it('results: the same cards as the Start screen, newest first, with the counts on the filters', async () => {
            await scan('kendrick lamar', {
                albums: [album('good kid, m.A.A.d city (Deluxe Version)', 'Album', '2012-10-22'), album('To Pimp a Butterfly'), album('The Heart Part 5 - Single', 'Single', '2022-05-08')],
                reclassified: null
            })

            expect(cardTitles()).toEqual(['To Pimp a Butterfly', 'good kid, m.A.A.d city (Deluxe Version)'])
            expect($('[data-filter="albums"] .filter-btn-count')!.textContent).toBe(' (2)')
            expect($('[data-filter="singles"] .filter-btn-count')!.textContent).toBe(' (1)')
            expect($('[data-filter="uncategorized"] .filter-btn-count')!.textContent).toBe('')
            expect($('[data-album-picker] [role="status"]')!.textContent).toBe('→ Kendrick Lamar')
            expect($$('[data-picker-grid] [data-action="pick-album"]')).toHaveLength(2)
            expect(scanButton().disabled).toBe(false)
        })

        it('a filter click shows the albums of that type', async () => {
            await scan('kendrick lamar', { albums: [album('DAMN.'), album('The Heart Part 5 - Single', 'Single')], reclassified: null })

            await press($('[data-filter="singles"]'))
            await press($('[data-filter="albums"]'))

            expect(cardTitles()).toEqual(['The Heart Part 5 - Single'])
            expect($('[data-filter="singles"]')!.getAttribute('aria-pressed')).toBe('true')
        })

        it('shows the catalog albums before the AI list arrives, then classifies them again', async () => {
            const ai = deferred<unknown[]>()
            await scan('orbital', { albums: [album('Snivilisation'), album('Odd One')], reclassified: ai.promise })

            expect(cardTitles()).toEqual(['Snivilisation', 'Odd One'])
            expect($('[data-album-picker] [role="status"]')!.textContent).toContain('confirming album types…')

            ai.resolve([album('Snivilisation'), album('Odd One', 'Uncategorized')])
            await settle()

            expect(cardTitles()).toEqual(['Snivilisation'])
            expect($('[data-filter="uncategorized"] .filter-btn-count')!.textContent).toBe(' (1)')
        })

        it('no results: a message, not a failure', async () => {
            await scan('kendrik', { albums: [], reclassified: null })

            expect($('[data-picker-grid]')!.textContent).toContain('No albums found for «kendrik».')
            expect($('[data-action="scan-retry"]')).toBeNull()
        })

        it('failed by deadline: says so, with "Try again", which scans the same text', async () => {
            service.scanArtist.mockRejectedValueOnce(new DeadlineError('the catalog', 15000))
            await type('kendrick lamar')
            await press(scanButton())
            await settle()

            expect($('[data-picker-grid]')!.textContent).toContain('The catalog did not answer in 15 seconds.')
            expect(scanButton().disabled).toBe(false)
            expect(window.alert).not.toHaveBeenCalled()

            service.scanArtist.mockResolvedValue({ albums: [album('DAMN.')], reclassified: null })
            await type('something else')
            await press($('[data-action="scan-retry"]'))
            await settle()

            expect(service.scanArtist).toHaveBeenLastCalledWith('kendrick lamar')
            expect(cardTitles()).toEqual(['DAMN.'])
        })

        it('after the window is closed, a late answer draws nothing and breaks nothing', async () => {
            const late = deferred<unknown>()
            service.scanArtist.mockReturnValue(late.promise)
            await type('kendrick lamar')
            await press(scanButton())
            const grid = $('[data-picker-grid]')!

            await press($('[data-action="close-modal"]'))
            late.resolve({ albums: [album('DAMN.')], reclassified: null })
            await settle()

            expect(modal()).toBeNull()
            expect(grid.textContent).not.toContain('DAMN.')
        })
    })

    describe('a pick is added to the series being edited', () => {
        it('a click on a card adds the album to the list, as the query the series stores', async () => {
            await scan('kendrick lamar', { albums: [album('To Pimp a Butterfly')], reclassified: null })

            await press($('[data-picker-grid] [data-action="pick-album"]'))

            expect(listed()).toEqual(['Kendrick Lamar - DAMN.', 'Kendrick Lamar - To Pimp a Butterfly'])
            expect($('[data-series-count]')!.textContent).toBe('2 albums')
            expect(toast.success).toHaveBeenCalledWith('Added: To Pimp a Butterfly')
            expect(seriesService.updateSeries).not.toHaveBeenCalled()
        })

        it('an album already in the list is not added twice', async () => {
            await scan('kendrick lamar', { albums: [album('DAMN.')], reclassified: null })

            await press($('[data-picker-grid] [data-action="pick-album"]'))

            expect(listed()).toEqual(['Kendrick Lamar - DAMN.'])
            expect(toast.warning).toHaveBeenCalledWith('Album already in list')
        })

        it('an album can be taken out of the list', async () => {
            await press($('[data-series-albums] [data-action="remove-album"]'))

            expect(listed()).toEqual([])
            expect($('[data-series-albums]')!.textContent).toContain('No albums yet.')
        })
    })

    describe('saving', () => {
        const pickOne = async () => {
            await scan('kendrick lamar', { albums: [album('To Pimp a Butterfly')], reclassified: null })
            await press($('[data-picker-grid] [data-action="pick-album"]'))
        }

        it('answers the click at once: the button busy and disabled while the write is on its way', async () => {
            const write = deferred<void>()
            seriesService.updateSeries.mockReturnValue(write.promise)
            await pickOne()

            await press(saveButton())

            expect(saveButton().disabled).toBe(true)
            expect(saveButton().getAttribute('aria-busy')).toBe('true')
            expect(saveButton().textContent).toBe('Saving…')
            expect(modal()).not.toBeNull()
        })

        it('no double save: a second click while saving asks nothing', async () => {
            const write = deferred<void>()
            seriesService.updateSeries.mockReturnValue(write.promise)

            await press(saveButton())
            saveButton().disabled = false // even if the button were free
            await press(saveButton())
            await press(saveButton())

            expect(seriesService.updateSeries).toHaveBeenCalledTimes(1)
        })

        it('saved: writes the name and the list, tells who shows the series, and closes', async () => {
            seriesService.updateSeries.mockResolvedValue(undefined)
            await pickOne()
            await typeInto($('input[placeholder="Series Name"]'), '  Rap &amp; more ')

            await press(saveButton())
            await settle()

            expect(seriesService.updateSeries).toHaveBeenCalledWith('s1', {
                name: 'Rap & more',
                albumQueries: [
                    'Kendrick Lamar - DAMN.',
                    { artist: 'Kendrick Lamar', title: 'To Pimp a Butterfly', appleMusicId: 'id-To Pimp a Butterfly', year: '2015', coverUrl: 'https://img/{w}x{h}.jpg' }
                ]
            })
            expect(mounted.onSeriesUpdated).toHaveBeenCalledWith('s1')
            expect(toast.success).toHaveBeenCalledWith('Series updated')
            expect(modal()).toBeNull()
        })

        it('failed: the window says so, stays open with what the person picked, and the button is free again', async () => {
            seriesService.updateSeries.mockRejectedValueOnce(new Error('permission-denied'))
            await pickOne()

            await press(saveButton())
            await settle()

            expect(modal()).not.toBeNull()
            expect($('[role="alert"]')!.textContent).toBe('The series could not be saved. Your changes are still here: you can try again.')
            expect(listed()).toEqual(['Kendrick Lamar - DAMN.', 'Kendrick Lamar - To Pimp a Butterfly'])
            expect(cardTitles()).toEqual(['To Pimp a Butterfly'])
            expect(saveButton().disabled).toBe(false)
            expect(saveButton().textContent).toBe('Save Changes')
            expect(saveButton().hasAttribute('aria-busy')).toBe(false)
            expect(mounted.onSeriesUpdated).not.toHaveBeenCalled()
            expect(window.alert).not.toHaveBeenCalled()

            seriesService.updateSeries.mockResolvedValue(undefined)
            await press(saveButton())
            await settle()

            expect(seriesService.updateSeries).toHaveBeenCalledTimes(2)
            expect(mounted.onSeriesUpdated).toHaveBeenCalledWith('s1')
            expect(modal()).toBeNull()
        })

        it('no name: nothing is written, and the window says what is missing', async () => {
            await typeInto($('input[placeholder="Series Name"]'), '   ')

            await press(saveButton())
            await settle()

            expect(seriesService.updateSeries).not.toHaveBeenCalled()
            expect($('[role="alert"]')!.textContent).toBe('Give the series a name before saving.')
            expect(modal()).not.toBeNull()
        })

        it('no database: nothing is written, and the window says the changes are still there', async () => {
            store.db = null

            await press(saveButton())
            await settle()

            expect(seriesService.updateSeries).not.toHaveBeenCalled()
            expect($('[role="alert"]')!.textContent).toContain('Nothing was saved')
        })
    })

    it('a series that does not exist: a notice, and no window', async () => {
        await press($('[data-action="close-modal"]'))

        await act(async () => { mounted.windows().openEdit('nope') })

        expect(modal()).toBeNull()
        expect(toast.error).toHaveBeenCalledWith('Series not found')
    })

    it('the window says its words in Portuguese when the site does (F81: the dictionary)', async () => {
        const { registerTexts, setLocale } = await import('../../../public/js/i18n/t.js')
        const { pt } = await import('../../../public/js/i18n/pt/index.js')
        registerTexts('pt', pt)
        window.localStorage.setItem('mjrp.lang.preview', 'pt')
        await setLocale('pt')
        try {
            await press($('[data-action="close-modal"]'))
            await act(async () => { mounted.windows().openEdit('s1') })

            expect(modal()!.querySelector('.app-modal__title')!.textContent).toBe('Editar série')
            expect(saveButton().textContent).toBe('Salvar alterações')
            expect(picker().querySelector('input')!.getAttribute('placeholder')).toContain('Digite o nome do artista')
        } finally {
            await setLocale('en')
            window.localStorage.removeItem('mjrp.lang.preview')
        }
    })
})
