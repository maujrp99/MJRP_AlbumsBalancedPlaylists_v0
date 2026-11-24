/**
 * adminCrate - what the Painel's «Caixa» section asks of the outside (F82, REQ-03): the repository of the published crate,
 * and the entry page as the build wrote it, from which the fixed set is read. A screen reaches the data through a service
 * (ADR-0016): this is the one the crate section uses, and its file comes down only with the Painel.
 */
import { publishedCrate } from '../../repositories/publishedCrate.js'

/** The repository of `published/crate` (it reads, and saves by the Painel's own save). */
export const crateWriter = () => publishedCrate()

/**
 * The entry page's HTML, from the site itself (the root address serves it to everyone).
 * @returns {Promise<string>}
 */
export async function entryPageHtml() {
    const response = await fetch('/', { credentials: 'omit' })
    if (!response.ok) throw new Error(`adminCrate: the entry page answered ${response.status}`)
    return response.text()
}
