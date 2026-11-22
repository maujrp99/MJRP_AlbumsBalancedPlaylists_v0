/**
 * F83 wave 6a (REQ-02, REQ-05; TASK-25): the inventory screen in React draws what the hand-made one drew.
 *
 * The proof: for every scenario of test/support/inventoryScenarios.js (the computer: empty, loading, the grid and the list, every origin of a value,
 * the rates that did not come, a currency chosen, a run of «Update values» under way and stopped, the counts of the header, the search, the format, the
 * ten orders, the switch of the view, «Update ratings» and «Add the albums of my series» with their questions, delete, edit, the window of the album, a
 * link of a card, the status on a card, the notice of Discogs, the inventory changed under the screen, leaving and coming back; the phone: the list and
 * the gallery, the ghosts, the two empty states, the bar, «Show 50 more», the six sheets and each choice in them, a run with «Stop», turning into a
 * computer and back, the window opened from a row and from a tile) the page after each step equals what the old screen drew at the same step (the
 * `#app` and the sheet over it), the focus is where the old screen left it, and every call the screen made to what is outside (the service, the value
 * service, the dialog, the toast, the two hand-made windows, the album load) is the same, in the same order. The old pages are kept in
 * test/fixtures/inventoryBeforeF83.json, written by the hand-made screen before it was deleted (reports/evidence/F83/wave-6a/capture-before.test.js),
 * compared element by element, attribute by attribute, as in waves 1 to 5.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../../support/inventoryStandIns.js')).wiringModule)
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => (await import('../../support/inventoryStandIns.js')).valuesModule)
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/inventoryStandIns.js')).loaderModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/inventoryStandIns.js')).toastModule)
vi.mock('../../../public/js/services/DialogService.js', async () => (await import('../../support/inventoryStandIns.js')).dialogModule)
vi.mock('../../../public/js/components/ViewAlbumModal.js', async () => (await import('../../support/inventoryStandIns.js')).albumWindowModule)
vi.mock('../../../public/js/components/InventoryEditModal.js', async () => (await import('../../support/inventoryStandIns.js')).editWindowModule)

import { act } from 'react'
import { inventoryParts } from '../../../public/js/screens/inventory/index'
import { registerTexts } from '../../../public/js/i18n/t.js'
import { SCENARIOS, keyOf, prepare, harness } from '../../support/inventoryScenarios.js'
import before from '../../fixtures/inventoryBeforeF83.json'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const captured = before as Record<string, Record<string, string | null>>

type Scenario = (typeof SCENARIOS)[number]

/** Plays a scenario on the new screen and gives what it wrote down. */
export async function play(scenario: Scenario): Promise<Record<string, string | null>> {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const phone = prepare(scenario)
    let parts: ReturnType<typeof inventoryParts> | null = null
    const session = {
        controller: () => parts!.controller,
        async enter() {
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            parts = inventoryParts()
            const view = parts.view
            await act(async () => {
                await view.render({})
                view.mount({})
            })
        },
        async leave() {
            await act(async () => { parts!.view.destroy() })
            document.getElementById('app')?.remove()
        }
    }
    const snaps: Record<string, string | null> = {}
    const h = harness({ session, act: (work: () => Promise<void>) => act(work), phone, snaps })
    await session.enter()
    await h.settle()
    await scenario.run(h)
    if (document.getElementById('app')) await session.leave()
    return snaps
}

describe('the inventory screen in React draws what the hand-made one drew', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS.filter(s => !process.env.F83_ONLY || s.name === process.env.F83_ONLY)) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            if (process.env.F83_DUMP) (await import('node:fs')).writeFileSync(`${process.env.F83_DUMP}/${key.replace(/\W+/g, '_')}.json`, JSON.stringify(snaps))
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})

describe('the proof catches a difference', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('a changed word in the page is a failed scenario (the test is not a rubber stamp)', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'grid, values off, three statuses')!
        registerTexts('en', { 'inventory.title': 'My Collectionn' })
        try {
            const snaps = await play(scenario)
            expect(snaps['the cards']).not.toBe(captured[keyOf(scenario)]['the cards'])
            expect(snaps['the cards']).toContain('My Collectionn')
        } finally {
            registerTexts('en', { 'inventory.title': 'My Collection' })
        }
    })

    it('a changed class in the page is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'grid, values off, three statuses')!
        const snaps = await play(scenario)
        expect(snaps['the cards']!.replace('inventory-card-wrapper', 'inventory-card-wrapperr')).not.toBe(captured[keyOf(scenario)]['the cards'])
    })

    it('a focus left on the wrong control is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'the search typed, found and not found')!
        const snaps = await play(scenario)
        expect(snaps['focus · typing']!.replace('inventorySearch', 'inventorySort')).not.toBe(captured[keyOf(scenario)]['focus · typing'])
    })

    it('a call to the outside that changed is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'delete: the question, yes; and a failure')!
        const snaps = await play(scenario)
        expect(snaps['calls · removed']!.replace('service.removeAlbum', 'service.removeAlbumm')).not.toBe(captured[keyOf(scenario)]['calls · removed'])
    })
})
