/**
 * F74 (UAT-221) - the scraper of BestEverAlbums and the tracks of the album.
 *
 * 1. The page gives each track its number; the scraper keeps it (the track rule reads it).
 * 2. The source has two pages named «High Voltage» by AC/DC: the Australian record (8 tracks) and
 *    «High Voltage (International)» (9 tracks). The identity rule takes the first by its name; the
 *    album a person has is the international one, and 7 of its 9 tracks got no rating. When the
 *    tracks of the album are given, the page that lists them is the page of the album.
 *
 * No network. The pages are test/fixtures/besteveralbums/tracks/*.html: the real pages of
 * 2026-11-20 reduced to their title, header and track rows; the search answer is the real one.
 */
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fakeHttp, loadHtml } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')

const FIXTURES = path.join(process.cwd(), 'test/fixtures/besteveralbums')
const page = (name) => fs.readFileSync(path.join(FIXTURES, 'tracks', `${name}.html`), 'utf8')
const SUGGEST_HIGH_VOLTAGE = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'suggest', 'ac-dc-high-voltage.json'), 'utf8')).answer
const { albums } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'test/fixtures/trackIdentity/measuredAlbums.json'), 'utf8'))
const tracksOf = (name) => albums.find(one => one.album === name).tracks.map(title => ({ title }))

const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
const NOTHING = ['q', [], [], []]
const AUSTRALIAN = 'thechart.php?a=3208'
const INTERNATIONAL = 'thechart.php?a=29327'
const queryOf = (url) => decodeURIComponent(url.split('q=')[1] || '')
const requested = (http) => http.get.mock.calls.map(([url]) => url)

const scraperWith = (routes) => {
    const http = fakeHttp(routes)
    return { http, scraper: createBestEverScraper({ http, loadHtml, logger: quiet }) }
}

/** The source as it answers for AC/DC «High Voltage» when the artist's own page is not found. */
const bySuggest = () => scraperWith([
    ['suggest.php', (url) => (queryOf(url) === 'AC/DC High Voltage' ? SUGGEST_HIGH_VOLTAGE : NOTHING)],
    [INTERNATIONAL, page('high-voltage-international-29327')],
    [AUSTRALIAN, page('high-voltage-3208')]
])

/** The same, with the artist's own page listing its albums (the first attempt of the search). */
const artistPage = `<html><head><title>AC/DC | Best Ever Albums</title></head><body><h1><span itemprop="name">AC/DC</span></h1>
<a href="/thechart.php?a=3208" title="details">High Voltage</a>
<a href="/thechart.php?a=29327" title="details">High Voltage (International)</a>
<a href="/thechart.php?a=145" title="details">Back In Black</a>
</body></html>`
const byArtistPage = () => scraperWith([
    ['suggest.php', ['AC/DC', ['AC/DC'], [], ['https://www.besteveralbums.com/thechart.php?b=929']]],
    ['thechart.php?b=929', artistPage],
    [INTERNATIONAL, page('high-voltage-international-29327')],
    [AUSTRALIAN, page('high-voltage-3208')]
])

describe('the scraper keeps the number the page gives each track', () => {
    it('«In The Court Of The Crimson King»: five tracks, each with its rating and its number', async () => {
        const { scraper } = scraperWith([['thechart.php?a=1169', page('in-the-court-of-the-crimson-king-1169')]])

        const ranking = await scraper.getRankingFromUrl('https://www.besteveralbums.com/thechart.php?a=1169')

        expect([...ranking.evidence].sort((a, b) => a.trackNumber - b.trackNumber)).toEqual([
            { trackTitle: '21st Century Schizoid Man Including Mirrors', rating: 93, trackNumber: 1 },
            { trackTitle: 'I Talk To The Wind', rating: 90, trackNumber: 2 },
            { trackTitle: 'Epitaph Including March For No Reason & Tomorrow And Tomorrow', rating: 93, trackNumber: 3 },
            { trackTitle: 'Moonchild Including The Dream & The Illusion', rating: 82, trackNumber: 4 },
            { trackTitle: 'The Court Of The Crimson King Including The Return Of The Fire Witch & The Dance Of The Puppets', rating: 93, trackNumber: 5 }
        ])
    })
})

describe('two pages of the source under one name: the tracks of the album choose the edition', () => {
    const international = tracksOf('High Voltage')

    it('with no tracks given, the page the identity rule takes by its name is the answer (as before)', async () => {
        const { scraper, http } = bySuggest()

        const ranking = await scraper.getRankingForAlbum('High Voltage', 'AC/DC')

        expect(ranking.albumId).toBe('3208')
        expect(requested(http).some(url => url.includes(INTERNATIONAL))).toBe(false)
    })

    it('with the tracks of the international record, its page is the answer: nine tracks, all rated', async () => {
        const { scraper } = bySuggest()

        const ranking = await scraper.getRankingForAlbum('High Voltage', 'AC/DC', { tracks: international })

        expect(ranking.albumId).toBe('29327')
        expect(ranking.referenceUrl).toContain(INTERNATIONAL)
        expect(ranking.evidence.map(entry => entry.trackTitle)).toContain('It\'s A Long Way To The Top (If You Wanna Rock \'N\' Roll)')
        expect(ranking.evidence).toHaveLength(9)
    })

    it('the same when the album was found on the page of the artist', async () => {
        const { scraper } = byArtistPage()

        const ranking = await scraper.getRankingForAlbum('High Voltage', 'AC/DC', { tracks: international })

        expect(ranking.albumId).toBe('29327')
    })

    it('with the tracks of the Australian record, the first page stays and the other is not even read', async () => {
        const { scraper, http } = byArtistPage()
        const australian = ['Baby Please Don\'t Go', 'She\'s Got Balls', 'Little Lover', 'Stick Around', 'Soul Stripper', 'You Ain\'t Got a Hold On Me', 'Love Song', 'Show Business']

        const ranking = await scraper.getRankingForAlbum('High Voltage', 'AC/DC', { tracks: australian.map(title => ({ title })) })

        expect(ranking.albumId).toBe('3208')
        expect(requested(http).some(url => url.includes(INTERNATIONAL))).toBe(false)
    })

    it('an album of another name is never read as an edition: «Back In Black» is not asked for', async () => {
        const { scraper, http } = byArtistPage()

        await scraper.getRankingForAlbum('High Voltage', 'AC/DC', { tracks: international })

        expect(requested(http).some(url => url.includes('a=145'))).toBe(false)
    })

    it('tracks that are on neither page: the page the identity rule took stays', async () => {
        const { scraper } = bySuggest()

        const ranking = await scraper.getRankingForAlbum('High Voltage', 'AC/DC', { tracks: [{ title: 'Something Else' }, { title: 'Another One' }] })

        expect(ranking.albumId).toBe('3208')
    })
})
