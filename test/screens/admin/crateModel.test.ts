/**
 * F82 TASK-04 (REQ-03): the crate of the entry page as the Painel works on it, as plain data: the two sides with the front
 * record first, each move the owner can make, the limits of a side, and what a save will change.
 */
import { describe, it, expect } from 'vitest'
import { added, canTake, changesOf, countState, holds, moved, removed, sentAcross, type Album, type Sides } from '../../../public/js/screens/admin/crateModel'

const album = (id: number): Album => ({ id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990, art: `Music1/v4/${id}/c.jpg`, href: `https://music.apple.com/us/album/a/${id}` })
const side = (from: number, count: number): Album[] => Array.from({ length: count }, (_, i) => album(from + i))
const ids = (list: Album[]) => list.map((entry) => entry.id).join(' ')
const crate = (): Sides => ({ a: side(1, 6), b: side(20, 4) })

describe('the moves', () => {
    it('up and down change the place inside a side; past an end nothing changes', () => {
        expect(ids(moved(crate(), 'a', 2, 1).a)).toBe('1 3 2 4 5 6')
        expect(ids(moved(crate(), 'a', 2, 3).a)).toBe('1 2 4 3 5 6')
        const same = crate()
        expect(moved(same, 'a', 0, -1)).toBe(same)
        expect(moved(same, 'b', 3, 4)).toBe(same)
    })

    it('an album goes to the back of the other side', () => {
        const next = sentAcross(crate(), 'a', 1)
        expect(ids(next.a)).toBe('1 3 4 5 6')
        expect(ids(next.b)).toBe('20 21 22 23 2')
    })

    it('an album is removed; one is added at the back of a side', () => {
        expect(ids(removed(crate(), 'b', 0).b)).toBe('21 22 23')
        expect(ids(added(crate(), 'b', album(99)).b)).toBe('20 21 22 23 99')
    })

    it('the same album is never twice in the crate, and a full side takes no more', () => {
        const now = crate()
        expect(holds(now, '21')).toBe(true)
        expect(added(now, 'a', album(21))).toBe(now)
        const full: Sides = { a: side(1, 10), b: side(20, 4) }
        expect(canTake(full, 'a')).toBe(false)
        expect(canTake(full, 'b')).toBe(true)
        expect(added(full, 'a', album(99))).toBe(full)
        expect(sentAcross(full, 'b', 0)).toBe(full)
    })
})

describe('the limits of a side', () => {
    it('side A holds 6 to 10 albums and side B 4 to 10', () => {
        expect(countState({ a: side(1, 5), b: side(20, 4) })).toEqual({ a: 'few', b: 'ok' })
        expect(countState({ a: side(1, 6), b: side(20, 3) })).toEqual({ a: 'ok', b: 'few' })
        expect(countState({ a: side(1, 11), b: side(20, 11) })).toEqual({ a: 'many', b: 'many' })
    })
})

describe('what a save changes', () => {
    it('says the albums that come in, the ones that go out, and whether the order or the side of the others changed', () => {
        const saved = crate()
        expect(changesOf(saved, saved)).toEqual({ added: [], removed: [], moved: false })
        const next = added(removed(saved, 'a', 0), 'b', album(99))
        expect(changesOf(saved, next)).toEqual({ added: ['Album 99'], removed: ['Album 1'], moved: false })
        expect(changesOf(saved, moved(saved, 'a', 0, 1))).toEqual({ added: [], removed: [], moved: true })
        expect(changesOf(saved, sentAcross(saved, 'a', 0))).toEqual({ added: [], removed: [], moved: true })
    })
})
