/**
 * F77, REQ-02, and F83 wave 1: the filters of the saved playlists are measured once per choice (the series and the batch chosen,
 * never their names; a search when it starts). Taken over from the block «filter_used on the saved playlists» of
 * test/services/usage/eventsOfLinksFiltersAndAccount.test.js: that test called the hand-made view's method on a stand-in; this
 * one uses the screen itself, with the real port of the measurement and a recorder (the shared list checks every event).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
vi.mock('../../../public/js/services/DialogService.js', () => ({ dialogService: { confirm: vi.fn(() => Promise.resolve(false)) } }))

import { SavedPlaylists } from '../../../public/js/screens/saved-playlists/SavedPlaylists'
import { SavedPlaylistsController } from '../../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus as Status } from '../../../public/js/models/savedPlaylists.js'
import { recordUsage, stopRecording } from '../../helpers/usageRecorder.js'
import { renderScreen } from '../../support/renderScreen'
import { entry, asPhone } from '../../support/savedPlaylistsScenarios.js'

let sent: Array<[string, object]>

beforeEach(async () => {
    asPhone(false)
    sent = await recordUsage()
})
afterEach(() => {
    stopRecording()
    document.body.innerHTML = ''
})

describe('filter_used on the saved playlists', () => {
    it('the series and the batch chosen, never their names; a search once, when it starts', async () => {
        const store = new SavedPlaylistsStore()
        const reader = { load: () => new Promise<void>(() => {}), refreshSeries: () => Promise.resolve(), removeBatch: () => Promise.resolve(1), removeAll: () => Promise.resolve(1) }
        const controller = new SavedPlaylistsController({ reader, store })
        const rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
        await rendered.act(() => {
            store.begin(1, 'u1')
            store.setSeries([entry('sA', 'Plant', Status.READY, [{ id: 'p', name: 'P', batchName: 'My secret batch', savedAt: '2026-11-01T10:00:00Z', tracks: [] }])])
            store.flush()
        })
        const choose = (selector: string, value: string) => rendered.act(() => {
            const field = rendered.app.querySelector<HTMLSelectElement>(selector)!
            field.value = value
            field.dispatchEvent(new Event('change', { bubbles: true }))
        })
        const type = (value: string) => rendered.act(() => {
            const field = rendered.app.querySelector<HTMLInputElement>('#genericSearch')!
            field.value = value
            field.dispatchEvent(new Event('input', { bubbles: true }))
        })

        await choose('#filter-series', 'sA')
        await choose('#filter-batch', 'My secret batch')
        await type('o')
        await type('ok')

        expect(sent).toEqual([
            ['filter_used', { screen: 'saved_playlists', which: 'series' }],
            ['filter_used', { screen: 'saved_playlists', which: 'batch' }],
            ['filter_used', { screen: 'saved_playlists', which: 'search' }]
        ])
        await rendered.leave()
    })
})
