/**
 * adminContent - what the Painel and its route ask of the published content (F82): the administrator's own record, read
 * before the Painel's file is asked for, and the repository that saves, whose file comes down only with the Painel.
 * A screen reaches the data through a service (ADR-0016): this is the one the Painel uses.
 */
import { publishedContent, publishedContentWriter } from '../../repositories/publishedContent.js'

/** @param {string} uid @returns {Promise<{ role?: string } | null>} the person's own record, or null */
export const readAdminRecord = (uid) => publishedContent.readAdmin(uid)

/** The repository that also saves (texts, approvals): asked for by the Painel only. */
export const contentWriter = () => publishedContentWriter()
