/**
 * F79 - the pasted list in the Home's one field: each line says «ready» or why it will be skipped,
 * before the click (the rule of F63, shown earlier); after «Add», what went in and what stays to fix.
 */
import { describe, it, expect } from 'vitest'
import { checkPastedLines, pasteSummary, pasteReport } from '../../public/js/models/homePaste.js'
import { SkipReason } from '../../public/js/models/bulkPaste.js'

describe('the lines of the list, checked as they are typed', () => {
    it('each line is ready or says why; blank lines are not counted', () => {
        const lines = checkPastedLines('Joni Mitchell - Hejira\nRadiohead OK Computer\n\nYes -  ')
        expect(lines.map(line => [line.text, line.ready, line.why])).toEqual([
            ['Joni Mitchell - Hejira', true, ''],
            ['Radiohead OK Computer', false, 'add « - » between artist and album'],
            ['', false, ''],
            ['Yes -', false, 'add the album name after « - »']
        ])
        expect(lines.map(line => line.blank)).toEqual([false, false, true, false])
    })

    it('the summary counts the lines, the ready ones and the ones to fix; the button names the ready ones', () => {
        const lines = checkPastedLines('Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk')
        expect(pasteSummary(lines)).toEqual({
            text: '4 lines: 3 ready, 1 to fix. Lines to fix are skipped; the rest go in.',
            ready: 3,
            button: 'Add 3 albums'
        })
        expect(pasteSummary(checkPastedLines('Yes - Fragile'))).toMatchObject({ text: '1 line: 1 ready, 0 to fix. Lines to fix are skipped; the rest go in.', button: 'Add 1 album' })
        expect(pasteSummary(checkPastedLines(''))).toMatchObject({ ready: 0, button: 'Add albums' })
    })
})

describe('after «Add»: what went in, and what stays to fix', () => {
    it('one line skipped: it stays, with the reason, and the button sends it again', () => {
        const report = pasteReport({ added: 2, skipped: [{ line: 4, text: 'Caravan - In the Land of Grey and Pinkk', reason: SkipReason.NOT_FOUND }] })
        expect(report).toEqual({
            message: 'Added 2 albums. 1 line was skipped and is still here to fix.',
            lines: [{ text: 'Caravan - In the Land of Grey and Pinkk', why: 'not found in the catalog: fix the spelling here' }],
            button: 'Add this line',
            tone: 'warning'
        })
    })

    it('a line already in the series is said, and does not stay', () => {
        const report = pasteReport({ added: 1, skipped: [{ line: 1, text: 'Can - Tago Mago', reason: SkipReason.ALREADY_SELECTED }] })
        expect(report).toMatchObject({ message: 'Added 1 album. 1 line was already in your series.', lines: [], tone: 'success' })
    })

    it('nothing went in: says so; the lines to fix stay with their reasons, in the order of the list', () => {
        const report = pasteReport({ added: 0, skipped: [
            { line: 2, text: 'Broken - Line', reason: SkipReason.SEARCH_FAILED },
            { line: 1, text: 'Nobody - Nothing', reason: SkipReason.NOT_FOUND }
        ] })
        expect(report).toEqual({
            message: 'No album was added. 2 lines were skipped and are still here to fix.',
            lines: [
                { text: 'Nobody - Nothing', why: 'not found in the catalog: fix the spelling here' },
                { text: 'Broken - Line', why: 'the catalog did not answer: try this line again' }
            ],
            button: 'Add these 2 lines',
            tone: 'error'
        })
    })

    it('every line went in: a plain sentence, nothing left', () => {
        expect(pasteReport({ added: 3, skipped: [] })).toEqual({ message: 'Added 3 albums.', lines: [], button: '', tone: 'success' })
    })
})
