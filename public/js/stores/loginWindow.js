/**
 * LoginWindowStore - whether the window to sign in is on the page. Pure state (ADR-0017): who needs the window opened (a screen, the address
 * `?signin` of the entry page, the menu of the phone) calls `openLoginWindow()`; the shell draws it and closes it. It is one window: asking
 * twice leaves one.
 */
export class LoginWindowStore {
    constructor() {
        this.isOpen = false
        this.listeners = new Set()
    }

    open() {
        this.isOpen = true
        this.notify()
    }

    close() {
        this.isOpen = false
        this.notify()
    }

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => listener(this.isOpen))
    }
}

export const loginWindowStore = new LoginWindowStore()

/** Opens the window to sign in. */
export const openLoginWindow = () => loginWindowStore.open()
