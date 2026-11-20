/**
 * F64 (UAT-207) - the page itself is never kept by the browser without asking the site: it names
 * the script of the current publication, and an old page asks for files that no longer exist.
 * The hashed files under /assets may be kept; the page may not.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const firebase = JSON.parse(readFileSync(resolve(process.cwd(), 'firebase.json'), 'utf8'))
const cacheOf = (source) => (firebase.hosting.headers || [])
    .filter(rule => rule.source === source)
    .flatMap(rule => rule.headers)
    .find(header => header.key.toLowerCase() === 'cache-control')?.value

describe('hosting: the page is always asked for again', () => {
    it('an address of the app (no file extension: it is answered with the page) is not kept', () => {
        expect(cacheOf('**/!(*.*)')).toBe('no-cache')
    })

    it('the page asked for by name is not kept either', () => {
        expect(cacheOf('/index.html')).toBe('no-cache')
    })

    it('every address still falls back to the page, after the server routes', () => {
        const sources = firebase.hosting.rewrites.map(rewrite => rewrite.source)
        expect(sources).toEqual(['/api/**', '**'])
    })
})
