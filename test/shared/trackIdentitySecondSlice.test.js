/**
 * F74, second slice (UAT-221) - the tracks version 1 of the rule left unrated, each checked against
 * its BestEverAlbums page on 2026-11-20 (test/fixtures/trackIdentity/measuredAlbums2.json), and the
 * regression of «Close to the Edge». Every new tier says what it accepts and what it must not.
 */
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { matchTracks, compareTrackTitles, TrackReason, TRACK_IDENTITY_RULE_VERSION } from '../../shared/trackIdentity.js'
import { measure, measureSecond } from '../../scripts/measure-track-identity.mjs'
import { fakeHttp, loadHtml } from '../server/helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')
const EnrichmentService = require('../../server/lib/services/EnrichmentService.js')

const reasonOf = (album, source, places) => compareTrackTitles(album, source, places).reason
const same = (album, source, places) => compareTrackTitles(album, source, places).same
const ratingsOf = (tracks, page) => matchTracks(tracks, page).map(match => (match ? match.entry.rating : null))

describe('the version moved with the rule', () => {
    it('is 2', () => expect(TRACK_IDENTITY_RULE_VERSION).toBe(2))
})

describe('title-with-its-parts: the title before a colon, and the parts after it', () => {
    const YES = 'Close to the Edge: I. The Solid Time of Change, II. Total Mass Retain, III. I Get Up I Get Down, IV. Seasons of Man'
    const YES_SOURCE = 'Close To The Edge: The Solid Time Of Change / Total Mass Retain / I Get Up, I Get Down / Seasons Of Man'

    it.each([
        [YES, YES_SOURCE],
        ['And You and I: I. Cord of Life, II. Eclipse, III. The Preacher the Teacher, IV. Apocalypse', 'And You And I: Cord Of Life / Eclipse / The Preacher The Teacher / Apocalypse'],
        ['Country Girl: A. Whiskey Boot Hill / B. Down, Down, Down / C. "Country Girl" (I Think You\'re Pretty)', 'Country Girl: Whiskey Boot Hill/Down, Down, Down/Country Girl (I Think You\'re Pretty)'],
        ['Supper\'s Ready (2007 Stereo Mix)', 'Supper\'s Ready: I. Lover\'s Leap / II. The Guaranteed Eternal Sanctuary Man / III. Ikhnaton And Itsacon And Their Band Of Merry Men'],
        [YES, 'Close to the Edge']
    ])('«%s» is «%s»', (album, source) => {
        expect(reasonOf(album, source)).toBe(TrackReason.TITLE_WITH_ITS_PARTS)
    })

    it('not a title that merely contains the words, not other parts, not a medley by its first word', () => {
        expect(same('Close to the Edge of the World', YES_SOURCE)).toBe(false)
        expect(same('The Edge', YES_SOURCE)).toBe(false)
        expect(same('The Solid Time of Change', YES_SOURCE)).toBe(false)
        expect(same('Close to the Edge: I. Another Part, II. And Another', YES_SOURCE)).toBe(false)
        expect(same('Medley', 'Medley: Please, Please, Please/You\'ve Got The Power/I Found Someone')).toBe(false)
    })

    it('«Close to the Edge», whole: three tracks, three ratings, and «Siberian Khatru» keeps its own', () => {
        expect(ratingsOf(
            [YES, 'And You and I: I. Cord of Life, II. Eclipse, III. The Preacher the Teacher, IV. Apocalypse', 'Siberian Khatru'],
            [{ trackTitle: 'Siberian Khatru', rating: 88 }, { trackTitle: YES_SOURCE, rating: 92 }, { trackTitle: 'And You And I: Cord Of Life / Eclipse / The Preacher The Teacher / Apocalypse', rating: 89 }]
        )).toEqual([92, 89, 88])
    })
})

describe('first-of-titles-listed-together: the source rates two tracks as one', () => {
    it('«The Cinema Show» takes the entry «The Cinema Show / Aisle Of Plenty»; «Aisle of Plenty» gets none', () => {
        expect(ratingsOf(
            ['The Cinema Show (2007 Stereo Mix)', 'Aisle of Plenty (2007 Stereo Mix)'],
            [{ trackTitle: 'The Cinema Show / Aisle Of Plenty', rating: 89 }]
        )).toEqual([89, null])
    })

    it('not the second of the two, and not a part of a title with a colon', () => {
        expect(same('Aisle of Plenty', 'The Cinema Show / Aisle Of Plenty')).toBe(false)
        expect(same('Booty', 'Greatdayindamornin\' / Booty')).toBe(false)
        expect(same('Close To The Edge', 'Suite: Close To The Edge / Total Mass Retain')).toBe(false)
    })
})

describe('letters-starred-out: a store writes asterisks for letters', () => {
    it.each([
        ['F**k Wit Dre Day (And Everybody\'s Celebratin\')', 'Fuck Wit Dre Day (And Everybody\'s Celebratin\')'],
        ['The Day The N****z Took Over (feat. Snoop Dogg, RBX, Dat Nigga Daz)', 'The Day The Niggaz Took Over'],
        ['A N***a Witta Gun', 'A Nigga Witta Gun'],
        ['Lyrical G******g', 'Lyrical Gangbang']
    ])('«%s» is «%s»', (album, source) => {
        expect(reasonOf(album, source)).toBe(TrackReason.LETTERS_STARRED_OUT)
    })

    it('one asterisk is one letter, the letters shown must be the same, and every other word too', () => {
        expect(same('Lyrical G******g', 'Lyrical Gang')).toBe(false)
        expect(same('Lyrical G******g', 'Lyrical Bangbang')).toBe(false)
        expect(same('Lyrical G******g', 'Musical Gangbang')).toBe(false)
        expect(same('A N***a Witta Gun', 'A Nigga Witta Gun Too')).toBe(false)
    })
})

describe('title-in-its-brackets: the other name of the song', () => {
    it('«Bang a Gong (Get It On)» is «Get It On»', () => {
        expect(reasonOf('Bang a Gong (Get It On)', 'Get It On')).toBe(TrackReason.TITLE_IN_ITS_BRACKETS)
    })

    it('not one word in brackets, not a part of what is in them, and never before the plain title', () => {
        expect(same('Hey Joe (Live)', 'Live')).toBe(false)
        expect(same('Bang a Gong (Get It On)', 'It On')).toBe(false)
        expect(ratingsOf(['Bang a Gong (Get It On)', 'Get It On'], [{ trackTitle: 'Get It On', rating: 89 }])).toEqual([null, 89])
    })
})

describe('what is only a way of writing (second tier)', () => {
    it.each([
        ['Fourth Time Around', '4th Time Around'],
        ['Obviously Five Believers', 'Obviously 5 Believers'],
        ['King of Carrot Flowers, Pts. 2 & 3', 'The King Of Carrot Flowers Pt. Two & Three'],
        ['Song for the Dead', 'A Song For The Dead'],
        ['Hanging Tree', 'Hangin\' Tree'],
        ['Operation Lifesaver a.K.A. Mint Test', 'Operation Lifesaver/Mint Test'],
        ['Midnite Cruiser', 'Midnight Cruiser'],
        ['Greatdayndamornin\' / Booty', 'Greatdayindamornin\' / Booty'],
        ['2:45 Am', '2:45 AM'],
        ['u', 'U']
    ])('«%s» is «%s»', (album, source) => {
        expect([TrackReason.SAME_TEXT, TrackReason.SAME_SONG_DESCRIBED]).toContain(reasonOf(album, source))
    })

    it('still not: another number, another word', () => {
        expect(same('Fourth Time Around', '5th Time Around')).toBe(false)
        expect(same('King of Carrot Flowers, Pts. 2 & 3', 'The King Of Carrot Flowers Pt. One')).toBe(false)
        expect(same('Song for the Dead', 'A Song For The Deaf')).toBe(false)
        expect(same('King', 'Kin')).toBe(false)
    })
})

describe('the track number is the one the track carries, not its place in the list sent', () => {
    const page = [{ trackTitle: 'Sarah', rating: 80, trackNumber: 5 }, { trackTitle: 'Do Anything You Want To', rating: 85, trackNumber: 1 }]
    // the app keeps the tracks by acclaim, and asks for the ratings with that list
    const byAcclaim = [{ title: 'With Love', position: 8 }, { title: 'My Sarah', position: 5 }, { title: 'Do Anything You Want to Do', position: 1 }]

    it('«My Sarah», track 5, gets the rating of «Sarah» wherever it comes in the list', () => {
        expect(ratingsOf(byAcclaim, page)).toEqual([null, 80, 85])
    })

    it('through the service of POST /api/enrich-album', async () => {
        const service = new EnrichmentService({ getBestEverRanking: async () => ({ albumId: '3091', referenceUrl: 'https://bea/thechart.php?a=3091', evidence: page }), logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } })

        const { data } = await service.enrichAlbum({ title: 'Black Rose: A Rock Legend', artist: 'Thin Lizzy', tracks: byAcclaim })

        expect(data.trackRatings).toEqual([{ title: 'With Love', rating: null }, { title: 'My Sarah', rating: 80 }, { title: 'Do Anything You Want to Do', rating: 85 }])
    })

    it('tracks with no number of their own are in album order, as before', () => {
        expect(ratingsOf(['Do Anything You Want to Do', 'x', 'y', 'z', 'My Sarah'], page)).toEqual([85, null, null, null, 80])
    })
})

describe('the scraper reads the title as the page writes it', () => {
    const page = (name) => fs.readFileSync(path.join(process.cwd(), 'test/fixtures/besteveralbums/tracks', `${name}.html`), 'utf8')
    const titlesOf = async (name) => {
        const scraper = createBestEverScraper({ http: fakeHttp([['thechart.php', page(name)]]), loadHtml, logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() } })
        return (await scraper.getRankingFromUrl('https://www.besteveralbums.com/thechart.php?a=1')).evidence.map(entry => entry.trackTitle)
    }

    it('a title of one letter is a track: «To Pimp A Butterfly» has 16, with «U» and «I»', async () => {
        const titles = await titlesOf('to-pimp-a-butterfly-77758')

        expect(titles).toHaveLength(16)
        expect(titles).toEqual(expect.arrayContaining(['U', 'I']))
    })

    it('a title that starts with a number keeps it when the page gives the track number apart: «2:45 AM»', async () => {
        expect(await titlesOf('either-or-1067')).toContain('2:45 AM')
    })
})

describe('the two measures', () => {
    it('the first one did not move: 102 ratings on the 12 albums', () => {
        expect(measure().reduce((total, album) => total + album.after, 0)).toBe(102)
    })

    it('the second: every rating the pages have for the tracks of these albums reaches its track', () => {
        const results = measureSecond()

        expect(results.map(result => [result.artist, result.version1, result.after])).toEqual([
            ['Yes', 1, 3], ['Genesis', 5, 6], ['Genesis', 6, 7], ['Crosby, Stills, Nash & Young', 9, 10], ['D\'Angelo', 12, 13],
            ['Neutral Milk Hotel', 10, 11], ['T. Rex', 10, 11], ['Dr. Dre', 0, 4], ['Kendrick Lamar', 14, 16], ['Steely Dan', 9, 10],
            ['Elliott Smith', 11, 12], ['Madvillain', 0, 1], ['Bob Dylan', 12, 14], ['Nirvana', 0, 0], ['Stevie Wonder', 17, 17],
            ['Queens of the Stone Age', 11, 14]
        ])
    })

    it('what stays unrated is not on the page, or is the second of two tracks the page rates as one', () => {
        const unrated = measureSecond().flatMap(result => result.unrated)

        expect(unrated).toEqual(expect.arrayContaining(['Aisle of Plenty (2007 Stereo Mix)', 'Endless, Nameless', 'Saturn', 'Ebony Eyes', 'All Day Sucker', 'The Real Song for the Deaf']))
        expect(unrated).not.toEqual(expect.arrayContaining(['u']))
        expect(unrated).toHaveLength(14)
    })
})
