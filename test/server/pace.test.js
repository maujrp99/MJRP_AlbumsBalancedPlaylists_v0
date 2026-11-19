/**
 * F52, slice 3 - the three small pieces the server uses to be polite to the scraped source and to
 * answer in time: the polite queue (who owns the pace), the time budget of one album request, and
 * the sharing of identical requests in flight. No real time: clock, sleep and timers are injected.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createPoliteQueue, PaceError } = require('../../server/lib/politeQueue.js')
const { createBudget } = require('../../server/lib/timeBudget.js')
const { createInFlight } = require('../../server/lib/inFlight.js')
const { UpstreamError } = require('../../server/lib/outcome.js')

/** A clock that only moves when someone sleeps on it (or the test says so). */
const fakeTime = (start = 1000) => {
    let t = start
    const sleeps = []
    return { now: () => t, sleep: async (ms) => { sleeps.push(ms); t += ms }, advance: (ms) => { t += ms }, sleeps }
}
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const tick = () => new Promise(resolve => setImmediate(resolve))
const busy = (retryAfterMs = null) => Object.assign(new Error('busy'), { busy: true, retryAfterMs })
const busyOf = (err) => (err && err.busy ? { retryAfterMs: err.retryAfterMs } : null)

const queueWith = (time, options = {}) => createPoliteQueue({
    concurrency: 2,
    minIntervalMs: 250,
    backoff: { baseMs: 1000, factor: 2, maxMs: 30000 },
    maxAttempts: 3,
    busyOf,
    now: time.now,
    sleep: time.sleep,
    ...options
})

describe('politeQueue: one module owns the pace with the source', () => {
    it('runs a task and gives its value', async () => {
        const time = fakeTime()
        expect(await queueWith(time).run(async () => 'page')).toBe('page')
        expect(time.sleeps).toEqual([])
    })

    it('starts are at least the minimum interval apart', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { concurrency: 1 })
        const starts = []
        for (let i = 0; i < 3; i++) await queue.run(async () => { starts.push(time.now()) })
        expect(starts).toEqual([1000, 1250, 1500])
    })

    it('never runs more than the limit at once, and serves who waits in order', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0 })
        const gates = [deferred(), deferred(), deferred()]
        const started = []
        const runs = gates.map((gate, i) => queue.run(() => { started.push(i); return gate.promise }))
        await tick()
        expect(started).toEqual([0, 1])
        gates[0].resolve('a')
        await tick()
        expect(started).toEqual([0, 1, 2])
        gates[1].resolve('b')
        gates[2].resolve('c')
        expect(await Promise.all(runs)).toEqual(['a', 'b', 'c'])
    })

    it('a failure that is not "busy" is thrown as it came and frees the slot', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { concurrency: 1 })
        await expect(queue.run(async () => { throw new Error('down') })).rejects.toThrow('down')
        expect(await queue.run(async () => 'next')).toBe('next')
    })

    it('"busy" is asked again after a wait that grows: 1 s, then 2 s', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0 })
        const task = vi.fn()
            .mockRejectedValueOnce(busy())
            .mockRejectedValueOnce(busy())
            .mockResolvedValueOnce('page')
        expect(await queue.run(task)).toBe('page')
        expect(time.sleeps).toEqual([1000, 2000])
    })

    it('the wait the source asked for (Retry-After) is the one respected, up to the cap', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0, maxRetryAfterMs: 60000 })
        const task = vi.fn().mockRejectedValueOnce(busy(7000)).mockResolvedValueOnce('page')
        expect(await queue.run(task)).toBe('page')
        expect(time.sleeps).toEqual([7000])

        const capped = vi.fn().mockRejectedValueOnce(busy(999999)).mockResolvedValueOnce('page')
        await queue.run(capped)
        expect(time.sleeps.at(-1)).toBe(60000)
    })

    it('a success ends the growth: the next "busy" waits the base again', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0 })
        await queue.run(vi.fn().mockRejectedValueOnce(busy()).mockRejectedValueOnce(busy()).mockResolvedValueOnce(1))
        time.sleeps.length = 0
        await queue.run(vi.fn().mockRejectedValueOnce(busy()).mockResolvedValueOnce(1))
        expect(time.sleeps).toEqual([1000])
    })

    it('after the last attempt it gives up as PaceError "busy", saying how long the source is to be left alone', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0 })
        const task = vi.fn().mockRejectedValue(busy())
        const error = await queue.run(task).catch(e => e)
        expect(error).toBeInstanceOf(PaceError)
        expect(error).toMatchObject({ reason: 'busy', retryAfterMs: 4000 })
        expect(task).toHaveBeenCalledTimes(3)
    })

    it('while the source asked to wait nobody starts: who cannot wait that long fails at once, who can waits and goes', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0, maxAttempts: 1 })
        await queue.run(async () => { throw busy(5000) }).catch(() => {}) // the source asked for 5 s

        const task = vi.fn()
        const error = await queue.run(task, { deadlineAt: time.now() + 2000 }).catch(e => e)
        expect(error).toMatchObject({ name: 'PaceError', reason: 'busy', retryAfterMs: 5000 })
        expect(task).not.toHaveBeenCalled()
        expect(time.sleeps).toEqual([])

        expect(await queue.run(async () => 'page', { deadlineAt: time.now() + 6000 })).toBe('page')
        expect(time.sleeps).toEqual([5000])
    })

    it('a wait that would pass the deadline is not slept: it fails at once, without touching the source', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { concurrency: 1, minIntervalMs: 250 })
        await queue.run(async () => 'first')
        const task = vi.fn()
        const error = await queue.run(task, { deadlineAt: time.now() + 100 }).catch(e => e)
        expect(error).toMatchObject({ name: 'PaceError', reason: 'deadline' })
        expect(task).not.toHaveBeenCalled()
        expect(time.sleeps).toEqual([])
    })

    it('who got its turn after its deadline does not start', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { concurrency: 1, minIntervalMs: 0 })
        const gate = deferred()
        const first = queue.run(() => gate.promise)
        const late = vi.fn()
        const second = queue.run(late, { deadlineAt: time.now() + 500 }).catch(e => e)
        time.advance(600)
        gate.resolve('done')
        await first
        expect(await second).toMatchObject({ name: 'PaceError', reason: 'deadline' })
        expect(late).not.toHaveBeenCalled()
    })

    it('a "busy" in the middle of a request does not sleep past its deadline', async () => {
        const time = fakeTime()
        const queue = queueWith(time, { minIntervalMs: 0 })
        const task = vi.fn().mockRejectedValue(busy(9000))
        const error = await queue.run(task, { deadlineAt: time.now() + 3000 }).catch(e => e)
        expect(error).toMatchObject({ name: 'PaceError', reason: 'busy', retryAfterMs: 9000 })
        expect(task).toHaveBeenCalledTimes(1)
        expect(time.sleeps).toEqual([])
    })
})

describe('timeBudget: the whole time one album request may take', () => {
    const timers = () => {
        const set = []
        return {
            set,
            setTimer: (fn, ms) => { const timer = { fn, ms, cleared: false }; set.push(timer); return timer },
            clearTimer: (timer) => { timer.cleared = true }
        }
    }

    it('knows its deadline and what is left', () => {
        const time = fakeTime(5000)
        const budget = createBudget({ ms: 15000, now: time.now })
        expect(budget.deadlineAt).toBe(20000)
        time.advance(4000)
        expect(budget.remainingMs()).toBe(11000)
        time.advance(20000)
        expect(budget.remainingMs()).toBe(0)
    })

    it('work that ends in time gives its value (or its own error) and the timer is cleared', async () => {
        const t = timers()
        const budget = createBudget({ ms: 15000, now: () => 0, setTimer: t.setTimer, clearTimer: t.clearTimer })
        expect(await budget.race(Promise.resolve('page'), 'Source')).toBe('page')
        await expect(budget.race(Promise.reject(new Error('own')), 'Source')).rejects.toThrow('own')
        expect(t.set.map(timer => timer.ms)).toEqual([15000, 15000])
        expect(t.set.every(timer => timer.cleared)).toBe(true)
    })

    it('work that is still running at the deadline is answered as upstream_timeout', async () => {
        const t = timers()
        const budget = createBudget({ ms: 15000, now: () => 0, setTimer: t.setTimer, clearTimer: t.clearTimer })
        const racing = budget.race(new Promise(() => {}), 'BestEverAlbums')
        t.set[0].fn()
        const error = await racing.catch(e => e)
        expect(error).toBeInstanceOf(UpstreamError)
        expect(error.code).toBe('upstream_timeout')
    })
})

describe('inFlight: identical requests at the same time share one piece of work', () => {
    it('the second ask joins the first; the work runs once', async () => {
        const flights = createInFlight()
        const gate = deferred()
        const work = vi.fn(() => gate.promise)
        const first = flights.share('a|b', work)
        const second = flights.share('a|b', work)
        expect([first.joined, second.joined]).toEqual([false, true])
        gate.resolve('page')
        expect(await Promise.all([first.promise, second.promise])).toEqual(['page', 'page'])
        expect(work).toHaveBeenCalledTimes(1)
    })

    it('another key does not share', () => {
        const flights = createInFlight()
        const work = vi.fn(() => new Promise(() => {}))
        flights.share('a|b', work)
        expect(flights.share('a|c', work).joined).toBe(false)
        expect(flights.size()).toBe(2)
    })

    it('nothing is remembered once the work ends, a success or a failure: the next ask works again', async () => {
        const flights = createInFlight()
        const work = vi.fn()
            .mockResolvedValueOnce('page')
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValueOnce('again')
        expect(await flights.share('k', work).promise).toBe('page')
        expect(flights.size()).toBe(0)
        await expect(flights.share('k', work).promise).rejects.toThrow('down')
        expect(flights.size()).toBe(0)
        const third = flights.share('k', work)
        expect(third.joined).toBe(false)
        expect(await third.promise).toBe('again')
        expect(work).toHaveBeenCalledTimes(3)
    })

    it('a failure reaches everyone who was waiting', async () => {
        const flights = createInFlight()
        const gate = deferred()
        const asks = [flights.share('k', () => gate.promise), flights.share('k', () => gate.promise)]
        gate.reject(new Error('down'))
        for (const ask of asks) await expect(ask.promise).rejects.toThrow('down')
    })

    it('work that throws before it starts is a rejection, not an exception of share', async () => {
        const flights = createInFlight()
        await expect(flights.share('k', () => { throw new Error('early') }).promise).rejects.toThrow('early')
    })
})
