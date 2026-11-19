/**
 * Fitness functions of the one album identity rule (F55, UAT-184; arch.md, "Uma regra só para
 * dizer que é o mesmo álbum").
 *
 * "Is this the album that was asked for?" used to be decided in five places, each in its own way,
 * most of them by "one text contains the other". These tests read the source files and fail when
 * a place that accepts an album stops asking the rule, or starts comparing texts by itself again.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')

/** The module specifiers a file imports: `import ... from`, `export ... from`, `import()`, `require()`. */
const importsOf = (relative) => {
    const pattern = /(?:\b(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g
    return [...read(relative).matchAll(pattern)].map(match => match[1])
}

/** The part of a file between two markers (the whole file when none is given). */
const region = (relative, from, to) => {
    const source = read(relative)
    if (!from) return source
    const start = source.indexOf(from)
    const end = source.indexOf(to, start)
    if (start === -1 || end === -1) throw new Error(`${relative}: the region "${from}" .. "${to}" was not found; update this test with the new names`)
    return source.slice(start, end)
}

const RULE = 'shared/albumIdentity.js'
const APP_SIDE = 'public/js/models/askedAlbum.js'
const SERVER_SIDE = 'server/lib/albumIdentity.js'

/**
 * Every place that receives candidates from a source and accepts one as "the album asked for".
 * `asks` is the module it must import; `from`/`to` bound the part of the file that decides.
 */
const CALL_SITES = [
    { name: 'Apple Music catalog (the album load)', file: 'public/js/services/albums/adapters/CatalogAdapter.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'the AI answer', file: 'public/js/api/client.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'Spotify', file: 'public/js/services/SpotifyService.js', asks: /models\/askedAlbum\.js$/, from: 'async searchAlbum(', to: 'async getAlbumDetails(' },
    { name: 'the local dataset', file: 'public/js/services/OptimizedAlbumLoader.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'BestEverAlbums (server)', file: 'server/lib/scrapers/besteveralbums.js', asks: /^\.\.\/albumIdentity$/ },
    { name: 'Spotify (server)', file: 'server/lib/services/spotifyPopularity.js', asks: /^\.\.\/albumIdentity$/ },
    { name: 'the read-only count', file: 'public/js/services/albums/albumIdentityAudit.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'the album cache, when it is read', file: 'public/js/services/albums/adapters/AlbumCacheAdapter.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'adding and removing an album of a series', file: 'public/js/services/SeriesService.js', asks: /models\/askedAlbum\.js$/, from: 'async addAlbumToSeries(', to: 'async enrichAllAlbums(' }
]

describe('one rule says "this is the album asked for"', () => {
    it('the rule is pure: it imports nothing', () => {
        expect(importsOf(RULE)).toEqual([])
    })

    it('the app and the server reach the same file', () => {
        expect(importsOf(APP_SIDE)).toContain('@shared/albumIdentity.js')
        expect(importsOf(SERVER_SIDE)).toEqual(['../../shared/albumIdentity.js'])
    })

    CALL_SITES.forEach(({ name, file, asks }) => {
        it(`${name} asks the rule (${file})`, () => {
            expect(importsOf(file).some(specifier => asks.test(specifier))).toBe(true)
        })
    })

    CALL_SITES.forEach(({ name, file, from, to }) => {
        it(`${name} compares no text by itself (${file})`, () => {
            const source = region(file, from, to)
            // "contains" with a value that is not a fixed text: title.includes(target), text.includes(qArtist)
            const contains = source.match(/\.(?:includes|indexOf|startsWith|endsWith)\(\s*[A-Za-z_$][\w$.]*\s*[,)]/g) || []
            // the normalizers and scores each place used to bring: they are not the rule
            const ownWays = source.match(/\b(?:toCore|toFuzzyCore|normalizeFuzzy|normalizeArtist|calculateSimilarity|_similarityScore|_levenshteinDistance|_validateMatch|isValid)\s*\(/g) || []

            expect({ contains: contains.filter(found => !ALLOWED[file]?.includes(found)), ownWays }).toEqual({ contains: [], ownWays: [] })
        })
    })

    it('the confidence score that let any album of the right artist pass is gone, and nothing imports it', () => {
        expect(fs.existsSync(path.join(ROOT, 'public/js/models/AlbumIdentity.js'))).toBe(false)

        const stringUtils = read('public/js/utils/stringUtils.js')
        expect(/SIMILARITY_THRESHOLD|calculateSimilarity/.test(stringUtils)).toBe(false)
    })

    it('no candidate that passes means "not found": no call site keeps a "first result" to fall back on', () => {
        const fallbacks = CALL_SITES.flatMap(({ file, from, to }) =>
            (region(file, from, to).match(/\|\|\s*\w+\[0\]|items\[0\]|results\[0\]|candidates\[0\]/g) || []).map(found => `${file}: ${found}`))

        expect(fallbacks).toEqual([])
    })
})

/**
 * The second tier (F55, slice 2): "the title asked for is the candidate's title before a subtitle"
 * is the same album only when pickAlbum, seeing every candidate of a source, finds no first-tier
 * candidate and no other album like it. A call site cannot grant it by itself.
 */
describe('the second tier of the rule is granted only by pickAlbum, over the list a source gave', () => {
    const sources = CALL_SITES.map(({ file, from, to }) => ({ file, source: region(file, from, to) }))
    const found = (pattern) => sources.flatMap(({ file, source }) => (source.match(pattern) || []).map(text => `${file}: ${text}`))

    it('no call site names the second-tier verdict or its reason: it reads `same` and `found`, and stores the reason it was given', () => {
        expect(found(/SAME_IF_ALONE|same-if-alone|TITLE_BEFORE_SUBTITLE|title-before-subtitle/g)).toEqual([])
    })

    it('no call site decides from the kind of verdict: `.verdict` is never compared', () => {
        // the count compares the verdict of its OWN rows (same, different, not loaded) to add them up
        const ownRows = 'public/js/services/albums/albumIdentityAudit.js: row.verdict ==='

        expect(found(/\b\w+\.verdict\s*[!=]==?/g).filter(text => text !== ownRows)).toEqual([])
    })

    it('no call site hands pickAlbum a list it made of one candidate: one candidate is always "alone"', () => {
        expect(found(/pickAlbum\([^()]*,\s*\[/g)).toEqual([])
    })

    it('only the rule turns the second tier into "same": pickAlbum (candidates in sight) and compareKeptAlbum (the reason a pick left on the album)', () => {
        const rule = read(RULE)
        const granted = rule.match(/SAME\([^)]*\)/g).filter(call => !/Reason\.(EXACT_TITLE|EDITION_OF_TITLE|ARTIST_AND_TITLE_IN_ONE_TEXT)|askedTitle\.whole/.test(call))

        expect(granted).toEqual(['SAME(verdict.reason)', 'SAME(best.verdict.reason)'])
    })
})

/**
 * The corrected Apple Music id goes back to the series by ONE writer (F55, slice 2): the catalog
 * adapter says which stored id the album did not come from, the query model turns that into the
 * corrected query, and SeriesFactsService writes it with the facts, through the repository.
 */
describe('one writer for the corrected Apple Music id', () => {
    const appFiles = (dir = 'public/js') => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(entry => {
        const relative = `${dir}/${entry.name}`
        if (entry.isDirectory()) return appFiles(relative)
        return entry.name.endsWith('.js') ? [relative] : []
    })
    const filesWith = (pattern) => appFiles().filter(file => pattern.test(read(file))).sort()

    it('only the catalog adapter says an id was replaced, and only the query model reads it', () => {
        expect(filesWith(/replacedSourceId/)).toEqual([
            'public/js/models/albumQuery.js',
            'public/js/services/albums/adapters/CatalogAdapter.js'
        ])
    })

    it('the corrected query is made in one place and written by one service, through one repository method', () => {
        expect(filesWith(/withCorrectedSources?\(/)).toEqual([
            'public/js/models/albumFacts.js',
            'public/js/models/albumQuery.js',
            'public/js/services/series/SeriesFactsService.js'
        ])
        expect(filesWith(/saveAlbumFacts\(/)).toEqual([
            'public/js/repositories/SeriesRepository.js',
            'public/js/services/albums/albumLoading.js',
            'public/js/services/series/SeriesFactsService.js'
        ])
    })
})

/**
 * Text checks that are not a comparison of album names, by file. Each entry is the exact text.
 * - the scraper reads the header of a page: the header ends with the name of the artist it links.
 */
const ALLOWED = {
    'server/lib/scrapers/besteveralbums.js': ['.endsWith(artist)']
}
