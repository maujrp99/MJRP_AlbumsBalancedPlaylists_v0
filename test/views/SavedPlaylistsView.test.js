/**
 * F51 (UAT-179) - the saved playlists screen: typing in its search keeps the same field. The whole
 * page used to be redrawn on every letter, which replaced the field and took the cursor away.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../public/js/components/playlists/SavedPlaylistsController.js', () => ({
    SavedPlaylistsController: class {
        constructor() {
            this.data = [
                { series: { id: 's1', name: 'Plant', updatedAt: 2 }, batches: [{ name: 'Batch A', playlists: [{ id: 'p1', name: 'One', tracks: [] }] }] },
                { series: { id: 's2', name: 'Floyd', updatedAt: 1 }, batches: [{ name: 'Batch B', playlists: [{ id: 'p2', name: 'Two', tracks: [] }] }] }
            ]
        }
        getThumbnails() { return [] }
    }
}))
vi.mock('../../public/js/components/playlists/SavedSeriesGroup.js', () => ({
    SavedSeriesGroup: class {
        constructor({ group }) { this.group = group }
        render() {
            const node = document.createElement('section')
            node.className = 'series-group'
            node.textContent = this.group.series.name
            return node
        }
    }
}))

import { SavedPlaylistsView } from '../../public/js/views/SavedPlaylistsView.js'

describe('SavedPlaylistsView search', () => {
    let app, view
    const search = () => app.querySelector('#genericSearch')
    const groups = () => [...app.querySelectorAll('.series-group')].map(node => node.textContent)
    const type = (value) => {
        search().value = value
        search().dispatchEvent(new Event('input', { bubbles: true }))
    }

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = new SavedPlaylistsView()
        view.container = app
        view.isLoading = false
        view.update()
    })
    afterEach(() => {
        view.destroy()
        app.remove()
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

        view.update()

        expect(search()).toBe(field)
        expect(document.activeElement).toBe(field)
        expect(groups()).toEqual(['Plant'])
    })

    it('after the screen is closed, a late update draws nothing', () => {
        view.onThumbnailLoaded('s1')
        view.destroy()
        app.innerHTML = '<p id="other">another screen</p>'

        view.update()

        expect(app.innerHTML).toBe('<p id="other">another screen</p>')
    })
})
