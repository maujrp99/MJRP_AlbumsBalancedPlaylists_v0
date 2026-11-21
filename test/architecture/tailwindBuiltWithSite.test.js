// @vitest-environment node
/**
 * Fitness function of F59 slice E (UAT-25): the Tailwind styles are made when the site is built,
 * from the site's own files, and no page of the site loads Tailwind from another host.
 *
 * Tailwind writes into the CSS only the classes it finds in the files named by `content` in
 * tailwind.config.js. A class that is in the code and not in the CSS is an element with no style,
 * and nothing warns. So this test builds the CSS twice, with the same Tailwind and the same theme:
 *   - as the site builds it (tailwind.config.js as it is);
 *   - from the text of every file this test finds by itself (the pages Vite builds and every .js
 *     under public/js), with no safelist.
 * Every class of the second has to be in the first. It fails when a folder with classes is left
 * out of `content`.
 *
 * What it cannot see: a class name put together when the app runs (`${color}/10`). Those are found
 * by their shape, and each one is listed here with what it is; a new one fails until it is read
 * and, when it is a Tailwind class, written in full in the safelist of tailwind.config.js.
 *
 * What it does not prove: that the page looks the same. Only a browser shows that.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../tailwind.config.js'
import viteConfig from '../../vite.config.js'
import { listSourceFiles } from './support/parseSource.js'

const REPO = process.cwd()
const JS_ROOT = path.join(REPO, 'public/js')
const ENTRY_CSS = path.join(REPO, 'public/css/tailwind.css')
const CDN_HOST = 'cdn.tailwindcss.com'

/** The classes the page defined for Tailwind when Tailwind ran in the browser (public/index.html, until F59). */
const COMPONENT_CLASSES = [
    'btn', 'btn-primary', 'btn-secondary', 'btn-success', 'btn-danger', 'btn-sm', 'btn-icon',
    'glass-panel', 'form-control', 'container', 'badge', 'badge-success', 'badge-warning'
]

/**
 * Text glued to an interpolation that has the shape of a class name put together at run time:
 * `file` -> the pieces, as written. Each one was read: it is not a Tailwind class, or the classes
 * it makes are in the safelist. This list can only shrink; a new entry needs the reason.
 */
const PUT_TOGETHER_AT_RUN_TIME = {
    // Tailwind classes: gradient colors of a recipe with /10 - all in the safelist (checked below)
    'components/blend/BlendRecipeCard.js': ['${recipe.color.from}/10', '${recipe.color.to}/10'],
    // ids of elements, not classes
    'components/ui/FilterToolbar.js': ['filter-${group.id}', 'this.container.querySelector(`#filter-${group.id}`);'],
    // a class of the app's own, with its rules written in a <style> beside it
    'components/playlists/PlaylistGrid.js': ['.custom-scrollbar-${index}::-webkit-scrollbar', '.custom-scrollbar-${index}::-webkit-scrollbar-track', '.custom-scrollbar-${index}::-webkit-scrollbar-thumb', '.custom-scrollbar-${index}::-webkit-scrollbar-thumb:hover', 'custom-scrollbar-${index}']
}

const GLUED = /[^\s"'<>]*(?:[a-z0-9\]]-\$\{|\$\{[^}]*\}-[a-z0-9[]|\}\/\d|[a-z]-['"]\s*\+|\+\s*['"][-/][a-z0-9])[^\s"'<>]*/g

const listJs = (dir = '') => listSourceFiles(JS_ROOT, dir) // .js, .ts and .tsx: a class written only in JSX must reach the CSS (F83)

const read = (file) => fs.readFileSync(file, 'utf8')
const pagesOfTheSite = () => Object.values(viteConfig.build.rollupOptions.input)
/** The pages that use Tailwind: the app's. The entry page (public/splash.html, F80) has its own styles and no Tailwind class. */
const pagesWithTailwind = () => pagesOfTheSite().filter(page => path.basename(page) !== 'splash.html')

const unescapeCss = (name) => name
    .replace(/\\([0-9a-f]{1,6}) ?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1')

/** Every class name that has a rule in a CSS text. */
function classesOf(css) {
    const names = new Set()
    postcss.parse(css).walkRules(rule => {
        for (const match of rule.selector.matchAll(/\.((?:\\[0-9a-f]{1,6} ?|\\.|[\w-])+)/gi)) names.add(unescapeCss(match[1]))
    })
    return names
}

const build = async (config) => (await postcss([tailwindcss(config)]).process(read(ENTRY_CSS), { from: ENTRY_CSS })).css

/** The glued pieces of one source, without repeats. */
const gluedPieces = (source) => [...new Set(source.match(GLUED) || [])]

describe('Tailwind is built with the site', () => {
    let builtCss, built, fromEveryFile, everyFileText

    beforeAll(async () => {
        everyFileText = [...pagesWithTailwind(), ...listJs().map(file => path.join(JS_ROOT, file))].map(read).join('\n')
        builtCss = await build(tailwindConfig)
        built = classesOf(builtCss)
        fromEveryFile = classesOf(await build({ ...tailwindConfig, content: [{ raw: everyFileText, extension: 'html' }], safelist: [] }))
    }, 60000)

    it('no page of the site loads Tailwind from another host, nor allows that host in its policy', () => {
        for (const page of pagesOfTheSite()) {
            const html = read(page)
            expect(html, page).not.toContain(CDN_HOST)
            expect(html, page).not.toContain('tailwind.config')
            expect(html, page).not.toContain('text/tailwindcss')
        }
        expect(read(path.join(REPO, 'firebase.json'))).not.toContain(CDN_HOST)
    })

    it('the app imports the Tailwind stylesheet, after its own; only the styles of the phone come after it (F76)', () => {
        const imports = [...read(path.join(JS_ROOT, 'app.js')).matchAll(/^import\s+['"](\.\.\/css\/[^'"]+)['"]/gm)].map(match => match[1])
        expect(imports).toEqual(['../css/index.css', '../css/tailwind.css', '../css/mobile.css', '../css/mobile/screens.css', '../css/safe-area.css'])
    })

    it('every class Tailwind finds in the pages and in public/js is in the built CSS', () => {
        expect(fromEveryFile.size).toBeGreaterThan(500)
        const missing = [...fromEveryFile].filter(name => !built.has(name)).sort()
        expect(missing).toEqual([])
    })

    it('a class written only in a .tsx file reaches the CSS: the content of the config reads the same files as the screens are written in (F83)', async () => {
        const jsGlob = tailwindConfig.content.find(entry => typeof entry === 'string' && entry.includes('public/js'))
        const fixtureGlob = jsGlob.replace('public/js/**', 'test/architecture/fixtures/typescript')
        expect(fixtureGlob).not.toBe(jsGlob)

        const css = await build({ ...tailwindConfig, content: [fixtureGlob], safelist: [] })

        expect(classesOf(css).has('bg-fuchsia-950')).toBe(true)
    })

    it('the theme of the page came along: the font, the brand colors, the gradients', () => {
        expect(builtCss).toMatch(/\.font-syne\s*\{[^}]*font-family:\s*Syne, sans-serif/)
        expect(builtCss).toMatch(/\.text-brand-orange\s*\{[^}]*249 115 22/)
        expect(builtCss).toMatch(/\.bg-flame-gradient\s*\{[^}]*linear-gradient\(135deg, #f97316 0%, #dc2626 100%\)/)
    })

    it('the classes the page defined for Tailwind are in the built CSS, each one that is in use', () => {
        const used = COMPONENT_CLASSES.filter(name => new RegExp(`(^|[\\s"'\`])${name}([\\s"'\`]|$)`, 'm').test(everyFileText))
        expect(used.length).toBeGreaterThan(8)
        expect(used.filter(name => !built.has(name))).toEqual([])
        expect(builtCss).toMatch(/\.container\s*\{[^}]*max-width:\s*1200px/)
    })

    it('every class name put together at run time was read and is listed', () => {
        const unlisted = listJs().filter(file => !file.startsWith('vendor')).flatMap(file => {
            const known = PUT_TOGETHER_AT_RUN_TIME[file] || []
            return gluedPieces(read(path.join(JS_ROOT, file))).filter(piece => !known.includes(piece)).map(piece => `${file}: ${piece}`)
        })
        expect(unlisted).toEqual([])

        const stale = Object.entries(PUT_TOGETHER_AT_RUN_TIME).flatMap(([file, pieces]) => {
            const present = gluedPieces(read(path.join(JS_ROOT, file)))
            return pieces.filter(piece => !present.includes(piece)).map(piece => `${file}: ${piece}`)
        })
        expect(stale).toEqual([])
    })

    it('the recipe colors with /10, put together at run time, are in the built CSS', () => {
        const source = read(path.join(JS_ROOT, 'components/blend/BlendRecipeCard.js'))
        const colors = [...new Set([...source.matchAll(/\b(?:from|to): '([a-z0-9-]+)'/g)].map(match => match[1]))]
        expect(colors.length).toBeGreaterThan(8)
        expect(colors.map(color => `${color}/10`).filter(name => !built.has(name))).toEqual([])
    })
})
