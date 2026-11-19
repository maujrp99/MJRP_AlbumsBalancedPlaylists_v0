/**
 * F68 - the sweep of 2026-11-19, run again OFFLINE.
 *
 * On 2026-11-19 the ratings source (BestEverAlbums) answered "not found" for 16 of the 199 albums
 * of the owner's account. What the source really answers to each search text was asked on the same
 * day and saved, as it came, under test/fixtures/besteveralbums/suggest/ (one file per text). This
 * test runs the 16 albums, and the cases the rule already had, through the scraper's own search
 * and the one identity rule, against those saved answers, and asserts the table of
 * test/fixtures/besteveralbums/sweep-2026-11-19.json: found, by which reason of the rule and in
 * which attempt of the search, or legitimately not found.
 *
 * What was NOT saved, and how the test stands in for it: the artist's page (thechart.php?b=) and
 * the HTML search (search.php) answer an empty page here. So this proves the album search alone
 * finds each album; in production the artist's page is asked first and may find it earlier, by the
 * same rule. A search text with no saved answer FAILS the test: nothing is invented.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { loadHtml } from './helpers/fakes.js'
import { pickAlbum, albumFromLabel, Reason } from '../../shared/albumIdentity.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')

const FIXTURES = path.join(process.cwd(), 'test/fixtures/besteveralbums')
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const SWEEP = readJson(path.join(FIXTURES, 'sweep-2026-11-19.json'))
const SAVED = fs.readdirSync(path.join(FIXTURES, 'suggest')).map(file => readJson(path.join(FIXTURES, 'suggest', file)))
const ANSWERS = new Map(SAVED.map(saved => [saved.q, saved.answer]))

const EMPTY_PAGE = '<html><head><title>Best Ever Albums</title></head><body></body></html>'
const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }

/** The source, as it answered on 2026-11-19. */
const savedSource = () => {
    const asked = []
    const get = vi.fn(async (url) => {
        if (!url.includes('suggest.php?q=')) return { status: 200, data: EMPTY_PAGE } // not saved: see the header
        const text = decodeURIComponent(url.split('q=')[1])
        asked.push(text)
        if (!ANSWERS.has(text)) throw new Error(`no saved answer of the source for the search text "${text}"`)
        return { status: 200, data: ANSWERS.get(text) }
    })
    return { http: { get }, asked }
}

const labelOf = ({ artist, title }) => `${artist} - ${title}`

describe('the saved answers are the source\'s own', () => {
    it('one file per search text, each a 200 in the shape suggest.php answers', () => {
        expect(ANSWERS.size).toBe(SAVED.length)
        SAVED.forEach(({ q, status, answer }) => {
            expect(status, q).toBe(200)
            expect(answer[0], q).toBe(q)
            expect(answer[1].length, q).toBe(answer[3].length)
        })
    })
})

describe('the 16 albums the source did not find on 2026-11-19', () => {
    SWEEP.albums.forEach((album) => {
        const { expected } = album
        const outcome = expected.found ? `found (${expected.reason}, by ${expected.attempt})` : `not found (${expected.why})`

        it(`${album.n}. ${labelOf(album)}: ${outcome}`, async () => {
            const { http } = savedSource()
            const scraper = createBestEverScraper({ http, loadHtml, logger: quiet })

            const found = await scraper.locateAlbum(album.title, album.artist)

            if (!expected.found) {
                expect(found).toBeNull()
                return
            }
            expect(found).toMatchObject({ id: expected.albumId, reason: expected.reason, attempt: expected.attempt })
        })
    })

    it('10 of the 16 are found; 3 are another release and 3 are not in the source', () => {
        const count = (test) => SWEEP.albums.filter(test).length

        expect(SWEEP.albums).toHaveLength(16)
        expect(count(album => album.expected.found)).toBe(10)
        expect(count(album => album.expected.why === 'another-release')).toBe(3)
        expect(count(album => album.expected.why === 'not-in-the-source')).toBe(3)
    })

    it('every reason an album is found by is a reason of the rule', () => {
        const reasons = new Set(Object.values(Reason))

        SWEEP.albums.filter(album => album.expected.found).forEach(album => {
            expect(reasons.has(album.expected.reason), labelOf(album)).toBe(true)
        })
    })

    it('an album that is another release is refused although the source lists the album it comes from', async () => {
        // The source lists «Balls To Picasso», «Unreal Unearth» and «Before The Frost...» for the artist
        const listed = (text) => ANSWERS.get(text)[1]

        expect(listed('Bruce Dickinson')).toContain('Balls To Picasso by Bruce Dickinson')
        expect(listed('Hozier')).toContain('Unreal Unearth by Hozier')
        expect(listed('The Black Crowes')).toContain('Before The Frost... by The Black Crowes')
    })
})

describe('the search asks the source politely: few texts, each once', () => {
    const textsAskedFor = async ({ title, artist }) => {
        const { http, asked } = savedSource()
        await createBestEverScraper({ http, loadHtml, logger: quiet }).locateAlbum(title, artist)
        return asked
    }

    it('an edition note is never sent: «Foxtrot (2007 Stereo Mix)» is asked for as «Foxtrot»', async () => {
        const asked = await textsAskedFor({ artist: 'Genesis', title: 'Foxtrot (2007 Stereo Mix)' })

        expect(asked).toEqual(['Genesis', 'Genesis Foxtrot'])
    })

    it('the title is asked alone when the artist written our way lists nothing', async () => {
        const asked = await textsAskedFor({ artist: 'Robert Plant & The Strange Sensation', title: 'Mighty ReArranger (Bonus Tracks)' })

        expect(asked).toEqual([
            'Robert Plant & The Strange Sensation',
            'Robert Plant & The Strange Sensation Mighty ReArranger',
            'Mighty ReArranger'
        ])
    })

    it('a known other writing is asked for after the title as written', async () => {
        const asked = await textsAskedFor({ artist: 'AC/DC', title: 'POWER UP' })

        expect(asked).toEqual(['AC/DC', 'AC/DC POWER UP', 'AC/DC PWR/UP'])
    })

    it('an album the source does not have costs the artist, the title with the artist and the title alone: three texts', async () => {
        const asked = await textsAskedFor({ artist: 'Solarstone', title: 'Rain Stars Eternal' })

        expect(asked).toEqual(['Solarstone', 'Solarstone Rain Stars Eternal', 'Rain Stars Eternal'])
    })
})

describe('the artist\'s page is reached when the source writes the names in another order', () => {
    it('«Robert Plant & Jimmy Page» opens the page of «Jimmy Page & Robert Plant» and takes the album from it', async () => {
        // The page itself was not saved: this one lists the two albums the saved search says the artist has.
        const page = `<html><body><h1>Jimmy Page &amp; Robert Plant</h1>
            <a href="/thechart.php?a=11402">No Quarter: Jimmy Page And Robert Plant Unledded</a>
            <a href="/thechart.php?a=23608">Walking Into Clarksdale</a></body></html>`
        const get = vi.fn(async (url) => {
            if (url.includes('thechart.php?b=10945')) return { status: 200, data: page }
            const text = decodeURIComponent(url.split('q=')[1] || '')
            if (!ANSWERS.has(text)) throw new Error(`not expected: ${url}`)
            return { status: 200, data: ANSWERS.get(text) }
        })
        const scraper = createBestEverScraper({ http: { get }, loadHtml, logger: quiet })

        await expect(scraper.locateAlbum('Walking Into Clarksdale', 'Robert Plant & Jimmy Page'))
            .resolves.toMatchObject({ id: '23608', reason: Reason.EXACT_TITLE, attempt: 'artist-page' })
    })
})

describe('the cases the rule already had, against what the source really lists', () => {
    const albumRows = (fixture) => {
        const answer = readJson(path.join(FIXTURES, 'suggest', `${fixture}.json`)).answer
        return answer[3]
            .map((url, i) => ({ label: answer[1][i], id: (String(url).match(/thechart\.php\?a=(\d+)/) || [])[1] }))
            .filter(row => row.id)
    }

    SWEEP.earlier.forEach((earlier) => {
        const { expected } = earlier

        it(`${earlier.case}: ${expected.found ? `page ${expected.albumId} (${expected.reason})` : 'not found'}`, () => {
            const picked = pickAlbum({ artist: earlier.artist, title: earlier.title }, albumRows(earlier.fixture), row => albumFromLabel(row.label))

            expect(picked.found).toBe(expected.found)
            if (expected.found) expect({ id: picked.candidate.id, reason: picked.verdict.reason }).toEqual({ id: expected.albumId, reason: expected.reason })
        })
    })
})
