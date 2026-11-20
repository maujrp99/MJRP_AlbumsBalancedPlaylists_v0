import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'
import { AlbumsScreen } from '../AlbumsScreen'
import { SignInScreen } from '../SignInScreen'
import { NotInTheAppYet } from '../NotInTheAppYet'
import { SelfTestScreen } from '../SelfTestScreen'
import { AppServicesProvider } from '../../ui/AppServicesContext'
import { createMemoryStore, timestampOf } from '../../data/memoryStore'
import { createFakeAuth } from '../../auth/fakeAuth'
import { createUsage, memoryUsage } from '../../usage/usage'
import { DEMO_USER_ID, seedDemo, seriesPathOf } from '../../demo/demoSeed'
import { wirePlatform, unwirePlatformForTests } from '../../platform/wiring'
import type { AppServices } from '../../composition'
import type { SelfTestResult } from '../../selftest/goldenSelfTest'

const metrics = { frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }

function servicesWith(overrides: Partial<AppServices> = {}) {
    const store = createMemoryStore()
    const sent = memoryUsage()
    const services: AppServices = { mode: 'demo', store, auth: createFakeAuth(), usage: createUsage(sent), ...overrides }
    return { services, store, sent }
}

const wrap = (services: AppServices, child: ReactNode) => render( // RNTL 14: render and fireEvent are async
    <SafeAreaProvider initialMetrics={metrics}><AppServicesProvider services={services}>{child}</AppServicesProvider></SafeAreaProvider>
)

beforeAll(() => wirePlatform())
afterAll(() => unwirePlatformForTests())

describe('Albums: the person\'s series (REQ-12 in part)', () => {
    it('shows the loading state, then the series newest first with their album counts', async () => {
        const store = createMemoryStore({ readDelayMs: 30 })
        const { services, sent } = servicesWith({ store })
        seedDemo(store)
        await wrap(services, <AlbumsScreen userId={DEMO_USER_ID} />)
        expect(screen.getByText('Loading your series…')).toBeTruthy()
        await screen.findByTestId('albums-list')
        expect(screen.getByText('Albums')).toBeTruthy() // the screen's name in the top bar
        expect(screen.getByText('3 series · newest first')).toBeTruthy()
        const names = screen.getAllByText(/^(Manchester|Live records|Prog and art rock)$/).map(node => node.props.children)
        expect(names).toEqual(['Manchester', 'Live records', 'Prog and art rock'])
        expect(screen.getByText('3 albums')).toBeTruthy()
        expect(screen.getAllByText('2 albums')).toHaveLength(2)
        expect(screen.getAllByTestId('cover-placeholder')).toHaveLength(3) // the demo keeps no covers
        expect(sent.sent).toContainEqual({ name: 'screen_viewed', properties: { screen: 'albums' } })
    })

    it('shows the covers a series keeps', async () => {
        const { services, store } = servicesWith()
        store.seed(`${seriesPathOf('u1')}/s1`, {
            name: 'With covers', createdAt: timestampOf(1),
            albumQueries: [{ artist: 'A', title: 'B', coverUrl: 'https://img.example/1.jpg' }, { artist: 'C', title: 'D', coverUrl: 'https://img.example/2.jpg' }]
        })
        await wrap(services, <AlbumsScreen userId="u1" />)
        await screen.findByTestId('albums-list')
        expect(screen.getAllByTestId('cover')).toHaveLength(2)
    })

    it('says when there is no series yet', async () => {
        const { services } = servicesWith()
        await wrap(services, <AlbumsScreen userId="nobody" />)
        expect(await screen.findByText('No series yet')).toBeTruthy()
        expect(screen.getByText('Series you create on the Album Blender site show up here.')).toBeTruthy()
    })

    it('says that the read failed, with «Try again» that reads again', async () => {
        const { services, store } = servicesWith()
        seedDemo(store)
        store.failNextRead(new Error('unavailable'))
        await wrap(services, <AlbumsScreen userId={DEMO_USER_ID} />)
        expect(await screen.findByText("Couldn't load your series.")).toBeTruthy()
        expect(screen.getByText('Check the connection and try again. (unavailable)')).toBeTruthy()
        await fireEvent.press(screen.getByText('Try again'))
        await screen.findByTestId('albums-list')
    })

    it('a long press on the title opens the diagnostics', async () => {
        const { services } = servicesWith()
        const open = jest.fn()
        await wrap(services, <AlbumsScreen userId="nobody" onOpenDiagnostics={open} />)
        await screen.findByText('No series yet')
        await fireEvent(screen.getByText('Albums'), 'longPress')
        expect(open).toHaveBeenCalled()
    })
})

describe('Sign in (REQ-12)', () => {
    it('offers Apple and Google, and signs in through the account port', async () => {
        const auth = createFakeAuth()
        const { services, sent } = servicesWith({ auth })
        await wrap(services, <SignInScreen />)
        expect(screen.getByText('Sign in with Apple')).toBeTruthy()
        expect(screen.getByText('Sign in with Google')).toBeTruthy()
        expect(screen.getByText('Demo mode: no account is used, and the series are examples.')).toBeTruthy()
        await fireEvent.press(screen.getByText('Sign in with Apple'))
        expect(auth.current()).toMatchObject({ provider: 'apple' })
        expect(sent.sent).toContainEqual({ name: 'sign_in', properties: { provider: 'apple' } })
    })

    it('shows «Signing in…» while the provider answers', async () => {
        const { services } = servicesWith({ auth: createFakeAuth({ delayMs: 50 }) })
        await wrap(services, <SignInScreen />)
        await fireEvent.press(screen.getByText('Sign in with Google'))
        expect(await screen.findByText('Signing in…')).toBeTruthy()
        await waitFor(() => expect(screen.queryByText('Signing in…')).toBeNull())
    })

    it('a failure says «Couldn\'t sign in. Try again.»; a cancel says nothing', async () => {
        const auth = createFakeAuth()
        const { services } = servicesWith({ auth, mode: 'firebase' })
        await wrap(services, <SignInScreen />)
        expect(screen.queryByText(/Demo mode/)).toBeNull()
        auth.failNextSignIn(new Error('network'))
        await fireEvent.press(screen.getByText('Sign in with Google'))
        expect(screen.getByText("Couldn't sign in. Try again.")).toBeTruthy()
        auth.failNextSignIn('cancelled')
        await fireEvent.press(screen.getByText('Sign in with Apple'))
        expect(screen.queryByText("Couldn't sign in. Try again.")).toBeNull()
        expect(auth.current()).toBeNull()
    })

    it('offers only what the platform has (Android: Google)', async () => {
        const { services } = servicesWith({ auth: createFakeAuth({ providers: ['google'] }) })
        await wrap(services, <SignInScreen />)
        expect(screen.queryByText('Sign in with Apple')).toBeNull()
        expect(screen.getByText('Sign in with Google')).toBeTruthy()
    })

    it('autoSignIn (the demo link ?as=apple) signs in once, with no tap', async () => {
        const auth = createFakeAuth()
        const { services, sent } = servicesWith({ auth })
        await wrap(services, <SignInScreen autoSignIn="apple" />)
        await waitFor(() => expect(auth.current()).toMatchObject({ provider: 'apple' }))
        expect(sent.sent.filter(event => event.name === 'sign_in')).toHaveLength(1)
    })
})

describe('the destinations not built yet say so', () => {
    it.each(['Home', 'Blend', 'Playlists', 'Inventory'])('%s', async (name) => {
        const { services } = servicesWith()
        await wrap(services, <NotInTheAppYet name={name} />)
        expect(screen.getByText(name)).toBeTruthy()
        expect(screen.getByText('Not in the app yet')).toBeTruthy()
    })
})

describe('the self-test screen (REQ-16)', () => {
    const result = (matching: number): SelfTestResult => ({
        cases: 3, matching, different: matching === 3 ? [] : ['recipe:x'], missing: [], extra: [],
        ids: { generated: 10, notV4: 0, repeated: 0 }, millis: 5
    })

    it('runs and shows «N of N match»', async () => {
        const { services } = servicesWith()
        await wrap(services, <SelfTestScreen run={() => result(3)} />)
        await fireEvent.press(screen.getByText('Run the self-test'))
        expect(await screen.findByText('3 of 3 match')).toBeTruthy()
    })

    it('names the cases that differ', async () => {
        const { services } = servicesWith()
        await wrap(services, <SelfTestScreen run={() => result(2)} />)
        await fireEvent.press(screen.getByText('Run the self-test'))
        expect(await screen.findByText('2 of 3 match')).toBeTruthy()
        expect(screen.getByText('recipe:x')).toBeTruthy()
    })

    it('starts at once with autoRun (the link ?run=1) and writes the result as one log line', async () => {
        const info = jest.spyOn(console, 'info').mockImplementation(() => {})
        try {
            const { services } = servicesWith()
            await wrap(services, <SelfTestScreen run={() => result(2)} autoRun />)
            expect(await screen.findByText('2 of 3 match')).toBeTruthy()
            expect(info).toHaveBeenCalledTimes(2)
            expect(info.mock.calls[0]![0]).toMatch(/^\[golden-self-test\] 2 of 3 match; passed: false; different: 1; .*; cases: recipe:x$/)
            // Jest runs on Node, not Hermes; the id comes from the wired source and is a v4
            expect(info.mock.calls[1]![0]).toMatch(/^\[golden-self-test\] engine: not Hermes; crypto global: \w+; id sample: [0-9a-f-]{36}; v4: true$/)
        } finally {
            info.mockRestore()
        }
    })
})
