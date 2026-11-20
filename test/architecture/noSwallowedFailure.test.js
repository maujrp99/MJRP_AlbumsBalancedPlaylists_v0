/**
 * Fitness functions of "the server tells the truth" (F52, slice 5; UAT-23): a failure that is
 * caught is said, never thrown away.
 *
 *   1. No EMPTY catch block in server/, but for the ones listed with a reason in
 *      swallowedFailureAllowlist.js (a list that can only shrink).
 *   2. On the path of POST /api/generate and POST /api/enrich-album (the two services, the ranking
 *      pipeline, the consolidation, the album answer, the prompts, the handlers) no catch block
 *      only writes to the log: after such a block the code goes on as if nothing had failed, and
 *      the answer says "there is none" for what could not be known. No exception.
 *
 * To see every catch of the server: the table in the F52 plan, "Fatia 5".
 */
import { describe, it, expect } from 'vitest'
import { catchBlocksIn, jsFilesUnder } from './support/catchBlocks.js'
import { EMPTY_CATCH_ALLOWED } from './swallowedFailureAllowlist.js'

const SERVER = ['server']
const NOT_OURS = ['server/node_modules']

/** Where "only a line in the log" is never enough. */
const ANSWER_PATH = [
    'server/lib/services',
    'server/lib/fetchRanking.js',
    'server/lib/rankingSources',
    'server/lib/ranking.js',
    'server/lib/albumAnswer.js',
    'server/lib/prompts.js',
    'server/lib/schema.js',
    'server/lib/outcome.js',
    'server/lib/aiProviderOutcome.js',
    'server/lib/timeBudget.js',
    'server/lib/inFlight.js',
    'server/lib/politeQueue.js',
    'server/lib/scrapers',
    'server/routes/handlers',
    'server/lib/valueSources',
    'server/routes/values.js',
    'server/routes/albums.js',
    'server/routes/ai.js'
]

const told = (row) => `${row.file}:${row.line}`
const rowsOf = (targets) => jsFilesUnder(targets, NOT_OURS).flatMap(catchBlocksIn)

describe('a failure that is caught is said', () => {
    describe('no empty catch block in the server, but for a list with reasons that can only shrink', () => {
        const emptyByFile = () => {
            const byFile = {}
            rowsOf(SERVER).filter(row => row.empty).forEach(row => { (byFile[row.file] = byFile[row.file] || []).push(row) })
            return byFile
        }

        it('no empty catch that is not on the list', () => {
            const found = emptyByFile()
            const unlisted = Object.keys(found).filter(file => found[file].length > (EMPTY_CATCH_ALLOWED[file] || []).length)

            expect(unlisted.map(file => `${found[file].map(told).join(', ')}: ${found[file].length} empty catch block(s), ${(EMPTY_CATCH_ALLOWED[file] || []).length} allowed. Say what failed (a typed result or a thrown error)`)).toEqual([])
        })

        it('an empty catch that was removed leaves the list', () => {
            const found = emptyByFile()
            const stale = Object.keys(EMPTY_CATCH_ALLOWED).filter(file => (found[file] || []).length < EMPTY_CATCH_ALLOWED[file].length)

            expect(stale.map(file => `${file} has ${(found[file] || []).length} empty catch block(s) now: remove the reason(s) left over in swallowedFailureAllowlist.js`)).toEqual([])
        })

        it('every allowed one carries a reason', () => {
            const reasons = Object.values(EMPTY_CATCH_ALLOWED).flat()

            expect(reasons.filter(reason => typeof reason !== 'string' || reason.trim().length < 20)).toEqual([])
        })
    })

    it('on the path of the album search and of the ratings, no catch only writes to the log (or is empty), with no exception', () => {
        const silent = rowsOf(ANSWER_PATH).filter(row => row.empty || row.onlyLogs)

        expect(silent.map(told)).toEqual([])
    })

    it('the reading itself sees an empty catch and a catch that only logs (the test would pass on nothing otherwise)', () => {
        const rows = catchBlocksIn('test/architecture/fixtures/swallowedFailure.js')

        expect(rows.map(row => [row.kind, row.empty, row.onlyLogs])).toEqual([
            ['catch', true, false], // emptyCatch
            ['catch', false, true], // onlyLogs
            ['promise', true, false], // emptyPromiseCatch
            ['promise', false, true], // onlyLogsPromiseCatch
            ['catch', false, false], // turnsItIntoAResult
            ['promise', false, false] // throwsItOn
        ])
    })
})
