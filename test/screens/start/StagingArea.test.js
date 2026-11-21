/**
 * F79 - the list of the series being built on the Home: in order, each album once, moved up or down
 * without dragging, taken out and put back at its place, many added at once and the list given back
 * as it was (the «Undo» of «Add all»). Every change is told once, with the list in its order.
 */
import { describe, it, expect, vi } from 'vitest'
import { StagingAreaController } from '../../../public/js/screens/start/StagingArea'

const album = (id) => ({ id, title: `Album ${id}`, artist: 'Pink Floyd' })
const ids = (list) => list.getSelectedAlbums().map(a => a.id)

describe('the series being built (F79)', () => {
    it('adds each album once, in the order chosen, and tells every change', () => {
        const onChange = vi.fn()
        const list = new StagingAreaController({ onChange })

        list.addAlbum(album('a'))
        list.addAlbum(album('b'))
        list.addAlbum(album('a'))

        expect(ids(list)).toEqual(['a', 'b'])
        expect(onChange).toHaveBeenCalledTimes(2)
        expect(onChange).toHaveBeenLastCalledWith([album('a'), album('b')])
    })

    it('moves one place up or down; past either end nothing moves', () => {
        const list = new StagingAreaController({ onChange: () => {} })
        ;['a', 'b', 'c'].forEach(id => list.addAlbum(album(id)))

        list.moveAlbum('c', -1)
        expect(ids(list)).toEqual(['a', 'c', 'b'])
        list.moveAlbum('a', -1)
        list.moveAlbum('b', 1)
        expect(ids(list)).toEqual(['a', 'c', 'b'])
    })

    it('takes an album out, gives back where it was, and puts it back at that place', () => {
        const list = new StagingAreaController({ onChange: () => {} })
        ;['a', 'b', 'c'].forEach(id => list.addAlbum(album(id)))

        const removed = list.removeAlbum('b')
        expect(removed).toEqual({ album: album('b'), index: 1 })
        expect(ids(list)).toEqual(['a', 'c'])

        list.insertAlbum(removed.album, removed.index)
        expect(ids(list)).toEqual(['a', 'b', 'c'])
        expect(list.removeAlbum('zz')).toBeNull()
    })

    it('adds many at once (each once), and restores the list as it was', () => {
        const onChange = vi.fn()
        const list = new StagingAreaController({ onChange })
        list.addAlbum(album('a'))
        const before = list.snapshot()

        const added = list.addMany([album('a'), album('b'), album('c')])
        expect(added).toBe(2)
        expect(ids(list)).toEqual(['a', 'b', 'c'])

        list.restore(before)
        expect(ids(list)).toEqual(['a'])

        list.clear()
        expect(ids(list)).toEqual([])
        expect(onChange).toHaveBeenCalledTimes(4)
    })

    it('knows whether an album is in the series, by the id of its card', () => {
        const list = new StagingAreaController({ onChange: () => {} })
        list.addAlbum({ id: 123, title: 'x' })
        expect(list.hasAlbum('123')).toBe(true)
        expect(list.hasAlbum('124')).toBe(false)
    })
})
