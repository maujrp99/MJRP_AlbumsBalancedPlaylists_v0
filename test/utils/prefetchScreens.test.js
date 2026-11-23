/**
 * F83 TASK-05: the screens of the menu are fetched in the background, once, after the first screen is on the page.
 */
import { describe, it, expect, vi } from 'vitest'
import { prefetchScreensAfterTheFirstScreen } from '../../public/js/utils/prefetchScreens.js'

const fakeRouter = () => {
    const hooks = new Set()
    return {
        afterNavigate: (hook) => { hooks.add(hook); return () => hooks.delete(hook) },
        navigated: () => [...hooks].forEach(hook => hook('/start', {}, '/start')),
        count: () => hooks.size
    }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe('prefetchScreensAfterTheFirstScreen', () => {
    it('fetches nothing before the first screen, then every screen of the menu, in order, once', async () => {
        const router = fakeRouter()
        const order = []
        const importers = [async () => order.push('a'), async () => order.push('b')]
        const schedule = vi.fn(work => work())
        prefetchScreensAfterTheFirstScreen(router, importers, { schedule })

        expect(order).toEqual([])
        router.navigated()
        await tick()
        router.navigated() // the second screen does not fetch again
        await tick()

        expect(order).toEqual(['a', 'b'])
        expect(schedule).toHaveBeenCalledTimes(1)
        expect(router.count()).toBe(0)
    })

    it('a screen that does not come does not stop the others and throws nothing', async () => {
        const router = fakeRouter()
        const order = []
        const importers = [async () => { throw new Error('offline') }, async () => order.push('b')]
        prefetchScreensAfterTheFirstScreen(router, importers, { schedule: work => work() })

        router.navigated()
        await tick()

        expect(order).toEqual(['b'])
    })

    it('waits for the moment the scheduler gives, and can be told to stop waiting', async () => {
        const router = fakeRouter()
        const load = vi.fn(async () => {})
        let start = () => {}
        const stop = prefetchScreensAfterTheFirstScreen(router, [load], { schedule: work => { start = work } })
        router.navigated()
        expect(load).not.toHaveBeenCalled()
        start()
        await tick()
        expect(load).toHaveBeenCalledTimes(1)

        const second = fakeRouter()
        const never = prefetchScreensAfterTheFirstScreen(second, [load], { schedule: work => work() })
        never()
        second.navigated()
        await tick()
        expect(load).toHaveBeenCalledTimes(1)
        expect(typeof stop).toBe('function')
    })
})
