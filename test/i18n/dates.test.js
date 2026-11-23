/**
 * F81 (the judge's P2-4): a date or a time on the screen follows the language chosen in the app, not the language of the browser.
 * One place decides the tag (i18n/dates.js); the screens that wrote a date with the browser's own locale ask it.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { setLocale } from '../../public/js/i18n/t.js'
import { dateTag, dateText, timeText, dateTimeText, clockText } from '../../public/js/i18n/dates.js'

const browser = (languages) => vi.stubGlobal('navigator', { languages, language: languages[0] })
const WHEN = new Date(2026, 10, 23, 18, 29, 43) // 23 November 2026, 18:29:43, local time

describe('dates and times follow the language of the app (F81)', () => {
    afterEach(async () => { vi.unstubAllGlobals(); await setLocale('en') })

    it('Portuguese writes them the Brazilian way, whatever the browser speaks', async () => {
        browser(['en-US'])
        await setLocale('pt')
        expect(dateTag()).toBe('pt-BR')
        expect(dateText(WHEN)).toBe('23/11/2026')
        expect(timeText(WHEN)).toBe('18:29:43')
        expect(dateTimeText(WHEN)).toBe('23/11/2026, 18:29:43')
        expect(clockText(WHEN)).toBe('18:29')
    })

    it('English keeps the English of the browser (the habits of the United States or of the United Kingdom)', () => {
        browser(['en-US', 'pt-BR'])
        expect(dateTag()).toBe('en-US')
        expect(dateText(WHEN)).toBe('11/23/2026')
        expect(timeText(WHEN)).toBe('6:29:43 PM')
        browser(['en-GB'])
        expect(dateTag()).toBe('en-GB')
        expect(dateText(WHEN)).toBe('23/11/2026')
    })

    it('English in a browser that speaks another language is still English: the site\'s own way (day, month, year)', () => {
        browser(['pt-BR', 'en-US'])
        expect(dateTag()).toBe('en-GB')
        expect(dateTimeText(WHEN)).toBe('23/11/2026, 18:29:43')
        vi.stubGlobal('navigator', undefined)
        expect(dateTag()).toBe('en-GB')
    })

    it('accepts milliseconds, and says nothing for what is not a date', () => {
        browser(['en-GB'])
        expect(dateText(WHEN.getTime())).toBe('23/11/2026')
        expect(dateText(Number.NaN)).toBe('')
        expect(timeText(new Date('nonsense'))).toBe('')
    })

    it('no screen writes a date in the browser\'s own locale any more: they ask i18n/dates.js', () => {
        const root = path.resolve(__dirname, '../../public/js')
        const files = fs.readdirSync(root, { recursive: true }).map(String).filter(file => /\.(js|ts|tsx)$/.test(file) && !file.startsWith(`i18n${path.sep}`))
        const bare = files.flatMap(file => fs.readFileSync(path.join(root, file), 'utf8').split('\n')
            .map((line, index) => ({ line, at: `${file}:${index + 1}` }))
            .filter(({ line }) => /\.toLocale(Date|Time)?String\(\s*(\[\s*\]\s*[,)]|\))/.test(line) && !/^\s*(\*|\/\/)/.test(line))
            .map(({ at }) => at))
        expect(bare).toEqual([])
    })
})
