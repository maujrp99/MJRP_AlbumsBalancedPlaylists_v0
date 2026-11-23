/**
 * The owner's rule (MJRP, 2026-11-23): «nao vamos usar o linguajar discos, pq no brasil discos restringe a vinis. vamos utilizar Albuns sempre».
 * No Portuguese text the visitor reads says «disco» or «discos»: the entry page's dictionary and page, and the app's Portuguese dictionaries.
 * Whole word, accents ignored: «Discogs» and «discografia» are other words and stay.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { COPY } from '../../public/splash/copy.js'

const plain = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const DISCO = /(^|[^a-z])discos?(?![a-z])/i
const says = (text) => DISCO.test(plain(text))
const root = process.cwd()
const ptDir = resolve(root, 'public/js/i18n/pt')
const ptFiles = readdirSync(ptDir).filter(name => name.endsWith('.js'))
// the values of a dictionary file: every quoted string after a colon (the keys are identifiers in English)
const valuesOf = (source) => [...source.matchAll(/:\s*(['"`])((?:\\.|(?!\1).)*)\1/gs)].map(m => m[2])

describe('Portuguese says «álbum», never «disco» (the owner, 2026-11-23)', () => {
    it('the rule reads whole words: Discogs and discografia are not «disco»', () => {
        expect(says('Vire o disco')).toBe(true)
        expect(says('para quem ama Discos.')).toBe(true)
        expect(says('O valor no Discogs')).toBe(false)
        expect(says('a discografia inteira')).toBe(false)
    })

    it('the entry page: no Portuguese text of the dictionary', () => {
        const hits = Object.entries(COPY.pt).filter(([, text]) => says(String(text))).map(([key]) => key)
        expect(hits).toEqual([])
        expect(COPY.pt['h.kick']).toContain('quem ama álbuns')
    })

    it('the entry page: nothing written in the page itself (title, description, labels)', () => {
        const page = readFileSync(resolve(root, 'public/splash.html'), 'utf8')
        const body = page.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
        expect(says(body)).toBe(false)
    })

    it('the app: no text of a Portuguese dictionary', () => {
        expect(ptFiles.length).toBeGreaterThan(5)
        const hits = ptFiles.flatMap(name => valuesOf(readFileSync(join(ptDir, name), 'utf8')).filter(says).map(text => `${name}: ${text.slice(0, 80)}`))
        expect(hits).toEqual([])
    })

    it('Discogs is still named in the Portuguese of the inventory', () => {
        expect(readFileSync(join(ptDir, 'inventory.js'), 'utf8')).toMatch(/Discogs/)
    })
})
