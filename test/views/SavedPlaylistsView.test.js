/**
 * The saved playlists screen.
 * F51 (UAT-179): typing in its search keeps the same field. The whole page used to be redrawn on
 * every letter, which replaced the field and took the cursor away.
 * F61 (UAT-186): the screen draws what the list holds now and waits for no read; each series
 * shows when its own answer arrives, a failure stays on its series, and leaving stops listening.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../public/js/services/playlists/savedPlaylistsReading.js', () => ({
    savedPlaylistsReader: {},
    savedPlaylistsStore: {}
}))

import { SavedPlaylistsView } from '../../public/js/views/SavedPlaylistsView.js'
import { SavedPlaylistsController } from '../../public/js/components/playlists/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus as Status, groupIntoBatches } from '../../public/js/models/savedPlaylists.js'

const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
const playlist = (id, batchName, tracks = [track('Song', 'Album')]) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks })

const entry = (id, name, status, playlists = null, extra = {}) => ({
    seriesId: id,
    series: { id, name, updatedAt: '2026-11-01T00:00:00Z' },
    status,
    playlists,
    batches: groupIntoBatches(playlists || []),
    thumbnails: [],
    error: null,
    refreshing: false,
    ...extra
})

describe('SavedPlaylistsView', () => {
    let app, view, store, reader

    const search = () => app.querySelector('#genericSearch')
    const groups = () => [...app.querySelectorAll('.series-group h2')].map(node => node.textContent.trim())
    const statusLine = () => app.querySelector('.saved-playlists-status').textContent.trim()
    const type = (value) => {
        search().value = value
        search().dispatchEvent(new Event('input', { bubbles: true }))
    }
    /** What the router does: draw the page, then mount it. */
    const open = async () => {
        app.appendChild(view.render())
        await view.mount()
    }
    const publish = (change) => { change(); store.flush() }

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        store = new SavedPlaylistsStore()
        reader = {
            load: vi.fn(() => new Promise(() => {})),
            refreshSeries: vi.fn(() => Promise.resolve()),
            removeBatch: vi.fn(() => Promise.resolve(1)),
            removeAll: vi.fn(() => Promise.resolve(1))
        }
        view = new SavedPlaylistsView()
        view.controller = new SavedPlaylistsController(view, { reader, store })
    })
    afterEach(() => {
        view.destroy()
        app.remove()
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

            expect(reader.load).toHaveBeenCalledTimes(1)
            expect(search()).not.toBeNull()
            expect(statusLine()).toBe('Reading your series...')
        })

        it('a series shows when its playlists arrive; the ones still loading and the empty ones are not drawn', async () => {
            await open()
            publish(() => {
                store.begin(1, 'u1')
                store.setSeries([
                    entry('s1', 'Plant', Status.LOADING),
                    entry('s2', 'Floyd', Status.LOADING),
                    entry('s3', 'Purple', Status.LOADING)
                ])
            })
            expect(groups()).toEqual([])
            expect(statusLine()).toBe('Reading playlists: 0 of 3 series')

            publish(() => store.patchEntry('s2', { status: Status.READY, playlists: [playlist('p2', 'B')], batches: groupIntoBatches([playlist('p2', 'B')]) }))
            expect(groups()).toEqual(['Floyd'])
            expect(statusLine()).toBe('Reading playlists: 1 of 3 series')

            publish(() => store.patchEntry('s3', { status: Status.EMPTY, playlists: [] }))
            publish(() => store.patchEntry('s1', { status: Status.READY, playlists: [playlist('p1', 'A')], batches: groupIntoBatches([playlist('p1', 'A')]) }))

            expect(groups()).toEqual(['Plant', 'Floyd']) // the order of the list, not the order of arrival
            expect(statusLine()).toBe('')
        })

        it('a group on screen is not drawn again when another series arrives', async () => {
            await open()
            publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.READY, [playlist('p1', 'A')]), entry('s2', 'Floyd', Status.LOADING)])
            })
            const plant = app.querySelector('.series-group')
            plant.querySelector('.batch-header').click() // the person opened a batch

            publish(() => store.patchEntry('s2', { status: Status.READY, playlists: [playlist('p2', 'B')], batches: groupIntoBatches([playlist('p2', 'B')]) }))

            expect(app.querySelector('.series-group')).toBe(plant)
            expect(plant.querySelector('.batch-group-card').dataset.collapsed).toBe('false')
        })

        it('no series has playlists: the empty state, only after every series answered', async () => {
            await open()
            publish(() => {
                store.begin(1, 'u1')
                store.setSeries([entry('s1', 'Plant', Status.LOADING)])
            })
            expect(app.querySelector('.empty-state')).toBeNull()

            publish(() => store.patchEntry('s1', { status: Status.EMPTY, playlists: [] }))

            expect(app.querySelector('.empty-state')).not.toBeNull()
        })

        it('the playlists of a batch and the tracks of a playlist are drawn when opened, not before', async () => {
            await open()
            loadTwoSeries()
            expect(app.querySelectorAll('.playlist-row')).toHaveLength(0)

            app.querySelector('.batch-header').click()
            expect(app.querySelectorAll('.playlist-row')).toHaveLength(1)
            expect(app.querySelector('.playlist-tracks-list').children).toHaveLength(0)

            app.querySelector('.playlist-row').click()
            expect(app.querySelector('.playlist-tracks-list').children).toHaveLength(1)
        })
    })

    describe('a failure stays where it happened (F61)', () => {
        it('a series whose playlists could not be read says so, with "try again", and the others stay', async () => {
            await open()
            publish(() => {
                store.begin(1, 'u1')
                store.setSeries([
                    entry('s1', 'Plant', Status.FAILED, null, { error: 'offline' }),
                    entry('s2', 'Floyd', Status.READY, [playlist('p2', 'B')])
                ])
            })

            expect(groups()).toEqual(['Plant', 'Floyd'])
            const failed = app.querySelector('.series-group[data-status="failed"]')
            expect(failed.querySelector('[role="alert"]').textContent).toContain('could not be read')

            failed.querySelector('.series-failed button').click()

            expect(reader.refreshSeries).toHaveBeenCalledWith('s1')
        })

        it('a list of series that could not be read says so, with "try again" that reads everything', async () => {
            await open()
            publish(() => {
                store.begin(1, 'u1')
                store.setListFailed('unavailable')
            })

            expect(statusLine()).toContain('Your series could not be read.')
            app.querySelector('.list-failed button').click()

            expect(reader.load).toHaveBeenLastCalledWith({ fresh: true })
        })
    })

    describe('actions', () => {
        it('Refresh reads everything again', async () => {
            await open()
            loadTwoSeries()

            app.querySelector('#genericRefresh').click()

            expect(reader.load).toHaveBeenLastCalledWith({ fresh: true })
        })

        it('deleting a batch asks the reader for that batch only, and the list redraws from the store', async () => {
            await open()
            loadTwoSeries()

            await view.controller.deleteBatch('s1', 'Batch A')
            publish(() => store.patchEntry('s1', { status: Status.EMPTY, playlists: [], batches: [] }))

            expect(reader.removeBatch).toHaveBeenCalledWith('s1', 'Batch A')
            expect(reader.load).toHaveBeenCalledTimes(1)
            expect(groups()).toEqual(['Floyd'])
        })
    })

    describe('search (F51, UAT-179)', () => {
        beforeEach(async () => {
            await open()
            loadTwoSeries()
        })

        it('typing a word letter by letter keeps the same field, with the cursor, and filters the list', () => {
            const field = search()
            field.focus()
            expect(groups()).toEqual(['Plant', 'Floyd'])

            'floyd'.split('').reduce((typed, letter) => { type(typed + letter); return typed + letter }, '')

            expect(search()).toBe(field)
            expect(document.activeElement).toBe(field)
            expect(field.value).toBe('floyd')
            expect(groups()).toEqual(['Floyd'])
        })

        it('an update from elsewhere (a cover that arrived) does not replace the field either', () => {
            const field = search()
            field.focus()
            type('pl')

            publish(() => store.patchEntry('s1', { thumbnails: ['https://covers/a.jpg'] }))

            expect(search()).toBe(field)
            expect(document.activeElement).toBe(field)
            expect(groups()).toEqual(['Plant'])
            expect(app.querySelector('.album-cascade img').getAttribute('src')).toBe('https://covers/a.jpg')
        })

        it('a search with no match says so', () => {
            type('zeppelin')

            expect(groups()).toEqual([])
            expect(app.textContent).toContain('No matches found.')
        })
    })

    describe('leaving the screen', () => {
        it('after the screen is closed it no longer listens: a late change of the list draws nothing', async () => {
            await open()
            loadTwoSeries()
            view.destroy()
            app.innerHTML = '<p id="other">another screen</p>'

            publish(() => store.patchEntry('s1', { thumbnails: ['https://covers/late.jpg'] }))
            view.update()

            expect(store.listeners.size).toBe(0)
            expect(app.innerHTML).toBe('<p id="other">another screen</p>')
        })
    })
})
