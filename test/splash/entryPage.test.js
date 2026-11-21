/**
 * F80 (REQ-01, REQ-02, REQ-05, REQ-06) - the entry page is a second, static HTML of the same Vite
 * build. The plugin writes the covers and their credit into it; in dist/ the
 * entry page is index.html (the root) and the app is app.html (every other address); the dev
 * server and `vite preview` answer the way Firebase Hosting does in production.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
    PLACES, fillEntryPage, isRootAddress, isEntryAddress, isAppAddress, renameBuiltPages, entryPage
} from '../../scripts/entryPage.mjs'

const ROOT = process.cwd()
const source = readFileSync(resolve(ROOT, 'public/splash.html'), 'utf8')
const built = (set) => fillEntryPage(source, { set })
const textOf = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

describe('the page as written in the repository', () => {
    it('has every place the build fills', () => {
        PLACES.forEach(place => expect(source).toContain(`<!--splash:${place}-->`))
    })

    it('names nothing of the app: no app script, no app stylesheet', () => {
        expect(source).not.toMatch(/\/js\/app\.js|\/css\/|firebase-config/)
        expect(source).toContain('<script type="module" src="/splash/main.js"></script>')
    })

    it('its calls to action lead into the app', () => {
        const hrefs = [...source.matchAll(/<a class="btn[^"]*"[^>]*href="([^"]+)"/g)].map(m => m[1])
        expect(new Set(hrefs)).toEqual(new Set(['/start', '/start?signin']))
        expect(source).not.toContain('#privacy')
    })
})

describe('the page as served (what a search engine or an assistant reads, without script)', () => {
    const page = built('fictional')

    it('nothing decides before the paint: no inline script in the head, no hidden page', () => {
        const head = page.slice(0, page.indexOf('</head>'))
        expect(head).not.toMatch(/runGate|location\.replace/)
        expect(head).not.toMatch(/<script>\s*\(function/)
        expect(page).not.toMatch(/html\.gate/)
    })

    it('title, description, canonical address, Open Graph and structured data', () => {
        expect(page).toContain('<title>The Album Blender — for people who listen to whole albums</title>')
        expect(page).toMatch(/<meta name="description" content="The Album Blender is a web app for people who listen to whole albums/)
        expect(page).toContain('<link rel="canonical" href="https://mjrp-playlist-generator.web.app/">')
        expect(page).toContain('<meta property="og:title"')
        const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
        expect(ld).toMatchObject({ '@type': 'WebApplication', name: 'The Album Blender' })
    })

    it('the text reads whole: the definition first, then every track', () => {
        const text = textOf(page)
        const order = [
            'Dig through the albums you love. Keep every track.',
            'The Album Blender is a web app for people who listen to whole albums.',
            'Gather the albums that belong together.',
            'Rank every track, not just the singles.',
            'Blend the series into one playlist.',
            'Keep count of the records you own.',
            'Flip the record.',
            'Shuffle keeps the hits and loses the record.',
            'Drop the needle on your first series.'
        ]
        const at = order.map(line => text.indexOf(line))
        at.forEach(i => expect(i).toBeGreaterThan(-1))
        expect([...at].sort((a, b) => a - b)).toEqual(at)
    })

    it('fictional covers by default: 14 sleeves, the tag on the stage, no Apple Music', () => {
        expect(page.match(/<img class="sl /g)).toHaveLength(14)
        expect(page).toContain('Fictional albums · original art')
        expect(page).not.toContain('Apple Music')
        expect(page).not.toContain('mzstatic.com/image') // the CSP may name the host; no image comes from it
        PLACES.forEach(place => expect(page).not.toContain(`<!--splash:${place}-->`))
    })

    it('real covers when the switch says so: credit, link and the trademark line', () => {
        const real = built('real')
        expect(real.match(/<img class="sl /g)).toHaveLength(15)
        expect(real).toContain('https://is1-ssl.mzstatic.com/image/thumb/')
        expect(real).toContain('Listen on Apple Music')
        expect(real).toContain('Apple and Apple Music are trademarks of Apple Inc.')
        expect(real).not.toContain('Fictional albums · original art')
    })

    it('a page missing a place is refused, not built half-filled', () => {
        expect(() => fillEntryPage(source.replace('<!--splash:covers-->', ''), { set: 'fictional' })).toThrow(/covers/)
    })
})

describe('which address is which', () => {
    it('the root, with or without a query, is the entry page', () => {
        expect(isRootAddress('/')).toBe(true)
        expect(isRootAddress('/?entry')).toBe(true)
        expect(isRootAddress('/start')).toBe(false)
        expect(isRootAddress('/splash.html')).toBe(false)
    })

    it('every other address without a file extension is the app; files and the API are not', () => {
        ['/start', '/albums', '/albums/abc123', '/inventory', '/callback?code=x', '/start?signin'].forEach(url => expect(isAppAddress(url)).toBe(true));
        ['/', '/?entry', '/home', '/home?signin', '/assets/main-abc.js', '/favicon.png', '/api/generate', '/@vite/client', '/splash/main.js'].forEach(url => expect(isAppAddress(url)).toBe(false))
    })
})

describe('F85 (MJRP, 2026-11-21): /home is the entry page too', () => {
    it('/home, with or without a query, is an entry address; /homepage and /home/x are not', () => {
        ;['/', '/?entry', '/home', '/home?signin', '/home#x'].forEach(url => expect(isEntryAddress(url)).toBe(true))
        ;['/start', '/homepage', '/home/x', '/albums'].forEach(url => expect(isEntryAddress(url)).toBe(false))
    })

    const run = (hook, url, method = 'GET') => {
        const middlewares = []
        hook({ middlewares: { use: (fn) => middlewares.push(fn) } })
        const req = { url, method }
        middlewares[0](req, {}, () => {})
        return req.url
    }

    it('the dev server answers /home and /home?signin with the entry page, as it does the root', () => {
        const plugin = entryPage({})
        expect(run(plugin.configureServer, '/home')).toBe('/splash.html')
        expect(run(plugin.configureServer, '/home?signin')).toBe('/splash.html?signin')
        expect(run(plugin.configureServer, '/')).toBe('/splash.html')
        expect(run(plugin.configureServer, '/start')).toBe('/start')
    })

    it('vite preview answers /home and /home?signin with the built entry page (index.html), the rest as before', () => {
        const plugin = entryPage({})
        expect(run(plugin.configurePreviewServer, '/home')).toBe('/index.html')
        expect(run(plugin.configurePreviewServer, '/home?signin')).toBe('/index.html?signin')
        expect(run(plugin.configurePreviewServer, '/start')).toBe('/app.html')
        expect(run(plugin.configurePreviewServer, '/albums/x?a=1')).toBe('/app.html?a=1')
    })

    it('firebase.json rewrites /home to the entry page file, before the catch-all to the app', () => {
        const rewrites = JSON.parse(readFileSync(resolve(ROOT, 'firebase.json'), 'utf8')).hosting.rewrites
        const home = rewrites.findIndex(r => r.source === '/home')
        const all = rewrites.findIndex(r => r.source === '**')
        expect(home).toBeGreaterThanOrEqual(0)
        expect(home).toBeLessThan(all)
        expect(rewrites[home].destination).toBe('/index.html')
        expect(rewrites[all].destination).toBe('/app.html')
    })
})

describe('dist/: the root is the entry page, the app is app.html', () => {
    it('renames the two built pages', () => {
        const dir = mkdtempSync(join(tmpdir(), 'f80-dist-'))
        writeFileSync(join(dir, 'index.html'), 'the app')
        writeFileSync(join(dir, 'splash.html'), 'the entry page')
        renameBuiltPages(dir)
        expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe('the entry page')
        expect(readFileSync(join(dir, 'app.html'), 'utf8')).toBe('the app')
        expect(existsSync(join(dir, 'splash.html'))).toBe(false)
    })

    it('refuses a build without the two pages', () => {
        const dir = mkdtempSync(join(tmpdir(), 'f80-dist-'))
        writeFileSync(join(dir, 'index.html'), 'the app')
        expect(() => renameBuiltPages(dir)).toThrow(/splash\.html/)
    })
})
