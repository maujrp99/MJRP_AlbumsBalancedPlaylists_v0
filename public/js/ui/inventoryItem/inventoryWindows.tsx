/**
 * The two windows the inventory screen opens (F83 wave 6b): the album window with the value of the item and where to buy it above its tracks, and the
 * window to edit an item. Each is asked for by `import()` when pressed (screens/inventory/inventoryActions.ts), so neither is in the first download
 * of the screen; the album window itself (ui/albumWindow/) is a file of its own that the albums screen asks for too. They live in ui/ because a screen
 * is loaded only at the route (test/architecture/lazyOnlyAtTheRoute.test.js), and a window is loaded when its button is pressed.
 */
import { isPhone } from '../../utils/isPhone.js'
import { createTicker, ValueAndBuy, type ValueHost } from './ValueSection'

type Item = Record<string, any>

/** What the screen holds of the window of the album it opened: it says «the value changed» and the window draws the section again. */
export interface InventoryViewHandle {
    redrawValue: () => void
    close: () => void
}

/**
 * The window of the album of an item: what it keeps, the album of now from the album load, and the value section the controller answers for.
 * @param options.loadAlbum - (signal) => Promise<album|null>: the album as the album load has it now
 * @param options.value - the host of the «Estimated value» section: { view, onWrite, onForget, onRead }
 */
export async function openInventoryView(item: Item, options: { loadAlbum: (signal: AbortSignal) => Promise<unknown>; value: ValueHost }): Promise<InventoryViewHandle> {
    const { openAlbumWindow } = await import('../albumWindow/openAlbumWindow')
    const ticker = createTicker()
    const above = <ValueAndBuy item={item} host={options.value} phone={isPhone()} ticker={ticker} />
    const handle = await openAlbumWindow(item, { loadAlbum: options.loadAlbum, above })
    return { redrawValue: ticker.bump, close: handle.close }
}

/** The window to edit an item of the inventory; `onSave(id, updates)` is called when the person saves. */
export async function openInventoryEdit(item: Item, onSave: (id: string, updates: object) => Promise<void> | void): Promise<void> {
    const [{ EditWindow }, { showWindow }] = await Promise.all([import('./EditWindow'), import('../windowLayer')])
    showWindow(close => <EditWindow item={item} onSave={onSave} close={close} />)
}
