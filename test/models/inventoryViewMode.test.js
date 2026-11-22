/**
 * F89 (REQ-01, REQ-03): which view of the inventory the phone draws. The list is what a person who
 * never chose sees; the gallery is drawn only for someone who chose it (the choice is the one the
 * computer keeps, `mjrp_inventory_view_mode`, and the computer's own default stays «grid»).
 */
import { describe, it, expect } from 'vitest'
import { VIEW_STORAGE_KEY, ViewMode, isViewMode, viewForPhone } from '../../public/js/models/inventoryViewMode.js'

describe('the view of the inventory on the phone (models/inventoryViewMode.js)', () => {
    it('keeps the choice where the computer keeps it', () => {
        expect(VIEW_STORAGE_KEY).toBe('mjrp_inventory_view_mode')
    })

    it('someone who never chose sees the list, whatever the computer\'s default is', () => {
        expect(viewForPhone({ viewMode: 'grid', viewChosen: false })).toBe(ViewMode.LIST)
        expect(viewForPhone({ viewMode: 'list', viewChosen: false })).toBe(ViewMode.LIST)
        expect(viewForPhone({})).toBe(ViewMode.LIST)
        expect(viewForPhone(null)).toBe(ViewMode.LIST)
    })

    it('someone who chose the gallery sees it; someone who chose the list sees the list', () => {
        expect(viewForPhone({ viewMode: 'grid', viewChosen: true })).toBe(ViewMode.GRID)
        expect(viewForPhone({ viewMode: 'list', viewChosen: true })).toBe(ViewMode.LIST)
    })

    it('a value that is not a view is not a choice', () => {
        expect(viewForPhone({ viewMode: 'carousel', viewChosen: true })).toBe(ViewMode.LIST)
        expect(['grid', 'list'].map(isViewMode)).toEqual([true, true])
        expect(['', 'GRID', null, undefined, 'compact'].map(isViewMode)).toEqual([false, false, false, false, false])
    })
})
