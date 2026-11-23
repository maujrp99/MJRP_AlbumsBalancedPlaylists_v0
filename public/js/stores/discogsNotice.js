/**
 * DiscogsNoticeStore - whether the footer says that the app uses the Discogs API (F75, REQ-06; Discogs API Terms of Use): hidden until the
 * server says the Discogs values are on, hidden again when they are turned off. Pure state (ADR-0017). The text is the footer's, in the
 * dictionary (`shell.footer.discogsNotice`).
 */
export class DiscogsNoticeStore {
    constructor() {
        this.on = false
        this.listeners = new Set()
    }

    setOn(on) {
        this.on = Boolean(on)
        this.notify()
    }

    isOn() {
        return this.on
    }

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => listener(this.on))
    }
}

export const discogsNoticeStore = new DiscogsNoticeStore()

/** Show or hide the sentence about the Discogs API in the footer. */
export const showDiscogsNotice = (on) => discogsNoticeStore.setOn(on)
