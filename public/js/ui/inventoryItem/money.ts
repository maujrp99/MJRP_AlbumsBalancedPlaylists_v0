/**
 * The money of the album window of an inventory item (F83 wave 6b): the one place of these pieces that asks the model for it (models/inventoryValue.js
 * `moneyOf`, which converts and rounds to the cent BEFORE it formats), so no component formats a number itself.
 */
import { moneyOf } from '../../models/inventoryValue.js'

/** The money of the screen: the currency it shows, and how much of each one USD buys (null when the rates did not come). */
export interface Money {
    currency: string
    rates: Record<string, number> | null
}

/** An amount in a currency as the screen writes it («$12.40»): in the currency the screen shows, or in its own when no rate converts it. */
export function moneyText(value: { amount?: number | null; currency?: string }, money: Money): string {
    return moneyOf({ amount: value.amount as number, currency: value.currency as string }, money)
}
