/**
 * F74 (UAT-221) - the one rule that says "this track of the album and this track of a source are
 * the same track" (shared/trackIdentity.js). Every tier is tested with its real example AND with
 * the nearest title it must still refuse.
 *
 * The real albums are in test/fixtures/trackIdentity/measuredAlbums.json: the track titles Apple
 * Music writes and the track list of the BestEverAlbums page, read on 2026-11-20.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    matchTracks, compareTrackTitles, trackTextOf,
    TIERS, REASONS_EXPLAINED, DESCRIBING_NOTES, KNOWN_WRITINGS, TrackReason, TRACK_IDENTITY_RULE_VERSION
} from '../../shared/trackIdentity.js'
import { measure } from '../../scripts/measure-track-identity.mjs'

const { albums } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'test/fixtures/trackIdentity/measuredAlbums.json'), 'utf8'))
const albumNamed = (name) => albums.find(one => one.album === name)

const reasonOf = (album, source, places) => compareTrackTitles(album, source, places).reason
const same = (album, source, places) => compareTrackTitles(album, source, places).same
/** For each track of the album: the rating it gets, or null. */
const ratingsOf = (tracks, page) => matchTracks(tracks, page).map(match => (match ? match.entry.rating : null))
/** For each track of the album: the title of the entry it gets, or null. */
const titlesGiven = (tracks, entries) => matchTracks(tracks, entries).map(match => (match ? (match.entry.trackTitle ?? match.entry) : null))

describe('every reason of the track rule is explained, with an example that is true', () => {
    it('the table has every reason, once', () => {
        expect(REASONS_EXPLAINED.map(row => row.reason).sort()).toEqual(Object.values(TrackReason).sort())
    })

    it('every tier has its row, in the order the tiers are tried', () => {
        expect(REASONS_EXPLAINED.filter(row => row.same).map(row => row.reason)).toEqual(TIERS.map(tier => tier.reason))
    })

    REASONS_EXPLAINED.forEach(({ reason, same: accepted, says, example, refuses }) => {
        it(`${reason}: «${example.album}» and «${example.source}» -> ${accepted ? 'the same track' : 'not the same'}`, () => {
            expect(says.length).toBeGreaterThan(10)
            expect(compareTrackTitles(example.album, example.source, example.places)).toEqual({ same: accepted, reason })
        })

        if (refuses) {
            it(`${reason} still refuses «${refuses.album}» for «${refuses.source}»`, () => {
                expect(compareTrackTitles(refuses.album, refuses.source, refuses.places)).toEqual({ same: false, reason: refuses.refusedAs })
            })
        }
    })

    it('the header of the file lists every reason, so the table a person reads is whole', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'shared/trackIdentity.js'), 'utf8')
        const header = source.slice(0, source.indexOf('export const TRACK_IDENTITY_RULE_VERSION'))

        Object.values(TrackReason).forEach(reason => expect(header, reason).toContain(` ${reason} `))
        expect(header).toContain('HOW TO ADD A RULE')
        expect(header).toContain('WHAT IS NEVER DONE HERE')
    })

    it('the version is a whole number above zero', () => {
        expect(Number.isInteger(TRACK_IDENTITY_RULE_VERSION) && TRACK_IDENTITY_RULE_VERSION > 0).toBe(true)
    })
})

describe('first tier, same-text: brackets are read as plain words', () => {
    it.each([
        ['21st Century Schizoid Man (Including "Mirrors")', '21st Century Schizoid Man Including Mirrors'],
        ['Moonchild (Including "The Dream" and "The Illusion")', 'Moonchild Including The Dream & The Illusion'],
        ['Epitaph (Including "March for No Reason" and "Tomorrow and Tomorrow")', 'Epitaph Including March For No Reason & Tomorrow And Tomorrow'],
        ['Róisín Dubh (Black Rose): A Rock Legend', 'Roisin Dubh (Black Rose) A Rock Legend'],
        ['It\'s a Long Way to the Top (If You Wanna Rock \'N\' Roll)', 'It\'s A Long Way To The Top (If You Wanna Rock \'N\' Roll)'],
        ['S&M', 'S & M'],
        ['Sub-culture', 'Subculture'],
        ['Mr Big', 'Mr. Big'],
        ['T.N.T.', 'TNT'],
        ['What Is Home', 'What Is Home?'],
        ['And the Band Played On', 'And The Band Played On...']
    ])('«%s» is «%s»', (album, source) => {
        expect(reasonOf(album, source)).toBe(TrackReason.SAME_TEXT)
    })

    it('a letter is not swapped and a word is not dropped', () => {
        expect(same('Foxey Lady', 'Foxy Baby')).toBe(false)
        expect(same('Epitaph', 'Epitaphs')).toBe(false)
        expect(same('Do Anything You Want to Do', 'Do Anything You Want To')).toBe(false) // without the place, one word apart is not enough
    })
})

describe('second tier, same-song-described: what only describes the same recording, or is only a way of writing', () => {
    it.each([
        ['Heroes (2017 Remaster)', 'Heroes'],
        ['Heroes - 2017 Remaster', 'Heroes'],
        ['Heroes (Remastered 2017)', 'Heroes - 2017 Remaster'],
        ['Taxman (Mono)', 'Taxman'],
        ['Come Together (2019 Mix)', 'Come Together'],
        ['Foxtrot (2007 Stereo Mix)', 'Foxtrot'],
        ['Hey Joe (Album Version)', 'Hey Joe'],
        ['Recording Session Extract, Pt. 1 (Bonus Track)', 'Recording Session Extract, Part One'],
        ['Desiderium 207 (feat. Susana)', 'Desiderium 207'],
        ['Desiderium 207 (feat. Susana)', 'Desiderium 207 (Feat. Susana)'].reverse(),
        ['Minack (Armin Van Buuren vs. Ferry Corsten)', 'Minack (Vs Ferry Corsten)'],
        ['Not Giving Up On Love', 'Not Giving Up On Love (Vs Sophie Ellis Bextor)'],
        ['Moonchild (Including "The Dream" and "The Illusion")', 'Moonchild'],
        ['Larks\' Tongues In Aspic, Pt. 2', 'Larks\' Tongues In Aspic, Part Two'],
        ['Shine On You Crazy Diamond, Pts. 1-5', 'Shine On You Crazy Diamond (Parts 1-5)'],
        ['Parabol, Pt. II', 'Parabol, Part 2'],
        ['The Perfect Kiss', 'Perfect Kiss'],
        ['Foxey Lady', 'Foxy Lady'],
        ['Hey Joe (Live)', 'Hey Joe - Live']
    ])('«%s» is «%s»', (album, source) => {
        expect(same(album, source)).toBe(true)
        expect([TrackReason.SAME_TEXT, TrackReason.SAME_SONG_DESCRIBED]).toContain(reasonOf(album, source))
    })

    it('every way a note only describes has a name, a sentence and an example', () => {
        expect(DESCRIBING_NOTES.map(note => note.name)).toEqual(['mastering-or-placement', 'credit', 'parts-of-the-song'])
        DESCRIBING_NOTES.forEach(note => {
            expect(note.says.length).toBeGreaterThan(10)
            expect(note.example.length).toBeGreaterThan(10)
        })
    })

    it('every known writing has where it was seen, and reads as the same track both ways', () => {
        KNOWN_WRITINGS.forEach(({ writings, example }) => {
            expect(example.length).toBeGreaterThan(10)
            expect(same(writings[0], writings[1])).toBe(true)
            expect(same(writings[1], writings[0])).toBe(true)
        })
    })

    it('a note that says another recording is not dropped: by this tier the two are not the same', () => {
        // they are joined only by the last tier, and only when the album has no plain track (see the assignment)
        expect(reasonOf('I Talk to the Wind (Duo Version)', 'I Talk To The Wind')).toBe(TrackReason.TITLE_WITHOUT_ITS_NOTE)
        expect(reasonOf('21st Century Schizoid Man (Radio Version)', '21st Century Schizoid Man')).toBe(TrackReason.TITLE_WITHOUT_ITS_NOTE)
        expect(reasonOf('Get Where I Belong (Single Version)', 'Get Where I Belong')).toBe(TrackReason.TITLE_WITHOUT_ITS_NOTE)
        expect(reasonOf('Naked Eye (Live)', 'Naked Eye - Demo')).toBe(TrackReason.ANOTHER_RECORDING)
    })

    it('a dash that is part of the title is not a note', () => {
        expect(same('Sinner Man - Part of the Deal', 'Sinner Man')).toBe(false)
    })
})

describe('third tier, same-place-one-word-apart: the track number and one word', () => {
    const at = (albumPlace, sourcePlace) => ({ albumPlace, sourcePlace })

    it.each([
        ['My Sarah', 'Sarah', 5],
        ['Do Anything You Want to Do', 'Do Anything You Want To', 1],
        ['A Train Makes a Lonely Sound', 'A Train Still Makes A Lonely Sound', 4],
        ['Ride On Pony (BBC Session)', 'Ride On A Pony', 5]
    ])('«%s» is «%s» at track %i', (album, source, place) => {
        expect(reasonOf(album, source, at(place, place))).toBe(TrackReason.SAME_PLACE_ONE_WORD_APART)
    })

    it('not at another place, not with no place, not two words apart, not with two different notes', () => {
        expect(same('My Sarah', 'Sarah', at(5, 6))).toBe(false)
        expect(same('My Sarah', 'Sarah')).toBe(false)
        expect(same('My Dear Sarah', 'Sarah', at(5, 5))).toBe(false)
        expect(same('Sarah', 'Dancing', at(5, 5))).toBe(false)
        expect(same('Ride On Pony (BBC Session)', 'Ride On A Pony (Demo)', at(5, 5))).toBe(false)
    })
})

describe('fourth tier, medley-listed-shorter', () => {
    const apollo = albumNamed('Live At The Apollo (1962)')
    const medleyOfTheAlbum = apollo.tracks.find(title => title.startsWith('Medley'))
    const medleyOfThePage = apollo.page.find(entry => entry.trackTitle.startsWith('Medley')).trackTitle

    it('the medley of «Live At The Apollo» is the medley the page lists with every song', () => {
        expect(reasonOf(medleyOfTheAlbum, medleyOfThePage)).toBe(TrackReason.MEDLEY_LISTED_SHORTER)
    })

    it('a title that is not a medley, or that names too little, is not read as the start of another', () => {
        expect(same('Please Please Please', 'Please Please Please/You\'ve Got The Power')).toBe(false)
        expect(same('Medley', medleyOfThePage)).toBe(false)
        expect(same('Medley: Please', medleyOfThePage)).toBe(false)
    })
})

describe('the assignment is one to one: a rating goes to one track only', () => {
    it('the plain track takes the entry; the extra with a note is left with nothing', () => {
        expect(ratingsOf(
            ['I Talk to the Wind', 'I Talk to the Wind (Duo Version)'],
            [{ trackTitle: 'I Talk To The Wind', rating: 90 }]
        )).toEqual([90, null])
    })

    it('the stronger tier wins even when the weaker track comes first on the album', () => {
        expect(ratingsOf(
            ['Behind Blue Eyes (New York Record Plant Session)', 'Behind Blue Eyes'],
            [{ trackTitle: 'Behind Blue Eyes', rating: 91 }]
        )).toEqual([null, 91])
    })

    it('two tracks of the same tier: the earlier one takes the entry', () => {
        expect(ratingsOf(
            ['Thieves like Us (12" Extended)', 'Thieves like Us (Instrumental)'],
            [{ trackTitle: 'Thieves Like Us', rating: 87 }]
        )).toEqual([87, null])
        expect(ratingsOf(['All Right Now', 'All Right Now'], [{ trackTitle: 'All Right Now', rating: 77 }])).toEqual([77, null])
    })

    it('a source that lists a title twice gives one entry to each track of it', () => {
        const matches = matchTracks(['Intro', 'Song', 'Intro'], [{ trackTitle: 'Intro', rating: 70 }, { trackTitle: 'Intro', rating: 60 }])

        expect(matches.map(match => match && match.entry.rating)).toEqual([70, null, 60])
        expect(matches.map(match => match && match.index)).toEqual([0, null, 1])
    })

    it('an album that has the song only with a note gives it the entry (a live album)', () => {
        expect(ratingsOf(['I\'ll Go Crazy (Live 1962)', 'Try Me (Live 1962)'], [{ trackTitle: 'Try Me', rating: 83 }, { trackTitle: 'I\'ll Go Crazy', rating: 81 }])).toEqual([81, 83])
    })

    it('what it answers: the entry as the source gave it, its index and the reason of the tier', () => {
        const entry = { trackTitle: 'Larks\' Tongues In Aspic, Part One', rating: 86, trackNumber: 1 }

        expect(matchTracks([{ title: 'Larks\' Tongues In Aspic, Pt. 1' }, { name: 'Exiles' }], [entry])).toEqual([
            { entry, index: 0, reason: TrackReason.SAME_SONG_DESCRIBED },
            null
        ])
    })

    it('titles come as texts or in any of the fields the app and the server use; a missing one matches nothing', () => {
        expect(titlesGiven([{ title: 'One' }, { trackTitle: 'Two' }, { name: 'Three' }, {}, null, 'Four'], ['Four', { name: 'Three' }, { title: 'Two' }, { trackTitle: 'One' }, null, {}, { trackTitle: '' }]))
            .toEqual(['One', 'Two', 'Three', null, null, 'Four'].map(title => (title === null ? null : expect.anything())))
        expect(matchTracks(null, null)).toEqual([])
        expect(matchTracks(['One'], undefined)).toEqual([null])
        expect(matchTracks(['', '(Untitled)'], ['', '(untitled)']).map(Boolean)).toEqual([false, true])
    })

    it('the text of a title, for the places that only group mentions of one title', () => {
        expect(trackTextOf('Sub-culture (Substance Edit)')).toBe('subculturesubstanceedit')
        expect(trackTextOf({ trackTitle: 'One' })).toBe('one')
        expect(trackTextOf(null)).toBe('')
    })
})

describe('«In the Court of the Crimson King (Expanded Edition)», whole (UAT-221)', () => {
    const { tracks, page } = albumNamed('In the Court of the Crimson King (Expanded Edition)')

    it('the five original tracks get their rating and the three extras get none', () => {
        expect(tracks.map((title, index) => [title, ratingsOf(tracks, page)[index]])).toEqual([
            ['21st Century Schizoid Man (Including "Mirrors")', 93],
            ['I Talk to the Wind', 90],
            ['Epitaph (Including "March for No Reason" and "Tomorrow and Tomorrow")', 93],
            ['Moonchild (Including "The Dream" and "The Illusion")', 82],
            ['The Court of the Crimson King (Including "The Return of the Fire Witch" and "The Dance of the Puppets")', 93],
            ['21st Century Schizoid Man (Radio Version)', null],
            ['I Talk to the Wind (Duo Version)', null],
            ['A Man a City (Live at the Fillmore West)', null]
        ])
    })

    it('whatever the order the page is read in (the server sorts it by rating)', () => {
        const byRating = [...page].sort((a, b) => b.rating - a.rating)

        expect(ratingsOf(tracks, byRating)).toEqual(ratingsOf(tracks, page))
    })
})

describe('the albums measured for F74: how many tracks get a rating', () => {
    const results = measure()
    const of = (name) => results.find(result => result.album === name)

    it.each([
        ['In the Court of the Crimson King (Expanded Edition)', 2, 5],
        ['High Voltage', 2, 9], // the page of the edition (the International one), see scraperEdition.test.js
        ['Black Rose: A Rock Legend', 6, 9],
        ['Larks\' Tongues In Aspic (Expanded Edition)', 4, 6],
        ['Before the Frost... Until the Freeze', 10, 11],
        ['Are You Experienced (Deluxe Version)', 11, 11],
        // fewer than before: before, one rating was on two tracks (an extra took the original's)
        ['Mirage (Deluxe Edition)', 10, 6],
        ['Substance', 13, 12],
        ['Substance 1977-1980', 11, 10],
        ['Who\'s Next (Bonus Track Version)', 10, 9],
        ['Free Live!', 10, 8],
        // «Lost Someone (Live 1962)»: the page rates it as two tracks, «(Part 1)» and «(Part 2)»; neither is given
        ['Live At The Apollo (1962)', 7, 6]
    ])('«%s»: %i before, %i after', (name, before, after) => {
        expect([of(name).before, of(name).after]).toEqual([before, after])
    })

    it('no rating is on two tracks, in any of them', () => {
        albums.forEach(({ tracks, page, pageOfTheEdition }) => {
            const given = matchTracks(tracks, (pageOfTheEdition || { page }).page).filter(Boolean).map(match => match.index)

            expect(new Set(given).size).toBe(given.length)
        })
    })

    it('every rating of the pages reaches a track, but three that no tier can join', () => {
        const left = albums.flatMap(({ tracks, page, pageOfTheEdition }) => {
            const entries = (pageOfTheEdition || { page }).page
            const given = new Set(matchTracks(tracks, entries).filter(Boolean).map(match => match.index))
            return entries.filter((entry, index) => entry.rating !== null && !given.has(index)).map(entry => entry.trackTitle)
        })

        expect(left).toEqual(['Introduction To James Brown', 'Lost Someone (Part 1)', 'Lost Someone (Part 2)'])
    })
})
