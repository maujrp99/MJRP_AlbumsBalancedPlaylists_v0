/**
 * TaskQueue
 *
 * Runs async tasks with a limit of tasks at once, a priority, a deadline per task and cancellation.
 * It knows nothing about albums, the network or the screen: it receives functions and returns promises.
 * (arch.md, "Carga da tela de álbuns": the queue behind the album load; patterns DP-20 pure core, DP-22 Timeout.)
 *
 * A task is `({ signal }) => Promise`. The signal is aborted when the task passes its deadline or the
 * queue is cancelled, so a task that passes it on (fetch, for instance) really stops.
 */

/** A task did not finish before its deadline. */
export class TaskTimeoutError extends Error {
    constructor(timeoutMs) {
        super(`Task passed its deadline of ${timeoutMs} ms`)
        this.name = 'TaskTimeoutError'
        this.timeoutMs = timeoutMs
    }
}

/** A task was dropped because the queue was cancelled. */
export class TaskCancelledError extends Error {
    constructor() {
        super('Task cancelled')
        this.name = 'TaskCancelledError'
    }
}

export class TaskQueue {
    /**
     * @param {Object} [options]
     * @param {number} [options.concurrency=4] - how many tasks may run at the same time
     * @param {number} [options.timeoutMs=0] - default deadline per task; 0 means no deadline
     */
    constructor({ concurrency = 4, timeoutMs = 0 } = {}) {
        this.concurrency = Math.max(1, concurrency)
        this.timeoutMs = timeoutMs
        this._waiting = []
        this._running = new Set()
        this._sequence = 0
        this._idleResolvers = []
    }

    /** Tasks waiting for a slot. */
    get pending() {
        return this._waiting.length
    }

    /** Tasks running now. */
    get running() {
        return this._running.size
    }

    /**
     * Add a task. Resolves or rejects with the task's own outcome; rejects with TaskTimeoutError
     * at the deadline and with TaskCancelledError if the queue is cancelled first.
     *
     * @param {Function} task - ({ signal }) => Promise
     * @param {Object} [options]
     * @param {number} [options.priority=0] - higher runs first; equal priorities keep the order added
     * @param {string} [options.group] - a name to raise the priority of several tasks at once
     * @param {number} [options.timeoutMs] - deadline for this task (wins over the queue default)
     * @returns {Promise<*>}
     */
    add(task, { priority = 0, group = null, timeoutMs = this.timeoutMs } = {}) {
        return new Promise((resolve, reject) => {
            this._waiting.push({ task, priority, group, timeoutMs, order: this._sequence++, resolve, reject })
            this._startNext()
        })
    }

    /**
     * Raise (or lower) the priority of every waiting task of a group.
     * @param {string} group
     * @param {number} priority
     */
    prioritize(group, priority) {
        this._waiting.forEach(entry => {
            if (entry.group === group) entry.priority = priority
        })
    }

    /**
     * Drop every waiting task and abort every running one. All of them reject with TaskCancelledError.
     * The queue stays usable: a task added afterwards runs normally.
     */
    cancelAll() {
        const waiting = this._waiting
        this._waiting = []
        waiting.forEach(entry => entry.reject(new TaskCancelledError()))
        this._running.forEach(run => run.cancel())
        this._settleIdle()
    }

    /** Resolves when nothing is waiting and nothing is running. */
    onIdle() {
        if (this.pending === 0 && this.running === 0) return Promise.resolve()
        return new Promise(resolve => this._idleResolvers.push(resolve))
    }

    _startNext() {
        while (this._running.size < this.concurrency && this._waiting.length > 0) {
            this._run(this._takeNext())
        }
    }

    _takeNext() {
        let best = 0
        for (let i = 1; i < this._waiting.length; i++) {
            const candidate = this._waiting[i]
            const current = this._waiting[best]
            const higher = candidate.priority > current.priority
            const sameButOlder = candidate.priority === current.priority && candidate.order < current.order
            if (higher || sameButOlder) best = i
        }
        return this._waiting.splice(best, 1)[0]
    }

    _run(entry) {
        const controller = new AbortController()
        let timer = null
        let settled = false

        const finish = (settle, value) => {
            if (settled) return
            settled = true
            if (timer) clearTimeout(timer)
            this._running.delete(run)
            settle(value)
            this._startNext()
            this._settleIdle()
        }

        const run = {
            cancel: () => {
                controller.abort()
                finish(entry.reject, new TaskCancelledError())
            }
        }
        this._running.add(run)

        if (entry.timeoutMs > 0) {
            timer = setTimeout(() => {
                controller.abort()
                finish(entry.reject, new TaskTimeoutError(entry.timeoutMs))
            }, entry.timeoutMs)
        }

        Promise.resolve()
            .then(() => entry.task({ signal: controller.signal }))
            .then(
                value => finish(entry.resolve, value),
                error => finish(entry.reject, error)
            )
    }

    _settleIdle() {
        if (this.pending !== 0 || this.running !== 0) return
        const resolvers = this._idleResolvers
        this._idleResolvers = []
        resolvers.forEach(resolve => resolve())
    }
}
