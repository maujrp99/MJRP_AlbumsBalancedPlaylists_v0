// @vitest-environment node
/**
 * escapeHtml (F59 slice E, UAT-199): the one way text from outside the code goes into an HTML string.
 * It runs here without a DOM on purpose: the function is pure.
 */
import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../../public/js/utils/stringUtils.js'

describe('escapeHtml', () => {
    it('needs no document', () => {
        expect(typeof document).toBe('undefined')
        expect(escapeHtml('<b>')).toBe('&lt;b&gt;')
    })

    it('escapes the five characters that can change the meaning of HTML', () => {
        expect(escapeHtml('&')).toBe('&amp;')
        expect(escapeHtml('<')).toBe('&lt;')
        expect(escapeHtml('>')).toBe('&gt;')
        expect(escapeHtml('"')).toBe('&quot;')
        expect(escapeHtml("'")).toBe('&#39;')
    })

    it('escapes every occurrence, in one pass', () => {
        expect(escapeHtml(`<img src=x onerror="a('b')">&<`))
            .toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;&lt;')
    })

    it('cannot leave an attribute value, whatever the quote around it', () => {
        expect(escapeHtml('" onmouseover="alert(1)')).not.toContain('"')
        expect(escapeHtml("' onmouseover='alert(1)")).not.toContain("'")
    })

    it('gives an empty string for null and undefined', () => {
        expect(escapeHtml(null)).toBe('')
        expect(escapeHtml(undefined)).toBe('')
    })

    it('writes numbers, zero included, and booleans as their text', () => {
        expect(escapeHtml(0)).toBe('0')
        expect(escapeHtml(42)).toBe('42')
        expect(escapeHtml(3.5)).toBe('3.5')
        expect(escapeHtml(false)).toBe('false')
    })

    it('leaves plain text, accents and emoji alone', () => {
        expect(escapeHtml('Ágætis byrjun — Sigur Rós 🎵')).toBe('Ágætis byrjun — Sigur Rós 🎵')
        expect(escapeHtml('')).toBe('')
    })

    it('escapes text that is already escaped once more: the page then shows what was stored', () => {
        // The data layer (models/text.js) undoes stored entities; this function never guesses.
        expect(escapeHtml('Page &amp; Plant')).toBe('Page &amp;amp; Plant')
        expect(escapeHtml('&lt;b&gt;')).toBe('&amp;lt;b&amp;gt;')
    })
})

describe('escapeHtml in a page', () => {
    it('a name with & is shown as &, as element content and as an attribute value', async () => {
        const { JSDOM } = await import('jsdom')
        const name = 'Jimmy Page & Robert Plant "live" <b>'
        const dom = new JSDOM(`<p id="p" title="${escapeHtml(name)}" data-q='${escapeHtml(name)}'>${escapeHtml(name)}</p>`)
        const p = dom.window.document.getElementById('p')
        expect(p.textContent).toBe(name)
        expect(p.getAttribute('title')).toBe(name)
        expect(p.dataset.q).toBe(name)
        expect(p.children.length).toBe(0)
    })
})
