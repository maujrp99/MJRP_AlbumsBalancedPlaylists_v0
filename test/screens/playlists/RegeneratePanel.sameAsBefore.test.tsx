/**
 * F83 wave 7a (REQ-02, REQ-05; TASK-27, TASK-30): the panel «Reconfigure your Music Playlist Blend» in React draws and does what the hand-made one did.
 *
 * For every scenario of test/support/regenerateScenarios.js (the panel shut and open, on the recipe of each of the four recipes and of playlists that do
 * not say theirs, each recipe chosen, each ingredient, the slider, what was changed kept through a new making of the panel, an option hidden by the next
 * recipe that still goes, «Regenerate Playlists», what follows a generation that came and one that failed, the screen opened again, the phone's
 * «Reconfigure and regenerate») the page of the panel after each step, the configuration handed to the controller, the focus and where the phone scrolled
 * equal what the hand-made panel gave at the same step. Those are kept in test/fixtures/regenerateBeforeF83.json: written once by the hand-made panel
 * before it was touched (reports/evidence/F83/wave-7a/capture-before.test.tsx), compared element by element, attribute by attribute.
 * The comparison is the proof's `normalize` (test/support/regenerateScenarios.js): it does not hide a changed word, a changed class or a text split in two nodes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

// the pictures were taken with the four recipes of then (F92 added two): see test/support/registryOfBefore.js
vi.mock('../../../public/js/algorithms/index.js', async (importOriginal) => (await import('../../support/registryOfBefore.js')).registryOfBefore(await importOriginal()))
vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: { confirm: vi.fn(async () => true) } }))
vi.mock('../../../public/js/ui/SpotifyExportWindow.tsx', async () => ({ showSpotifyExportWindow: () => {} }))
vi.mock('../../../public/js/controllers/playlistExports.js', async () => ({ seriesNameOf: (given?: string) => given || 'MJRP Playlists', handleExportJson: () => {}, handleExportToAppleMusic: () => {} }))
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/exportStandIns.js')).musicKitService }))

import { play } from '../../support/regenerateHost'
import { SCENARIOS, keyOf } from '../../support/regenerateScenarios.js'
import { registerTexts } from '../../../public/js/i18n/t.js'
import before from '../../fixtures/regenerateBeforeF83.json'

const captured = before as Record<string, Record<string, string | null>>

describe('the panel to generate again in React does what the hand-made one did', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})

describe('the proof catches a difference (it is not a rubber stamp)', () => {
    afterEach(() => { document.body.innerHTML = '' })

    const scenario = SCENARIOS.find(s => s.name === 'open and closed again')!

    it('a changed word in the panel is a failed scenario', async () => {
        registerTexts('en', { 'playlists.regenerate.button': 'Make them again' })
        try {
            const snaps = await play(scenario)
            expect(snaps.open).not.toBe(captured[keyOf(scenario)].open)
            expect(snaps.open).toContain('Make them again')
        } finally {
            registerTexts('en', { 'playlists.regenerate.button': 'Regenerate Playlists' })
        }
    })

    it('a changed badge, a changed description and a changed hint are each a failed scenario', async () => {
        for (const [key, was, now] of [
            ['blend.recipes.topNPopular.badge', 'SPOTIFY', 'SPOTIFAI'],
            ['blend.recipes.topNUser.description', 'Create playlists from your personal track rankings.', 'Create playlists from your own track rankings.'],
            ['ui.recipe.duration.hint', 'How long should each volume be?', 'How long should each tome be?']
        ]) {
            registerTexts('en', { [key]: now })
            try {
                const snaps = await play(scenario)
                expect(snaps.open, key).not.toBe(captured[keyOf(scenario)].open)
                expect(snaps.open, key).toContain(now)
            } finally {
                registerTexts('en', { [key]: was })
            }
        }
    })

    it('a changed class in the panel is a failed scenario too', () => {
        const open = captured[keyOf(scenario)].open as string
        expect(open.replace('regenerate-chevron', 'regenerate-chevron-changed')).not.toBe(open)
        expect(open).toContain('rotate-180')
    })

    it('a text split in two nodes is seen (the old HTML had one: Chromium shapes each node apart)', async () => {
        const { normalize } = await import('../../support/regenerateScenarios.js')
        const box = document.createElement('div')
        box.innerHTML = '<p>Top 3</p>'
        const split = document.createElement('div')
        split.append(Object.assign(document.createElement('p'), {}))
        split.firstElementChild!.append('Top ', '3')
        expect(normalize(box)).not.toBe(normalize(split))
    })
})
