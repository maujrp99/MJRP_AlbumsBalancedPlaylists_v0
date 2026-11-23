/**
 * navigate - go to another address from inside a React screen (F83, proposal § 4.2).
 *
 * The router, on a move, destroys the screen it is leaving, and for a React screen that unmounts the root. A screen that
 * navigates from inside an effect would have the router unmount the root in the middle of the draw. So the move is
 * handed to the router after the draw in course, one microtask later. This is the one way a React screen navigates by code;
 * a link is a plain `<a href="/…">`, which the router already intercepts.
 */
import { router } from '../router.js'

export function navigate(path: string, state: object = {}): void {
    queueMicrotask(() => router.navigate(path, state))
}

/** The same, in place of the address being left (an address that only sends the person on). */
export function redirect(path: string, state: object = {}): void {
    queueMicrotask(() => router.redirect(path, state))
}
