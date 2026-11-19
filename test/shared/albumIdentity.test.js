/**
 * F55, slice 1 - the one rule that says "this is the album that was asked for" (UAT-184).
 * The series asked for «Stone Temple Pilots - Core» and the screen showed «Shangri-La Dee Da»:
 * with the right artist, any album passed. Here the title has to match on its own.
 */
import { describe, it, expect } from 'vitest'
import {
    compareAlbumIdentity, pickAlbum, albumFromLabel, sameArtist, Verdict, Reason
} from '../../shared/albumIdentity.js'

const STP = 'Stone Temple Pilots'
const verdictOf = (asked, candidate) => compareAlbumIdentity(asked, candidate).verdict
const reasonOf = (asked, candidate) => compareAlbumIdentity(asked, candidate).reason

describe('the album asked for is not another album of the same artist (UAT-184)', () => {
    const core = { artist: STP, title: 'Core', year: 1992 }

    it('«Core» is not «Shangri-La Dee Da», whatever the artist', () => {
        const verdict = compareAlbumIdentity(core, { artist: STP, title: 'Shangri-La Dee Da', year: 2001 })

        expect(verdict).toEqual({ verdict: Verdict.DIFFERENT, same: false, reason: Reason.TITLE_MISMATCH })
    })

    it('«Core» is not «Core Memories»: one title containing the other is not a match', () => {
        expect(verdictOf(core, { artist: STP, title: 'Core Memories' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: STP, title: 'Core Memories' }, core)).toBe(Verdict.DIFFERENT)
    })

    it('«Core» is «Core»', () => {
        expect(compareAlbumIdentity(core, { artist: STP, title: 'Core', year: 1992 }))
            .toEqual({ verdict: Verdict.SAME, same: true, reason: Reason.EXACT_TITLE })
    })

    it('with no candidate that passes, the answer is "not found", never the neighbour', () => {
        const picked = pickAlbum(core, [
            { artist: STP, title: 'Shangri-La Dee Da', year: 2001 },
            { artist: STP, title: 'Purple', year: 1994 },
            { artist: STP, title: 'Core Memories' }
        ])

        expect(picked).toEqual({ found: false, candidate: null, index: -1, verdict: null })
    })

    it('picks the album asked for among the albums of the artist', () => {
        const picked = pickAlbum(core, [
            { artist: STP, title: 'Shangri-La Dee Da' }, { artist: STP, title: 'Core' }, { artist: STP, title: 'Purple' }
        ])

        expect(picked).toMatchObject({ found: true, index: 1, candidate: { title: 'Core' } })
    })
})

describe('what is taken out before comparing', () => {
    const same = [
        // [asked artist, asked title, candidate artist, candidate title]
        ['Beyoncé', 'Lemonade', 'BEYONCE', 'lemonade'],
        ['AC/DC', 'Back in Black', 'ACDC', 'Back In Black'],
        ['Simon & Garfunkel', 'Bridge Over Troubled Water', 'Simon and Garfunkel', 'Bridge over Troubled Water'],
        ['Guns N\' Roses', 'Lies & Deceit', 'Guns N’ Roses', 'Lies and Deceit'],
        ['The Beatles', 'Abbey Road', 'Beatles', 'Abbey Road'],
        ['Pink Floyd', 'The Wall', 'Pink Floyd', 'Wall'],
        ['R.E.M.', 'Automatic for the People', 'REM', 'Automatic For The People!'],
        ['Florence + the Machine', 'Lungs', 'Florence and the Machine', 'Lungs'],
        ['Robert Plant & Alison Krauss', 'Raising Sand', 'Robert Plant, Alison Krauss', 'Raising Sand'],
        ['Sigur Rós', 'Ágætis byrjun', 'Sigur Ros', 'Agætis Byrjun']
    ]
    same.forEach(([askedArtist, askedTitle, artist, title]) => {
        it(`${askedArtist} - ${askedTitle} is ${artist} - ${title}`, () => {
            expect(compareAlbumIdentity({ artist: askedArtist, title: askedTitle }, { artist, title }))
                .toEqual({ verdict: Verdict.SAME, same: true, reason: Reason.EXACT_TITLE })
        })
    })

    it('accents are taken out, letters are not swapped: «Ágætis» is not «Agaetis»', () => {
        expect(verdictOf({ artist: 'Sigur Rós', title: 'Ágætis byrjun' }, { artist: 'Sigur Rós', title: 'Agaetis Byrjun' })).toBe(Verdict.DIFFERENT)
    })

    it('a title in another script, or made of symbols only, is compared as it is', () => {
        expect(verdictOf({ artist: 'Ed Sheeran', title: '÷' }, { artist: 'Ed Sheeran', title: '÷ (Deluxe)' })).toBe(Verdict.SAME)
        expect(verdictOf({ artist: 'Ed Sheeran', title: '÷' }, { artist: 'Ed Sheeran', title: '×' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Кино', title: 'Группа крови' }, { artist: 'Кино', title: 'Группа Крови' })).toBe(Verdict.SAME)
        expect(verdictOf({ artist: 'Кино', title: 'Группа крови' }, { artist: 'Кино', title: 'Ночь' })).toBe(Verdict.DIFFERENT)
    })
})

describe('an edition of the album is the same album', () => {
    const editions = [
        'Core (Deluxe Edition)', 'Core (Remastered 2011)', 'Core [Expanded]', 'Core - Remastered',
        'Core (Super Deluxe)', 'Core (25th Anniversary Edition)', 'Core - 2011 Remaster', 'Core (2017)',
        'Core (Deluxe Edition) [2017 Remaster]', 'Core (Bonus Track Version)', 'Core (Mono)', 'Core - EP',
        'Core (Live)', 'Core: Deluxe Edition', 'Core (Collector\'s Edition)', 'Core (Explicit)'
    ]
    editions.forEach(title => {
        it(`«Core» and «${title}», both ways`, () => {
            const expected = { verdict: Verdict.SAME, same: true, reason: Reason.EDITION_OF_TITLE }

            expect(compareAlbumIdentity({ artist: STP, title: 'Core' }, { artist: STP, title })).toEqual(expected)
            expect(compareAlbumIdentity({ artist: STP, title }, { artist: STP, title: 'Core' })).toEqual(expected)
        })
    })

    it('two editions of the same album are the same album', () => {
        expect(reasonOf({ artist: STP, title: 'Core (Deluxe Edition)' }, { artist: STP, title: 'Core - 2011 Remaster' })).toBe(Reason.EDITION_OF_TITLE)
    })

    it('what is in parentheses and is not an edition is part of the title', () => {
        expect(verdictOf({ artist: 'Weezer', title: 'Weezer (Blue Album)' }, { artist: 'Weezer', title: 'Weezer (Green Album)' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Weezer', title: 'Weezer' }, { artist: 'Weezer', title: 'Weezer (Green Album)' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Oasis', title: '(What\'s the Story) Morning Glory?' }, { artist: 'Oasis', title: 'Morning Glory' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Eagles', title: 'Hotel California' }, { artist: 'Eagles', title: 'Hotel California (Live at the Forum \'76)' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Elton John', title: 'Greatest Hits' }, { artist: 'Elton John', title: 'Greatest Hits (1970-2002)' })).toBe(Verdict.DIFFERENT)
    })

    it('a title that is itself an edition word is kept', () => {
        expect(verdictOf({ artist: 'Harmonia', title: 'Deluxe' }, { artist: 'Harmonia', title: 'Deluxe' })).toBe(Verdict.SAME)
        expect(verdictOf({ artist: 'Harmonia', title: 'Deluxe' }, { artist: 'Harmonia', title: 'Musik von Harmonia' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: 'Garbage', title: 'Version 2.0' }, { artist: 'Garbage', title: 'Garbage' })).toBe(Verdict.DIFFERENT)
    })
})

describe('a subtitle after ":" or " - "', () => {
    const corners = { artist: 'Pavement', title: 'Brighten the Corners' }
    const nicene = { artist: 'Pavement', title: 'Brighten the Corners: Nicene Creedence Ed.' }

    it('that names an edition is dropped: «Brighten the Corners: Nicene Creedence Ed.» is the same album, both ways', () => {
        expect(reasonOf(corners, nicene)).toBe(Reason.EDITION_OF_TITLE)
        expect(reasonOf(nicene, corners)).toBe(Reason.EDITION_OF_TITLE)
    })

    it('that names anything else is part of the title, both ways', () => {
        const pairs = [
            ['The Wall', 'The Wall: Live in Berlin'],
            ['Unreal Unearth', 'Unreal Unearth: Unheard'],
            ['folklore', 'folklore: the long pond studio sessions'],
            ['Alchemy', 'Alchemy - Dire Straits Live'],
            ['Greatest Hits', 'Greatest Hits: 1970-2002']
        ]
        pairs.forEach(([short, long]) => {
            expect(verdictOf({ artist: 'X', title: short }, { artist: 'X', title: long })).toBe(Verdict.DIFFERENT)
            expect(verdictOf({ artist: 'X', title: long }, { artist: 'X', title: short })).toBe(Verdict.DIFFERENT)
        })
    })

    it('the same subtitle on both sides is the same album', () => {
        expect(reasonOf({ artist: 'X', title: 'The Wall: Live in Berlin' }, { artist: 'X', title: 'The Wall - Live in Berlin' })).toBe(Reason.EXACT_TITLE)
    })
})

describe('self-titled and numbered titles', () => {
    it('a self-titled album is not another album of the artist, and the other is not the self-titled one', () => {
        const selfTitled = { artist: STP, title: STP }

        expect(verdictOf(selfTitled, { artist: STP, title: 'Core' })).toBe(Verdict.DIFFERENT)
        expect(verdictOf({ artist: STP, title: 'Core' }, selfTitled)).toBe(Verdict.DIFFERENT)
        expect(verdictOf(selfTitled, { artist: STP, title: 'Stone Temple Pilots (2018)' })).toBe(Verdict.SAME)
    })

    it('between two self-titled albums, the year asked for chooses', () => {
        const candidates = [{ artist: STP, title: STP, year: 2010 }, { artist: STP, title: STP, year: '2018-03-16' }]

        expect(pickAlbum({ artist: STP, title: STP, year: 2018 }, candidates).index).toBe(1)
        expect(pickAlbum({ artist: STP, title: STP, year: 2010 }, candidates).index).toBe(0)
        expect(pickAlbum({ artist: STP, title: STP }, candidates).index).toBe(0)
    })

    it('the number is part of the title', () => {
        const zeppelin = (title) => ({ artist: 'Led Zeppelin', title })
        const different = [
            ['Led Zeppelin IV', 'Led Zeppelin III'], ['Led Zeppelin', 'Led Zeppelin IV'], ['IV', 'III'],
            ['Greatest Hits', 'Greatest Hits Vol. 2'], ['Greatest Hits Vol. 2', 'Greatest Hits Vol. 3'],
            ['Greatest Hits', 'Greatest Hits (Vol. 2)'], ['Use Your Illusion I', 'Use Your Illusion II'],
            ['1', '1962-1966']
        ]
        different.forEach(([asked, candidate]) => {
            expect(verdictOf(zeppelin(asked), zeppelin(candidate))).toBe(Verdict.DIFFERENT)
            expect(verdictOf(zeppelin(candidate), zeppelin(asked))).toBe(Verdict.DIFFERENT)
        })
        expect(verdictOf(zeppelin('Led Zeppelin IV'), zeppelin('Led Zeppelin IV (Remastered)'))).toBe(Verdict.SAME)
        expect(verdictOf(zeppelin('Greatest Hits Vol. 2'), zeppelin('Greatest Hits, Volume 2'))).toBe(Verdict.SAME)
        expect(verdictOf(zeppelin('Greatest Hits Vol. 2'), zeppelin('Greatest Hits (Vol. 2) [Remastered]'))).toBe(Verdict.SAME)
    })
})

describe('the artist', () => {
    it('has to match: the same title by another artist is another album', () => {
        expect(compareAlbumIdentity({ artist: STP, title: 'Core' }, { artist: 'Persefone', title: 'Core' }))
            .toEqual({ verdict: Verdict.DIFFERENT, same: false, reason: Reason.ARTIST_MISMATCH })
        expect(reasonOf({ artist: STP, title: 'Core' }, { artist: '', title: 'Core' })).toBe(Reason.ARTIST_MISMATCH)
    })

    it('one artist name containing the other is not a match', () => {
        expect(verdictOf({ artist: 'Page', title: 'No Quarter' }, { artist: 'Page & Plant', title: 'No Quarter' })).toBe(Verdict.DIFFERENT)
    })

    it('sameArtist answers the artist part alone, for a source that lists artists', () => {
        expect(sameArtist('The Beatles', 'Beatles')).toBe(true)
        expect(sameArtist('Page', 'Page & Plant')).toBe(false)
        expect(sameArtist('', '')).toBe(false)
        expect(sameArtist(STP, undefined)).toBe(false)
    })

    it('is not checked when the query has none; the title still has to match', () => {
        expect(reasonOf({ artist: '', title: 'Core' }, { artist: STP, title: 'Core' })).toBe(Reason.EXACT_TITLE)
        expect(verdictOf({ title: 'Core' }, { artist: STP, title: 'Purple' })).toBe(Verdict.DIFFERENT)
    })

    it('a query typed as one text, "artist title", is that artist and that title', () => {
        expect(reasonOf({ artist: '', title: 'The Beatles Abbey Road' }, { artist: 'The Beatles', title: 'Abbey Road (2019 Mix)' })).toBe(Reason.ARTIST_AND_TITLE_IN_ONE_TEXT)
        expect(verdictOf({ artist: '', title: 'The Beatles Abbey Road' }, { artist: 'The Beatles', title: 'Let It Be' })).toBe(Verdict.DIFFERENT)
    })
})

describe('missing data', () => {
    it('no title on either side is never "the same"', () => {
        const noTitle = { verdict: Verdict.DIFFERENT, same: false, reason: Reason.TITLE_MISSING }

        expect(compareAlbumIdentity({ artist: STP, title: '' }, { artist: STP, title: 'Core' })).toEqual(noTitle)
        expect(compareAlbumIdentity({ artist: STP, title: 'Core' }, { artist: STP })).toEqual(noTitle)
        expect(compareAlbumIdentity(null, undefined)).toEqual(noTitle)
    })

    it('an empty or missing list of candidates is "not found"', () => {
        expect(pickAlbum({ artist: STP, title: 'Core' }, []).found).toBe(false)
        expect(pickAlbum({ artist: STP, title: 'Core' }, null).found).toBe(false)
    })
})

describe('the year only breaks ties', () => {
    const asked = { artist: STP, title: 'Core', year: 1992 }

    it('never rejects alone: a reissue carries another year', () => {
        expect(verdictOf(asked, { artist: STP, title: 'Core', year: 2017 })).toBe(Verdict.SAME)
        expect(pickAlbum(asked, [{ artist: STP, title: 'Core', year: 2017 }]).found).toBe(true)
    })

    it('between candidates that pass, the exact title comes before an edition, then the nearest year, then the order given', () => {
        const candidates = [
            { id: 'deluxe-92', artist: STP, title: 'Core (Deluxe Edition)', year: 1992 },
            { id: 'plain-17', artist: STP, title: 'Core', year: 2017 },
            { id: 'plain-93', artist: STP, title: 'Core', year: 1993 },
            { id: 'plain-unknown', artist: STP, title: 'Core' },
            { id: 'other', artist: STP, title: 'Purple', year: 1992 }
        ]

        expect(pickAlbum(asked, candidates).candidate.id).toBe('plain-93')
        expect(pickAlbum({ ...asked, year: null }, candidates).candidate.id).toBe('plain-17')
        expect(pickAlbum({ ...asked, title: 'Core (Deluxe Edition)' }, candidates).candidate.id).toBe('deluxe-92')
    })

    it('reads each candidate through the function it is given, and returns the candidate as it came', () => {
        const hit = { id: 'a1', attributes: { name: 'Core', artistName: STP, releaseDate: '1992-09-29' } }
        const miss = { id: 'a2', attributes: { name: 'Purple', artistName: STP } }
        const read = (item) => ({ artist: item.attributes.artistName, title: item.attributes.name, year: item.attributes.releaseDate })

        const picked = pickAlbum(asked, [miss, hit], read)

        expect(picked.candidate).toBe(hit)
        expect(picked.verdict.reason).toBe(Reason.EXACT_TITLE)
    })
})

describe('a label "Title by Artist" (BestEverAlbums)', () => {
    it('is read as every way it can be split, so a title with " by " inside is not lost', () => {
        expect(albumFromLabel('Core by Stone Temple Pilots')).toEqual([{ title: 'Core', artist: STP }])
        expect(albumFromLabel('Stand by Me by Ben E. King')).toEqual([
            { title: 'Stand', artist: 'Me by Ben E. King' }, { title: 'Stand by Me', artist: 'Ben E. King' }
        ])
        expect(albumFromLabel('Stone Temple Pilots')).toEqual([])
        expect(albumFromLabel(null)).toEqual([])
    })
})
