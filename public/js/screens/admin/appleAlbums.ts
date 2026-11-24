/**
 * The Painel's search of Apple Music's catalogue (F82, REQ-03): the albums for a word or two, or for an album's link, by
 * the server's route `POST /api/admin/apple-albums` (administrator only; the developer token never leaves the server). The
 * answer is the albums, each one checked AGAIN here by the crate's validator (shared/content/crate.js), or a failure that
 * names its reason, so the Painel says why in plain words.
 *
 * The route takes `{ query }` and answers `200 { data: { albums }, outcome }`, or `{ error: { code, retryable, reason } }`.
 */
import { validateAlbum } from '@shared/content/crate.js'
import type { Album } from './crateModel'

export type SearchReason = 'session' | 'notAdmin' | 'notConfigured' | 'service' | 'tooMany' | 'invalid' | 'notALink'
export type SearchAnswer = { ok: true; albums: Album[] } | { ok: false; reason: SearchReason }

export interface SearchDeps {
    /** The request to the server, with the administrator's session (api/serverFetch.js). */
    post: (path: string, body: { query: string }) => Promise<{ status: number; body: unknown }>
}

const BY_REASON: Record<string, SearchReason> = {
    'session-expired': 'session', 'not-an-administrator': 'notAdmin', 'search-not-configured': 'notConfigured',
    'service-unavailable': 'service', 'too-many-requests': 'tooMany', 'invalid-request': 'invalid', 'not-an-album-link': 'notALink',
}
const BY_STATUS: Record<number, SearchReason> = { 400: 'invalid', 401: 'session', 403: 'notAdmin', 429: 'tooMany' }

const record = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {})

/** The reason of a failed answer: the server's name for it first, its status after, «the service did not answer» last. */
export function searchReasonOf(status: number, body: unknown): SearchReason {
    return BY_REASON[String(record(record(body).error).reason ?? '')] ?? BY_STATUS[status] ?? 'service'
}

/** The albums of an answer that pass the crate's check; anything else is left out. */
function albumsOf(body: unknown): Album[] {
    const list = record(record(body).data).albums
    return (Array.isArray(list) ? list : []).flatMap((entry) => {
        const checked = validateAlbum(entry)
        return checked.ok ? [checked.album as Album] : []
    })
}

export async function searchAlbums(deps: SearchDeps, query: string): Promise<SearchAnswer> {
    try {
        const answer = await deps.post('/api/admin/apple-albums', { query })
        if (answer.status < 200 || answer.status >= 300) return { ok: false, reason: searchReasonOf(answer.status, answer.body) }
        return { ok: true, albums: albumsOf(answer.body) }
    } catch {
        return { ok: false, reason: 'service' }
    }
}
