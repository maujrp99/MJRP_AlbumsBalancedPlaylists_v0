/**
 * Fitness functions of the complexity limit (F58, UAT-194: the limit the owner set for this project):
 * no function passes a cyclomatic complexity of 10, measured by ESLint's own `complexity` rule.
 *
 *   1. In the album load (its folder, its store, its queue and its models) the limit holds with
 *      no exception: a function above 10 fails the test.
 *   2. In the rest of the app (public/js, the code of others in vendor/ left out) the functions
 *      that are above 10 today are listed in complexityAllowlist.js with their number. That list
 *      can only shrink: a function that is not listed, one that got worse, and one that was
 *      brought down and is still listed (or listed with its old number) all fail the test.
 *   3. The same for the server (server/) and for the shared modules (shared/), each with its own
 *      list that can only shrink (F52, slice 5); and in the path of POST /api/generate that the
 *      slice rewrote (the ranking pipeline, the consolidation, the album answer, the prompts)
 *      the limit holds with no exception.
 *
 * To see the table: node test/architecture/support/measureComplexity.js public/js shared server
 */
import { describe, it, expect } from 'vitest'
import { functionsAbove, COMPLEXITY_LIMIT } from './support/measureComplexity.js'
import { KNOWN_ABOVE_THE_LIMIT, SERVER_KNOWN_ABOVE_THE_LIMIT, SHARED_KNOWN_ABOVE_THE_LIMIT, keyed } from './complexityAllowlist.js'

/** ESLint reads every file of the app: give it time. */
const TIMEOUT_MS = 120000

/** The album load: the folder of the service, and what it is made of outside that folder. */
const ALBUM_LOAD = [
    'public/js/services/albums',
    'public/js/stores/albumLoad.js',
    'public/js/utils/TaskQueue.js',
    'public/js/utils/LatestOnly.js',
    'public/js/models/albumLoadState.js',
    'public/js/models/albumLoadHold.js',
    'public/js/models/albumSourceAsk.js',
    'public/js/models/albumAsk.js',
    'public/js/models/albumQuery.js',
    'public/js/models/albumFacts.js',
    'public/js/models/askedAlbum.js',
    'public/js/models/cloneAlbum.js',
    'public/js/models/paging.js',
    'public/js/models/text.js'
]

/** The path of POST /api/generate and of POST /api/enrich-album that F52 wrote or rewrote. */
const SERVER_WITHIN_THE_LIMIT = [
    'server/lib/fetchRanking.js',
    'server/lib/rankingSources',
    'server/lib/ranking.js',
    'server/lib/albumAnswer.js',
    'server/lib/prompts.js',
    'server/lib/schema.js',
    'server/lib/timeBudget.js',
    'server/lib/inFlight.js',
    'server/lib/politeQueue.js',
    'server/lib/services',
    'server/routes/handlers/albums.js',
    // F75: the value source, its routes and its handlers were born under the limit
    'server/lib/valueSources',
    'server/routes/handlers/values.js',
    'server/routes/values.js'
]

const told = (row) => `${row.file}:${row.line} ${row.name} has ${row.complexity}`

describe(`no function passes a complexity of ${COMPLEXITY_LIMIT}`, () => {
    it('in the album load, with no exception', async () => {
        const above = await functionsAbove(ALBUM_LOAD)

        expect(above.map(told)).toEqual([])
    }, TIMEOUT_MS)

    describe('in the rest of the app, but for a list that can only shrink', () => {
        let measured

        const measure = async () => {
            if (!measured) {
                const rows = await functionsAbove(['public/js'])
                measured = keyed(rows.filter(row => !row.file.startsWith('public/js/vendor/')))
            }
            return measured
        }

        it('no function that is not on the list is above the limit', async () => {
            const now = await measure()
            const unlisted = Object.keys(now).filter(key => !(key in KNOWN_ABOVE_THE_LIMIT))

            expect(unlisted.map(key => `${key} has ${now[key]}: bring it to ${COMPLEXITY_LIMIT} or below (do not add it to the list)`)).toEqual([])
        }, TIMEOUT_MS)

        it('no listed function got worse', async () => {
            const now = await measure()
            const worse = Object.keys(now).filter(key => now[key] > KNOWN_ABOVE_THE_LIMIT[key])

            expect(worse.map(key => `${key} went from ${KNOWN_ABOVE_THE_LIMIT[key]} to ${now[key]}`)).toEqual([])
        }, TIMEOUT_MS)

        it('a function that was brought down leaves the list, or has its number lowered', async () => {
            const now = await measure()
            const stale = Object.keys(KNOWN_ABOVE_THE_LIMIT).filter(key => now[key] !== KNOWN_ABOVE_THE_LIMIT[key] && !(now[key] > KNOWN_ABOVE_THE_LIMIT[key]))

            expect(stale.map(key => (key in now
                ? `${key} is ${now[key]} now: lower its number in complexityAllowlist.js (listed as ${KNOWN_ABOVE_THE_LIMIT[key]})`
                : `${key} is within the limit now (or gone): remove it from complexityAllowlist.js`))).toEqual([])
        }, TIMEOUT_MS)
    })

    it('in the server, on the path of the album search that F52 rewrote, with no exception', async () => {
        const above = await functionsAbove(SERVER_WITHIN_THE_LIMIT)

        expect(above.map(told)).toEqual([])
    }, TIMEOUT_MS)

    /** The three rules of a list that can only shrink, for one part of the repository. */
    const shrinkingList = (title, targets, known) => describe(title, () => {
        let measured

        const measure = async () => {
            if (!measured) measured = keyed(await functionsAbove(targets))
            return measured
        }

        it('no function that is not on the list is above the limit', async () => {
            const now = await measure()
            const unlisted = Object.keys(now).filter(key => !(key in known))

            expect(unlisted.map(key => `${key} has ${now[key]}: bring it to ${COMPLEXITY_LIMIT} or below (do not add it to the list)`)).toEqual([])
        }, TIMEOUT_MS)

        it('no listed function got worse', async () => {
            const now = await measure()
            const worse = Object.keys(now).filter(key => now[key] > known[key])

            expect(worse.map(key => `${key} went from ${known[key]} to ${now[key]}`)).toEqual([])
        }, TIMEOUT_MS)

        it('a function that was brought down (or removed) leaves the list, or has its number lowered', async () => {
            const now = await measure()
            const stale = Object.keys(known).filter(key => now[key] !== known[key] && !(now[key] > known[key]))

            expect(stale.map(key => (key in now
                ? `${key} is ${now[key]} now: lower its number in complexityAllowlist.js (listed as ${known[key]})`
                : `${key} is within the limit now (or gone): remove it from complexityAllowlist.js`))).toEqual([])
        }, TIMEOUT_MS)
    })

    shrinkingList('in the server, but for a list that can only shrink', ['server'], SERVER_KNOWN_ABOVE_THE_LIMIT)
    shrinkingList('in the shared modules, but for a list that can only shrink', ['shared'], SHARED_KNOWN_ABOVE_THE_LIMIT)

    it('the measuring itself sees a function above the limit (the test would pass on nothing otherwise)', async () => {
        const rows = await functionsAbove(['test/architecture/fixtures/aboveTheLimit.js'])

        expect(rows.map(row => [row.name, row.complexity])).toEqual([['tooManyPaths', 11]])
    }, TIMEOUT_MS)

    it('and it reads TypeScript and TSX: a .tsx function above the limit is seen (F83)', async () => {
        const rows = await functionsAbove(['test/architecture/fixtures/typescript/aboveTheLimit.tsx'])

        expect(rows.map(row => [row.name, row.complexity])).toEqual([['tooManyPaths', 11]])
    }, TIMEOUT_MS)
})
