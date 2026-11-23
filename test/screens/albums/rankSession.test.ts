/**
 * The rules of the window to rank the tracks (F83 wave 5b): the order it opens in, what «changed» means, what is saved. A person's ranking is
 * their own data, so each rule is the one of the hand-made window (components/ranking/UserRankModal.js).
 */
import { describe, it, expect } from 'vitest'
import { RankSession } from '../../../public/js/screens/albums/rankSession'

const titles = (session: RankSession) => session.rankedOrder.map(track => track.title)
const album = () => ({
    title: 'T', artist: 'A',
    tracks: [{ title: 'one', position: 1 }, { title: 'two', position: 2, userRank: 2 }, { title: 'three', position: 3, userRank: 1 }, { title: 'four', position: 4 }]
})

describe('the order of the ranking window', () => {
    it('starts from the ranking the album already has: the ranked tracks by rank, the others after in the order of the record (UAT-187)', () => {
        expect(titles(new RankSession(album()))).toEqual(['three', 'two', 'one', 'four'])
    })

    it('the tracks are first put in the order of the record, whatever order they came in', () => {
        const session = new RankSession({ title: 'T', artist: 'A', tracks: [{ title: 'b', position: 2 }, { title: 'a', position: 1 }] })
        expect(titles(session)).toEqual(['a', 'b'])
    })

    it('Reset goes back to the order of the record, not to the saved ranking', () => {
        const session = new RankSession(album())
        session.reset()
        expect(titles(session)).toEqual(['one', 'two', 'three', 'four'])
    })

    it('moveTrack moves a track, clamps a place past the ends, and says whether the order changed', () => {
        const session = new RankSession({ title: 'T', artist: 'A', tracks: ['a', 'b', 'c', 'd'].map((title, i) => ({ title, position: i + 1 })) })
        expect(session.moveTrack(3, 0)).toBe(true)
        expect(titles(session)).toEqual(['d', 'a', 'b', 'c'])
        expect(session.moveTrack(1, 1)).toBe(false)
        expect(session.moveTrack(0, 99)).toBe(true)
        expect(titles(session)).toEqual(['a', 'b', 'c', 'd'])
        expect(session.moveTrack(-1, 2)).toBe(false)
        expect(session.moveTrack(9, 2)).toBe(false)
    })
})

describe('what «changed» means, and what is saved', () => {
    it('a change is measured from the order the window opened with, and from the last save', () => {
        const session = new RankSession(album())
        expect(session.hasUnsavedChanges()).toBe(false)
        session.moveTrack(0, 1)
        expect(session.hasUnsavedChanges()).toBe(true)
        session.moveTrack(1, 0)
        expect(session.hasUnsavedChanges()).toBe(false)
        session.moveTrack(0, 1)
        session.markSaved()
        expect(session.hasUnsavedChanges()).toBe(false)
    })

    it('saves every track of the order on screen, numbered from 1: a partial ranking is saved as the order left', () => {
        const session = new RankSession(album())
        expect(session.rankings()).toEqual([
            { trackTitle: 'three', userRank: 1 }, { trackTitle: 'two', userRank: 2 }, { trackTitle: 'one', userRank: 3 }, { trackTitle: 'four', userRank: 4 }
        ])
    })

    it('a track is known by its id, or by its title when it has none', () => {
        const session = new RankSession({ title: 'T', artist: 'A', tracks: [{ id: 'x1', title: 'same', position: 1 }, { id: 'x2', title: 'same', position: 2 }] })
        session.pick('x2')
        expect(session.pickedIndex()).toBe(1)
        session.pick('x2')
        expect(session.pickedIndex()).toBe(-1)
    })

    it('the undo of a reset puts the order back', () => {
        const session = new RankSession(album())
        const before = [...session.rankedOrder]
        session.reset()
        session.restore(before)
        expect(titles(session)).toEqual(['three', 'two', 'one', 'four'])
    })
})
