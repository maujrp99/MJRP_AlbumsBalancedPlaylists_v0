/**
 * The world the album window, the window to edit an inventory item and the window to add an album to the inventory are asked in (F83 wave 6b):
 * what stands OUTSIDE them, as stand-ins that write down every call in `outside` (the inventory service that adds an album, the notices, the
 * answers the host of the value section gives, the sources of the album, the loader of the album of now).
 *
 * Read by `vi.mock` factories (test/support/albumWindowScenarios.js is NOT imported here: a factory that imports the file that imports the
 * module it replaces hangs the test, lesson 12 of wave-lessons.md): this file imports nothing of the app.
 */
import { vi } from 'vitest'

/** Every call a window makes to what is outside it, in order: `[name, ...what]`. */
export const outside = []

/** A promise a scenario lets go of when it says so. */
export const held = () => {
    let release
    let refuse
    const promise = new Promise((resolve, reject) => { release = resolve; refuse = reject })
    return { promise, release, refuse }
}

const json = (value) => JSON.stringify(value)

/** What the scenario controls. */
export const world = {
    /** what `inventoryService.addAlbum` does: nothing, or throws this message; `gate` holds it until the scenario lets it go */
    addFails: null,
    addGate: null,
    reset() {
        this.addFails = null
        this.addGate = null
    }
}

export const inventoryService = {
    addAlbum: vi.fn(async (album, format, options) => {
        outside.push(['service.addAlbum', album.id ?? album.title, format, json(options)])
        if (world.addGate) await world.addGate.promise
        if (world.addFails) throw new Error(world.addFails)
        return 'new-id'
    })
}
export const wiringModule = { inventoryService, readSeriesOfThePerson: vi.fn(async () => []) }

const toast = {
    success: vi.fn((text) => { outside.push(['toast.success', text]) }),
    error: vi.fn((text) => { outside.push(['toast.error', text]) }),
    info: vi.fn((text) => { outside.push(['toast.info', text]) }),
    warning: vi.fn((text) => { outside.push(['toast.warning', text]) })
}
export const toastModule = { default: toast, toast }
