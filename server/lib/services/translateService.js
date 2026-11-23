/**
 * The translation of one field of the Painel (F82, REQ-13): what may be asked, and the answer
 * under the contract of lib/outcome.js. The model is asked by the translator it is given
 * (lib/translation/claudeTranslator.js); this file knows no provider.
 *
 * The request: { target: 'pt-BR' | 'en', text, kind: 'plain' | 'rich', context? }
 *   text     what to translate: text, not empty, up to MAX_TEXT_CHARS characters
 *   kind     plain (a label) or rich (Markdown: the marks and the link addresses stay)
 *   context  optional, up to MAX_CONTEXT_CHARS: where the text appears, a hint for the model
 * The answer: success({ translation }).
 *
 * REASONS is the closed list of the names a failure of the administrator's route carries in
 * `error.reason` (the door and the limit use them too): what the Painel shows. The field never
 * changes on a failure - that is the Painel's side.
 */
const { success, failure } = require('../outcome')

const MAX_TEXT_CHARS = 4000
const MAX_CONTEXT_CHARS = 500
const TARGETS = Object.freeze(['pt-BR', 'en'])
const KINDS = Object.freeze(['plain', 'rich'])

const REASONS = Object.freeze({
  SESSION_EXPIRED: 'session-expired', // 401: sign in again
  NOT_AN_ADMINISTRATOR: 'not-an-administrator', // 403
  NOT_CONFIGURED: 'translation-not-configured', // 503 no key in the server; 502 the provider refuses the key
  CREDIT_EXHAUSTED: 'credit-exhausted', // 502: the provider's billing error
  SERVICE_UNAVAILABLE: 'service-unavailable', // 502, 503, 504: ask again later
  TEXT_TOO_LONG: 'text-too-long', // 413
  TOO_MANY_REQUESTS: 'too-many-requests', // 429, with Retry-After
  INVALID_REQUEST: 'invalid-request', // 400: a bug of the caller
  UNUSABLE: 'translation-unusable' // 502: the model's answer is not a translation of the text
})

const INVALID = () => failure('invalid_request', { reason: REASONS.INVALID_REQUEST })
const TOO_LONG = () => failure('invalid_request', { status: 413, reason: REASONS.TEXT_TOO_LONG })

const isOptionalHint = (context) => context === undefined || context === null || (typeof context === 'string' && context.length <= MAX_CONTEXT_CHARS)

/** What makes a request unusable, in the order it is checked: [the body breaks the rule, the answer]. */
const RULES = Object.freeze([
  [(body) => !TARGETS.includes(body.target), INVALID],
  [(body) => !KINDS.includes(body.kind), INVALID],
  [(body) => typeof body.text !== 'string' || body.text.trim() === '', INVALID],
  [(body) => !isOptionalHint(body.context), INVALID],
  [(body) => body.text.length > MAX_TEXT_CHARS, TOO_LONG]
])

/** The failure a request is refused with, or null when it can be translated. */
function refusalOf (body) {
  if (!body || typeof body !== 'object') return INVALID()
  const broken = RULES.find(([breaks]) => breaks(body))
  return broken ? broken[1]() : null
}

/**
 * @param {Object} deps
 * @param {Object} deps.translator - { translate(ask) -> { ok: true, translation } | failure }
 */
function createTranslateService ({ translator }) {
  /**
   * @param {*} body - the body of the request, as it came
   * @returns {Promise<Object>} a typed result of lib/outcome.js
   */
  async function translate (body) {
    const refused = refusalOf(body)
    if (refused) return refused

    const { target, text, kind, context } = body
    const ask = { target, text, kind }
    const hint = typeof context === 'string' ? context.trim() : ''
    if (hint) ask.context = hint

    const result = await translator.translate(ask)
    return result.ok ? success({ translation: result.translation }) : result
  }

  return { translate }
}

module.exports = { createTranslateService, MAX_TEXT_CHARS, MAX_CONTEXT_CHARS, TARGETS, KINDS, REASONS }
