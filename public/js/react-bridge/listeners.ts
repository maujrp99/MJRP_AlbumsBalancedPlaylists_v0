/**
 * The count of what the screens in React listen to (F83, proposal § 11): every subscription of the bridge's hooks (a store,
 * the phone, the language) goes through `countListener`, so «a screen that is left hears nothing» is one number to read
 * instead of a question to every store. The fixed listener that the bridge keeps on each store it has met is not a listener
 * of a screen: it is counted apart (`fixedStoreListenerCount`) and the test of the leave subtracts it.
 */

let live = 0
let fixedOnStores = 0

/** How many listeners of screens are live now. Zero when no React screen is on the page. */
export const bridgeListenerCount = (): number => live

/** How many stores the bridge has met, each with the one fixed listener it keeps for good. */
export const fixedStoreListenerCount = (): number => fixedOnStores

/** Declares one listener of a screen; the function it gives back declares it gone (and may be called twice). */
export function countListener(): () => void {
    live += 1
    let released = false
    return () => {
        if (released) return
        released = true
        live -= 1
    }
}

/** Declares the fixed listener of a store the bridge has just met. */
export function countFixedStoreListener(): void {
    fixedOnStores += 1
}
