/**
 * F82 TASK-14 (REQ-08, REQ-09): the Painel's save as pure functions. `rev` is the stored one plus one, `previous` holds the
 * old value ONLY of the keys this save changed (it covers the last save alone), and the conflict between two devices is
 * told key by key: what this device had read, what the other saved, what this one wants.
 */
import { describe, it, expect } from 'vitest'
import { buildTextsSave, findTextConflicts } from '../../../shared/content/textsSave.js'

describe('the document a save writes (REQ-08)', () => {
    it('the first save is rev 1, and previous says the keys were not published', () => {
        expect(buildTextsSave(null, { 'a.title': 'Álbuns' })).toEqual({
            data: { _schemaVersion: 1, rev: 1, texts: { 'a.title': 'Álbuns' }, previous: { 'a.title': null } },
            changed: ['a.title']
        })
    })

    it('a save that changes three texts keeps the earlier value of those three only, and rev goes up one', () => {
        const live = { _schemaVersion: 1, rev: 6, texts: { a: 'A', b: 'B', c: 'C', d: 'D' }, previous: { z: 'old' } }
        const { data, changed } = buildTextsSave(live, { a: 'A2', b: 'B2', c: 'C2', d: 'D' })
        expect(changed).toEqual(['a', 'b', 'c'])
        expect(data).toEqual({ _schemaVersion: 1, rev: 7, texts: { a: 'A2', b: 'B2', c: 'C2', d: 'D' }, previous: { a: 'A', b: 'B', c: 'C' } })
        expect(live.texts.a).toBe('A')
    })

    it('a second save drops the previous of the first', () => {
        const first = buildTextsSave({ rev: 1, texts: { a: 'A' } }, { a: 'A2' }).data
        const second = buildTextsSave(first, { b: 'B' }).data
        expect(second.previous).toEqual({ b: null })
        expect(second.rev).toBe(3)
    })

    it('null takes a key out of the published document; taking out what is not there changes nothing', () => {
        const { data, changed } = buildTextsSave({ rev: 2, texts: { a: 'A', b: 'B' } }, { a: null, x: null })
        expect(changed).toEqual(['a'])
        expect(data.texts).toEqual({ b: 'B' })
        expect(data.previous).toEqual({ a: 'A' })
    })

    it('nothing changed: nothing to save', () => {
        expect(buildTextsSave({ rev: 2, texts: { a: 'A' } }, { a: 'A' }).changed).toEqual([])
    })

    it('never lowers the version of the shape, and keeps no field it does not know', () => {
        const { data } = buildTextsSave({ _schemaVersion: 3, rev: 1, texts: {}, strange: true }, { a: 'A' })
        expect(data._schemaVersion).toBe(3)
        expect(Object.keys(data).sort()).toEqual(['_schemaVersion', 'previous', 'rev', 'texts'])
    })

    it('an edit that is not a text nor null is an error of who called', () => {
        expect(() => buildTextsSave(null, { a: 3 })).toThrow(/"a"/)
    })
})

describe('the conflict between two devices (REQ-09)', () => {
    it('the same key changed elsewhere to another value: as it was read, the other, yours', () => {
        expect(findTextConflicts({ loaded: { a: 'A' }, live: { a: 'A-other' }, edits: { a: 'A-mine' } }))
            .toEqual([{ key: 'a', loaded: 'A', other: 'A-other', yours: 'A-mine' }])
    })

    it('another key changed elsewhere: no conflict', () => {
        expect(findTextConflicts({ loaded: { a: 'A', b: 'B' }, live: { a: 'A', b: 'B-other' }, edits: { a: 'A-mine' } })).toEqual([])
    })

    it('both wrote the same value: no conflict', () => {
        expect(findTextConflicts({ loaded: { a: 'A' }, live: { a: 'same' }, edits: { a: 'same' } })).toEqual([])
    })

    it('published, removed and missing are told with null', () => {
        expect(findTextConflicts({ loaded: {}, live: { a: 'A-other' }, edits: { a: 'A-mine' } }))
            .toEqual([{ key: 'a', loaded: null, other: 'A-other', yours: 'A-mine' }])
        expect(findTextConflicts({ loaded: { a: 'A' }, live: {}, edits: { a: 'A-mine' } }))
            .toEqual([{ key: 'a', loaded: 'A', other: null, yours: 'A-mine' }])
        expect(findTextConflicts({ loaded: { a: 'A' }, live: { a: 'A-other' }, edits: { a: null } }))
            .toEqual([{ key: 'a', loaded: 'A', other: 'A-other', yours: null }])
        expect(findTextConflicts({ loaded: { a: 'A' }, live: {}, edits: { a: null } })).toEqual([])
    })
})
