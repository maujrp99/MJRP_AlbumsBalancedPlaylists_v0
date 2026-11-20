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

describe('installStaleBuildGuard: every file asked for on demand, not only the screens (F73, UAT-213)', () => {
    const fresh = () => ({ storage: storage(), reload: vi.fn(), now: () => 1000 })
    const rejection = (reason) => Object.assign(new Event('unhandledrejection', { cancelable: true }), { reason })

    it('loads the app again when Vite says a file loaded on demand failed', async () => {
        const { installStaleBuildGuard } = await import('../../public/js/utils/staleBuild.js')
        const target = new EventTarget()
        const options = fresh()
        installStaleBuildGuard(target, options)
        const event = new Event('vite:preloadError', { cancelable: true })
        target.dispatchEvent(event)
        expect(options.reload).toHaveBeenCalledTimes(1)
        expect(event.defaultPrevented).toBe(true)
    })

    it('loads the app again when the import of a button failed and nobody caught it', async () => {
        const { installStaleBuildGuard } = await import('../../public/js/utils/staleBuild.js')
        const target = new EventTarget()
        const options = fresh()
        installStaleBuildGuard(target, options)
        target.dispatchEvent(rejection(new TypeError('Failed to fetch dynamically imported module: https://x/assets/SpotifyExportModal-abc.js')))
        expect(options.reload).toHaveBeenCalledTimes(1)
    })

    it('leaves any other failure alone', async () => {
        const { installStaleBuildGuard } = await import('../../public/js/utils/staleBuild.js')
        const target = new EventTarget()
        const options = fresh()
        installStaleBuildGuard(target, options)
        const event = rejection(new Error('Spotify said no'))
        target.dispatchEvent(event)
        expect(options.reload).not.toHaveBeenCalled()
        expect(event.defaultPrevented).toBe(false)
    })

    it('reloads once for two failures in a row, and stops watching when told', async () => {
        const { installStaleBuildGuard } = await import('../../public/js/utils/staleBuild.js')
        const target = new EventTarget()
        const options = fresh()
        const stop = installStaleBuildGuard(target, options)
        target.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))
        target.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))
        expect(options.reload).toHaveBeenCalledTimes(1)
        stop()
        const later = { ...options, now: () => 1000 + RELOAD_GUARD_MS + 1 }
        installStaleBuildGuard(new EventTarget(), later)
        target.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))
        expect(options.reload).toHaveBeenCalledTimes(1)
    })
})
