/**
 * The saved playlists screen, in React (F83 wave 1). Taken over from test/views/SavedPlaylistsView.test.js: the scaffold changes (the
 * screen is mounted the way production mounts it, every change goes through `act`), not what each test asserts. Two of the
 * assertions of the old file mean the same in other words and are said so where they are (the ones about listening).
 *
 * F51 (UAT-179): typing in its search keeps the same field. The whole page used to be redrawn on every letter, which replaced the
 * field and took the cursor away.
 * F61 (UAT-186): the screen draws what the list holds now and waits for no read; each series shows when its own answer arrives, a
 * failure stays on its series, and leaving stops listening.
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

vi.mock('../../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
const dialog = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService: dialog }))
const usage = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('../../../public/js/services/usage/track.js', () => usage)

import { SavedPlaylists } from '../../../public/js/screens/saved-playlists/SavedPlaylists'
import { SavedPlaylistsController } from '../../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus as Status, groupIntoBatches } from '../../../public/js/models/savedPlaylists.js'
import { bridgeListenerCount } from '../../../public/js/react-bridge/listeners'
import { renderScreen, itLeavesNoListeners, type RenderedScreen } from '../../support/renderScreen'
import { entry, asPhone, quietTheRouter } from '../../support/savedPlaylistsScenarios.js'

const track = (title: string, album: string, duration = 180) => ({ title, artist: 'Artist', album, duration })
const playlist = (id: string, batchName: string, tracks = [track('Song', 'Album')]) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks })

interface Reader { load: Mock; refreshSeries: Mock; removeBatch: Mock; removeAll: Mock }

describe('SavedPlaylists', () => {
    let rendered: RenderedScreen
    let store: SavedPlaylistsStore
    let reader: Reader
    let controller: SavedPlaylistsController
    let navigate: ReturnType<typeof quietTheRouter>

    const app = () => rendered.app
    const one = (selector: string) => app().querySelector(selector) as HTMLElement
    const search = () => one('#genericSearch') as HTMLInputElement
    const groups = () => [...app().querySelectorAll('.series-group h2')].map(node => node.textContent!.trim())
    const statusLine = () => app().querySelector('.saved-playlists-status')!.textContent!.trim()
    const type = (value: string) => rendered.act(() => {
        search().value = value
        search().dispatchEvent(new Event('input', { bubbles: true }))
    })
    const tap = (selector: string) => rendered.act(() => { one(selector).click() })
    const publish = (change: () => void) => rendered.act(() => { change(); store.flush() })
    const open = async () => { rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' }) }

    beforeEach(() => {
        vi.clearAllMocks()
        asPhone(false)
        navigate = quietTheRouter()
        store = new SavedPlaylistsStore()
        reader = {
            load: vi.fn(() => new Promise(() => {})),
            refreshSeries: vi.fn(() => Promise.resolve()),
            removeBatch: vi.fn(() => Promise.resolve(1)),
            removeAll: vi.fn(() => Promise.resolve(1))
        }
        controller = new SavedPlaylistsController({ reader, store })
    })
    afterEach(async () => {
        await rendered?.leave()
        document.body.innerHTML = ''
    })

    const loadTwoSeries = () => publish(() => {
        store.begin(1, 'u1')
        store.setSeries([
            entry('s1', 'Plant', Status.READY, [playlist('p1', 'Batch A')]),
            entry('s2', 'Floyd', Status.READY, [playlist('p2', 'Batch B')])
        ])
    })

    describe('the first paint does not wait for the read (F61)', () => {
        it('mount returns with the page drawn while the read is still on its way', async () => {
            await open()

            expect(reader.load).toHaveBeenCalledTimes(1) // once, though the strict mode starts every effect twice
            expect(search()).not.toBeNull()
            expect(statusLine()).toBe('Reading your series...')
        })

        it('a series shows when its playlists arrive; the ones still loading and the empty ones are not drawn', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.LOADING), entry('s2', 'Floyd', Status.LOADING), entry('s3', 'Purple', Status.LOADING)])
            })
            expect(groups()).toEqual([])
            expect(statusLine()).toBe('Reading playlists: 0 of 3 series')

            await publish(() => store.patchEntry('s2', { status: Status.READY, playlists: [playlist('p2', 'B')], batches: groupIntoBatches([playlist('p2', 'B')]) }))
            expect(groups()).toEqual(['Floyd'])
            expect(statusLine()).toBe('Reading playlists: 1 of 3 series')

            await publish(() => store.patchEntry('s3', { status: Status.EMPTY, playlists: [] }))
            await publish(() => store.patchEntry('s1', { status: Status.READY, playlists: [playlist('p1', 'A')], batches: groupIntoBatches([playlist('p1', 'A')]) }))

            expect(groups()).toEqual(['Plant', 'Floyd']) // the order of the list, not the order of arrival
            expect(statusLine()).toBe('')
        })

        it('a group on screen is not drawn again when another series arrives', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.READY, [playlist('p1', 'A')]), entry('s2', 'Floyd', Status.LOADING)])
            })
            const plant = one('.series-group')
            await tap('.batch-header') // the person opened a batch

            await publish(() => store.patchEntry('s2', { status: Status.READY, playlists: [playlist('p2', 'B')], batches: groupIntoBatches([playlist('p2', 'B')]) }))

            expect(one('.series-group')).toBe(plant)
            expect(plant.querySelector<HTMLElement>('.batch-group-card')!.dataset.collapsed).toBe('false')
        })

        it('a series whose own entry changes is drawn anew, as before: its open batch starts closed', async () => {
            await open()
            await loadTwoSeries()
            await tap('.batch-header')
            expect(one('.batch-group-card').dataset.collapsed).toBe('false')

            await publish(() => store.patchEntry('s1', { thumbnails: ['https://covers/a.jpg'] }))

            expect(one('.batch-group-card').dataset.collapsed).toBe('true')
        })

        it('no series has playlists: the empty state, only after every series answered', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.LOADING)])
            })
            expect(app().querySelector('.empty-state')).toBeNull()

            await publish(() => store.patchEntry('s1', { status: Status.EMPTY, playlists: [] }))

            expect(app().querySelector('.empty-state')).not.toBeNull()
        })

        it('the empty state sends the person to Start, and nowhere before the draw is done', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.EMPTY, [])])
            })
            await tap('.empty-state .btn-primary')
            await Promise.resolve() // the bridge hands the move to the router one microtask later
            expect(navigate).toHaveBeenCalledWith('/start', {})
        })

        it('the playlists of a batch and the tracks of a playlist are drawn when opened, not before', async () => {
            await open()
            await loadTwoSeries()
            expect(app().querySelectorAll('.playlist-row')).toHaveLength(0)

            await tap('.batch-header')
            expect(app().querySelectorAll('.playlist-row')).toHaveLength(1)
            expect(one('.playlist-tracks-list').children).toHaveLength(0)

            await tap('.playlist-row')
            expect(one('.playlist-tracks-list').children).toHaveLength(1)
        })
    })

    describe('a failure stays where it happened (F61)', () => {
        it('a series whose playlists could not be read says so, with "try again", and the others stay', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.FAILED, null, { error: 'offline' }), entry('s2', 'Floyd', Status.READY, [playlist('p2', 'B')])])
            })

            expect(groups()).toEqual(['Plant', 'Floyd'])
            const failed = one('.series-group[data-status="failed"]')
            expect(failed.querySelector('[role="alert"]')!.textContent).toContain('could not be read')

            await tap('.series-failed button')

            expect(reader.refreshSeries).toHaveBeenCalledWith('s1')
        })

        it('a list of series that could not be read says so, with "try again" that reads everything', async () => {
            await open()
            await publish(() => {
                store.begin(1, 'u1')
                store.setListFailed('unavailable')
            })

            expect(statusLine()).toContain('Your series could not be read.')
            await tap('.list-failed button')

            expect(reader.load).toHaveBeenLastCalledWith({ fresh: true })
        })
    })

    describe('actions', () => {
        it('Refresh reads everything again', async () => {
            await open()
            await loadTwoSeries()

            await tap('#genericRefresh')

            expect(reader.load).toHaveBeenLastCalledWith({ fresh: true })
        })

        it('deleting a batch asks the reader for that batch only, and the list redraws from the store', async () => {
            await open()
            await loadTwoSeries()

            await controller.deleteBatch('s1', 'Batch A')
            await publish(() => store.patchEntry('s1', { status: Status.EMPTY, playlists: [], batches: [] }))

            expect(reader.removeBatch).toHaveBeenCalledWith('s1', 'Batch A')
            expect(reader.load).toHaveBeenCalledTimes(1)
            expect(groups()).toEqual(['Floyd'])
        })

        it('the delete button asks first, in words of the dictionary, and deletes only when the answer is yes', async () => {
            dialog.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
            await open()
            await loadTwoSeries()
            await tap('.batch-header')

            await tap('[aria-label="Delete batch Batch A"]')
            expect(dialog.confirm).toHaveBeenCalledWith({
                title: 'Delete Batch?',
                message: 'Are you sure you want to delete batch "Batch A"? Contains 1 playlists.',
                confirmText: 'Delete Batch',
                variant: 'danger'
            })
            expect(reader.removeBatch).not.toHaveBeenCalled()

            await tap('[aria-label="Delete batch Batch A"]')
            await rendered.act(async () => { await Promise.resolve() })
            expect(reader.removeBatch).toHaveBeenCalledWith('s1', 'Batch A')
        })

        it('the Eye button opens the window of the playlist, and the window closes with its button', async () => {
            await open()
            await loadTwoSeries()
            await tap('.batch-header')

            await tap('.playlist-row .playlist-row-buttons button:last-child')
            const modal = document.getElementById('playlist-modal')!
            expect(modal.querySelector('.app-modal__title')!.textContent).toBe('Playlist p1')
            expect(modal.querySelectorAll('.track-row')).toHaveLength(1)

            await rendered.act(() => { modal.querySelector<HTMLElement>('.btn-secondary')!.click() })
            expect(document.getElementById('playlist-modal')).toBeNull()
        })
    })

    describe('search (F51, UAT-179)', () => {
        beforeEach(async () => {
            await open()
            await loadTwoSeries()
        })

        it('typing a word letter by letter keeps the same field, with the cursor, and filters the list', async () => {
            const field = search()
            field.focus()
            expect(groups()).toEqual(['Plant', 'Floyd'])

            let typed = ''
            for (const letter of 'floyd') {
                typed += letter
                await type(typed)
            }

            expect(search()).toBe(field)
            expect(document.activeElement).toBe(field)
            expect(field.value).toBe('floyd')
            expect(groups()).toEqual(['Floyd'])
        })

        it('an update from elsewhere (a cover that arrived) does not replace the field either', async () => {
            const field = search()
            field.focus()
            await type('pl')

            await publish(() => store.patchEntry('s1', { thumbnails: ['https://covers/a.jpg'] }))

            expect(search()).toBe(field)
            expect(document.activeElement).toBe(field)
            expect(groups()).toEqual(['Plant'])
            expect(one('.album-cascade img').getAttribute('src')).toBe('https://covers/a.jpg')
        })

        it('a search with no match says so', async () => {
            await type('zeppelin')

            expect(groups()).toEqual([])
            expect(app().textContent).toContain('No matches found.')
        })

        it('a filter that is used is counted by the measurement of use, with the name of the filter and nothing of the person', async () => {
            await type('floyd')
            expect(usage.track).toHaveBeenCalledWith('filter_used', expect.objectContaining({ screen: 'saved_playlists' }))
        })
    })

    describe('leaving the screen', () => {
        it('after the screen is closed it no longer listens: a late change of the list draws nothing', async () => {
            await open()
            await loadTwoSeries()
            await rendered.leave()
            const other = document.createElement('div')
            other.id = 'app'
            other.innerHTML = '<p id="other">another screen</p>'
            document.body.appendChild(other)

            await publish(() => store.patchEntry('s1', { thumbnails: ['https://covers/late.jpg'] }))

            // the old test said «the store has no listener left»; the bridge keeps one fixed listener on each store it met
            // (by design, proposal § 4.3), so the same fact is said by the count of the screens' listeners
            expect(bridgeListenerCount()).toBe(0)
            expect(other.innerHTML).toBe('<p id="other">another screen</p>')
            other.remove()
        })
    })
})

// The test every screen in React has (everyScreenHasTheLeaveTest): five visits leave nothing of the screen listening.
describe('the leave test of the saved playlists screen', () => {
    beforeEach(() => { asPhone(false) })
    const store = new SavedPlaylistsStore()
    const reader = { load: () => new Promise<void>(() => {}), refreshSeries: () => Promise.resolve(), removeBatch: () => Promise.resolve(1), removeAll: () => Promise.resolve(1) }
    itLeavesNoListeners('SavedPlaylists', SavedPlaylists, { controller: new SavedPlaylistsController({ reader, store }) }, { screen: 'saved_playlists' })
})
