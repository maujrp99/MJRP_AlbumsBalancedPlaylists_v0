/**
 * Not app code: the ways a failure is caught, so the test of swallowed failures can prove that its
 * reading sees each of them (test/architecture/noSwallowedFailure.test.js).
 */
const logger = console

export function emptyCatch(work) {
    try {
        return work()
    } catch { /* a comment is not a statement: this block is empty */ }
}

export function onlyLogs(work) {
    try {
        return work()
    } catch (e) {
        console.warn('it failed:', e.message)
        logger && logger.warn && logger.warn('it failed')
    }
    return []
}

export function emptyPromiseCatch(work) {
    return work().catch(() => {})
}

export function onlyLogsPromiseCatch(work) {
    return work().catch(e => console.error(e))
}

/** These two say what happened: they must not be reported. */
export function turnsItIntoAResult(work) {
    try {
        return work()
    } catch (e) {
        console.warn('it failed:', e.message)
        return { ok: false, code: 'upstream_failed' }
    }
}

export function throwsItOn(work) {
    return work().catch(e => { throw new Error(`the source failed: ${e.message}`) })
}
