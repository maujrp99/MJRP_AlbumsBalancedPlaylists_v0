/**
 * F58 (UAT-194) - the hold of the load in force: what LoadHold does when a port says "sign in"
 * or "wait". The real queue; doubles for the two doors out (publish, onNotice).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoadHold } from '../../../public/js/services/albums/LoadHold.js'
import { TaskQueue, TaskCancelledError } from '../../../public/js/utils/TaskQueue.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const held = (hold) => Object.assign(new Error('the server asked to hold'), { hold })

describe('LoadHold', () => {
    let serverQueue, otherQueue, publish, onNotice, hold
    const always = () => true

    beforeEach(() => {
        serverQueue = new TaskQueue({ concurrency: 2 })
        otherQueue = new TaskQueue({ concurrency: 2 })
        publish = vi.fn()
        onNotice = vi.fn()
        hold = new LoadHold({ serverQueue, publish, onNotice })
    })

    it('has no hold to start with', () => {
        expect(hold.current).toBeNull()
    })

    it('"wait" on the server queue: the hold is published, the queue stops, the person is told once, and it ends by itself', async () => {
        hold.hear({ reason: 'rate_limited', retryAfterMs: 30 }, serverQueue)

        expect(hold.current).toMatchObject({ reason: 'rate_limited' })
        expect(publish).toHaveBeenLastCalledWith(hold.current)
        expect(serverQueue.paused).toBe(true)
        expect(onNotice).toHaveBeenCalledTimes(1)
        expect(onNotice.mock.calls[0][0]).toEqual({ reason: 'rate_limited', until: hold.current.until })

        await wait(50)

        expect(hold.current).toBeNull()
        expect(publish).toHaveBeenLastCalledWith(null)
        expect(serverQueue.paused).toBe(false)
        expect(onNotice).toHaveBeenCalledTimes(1)
    })

    it('"wait" on another queue holds without stopping the server queue', () => {
        hold.hear({ reason: 'rate_limited', retryAfterMs: 30 }, otherQueue)

        expect(hold.current).not.toBeNull()
        expect(serverQueue.paused).toBe(false)
        hold.end()
    })

    it('a longer "wait" stretches the hold with no new notice; a shorter one changes nothing', async () => {
        hold.hear({ reason: 'rate_limited', retryAfterMs: 20 }, serverQueue)
        const first = hold.current
        hold.hear({ reason: 'rate_limited', retryAfterMs: 5 }, serverQueue)
        expect(hold.current).toBe(first)
        expect(publish).toHaveBeenCalledTimes(1)

        hold.hear({ reason: 'rate_limited', retryAfterMs: 70 }, serverQueue)
        expect(hold.current.until).toBeGreaterThan(first.until)
        expect(publish).toHaveBeenCalledTimes(2)
        expect(onNotice).toHaveBeenCalledTimes(1)

        await wait(40)
        expect(hold.current).not.toBeNull() // the first time passed: the stretched one is in force

        await wait(50)
        expect(hold.current).toBeNull()
    })

    it('"sign in" has no end of its own, stops the server queue whoever heard it, and wins over a "wait"', async () => {
        hold.hear({ reason: 'rate_limited', retryAfterMs: 15 }, otherQueue)
        hold.hear({ reason: 'unauthorized' }, otherQueue)

        expect(hold.current).toEqual({ reason: 'unauthorized', until: null })
        expect(serverQueue.paused).toBe(true)
        expect(onNotice).toHaveBeenCalledTimes(2) // the hold started; then it became "sign in"

        await wait(30)
        expect(hold.current).toEqual({ reason: 'unauthorized', until: null }) // the timer of the "wait" is gone

        hold.end()
        expect(hold.current).toBeNull()
        expect(serverQueue.paused).toBe(false)
    })

    it('"sign in" is told once per load: heard again after it ended, it holds with no new notice until a new load', () => {
        hold.hear({ reason: 'unauthorized' }, serverQueue)
        hold.end()
        hold.hear({ reason: 'unauthorized' }, serverQueue)
        expect(onNotice).toHaveBeenCalledTimes(1)
        expect(hold.current).not.toBeNull()

        hold.startLoad()
        expect(hold.current).toBeNull()
        hold.hear({ reason: 'unauthorized' }, serverQueue)
        expect(onNotice).toHaveBeenCalledTimes(2)
        hold.end()
    })

    it('endIf ends only a hold of that reason', () => {
        hold.hear({ reason: 'rate_limited', retryAfterMs: 1000 }, serverQueue)
        hold.endIf('unauthorized')
        expect(hold.current).not.toBeNull()

        hold.endIf('rate_limited')
        expect(hold.current).toBeNull()
    })

    it('end with no hold does nothing', () => {
        hold.end()

        expect(publish).not.toHaveBeenCalled()
    })

    describe('add: a task that hears a hold waits and is asked again', () => {
        it('gives the answer of a task that worked', async () => {
            await expect(hold.add(serverQueue, async () => 'ok', {}, always)).resolves.toBe('ok')
            expect(hold.current).toBeNull()
        })

        it('asks again when the hold ends, and nothing was rejected meanwhile', async () => {
            let refusals = 2
            const task = vi.fn(async () => {
                if (refusals-- > 0) throw held({ reason: 'rate_limited', retryAfterMs: 20 })
                return 'ok'
            })

            await expect(hold.add(serverQueue, task, {}, always)).resolves.toBe('ok')

            expect(task).toHaveBeenCalledTimes(3)
            expect(hold.current).toBeNull()
        })

        it('no other task of the server queue starts while it is held', async () => {
            let signedIn = false
            const refused = vi.fn(async () => {
                if (!signedIn) throw held({ reason: 'unauthorized' })
                return 'first'
            })
            const other = vi.fn(async () => 'second')
            serverQueue = new TaskQueue({ concurrency: 1 })
            hold = new LoadHold({ serverQueue, publish, onNotice })

            const first = hold.add(serverQueue, refused, {}, always)
            const second = hold.add(serverQueue, other, {}, always)
            await wait(15)
            expect(other).not.toHaveBeenCalled()

            signedIn = true
            hold.end()

            expect(await first).toBe('first')
            expect(await second).toBe('second')
        })

        it('an error with no hold goes on to the caller, and starts no hold', async () => {
            await expect(hold.add(serverQueue, async () => { throw new Error('502') }, {}, always)).rejects.toThrow('502')
            expect(hold.current).toBeNull()
        })

        it('a hold heard by a load that is over starts nothing and goes on to the caller', async () => {
            const error = held({ reason: 'unauthorized' })

            await expect(hold.add(serverQueue, async () => { throw error }, {}, () => false)).rejects.toBe(error)
            expect(hold.current).toBeNull()
            expect(onNotice).not.toHaveBeenCalled()
        })

        it('a load that ended while its task was held is cancelled, not asked again', async () => {
            let current = true
            const task = vi.fn(async () => { throw held({ reason: 'unauthorized' }) })

            const asked = hold.add(serverQueue, task, {}, () => current)
            await wait(10)
            current = false
            hold.end()

            await expect(asked).rejects.toBeInstanceOf(TaskCancelledError)
            expect(task).toHaveBeenCalledTimes(1)
        })
    })
})
