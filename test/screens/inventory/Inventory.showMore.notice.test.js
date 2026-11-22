/**
 * F83, wave 6a, the judge's recheck: with the Discogs values on, «Show 50 more» must not make Chromium's scroll anchoring jump to the end of the new
 * chunk. The hand-made screen rebuilt the notice under the list on every draw, so it never held an anchor; the React notice is keyed with the box of
 * the list, so it is new whenever the box is (same DOM, same classes as before). And in the list view of the computer «No value yet» is one text node
 * (the old HTML wrote one piece, and Chromium draws two pieces 1/64 px wider).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { valuesWith, valuesOff, reading } from '../../helpers/inventoryValuesStub.js'

const holder = vi.hoisted(() => ({ values: null }))
vi.mock('../../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: { updateAlbum: vi.fn(async () => 'id'), albumOfItem: vi.fn(async () => null) }, readSeriesOfThePerson: vi.fn(async () => []) }))
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', () => ({ inventoryValues: new Proxy({}, { get: (_, name) => holder.values[name] }) }))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }, toast: {} }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService: { confirm: vi.fn() } }))

import { openInventory, press } from '../../support/inventoryHost'
import { inventoryStore } from '../../../public/js/stores/inventory.js'

const many = (count) => Array.from({ length: count }, (_, i) => ({ id: `inv-${i}`, title: `Album ${i}`, artist: 'ABBA', format: 'cd', owned: true, albumData: {} }))

describe('«Show 50 more» with the Discogs values on, and the text of a list row', () => {
    let view
    beforeEach(() => { localStorage.clear() })
    afterEach(async () => { await view?.destroy(); inventoryStore.reset(); document.body.innerHTML = '' })

    for (const choice of [null, 'grid']) {
        it(`the notice under the ${choice ? 'gallery' : 'list'} is a new element after «Show 50 more», as the hand-made one was`, async () => {
            holder.values = valuesWith()
            view = await openInventory(many(120), { phone: true, choice })
            const before = document.querySelector('.inv-discogs-notice')
            expect(before).not.toBe(null)
            const box = document.querySelector('#inventory-grid-container')
            await press(document.querySelector('[data-phone-action="more-rows"]'))
            const after = document.querySelector('.inv-discogs-notice')
            expect(document.querySelector('#inventory-grid-container')).not.toBe(box)
            expect(after).not.toBe(before)
            expect(after.className).toBe('inv-discogs-notice')
            expect(after.previousElementSibling).toBe(document.querySelector('#inventory-grid-container'))
        })
    }

    it('«No value yet» in a list row of the computer is one text node, then the amount', async () => {
        holder.values = valuesOff()
        view = await openInventory(many(3), { phone: false, choice: 'list' })
        const value = document.querySelector('[data-role="value"]')
        const nodes = [...value.childNodes]
        expect(nodes[0].nodeType).toBe(Node.TEXT_NODE)
        expect(nodes[0].textContent.endsWith(' ')).toBe(true)
        expect(nodes[1].nodeName).toBe('STRONG')
    })

    it('the Discogs line of a list row ends in one text node that carries the space before the amount', async () => {
        holder.values = valuesWith({ readings: new Map([['inv-0', reading()]]) })
        view = await openInventory(many(2), { phone: false, choice: 'list' })
        const value = document.querySelector('[data-album-id="inv-0"] [data-role="value"], [data-role="value"]')
        const nodes = [...value.childNodes]
        const before = nodes[nodes.length - 2]
        expect(nodes[nodes.length - 1].nodeName).toBe('STRONG')
        expect(before.nodeType).toBe(Node.TEXT_NODE)
        expect(before.textContent.endsWith(' ')).toBe(true)
        expect(before.textContent.trim().length).toBeGreaterThan(0)
    })

    it('a Discogs line with no link to the edition is one text node, in the row and in the card (the old HTML wrote one)', async () => {
        const noLink = { ...reading(), release: { id: 5, title: 'x', url: null } }
        holder.values = valuesWith({ readings: new Map([['inv-0', noLink]]) })
        view = await openInventory(many(1), { phone: false, choice: 'list' })
        const row = [...document.querySelector('[data-role="value"]').childNodes]
        expect(row.map(node => node.nodeName)).toEqual(['#text', 'STRONG'])
        expect(row[0].textContent).toMatch(/^CD · Discogs · suggested · .* $/)
        await view.destroy()
        view = await openInventory(many(1), { phone: false, choice: 'grid' })
        const source = document.querySelector('[data-role="origin-source"]')
        expect(source.childNodes).toHaveLength(1)
        expect(source.textContent).toMatch(/^Discogs · /)
    })
})
