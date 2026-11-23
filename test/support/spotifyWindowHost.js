/**
 * What a screen is to the Spotify export window, for its tests (F83 wave 8a): the window is opened the way a screen opens it (the entry of
 * controllers/playlistExportEntries.js, which asks for the window, the export service and the sign-in and hands them over), and the presses and the
 * typing are the ones of a person, told to React. What changes from the tests of the hand-made window is the scaffold, never the assertion.
 */
import { act } from 'react'
import { openSpotifyExport } from '../../public/js/controllers/playlistExportEntries.js'
import { closeAllWindows } from '../../public/js/ui/windowLayer'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** The box of the window, or null. */
export const windowBox = () => document.getElementById('spotify-export-modal')

/** Opens the window; `given` is what the saved playlists screen hands over (none: the playlists on the edit screen). */
export async function openSpotifyWindow(given) {
    await act(async () => { await openSpotifyExport(given ? { playlists: given.playlists, seriesName: given.seriesName } : {}) })
}

/** Takes every window off the page, the way leaving the screen does (the root goes in a microtask: wait for it before the page is wiped). */
export async function closeWindows() {
    await act(async () => { closeAllWindows(); await new Promise(resolve => setTimeout(resolve, 0)) })
}

/** A press, as a person makes it: React is told. */
export const press = (element) => { act(() => { element.click() }) }

/** A radio chosen by a person: the click is what React hears. */
export const choose = (mode) => press(document.querySelector(`input[name="exportMode"][value="${mode}"]`))

/** Types into the name field the way a person does. */
export function typeInto(field, value) {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    act(() => { field.focus(); set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
}

/** Lets what is on its way (a promise answered, a draw scheduled) arrive. */
export const settle = (ms = 25) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })
