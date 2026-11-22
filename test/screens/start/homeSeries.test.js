/**
 * F79 - the rules of the Home that explains itself, as pure functions: the name suggested from the
 * artists, the count of the series, which button carries the fire, the labels of the discography.
 */
import { describe, it, expect } from 'vitest'
import {
    suggestName, nameAfterChange, seriesCountLine, flameOf, addAllLabel, typesLine,
    dockEmptyNote, equalizerState, stageIsBig, NameState,
    barShows, guestNoticeShows, phoneHintLink
} from '../../../public/js/screens/start/homeSeries'
import { ScanStatus } from '../../../public/js/models/scanState.js'
import { defaultFilters, toggleFilter } from '../../../public/js/models/albumPicker.js'

const album = (title, artist = 'Pink Floyd') => ({ id: title, title, artist })

describe('the name suggested from the artists (D1)', () => {
    it('one artist: «<artist> selection»; two: «A and B»; three or more: «A, B and more»; none: empty', () => {
        expect(suggestName([album('Animals'), album('Meddle')])).toBe('Pink Floyd selection')
        expect(suggestName([album('Hejira', 'Joni Mitchell'), album('Close to the Edge', 'Yes')])).toBe('Joni Mitchell and Yes')
        expect(suggestName([album('Hejira', 'Joni Mitchell'), album('Fragile', 'Yes'), album('Tago Mago', 'Can')])).toBe('Joni Mitchell, Yes and more')
        expect(suggestName([])).toBe('')
    })

    it('the artists in the order they came in, each once, with plain text', () => {
        expect(suggestName([album('A', 'Yes'), album('B', 'Joni Mitchell'), album('C', 'Yes')])).toBe('Yes and Joni Mitchell')
        expect(suggestName([album('A', 'Simon &amp; Garfunkel')])).toBe('Simon & Garfunkel selection')
    })

    it('a suggested name follows the series; an edited one stays; an emptied series empties a suggestion', () => {
        const first = nameAfterChange({ name: '', state: NameState.NONE }, [album('Animals')])
        expect(first).toEqual({ name: 'Pink Floyd selection', state: NameState.SUGGESTED })

        const two = nameAfterChange(first, [album('Animals'), album('Hejira', 'Joni Mitchell')])
        expect(two).toEqual({ name: 'Pink Floyd and Joni Mitchell', state: NameState.SUGGESTED })

        const edited = { name: 'My mix', state: NameState.EDITED }
        expect(nameAfterChange(edited, [album('Hejira', 'Joni Mitchell')])).toBe(edited)

        expect(nameAfterChange(first, [])).toEqual({ name: '', state: NameState.NONE })
    })
})

describe('the count of the series', () => {
    it('says how many albums, from how many artists, and that the order counts', () => {
        expect(seriesCountLine([album('Animals')])).toBe('1 album from 1 artist · the order counts')
        expect(seriesCountLine([album('A'), album('B'), album('C', 'Yes')])).toBe('3 albums from 2 artists · the order counts')
    })
})

describe('one fire at a time (D8)', () => {
    it('«Search» while nothing was found nor chosen; then «Create series»; after creating, «Blend it now»', () => {
        expect(flameOf({ chosen: 0, results: false, created: false })).toBe('search')
        expect(flameOf({ chosen: 0, results: true, created: false })).toBe('none')
        expect(flameOf({ chosen: 2, results: true, created: false })).toBe('create')
        expect(flameOf({ chosen: 2, results: false, created: false })).toBe('create')
        expect(flameOf({ chosen: 2, results: true, created: true })).toBe('blend')
    })
})

describe('the labels of the discography', () => {
    it('«Add all» names how many and which; with some chosen, «Add the other N»; nothing left, no label', () => {
        const visible = [album('A'), album('B'), album('C')]
        expect(addAllLabel(visible, [], defaultFilters())).toBe('Add all 3 studio albums')
        expect(addAllLabel(visible, ['A'], defaultFilters())).toBe('Add the other 2')
        expect(addAllLabel(visible, ['A', 'B', 'C'], defaultFilters())).toBe('')
        expect(addAllLabel([album('A')], [], defaultFilters())).toBe('Add the 1 studio album')
        expect(addAllLabel(visible, [], toggleFilter(defaultFilters(), 'live'))).toBe('Add all 3 albums')
    })

    it('the line under the artist: how many of which type, newest first; and while the types are confirmed', () => {
        expect(typesLine(defaultFilters(), 17, false)).toBe('17 studio albums · newest first')
        expect(typesLine(defaultFilters(), 1, false)).toBe('1 studio album · newest first')
        const live = toggleFilter(toggleFilter(defaultFilters(), 'albums'), 'live')
        expect(typesLine(live, 5, false)).toBe('5 live albums · newest first')
        expect(typesLine(toggleFilter(defaultFilters(), 'eps'), 20, true)).toBe('20 albums · newest first · confirming album types…')
    })
})

describe('the empty dock says the next gesture', () => {
    it('points to the search with no covers on screen, to the covers when there are some', () => {
        expect(dockEmptyNote({ phone: false, covers: false })).toEqual({ title: 'Your series is empty', note: 'Search an artist, then click a cover to add it. You name the series at the end.' })
        expect(dockEmptyNote({ phone: false, covers: true })).toEqual({ title: 'Your series is empty', note: 'Click a cover to add it. You name the series at the end.' })
        expect(dockEmptyNote({ phone: true, covers: false })).toEqual({ title: 'No albums yet', note: 'Search, then tap a cover' })
        expect(dockEmptyNote({ phone: true, covers: true })).toEqual({ title: 'No albums yet', note: 'Tap a cover to add it' })
    })
})

describe('the equalizer and the stage (D6)', () => {
    it('moving while the catalog is asked, flat when it did not answer, still otherwise', () => {
        expect(equalizerState(ScanStatus.SCANNING)).toBe('live')
        expect(equalizerState(ScanStatus.FAILED)).toBe('flat')
        expect(equalizerState(ScanStatus.IDLE)).toBe('still')
        expect(equalizerState(ScanStatus.RESULTS)).toBe('still')
    })

    it('the big title only before anything is found; a pasted list keeps it on the computer, not on the phone', () => {
        expect(stageIsBig({ scan: ScanStatus.IDLE, paste: false, report: false, phone: false })).toBe(true)
        expect(stageIsBig({ scan: ScanStatus.EMPTY, paste: false, report: false, phone: false })).toBe(true)
        expect(stageIsBig({ scan: ScanStatus.SCANNING, paste: false, report: false, phone: false })).toBe(false)
        expect(stageIsBig({ scan: ScanStatus.RESULTS, paste: false, report: false, phone: false })).toBe(false)
        expect(stageIsBig({ scan: ScanStatus.FAILED, paste: false, report: false, phone: false })).toBe(false)
        expect(stageIsBig({ scan: ScanStatus.IDLE, paste: true, report: false, phone: false })).toBe(true)
        expect(stageIsBig({ scan: ScanStatus.IDLE, paste: true, report: true, phone: false })).toBe(false)
        expect(stageIsBig({ scan: ScanStatus.IDLE, paste: true, report: false, phone: true })).toBe(false)
    })
})

describe('the lean Start on the phone (F79, UAT-281)', () => {
    it('the series bar appears only once the first cover is chosen (or the series is saved)', () => {
        expect(barShows({ chosen: 0, created: false })).toBe(false)
        expect(barShows({ chosen: 1, created: false })).toBe(true)
        expect(barShows({ chosen: 5, created: false })).toBe(true)
        // saved: the bar says «is saved» and carries the way on, though the covers were let go
        expect(barShows({ chosen: 0, created: true })).toBe(true)
        expect(barShows({})).toBe(false)
    })

    it('the «You\'re not signed in» notice appears only for a visitor whose series has albums', () => {
        expect(guestNoticeShows({ guest: true, chosen: 0 })).toBe(false)
        expect(guestNoticeShows({ guest: true, chosen: 2 })).toBe(true)
        expect(guestNoticeShows({ guest: false, chosen: 2 })).toBe(false)
        expect(guestNoticeShows({ guest: false, chosen: 0 })).toBe(false)
    })

    it('under the field the phone has one link: «paste a list», or the way back; none when «not found» has its own', () => {
        expect(phoneHintLink({ paste: false, notFound: false })).toBe('paste')
        expect(phoneHintLink({ paste: true, notFound: false })).toBe('artist')
        expect(phoneHintLink({ paste: false, notFound: true })).toBe(null)
        expect(phoneHintLink({ paste: true, notFound: true })).toBe('artist')
    })
})
