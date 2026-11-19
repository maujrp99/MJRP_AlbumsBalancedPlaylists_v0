/**
 * F67 - a promise with a deadline: what does not answer in time is a failure with a name.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withDeadline, DeadlineError, isDeadlineError } from '../../public/js/utils/deadline.js'

describe('withDeadline (F67)', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('gives the answer when it comes in time', async () => {
        await expect(withDeadline(Promise.resolve('ok'), 1000, 'the catalog')).resolves.toBe('ok')
    })

    it('passes the failure on when the promise rejects in time', async () => {
        await expect(withDeadline(Promise.reject(new Error('boom')), 1000, 'the catalog')).rejects.toThrow('boom')
    })

    it('rejects with a DeadlineError when nothing answers in time', async () => {
        const never = new Promise(() => {})
        const seen = withDeadline(never, 1000, 'the catalog').catch(error => error)
        await vi.advanceTimersByTimeAsync(1000)
        const error = await seen
        expect(error).toBeInstanceOf(DeadlineError)
        expect(isDeadlineError(error)).toBe(true)
        expect(error.message).toContain('the catalog')
        expect(error.ms).toBe(1000)
    })

    it('leaves no timer behind once the promise answered', async () => {
        await withDeadline(Promise.resolve(1), 1000, 'x')
        expect(vi.getTimerCount()).toBe(0)
    })

    it('an ordinary error is not a deadline error', () => {
        expect(isDeadlineError(new Error('x'))).toBe(false)
        expect(isDeadlineError(null)).toBe(false)
    })
})
