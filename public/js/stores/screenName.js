/**
 * ScreenNameStore - the name a screen gives itself in the top bar of the phone, in place of the name of its address (the name of the
 * series being shown, say). Pure state (ADR-0017): a setter, getters and subscribe. It lasts until the next screen: the shell of the phone
 * clears it at the end of each navigation. Every notice counts, even for the same name (the top bar was drawn anew at each one).
 *
 * It is how a screen, hand-made or in React, speaks to the shell without importing it: only app.js imports shell/ (F83, wave 3).
 */
export class ScreenNameStore {
    constructor() {
        this.name = null
        this.listeners = new Set()
    }

    /** @param {string|null} text */
    setName(text) {
        this.name = text || null
        this.notify()
    }

    clear() {
        this.name = null
        this.notify()
    }

    getName() {
        return this.name
    }

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => listener(this.name))
    }
}

export const screenNameStore = new ScreenNameStore()

/**
 * For a screen: its own name in the top bar of the phone. It lasts until the next screen; on the computer it does nothing.
 * @param {string} text
 */
export function nameThisScreen(text) {
    screenNameStore.setName(text)
}
