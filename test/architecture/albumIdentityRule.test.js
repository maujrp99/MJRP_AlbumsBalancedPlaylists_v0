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
import {
    ARTIST_EQUIVALENCES, SECOND_TIER_RULES, KNOWN_WRITINGS, IDENTITY_RULE_VERSION, Reason
} from '../../shared/albumIdentity.js'

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
    // F75: which Discogs master, or CD release, is the album whose value is asked for
    { name: 'Discogs (server)', file: 'server/lib/valueSources/discogsSource.js', asks: /^\.\.\/albumIdentity$/ },
    { name: 'the read-only count', file: 'public/js/services/albums/albumIdentityAudit.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'the album cache, when it is read', file: 'public/js/services/albums/adapters/AlbumCacheAdapter.js', asks: /models\/askedAlbum\.js$/ },
    { name: 'adding and removing an album of a series', file: 'public/js/services/SeriesService.js', asks: /models\/askedAlbum\.js$/, from: 'async addAlbumToSeries(', to: 'async enrichAllAlbums(' },
    // F71: "is this album already in the inventory?", for the albums of the series and for an album card
    { name: 'the albums of the series put in the inventory', file: 'public/js/models/inventoryFromSeries.js', asks: /(^|\/)askedAlbum\.js$/ }
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
 * The second tier (F55, slice 2; a list of named rules since F68): a candidate one of its rules
 * accepts is the same album only when pickAlbum, seeing every candidate of a source, finds no
 * first-tier candidate and no other album like it. A call site cannot grant it by itself.
 */
describe('the second tier of the rule is granted only by pickAlbum, over the list a source gave', () => {
    const sources = CALL_SITES.map(({ file, from, to }) => ({ file, source: region(file, from, to) }))
    const found = (pattern) => sources.flatMap(({ file, source }) => (source.match(pattern) || []).map(text => `${file}: ${text}`))

    it('no call site names the second-tier verdict or one of its reasons: it reads `same` and `found`, and stores the reason it was given', () => {
        const reasons = SECOND_TIER_RULES.map(rule => rule.reason)
        const names = Object.entries(Reason).filter(([, value]) => reasons.includes(value)).map(([name]) => name)

        expect(reasons.length).toBeGreaterThan(1)
        expect(found(new RegExp(['SAME_IF_ALONE', 'same-if-alone', 'SECOND_TIER_RULES', ...names, ...reasons].join('|'), 'g'))).toEqual([])
    })

    it('no call site decides from the kind of verdict: `.verdict` is never compared', () => {
        // the count compares the verdict of its OWN rows (same, different, not loaded) to add them up
        const ownRows = 'public/js/services/albums/albumIdentityAudit.js: row.verdict ==='

        expect(found(/\b\w+\.verdict\s*[!=]==?/g).filter(text => text !== ownRows)).toEqual([])
    })

    it('no call site hands pickAlbum a list it made of one candidate: one candidate is always "alone"', () => {
        expect(found(/pickAlbum\([^()]*,\s*\[/g)).toEqual([])
    })

    it('only the rule turns the second tier into "same", through ONE door: pickAlbum (candidates in sight) and compareKeptAlbum (the reason a pick left on the album)', () => {
        const rule = read(RULE)
        // every place that builds the verdict `same` (not `.same(...)` of an equivalence, not a mention in a comment)
        const builtSame = [...rule.matchAll(/(?<![.\w`])same\(([^)]*)\)/g)].map(match => match[1])
        const throughTheDoor = [...rule.matchAll(/(?<!const )\bacceptedAlone\(([^)]*)\)/g)].map(match => match[1])

        expect(builtSame).toEqual([
            'asked.title.whole === candidate.title.whole ? Reason.EXACT_TITLE : Reason.EDITION_OF_TITLE', // firstTier
            'Reason.ARTIST_AND_TITLE_IN_ONE_TEXT', // firstTier, a query with no artist
            'verdict.reason' // the door: acceptedAlone
        ])
        expect(throughTheDoor).toEqual(['best.verdict', 'verdict']) // pickAlbum, compareKeptAlbum
    })

    it('a rule of the second tier only answers for two albums: it builds no verdict and reads nothing else', () => {
        const rule = read(RULE)
        const list = rule.slice(rule.indexOf('export const SECOND_TIER_RULES'), rule.indexOf('function secondTier('))

        expect(list.match(/\b(?:same|sameIfAlone|different|acceptedAlone|pickAlbum)\(/g)).toBeNull()
        expect(list.match(/\.(?:includes|indexOf|startsWith|endsWith)\(/g)).toEqual(['.includes(']) // the keys before a subtitle, whole
        SECOND_TIER_RULES.forEach(({ reason, says, example, applies }) => {
            expect(Object.values(Reason), reason).toContain(reason)
            expect(typeof says, reason).toBe('string')
            expect(example?.asked?.title && example?.candidate?.title, reason).toBeTruthy()
            expect(applies.length, reason).toBe(2)
        })
    })
})

/**
 * The rule is a set of lists (F68). A list that changes can turn a "not found" the browsers keep
 * into a found album, so the lists and IDENTITY_RULE_VERSION move TOGETHER: add or change a rule,
 * then bump the version in shared/albumIdentity.js and write both here.
 */
describe('the lists of the rule and its version move together', () => {
    it('version 2: these equivalences of artists, these rules of the second tier, these known writings', () => {
        expect({
            version: IDENTITY_RULE_VERSION,
            artists: ARTIST_EQUIVALENCES.map(equivalence => equivalence.name),
            secondTier: SECOND_TIER_RULES.map(rule => rule.reason),
            knownWritings: KNOWN_WRITINGS.map(known => `${known.artist}: ${known.titles.join(' = ')}`)
        }).toEqual({
            version: 2,
            artists: ['same-words', 'same-names-in-another-order'],
            secondTier: ['title-before-subtitle', 'title-without-parentheses', 'title-in-parentheses', 'title-with-artist-name', 'title-written-otherwise'],
            knownWritings: ['Frank Ocean: Blonde = Blond', 'Joy Division: Substance 1977-1980 = Substance', 'AC/DC: POWER UP = PWR/UP']
        })
    })

    it('the app and the server stamp and check ONE constant, the rule\'s', () => {
        expect(read(APP_SIDE)).toMatch(/IDENTITY_RULE_VERSION/)
        expect(read('public/js/services/albums/adapters/AlbumCacheAdapter.js')).toMatch(/saved\.rule === IDENTITY_RULE_VERSION/)
        expect(read('server/lib/services/EnrichmentService.js')).toMatch(/identityRule: IDENTITY_RULE_VERSION/)
    })
})

/**
 * The text a source is searched with is part of finding an album (F68): it comes from the rule
 * (`titleWithoutEditionNotes`, `titlesToSearch`). The two title cleaners the app and the server
 * had, each with its own list of edition words, are gone.
 */
describe('one way to take the edition notes out of a title', () => {
    const sourceFiles = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(entry => {
        const relative = `${dir}/${entry.name}`
        if (entry.name === 'node_modules') return []
        if (entry.isDirectory()) return sourceFiles(relative)
        return entry.name.endsWith('.js') ? [relative] : []
    })

    it('no file of the app or of the server has or calls a title cleaner of its own', () => {
        const withCleaner = ['public/js', 'server/lib', 'server/routes'].flatMap(sourceFiles).filter(file => /\bcleanTitle\s*\(/.test(read(file)))

        expect(withCleaner).toEqual([])
    })

    it('the three searches by title ask the rule for the title to send', () => {
        expect(read('server/lib/scrapers/besteveralbums.js')).toMatch(/titlesToSearch\(asked\)/)
        expect(read('server/lib/services/spotifyPopularity.js')).toMatch(/titleWithoutEditionNotes\(asked\.title\)/)
        expect(read('public/js/services/SpotifyService.js')).toMatch(/titleWithoutEditionNotes\(albumName\)/)
    })

    it('the scraper cuts no title by itself: no split at ":" or " - "', () => {
        expect(read('server/lib/scrapers/besteveralbums.js').match(/\.split\(\s*['"](?::| - )['"]\s*\)/g)).toBeNull()
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
