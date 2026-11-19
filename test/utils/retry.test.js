import { describe, it, expect, vi } from 'vitest'
import { retryWithBackoff, backoffWaitMs } from '../../public/js/utils/retry.js'

describe('retryWithBackoff (DP-23: growing waits, jitter, a ceiling)', () => {
    const noPause = () => vi.fn(async () => {})

    it('returns the first answer without waiting', async () => {
        const pause = noPause()

        await expect(retryWithBackoff(async () => 'ok', { pause })).resolves.toBe('ok')
        expect(pause).not.toHaveBeenCalled()
    })

    it('tries again after a failure and returns the answer when it comes', async () => {
        const pause = noPause()
        let calls = 0
        const attempt = vi.fn(async () => { if (calls++ < 2) throw new Error('down'); return 'ok' })

        await expect(retryWithBackoff(attempt, { retries: 2, pause })).resolves.toBe('ok')
        expect(attempt).toHaveBeenCalledTimes(3)
        expect(pause).toHaveBeenCalledTimes(2)
    })

    it('gives up after the retries and throws the last real error', async () => {
        const errors = [new Error('first'), new Error('second'), new Error('third')]
        let calls = 0
        const attempt = vi.fn(async () => { throw errors[calls++] })

        await expect(retryWithBackoff(attempt, { retries: 2, pause: noPause() })).rejects.toBe(errors[2])
        expect(attempt).toHaveBeenCalledTimes(3)
    })

    it('does not try again when the failure is not of the kind that passes', async () => {
        const pause = noPause()
        const error = new Error('permanent')
        const attempt = vi.fn(async () => { throw error })

        await expect(retryWithBackoff(attempt, { retries: 5, shouldRetry: () => false, pause })).rejects.toBe(error)
        expect(attempt).toHaveBeenCalledTimes(1)
        expect(pause).not.toHaveBeenCalled()
    })

    it('waits longer each time, up to the ceiling, and the draw only shortens the wait by up to half', () => {
        const top = () => 1
        const bottom = () => 0

        expect([0, 1, 2, 3].map(n => backoffWaitMs(n, { baseMs: 1000, capMs: 5000, random: top }))).toEqual([1000, 2000, 4000, 5000])
        expect([0, 1, 2, 3].map(n => backoffWaitMs(n, { baseMs: 1000, capMs: 5000, random: bottom }))).toEqual([500, 1000, 2000, 2500])
    })

    it('tells the caller about each new attempt', async () => {
        const onRetry = vi.fn()
        let calls = 0

        await retryWithBackoff(async () => { if (calls++ === 0) throw new Error('down'); return 'ok' },
            { retries: 2, baseMs: 100, random: () => 1, pause: noPause(), onRetry })

        expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1, waitMs: 100, error: expect.any(Error) }))
    })
})
