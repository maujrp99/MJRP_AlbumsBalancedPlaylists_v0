/**
 * F58 (UAT-194) - the hold of the album load as pure state: what the hold becomes when the app's
 * own server says "sign in", "wait" or "the source is busy", and what follows from each change.
 */
import { describe, it, expect } from 'vitest'
import { holdAfter, isNewsToThePerson, stopsServerQueue, resumesIn } from '../../public/js/models/albumLoadHold.js'
import { HoldReason } from '../../public/js/models/albumLoadState.js'

const NOW = 1000
const signIn = { reason: HoldReason.UNAUTHORIZED }
const wait = (retryAfterMs) => ({ reason: HoldReason.RATE_LIMITED, retryAfterMs })

describe('holdAfter: the hold after the server said something', () => {
    it('"wait" with no hold in force starts one that ends when the server said', () => {
        expect(holdAfter(null, wait(40), NOW)).toEqual({ reason: 'rate_limited', until: 1040 })
    })

    it('"wait" with no time given ends now', () => {
        expect(holdAfter(null, { reason: HoldReason.SOURCE_BUSY }, NOW)).toEqual({ reason: 'source_busy', until: 1000 })
    })

    it('"sign in" starts a hold with no end of its own', () => {
        expect(holdAfter(null, signIn, NOW)).toEqual({ reason: 'unauthorized', until: null })
    })

    it('a later "wait" stretches the hold to the latest time asked, and never shortens it', () => {
        const hold = holdAfter(null, wait(40), NOW)

        expect(holdAfter(hold, wait(100), NOW + 10)).toEqual({ reason: 'rate_limited', until: 1110 })
        expect(holdAfter(hold, wait(5), NOW + 10)).toBe(hold)
    })

    it('the hold keeps the reason it started with when another "wait" arrives', () => {
        const hold = holdAfter(null, wait(40), NOW)

        expect(holdAfter(hold, { reason: HoldReason.SOURCE_BUSY, retryAfterMs: 500 }, NOW).reason).toBe('rate_limited')
    })

    it('"sign in" wins over "wait": the hold loses its end', () => {
        const hold = holdAfter(null, wait(40), NOW)

        expect(holdAfter(hold, signIn, NOW + 10)).toEqual({ reason: 'unauthorized', until: null })
    })

    it('"wait" does not touch a "sign in" hold, and "sign in" heard again changes nothing', () => {
        const hold = holdAfter(null, signIn, NOW)

        expect(holdAfter(hold, wait(40), NOW)).toBe(hold)
        expect(holdAfter(hold, signIn, NOW + 50)).toBe(hold)
    })

    it('never mutates the hold it was given', () => {
        const hold = Object.freeze(holdAfter(null, wait(40), NOW))

        expect(() => holdAfter(hold, wait(100), NOW)).not.toThrow()
        expect(() => holdAfter(hold, signIn, NOW)).not.toThrow()
        expect(hold).toEqual({ reason: 'rate_limited', until: 1040 })
    })
})

describe('isNewsToThePerson: a notice when a hold starts or becomes "sign in"', () => {
    const waiting = { reason: 'rate_limited', until: 1040 }
    const refused = { reason: 'unauthorized', until: null }

    it('a hold that starts is news', () => {
        expect(isNewsToThePerson(null, waiting)).toBe(true)
        expect(isNewsToThePerson(null, refused)).toBe(true)
    })

    it('a "wait" that becomes "sign in" is news', () => {
        expect(isNewsToThePerson(waiting, refused)).toBe(true)
    })

    it('a hold that is stretched, or heard again, is not', () => {
        expect(isNewsToThePerson(waiting, { ...waiting, until: 2000 })).toBe(false)
        expect(isNewsToThePerson(refused, refused)).toBe(false)
    })
})

describe('stopsServerQueue: the queue that only talks to the app\'s server', () => {
    it('stops when that server said "wait" to it', () => {
        expect(stopsServerQueue({ reason: 'rate_limited', until: 1040 }, true)).toBe(true)
    })

    it('goes on when "wait" was said to another queue (which also reaches other sources)', () => {
        expect(stopsServerQueue({ reason: 'rate_limited', until: 1040 }, false)).toBe(false)
    })

    it('stops when "sign in" was said to anyone', () => {
        expect(stopsServerQueue({ reason: 'unauthorized', until: null }, false)).toBe(true)
    })
})

describe('resumesIn: when the hold ends by itself', () => {
    it('a "wait" ends at its time; a time already past ends now', () => {
        expect(resumesIn({ reason: 'rate_limited', until: 1040 }, NOW)).toBe(40)
        expect(resumesIn({ reason: 'rate_limited', until: 900 }, NOW)).toBe(0)
    })

    it('"sign in" and no hold never end by themselves', () => {
        expect(resumesIn({ reason: 'unauthorized', until: null }, NOW)).toBeNull()
        expect(resumesIn(null, NOW)).toBeNull()
    })
})
