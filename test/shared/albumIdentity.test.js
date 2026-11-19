/**
 * F55, slice 1 - the one rule that says "this is the album that was asked for" (UAT-184).
 * The series asked for «Stone Temple Pilots - Core» and the screen showed «Shangri-La Dee Da»:
 * with the right artist, any album passed. Here the title has to match on its own.
 */
import { describe, it, expect } from 'vitest'
import {
    compareAlbumIdentity, compareKeptAlbum, pickAlbum, albumFromLabel, sameArtist, Verdict, Reason
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

    const SUBTITLED = [
        ['The Wall', 'The Wall: Live in Berlin'],
        ['Unreal Unearth', 'Unreal Unearth: Unheard'],
        ['folklore', 'folklore: the long pond studio sessions'],
        ['Alchemy', 'Alchemy - Dire Straits Live'],
        ['Greatest Hits', 'Greatest Hits: 1970-2002']
    ]

    it('that names anything else is part of the title: the short title asked for is never "the same" by itself', () => {
        SUBTITLED.forEach(([short, long]) => {
            expect(compareAlbumIdentity({ artist: 'X', title: short }, { artist: 'X', title: long }))
                .toEqual({ verdict: Verdict.SAME_IF_ALONE, same: false, reason: Reason.TITLE_BEFORE_SUBTITLE })
        })
    })

    it('and the other way there is nothing to wait for: the long title asked for is not the short album', () => {
        SUBTITLED.forEach(([short, long]) => {
            expect(compareAlbumIdentity({ artist: 'X', title: long }, { artist: 'X', title: short }))
                .toEqual({ verdict: Verdict.DIFFERENT, same: false, reason: Reason.TITLE_MISMATCH })
        })
    })

    it('the same subtitle on both sides is the same album', () => {
        expect(reasonOf({ artist: 'X', title: 'The Wall: Live in Berlin' }, { artist: 'X', title: 'The Wall - Live in Berlin' })).toBe(Reason.EXACT_TITLE)
    })
})

describe('the second tier: the catalog only has the title with a subtitle (MJRP, 2026-11-19)', () => {
    const PAGE_PLANT = 'Jimmy Page & Robert Plant'
    const noQuarter = { artist: PAGE_PLANT, title: 'No Quarter' }
    const unledded = { artist: PAGE_PLANT, title: 'No Quarter: Jimmy Page & Robert Plant Unledded' }
    const floyd = (title, more = {}) => ({ artist: 'Pink Floyd', title, ...more })
    const elton = (title, more = {}) => ({ artist: 'Elton John', title, ...more })
    const ACCEPTED_ALONE = { verdict: Verdict.SAME, same: true, reason: Reason.TITLE_BEFORE_SUBTITLE }

    it('«No Quarter» asked for, only «No Quarter: Jimmy Page & Robert Plant Unledded» in the catalog: it is picked, and the verdict says how', () => {
        const picked = pickAlbum(noQuarter, [{ artist: PAGE_PLANT, title: 'Walking Into Clarksdale' }, unledded])

        expect(picked).toEqual({ found: true, candidate: unledded, index: 1, verdict: ACCEPTED_ALONE })
    })

    it('never competes with the first tier: «The Wall» asked for picks «The Wall», wherever «The Wall: Live in Berlin» comes', () => {
        const live = floyd('The Wall: Live in Berlin', { year: 1990 })
        const wall = floyd('The Wall', { year: 1979 })
        const deluxe = floyd('The Wall (Deluxe Edition)', { year: 2012 })

        expect(pickAlbum(floyd('The Wall'), [live, wall])).toMatchObject({ index: 1, verdict: { reason: Reason.EXACT_TITLE } })
        expect(pickAlbum(floyd('The Wall'), [wall, live])).toMatchObject({ index: 0, verdict: { reason: Reason.EXACT_TITLE } })
        // an edition is still the first tier; and the year asked for does not bring the second tier forward
        expect(pickAlbum(floyd('The Wall', { year: 1990 }), [live, deluxe])).toMatchObject({ index: 1, verdict: { reason: Reason.EDITION_OF_TITLE } })
    })

    it('«The Wall» asked for with only «The Wall: Live in Berlin» picks it, flagged', () => {
        expect(pickAlbum(floyd('The Wall'), [floyd('The Wall: Live in Berlin'), floyd('Animals')]))
            .toMatchObject({ found: true, index: 0, verdict: ACCEPTED_ALONE })
    })

    it('one direction only: «The Wall: Live in Berlin» asked for never accepts «The Wall»', () => {
        expect(pickAlbum(floyd('The Wall: Live in Berlin'), [floyd('The Wall')]).found).toBe(false)
    })

    it('two albums qualify: not found (choosing between them is the person\'s, F57)', () => {
        const picked = pickAlbum(elton('Greatest Hits'), [elton('Greatest Hits: 1970-2002'), elton('Greatest Hits: Vol 2')])

        expect(picked).toEqual({ found: false, candidate: null, index: -1, verdict: null })
    })

    it('two listings of the one album that qualifies are one album: the plain one, then the nearest year', () => {
        const candidates = [
            { ...unledded, id: 'deluxe', title: `${unledded.title} (Deluxe Edition)`, year: 2004 },
            { ...unledded, id: 'plain-04', year: 2004 },
            { ...unledded, id: 'plain-94', year: 1994 }
        ]

        expect(pickAlbum(noQuarter, candidates)).toMatchObject({ candidate: { id: 'plain-04' }, verdict: ACCEPTED_ALONE })
        expect(pickAlbum({ ...noQuarter, year: 1994 }, candidates).candidate.id).toBe('plain-94')
        expect(pickAlbum(noQuarter, [candidates[0]])).toMatchObject({ candidate: { id: 'deluxe' }, verdict: ACCEPTED_ALONE })
    })

    it('the title asked for is the candidate\'s title before ANY of its subtitle separators, ":" or " - "', () => {
        const reasonFor = (title, candidate) => compareAlbumIdentity({ artist: 'X', title }, { artist: 'X', title: candidate }).verdict

        expect(reasonFor('Alchemy', 'Alchemy - Dire Straits Live')).toBe(Verdict.SAME_IF_ALONE)
        expect(reasonFor('Live: Volume One', 'Live: Volume One - The Encores')).toBe(Verdict.SAME_IF_ALONE)
        expect(reasonFor('Live', 'Live: Volume One - The Encores')).toBe(Verdict.SAME_IF_ALONE)
        expect(reasonFor('No Quarter', 'No Quarter: Unledded (Remastered)')).toBe(Verdict.SAME_IF_ALONE)
        expect(reasonFor('No Quarter (Remastered)', 'No Quarter: Unledded')).toBe(Verdict.SAME_IF_ALONE)
    })

    it('is not "one title contains the other": only a subtitle separator opens it', () => {
        const verdictFor = (title, candidate) => compareAlbumIdentity({ artist: 'X', title }, { artist: 'X', title: candidate }).verdict

        expect(verdictFor('Core', 'Core Memories')).toBe(Verdict.DIFFERENT)
        expect(verdictFor('Weezer', 'Weezer (Blue Album)')).toBe(Verdict.DIFFERENT)
        expect(verdictFor('Quarter', 'No Quarter: Unledded')).toBe(Verdict.DIFFERENT)
        expect(verdictFor('Unledded', 'No Quarter: Unledded')).toBe(Verdict.DIFFERENT)
        expect(verdictFor('Self-Titled', 'Self-Titled-Ish')).toBe(Verdict.DIFFERENT)
    })

    it('the artist has to match, and a query with no artist has no second tier', () => {
        expect(compareAlbumIdentity(noQuarter, { ...unledded, artist: 'Tina Turner' }))
            .toEqual({ verdict: Verdict.DIFFERENT, same: false, reason: Reason.ARTIST_MISMATCH })
        expect(compareAlbumIdentity({ title: 'No Quarter' }, unledded).verdict).toBe(Verdict.DIFFERENT)
        expect(pickAlbum({ title: 'No Quarter' }, [unledded]).found).toBe(false)
    })

    it('a label that can be read in two ways is taken by its best reading', () => {
        const picked = pickAlbum({ artist: 'Ben E. King', title: 'Stand by Me' }, ['Stand by Me: The Collection by Ben E. King'], albumFromLabel)

        expect(picked).toMatchObject({ found: true, index: 0, verdict: ACCEPTED_ALONE })
    })
})

describe('an album that is KEPT for a query (a cache, the screen): is it still the album asked for?', () => {
    const asked = { artist: 'Pink Floyd', title: 'The Wall' }
    const live = { artist: 'Pink Floyd', title: 'The Wall: Live in Berlin' }

    it('the first tier needs nothing else', () => {
        expect(compareKeptAlbum(asked, { artist: 'Pink Floyd', title: 'The Wall (Remastered)' }))
            .toEqual({ verdict: Verdict.SAME, same: true, reason: Reason.EDITION_OF_TITLE })
        expect(compareKeptAlbum(asked, { artist: 'Pink Floyd', title: 'Animals' }).verdict).toBe(Verdict.DIFFERENT)
    })

    it('the second tier is believed only when the album says pickAlbum accepted it that way', () => {
        expect(compareKeptAlbum(asked, { ...live, identityReason: Reason.TITLE_BEFORE_SUBTITLE }))
            .toEqual({ verdict: Verdict.SAME, same: true, reason: Reason.TITLE_BEFORE_SUBTITLE })
        expect(compareKeptAlbum(asked, live))
            .toEqual({ verdict: Verdict.SAME_IF_ALONE, same: false, reason: Reason.TITLE_BEFORE_SUBTITLE })
        expect(compareKeptAlbum(asked, { ...live, identityReason: Reason.EXACT_TITLE }).same).toBe(false)
    })

    it('a reason written on another album opens nothing', () => {
        expect(compareKeptAlbum(asked, { artist: 'Pink Floyd', title: 'Animals', identityReason: Reason.TITLE_BEFORE_SUBTITLE }).same).toBe(false)
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
