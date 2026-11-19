/**
 * CacheManager.clear tells the truth (F48, UAT-177): when IndexedDB cannot be cleared it fails,
 * so the "Clear Cache" button does not say "cleared" over data that is still there.
 */
import { describe, it, expect, vi } from 'vitest'
import { CacheManager } from '../../public/js/cache/CacheManager.js'

const build = (l2) => {
    const manager = new CacheManager()
    manager.initPromise = Promise.resolve()
    manager.l2Available = true
    manager.l2 = l2
    return manager
}

describe('CacheManager.clear (F48)', () => {
    it('clears memory and IndexedDB', async () => {
        const l2 = { clear: vi.fn(async () => {}) }
        const manager = build(l2)
        await manager.l1.set('album:a', { title: 'A' })

        await manager.clear()

        expect(await manager.l1.get('album:a')).toBeNull()
        expect(l2.clear).toHaveBeenCalledTimes(1)
    })

    it('fails when IndexedDB could not be cleared', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const manager = build({ clear: vi.fn(async () => { throw new Error('blocked') }) })

        await expect(manager.clear()).rejects.toThrow('blocked')
    })
})
