/**
 * F57 - the "Edit Series" modal.
 * The search for albums is the one album picker, the same as the Home's (same states, same
 * filters, same card); what the modal does with a pick is add it to the series being edited.
 * Saving answers at once: the button is busy and cannot be clicked twice, a failure is said in the
 * modal and what the person picked stays. No alert().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const service = vi.hoisted(() => ({ scanArtist: vi.fn() }))
const seriesService = vi.hoisted(() => ({ updateSeries: vi.fn() }))
const store = vi.hoisted(() => ({ series: [], db: {} }))
const toast = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => seriesService }))
vi.mock('../../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getSeries: () => store.series, getDb: () => store.db, getUserId: () => 'user-1' }
}))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { SeriesEditModal } from '../../../public/js/components/series/SeriesEditModal.js'
import { HomeView } from '../../support/startHarness.js'
import { DeadlineError } from '../../../public/js/utils/deadline.js'

const album = (title, type = 'Album', releaseDate = '2015-03-15') => ({
    id: `id-${title}`, title, artist: 'Kendrick Lamar', year: releaseDate.slice(0, 4), type, releaseDate, coverUrl: 'https://img/{w}x{h}.jpg'
})
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('Edit Series modal (F57)', () => {
    let onUpdated
    const modal = () => document.getElementById('edit-series-modal')
    const $ = (selector) => modal().querySelector(selector)
    const $$ = (selector) => [...modal().querySelectorAll(selector)]
    const picker = () => $('[data-album-picker]')
    const scanButton = () => $('[data-action="scan-artist"]')
    const saveButton = () => $('[data-action="save-series"]')
    const type = (text) => { picker().querySelector('input').value = text }
    const cardTitles = () => $$('[data-picker-grid] h3').map(h => h.textContent)
    const listed = () => $$('[data-series-albums] [data-album-row]').map(row => row.textContent.replace(/x$/, ''))
    const scan = async (text, answer) => {
        service.scanArtist.mockResolvedValueOnce(answer)
        type(text)
        scanButton().click()
        await flush()
    }

    beforeEach(() => {
        store.series = [{ id: 's1', name: 'Rap', albumQueries: ['Kendrick Lamar - DAMN.'] }]
        store.db = {}
        service.scanArtist.mockReset()
        seriesService.updateSeries.mockReset()
        Object.values(toast).forEach(mock => mock.mockClear())
        onUpdated = vi.fn()
        window.alert = vi.fn()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})

        SeriesEditModal.open('s1', onUpdated)
    })

    afterEach(() => {
        modal()?.remove()
        vi.restoreAllMocks()
    })

    describe('the album picker inside it', () => {
        it('opens with the series and the picker waiting for an artist', () => {
            expect($('input[placeholder="Series Name"]').value).toBe('Rap')
            expect(listed()).toEqual(['Kendrick Lamar - DAMN.'])
            expect($('[data-picker-grid]').textContent).toContain('Search for an artist to begin scanning.')
            expect(scanButton().disabled).toBe(false)
        })

        it('has the same filter buttons as the Home, in the same order', async () => {
            // the Start screen (the old Home), in React since F83 wave 4: its chips are the ones the picker rules give
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const start = new HomeView()
            app.appendChild(await start.render({}))
            await start.mount({})
            const homeLabels = [...app.querySelectorAll('#home-toolbar [data-filter]')].map(b => [b.dataset.filter, b.querySelector('.filter-btn-text').textContent])
            start.destroy()
            app.remove()

            const modalLabels = $$('[data-album-picker] [data-filter]').map(b => [b.dataset.filter, b.querySelector('.filter-btn-text').textContent])

            expect(modalLabels).toEqual(homeLabels)
            expect(modalLabels.map(([, label]) => label)).toEqual(['Studio', 'EPs', 'Singles', 'Live', 'Compendiums', 'Other'])
        })

        it('answers the click at once: button busy and disabled, the wait in the panel', () => {
            service.scanArtist.mockReturnValue(new Promise(() => {}))
            type('kendrick lamar')

            scanButton().click()

            expect(scanButton().disabled).toBe(true)
            expect(scanButton().getAttribute('aria-busy')).toBe('true')
            expect(scanButton().textContent).toContain('Scanning…')
            expect($('[data-picker-grid]').textContent).toContain('Searching the catalog for «kendrick lamar»…')
            expect(service.scanArtist).toHaveBeenCalledWith('kendrick lamar')
        })

        it('the Enter key takes the same path as the click, and does not submit anything', async () => {
            service.scanArtist.mockResolvedValue({ albums: [album('DAMN.')], reclassified: null })
            type('kendrick lamar')
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })

            picker().querySelector('input').dispatchEvent(event)
            await flush()

            expect(event.defaultPrevented).toBe(true)
            expect(cardTitles()).toEqual(['DAMN.'])
        })

        it('results: the same cards as the Home, newest first, with the counts on the filters', async () => {
            await scan('kendrick lamar', {
                albums: [album('good kid, m.A.A.d city (Deluxe Version)', 'Album', '2012-10-22'), album('To Pimp a Butterfly'), album('The Heart Part 5 - Single', 'Single', '2022-05-08')],
                reclassified: null
            })

            expect(cardTitles()).toEqual(['To Pimp a Butterfly', 'good kid, m.A.A.d city (Deluxe Version)'])
            expect($('[data-filter="albums"] .filter-btn-count').textContent).toBe(' (2)')
            expect($('[data-filter="singles"] .filter-btn-count').textContent).toBe(' (1)')
            expect($('[data-filter="uncategorized"] .filter-btn-count').textContent).toBe('')
            expect($('[data-album-picker] [role="status"]').textContent).toBe('→ Kendrick Lamar')
            expect($$('[data-picker-grid] [data-action="pick-album"]')).toHaveLength(2)
            expect(scanButton().disabled).toBe(false)
        })

        it('a filter click shows the albums of that type', async () => {
            await scan('kendrick lamar', { albums: [album('DAMN.'), album('The Heart Part 5 - Single', 'Single')], reclassified: null })

            $('[data-filter="singles"]').click()
            $('[data-filter="albums"]').click()

            expect(cardTitles()).toEqual(['The Heart Part 5 - Single'])
            expect($('[data-filter="singles"]').getAttribute('aria-pressed')).toBe('true')
        })

        it('shows the catalog albums before the AI list arrives, then classifies them again', async () => {
            const ai = deferred()
            await scan('orbital', { albums: [album('Snivilisation'), album('Odd One')], reclassified: ai.promise })

            expect(cardTitles()).toEqual(['Snivilisation', 'Odd One'])
            expect($('[data-album-picker] [role="status"]').textContent).toContain('confirming album types…')

            ai.resolve([album('Snivilisation'), album('Odd One', 'Uncategorized')])
            await flush()

            expect(cardTitles()).toEqual(['Snivilisation'])
            expect($('[data-filter="uncategorized"] .filter-btn-count').textContent).toBe(' (1)')
        })

        it('no results: a message, not a failure', async () => {
            await scan('kendrik', { albums: [], reclassified: null })

            expect($('[data-picker-grid]').textContent).toContain('No albums found for «kendrik».')
            expect($('[data-action="scan-retry"]')).toBeNull()
        })

        it('failed by deadline: says so, with "Try again", which scans the same text', async () => {
            service.scanArtist.mockRejectedValueOnce(new DeadlineError('the catalog', 15000))
            type('kendrick lamar')
            scanButton().click()
            await flush()

            expect($('[data-picker-grid]').textContent).toContain('The catalog did not answer in 15 seconds.')
            expect(scanButton().disabled).toBe(false)
            expect(window.alert).not.toHaveBeenCalled()

            service.scanArtist.mockResolvedValue({ albums: [album('DAMN.')], reclassified: null })
            type('something else')
            $('[data-action="scan-retry"]').click()
            await flush()

            expect(service.scanArtist).toHaveBeenLastCalledWith('kendrick lamar')
            expect(cardTitles()).toEqual(['DAMN.'])
        })

        it('after the modal is closed, a late answer draws nothing and breaks nothing', async () => {
            const late = deferred()
            service.scanArtist.mockReturnValue(late.promise)
            type('kendrick lamar')
            scanButton().click()
            const grid = $('[data-picker-grid]')

            $('[data-action="close-modal"]').click()
            late.resolve({ albums: [album('DAMN.')], reclassified: null })
            await flush()

            expect(modal()).toBeNull()
            expect(grid.textContent).not.toContain('DAMN.')
        })
    })

    describe('a pick is added to the series being edited', () => {
        it('a click on a card adds the album to the list, as the query the series stores', async () => {
            await scan('kendrick lamar', { albums: [album('To Pimp a Butterfly')], reclassified: null })

            $('[data-picker-grid] [data-action="pick-album"]').click()

            expect(listed()).toEqual(['Kendrick Lamar - DAMN.', 'Kendrick Lamar - To Pimp a Butterfly'])
            expect($('[data-series-count]').textContent).toBe('2 albums')
            expect(toast.success).toHaveBeenCalledWith('Added: To Pimp a Butterfly')
            expect(seriesService.updateSeries).not.toHaveBeenCalled()
        })

        it('an album already in the list is not added twice', async () => {
            await scan('kendrick lamar', { albums: [album('DAMN.')], reclassified: null })

            $('[data-picker-grid] [data-action="pick-album"]').click()

            expect(listed()).toEqual(['Kendrick Lamar - DAMN.'])
            expect(toast.warning).toHaveBeenCalledWith('Album already in list')
        })

        it('an album can be taken out of the list', () => {
            $('[data-series-albums] [data-action="remove-album"]').click()

            expect(listed()).toEqual([])
            expect($('[data-series-albums]').textContent).toContain('No albums yet.')
        })
    })

    describe('saving', () => {
        const pickOne = async () => {
            await scan('kendrick lamar', { albums: [album('To Pimp a Butterfly')], reclassified: null })
            $('[data-picker-grid] [data-action="pick-album"]').click()
        }

        it('answers the click at once: the button busy and disabled while the write is on its way', async () => {
            const write = deferred()
            seriesService.updateSeries.mockReturnValue(write.promise)
            await pickOne()

            saveButton().click()

            expect(saveButton().disabled).toBe(true)
            expect(saveButton().getAttribute('aria-busy')).toBe('true')
            expect(saveButton().textContent).toBe('Saving…')
            expect(modal()).not.toBeNull()
        })

        it('no double save: a second click while saving asks nothing', async () => {
            const write = deferred()
            seriesService.updateSeries.mockReturnValue(write.promise)

            saveButton().click()
            saveButton().disabled = false // even if the button were free
            saveButton().click()
            saveButton().click()

            expect(seriesService.updateSeries).toHaveBeenCalledTimes(1)
        })

        it('saved: writes the name and the list, tells who shows the series, and closes', async () => {
            seriesService.updateSeries.mockResolvedValue()
            await pickOne()
            const name = $('input[placeholder="Series Name"]')
            name.value = '  Rap &amp; more '
            name.dispatchEvent(new Event('input', { bubbles: true }))

            saveButton().click()
            await flush()

            expect(seriesService.updateSeries).toHaveBeenCalledWith('s1', {
                name: 'Rap & more',
                albumQueries: [
                    'Kendrick Lamar - DAMN.',
                    { artist: 'Kendrick Lamar', title: 'To Pimp a Butterfly', appleMusicId: 'id-To Pimp a Butterfly', year: '2015', coverUrl: 'https://img/{w}x{h}.jpg' }
                ]
            })
            expect(onUpdated).toHaveBeenCalledWith('s1')
            expect(toast.success).toHaveBeenCalledWith('Series updated')
            expect(modal()).toBeNull()
        })

        it('failed: the modal says so, stays open with what the person picked, and the button is free again', async () => {
            seriesService.updateSeries.mockRejectedValueOnce(new Error('permission-denied'))
            await pickOne()

            saveButton().click()
            await flush()

            expect(modal()).not.toBeNull()
            expect($('[role="alert"]').textContent).toBe('The series could not be saved. Your changes are still here: you can try again.')
            expect(listed()).toEqual(['Kendrick Lamar - DAMN.', 'Kendrick Lamar - To Pimp a Butterfly'])
            expect(cardTitles()).toEqual(['To Pimp a Butterfly'])
            expect(saveButton().disabled).toBe(false)
            expect(saveButton().textContent).toBe('Save Changes')
            expect(saveButton().hasAttribute('aria-busy')).toBe(false)
            expect(onUpdated).not.toHaveBeenCalled()
            expect(window.alert).not.toHaveBeenCalled()

            seriesService.updateSeries.mockResolvedValue()
            saveButton().click()
            await flush()

            expect(seriesService.updateSeries).toHaveBeenCalledTimes(2)
            expect(onUpdated).toHaveBeenCalledWith('s1')
            expect(modal()).toBeNull()
        })

        it('no name: nothing is written, and the modal says what is missing', async () => {
            const name = $('input[placeholder="Series Name"]')
            name.value = '   '
            name.dispatchEvent(new Event('input', { bubbles: true }))

            saveButton().click()
            await flush()

            expect(seriesService.updateSeries).not.toHaveBeenCalled()
            expect($('[role="alert"]').textContent).toBe('Give the series a name before saving.')
            expect(modal()).not.toBeNull()
        })

        it('no database: nothing is written, and the modal says the changes are still there', async () => {
            store.db = null

            saveButton().click()
            await flush()

            expect(seriesService.updateSeries).not.toHaveBeenCalled()
            expect($('[role="alert"]').textContent).toContain('Nothing was saved')
        })
    })

    it('a series that does not exist: a notice, and no modal', () => {
        modal().remove()

        SeriesEditModal.open('nope', onUpdated)

        expect(modal()).toBeNull()
        expect(toast.error).toHaveBeenCalledWith('Series not found')
    })
})
