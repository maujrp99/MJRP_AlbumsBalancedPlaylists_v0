/**
 * F45 (UAT-172) - the queue behind the album load: a limit of tasks at once, a priority,
 * a deadline per task, cancellation. It knows nothing about albums, the network or the screen.
 */
import { describe, it, expect, vi } from 'vitest'
import { TaskQueue, TaskTimeoutError, TaskCancelledError } from '../../public/js/utils/TaskQueue.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('TaskQueue', () => {
    it('runs at most `concurrency` tasks at the same time', async () => {
        const queue = new TaskQueue({ concurrency: 3 })
        let running = 0
        let maxRunning = 0
        const task = async () => {
            running++
            maxRunning = Math.max(maxRunning, running)
            await wait(15)
            running--
            return 'done'
        }

        const results = await Promise.all(Array.from({ length: 9 }, () => queue.add(task)))

        expect(results).toEqual(Array(9).fill('done'))
        expect(maxRunning).toBe(3)
    })

    it('resolves each task with its own result and rejects with its own error', async () => {
        const queue = new TaskQueue({ concurrency: 2 })
        const ok = queue.add(async () => 42)
        const bad = queue.add(async () => { throw new Error('boom') })

        await expect(ok).resolves.toBe(42)
        await expect(bad).rejects.toThrow('boom')
    })

    it('a task that fails frees its slot for the next one', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        const first = queue.add(async () => { throw new Error('first failed') })
        const second = queue.add(async () => 'second ran')

        await expect(first).rejects.toThrow('first failed')
        await expect(second).resolves.toBe('second ran')
    })

    it('rejects a task that passes its deadline with TaskTimeoutError and frees the slot', async () => {
        const queue = new TaskQueue({ concurrency: 1, timeoutMs: 40 })
        const stuck = queue.add(() => new Promise(() => { }))
        const next = queue.add(async () => 'ran after the stuck one')

        await expect(stuck).rejects.toBeInstanceOf(TaskTimeoutError)
        await expect(next).resolves.toBe('ran after the stuck one')
    })

    it('aborts the signal it gave to a task when the deadline passes', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        let seenSignal
        const stuck = queue.add(({ signal }) => { seenSignal = signal; return new Promise(() => { }) }, { timeoutMs: 30 })

        await expect(stuck).rejects.toBeInstanceOf(TaskTimeoutError)
        expect(seenSignal.aborted).toBe(true)
    })

    it('a per-task deadline wins over the queue default', async () => {
        const queue = new TaskQueue({ concurrency: 1, timeoutMs: 20 })
        const slowButAllowed = queue.add(async () => { await wait(50); return 'finished' }, { timeoutMs: 200 })

        await expect(slowButAllowed).resolves.toBe('finished')
    })

    it('starts the task with the highest priority first; equal priorities keep the order they were added', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        const order = []
        const task = (name) => async () => { order.push(name); await wait(5) }

        const all = [
            queue.add(task('running-first')),            // takes the only slot at once
            queue.add(task('low-a'), { priority: 0 }),
            queue.add(task('high'), { priority: 10 }),
            queue.add(task('low-b'), { priority: 0 })
        ]
        await Promise.all(all)

        expect(order).toEqual(['running-first', 'high', 'low-a', 'low-b'])
    })

    it('raises the priority of waiting tasks by their group', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        const order = []
        const task = (name) => async () => { order.push(name); await wait(5) }

        const all = [
            queue.add(task('running-first')),
            queue.add(task('series-a-1'), { group: 'series-a' }),
            queue.add(task('series-b-1'), { group: 'series-b' }),
            queue.add(task('series-b-2'), { group: 'series-b' })
        ]
        queue.prioritize('series-b', 5)
        await Promise.all(all)

        expect(order).toEqual(['running-first', 'series-b-1', 'series-b-2', 'series-a-1'])
    })

    it('cancelAll rejects the waiting tasks with TaskCancelledError and aborts the running ones', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        let runningSignal
        const running = queue.add(({ signal }) => {
            runningSignal = signal
            return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted by signal'))))
        })
        const waiting = queue.add(vi.fn(async () => 'never runs'))

        await wait(5)
        queue.cancelAll()

        await expect(waiting).rejects.toBeInstanceOf(TaskCancelledError)
        await expect(running).rejects.toBeInstanceOf(TaskCancelledError)
        expect(runningSignal.aborted).toBe(true)
        expect(queue.pending).toBe(0)
    })

    it('a task added after cancelAll runs normally', async () => {
        const queue = new TaskQueue({ concurrency: 1 })
        queue.cancelAll()

        await expect(queue.add(async () => 'fresh')).resolves.toBe('fresh')
    })

    it('reports how many tasks are waiting and running, and resolves onIdle when both are zero', async () => {
        const queue = new TaskQueue({ concurrency: 2 })
        const all = Array.from({ length: 5 }, () => queue.add(async () => { await wait(10) }))

        expect(queue.running).toBe(2)
        expect(queue.pending).toBe(3)

        await queue.onIdle()
        expect(queue.running).toBe(0)
        expect(queue.pending).toBe(0)
        await Promise.all(all)
    })

    describe('pause and resume (F52: the load holds when the server says "wait")', () => {
        it('a paused queue starts no new task; what was running finishes; resume starts the rest', async () => {
            const queue = new TaskQueue({ concurrency: 1 })
            const started = []
            const task = (name) => async () => { started.push(name); await wait(10); return name }

            const first = queue.add(task('first'))
            const second = queue.add(task('second'))
            await wait(0)
            queue.pause()

            await expect(first).resolves.toBe('first')
            await wait(20)
            expect(started).toEqual(['first'])
            expect(queue.paused).toBe(true)
            expect(queue.pending).toBe(1)

            queue.resume()
            await expect(second).resolves.toBe('second')
            expect(queue.paused).toBe(false)
        })

        it('a task added while paused waits for resume', async () => {
            const queue = new TaskQueue({ concurrency: 2 })
            queue.pause()
            const run = vi.fn(async () => 'ok')
            const added = queue.add(run)

            await wait(10)
            expect(run).not.toHaveBeenCalled()

            queue.resume()
            await expect(added).resolves.toBe('ok')
        })

        it('is not idle while paused with tasks waiting; cancelAll still rejects them', async () => {
            const queue = new TaskQueue({ concurrency: 1 })
            queue.pause()
            const added = queue.add(async () => 'never')
            let idle = false
            queue.onIdle().then(() => { idle = true })

            await wait(10)
            expect(idle).toBe(false)

            queue.cancelAll()
            await expect(added).rejects.toBeInstanceOf(TaskCancelledError)
            await wait(0)
            expect(idle).toBe(true)
        })

        it('resume on a queue that is not paused does nothing', async () => {
            const queue = new TaskQueue({ concurrency: 1 })
            queue.resume()
            await expect(queue.add(async () => 1)).resolves.toBe(1)
        })
    })

    it('imports nothing from the project (it does not know the domain)', async () => {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const source = fs.readFileSync(path.resolve(process.cwd(), 'public/js/utils/TaskQueue.js'), 'utf8')

        expect(source).not.toMatch(/^\s*import\s/m)
    })
})
