/**
 * publishedCrate - the site's side of the entry page's crate of albums, for the Painel (F82, REQ-03; ADR-0024): the core's
 * PublishedCrateRepository on the store the Painel's save already has (the batch locked by the rule of `rev`:
 * publishedContentWriter.js). Asked for only by the Painel: no visitor downloads this file.
 */
import { PublishedCrateRepository } from '@shared/data/PublishedCrateRepository.js'
import { publishedContentWriter } from './publishedContent.js'

/** @returns {Promise<PublishedCrateRepository>} the repository that reads and saves `published/crate` */
export async function publishedCrate() {
    const writer = await publishedContentWriter()
    return new PublishedCrateRepository(writer.store)
}
