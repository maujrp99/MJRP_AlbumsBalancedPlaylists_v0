/**
 * What the server reads from outside and turns into its own shapes: the text of the AI answer
 * and the positions several sources give to the tracks of an album.
 *
 * These cases lived in server/test/ as plain Node scripts that no command of the project ran to
 * the end (UAT-21): they are here so that `npx vitest run` runs them with everything else (F65).
 * Nothing here reaches the network. Not brought over: the album schema (the root installs
 * another major version of `ajv` than the server) and the chart page of the ratings source
 * (`cheerio` is a dependency of the server only); the scraper is covered by scraperIdentity,
 * ratings and ratingsPace with the page reader injected.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { cleanFencedMarkdown, tryParseJson, extractAlbum } = require('../../server/lib/normalize.js')
const { consolidateRanking, normalizeKey } = require('../../server/lib/ranking.js')

describe('the text of the AI answer', () => {
    it('loses its Markdown fence', () => {
        expect(cleanFencedMarkdown('```json\n{"title":"T"}\n```')).toBe('{"title":"T"}')
    })

    it('is read as JSON when it is JSON, or when JSON is inside a fence among other text', () => {
        expect(tryParseJson('{"a":1}')).toEqual({ a: 1 })
        expect(tryParseJson('some text ```json\n{"b":2}\n``` more')).toEqual({ b: 2 })
    })

    it('is null when there is no JSON in it', () => {
        expect(tryParseJson('no json here')).toBeNull()
    })

    it('gives the album written in the text of the first candidate', () => {
        const text = '```json\n{"tracks":[{"id":"t1","rank":1,"title":"A"}] }\n```'
        const album = extractAlbum({ data: { candidates: [{ content: { parts: [{ text }] } }] } })
        expect(album.tracks[0].title).toBe('A')
    })

    it('gives the album as it is when the answer already carries it as data', () => {
        const album = { title: 'X', artist: 'Y', tracks: [] }
        expect(extractAlbum({ data: { data: album } })).toEqual(album)
    })
})

describe('the positions several sources give to the tracks of an album', () => {
    it('a title is compared without case, punctuation or extra spaces', async () => {
        const normalize = await normalizeKey()
        expect(normalize('  Foo  Bar! ')).toBe('foo bar')
    })

    it('the track more sources place higher comes first', async () => {
        const tracks = [{ title: 'Track A' }, { title: 'Track B' }]
        const positions = [
            { provider: 'P1', trackTitle: 'Track A', position: 1 },
            { provider: 'P2', trackTitle: 'Track B', position: 1 },
            { provider: 'P3', trackTitle: 'Track A', position: 2 }
        ]

        const { results } = await consolidateRanking(tracks, positions)

        expect(results.map(row => [row.trackTitle, row.finalPosition])).toEqual([['Track A', 1], ['Track B', 2]])
    })
})
