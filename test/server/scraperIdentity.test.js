/**
 * F55, slice 1 (and F52, section 11, item 5) - the BestEverAlbums scraper accepts a page only when
 * it is the album asked for, by the one identity rule (shared/albumIdentity.js), at every point
 * where it used to accept by "one text contains the other". No network: the HTTP client and the
 * HTML reader are injected. The answers below have the shape the source gives (read on 2026-11-19).
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { fakeHttp, loadHtml } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')

const STP = 'Stone Temple Pilots'
const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
const NOTHING = ['q', [], [], []]
const EMPTY_PAGE = '<html><head><title>Search | Best Ever Albums</title></head><body></body></html>'
const queryOf = (url) => decodeURIComponent(url.split('q=')[1] || '')

/** suggest.php answers [query, labels, [], urls, types, short labels]. */
const suggest = (...rows) => ['q', rows.map(r => r[0]), [], rows.map(r => r[1])]
const album = (title, artist, id) => [`${title} by ${artist}`, `https://www.besteveralbums.com/thechart.php?a=${id}`]
const artistRow = (name, id) => [name, `https://www.besteveralbums.com/thechart.php?b=${id}`]

const albumPage = (title, artist) => `<html><head><title>${title} by ${artist} | Album Rankings &amp; Reviews | Best Ever Albums</title></head>
<body><h1 id="info">${title}<br>by <a class="nav2" href="/thechart.php?b=1">${artist}</a></h1>
</body></html>`
const artistPage = (name, albums) => `<html><head><title>${name} | Best Ever Albums</title></head><body>
<h1><span itemprop="name">${name}</span></h1>
${albums.map(([title, id]) => `<a href="/thechart.php?a=${id}#ratings">70 (10 votes)</a><a href="/thechart.php?a=${id}" title="details">${title}</a>`).join('\n')}
</body></html>`

const scraperWith = (routes) => {
    const http = fakeHttp(routes)
    return { http, scraper: createBestEverScraper({ http, loadHtml, logger: quiet }) }
}
const requested = (http) => http.get.mock.calls.map(([url]) => url)

describe('the album search of the source (suggest)', () => {
    it('«Core» asked for, only other albums of the artist offered: not found, never the neighbour (UAT-184)', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('Shangri-La Dee Da', STP, 8473), album('Purple', STP, 2438), album('Core Memories', STP, 999))],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBeNull()
    })

    it('picks the album asked for among the albums of the artist, whatever the order', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('Shangri-La Dee Da', STP, 8473), album('Core', STP, 2906), album('Purple', STP, 2438))]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBe('2906')
    })

    it('an edition asked for finds the album: «Core (Deluxe Edition)» is «Core»', async () => {
        const { scraper } = scraperWith([['suggest.php', suggest(album('Core', STP, 2906))]])

        await expect(scraper.findAlbumId('Core (Deluxe Edition)', STP)).resolves.toBe('2906')
    })

    it('the same title by another artist is not the album', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('Core', 'Persefone', 700))],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBeNull()
    })

    it('a result that is not an album page (a forum post, an artist) is never an album', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(
                ['Album of the day (#2501): Core by Stone Temple Pilots by BestEverAlbums', 'https://www.besteveralbums.com/forums/viewtopic.php?p=489539'],
                artistRow(STP, 1881)
            )],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBeNull()
    })

    it('a title with " by " inside is read whole', async () => {
        const { scraper } = scraperWith([['suggest.php', suggest(album('Stand by Me', 'Ben E. King', 41))]])

        await expect(scraper.findAlbumId('Stand by Me', 'Ben E. King')).resolves.toBe('41')
    })

    it('the search by the artist alone does not accept another album of the artist', async () => {
        // The first search knows nothing; the variation that asks for the artist alone lists the artist's albums.
        const { scraper } = scraperWith([
            ['suggest.php', (url) => (queryOf(url) === STP
                ? suggest(artistRow(STP, 1881), album('Shangri-La Dee Da', STP, 8473), album('Purple', STP, 2438))
                : NOTHING)],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBeNull()
    })

    it('the search by the artist alone finds the album when it is there', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', (url) => (queryOf(url) === STP ? suggest(album('Purple', STP, 2438), album('Core', STP, 2906)) : NOTHING)],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBe('2906')
    })
})

describe('a page is accepted for what it says it is, not for a text it contains', () => {
    it('a result with no readable label is checked on its page: the page of another album is refused', async () => {
        // The page of «Shangri-La Dee Da» has "by Stone Temple Pilots" in its header and mentions «Core» in its text.
        const page = albumPage('Shangri-La Dee Da', STP).replace('</body>', '<p>Core is ranked 2nd best out of 12 albums</p></body>')
        const { scraper } = scraperWith([
            ['suggest.php', (url) => (queryOf(url).includes('Core') && queryOf(url).includes(STP) ? suggest(['Shangri-La Dee Da', '/thechart.php?a=8473']) : NOTHING)],
            ['thechart.php?a=8473', page],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBeNull()
    })

    it('a result with no readable label whose page is the album asked for is accepted', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(['Core', '/thechart.php?a=2906'])],
            ['thechart.php?a=2906', albumPage('Core', STP)]
        ])

        await expect(scraper.findAlbumId('Core', STP)).resolves.toBe('2906')
    })

    it('a result whose label says it is another album is not even opened', async () => {
        const { http, scraper } = scraperWith([
            ['suggest.php', suggest(album('Purple', STP, 2438))],
            ['search.php', EMPTY_PAGE]
        ])

        await scraper.findAlbumId('Core', STP)

        expect(requested(http).some(url => url.includes('thechart.php?a=2438'))).toBe(false)
    })

    it('the HTML search does not take the first link: each page is checked, and only the album asked for passes', async () => {
        const results = '<html><body><a href="/thechart.php?a=8473">Shangri-La Dee Da</a><a href="/thechart.php?a=2906">Core</a></body></html>'
        const { scraper } = scraperWith([
            ['suggest.php', NOTHING],
            ['search.php', results],
            ['thechart.php?a=8473', albumPage('Shangri-La Dee Da', STP)],
            ['thechart.php?a=2906', albumPage('Core', STP)]
        ])

        await expect(scraper.fetchAlbumPage('Core', STP)).resolves.toBe('https://www.besteveralbums.com/thechart.php?a=2906')
    })

    it('the HTML search with only other albums of the artist: nothing', async () => {
        const results = '<html><body><a href="/thechart.php?a=8473">Shangri-La Dee Da</a></body></html>'
        const { scraper } = scraperWith([
            ['suggest.php', NOTHING],
            ['search.php', results],
            ['thechart.php?a=8473', albumPage('Shangri-La Dee Da', STP)]
        ])

        await expect(scraper.fetchAlbumPage('Core', STP)).resolves.toBeNull()
    })
})

describe('getRankingForAlbum', () => {
    const discography = artistPage(STP, [['Shangri-La Dee Da', 8473], ['Core', 2906], ['Core Memories', 999]])

    it('an album absent from the source, with the artist present, is "not found" (null)', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', (url) => (queryOf(url) === STP ? suggest(artistRow(STP, 1881), album('Shangri-La Dee Da', STP, 8473)) : NOTHING)],
            ['thechart.php?b=1881', artistPage(STP, [['Shangri-La Dee Da', 8473], ['Purple', 2438]])],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.getRankingForAlbum('Core', STP)).resolves.toBeNull()
    })

    it('takes the album asked for from the page of the artist, by its title alone', async () => {
        const { http, scraper } = scraperWith([
            ['suggest.php', suggest(artistRow(STP, 1881))],
            ['thechart.php?b=1881', discography],
            ['thechart.php?a=2906', albumPage('Core', STP)]
        ])

        const ranking = await scraper.getRankingForAlbum('Core', STP)

        expect(ranking).toMatchObject({ provider: 'BestEverAlbums', albumId: '2906' })
        expect(requested(http).some(url => url.includes('a=8473') || url.includes('a=999'))).toBe(false)
    })

    it('the page of an artist with a longer name is not the page of the artist asked for', async () => {
        const { http, scraper } = scraperWith([
            ['suggest.php', (url) => (queryOf(url) === 'Page' ? suggest(artistRow('Page & Plant', 55)) : NOTHING)],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.getRankingForAlbum('No Quarter', 'Page')).resolves.toBeNull()
        expect(requested(http).some(url => url.includes('thechart.php?b=55'))).toBe(false)
    })
})

describe('the second tier of the rule: the source only has the title with a subtitle (F55, slice 2)', () => {
    const PAGE_PLANT = 'Jimmy Page & Robert Plant'
    const FLOYD = 'Pink Floyd'
    const UNLEDDED = 'No Quarter: Jimmy Page & Robert Plant Unledded'

    it('«No Quarter» asked for, the search lists only «No Quarter: … Unledded»: that page is the album', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('Walking Into Clarksdale', PAGE_PLANT, 500), album(UNLEDDED, PAGE_PLANT, 501))]
        ])

        await expect(scraper.findAlbumId('No Quarter', PAGE_PLANT)).resolves.toBe('501')
    })

    it('never before the album asked for: «The Wall» is taken, wherever «The Wall: Live in Berlin» comes in the list', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('The Wall: Live in Berlin', FLOYD, 601), album('The Wall', FLOYD, 600))]
        ])

        await expect(scraper.findAlbumId('The Wall', FLOYD)).resolves.toBe('600')
    })

    it('two albums with the title before a subtitle: not found', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(album('Greatest Hits: 1970-2002', 'Elton John', 701), album('Greatest Hits: Vol 2', 'Elton John', 702))],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.findAlbumId('Greatest Hits', 'Elton John')).resolves.toBeNull()
    })

    it('the page of the artist lists only the subtitled album: it is taken from there', async () => {
        const { scraper } = scraperWith([
            ['suggest.php', suggest(artistRow(PAGE_PLANT, 77))],
            ['thechart.php?b=77', artistPage(PAGE_PLANT, [['Walking Into Clarksdale', 500], [UNLEDDED, 501]])],
            ['thechart.php?a=501', albumPage(UNLEDDED, PAGE_PLANT)],
            ['search.php', EMPTY_PAGE]
        ])

        await expect(scraper.getRankingForAlbum('No Quarter', PAGE_PLANT)).resolves.toMatchObject({ albumId: '501' })
    })

    it('a page checked ALONE does not loosen: with nothing else in sight, «The Wall: Live in Berlin» is not «The Wall»', async () => {
        // The HTML search opens one page at a time and stops at the first it accepts: the second
        // tier there would let the subtitled album win over the album asked for, listed after it.
        const results = '<html><body><a href="/thechart.php?a=601">The Wall: Live in Berlin</a><a href="/thechart.php?a=600">The Wall</a></body></html>'
        const both = scraperWith([
            ['suggest.php', NOTHING],
            ['search.php', results],
            ['thechart.php?a=601', albumPage('The Wall: Live in Berlin', FLOYD)],
            ['thechart.php?a=600', albumPage('The Wall', FLOYD)]
        ])
        const onlySubtitled = scraperWith([
            ['suggest.php', NOTHING],
            ['search.php', '<html><body><a href="/thechart.php?a=601">The Wall: Live in Berlin</a></body></html>'],
            ['thechart.php?a=601', albumPage('The Wall: Live in Berlin', FLOYD)]
        ])

        await expect(both.scraper.fetchAlbumPage('The Wall', FLOYD)).resolves.toBe('https://www.besteveralbums.com/thechart.php?a=600')
        await expect(onlySubtitled.scraper.fetchAlbumPage('The Wall', FLOYD)).resolves.toBeNull()
    })
})
