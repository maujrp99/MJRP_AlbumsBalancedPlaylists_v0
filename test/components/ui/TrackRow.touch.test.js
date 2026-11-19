/**
 * F63 (UAT-13) - the actions of a track (the X that removes it from a playlist) are reachable
 * without a mouse: they are hidden only where the device can hover, and they show when the
 * keyboard focus is on them. What this cannot prove is how it looks: that is the browser's.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../public/js/components/Icons.js', () => ({ getIcon: () => '<svg></svg>' }))

import { TrackRow } from '../../../public/js/components/ui/TrackRow.js'
import { PlaylistGrid } from '../../../public/js/components/playlists/PlaylistGrid.js'

const track = { id: 't1', title: 'Dogs', artist: 'Pink Floyd', duration: 1024 }
const classesOf = (element) => element.className.split(/\s+/)

describe('TrackRow actions on touch (F63, UAT-13)', () => {
    const row = () => TrackRow.render({
        track, index: 1, playlistIndex: 0, trackIndex: 0,
        actions: [{ icon: 'X', label: 'Remove Track', action: 'remove-track' }]
    })
    const actions = (element) => element.querySelector('[data-action="remove-track"]').parentElement

    it('the actions are not hidden for everybody: only where there is a mouse to hover with', () => {
        const classes = classesOf(actions(row()))

        expect(classes).not.toContain('opacity-0')
        expect(classes).not.toContain('group-hover:opacity-100')
        expect(classes).toContain('[@media(hover:hover)]:opacity-0')
        expect(classes).toContain('[@media(hover:hover)]:group-hover:opacity-100')
    })

    it('they show when the keyboard focus is on one of them', () => {
        expect(classesOf(actions(row()))).toContain('focus-within:opacity-100')
    })

    it('the button has a name for who does not see the icon', () => {
        const button = row().querySelector('[data-action="remove-track"]')

        expect(button.getAttribute('aria-label')).toBe('Remove Track')
        expect(button.getAttribute('type')).toBe('button')
    })

    it('the X of a generated playlist is not hidden a second time by its own classes', () => {
        const html = PlaylistGrid.render({ playlists: [{ title: 'P1', tracks: [track] }], editable: true })
        const holder = document.createElement('div')
        holder.innerHTML = html
        const button = holder.querySelector('[data-action="remove-track"]')

        expect(button).not.toBeNull()
        expect(classesOf(button)).not.toContain('opacity-0')
    })
})
