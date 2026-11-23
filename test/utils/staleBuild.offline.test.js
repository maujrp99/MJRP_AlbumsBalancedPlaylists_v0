/**
 * F83 TASK-05 (REQ-10, risk R19): «no network» is not «new version». A screen file that cannot be had is one of three
 * things: it arrived; it is gone because the site was published again (checked by asking for /app.html without cache and
 * comparing the name of the main script); or the network did not answer (in 10 s, or at all). Only the second reloads.
 */
import { describe, it, expect, vi } from 'vitest'
import {
    LOAD_DEADLINE_MS, PUBLICATION, mainScriptOf, publicationState, loadWithDeadline, isLoadTimeout, installStaleBuildGuard
} from '../../public/js/utils/staleBuild.js'

const page = (script) => `<!doctype html><html><head><script type="module" crossorigin src="${script}"></script><link rel="stylesheet" href="/assets/main-x.css"></head><body></body></html>`
const answer = (text, ok = true) => vi.fn(async () => ({ ok, text: async () => text }))

describe('mainScriptOf: the main script a page names', () => {
    it('takes the first script under /assets/', () => {
        expect(mainScriptOf(page('/assets/main-CXGMhC4B.js'))).toBe('/assets/main-CXGMhC4B.js')
        expect(mainScriptOf('<html><body>no script</body></html>')).toBeNull()
        expect(mainScriptOf(undefined)).toBeNull()
    })
})

describe('publicationState: has the site been published again since this tab loaded?', () => {
    it('newer: the live page names another main script than the one running', async () => {
        const fetchApp = answer(page('/assets/main-NEW.js'))
        expect(await publicationState({ fetchApp, running: '/assets/main-OLD.js' })).toBe(PUBLICATION.NEWER)
        expect(fetchApp).toHaveBeenCalledWith('/app.html', { cache: 'no-store' })
    })

    it('same: the live page names the script running, so the file is missing for another reason', async () => {
        expect(await publicationState({ fetchApp: answer(page('/assets/main-OLD.js')), running: '/assets/main-OLD.js' })).toBe(PUBLICATION.SAME)
    })

    it('same: nothing to compare (the dev server has no published script), or the server answered with an error page', async () => {
        expect(await publicationState({ fetchApp: answer(page('/assets/main-NEW.js')), running: null })).toBe(PUBLICATION.SAME)
        expect(await publicationState({ fetchApp: answer('Not found', false), running: '/assets/main-OLD.js' })).toBe(PUBLICATION.SAME)
    })

    it('unreachable: the network did not answer', async () => {
        const fetchApp = vi.fn(async () => { throw new TypeError('Failed to fetch') })
        expect(await publicationState({ fetchApp, running: '/assets/main-OLD.js' })).toBe(PUBLICATION.UNREACHABLE)
    })

    it('unreachable: no answer in the time given', async () => {
        const fetchApp = vi.fn(() => new Promise(() => {}))
        expect(await publicationState({ fetchApp, running: '/assets/main-OLD.js', timeoutMs: 5 })).toBe(PUBLICATION.UNREACHABLE)
    })
})

describe('loadWithDeadline: a screen file that does not come in 10 s', () => {
    it('the deadline is 10 s', () => {
        expect(LOAD_DEADLINE_MS).toBe(10000)
    })

    it('gives the file when it comes', async () => {
        expect(await loadWithDeadline(Promise.resolve({ ok: 1 }), 50)).toEqual({ ok: 1 })
    })

    it('ends as a timeout of the load, which is not a failure of the screen', async () => {
        const error = await loadWithDeadline(new Promise(() => {}), 5).catch(failure => failure)
        expect(isLoadTimeout(error)).toBe(true)
        expect(isLoadTimeout(new Error('albums is not iterable'))).toBe(false)
        expect(isLoadTimeout(null)).toBe(false)
    })

    it('a failure of the file itself goes through as it is', async () => {
        const gone = new TypeError('Failed to fetch dynamically imported module: https://x/assets/Y.js')
        await expect(loadWithDeadline(Promise.reject(gone), 50)).rejects.toBe(gone)
    })
})

describe('the guard of the whole app does not reload for a lost network', () => {
    const preloadError = () => {
        const target = new EventTarget()
        const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: new Error('x') })
        return { target, fire: () => { target.dispatchEvent(event); return event } }
    }

    it('reloads once when the site was published again', async () => {
        const { target, fire } = preloadError()
        const reload = vi.fn()
        installStaleBuildGuard(target, { reload, storage: { getItem: () => null, setItem: () => {} }, publicationState: async () => PUBLICATION.NEWER })
        fire()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload when the network did not answer', async () => {
        const { target, fire } = preloadError()
        const reload = vi.fn()
        installStaleBuildGuard(target, { reload, storage: { getItem: () => null, setItem: () => {} }, publicationState: async () => PUBLICATION.UNREACHABLE })
        fire()
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(reload).not.toHaveBeenCalled()
    })
})
