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

    it('the menu is Criar · Álbuns · Blend · Playlists · Inventário (Create · Albums · Blend · Playlists · Inventory)', () => {
        const keys = ['m.start', 'm.albums', 'm.blend', 'm.playlists', 'm.inventory']
        expect(keys.map(k => t(k, 'pt'))).toEqual(['Criar', 'Álbuns', 'Blend', 'Playlists', 'Inventário'])
        expect(keys.map(k => t(k, 'en'))).toEqual(['Create', 'Albums', 'Blend', 'Playlists', 'Inventory'])
    })

    it('the kicker of the first story names the item too: Criar / Create; the verb phrases stay', () => {
        expect(t('k.start', 'pt')).toBe('Lado A · 1 — Criar')
        expect(t('k.start', 'en')).toBe('Side A · 1 — Create')
        expect(t('d.start', 'en')).toBe('Start a series')
    })

    it('carries the owner\'s corrections: «coloque» never «ponha», the ranking title, the export line, the inventory title', () => {
        const all = LANGS.flatMap(l => Object.values(COPY[l])).join('\n')
        expect(all).not.toMatch(/ponha|ponho|pôr\b/i)
        expect(t('t.albums', 'pt')).toBe('Ranqueie as faixas do seu jeito.')
        expect(t('p.playlists', 'pt')).toMatch(/Spotify ou a Apple Music/)
        expect(t('p.playlists', 'en')).toMatch(/Spotify or Apple Music/)
        expect(t('t.inventory', 'pt')).toBe('Catalogue as mídias físicas da sua estante.')
        expect(t('e.title', 'pt')).toBe('Coloque sua primeira série para tocar.')
        expect(t('h.title', 'pt')).toBe('Mergulhe nos álbuns que você ama.')
        expect(t('h.what', 'pt')).toBe('Seus álbuns do momento, numa playlist balanceada.')
    })

    it('the hidden descriptions carry the owner\'s words, not the old text (UAT-240)', () => {
        for (const lang of LANGS) {
            for (const key of ['meta.desc', 'meta.ogdesc']) {
                const text = t(key, lang)
                expect(text, `${lang}.${key}`).not.toMatch(/mistur|blend balanced|estante|discos da|records on your shelf|keep count|reúna|gather/i)
                expect(text.length, `${lang}.${key}`).toBeLessThanOrEqual(key === 'meta.desc' ? 160 : 130)
            }
        }
        expect(t('meta.desc', 'pt')).toMatch(/Monte séries com seus álbuns do momento|monte séries com seus álbuns do momento/)
        expect(t('meta.desc', 'pt')).toMatch(/ranqueie as faixas e gere playlists equilibradas/)
        expect(t('meta.ogdesc', 'pt')).toMatch(/^Monte séries com seus álbuns do momento, ranqueie.*gere playlists equilibradas.*mídias físicas/)
        expect(t('meta.desc', 'en')).toMatch(/rank the tracks and make balanced playlists/)
        expect(t('meta.ogdesc', 'en')).toMatch(/physical media/)
    })

    it('the English opening is the v4 prototype\'s', () => {
        expect(t('h.title', 'en')).toBe('Dig through the albums you love.')
        expect(t('h.what', 'en')).toBe('Your albums of the moment, in one balanced playlist.')
    })

    it('the ranking is optional and partial: never «every track»', () => {
        expect(t('t.albums', 'en')).not.toMatch(/every track/i)
        expect(t('p.albums', 'pt')).toMatch(/Uma só ou várias, para cima ou para baixo/)
    })
})

describe('the hero opens with the title (UAT-292)', () => {
    it('no small line above the title, in either opening of the page; the title is the page\'s only h1 of each opening', () => {
        const hero = page.slice(page.indexOf('<section class="hero'), page.indexOf('</section>', page.indexOf('<section class="hero')))
        expect(hero).not.toContain('class="kicker"')
        for (const opening of ['only-out', 'only-in']) {
            const block = hero.slice(hero.indexOf(`<div class="${opening}">`))
            expect(block.replace(/^<div class="[^"]+">\s*/, '').startsWith('<h1 ')).toBe(true)
        }
        expect(hero.match(/<h1 /g)).toHaveLength(2)
    })

    it('its text left the dictionary, in both languages', () => {
        expect(COPY.pt['h.kick']).toBeUndefined()
        expect(COPY.en['h.kick']).toBeUndefined()
    })

    it('the product\'s name is still said: the page\'s title, the description and the logo', () => {
        expect(COPY.pt['meta.title']).toContain('The Album Blender')
        expect(COPY.pt['meta.desc']).toMatch(/The Album Blender é um app web/)
        expect(COPY.en['meta.desc']).toMatch(/The Album Blender is a web app/)
        expect(page).toMatch(/<img class="logo" alt="The Album Blender"/)
    })
})

describe('on the phone, signed in, the hero has no big «Criar» (UAT-294)', () => {
    const phone = page.slice(page.indexOf('/* the phone: the vignette beside'))
    const block = phone.slice(phone.indexOf('@media (max-width:899px){'), phone.indexOf('\n}\n', phone.indexOf('@media (max-width:899px){')))

    it('the signed-in hero\'s button is hidden on the phone only (the top bar already has «Criar»)', () => {
        expect(block).toMatch(/\.hero \.only-in \.ctas\{display:none\}/)
        // on the computer nothing hides it: the rule exists once, inside the phone's block
        expect(page.match(/\.hero \.only-in \.ctas\{/g)).toHaveLength(1)
    })

    it('the visitor\'s «Abrir o app» stays: on the phone it is the only button that opens the app', () => {
        expect(page).not.toMatch(/\.only-out \.ctas\{[^}]*display:none/)
        expect(page).not.toMatch(/\.hero \.ctas\{[^}]*display:none/)
        expect(page).not.toMatch(/#hero-ctas\{[^}]*display:none/)
        const hero = page.slice(page.indexOf('<section class="hero'), page.indexOf('</section>', page.indexOf('<section class="hero')))
        expect(hero).toMatch(/<div class="only-out">[\s\S]*id="app"[\s\S]*data-i18n="openapp"/)
    })

    it('the top bar keeps «Criar» for who is signed in', () => {
        expect(page).toMatch(/<a class="btn btn-primary btn-sm btn-start only-in" href="\/start"><span data-i18n="m\.start">/)
        expect(page).toMatch(/html\.in \.top \.btn-start\{display:inline-flex\}/)
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
        const allowed = [/^[⟲→↑♫·▶✓]+$/, /^The Album Blender$/, /^(Pink Floyd|Spotify|Apple Music)$/, /^The Velvet Underground &amp; Nico · 1967$/, /^\d+$/, /^PT$/, /^EN$/, ...tracks.map(s => new RegExp(`^${s.replace(/'/g, '(\'|&#39;|&apos;)')}$`))]
        expect(lines.filter(line => !allowed.some(re => re.test(line)))).toEqual([])
    })
})
