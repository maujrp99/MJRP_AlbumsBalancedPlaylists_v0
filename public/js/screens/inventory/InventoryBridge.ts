/**
 * InventoryBridge - what the inventory controller draws into (F83 wave 6a). The controller (controllers/InventoryController.js, hand-written, one per
 * visit) talks to a «view» with `render`, `showValues`, `showSeriesAdd` and `showRatings`; this is that view for the screen in React. It draws
 * nothing: it counts. `drawn` goes up at each `render` (the hand-made screen drew everything anew then: the focus went back to the page), `patched`
 * at each of the other three (the hand-made screen wrote the button, the totals, one card in place: the rest was left as it was). The screen reads the
 * sum (`useSyncExternalStore`) to draw again, and reads the rest from the controller at the moment it draws.
 *
 * It also keeps what lived with the hand-made view: how many rows the phone shows (and the key of filters and order that sets that number back to
 * the first chunk), the window of the album that is open (to draw its value again), and which card was changed in place.
 */
import { PHONE_CHUNK, shownFor } from '../../models/inventoryJump.js'
import { choiceOf } from '../../models/inventorySort.js'
import type { InventoryState } from './types'

export interface OpenWindow {
    redrawValue: () => void
}

export class InventoryBridge {
    private listeners = new Set<() => void>()
    private patched = 0
    private gridDraws = 0
    private valuesDraws = 0
    private left = false
    /** How many times each card was changed in place: it is a new card (`key`) each time, as the hand-made one was swapped. */
    private readonly cardDraws = new Map<string, number>()
    drawn = 0
    phoneShown = PHONE_CHUNK
    private phoneKey = ''
    /** The window of the album that is open, to draw its value again when a run moves. */
    openWindow: OpenWindow | null = null

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    /** How many notices the controller has given, of every kind: the screen draws again each time. */
    getVersion = (): number => this.drawn + this.patched + this.gridDraws

    private tell(): void {
        this.listeners.forEach(listener => listener())
    }

    // ---- what the controller calls ------------------------------------------------------------------

    render(): void {
        if (this.left) return
        this.drawn += 1
        this.tell()
    }

    showValues(_state: InventoryState, itemId: string | null = null): void {
        if (this.left) return
        this.patched += 1
        this.valuesDraws += 1
        if (itemId) this.cardDraws.set(itemId, (this.cardDraws.get(itemId) ?? 0) + 1)
        this.openWindow?.redrawValue()
        this.tell()
    }

    showSeriesAdd(): void {
        if (this.left) return
        this.patched += 1
        this.tell()
    }

    showRatings(): void {
        if (this.left) return
        this.patched += 1
        this.tell()
    }

    // ---- what the screen asks -----------------------------------------------------------------------

    /** The key of a card: it changes when the card was changed in place. */
    cardKey(itemId: string): string {
        return `${itemId}.${this.cardDraws.get(itemId) ?? 0}`
    }

    /** The key of the totals and the notices: the hand-made screen wrote them anew at a full draw and at each step of a run of values. */
    valuesKey(): string {
        return `${this.drawn}.${this.valuesDraws}`
    }

    /** The key of the list: all of it is drawn again at a full draw and when a chunk is added to the phone's. */
    gridKey(): string {
        return `${this.drawn}.${this.gridDraws}`
    }

    /**
     * How many rows are drawn: the first chunk again when the search, a filter or the order changed; as many as before when the store changed
     * (a status changed: the list stays where it was, F71).
     */
    keepPhoneShown(state: InventoryState): number {
        const key = JSON.stringify([state.filters, choiceOf(state.sorting)])
        if (key === this.phoneKey && this.phoneShown) return this.phoneShown
        this.phoneKey = key
        this.phoneShown = PHONE_CHUNK
        return this.phoneShown
    }

    /** The key of filters and order the rows were last drawn for (the sheet of filters compares it to know that the list changed). */
    currentKey(): string {
        return this.phoneKey
    }

    /** «Show 50 more»: the next chunk. */
    showMoreRows(): void {
        this.phoneShown += PHONE_CHUNK
        this.gridDraws += 1
        this.tell()
    }

    /** The chunks up to a row are drawn (the jump of the phone). Returns whether they changed. */
    showUpTo(index: number): boolean {
        const shown = shownFor(index, this.phoneShown)
        if (shown === this.phoneShown) return false
        this.phoneShown = shown
        this.gridDraws += 1
        this.tell()
        return true
    }

    /** The screen is left: nothing more is drawn here. */
    dispose(): void {
        this.left = true
        this.openWindow = null
        this.listeners.clear()
    }
}
