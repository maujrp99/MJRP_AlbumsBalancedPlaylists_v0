/**
 * inventoryViewMode - which view of the inventory is drawn (F75 on the computer, F89 on the phone).
 *
 * The computer draws a grid of cards or a list and keeps the person's choice in
 * `mjrp_inventory_view_mode`; with no choice it draws the grid. The phone keeps the SAME choice
 * (the albums screen does the same with `albumsViewMode`), but a person who never chose sees the
 * list, which is what the phone had before the gallery existed. Pure: values in, a value out.
 */

/** Where the choice is kept: the key the computer has always used. */
export const VIEW_STORAGE_KEY = 'mjrp_inventory_view_mode'

/** The two views, as they are kept: «grid» is the gallery of covers. */
export const ViewMode = Object.freeze({ GRID: 'grid', LIST: 'list' })

/** Is this one of the two views (a stored value may be anything)? */
export const isViewMode = (value) => value === ViewMode.GRID || value === ViewMode.LIST

/**
 * The view the phone draws.
 * @param {{ viewMode?: string, viewChosen?: boolean }} [state] - `viewChosen`: the person chose one
 * @returns {string} ViewMode.GRID only for someone who chose it; otherwise ViewMode.LIST
 */
export function viewForPhone(state) {
    return state?.viewChosen === true && state.viewMode === ViewMode.GRID ? ViewMode.GRID : ViewMode.LIST
}
