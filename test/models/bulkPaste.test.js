/**
 * F63 (UAT-201) - a pasted list of albums: one parser for a line, a table of cases, and what the
 * screen says about the lines that did not go in. All pure: no DOM, no network.
 */
import { describe, it, expect } from 'vitest'
import { parsePastedAlbumLine, parseAlbumQuery, PastedLineProblem } from '../../public/js/models/albumQuery.js'
import { readPastedList, bulkInputState, bulkOutcome, toStagedAlbum, SkipReason } from '../../public/js/models/bulkPaste.js'

describe('parsePastedAlbumLine: a line is "Artist - Album"', () => {
    const READ = [
        // line, artist, album, what the case is
        ['Pink Floyd - Animals', 'Pink Floyd', 'Animals', 'the plain case'],
        ['Jay-Z - The Blueprint', 'Jay-Z', 'The Blueprint', 'hyphen in the artist'],
        ['Alt-J - An Awesome Wave', 'Alt-J', 'An Awesome Wave', 'hyphen in the artist'],
        ['Blink-182 - Enema of the State', 'Blink-182', 'Enema of the State', 'hyphen and number in the artist'],
        ['a-ha - Hunting High and Low', 'a-ha', 'Hunting High and Low', 'hyphen in a lower-case artist'],
        ['AC/DC - Back in Black', 'AC/DC', 'Back in Black', 'slash in the artist'],
        ['Artist - Album - Deluxe', 'Artist', 'Album - Deluxe', 'only the first " - " separates'],
        ['Bob Dylan - Blood on the Tracks - 50th Anniversary - Remaster', 'Bob Dylan', 'Blood on the Tracks - 50th Anniversary - Remaster', 'several " - " in the album'],
        ['The Go-Betweens - 16 Lovers Lane', 'The Go-Betweens', '16 Lovers Lane', 'hyphen inside a longer artist name'],
        ['Kanye West - Late Registration (Re-Mastered)', 'Kanye West', 'Late Registration (Re-Mastered)', 'hyphen in the album'],
        ['Sigur Rós - ( )', 'Sigur Rós', '( )', 'an album that is only punctuation'],
        ['  Wilco  -  Yankee Hotel Foxtrot  ', 'Wilco', 'Yankee Hotel Foxtrot', 'spaces around'],
        ['Beyoncé – Lemonade', 'Beyoncé', 'Lemonade', 'en dash as the separator'],
        ['Radiohead — OK Computer', 'Radiohead', 'OK Computer', 'em dash as the separator'],
        ['Wilco\tSummerteeth', 'Wilco', 'Summerteeth', 'a tab as the separator (pasted from a sheet)'],
        ['1. Pink Floyd - Meddle', 'Pink Floyd', 'Meddle', 'a numbered list'],
        ['12) Can - Tago Mago', 'Can', 'Tago Mago', 'a numbered list with ")"'],
        ['• Neu! - Neu! 75', 'Neu!', 'Neu! 75', 'a bullet'],
        ['- Low - Things We Lost in the Fire', 'Low', 'Things We Lost in the Fire', 'a hyphen as the bullet'],
        ['10cc - Sheet Music', '10cc', 'Sheet Music', 'an artist that starts with a number is not a list number'],
        ['311 - Music', '311', 'Music', 'an artist that is a number'],
        ['Jay-Z- The Blueprint', 'Jay-Z', 'The Blueprint', 'the space missing before the separator'],
        ['Jay-Z -The Blueprint', 'Jay-Z', 'The Blueprint', 'the space missing after the separator'],
        ['Simon &amp; Garfunkel - Bookends', 'Simon & Garfunkel', 'Bookends', 'an HTML entity is read as text']
    ]

    it.each(READ)('%j is read as artist %j, album %j (%s)', (line, artist, title) => {
        expect(parsePastedAlbumLine(line)).toEqual({ ok: true, artist, title })
    })

    const REFUSED = [
        ['Jay-Z-The Blueprint', PastedLineProblem.NO_SEPARATOR, 'no space around any hyphen: where the artist ends is a guess'],
        ['Animals', PastedLineProblem.NO_SEPARATOR, 'one name only'],
        ['Wish You Were Here (1975)', PastedLineProblem.NO_SEPARATOR, 'no hyphen at all'],
        ['Pink Floyd - ', PastedLineProblem.NO_ALBUM, 'the separator and nothing after it'],
        ['Pink Floyd –', PastedLineProblem.NO_ALBUM, 'a dash and nothing after it'],
        ['', PastedLineProblem.BLANK, 'an empty line'],
        ['   \t ', PastedLineProblem.BLANK, 'only spaces']
    ]

    it.each(REFUSED)('%j is refused: %s (%s)', (line, problem) => {
        expect(parsePastedAlbumLine(line)).toEqual({ ok: false, problem })
    })

    it('reads a plain "Artist - Album" exactly as parseAlbumQuery does (one definition)', () => {
        READ.slice(0, 8).forEach(([line]) => {
            const { artist, title } = parsePastedAlbumLine(line)
            expect({ artist, title }).toEqual(parseAlbumQuery(line))
        })
    })
})

describe('readPastedList', () => {
    it('reads the good lines and reports the bad ones by their number in the box, blank lines counted', () => {
        const text = 'Jay-Z - The Blueprint\n\nAnimals\nAlt-J - An Awesome Wave\nPink Floyd - \n'

        const { entries, skipped } = readPastedList(text)

        expect(entries).toEqual([
            { line: 1, text: 'Jay-Z - The Blueprint', artist: 'Jay-Z', title: 'The Blueprint' },
            { line: 4, text: 'Alt-J - An Awesome Wave', artist: 'Alt-J', title: 'An Awesome Wave' }
        ])
        expect(skipped).toEqual([
            { line: 3, text: 'Animals', reason: SkipReason.NO_SEPARATOR },
            { line: 5, text: 'Pink Floyd -', reason: SkipReason.NO_ALBUM }
        ])
    })

    it('nothing pasted is nothing read (Windows line ends included)', () => {
        expect(readPastedList('')).toEqual({ entries: [], skipped: [] })
        expect(readPastedList('  \r\n \r\n')).toEqual({ entries: [], skipped: [] })
        expect(readPastedList(undefined)).toEqual({ entries: [], skipped: [] })
        expect(readPastedList('Can - Tago Mago\r\nNeu! - Neu! 75\r\n').entries.map(entry => entry.title)).toEqual(['Tago Mago', 'Neu! 75'])
    })
})

describe('bulkInputState: the colour of the box while the person types', () => {
    it.each([
        ['', 'empty'],
        [' \n ', 'empty'],
        ['Jay-Z - The Blueprint\nAlt-J - An Awesome Wave', 'valid'],
        ['Jay-Z - The Blueprint\nAnimals', 'invalid'],
        ['Jay-Z-The Blueprint', 'invalid']
    ])('%j is %s', (text, state) => {
        expect(bulkInputState(text)).toBe(state)
    })
})

describe('bulkOutcome: what the screen says after Process List', () => {
    const skippedLine = (line, text, reason) => ({ line, text, reason })

    it('every line went in: success, no report, nothing left in the box', () => {
        expect(bulkOutcome({ added: 3, skipped: [] })).toEqual({
            tone: 'success', message: 'Added 3 albums.', report: [], leftInBox: ''
        })
        expect(bulkOutcome({ added: 1, skipped: [] }).message).toBe('Added 1 album.')
    })

    it('some lines were skipped: a warning, each line with its number, its text and why, in the order of the box', () => {
        const outcome = bulkOutcome({
            added: 2,
            skipped: [
                skippedLine(5, 'Rush - Nope', SkipReason.NOT_FOUND),
                skippedLine(2, 'Animals', SkipReason.NO_SEPARATOR)
            ]
        })

        expect(outcome.tone).toBe('warning')
        expect(outcome.message).toBe('Added 2 albums. 2 lines were skipped: see the list under the box.')
        expect(outcome.report).toEqual([
            { line: 2, text: 'Animals', why: 'no " - " between the artist and the album' },
            { line: 5, text: 'Rush - Nope', why: 'not found in the catalog' }
        ])
        expect(outcome.leftInBox).toBe('Animals\nRush - Nope')
    })

    it('no line went in: an error that still says which lines and why', () => {
        const outcome = bulkOutcome({ added: 0, skipped: [skippedLine(1, 'Pink Floyd -', SkipReason.NO_ALBUM)] })

        expect(outcome.tone).toBe('error')
        expect(outcome.message).toBe('No album was added. 1 line was skipped: see the list under the box.')
        expect(outcome.report).toEqual([{ line: 1, text: 'Pink Floyd -', why: 'the album name is missing' }])
    })

    it('a search that failed and an album already selected each have their own words; only what can be fixed stays in the box', () => {
        const outcome = bulkOutcome({
            added: 1,
            skipped: [
                skippedLine(1, 'Can - Tago Mago', SkipReason.SEARCH_FAILED),
                skippedLine(2, 'Neu! - Neu! 75', SkipReason.ALREADY_SELECTED)
            ]
        })

        expect(outcome.report.map(item => item.why)).toEqual([
            'the catalog search failed: try this line again',
            'already in the selection'
        ])
        expect(outcome.leftInBox).toBe('Can - Tago Mago')
    })
})

describe('toStagedAlbum: the catalog match as the selection keeps it', () => {
    it('fills the cover size and keeps the template', () => {
        const match = { id: '42', title: 'Animals', artist: 'Pink Floyd', year: 1977, coverUrl: 'https://img/{w}x{h}.jpg' }

        expect(toStagedAlbum(match)).toEqual({
            id: '42', title: 'Animals', artist: 'Pink Floyd', year: 1977, appleMusicId: '42',
            coverUrl: 'https://img/300x300.jpg', artworkTemplate: 'https://img/{w}x{h}.jpg'
        })
    })

    it('an album with no cover has none', () => {
        expect(toStagedAlbum({ id: '1', title: 'T', artist: 'A' }).coverUrl).toBeNull()
    })
})
