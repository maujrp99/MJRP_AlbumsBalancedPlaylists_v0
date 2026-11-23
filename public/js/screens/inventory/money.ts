/**
 * The amount of an item as the screen writes it («≈ $12.40»), or a dash when the item has no value: the one place that asks the model for the money
 * (models/inventoryValue.js `moneyOf`, which rounds to the cent before it formats), so no component formats a number itself.
 */
import { moneyOf } from '../../models/inventoryValue.js'
import type { ItemValue, Money, Priced } from './types'

export const NO_VALUE = '—'

export function amountText(value: ItemValue, money: Money): string {
    return value.origin ? `≈ ${moneyOf(value as Priced, money)}` : NO_VALUE
}
