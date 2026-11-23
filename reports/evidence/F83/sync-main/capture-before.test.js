/**
 * F83, sync of main - written once, on the hand-made menu of `main` (F88, in production), before the React shell replaced it: it starts the hand-made
 * shell (TopNav, Footer, PhoneShell, as app.js's initUI does on main) for every scenario of test/support/shellScenarios.js and writes what stands in
 * the page to test/fixtures/shellBeforeF88.json: the golden fixture of the shell is now `main`'s menu.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives in reports/evidence/F83/sync-main/capture-before.test.js (the runner only reads test/); it ran as
 * test/shell/shellCapture.test.js (paths one folder shorter) in a worktree of `main` (commit 1330ba9, where components/TopNav.js, AuthNav.js,
 * PhoneShell.js and the navigation/ files of F88 stand), with test/support/shellScenarios.js taken from this branch.
 */
import { describe, it, afterEach, beforeEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/components/Toast.js', async () => ({ default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/services/DialogService.js', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { TopNav } from '../../public/js/components/TopNav.js'
import { Footer } from '../../public/js/components/Footer.js'
import { startPhoneShell, nameThisScreen } from '../../public/js/components/navigation/PhoneShell.js'
import { showLoginModal } from '../../public/js/components/LoginModal.js'
import { showDiscogsNotice } from '../../public/js/components/Footer.js'
import { userStore } from '../../public/js/stores/UserStore.js'
import { SCENARIOS, keyOf, asPhone, driver, world, stand, scopedIdLookup } from '../support/shellScenarios.js'

const OUT = 'test/fixtures/shellBeforeF88.json'
const captured = {}
const SKELETON = '<div id="header-container"></div><div id="app"></div><div id="footer-container"></div>'

describe('capture of the hand-made shell of main (F88)', () => {
    let hooks, topNav, phoneShell
    const adapter = {
        act: async (work) => { await work() },
        skeleton: () => SKELETON,
        start() {
            hooks = []
            const router = { afterNavigate: (hook) => { hooks.push(hook); return () => { hooks = hooks.filter(h => h !== hook) } } }
            topNav = new TopNav({ clearCaches: stand.clearCaches })
            router.afterNavigate((path) => topNav.followScreen(path))
            const header = document.getElementById('header-container')
            header.innerHTML = topNav.render()
            topNav.attachListeners()
            const footer = new Footer({ clearCaches: stand.clearCaches, reload: () => world.calls.push(['reload page']) })
            const footerEl = document.getElementById('footer-container')
            footerEl.innerHTML = footer.render()
            footer.attachListeners()
            // the hand-made TopNav draws everything again at each notice of the user store, as app.js leaves it
            phoneShell = startPhoneShell({ router, userStore, clearCaches: stand.clearCaches })
        },
        stop() {
            topNav?.authNav.detachListeners()
            topNav?.authNav.connections?.destroy()
            phoneShell?.unmount()
        },
        navigated: (path) => hooks.forEach(hook => hook(path, {})),
        nameThisScreen,
        showDiscogsNotice: (on) => showDiscogsNotice(on),
        openLogin: () => showLoginModal()
    }

    beforeEach(() => { world.reset(); scopedIdLookup() })
    afterEach(() => { adapter.stop(); document.body.innerHTML = ''; document.body.removeAttribute('style') })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            adapter.phone = asPhone(Boolean(scenario.phone), scenario.width)
            userStore.listeners.clear()
            userStore.loading = true
            userStore.currentUser = null
            if (scenario.user !== 'loading') userStore.setUser(scenario.user)
            world.spotify = { connected: false, profile: null, ...scenario.spotify }
            world.apple = { authorized: false, checkFails: false, connectFails: false, ...scenario.apple }
            document.body.innerHTML = SKELETON
            window.history.replaceState({}, '', scenario.url)
            adapter.start()
            const snaps = {}
            const { h } = driver({ adapter, snaps, scenario })
            await h.settle()
            await scenario.run(h)
            captured[keyOf(scenario)] = snaps
        })
    }

    it('writes the record', () => { fs.writeFileSync(OUT, JSON.stringify(captured)) })
})
