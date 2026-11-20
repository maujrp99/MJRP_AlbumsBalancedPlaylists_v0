/**
 * The app's platform wiring (F78, REQ-07): what the shared core asks of the engine, handed over ONCE,
 * before any screen. Today that is the id source and nothing else global: the core's `newId()`
 * (shared/platform/newId.js) gets expo-crypto's `randomUUID` (a v4 UUID from the system's secure
 * random source). The site wires the browser's in public/js/services/platform/platformWiring.js.
 *
 * Hermes has no `crypto` global (spike S1 measured `typeof crypto === 'undefined'`), so without this
 * wiring every rule that makes an id (a track with no id) throws, and says what to wire.
 */
import { randomUUID } from 'expo-crypto'
import { setIdSource } from '@album-blender/shared/platform/newId.js'

let wired = false

/** Wires the core for the app. Safe to call more than once; the first call does the work. */
export function wirePlatform(): void {
    if (wired) return
    setIdSource(() => randomUUID())
    wired = true
}

/** For tests: takes the wiring away, so the next `wirePlatform()` wires again. */
export function unwirePlatformForTests(): void {
    setIdSource(null)
    wired = false
}
