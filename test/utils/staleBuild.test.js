/**
 * F64 (UAT-207) - a tab opened before a publication runs the old script. Every publication
 * replaces the files of the screens loaded on demand, so the old script asks for a file that no
 * longer exists and the screen ended as "View Error". The app now loads the new version, once.
 */
import { describe, it, expect, vi } from 'vitest'
import { isMissingBuildFile, reloadOnceForNewBuild, RELOAD_GUARD_MS } from '../../public/js/utils/staleBuild.js'

const storage = () => {
    const kept = new Map()
    return { getItem: (k) => (kept.has(k) ? kept.get(k) : null), setItem: (k, v) => kept.set(k, String(v)) }
}

describe('isMissingBuildFile', () => {
    it('knows the failure of a screen file that is gone, as each browser words it', () => {
        expect(isMissingBuildFile(new TypeError('Failed to fetch dynamically imported module: https://x/assets/SavedPlaylistsView-DnpU13hL.js'))).toBe(true)
        expect(isMissingBuildFile(new TypeError('error loading dynamically imported module'))).toBe(true)
        expect(isMissingBuildFile(new TypeError('Importing a module script failed.'))).toBe(true)
    })

    it('does not take another failure for it', () => {
        expect(isMissingBuildFile(new Error('albums is not iterable'))).toBe(false)
        expect(isMissingBuildFile(new TypeError('Failed to fetch'))).toBe(false)
        expect(isMissingBuildFile(null)).toBe(false)
    })
})

describe('reloadOnceForNewBuild', () => {
    it('reloads the page the first time', () => {
        const reload = vi.fn()
        expect(reloadOnceForNewBuild({ storage: storage(), reload, now: () => 1000 })).toBe(true)
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload again right after: a file that is really missing must not loop', () => {
        const kept = storage()
        const reload = vi.fn()
        reloadOnceForNewBuild({ storage: kept, reload, now: () => 1000 })
        expect(reloadOnceForNewBuild({ storage: kept, reload, now: () => 1000 + RELOAD_GUARD_MS - 1 })).toBe(false)
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('reloads again for a later publication', () => {
        const kept = storage()
        const reload = vi.fn()
        reloadOnceForNewBuild({ storage: kept, reload, now: () => 1000 })
        expect(reloadOnceForNewBuild({ storage: kept, reload, now: () => 1000 + RELOAD_GUARD_MS + 1 })).toBe(true)
        expect(reload).toHaveBeenCalledTimes(2)
    })

    it('a browser that refuses the storage still reloads once per call and never throws', () => {
        const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
        const reload = vi.fn()
        expect(reloadOnceForNewBuild({ storage: broken, reload, now: () => 1 })).toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })
})
