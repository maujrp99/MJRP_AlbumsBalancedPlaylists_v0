/**
 * The «translate» port of the Painel (F82, REQ-13; TASK-16, the panel's part): one text, from one language to the other,
 * by the server's route `POST /api/admin/translate` (administrator only; the contract is in docs/specs/arch.md). The answer
 * is the kit's result: the translation, or a failure that names its reason, so the kit's review says why in plain words
 * and the field does not change.
 *
 * The route takes `{ target: 'pt-BR' | 'en', text, kind: 'plain' | 'rich', context? }` and answers
 * `200 { data: { translation }, outcome }`, or `{ error: { code, retryable, reason } }` where `reason` is the name to show.
 */
import type { KitResult } from '../../ui/admin-kit/index'

export type TranslateReason = 'session' | 'notAdmin' | 'notConfigured' | 'credit' | 'service' | 'tooLong' | 'tooMany' | 'invalid' | 'unusable'

/** What the Painel asks: the language of the dictionary (`en`, `pt`), the text, its kind and the key it belongs to. */
export interface TranslateAsk {
    target: string
    text: string
    kind: string
    /** The key of the text, so the service knows where it shows. */
    context?: string
}

/** What the route receives. */
export interface TranslateBody {
    target: 'pt-BR' | 'en'
    text: string
    kind: 'plain' | 'rich'
    context?: string
}

export interface TranslateDeps {
    /** The request to the server, with the administrator's session (api/serverFetch.js). */
    post: (path: string, body: TranslateBody) => Promise<{ status: number; body: unknown }>
    /** Told the reason of a failure, in the Painel's own names (the kit knows three). */
    onFailure?: (reason: TranslateReason) => void
}

const BY_REASON: Record<string, TranslateReason> = {
    'session-expired': 'session', 'not-an-administrator': 'notAdmin', 'translation-not-configured': 'notConfigured',
    'credit-exhausted': 'credit', 'service-unavailable': 'service', 'text-too-long': 'tooLong',
    'too-many-requests': 'tooMany', 'invalid-request': 'invalid', 'translation-unusable': 'unusable',
}
const BY_STATUS: Record<number, TranslateReason> = { 400: 'invalid', 401: 'session', 403: 'notAdmin', 413: 'tooLong', 429: 'tooMany' }

const record = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {})

/** The reason of a failed answer: the server's name for it first, its status after, «the service did not answer» last. */
export function reasonOf(status: number, body: unknown): TranslateReason {
    return BY_REASON[String(record(record(body).error).reason ?? '')] ?? BY_STATUS[status] ?? 'service'
}

/** The body the route takes, from what the Painel asks. */
export function bodyOf(ask: TranslateAsk): TranslateBody {
    return { target: ask.target === 'pt' ? 'pt-BR' : 'en', text: ask.text, kind: ask.kind === 'rich' ? 'rich' : 'plain', ...(ask.context ? { context: ask.context } : {}) }
}

function failure(reason: TranslateReason): KitResult<string> {
    if (reason === 'session') return { ok: false, failure: 'session-expired' }
    return { ok: false, failure: 'refused', message: reason }
}

type Answer = { text: string } | { reason: TranslateReason }

async function answerOf(deps: TranslateDeps, ask: TranslateAsk): Promise<Answer> {
    const answer = await deps.post('/api/admin/translate', bodyOf(ask))
    if (answer.status < 200 || answer.status >= 300) return { reason: reasonOf(answer.status, answer.body) }
    const translation = record(record(answer.body).data).translation
    return typeof translation === 'string' && translation.trim() ? { text: translation } : { reason: 'unusable' }
}

export async function translateText(deps: TranslateDeps, ask: TranslateAsk): Promise<KitResult<string>> {
    let reason: TranslateReason = 'service'
    try {
        const answer = await answerOf(deps, ask)
        if ('text' in answer) return { ok: true, value: answer.text }
        reason = answer.reason
    } catch {
        reason = 'service'
    }
    deps.onFailure?.(reason)
    return failure(reason)
}
