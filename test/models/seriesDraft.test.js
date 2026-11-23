/**
 * F57 - the series being edited: what counts as an album already in the list, and where the save is
 * (the words of the window are its own, in the dictionary: test/screens/albums/SeriesEdit.test.tsx).
 */
import { describe, it, expect } from 'vitest'
import {
    SaveStatus, SaveProblem, idleSave, canSave, saveStarted, saveFailed, problemBeforeSave, hasAlbumQuery
} from '../../public/js/models/seriesDraft.js'

describe('seriesDraft: the save', () => {
    it('idle: a save may be asked', () => {
        expect(idleSave()).toEqual({ status: SaveStatus.IDLE, problem: null })
        expect(canSave(idleSave())).toBe(true)
    })

    it('saving: no second save may be asked', () => {
        expect(saveStarted()).toEqual({ status: SaveStatus.SAVING, problem: null })
        expect(canSave(saveStarted())).toBe(false)
    })

    it('failed: a save may be asked again, and the problem is kept (a write that failed unless said otherwise)', () => {
        expect(saveFailed()).toEqual({ status: SaveStatus.FAILED, problem: SaveProblem.WRITE_FAILED })
        expect(saveFailed(SaveProblem.NO_NAME).problem).toBe(SaveProblem.NO_NAME)
        expect(canSave(saveFailed())).toBe(true)
    })

    it('what stops a save before any write: no name, then no database', () => {
        expect(problemBeforeSave({ name: '   ', hasDatabase: true })).toBe(SaveProblem.NO_NAME)
        expect(problemBeforeSave({ name: undefined, hasDatabase: false })).toBe(SaveProblem.NO_NAME)
        expect(problemBeforeSave({ name: 'Rap', hasDatabase: false })).toBe(SaveProblem.NO_DATABASE)
        expect(problemBeforeSave({ name: 'Rap', hasDatabase: true })).toBeNull()
    })
})

describe('seriesDraft: an album already in the list', () => {
    const entry = { artist: 'Kendrick Lamar', title: 'DAMN.', appleMusicId: '1440881047' }

    it('the same catalog id is the same album, whatever the text', () => {
        expect(hasAlbumQuery([{ artist: 'K. Lamar', title: 'Damn', appleMusicId: '1440881047' }], entry)).toBe(true)
        expect(hasAlbumQuery([{ artist: 'Kendrick Lamar', title: 'DAMN.', appleMusicId: '999' }], entry)).toBe(false)
    })

    it('without an id on one side, the artist and the title decide', () => {
        expect(hasAlbumQuery([{ artist: 'Kendrick Lamar', title: 'DAMN.' }], entry)).toBe(true)
        expect(hasAlbumQuery([{ artist: 'Kendrick Lamar', album: 'DAMN.' }], entry)).toBe(true)
        expect(hasAlbumQuery([{ artist: 'Kendrick Lamar', title: 'GNX' }], entry)).toBe(false)
    })

    it('a query stored as text is compared as "Artist - Title"', () => {
        expect(hasAlbumQuery(['Kendrick Lamar - DAMN.'], entry)).toBe(true)
        expect(hasAlbumQuery(['Kendrick Lamar - GNX', null], entry)).toBe(false)
        expect(hasAlbumQuery(undefined, entry)).toBe(false)
    })
})
