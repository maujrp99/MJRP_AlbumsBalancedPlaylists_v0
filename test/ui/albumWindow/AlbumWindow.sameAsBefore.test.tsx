/**
 * F83 wave 6b (REQ-02, REQ-05; TASK-23c): the album window, the window to edit an inventory item and the window to add an album to the inventory, in
 * React, draw and do what the hand-made ones did.
 *
 * The proof: for every scenario of test/support/albumWindowScenarios.js (the album window opened by the albums screen with its sources and by the inventory
 * with its load and its value section; the header of each kind of item; the table by every column in both directions; the phone with its bar, its blurred
 * cover, its tabs and its folded value; every body of the value section and every action in it; closing by the cross, «Close», the backdrop and Escape;
 * the window to edit with an item from a series and with one with a format, saving, a failure, cancelling; the window to add with its defaults, a
 * currency changed, a duplicate, a failure, the button pressed twice) the page after each step equals what the hand-made window drew at the same
 * step, the focus is where it left it, and every call the window made to what is outside (the sources, the album load, the host of the value section, the
 * inventory service, the notices) is the same, in the same order. The old pages are kept in test/fixtures/albumWindowBeforeF83.json, written by the
 * hand-made windows before they were deleted (reports/evidence/F83/wave-6b/capture-before.test.js), compared element by element, attribute by attribute,
 * as in waves 1 to 6a.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../../support/albumWindowStandIns.js')).wiringModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/albumWindowStandIns.js')).toastModule)

import { act } from 'react'
import { openAlbumWindow } from '../../../public/js/ui/albumWindow/openAlbumWindow'
import { openInventoryEdit, openInventoryView } from '../../../public/js/ui/inventoryItem/inventoryWindows'
import { openAddWindow } from '../../../public/js/ui/inventoryItem/AddWindow'
import { inventoryService } from '../../support/albumWindowStandIns.js'
import { closeAllWindows } from '../../../public/js/ui/windowLayer'
import { registerTexts } from '../../../public/js/i18n/t.js'
import { SCENARIOS, keyOf, prepare, harness } from '../../support/albumWindowScenarios.js'
import before from '../../fixtures/albumWindowBeforeF83.json'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const captured = before as Record<string, Record<string, string | null>>

type Scenario = (typeof SCENARIOS)[number]

/** Plays a scenario on the React windows and gives what it wrote down. */
export async function play(scenario: Scenario): Promise<Record<string, string | null>> {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const phone = prepare(scenario)
    const open = {
        view: (input: Record<string, unknown>, options: Record<string, any>) => (options.value ? openInventoryView(input, options as never) : openAlbumWindow(input, options)),
        edit: (item: Record<string, unknown>, onSave: (id: string, updates: object) => Promise<void>) => openInventoryEdit(item, onSave),
        add: async (album: Record<string, unknown>, onSuccess?: () => void) => openAddWindow(album, { add: (added, format, options) => inventoryService.addAlbum(added, format, options), onSuccess })
    }
    const snaps: Record<string, string | null> = {}
    const h = harness({ open, act: (work: () => Promise<void>) => act(work), phone, snaps })
    await scenario.run(h)
    return snaps
}

const reset = async (): Promise<void> => {
    await act(async () => { closeAllWindows() })
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.restoreAllMocks()
}

describe('the windows in React draw what the hand-made ones drew', () => {
    afterEach(reset)

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS.filter(s => !process.env.F83_ONLY || s.name.startsWith(process.env.F83_ONLY))) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            if (process.env.F83_DUMP) (await import('node:fs')).writeFileSync(`${process.env.F83_DUMP}/${key.replace(/\W+/g, '_').slice(0, 90)}.json`, JSON.stringify(snaps))
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})

describe('the proof catches a difference', () => {
    afterEach(reset)

    const find = (start: string) => SCENARIOS.find(s => s.name.startsWith(start))!

    it('a changed word in the window is a failed scenario (the test is not a rubber stamp)', async () => {
        const scenario = find('the header of an owned item in CD')
        registerTexts('en', { 'ui.albumWindow.paid': 'Paidd:' })
        try {
            const snaps = await play(scenario)
            expect(snaps.open).not.toBe(captured[keyOf(scenario)].open)
            expect(snaps.open).toContain('Paidd:')
        } finally {
            registerTexts('en', { 'ui.albumWindow.paid': 'Paid:' })
        }
    })

    it('a changed word in the window to edit is a failed scenario too', async () => {
        const scenario = find('edit: an item that came from a series')
        registerTexts('en', { 'inventory.form.notSet': 'Not sett' })
        try {
            const snaps = await play(scenario)
            expect(snaps.open).not.toBe(captured[keyOf(scenario)].open)
        } finally {
            registerTexts('en', { 'inventory.form.notSet': 'Not set' })
        }
    })

    it('a changed class is a failed scenario too', async () => {
        const scenario = find('the table: every column')
        const snaps = await play(scenario)
        expect(snaps['as it opens']!.replace('tracks-table-root', 'tracks-table-roott')).not.toBe(captured[keyOf(scenario)]['as it opens'])
    })

    it('a call to the outside that changed is a failed scenario too', async () => {
        const scenario = find('add: the defaults')
        const snaps = await play(scenario)
        expect(snaps['calls · added']!.replace('service.addAlbum', 'service.addAlbumm')).not.toBe(captured[keyOf(scenario)]['calls · added'])
    })
})
