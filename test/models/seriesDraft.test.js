/**
 * F57 - the series being edited: what counts as an album already in the list, and what the modal
 * shows while the save is on its way and when it failed.
 */
import { describe, it, expect } from 'vitest'
import {
    SaveStatus, SaveProblem, idleSave, canSave, saveStarted, saveFailed, describeSave, problemBeforeSave, hasAlbumQuery
} from '../../public/js/models/seriesDraft.js'

describe('seriesDraft: the save', () => {
    it('idle: the button free, no message', () => {
        expect(describeSave(idleSave())).toEqual({ busy: false, confirmLabel: 'Save Changes', message: '' })
        expect(canSave(idleSave())).toBe(true)
    })

    it('saving: the button busy, and no second save may be asked', () => {
        expect(describeSave(saveStarted())).toEqual({ busy: true, confirmLabel: 'Saving…', message: '' })
        expect(canSave(saveStarted())).toBe(false)
    })

    it('failed: the button free again, and a message that says the changes are still there', () => {
        const shown = describeSave(saveFailed())

        expect(shown.busy).toBe(false)
        expect(shown.confirmLabel).toBe('Save Changes')
        expect(shown.message).toBe('The series could not be saved. Your changes are still here: you can try again.')
        expect(canSave(saveFailed())).toBe(true)
    })

    it('each problem has its message; a problem nobody listed reads as a failed write', () => {
        expect(describeSave(saveFailed(SaveProblem.NO_NAME)).message).toBe('Give the series a name before saving.')
        expect(describeSave(saveFailed(SaveProblem.NO_DATABASE)).message).toContain('Nothing was saved')
        expect(describeSave({ status: SaveStatus.FAILED, problem: 'other' }).message).toBe(describeSave(saveFailed()).message)
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
