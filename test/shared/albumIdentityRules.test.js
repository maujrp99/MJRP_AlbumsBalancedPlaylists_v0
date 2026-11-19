/**
 * F68 - the identity rule reviewed: every acceptance has a name, a real example and a test.
 *
 * The examples come from the sweep of 2026-11-19 (what the ratings source really writes is saved
 * under test/fixtures/besteveralbums/). Each rule is tested with its example AND with the nearest
 * album it must still refuse. test/shared/albumIdentity.test.js keeps the behaviours of F55.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    compareAlbumIdentity, compareKeptAlbum, compareOnlyAnswer, pickAlbum, sameArtist,
    titleWithoutEditionNotes, titlesToSearch,
    ARTIST_EQUIVALENCES, SECOND_TIER_RULES, REASONS_EXPLAINED, KNOWN_WRITINGS, IDENTITY_RULE_VERSION, Verdict, Reason
} from '../../shared/albumIdentity.js'

const verdictOf = (asked, candidate) => compareAlbumIdentity(asked, candidate).verdict
const by = (artist) => (title) => ({ artist, title })
const alone = (reason) => ({ verdict: Verdict.SAME_IF_ALONE, same: false, reason })

describe('every reason of the rule is explained, with an example that is true', () => {
    it('the table has every reason, once', () => {
        expect(REASONS_EXPLAINED.map(row => row.reason).sort()).toEqual(Object.values(Reason).sort())
    })

    REASONS_EXPLAINED.forEach(({ reason, verdict, says, example }) => {
        it(`${reason}: ${example.asked.artist || '(no artist)'} «${example.asked.title}» and «${example.candidate.title}» -> ${verdict}`, () => {
            expect(says.length).toBeGreaterThan(10)
            expect(compareAlbumIdentity(example.asked, example.candidate)).toEqual({ verdict, same: verdict === Verdict.SAME, reason })
        })
    })

    it('the header of the file lists every reason, so the table a person reads is whole', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'shared/albumIdentity.js'), 'utf8')
        const header = source.slice(0, source.indexOf('export const IDENTITY_RULE_VERSION'))

        Object.values(Reason).forEach(reason => expect(header, reason).toContain(` ${reason} `))
        expect(header).toContain('HOW TO ADD A RULE')
        expect(header).toContain('A RULE FOR ONE GENRE')
    })

    it('the version of the rule is a number a record can carry', () => {
        expect(Number.isInteger(IDENTITY_RULE_VERSION)).toBe(true)
        expect(IDENTITY_RULE_VERSION).toBeGreaterThanOrEqual(2)
    })
})

describe('the artist: each equivalence has a name and an example', () => {
    ARTIST_EQUIVALENCES.forEach(({ name, says, example, same }) => {
        it(`${name}: «${example[0]}» is «${example[1]}»`, () => {
            expect(says.length).toBeGreaterThan(10)
            expect(same(example[0], example[1])).toBe(true)
            expect(sameArtist(example[0], example[1])).toBe(true)
            expect(sameArtist(example[1], example[0])).toBe(true)
        })
    })

    it('the same names in another order are the same artist (the source writes «Jimmy Page & Robert Plant»)', () => {
        expect(sameArtist('Robert Plant & Jimmy Page', 'Jimmy Page & Robert Plant')).toBe(true)
        expect(sameArtist('Robert Plant and Jimmy Page', 'Jimmy Page, Robert Plant')).toBe(true)
        expect(sameArtist('Crosby, Stills & Nash', 'Nash, Crosby and Stills')).toBe(true)
        expect(compareAlbumIdentity(by('Robert Plant & Jimmy Page')('Walking Into Clarksdale'), by('Jimmy Page & Robert Plant')('Walking Into Clarksdale')))
            .toEqual({ verdict: Verdict.SAME, same: true, reason: Reason.EXACT_TITLE })
    })

    it('"X and the Y" is "X & The Y", with or without the "The"', () => {
        expect(sameArtist('Robert Plant & The Strange Sensation', 'Robert Plant And The Strange Sensation')).toBe(true)
        expect(sameArtist('Robert Plant & The Strange Sensation', 'Robert Plant & Strange Sensation')).toBe(true)
        expect(sameArtist('Florence + the Machine', 'Florence and the Machine')).toBe(true)
        expect(sameArtist('Tyler, The Creator', 'Tyler the Creator')).toBe(true)
    })

    it('a name that only shares names with another is another artist', () => {
        expect(sameArtist('Page & Plant', 'Jimmy Page & Robert Plant')).toBe(false)
        expect(sameArtist('Robert Plant', 'Robert Plant & The Strange Sensation')).toBe(false)
        expect(sameArtist('James Brown', 'James Brown And His Famous Flames')).toBe(false)
        expect(sameArtist('Jimmy Page & Robert Plant', 'Jimmy Page & The Black Crowes')).toBe(false)
        expect(sameArtist('Simon & Garfunkel', 'Simon')).toBe(false)
    })

    it('what is not a joiner does not split a name: «AC/DC» is one name', () => {
        expect(sameArtist('AC/DC', 'DC/AC')).toBe(false)
        expect(sameArtist('AC/DC', 'ACDC')).toBe(true)
        expect(sameArtist('Andy Summers', 'Summers Andy')).toBe(false)
    })
})

describe('the second tier is a list of named rules', () => {
    it('in this order, each with what it says and a real example', () => {
        expect(SECOND_TIER_RULES.map(rule => rule.reason)).toEqual([
            Reason.TITLE_BEFORE_SUBTITLE,
            Reason.TITLE_WITHOUT_PARENTHESES,
            Reason.TITLE_IN_PARENTHESES,
            Reason.TITLE_WITH_ARTIST_NAME,
            Reason.TITLE_WRITTEN_OTHERWISE
        ])
    })

    SECOND_TIER_RULES.forEach(({ reason, example }) => {
        describe(reason, () => {
            it('one comparison never says "the same": it waits for pickAlbum', () => {
                expect(compareAlbumIdentity(example.asked, example.candidate)).toEqual(alone(reason))
            })

            it('alone among the candidates of a source, it is picked and the verdict keeps the reason', () => {
                const other = { artist: example.candidate.artist, title: 'Some Other Album' }
                const picked = pickAlbum(example.asked, [other, example.candidate])

                expect(picked).toMatchObject({ found: true, index: 1, verdict: { verdict: Verdict.SAME, same: true, reason } })
            })

            it('it never competes with the album as asked for', () => {
                const exact = { artist: example.asked.artist, title: example.asked.title }

                expect(pickAlbum(example.asked, [example.candidate, exact])).toMatchObject({ index: 1, verdict: { reason: Reason.EXACT_TITLE } })
            })

            it('the artist has to be the same, and a query with no artist has no second tier', () => {
                expect(compareAlbumIdentity(example.asked, { ...example.candidate, artist: 'Tina Turner' }).verdict).toBe(Verdict.DIFFERENT)
                expect(compareAlbumIdentity({ title: example.asked.title }, example.candidate).verdict).toBe(Verdict.DIFFERENT)
            })

            it('an album that is kept is believed only with the reason pickAlbum wrote on it', () => {
                expect(compareKeptAlbum(example.asked, example.candidate).same).toBe(false)
                expect(compareKeptAlbum(example.asked, { ...example.candidate, identityReason: reason })).toMatchObject({ same: true, reason })
                expect(compareKeptAlbum(example.asked, { ...example.candidate, identityReason: 'another-reason' }).same).toBe(false)
            })

            it('a source that answers one album to a direct question is believed, with the reason', () => {
                expect(compareOnlyAnswer(example.asked, example.candidate)).toMatchObject({ same: true, reason })
            })
        })
    })
})

describe('title-without-parentheses: the source writes more in parentheses (King Crimson)', () => {
    const crimson = by('King Crimson')
    const observation = crimson('In The Court Of The Crimson King (An Observation By King Crimson)')

    it('the title asked for, with or without its own edition note', () => {
        expect(compareAlbumIdentity(crimson('In the Court of the Crimson King'), observation).reason).toBe(Reason.TITLE_WITHOUT_PARENTHESES)
        expect(compareAlbumIdentity(crimson('In the Court of the Crimson King (Expanded Edition)'), observation).reason).toBe(Reason.TITLE_WITHOUT_PARENTHESES)
    })

    it('one direction only: the long title asked for is not the short album', () => {
        expect(verdictOf(observation, crimson('In the Court of the Crimson King'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(by('Oasis')('(What\'s the Story) Morning Glory?'), by('Oasis')('Morning Glory'))).toBe(Verdict.DIFFERENT)
    })

    it('a number in parentheses names another album: it is never just "more"', () => {
        const hits = by('Elton John')

        expect(verdictOf(hits('Greatest Hits'), hits('Greatest Hits (Vol. 2)'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(hits('Greatest Hits'), hits('Greatest Hits (Volume II)'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(hits('Greatest Hits'), hits('Greatest Hits (II)'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(hits('Greatest Hits'), hits('Greatest Hits (1970-2002)'))).toBe(Verdict.DIFFERENT)
    })

    it('the rest of the title has to be the whole title asked for', () => {
        expect(verdictOf(crimson('In the Court'), observation)).toBe(Verdict.DIFFERENT)
        expect(verdictOf(crimson('Crimson King'), observation)).toBe(Verdict.DIFFERENT)
    })

    it('several albums of the artist with the title and something in parentheses: not found, the choice is the person\'s', () => {
        const weezer = by('Weezer')
        const colours = [weezer('Weezer (Blue Album)'), weezer('Weezer (Green Album)'), weezer('Weezer (Red Album)')]

        expect(pickAlbum(weezer('Weezer'), colours).found).toBe(false)
        expect(pickAlbum(weezer('Weezer'), [colours[0]])).toMatchObject({ found: true, verdict: { reason: Reason.TITLE_WITHOUT_PARENTHESES } })
        expect(pickAlbum(weezer('Weezer (Green Album)'), colours)).toMatchObject({ index: 1, verdict: { reason: Reason.EXACT_TITLE } })
    })
})

describe('title-in-parentheses: the source writes the name asked for in parentheses (Led Zeppelin IV)', () => {
    const zeppelin = by('Led Zeppelin')
    const untitled = zeppelin('Untitled (Led Zeppelin IV)')

    it('the name in parentheses or brackets is the title asked for', () => {
        expect(compareAlbumIdentity(zeppelin('Led Zeppelin IV'), untitled)).toEqual(alone(Reason.TITLE_IN_PARENTHESES))
        expect(compareAlbumIdentity(zeppelin('Led Zeppelin IV (Remastered)'), zeppelin('Untitled [Led Zeppelin IV]'))).toEqual(alone(Reason.TITLE_IN_PARENTHESES))
    })

    it('another number, or a part of the name, is another album', () => {
        expect(verdictOf(zeppelin('Led Zeppelin III'), untitled)).toBe(Verdict.DIFFERENT)
        expect(verdictOf(zeppelin('Led Zeppelin'), untitled)).toBe(Verdict.DIFFERENT)
        expect(verdictOf(zeppelin('IV'), untitled)).toBe(Verdict.DIFFERENT)
    })

    it('among the albums of the artist, only the one with the name is picked', () => {
        const albums = ['Led Zeppelin', 'Led Zeppelin II', 'Led Zeppelin III', 'Untitled (Led Zeppelin IV)', 'Houses Of The Holy'].map(zeppelin)

        expect(pickAlbum(zeppelin('Led Zeppelin IV (Remastered)'), albums)).toMatchObject({ found: true, index: 3 })
        expect(pickAlbum(zeppelin('Led Zeppelin II'), albums)).toMatchObject({ index: 1, verdict: { reason: Reason.EXACT_TITLE } })
    })

    it('an edition note in parentheses is not a name: «Core (Live)» is not asked for as «Live»', () => {
        expect(verdictOf(by('X')('Live'), by('X')('Core (Live)'))).toBe(Verdict.DIFFERENT)
    })
})

describe('title-with-artist-name: the source writes the artist in front of the title (James Brown)', () => {
    const brown = by('James Brown')

    it('«Live At The Apollo (1962)» is «James Brown Live At The Apollo»', () => {
        expect(compareAlbumIdentity(brown('Live At The Apollo (1962)'), brown('James Brown Live At The Apollo'))).toEqual(alone(Reason.TITLE_WITH_ARTIST_NAME))
    })

    it('what the source really lists for it has one album that qualifies', () => {
        const listed = [
            brown('James Brown Live At The Apollo'),
            { artist: 'James Brown And His Famous Flames', title: 'Live At The Apollo, Volume II' },
            brown('Revolution Of The Mind: Recorded Live At The Apollo, Vol. III')
        ]

        expect(pickAlbum(brown('Live At The Apollo (1962)'), listed)).toMatchObject({ found: true, index: 0 })
    })

    it('another title after the name, or the name of another artist, is another album', () => {
        expect(verdictOf(brown('Live At The Apollo'), brown('James Brown Live At The Apollo, Volume II'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(brown('Live At The Apollo'), brown('B.B. King Live At The Apollo'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(by('Led Zeppelin')('Led Zeppelin'), by('Led Zeppelin')('Led Zeppelin IV'))).toBe(Verdict.DIFFERENT)
    })
})

describe('title-written-otherwise: two writings of one album, listed one by one (KNOWN_WRITINGS)', () => {
    it('each entry says the artist, the writings and where it was seen', () => {
        KNOWN_WRITINGS.forEach(known => {
            expect(known.artist).toBeTruthy()
            expect(known.titles.length).toBeGreaterThan(1)
            expect(known.seen).toMatch(/2\d{3}-\d{2}-\d{2}/)
        })
    })

    it.each([
        ['Frank Ocean', 'Blonde', 'Blond'],
        ['AC/DC', 'POWER UP', 'PWR/UP'],
        ['Joy Division', 'Substance 1977-1980', 'Substance']
    ])('%s: «%s» is «%s», both ways, and with an edition note', (artist, one, other) => {
        expect(compareAlbumIdentity(by(artist)(one), by(artist)(other))).toEqual(alone(Reason.TITLE_WRITTEN_OTHERWISE))
        expect(compareAlbumIdentity(by(artist)(other), by(artist)(one))).toEqual(alone(Reason.TITLE_WRITTEN_OTHERWISE))
        expect(compareAlbumIdentity(by(artist)(`${one} (Deluxe Edition)`), by(artist)(other))).toEqual(alone(Reason.TITLE_WRITTEN_OTHERWISE))
    })

    it('it is a fact about one artist, not a rule of spelling', () => {
        expect(verdictOf(by('Cœur de pirate')('Blonde'), by('Cœur de pirate')('Blond'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(by('New Order')('Substance 1987'), by('New Order')('Substance'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(by('Elton John')('Greatest Hits 1970-2002'), by('Elton John')('Greatest Hits'))).toBe(Verdict.DIFFERENT)
        expect(verdictOf(by('Frank Ocean')('Blonde'), by('Frank Ocean')('Blonded'))).toBe(Verdict.DIFFERENT)
    })
})

describe('the search texts come from the rule', () => {
    it('titleWithoutEditionNotes keeps the title as written and drops only the edition notes', () => {
        expect(titleWithoutEditionNotes('Foxtrot (2007 Stereo Mix)')).toBe('Foxtrot')
        expect(titleWithoutEditionNotes('Mighty ReArranger (Bonus Tracks)')).toBe('Mighty ReArranger')
        expect(titleWithoutEditionNotes('Best of Live At the Apollo: 50th Anniversary')).toBe('Best of Live At the Apollo')
        expect(titleWithoutEditionNotes('Core - 2011 Remaster')).toBe('Core')
        expect(titleWithoutEditionNotes('Ágætis byrjun  (Remastered)')).toBe('Ágætis byrjun')
        expect(titleWithoutEditionNotes('Unreal Unearth: Unheard')).toBe('Unreal Unearth: Unheard')
        expect(titleWithoutEditionNotes('Weezer (Blue Album)')).toBe('Weezer (Blue Album)')
        expect(titleWithoutEditionNotes('Deluxe')).toBe('Deluxe')
        expect(titleWithoutEditionNotes('(Deluxe)')).toBe('(Deluxe)')
        expect(titleWithoutEditionNotes(undefined)).toBe('')
    })

    it('titlesToSearch: the title without edition notes, then the other known writings', () => {
        expect(titlesToSearch({ artist: 'Genesis', title: 'Foxtrot (2007 Stereo Mix)' })).toEqual(['Foxtrot'])
        expect(titlesToSearch({ artist: 'AC/DC', title: 'POWER UP' })).toEqual(['POWER UP', 'PWR/UP'])
        expect(titlesToSearch({ artist: 'Frank Ocean', title: 'Blonde (Explicit)' })).toEqual(['Blonde', 'Blond'])
        expect(titlesToSearch({ artist: 'Joy Division', title: 'Substance 1977-1980' })).toEqual(['Substance 1977-1980', 'Substance'])
        expect(titlesToSearch({ artist: 'Cœur de pirate', title: 'Blonde' })).toEqual(['Blonde'])
        expect(titlesToSearch({ artist: 'X', title: '' })).toEqual([])
        expect(titlesToSearch(null)).toEqual([])
    })
})
