import { readDemoLaunch } from '../demoLaunch'

const reading = (values: Record<string, unknown>) => (key: string) => values[key]

describe('the demo launch arguments (scripted simulator runs)', () => {
    it('reads the provider and the route', () => {
        expect(readDemoLaunch(reading({ demoSignIn: 'apple', demoRoute: '/diagnostics?run=1' }))).toEqual({ signIn: 'apple', route: '/diagnostics?run=1' })
    })

    it('ignores what is not a provider or not a route of the app', () => {
        expect(readDemoLaunch(reading({ demoSignIn: 'guest', demoRoute: 'https://example.com' }))).toEqual({})
        expect(readDemoLaunch(reading({}))).toEqual({})
    })
})
