/**
 * The visitor's way into the app on the phone (F96): the bottom bar's «Criar».
 *
 * The phone's opening has no big button (the owner's landing, 2026-11-23), and the top of a visitor's page has only «Entrar». So on the phone
 * the bar's first item opens the app for a visitor instead of scrolling to its story; the other four still lead to their stories, and on a
 * computer nothing changes. Signed in, every item already goes to its screen (menu.js).
 *
 * A module of its own that imports nothing, on purpose: the app bundles menu.js (the bar's look) in a file it shares with this page, and the
 * published site's weight budget has no byte to spare. With the rule here, that shared file keeps its bytes and its name, so nothing of the
 * app changes. A test holds this module's item to the menu's own (test/splash/phoneEntryPage.test.js).
 */

/** The item that opens the app for a visitor on the phone: «Criar», where a series begins, and its screen of the app. */
export const VISITOR_DOOR = Object.freeze({ id: 'start', app: '/start' })

/** Where the door sends an item of the bar: the app, for a visitor's «Criar» on the phone; null for everything else (what the menu says stands). */
export const doorHref = (id, signedIn, phone) => (!signedIn && phone && id === VISITOR_DOOR.id ? VISITOR_DOOR.app : null)

/** Writes the door on the page's bar. Called right after menu.js's applyAccount (which writes every item), and again when the screen crosses the phone's width. */
export function applyDoor(doc, signedIn, phone) {
    const href = doorHref(VISITOR_DOOR.id, signedIn, phone)
    if (href) doc.querySelectorAll(`.stop[data-for="${VISITOR_DOOR.id}"]`).forEach((a) => a.setAttribute('href', href))
}
