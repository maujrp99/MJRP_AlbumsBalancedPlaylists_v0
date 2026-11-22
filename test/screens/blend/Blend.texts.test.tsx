/**
 * F83 wave 7b (REQ-08): the texts of the Blend screen come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the screen (the counter of loose texts of the migration board finds none); that every `blend.*` key of
 * the screen has both languages, with the same placeholders; that the English is what the hand-made screen said (the words of the old page are the ones of the
 * file of the old pages); that in Portuguese the screen speaks Portuguese and draws again when the language changes. What it does not prove: that the Portuguese
 * is right: those texts are the agent's proposal, and wait for the owner.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { Blend } from '../../../public/js/screens/blend/Blend'
import { BlendVisit } from '../../../public/js/screens/blend/blendVisit'
import { setLocale, t, PREVIEW_KEY } from '../../../public/js/i18n/t.js'
import { en } from '../../../public/js/i18n/en/index.js'
import { pt } from '../../../public/js/i18n/pt/index.js'
import { renderScreen } from '../../support/renderScreen'
import { asPhone } from '../../support/playlistsScenarios.js'
import { reset } from '../../support/blendStandIns.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'

const FILES = [
    'public/js/screens/blend/Blend.tsx',
    'public/js/screens/blend/SeriesStep.tsx',
    'public/js/screens/blend/phone/PhoneStep.tsx',
    'public/js/screens/blend/blendVisit.ts'
]

const SCREEN_KEYS = (dictionary: Record<string, string>) => Object.keys(dictionary).filter(key => key.startsWith('blend.') && !key.startsWith('blend.recipes.')).sort()
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

describe('no text is written in the files of the screen', () => {
    for (const file of FILES) {
        it(`${file}: the counter of loose texts finds none`, () => {
            expect(countTsx(fs.readFileSync(file, 'utf8'), file)).toEqual([])
        })
    }
})

describe('every key of the screen has its words in both languages', () => {
    it('the same keys in en and pt, with the same placeholders', () => {
        const english = en as Record<string, string>
        const portuguese = pt as Record<string, string>
        expect(SCREEN_KEYS(english).length).toBeGreaterThan(40)
        expect(SCREEN_KEYS(portuguese)).toEqual(SCREEN_KEYS(english))
        for (const key of SCREEN_KEYS(english)) expect(placeholders(portuguese[key]), key).toEqual(placeholders(english[key]))
    })

    it('the English is what the hand-made screen said', () => {
        expect([t('blend.title'), t('blend.motto'), t('blend.step1.title'), t('blend.step2.locked'), t('blend.step4.locked'), t('blend.entity.label'), t('blend.generate.busy'), t('blend.bar.busy')])
            .toEqual(['The Blending Menu', '"Your Music, Your Recipe"', 'Choose Your Mix', 'Complete Step 1 to unlock', 'Complete previous steps to unlock', 'Blend your Music by', 'Blending...', 'Blending…'])
        expect(t('blend.summary.settings', { duration: 60, mode: t('blend.mode.auto') })).toBe('(60 min, auto mode)')
    })
})

describe('the screen in Portuguese', () => {
    beforeEach(() => { reset({ series: [{ id: 's1', name: 'Floyd', albumQueries: [] }] }); asPhone(false); vi.spyOn(console, 'log').mockImplementation(() => {}) })
    afterEach(async () => { await setLocale('en'); document.body.innerHTML = ''; vi.restoreAllMocks(); window.localStorage.removeItem(PREVIEW_KEY) })

    it('speaks Portuguese, and draws again when the language changes', async () => {
        const visit = new BlendVisit()
        const screen = await renderScreen(Blend, { visit }, { screen: 'blend', view: { prepare: async () => { visit.start() }, dispose: () => visit.dispose() } })
        expect(screen.app.textContent).toContain('The Blending Menu')
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        await screen.act(async () => { await setLocale('pt') })
        expect(screen.app.textContent).toContain('O Menu de Mistura')
        expect(screen.app.textContent).not.toContain('The Blending Menu')
        await screen.leave()
    })
})
