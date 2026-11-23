/**
 * F82 TASK-11 (REQ-06, REQ-12, REQ-14): the validator of the texts, one for the Painel, the site and the entry page
 * (shared/content). A plain key: not empty, the same {placeholders} as the English, no < nor >, up to 3 times the English,
 * a warning from 1.5 times. A rich key is checked by KIND: the injected reader says whether the Markdown reads and which
 * links it has, and only https:, mailto: and paths of the site pass. One bad key is refused alone.
 */
import { describe, it, expect } from 'vitest'
import {
    validateText, validateTexts, placeholdersOf, isAllowedLink, basicParseRich, readTextsDocument,
    KIND_RICH, KIND_SHORT, WARNING_LONG
} from '../../../shared/content/texts.js'

const EN = 'You have {count} albums in {series}'

describe('a plain text (REQ-06)', () => {
    it('passes when it has the same placeholders, no markup and a fair length', () => {
        expect(validateText('Você tem {count} álbuns em {series}', EN)).toEqual({ ok: true, warning: null, links: [] })
    })

    it('is refused when it is not a text, or is empty', () => {
        expect(validateText(42, EN)).toEqual({ ok: false, reason: 'not_text' })
        expect(validateText(null, EN)).toEqual({ ok: false, reason: 'not_text' })
        expect(validateText('   ', EN)).toEqual({ ok: false, reason: 'empty' })
    })

    it('is refused without a placeholder of the English, or with one the English does not have', () => {
        expect(validateText('Você tem álbuns em {series}', EN)).toEqual({ ok: false, reason: 'placeholders' })
        expect(validateText('Você tem {count} álbuns em {series} {extra}', EN)).toEqual({ ok: false, reason: 'placeholders' })
        expect(placeholdersOf('{b} {a} {b}')).toEqual(['a', 'b'])
    })

    it('is refused with < or >', () => {
        expect(validateText('Tem {count} em {series} <img onerror=x>', EN)).toEqual({ ok: false, reason: 'markup' })
        expect(validateText('a > b', 'a b')).toEqual({ ok: false, reason: 'markup' })
    })

    it('warns from 1.5 times the English and is refused over 3 times', () => {
        const english = 'x'.repeat(10)
        expect(validateText('y'.repeat(14), english).warning).toBe(null)
        expect(validateText('y'.repeat(15), english)).toEqual({ ok: true, warning: WARNING_LONG, links: [] })
        expect(validateText('y'.repeat(30), english).ok).toBe(true)
        expect(validateText('y'.repeat(31), english)).toEqual({ ok: false, reason: 'too_long' })
    })
})

describe('a rich text, by kind of key (REQ-12, REQ-14)', () => {
    const english = 'Read **the guide** at [our page](/guide) and more words here'

    it('may carry Markdown, and its links come back', () => {
        expect(validateText('Leia **o guia** em [nossa página](/guide)\n\n> citação', english, { kind: KIND_RICH }))
            .toEqual({ ok: true, warning: null, links: ['/guide'] })
    })

    it('only https:, mailto: and paths of the site are links', () => {
        expect(isAllowedLink('https://example.com/a')).toBe(true)
        expect(isAllowedLink('mailto:someone@example.com')).toBe(true)
        expect(isAllowedLink('/albums')).toBe(true)
        for (const bad of ['http://example.com', 'javascript:alert(1)', 'JaVaScRiPt:alert(1)', '//evil.example', '/\\evil.example', 'data:text/html,x', ' https://a.b', 'ftp://a', '', null, 'albums']) {
            expect(isAllowedLink(bad), String(bad)).toBe(false)
        }
        expect(validateText('Veja [aqui](javascript:alert(1))', english, { kind: KIND_RICH })).toEqual({ ok: false, reason: 'link_not_allowed' })
        expect(validateText('Veja <http://example.com>', english, { kind: KIND_RICH })).toEqual({ ok: false, reason: 'link_not_allowed' })
    })

    it('raw HTML does not read', () => {
        expect(validateText('Oi <img src=x onerror=alert(1)>', english, { kind: KIND_RICH })).toEqual({ ok: false, reason: 'rich_unreadable' })
        expect(validateText('Oi <script>x</script>', english, { kind: KIND_RICH })).toEqual({ ok: false, reason: 'rich_unreadable' })
        expect(basicParseRich('a <https://example.com> b')).toEqual({ ok: true, links: ['https://example.com'] })
    })

    it('the reader is injected: the pure core of the kit plugs in here', () => {
        const calls = []
        const parseRich = (text) => { calls.push(text); return { ok: true, links: ['https://kit.example'] } }
        expect(validateText('qualquer <coisa>', english, { kind: KIND_RICH, parseRich })).toEqual({ ok: true, warning: null, links: ['https://kit.example'] })
        expect(calls).toEqual(['qualquer <coisa>'])
        expect(validateText('x', english, { kind: KIND_RICH, parseRich: () => ({ ok: false, links: [] }) })).toEqual({ ok: false, reason: 'rich_unreadable' })
        expect(validateText('x', english, { kind: KIND_RICH, parseRich: () => { throw new Error('boom') } })).toEqual({ ok: false, reason: 'rich_unreadable' })
        expect(validateText('x', english, { kind: KIND_RICH, parseRich: () => ({ ok: true, links: ['http://no'] }) })).toEqual({ ok: false, reason: 'link_not_allowed' })
    })

    it('keeps the plain rules that still hold: empty, placeholders, length', () => {
        expect(validateText(' ', english, { kind: KIND_RICH })).toEqual({ ok: false, reason: 'empty' })
        expect(validateText('**{name}**', '**hello**', { kind: KIND_RICH })).toEqual({ ok: false, reason: 'placeholders' })
        expect(validateText('y'.repeat(31), 'x'.repeat(10), { kind: KIND_RICH })).toEqual({ ok: false, reason: 'too_long' })
    })

    it('the short bar is rich with no line break', () => {
        expect(validateText('**Salvar** [mais](/x)', 'Save more here', { kind: KIND_SHORT })).toEqual({ ok: true, warning: WARNING_LONG, links: ['/x'] })
        expect(validateText('Salvar\nmais', 'Save more', { kind: KIND_SHORT })).toEqual({ ok: false, reason: 'line_break' })
    })
})

describe('a map of texts: one bad key is refused alone', () => {
    const english = { 'a.title': 'Albums', 'a.count': '{count} albums', 'a.about': 'About **us** and the long story' }

    it('keeps the good ones and says each refusal', () => {
        const result = validateTexts({
            'a.title': 'Álbuns',
            'a.count': 'álbuns',
            'a.gone': 'órfão',
            'a.about': 'Sobre [nós](/about)',
            'a.bad': 7
        }, english, { kindOf: (key) => (key === 'a.about' ? KIND_RICH : 'plain') })

        expect(result.values).toEqual({ 'a.title': 'Álbuns', 'a.about': 'Sobre [nós](/about)' })
        expect(result.rejected).toEqual([
            { key: 'a.count', reason: 'placeholders' },
            { key: 'a.gone', reason: 'unknown_key' },
            { key: 'a.bad', reason: 'unknown_key' }
        ])
        expect(result.warnings).toEqual([])
    })

    it('a warning does not refuse', () => {
        const result = validateTexts({ 'a.title': 'Álbuns e mais' }, english)
        expect(result.values).toEqual({ 'a.title': 'Álbuns e mais' })
        expect(result.warnings).toEqual([{ key: 'a.title', warning: WARNING_LONG }])
    })

    it('what is not a map gives nothing', () => {
        expect(validateTexts(null, english)).toEqual({ values: {}, rejected: [], warnings: [] })
        expect(validateTexts(['x'], english)).toEqual({ values: {}, rejected: [], warnings: [] })
    })

    it('a name of the prototype chain is not a key of the dictionary', () => {
        expect(validateTexts({ toString: 'x', constructor: 'y' }, english).values).toEqual({})
    })
})

describe('the shape of a texts document', () => {
    it('reads rev and texts, and only the fields it knows', () => {
        expect(readTextsDocument({ _schemaVersion: 1, rev: 4, texts: { a: 'b' }, previous: { a: 'c' } })).toEqual({ ok: true, rev: 4, texts: { a: 'b' } })
        expect(readTextsDocument({ _schemaVersion: 9, rev: 4, texts: {}, future: 1 })).toEqual({ ok: true, rev: 4, texts: {} })
    })

    it('refuses what is not a document, or has no map of texts', () => {
        expect(readTextsDocument(null)).toEqual({ ok: false, reason: 'not_a_document' })
        expect(readTextsDocument('x')).toEqual({ ok: false, reason: 'not_a_document' })
        expect(readTextsDocument({ rev: 1 })).toEqual({ ok: false, reason: 'no_texts' })
        expect(readTextsDocument({ rev: 1, texts: [] })).toEqual({ ok: false, reason: 'no_texts' })
        expect(readTextsDocument({ texts: {} })).toEqual({ ok: true, rev: 0, texts: {} })
    })
})
