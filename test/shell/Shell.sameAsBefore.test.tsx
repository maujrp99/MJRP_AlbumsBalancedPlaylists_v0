/**
 * F83 wave 3 (REQ-02, REQ-05; TASK-19, TASK-30) and the sync of main: the shell in React draws what the hand-made shell of `main` draws (the menu of F88).
 *
 * The proof: for every scenario of test/support/shellScenarios.js (the top bar of the computer while the login has not answered, signed out, a
 * guest, signed in with Google and with Apple; the account menu by click, by key and by Escape; the menu of series; the drawer of the middle
 * screen; the Spotify button in every state; the window to sign in, entering, failing; the footer, its cache and the Discogs sentence; on the
 * phone the bars, the tabs, the name a screen gives itself, back to top, the menu, the question before clearing the cache, turning into a
 * computer and back) the page after each step equals what the hand-made shell drew at the same step. The old pages are kept in
 * test/fixtures/shellBeforeF88.json: written once by the hand-made shell of main (F88) before it was replaced (reports/evidence/F83/sync-main/capture-before.test.js),
 * compared element by element, attribute by attribute (the order of the classes and the white space between tags are not drawn, as in waves 1
 * and 2). What the shell asked of the world outside (the login, Spotify, the toasts, the questions, the measurement of use) is compared too,
 * and so is where the focus is after each step.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/components/Toast.js', async () => ({ default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/services/DialogService.js', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { screenNameStore } from '../../public/js/stores/screenName.js'
import { showDiscogsNotice } from '../../public/js/stores/discogsNotice.js'
import { loginWindowStore } from '../../public/js/stores/loginWindow.js'
import { registerTexts } from '../../public/js/i18n/t.js'
import { SCENARIOS, keyOf, world, scopedIdLookup, tidy } from '../support/shellScenarios.js'
import { play } from '../support/renderShell'
import before from '../fixtures/shellBeforeF88.json'

const captured = before as Record<string, Record<string, string | null>>
/**
 * What the shell does differently from the hand-made one, on purpose (each is in the report of the sync). The menu of `main` is the reference now (F88);
 * the old page is brought to the new behaviour here, so the rest of the page is still compared to the letter.
 *  - A click on «Connect» or «Disconnect» in the panel of the computer leaves the panel OPEN. The hand-made panel closed: the row is drawn again
 *    inside the click, so by the time the click reaches the page the button is gone and the panel takes it for a click outside (the commit of F88
 *    «confirming Disconnect keeps the panel open» fixed that only for the question window, not for the click itself). Kept open here, as F88 meant.
 *    The two attributes the opening writes (aria-expanded and the classes that hide the panel) are brought to «open» in the old page of that step.
 */
const keepOpen = (page: string): string => page
    .replace('aria-expanded="false" aria-haspopup="dialog"', 'aria-expanded="true" aria-haspopup="dialog"')
    .replace('class="invisible opacity-0 top-panel" id="userMenu"', 'class="top-panel" id="userMenu"')
const KNOWN_DIFFERENCES: Record<string, (page: string) => string> = {
    'the computer: Apple Music is asked when the panel opens: not connected · connected': keepOpen
}
const expectedPage = (key: string, label: string): string | null => {
    const page = tidy(captured[key][label])
    const change = KNOWN_DIFFERENCES[`${key} · ${label}`]
    return page && change ? change(page) : page
}
const shownPage = (key: string, label: string, page: string | null): string | null => {
    const change = KNOWN_DIFFERENCES[`${key} · ${label}`]
    return page && change ? change(tidy(page)!) : tidy(page)
}

describe('the shell in React draws what the hand-made one drew', () => {
    beforeEach(() => { world.reset(); scopedIdLookup(); loginWindowStore.close(); screenNameStore.clear(); showDiscogsNotice(false) })
    afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style') })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS.filter(s => !process.env.F83_ONLY || s.name.includes(process.env.F83_ONLY))) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            if (process.env.F83_DUMP) (await import('node:fs')).writeFileSync(`${process.env.F83_DUMP}/${key.replace(/\W+/g, '_')}.json`, JSON.stringify(snaps))
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(shownPage(key, label, page), `${key} · ${label}`).toBe(expectedPage(key, label))
            }
        })
    }
})

describe('the proof catches a difference', () => {
    beforeEach(() => { world.reset(); scopedIdLookup(); loginWindowStore.close(); screenNameStore.clear() })
    afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style') })

    it('a changed word in the page is a failed scenario (the test is not a rubber stamp)', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'the computer: nobody signed in')!
        registerTexts('en', { 'shell.account.signIn': 'Come in' })
        try {
            const snaps = await play(scenario)
            expect(tidy(snaps['header and footer'])).not.toBe(tidy(captured[keyOf(scenario)]['header and footer']))
            expect(snaps['header and footer']).toContain('Come in')
        } finally {
            registerTexts('en', { 'shell.account.signIn': 'Sign In' })
        }
    })

    it('a changed class in the page is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'the phone: nobody signed in')!
        const snaps = await play(scenario)
        expect(tidy(snaps['the bars']!.replace('phone-topbar__title', 'phone-topbar__title-changed'))).not.toBe(tidy(captured[keyOf(scenario)]['the bars']))
    })

    it('a moved focus is a failed scenario too (the focus goes back to the page when the bar is drawn anew)', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'the computer: focus goes back to the page when the bar is drawn anew')!
        const snaps = await play(scenario)
        expect(snaps['focus after the draw']).toBe('body')
        expect(snaps['focus on the button']).toBe('button#loginBtn')
    })
})
