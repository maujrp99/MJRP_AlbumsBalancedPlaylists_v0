/**
 * F83 wave 3 - written once, on the hand-made shell, before it was deleted: it starts the old shell (TopNav, Footer, PhoneShell, as app.js's initUI
 * did) for every scenario of test/support/shellScenarios.js and writes what stands in the page to test/fixtures/shellBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives in reports/evidence/F83/wave-3/capture-before.test.js (the runner only reads test/); it ran from
 * test/shell/shellCapture.test.js (with the paths one folder shorter) against the tree where components/TopNav.js still existed (the commit
 * before the one that deleted it).
 */
import { describe, it, afterEach, beforeEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../../../../test/support/shellScenarios.js')).stand.login }))
vi.mock('../../../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../../../../test/support/shellScenarios.js')).stand.spotify }))
vi.mock('../../../../public/js/components/Toast.js', async () => ({ default: (await import('../../../../test/support/shellScenarios.js')).stand.toast }))
vi.mock('../../../../public/js/services/DialogService.js', async () => ({ dialogService: (await import('../../../../test/support/shellScenarios.js')).stand.dialog }))
vi.mock('../../../../public/js/services/usage/track.js', async () => ({ track: (await import('../../../../test/support/shellScenarios.js')).stand.track }))
vi.mock('../../../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../../../../test/support/shellScenarios.js')).stand.reloadApp }))

import { TopNav } from '../../../../public/js/components/TopNav.js'
import { Footer } from '../../../../public/js/components/Footer.js'
import { startPhoneShell, nameThisScreen } from '../../../../public/js/components/navigation/PhoneShell.js'
import { showLoginModal } from '../../../../public/js/components/LoginModal.js'
import { showDiscogsNotice } from '../../../../public/js/components/Footer.js'
import { userStore } from '../../../../public/js/stores/UserStore.js'
import { SCENARIOS, keyOf, asPhone, driver, world, stand, scopedIdLookup } from '../../../../test/support/shellScenarios.js'

const OUT = 'test/fixtures/shellBeforeF83.json'
const captured = {}
const SKELETON = '<div id="header-container"></div><div id="app"></div><div id="footer-container"></div>'

describe('capture of the hand-made shell', () => {
    let hooks, topNav, phoneShell
    const adapter = {
        act: async (work) => { await work() },
        skeleton: () => SKELETON,
        start() {
            hooks = []
            const router = { afterNavigate: (hook) => { hooks.push(hook); return () => { hooks = hooks.filter(h => h !== hook) } } }
            topNav = new TopNav()
            const header = document.getElementById('header-container')
            header.innerHTML = topNav.render()
            topNav.attachListeners()
            const footer = new Footer({ clearCaches: stand.clearCaches, reload: () => world.calls.push(['reload page']) })
            const footerEl = document.getElementById('footer-container')
            footerEl.innerHTML = footer.render()
            footer.attachListeners()
            phoneShell = startPhoneShell({ router, userStore, clearCaches: stand.clearCaches })
        },
        stop() {
            topNav?.authNav.detachListeners()
            topNav?.seriesDropdown?.destroy()
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
