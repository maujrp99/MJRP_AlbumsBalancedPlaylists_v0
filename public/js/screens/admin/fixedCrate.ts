/**
 * The fixed set of the entry page, as the Painel's «Caixa» section shows it while nothing is published (F82, REQ-03): read
 * from THE ENTRY PAGE ITSELF, as the build wrote it - the sleeves of its crate, each with its album's data - so the Painel
 * shows exactly what a visitor sees, and carries no copy of the set (the entry page and the app share no code file: each is
 * its own bundle).
 *
 * The page is read as an inert document (DOMParser: nothing of it runs or loads) and every album goes through the crate's
 * own check (shared/content/crate.js). A page of fictional albums (a build without the real covers) has no album to offer:
 * the two sides come empty.
 */
import { artPathOf, sidesOfFlat, validateAlbum } from '@shared/content/crate.js'
import { safeUrl } from '../../utils/safeUrl.js'
import type { Album, Sides } from './crateModel'

/** How many records of the fixed set are side B: its last seven (public/splash/covers.js). */
export const FIXED_SIDE_B = 7

function albumOf(sleeve: HTMLElement): Album | null {
    const data = sleeve.dataset
    const checked = validateAlbum({ id: data.k, title: data.t, artist: data.a, year: Number(data.y), art: artPathOf(sleeve.getAttribute('src')), href: safeUrl(data.href) })
    return checked.ok ? (checked.album as Album) : null
}

/** The two sides of the crate written in the entry page's HTML. */
export function fixedCrateOf(html: string): Sides {
    const page = new DOMParser().parseFromString(html, 'text/html')
    const sleeves = [...page.querySelectorAll<HTMLElement>('#box .sl')]
    const row = sleeves.map(albumOf).filter((album): album is Album => album !== null)
    // one sleeve that is not a real album means the page shows another set (the fictional one): there is no fixed set to offer
    if (!row.length || row.length !== sleeves.length) return { a: [], b: [] }
    return sidesOfFlat(row, Math.min(FIXED_SIDE_B, row.length)) as Sides
}
