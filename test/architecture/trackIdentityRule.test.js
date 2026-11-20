/**
 * Fitness functions of the one track identity rule (F74, UAT-221; arch.md, "Uma regra só para
 * dizer que é a mesma faixa").
 *
 * "Is this track of the album the track the source lists?" used to be decided in nine places,
 * each with a key of its own (brackets deleted, one title containing the other, 40% of words in
 * common). These tests read the source files and fail when a place that puts what a source says
 * on the tracks of an album stops asking the rule, or when a title key grows back anywhere.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { TIERS, DESCRIBING_NOTES, KNOWN_WRITINGS, TRACK_IDENTITY_RULE_VERSION, TrackReason } from '../../shared/trackIdentity.js'

const ROOT = process.cwd()
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')

const SKIPPED = new Set(['node_modules', 'vendor', '_shared_temp'])
/** Every .js / .mjs file under a folder of the repository, as paths from its root. */
function listJs(relativeDir) {
    return fs.readdirSync(path.join(ROOT, relativeDir), { withFileTypes: true }).flatMap(entry => {
        const relative = `${relativeDir}/${entry.name}`
        if (entry.isDirectory()) return SKIPPED.has(entry.name) ? [] : listJs(relative)
        return /\.m?js$/.test(entry.name) ? [relative] : []
    })
}

/** The module specifiers a file imports: `import ... from`, `export ... from`, `import()`, `require()`. */
const importsOf = (relative) => {
    const pattern = /(?:\b(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g
    return [...read(relative).matchAll(pattern)].map(match => match[1])
}

const RULE = 'shared/trackIdentity.js'
const APP_SIDE = 'public/js/models/sameTrack.js'
const SERVER_SIDE = 'server/lib/trackIdentity.js'

const APP = /(^|\/)sameTrack\.js$/
const SERVER = /(^|\/)trackIdentity$/

/**
 * Every place that puts what a source says of a track on the tracks of an album. `asks` is the
 * module it must import; a place that is handed the rule by its caller (`handed`) imports nothing
 * and must call what it was handed.
 */
const CALL_SITES = [
    // the server
    { name: 'the ratings of POST /api/enrich-album', file: 'server/lib/services/EnrichmentService.js', asks: SERVER },
    { name: 'the page of the edition (the scraper)', file: 'server/lib/scrapers/besteveralbums.js', asks: SERVER },
    { name: 'the consolidated ranking', file: 'server/lib/ranking.js', asks: SERVER },
    { name: 'the ranking fetch', file: 'server/lib/fetchRanking.js', asks: SERVER },
    { name: 'the album of POST /api/generate', file: 'server/lib/services/GenerationService.js', asks: SERVER },
    { name: 'the page completed by the AI', file: 'server/lib/rankingSources/completeRanking.js', handed: 'matchTracks' },
    { name: 'the choice of the ranking', file: 'server/lib/rankingSources/rankingPlan.js', handed: 'matchTracks' },
    { name: 'the ranks written on the tracks', file: 'server/lib/albumAnswer.js', handed: 'matchTracks' },
    // the app
    { name: 'the ratings written on the album', file: 'public/js/helpers/BEAEnrichmentHelper.js', asks: APP },
    { name: 'the popularity written on the album', file: 'public/js/helpers/SpotifyEnrichmentHelper.js', asks: APP },
    { name: 'the two orders of an album, merged', file: 'public/js/models/albumAverages.js', asks: APP },
    { name: 'the person\'s own ranking on the album', file: 'public/js/models/Album.js', asks: APP },
    { name: 'the "my ranking" order', file: 'public/js/ranking/UserRankingStrategy.js', asks: APP },
    { name: 'the balanced order', file: 'public/js/ranking/BalancedRankingStrategy.js', asks: APP },
    { name: 'the tracks of the blend', file: 'public/js/algorithms/mixins/TrackEnrichmentMixin.js', asks: APP },
    { name: 'the album cache (the version of the rule)', file: 'public/js/services/albums/adapters/AlbumCacheAdapter.js', asks: APP }
]

/** The names the keys of before F74 had, in the app and in the server. None may come back. */
const OWN_KEYS = /\b(?:normalizeKey|normalizeRankingKey|loadNormalizeKey|localNormalizeKey|_normalizeKey|normalizeTrackTitle|looseTitle|toCore|toFuzzyCore|normalizeFuzzy|tokenOverlapRatio|SAME_TRACK_OVERLAP)\b/g

/** The title of a track made into a key by hand: `track.title.toLowerCase()`, `entry.trackTitle?.trim()`... */
const TITLE_KEYED_BY_HAND = /\b\w+\??\.(?:trackTitle|title)\)?\??\.(?:toLowerCase|normalize)\(/g

describe('one rule says "this is the same track"', () => {
    it('the rule is pure: it imports nothing', () => {
        expect(importsOf(RULE)).toEqual([])
    })

    it('the app and the server reach the same file', () => {
        expect(importsOf(APP_SIDE)).toEqual(['@shared/trackIdentity.js', '@shared/trackIdentity.js'])
        expect(importsOf(SERVER_SIDE)).toEqual(['../../shared/trackIdentity.js'])
    })

    it('nothing but the two sides, the debug route and the measure imports the rule directly', () => {
        const direct = [...listJs('public/js'), ...listJs('server'), ...listJs('shared'), ...listJs('scripts')]
            .filter(file => importsOf(file).some(specifier => /shared\/trackIdentity\.js$/.test(specifier)))

        expect(direct.sort()).toEqual([APP_SIDE, 'scripts/measure-track-identity.mjs', SERVER_SIDE, 'server/routes/debug.js'].sort())
    })

    CALL_SITES.forEach(({ name, file, asks, handed }) => {
        it(`${name} asks the rule (${file})`, () => {
            if (asks) expect(importsOf(file).some(specifier => asks.test(specifier))).toBe(true)
            else expect(read(file)).toMatch(new RegExp(`\\b${handed}\\b`))
        })
    })

    CALL_SITES.forEach(({ name, file }) => {
        it(`${name} compares no title by itself (${file})`, () => {
            const source = read(file)

            expect({
                ownKeys: source.match(OWN_KEYS) || [],
                keyedByHand: (source.match(TITLE_KEYED_BY_HAND) || []).filter(found => !(ALLOWED_BY_HAND[file] || []).includes(found))
            }).toEqual({ ownKeys: [], keyedByHand: [] })
        })
    })
})

/**
 * A title read by hand that is not a comparison of two tracks, per file: each with why.
 */
const ALLOWED_BY_HAND = {}

/**
 * The places of the app and of the server where a text is lower-cased as a track title for a
 * reason that is not "which track of the album is this", each with its reason. Empty today; the
 * list may only shrink.
 */
const NOT_TRACK_IDENTITY = {}

describe('no second rule grows back', () => {
    const everywhere = [...listJs('public/js'), ...listJs('server'), ...listJs('shared')]

    it('the sweep reads the app, the server and the shared code', () => {
        expect(everywhere.length).toBeGreaterThan(200)
        expect(everywhere).toEqual(expect.arrayContaining(['shared/trackIdentity.js', 'server/lib/ranking.js', 'public/js/models/Album.js']))
    })

    it('the keys of before F74 exist nowhere in the app, the server or the shared code', () => {
        const found = everywhere.flatMap(file => (read(file).match(OWN_KEYS) || []).map(name => `${file}: ${name}`))
            // the Spotify repository keys an ALBUM by artist and title under this name; it is not a track key
            .filter(line => !/^public\/js\/(repositories\/SpotifyEnrichmentRepository|services\/spotify\/StoredSpotifyPopularity)\.js: normalizeKey$/.test(line))

        expect(found).toEqual([])
    })

    it('the modules that held those keys are gone', () => {
        expect(fs.existsSync(path.join(ROOT, 'shared/normalize.js'))).toBe(false)
        expect(fs.existsSync(path.join(ROOT, 'public/js/utils/NormalizationUtils.js'))).toBe(false)
        expect(Object.keys(require_('server/lib/normalize.js'))).not.toEqual(expect.arrayContaining(['toCore']))
    })

    it('no file keys the title of a TRACK by hand (`track.title.toLowerCase()`): it asks the rule', () => {
        const trackTitleKeyed = /\b(?:track|t|r|entry|mention|row)\??\.(?:trackTitle|title)\)?\??\.(?:toLowerCase|normalize)\(/g
        const found = everywhere
            .filter(file => !NOT_TRACK_IDENTITY[file])
            .flatMap(file => (read(file).match(trackTitleKeyed) || []).map(text => `${file}: ${text}`))

        expect(found).toEqual([])
    })

    it('every exception still exists (the list may only shrink)', () => {
        Object.keys(NOT_TRACK_IDENTITY).forEach(file => expect(fs.existsSync(path.join(ROOT, file)), file).toBe(true))
    })
})

/** The exports of a CommonJS file of the server, read as text (the test suite has no server packages). */
function require_(relative) {
    const exported = read(relative).match(/module\.exports\s*=\s*\{([^}]*)\}/)
    return Object.fromEntries((exported ? exported[1] : '').split(',').map(name => name.trim()).filter(Boolean).map(name => [name, true]))
}

/**
 * The rule is a list of named tiers and notes. When it changes, the version changes with it: the
 * browsers believe the ratings they keep only under the version that decided them.
 */
describe('the rules of the track rule and its version move together', () => {
    it('version 1 is exactly these tiers, these describing notes and these known writings', () => {
        expect({
            version: TRACK_IDENTITY_RULE_VERSION,
            tiers: TIERS.map(tier => tier.reason),
            describingNotes: DESCRIBING_NOTES.map(note => note.name),
            knownWritings: KNOWN_WRITINGS.map(one => one.writings.join(' = '))
        }).toEqual({
            version: 1,
            tiers: ['same-text', 'same-song-described', 'same-place-one-word-apart', 'medley-listed-shorter', 'title-without-its-note'],
            describingNotes: ['mastering-or-placement', 'credit', 'parts-of-the-song'],
            knownWritings: ['Foxey Lady = Foxy Lady']
        })
    })

    it('every tier has a reason of its own', () => {
        const reasons = TIERS.map(tier => tier.reason)

        expect(new Set(reasons).size).toBe(reasons.length)
        reasons.forEach(reason => expect(Object.values(TrackReason)).toContain(reason))
    })

    it('the weakest tier is the one that drops a note: an extra never takes the entry before the plain track', () => {
        expect(TIERS.at(-1).reason).toBe(TrackReason.TITLE_WITHOUT_ITS_NOTE)
        expect(TIERS[0].reason).toBe(TrackReason.SAME_TEXT)
    })

    it('the server stamps its ratings with the version, and the cache of the app compares it', () => {
        expect(read('server/lib/services/EnrichmentService.js')).toMatch(/trackRule: TRACK_IDENTITY_RULE_VERSION/)
        expect(read('public/js/services/albums/adapters/AlbumCacheAdapter.js')).toMatch(/saved\.trackRule === TRACK_IDENTITY_RULE_VERSION/)
    })
})
