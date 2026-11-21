/**
 * F80 (UAT-240, UAT-241): every visible text of the entry page lives in ONE dictionary
 * (public/splash/copy.js), in Portuguese and in English. A copy revision replaces the strings and
 * nothing else; these tests keep the two languages whole and the page tied to the dictionary.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COPY, LANGS, t, copyKeys } from '../../public/splash/copy.js'
import { captionHtml, creditHtml, stageTagHtml } from '../../public/splash/covers.js'

const page = readFileSync(resolve(__dirname, '../../public/splash.html'), 'utf8')
const keysIn = (html, attr) => [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map(m => m[1])

describe('the dictionary', () => {
    it('has the two languages, Portuguese first', () => {
        expect(LANGS).toEqual(['pt', 'en'])
        expect(Object.keys(COPY)).toEqual(['pt', 'en'])
    })

    it('every key is written in both languages, and none is empty', () => {
        expect(Object.keys(COPY.en).sort()).toEqual(Object.keys(COPY.pt).sort())
        for (const lang of LANGS) {
            for (const [key, value] of Object.entries(COPY[lang])) expect(value.trim(), `${lang}.${key}`).not.toBe('')
        }
        expect(copyKeys()).toEqual(Object.keys(COPY.pt))
    })

    it('t() answers in the language asked and falls back to Portuguese, then to the key', () => {
        expect(t('m.albums', 'pt')).toBe('Álbuns')
        expect(t('m.albums', 'en')).toBe('Albums')
        expect(t('m.albums')).toBe('Álbuns')
        expect(t('m.albums', 'fr')).toBe('Álbuns')
        expect(t('no.such.key', 'en')).toBe('no.such.key')
    })

    it('the menu is Inicie · Álbuns · Blend · Playlists · Inventário (Start · Albums · Blend · Playlists · Inventory)', () => {
        const keys = ['m.start', 'm.albums', 'm.blend', 'm.playlists', 'm.inventory']
        expect(keys.map(k => t(k, 'pt'))).toEqual(['Inicie', 'Álbuns', 'Blend', 'Playlists', 'Inventário'])
        expect(keys.map(k => t(k, 'en'))).toEqual(['Start', 'Albums', 'Blend', 'Playlists', 'Inventory'])
    })

    it('carries the owner\'s corrections: «coloque» never «ponha», the ranking title, the export line, the inventory title', () => {
        const all = LANGS.flatMap(l => Object.values(COPY[l])).join('\n')
        expect(all).not.toMatch(/ponha|ponho|pôr\b/i)
        expect(t('t.albums', 'pt')).toBe('Ranqueie as faixas do seu jeito.')
        expect(t('p.playlists', 'pt')).toMatch(/Spotify ou a Apple Music/)
        expect(t('p.playlists', 'en')).toMatch(/Spotify or Apple Music/)
        expect(t('t.inventory', 'pt')).toBe('Conte as mídias físicas da sua estante.')
        expect(t('e.title', 'pt')).toBe('Coloque sua primeira série para tocar.')
        expect(t('h.title', 'pt')).toBe('Mergulhe nos álbuns que você ama.')
        expect(t('h.what', 'pt')).toBe('Seus álbuns do momento, numa playlist balanceada.')
    })

    it('the ranking is optional and partial: never «every track»', () => {
        expect(t('t.albums', 'en')).not.toMatch(/every track/i)
        expect(t('p.albums', 'pt')).toMatch(/Uma só ou várias, para cima ou para baixo/)
    })
})

describe('the page and the dictionary', () => {
    const filled = captionHtml('real') + captionHtml('fictional') + creditHtml('real') + creditHtml('fictional') + stageTagHtml('fictional')
    const all = page + filled
    const used = new Set(['data-i18n', 'data-i18n-aria', 'data-i18n-content', 'data-i18n-title'].flatMap(a => keysIn(all, a)))

    it('every key the page asks for exists in both languages', () => {
        expect(used.size).toBeGreaterThan(40)
        for (const key of used) {
            expect(COPY.pt[key], `pt.${key}`).toBeTypeOf('string')
            expect(COPY.en[key], `en.${key}`).toBeTypeOf('string')
        }
    })

    it('the page holds no visible text of its own: what says something is filled from the dictionary', () => {
        // what stays outside it: the card of real tracks of one album (data of the album, not copy) and icons
        const lines = page.slice(page.indexOf('<body'))
            .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean)
        const tracks = ['Sunday Morning', 'I\'m Waiting for the Man', 'Femme Fatale', 'Venus In Furs', 'Run Run Run', 'All Tomorrow\'s Parties',
            'Heroin', 'There She Goes Again', 'I\'ll Be Your Mirror', 'The Black Angel\'s Death Song', 'European Son']
        const allowed = [/^[⟲→↑♫·]+$/, /^The Album Blender$/, /^The Velvet Underground &amp; Nico · 1967$/, /^\d+$/, /^PT$/, /^EN$/, ...tracks.map(s => new RegExp(`^${s.replace(/'/g, '(\'|&#39;|&apos;)')}$`))]
        expect(lines.filter(line => !allowed.some(re => re.test(line)))).toEqual([])
    })
})
