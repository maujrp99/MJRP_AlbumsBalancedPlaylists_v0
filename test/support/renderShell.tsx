/**
 * renderShell - the scaffold for the tests of the shell in React (F83 wave 3), the way test/support/renderScreen.tsx is for a screen: the shell
 * is started as app.js starts it (`startShell`, on a page that has the places it draws in, with a router that is only a list of hooks), every
 * change goes through `act`, and the test goes on reading the DOM with `querySelector`.
 *
 * A test file that uses it mocks the modules the shell reaches outside itself with the stand-ins of shellScenarios.js (see Shell.sameAsBefore.test.tsx).
 */
import { act } from 'react'
import { startShell } from '../../public/js/shell/Shell'
import { nameThisScreen } from '../../public/js/stores/screenName.js'
import { showDiscogsNotice } from '../../public/js/stores/discogsNotice.js'
import { openLoginWindow } from '../../public/js/stores/loginWindow.js'
import { userStore } from '../../public/js/stores/UserStore.js'
import { it, expect } from 'vitest'
import { bridgeListenerCount } from '../../public/js/react-bridge/listeners'
import { loginWindowStore } from '../../public/js/stores/loginWindow.js'
import { windowListenersLeftBy } from './renderScreen'
import { SCENARIOS, asPhone, driver, world, stand } from './shellScenarios.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export const SKELETON = '<div id="header-container"></div><div id="app"></div><div id="footer-container"></div>'

export type Scenario = (typeof SCENARIOS)[number]

/** Starts the React shell the way app.js does, on a page that has the places it draws in. */
export interface ShellWorld {
    clearCaches?: () => Promise<unknown>
    reload?: () => void
}

export function makeAdapter(deps: ShellWorld = {}) {
    let hooks: Array<(path: string) => void> = []
    let stopShell: (() => void) | null = null
    const adapter = {
        phone: null as unknown as ReturnType<typeof asPhone>,
        act: async (work: () => void | Promise<void>) => { await act(async () => { await work() }) },
        skeleton: () => SKELETON,
        start() {
            hooks = []
            const router = { afterNavigate: (hook: (path: string) => void) => { hooks.push(hook); return () => { hooks = hooks.filter(h => h !== hook) } } }
            act(() => { stopShell = startShell({ router, userStore, clearCaches: (deps.clearCaches ?? stand.clearCaches) as () => Promise<void>, reload: deps.reload ?? (() => { world.calls.push(['reload page']) }) }) })
        },
        stop() {
            const stop = stopShell
            stopShell = null
            if (stop) act(() => stop())
        },
        navigated: (path: string) => hooks.forEach(hook => hook(path)),
        nameThisScreen,
        showDiscogsNotice,
        openLogin: () => openLoginWindow()
    }
    return adapter
}

/** Plays a scenario on the new shell and gives what it wrote down. */
export async function play(scenario: Scenario, adapter = makeAdapter()): Promise<Record<string, string | null>> {
    adapter.phone = asPhone(Boolean(scenario.phone), scenario.width)
    // (the listeners of the store are NOT cleared: the bridge keeps one fixed listener on each store for good)
    userStore.loading = true
    userStore.currentUser = null
    if (scenario.user !== 'loading') userStore.setUser(scenario.user)
    world.spotify = { connected: false, profile: null, ...scenario.spotify }
    document.body.innerHTML = SKELETON
    window.history.replaceState({}, '', scenario.url)
    adapter.start()
    const snaps: Record<string, string | null> = {}
    const { h } = driver({ adapter, snaps, scenario })
    await h.settle()
    await scenario.run(h)
    adapter.stop()
    return snaps
}


const flush = () => new Promise(resolve => setTimeout(resolve, 25))

/** The shell on a page at `path`, as app.js starts it, once its first draw has settled. `user` is who the login says is on the app. */
export async function startOn(path: string, { phone = false, width = phone ? 393 : 1280, user = null as unknown as Parameters<typeof userStore.setUser>[0], ...deps }: { phone?: boolean; width?: number; user?: Parameters<typeof userStore.setUser>[0] } & ShellWorld = {}) {
    const adapter = makeAdapter(deps)
    adapter.phone = asPhone(phone, width)
    userStore.loading = true
    userStore.currentUser = null
    userStore.setUser(user)
    document.body.innerHTML = SKELETON
    window.history.replaceState({}, '', path)
    adapter.start()
    await adapter.act(async () => { await flush() })
    return adapter
}

/**
 * The test the shell has, as every screen has its own (test/architecture/everyScreenHasTheLeaveTest.test.js asks for it): start and stop the
 * shell five times, on a computer and on a phone, with the menu of the phone and the window to sign in opened each time, and nothing of the
 * shell is still listening: not the stores, the language, the phone or the router (the count of the bridge), not the window, and nothing of it
 * is left in the body.
 */
export function itLeavesNoListeners(name: string, signedIn: Parameters<typeof userStore.setUser>[0]): void {
    it(`${name}: entering and leaving five times leaves zero listeners of the shell`, async () => {
        const before = bridgeListenerCount()
        const left = await windowListenersLeftBy(async () => {
            for (let visit = 0; visit < 5; visit++) {
                const adapter = await startOn('/albums', { phone: visit % 2 === 0, user: signedIn })
                await adapter.act(async () => { document.getElementById('phoneMenuBtn')?.click(); await flush() })
                await adapter.act(async () => { loginWindowStore.open(); await flush() })
                adapter.stop()
                expect(document.body.querySelectorAll('.sheet, .modal-overlay, #phone-topbar, #phone-tabbar, .phone-to-top').length).toBe(0)
                loginWindowStore.close()
            }
        })
        expect(bridgeListenerCount() - before).toBe(0)
        expect(left).toBe(0)
    })
}
