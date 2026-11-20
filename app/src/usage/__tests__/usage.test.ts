import { EVENT_NAMES } from '@album-blender/shared/usageEvents.js'
import { createUsage, memoryUsage, noUsage } from '../usage'

describe('the app measures through the closed list of the core (REQ-15)', () => {
    beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}))
    afterEach(() => jest.restoreAllMocks())

    it('an event of the list goes to the adapter, with only the properties of its list', () => {
        const adapter = memoryUsage()
        const usage = createUsage(adapter)
        expect(usage.track('sign_in', { provider: 'apple', email: 'someone@example.com' })).toBe(true)
        expect(adapter.sent).toEqual([{ name: 'sign_in', properties: { provider: 'apple' } }])
    })

    it('a name not on the list is refused, and nothing is sent', () => {
        const adapter = memoryUsage()
        expect(createUsage(adapter).track('series_name_typed', { text: 'my series' })).toBe(false)
        expect(adapter.sent).toEqual([])
    })

    it('free text never fits: a value outside the closed set is dropped', () => {
        const adapter = memoryUsage()
        createUsage(adapter).track('screen_viewed', { screen: '/albums?seriesId=abc' })
        expect(adapter.sent).toEqual([{ name: 'screen_viewed', properties: {} }])
    })

    it('the same names as the site: the list is the core\'s, not a copy', () => {
        expect(EVENT_NAMES).toContain('screen_viewed')
        expect(EVENT_NAMES).toContain('sign_in')
    })

    it('off sends nothing, and an adapter that fails never reaches the screen', () => {
        expect(createUsage(noUsage).track('sign_out')).toBe(true)
        const failing = createUsage({ send: () => { throw new Error('offline') } })
        expect(failing.track('sign_out')).toBe(false)
    })
})
