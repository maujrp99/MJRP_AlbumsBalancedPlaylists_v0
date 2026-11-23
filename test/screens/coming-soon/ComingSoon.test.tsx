/**
 * F83 TASK-10 (REQ-01, REQ-02, REQ-08, REQ-10): the canary, the «Coming soon» screen (/artists, /genres, /tracks) in React.
 *
 * The proof that it shows the same: for each of the three addresses, what the new screen draws in #app equals what the old
 * view drew (its template is kept in test/fixtures/comingSoonBeforeF83.js), element by element, class by class, attribute by
 * attribute. The one difference is the white space between tags and around the texts, which the old template had from its
 * indentation and which a browser does not draw; both sides are compared with it collapsed. The texts come from the
 * dictionary, in English and in Portuguese.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { ComingSoon, type ComingSoonKind } from '../../../public/js/screens/coming-soon/ComingSoon'
import { comingSoonView } from '../../../public/js/screens/coming-soon/index'
import { renderScreen, itLeavesNoListeners } from '../../support/renderScreen'
import { legacyComingSoonHtml } from '../../fixtures/comingSoonBeforeF83.js'
import { setLocale, PREVIEW_KEY, localeListenerCount } from '../../../public/js/i18n/t.js'
import { bridgeListenerCount } from '../../../public/js/react-bridge/listeners'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'
import fs from 'node:fs'

const KINDS: ComingSoonKind[] = ['artists', 'genres', 'tracks']
type Props = { kind: ComingSoonKind }
const open = (kind: ComingSoonKind) => renderScreen<Props>(ComingSoon, { kind })

/** What a browser draws from a piece of HTML: the same markup with the white space between tags and in texts collapsed. */
function drawn(html: string): string {
    const host = document.createElement('div')
    host.innerHTML = html
    return host.innerHTML.replace(/>\s+</g, '><').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/ </g, '<').trim()
}

describe('the canary draws what the old screen drew', () => {
    afterEach(() => { window.history.replaceState({}, '', '/') })

    for (const kind of KINDS) {
        it(`/${kind}: the same elements, classes and attributes in #app`, async () => {
            const rendered = await open(kind)
            expect(drawn(rendered.app.innerHTML)).toBe(drawn(legacyComingSoonHtml(`/${kind}`)))
            await rendered.leave()
        })
    }

    it('says what the old one said: the title, the description, the badge, the message and the way back', async () => {
        const rendered = await open('genres')
        expect(rendered.app.querySelector('h1')!.textContent).toBe('Genre Series')
        expect(rendered.app.querySelector('p.text-muted.text-lg')!.textContent).toBe('Categorize music by genres')
        expect(rendered.app.querySelector('span.text-lg.font-semibold')!.textContent).toBe('Coming Soon')
        expect(rendered.app.textContent).toContain("We're working hard to bring you this feature. Stay tuned!")
        const back = rendered.app.querySelector('a.btn.btn-primary') as HTMLAnchorElement
        expect(back.getAttribute('href')).toBe('/albums')
        expect(back.hasAttribute('data-link')).toBe(true)
        expect(back.textContent!.trim()).toBe('Back to Albums')
        await rendered.leave()
    })

    it('the route gives a view the router can mount, with the name of the screen for the measurement of use', () => {
        const view = comingSoonView('artists')
        expect(typeof view.render).toBe('function')
        expect(typeof view.mount).toBe('function')
        expect(typeof view.destroy).toBe('function')
    })
})

describe('the texts come from the dictionary', () => {
    beforeEach(() => { window.localStorage.setItem(PREVIEW_KEY, 'pt') })
    afterEach(async () => { window.localStorage.removeItem(PREVIEW_KEY); await setLocale('en') })

    it('no text is written in the screen: the counter of loose texts finds none', () => {
        const source = fs.readFileSync('public/js/screens/coming-soon/ComingSoon.tsx', 'utf8')
        expect(countTsx(source, 'ComingSoon.tsx')).toEqual([])
    })

    it('in Portuguese the same screen speaks Portuguese, and draws again when the language changes', async () => {
        const rendered = await open('tracks')
        expect(rendered.app.querySelector('h1')!.textContent).toBe('Track Series')

        await act(async () => { await setLocale('pt') })

        expect(rendered.app.querySelector('h1')!.textContent).toBe('Séries de faixas')
        expect(rendered.app.querySelector('span.text-lg.font-semibold')!.textContent).toBe('Em breve')
        expect(rendered.app.querySelector('a.btn')!.textContent!.trim()).toBe('Voltar para os álbuns')
        expect(rendered.app.querySelector('a.btn')!.getAttribute('href')).toBe('/albums') // the address is not translated
        await rendered.leave()
    })

    it('the screen that listened to the language lets go of it when it is left', async () => {
        const base = localeListenerCount()
        const baseBridge = bridgeListenerCount()
        const rendered = await open('artists')
        expect(localeListenerCount()).toBe(base + 1)
        expect(bridgeListenerCount()).toBe(baseBridge + 1)
        await rendered.leave()
        expect(localeListenerCount()).toBe(base)
        expect(bridgeListenerCount()).toBe(baseBridge)
    })
})

// The test every screen in React has (everyScreenHasTheLeaveTest): five visits leave nothing of the screen listening.
itLeavesNoListeners<Props>('ComingSoon', ComingSoon, { kind: 'artists' })
