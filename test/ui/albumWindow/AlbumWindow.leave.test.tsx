/**
 * F83 wave 6b (a change on purpose, as wave 5b made for its own windows): a window opened from code that is not a component (the album window, the window to
 * edit an item, the window to add an album) goes off the page when the screen that opened it is left. The hand-made album window was put in `body` and stayed
 * over the next screen. The route of each screen says it in its `dispose` (`closeAllWindows`); this proves the layer and the two routes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../../support/inventoryStandIns.js')).wiringModule)
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => (await import('../../support/inventoryStandIns.js')).valuesModule)
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/inventoryStandIns.js')).loaderModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/inventoryStandIns.js')).toastModule)
vi.mock('../../../public/js/services/DialogService.js', async () => (await import('../../support/inventoryStandIns.js')).dialogModule)

import { act } from 'react'
import { openAlbumWindow } from '../../../public/js/ui/albumWindow/openAlbumWindow'
import { openInventoryEdit } from '../../../public/js/ui/inventoryItem/inventoryWindows'
import { closeAllWindows } from '../../../public/js/ui/windowLayer'
import { inventoryVisit } from '../../../public/js/screens/inventory/index'
import { ITEMS } from '../../support/inventoryStandIns.js'

const windows = () => document.querySelectorAll('.modal-overlay, #inventory-edit-modal')

afterEach(async () => {
    await act(async () => { closeAllWindows() })
    document.body.innerHTML = ''
})

describe('the windows when the screen is left', () => {
    it('closeAllWindows takes every window off the page, and the page is as it was', async () => {
        await act(async () => { await openAlbumWindow({ id: 'a', title: 'A', artist: 'B', tracks: [] }) })
        await act(async () => { await openInventoryEdit({ id: 'inv', title: 'A', artist: 'B' }, async () => { }) })
        expect(windows()).toHaveLength(2)

        await act(async () => { closeAllWindows() })

        expect(windows()).toHaveLength(0)
        expect([...document.body.children].filter(element => element.id !== 'globalProgress')).toHaveLength(0) // the bar of the app is no part of a window
    })

    it('the route of the inventory closes the windows in its dispose', async () => {
        const visit = inventoryVisit()
        await act(async () => { await openAlbumWindow(ITEMS()[0]) })
        expect(windows()).toHaveLength(1)

        await act(async () => { visit.dispose() })

        expect(windows()).toHaveLength(0)
    })

    it('a window closed by its own button is not closed again by the leave (nothing throws)', async () => {
        await act(async () => { await openInventoryEdit({ id: 'inv', title: 'A', artist: 'B' }, async () => { }) })
        await act(async () => { (document.querySelector('#inventory-edit-modal .btn-ghost') as HTMLElement).click() })
        expect(windows()).toHaveLength(0)

        await act(async () => { closeAllWindows() })
        expect(windows()).toHaveLength(0)
    })
})
