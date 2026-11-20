/**
 * F52, slice 5 - the reference links of the ranking the AI gave (`extractAndValidateRankingEntries`,
 * server/lib/normalize.js). A link is shown only when it answers; one that does not is dropped and
 * the entry stays. The block had two empty catches around its own log lines and a branch that
 * could never run; it is now one small function. No network: `verifyUrl` is a double.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const validateSource = require('../../server/lib/validateSource.js')
const { extractAndValidateRankingEntries } = require('../../server/lib/normalize.js')

const realVerifyUrl = validateSource.verifyUrl
const answerWith = (ranking) => ({ data: { candidates: [{ content: { parts: [{ text: JSON.stringify({ ranking }) }] } }] } })
const entry = (trackTitle, referenceUrl) => ({ provider: 'NME', trackTitle, position: 1, referenceUrl })

afterEach(() => { validateSource.verifyUrl = realVerifyUrl })

describe('the reference link of a ranking entry', () => {
    it('a link that answers is kept; one that does not is dropped, and the entry stays', async () => {
        validateSource.verifyUrl = vi.fn(async (url) => url.includes('good'))
        const entries = await extractAndValidateRankingEntries(answerWith([entry('One', 'https://good.example/one'), entry('Two', 'https://gone.example/two')]))

        expect(entries.map(e => [e.trackTitle, e.referenceUrl])).toEqual([['One', 'https://good.example/one'], ['Two', null]])
    })

    it('a link of BestEverAlbums is kept without being asked for', async () => {
        validateSource.verifyUrl = vi.fn(async () => false)
        const entries = await extractAndValidateRankingEntries(answerWith([entry('One', 'https://www.besteveralbums.com/thechart.php?a=1')]))

        expect(entries[0].referenceUrl).toBe('https://www.besteveralbums.com/thechart.php?a=1')
        expect(validateSource.verifyUrl).not.toHaveBeenCalled()
    })

    it('an entry with no link is not checked', async () => {
        validateSource.verifyUrl = vi.fn(async () => true)
        const entries = await extractAndValidateRankingEntries(answerWith([entry('One', '')]))

        expect(entries[0].referenceUrl).toBe('')
        expect(validateSource.verifyUrl).not.toHaveBeenCalled()
    })
})
