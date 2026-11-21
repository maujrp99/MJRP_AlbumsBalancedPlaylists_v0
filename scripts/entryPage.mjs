/**
 * The entry page in the Vite build (F80): the plugin `entryPage` and the rules it follows.
 *
 * The site has two pages. public/index.html is the app (unchanged: the app's file keeps its name, so
 * the work on the app in parallel merges without a conflict on it); public/splash.html is the entry
 * page. In dist/ the entry page becomes index.html — the root, served by Firebase Hosting as an exact
 * file — and the app becomes app.html, the page every other address is rewritten to (firebase.json).
 *
 * The plugin:
 *   - writes into public/splash.html, at the «splash:…» places: the root decision (public/splash/
 *     gate.js as a classic inline script, first in the <head>), the 14 covers of the chosen set, the
 *     stage's tag, the caption of the front record and the footer's credit (public/splash/covers.js);
 *     the set comes from VITE_SPLASH_COVERS (`real`, else fictional);
 *   - renames the two pages in dist/ after the build;
 *   - in the dev server, answers the root and /home with the entry page (the app keeps every other address);
 *   - in `vite preview`, answers /home with the entry page and every other address without an
 *     extension, but the root, with the app — what Firebase Hosting does in production (F85:
 *     /home is the entry page, the site's home, rewritten to index.html before the catch-all).
 */
import fs from 'node:fs'
import path from 'node:path'
import { chooseCoverSet, coverImagesHtml, captionHtml, creditHtml, stageTagHtml } from '../public/splash/covers.js'

export const ENTRY_SOURCE = 'splash.html'
export const APP_BUILT = 'app.html'
export const PLACES = ['gate', 'covers', 'stage-tag', 'caption', 'credit']

/** The gate module (public/splash/gate.js) as a classic script for the <head>: comments and `export` dropped, runGate(window) called. */
export function inlineGateScript(source) {
    const body = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/^export /gm, '')
        .split('\n').map(line => line.trimEnd()).filter(Boolean).join('\n')
    return `<script>(function(){\n${body}\nrunGate(window)})();</script>`
}

/** The entry page with every place filled. A missing place is an error: the page is never built half-filled. */
export function fillEntryPage(html, { set, gateSource }) {
    const chosen = chooseCoverSet(set)
    const fill = {
        gate: inlineGateScript(gateSource),
        covers: coverImagesHtml(chosen),
        'stage-tag': stageTagHtml(chosen),
        caption: captionHtml(chosen),
        credit: creditHtml(chosen)
    }
    let out = html
    for (const place of PLACES) {
        const mark = `<!--splash:${place}-->`
        if (!out.includes(mark)) throw new Error(`entryPage: public/${ENTRY_SOURCE} has no place for «${place}» (${mark})`)
        out = out.replace(mark, () => fill[place])
    }
    return out
}

const pathOf = (url) => String(url || '/').split(/[?#]/)[0]

/** The root, with or without a query: the entry page. */
export const isRootAddress = (url) => pathOf(url) === '/'

/** F85: /home, with or without a query, is the entry page too (the site's home). */
export const isHomeAddress = (url) => pathOf(url) === '/home'

/** The addresses that show the entry page: the root and /home. */
export const isEntryAddress = (url) => isRootAddress(url) || isHomeAddress(url)

/** Any other address without a file extension, outside /api and Vite's own: the app. */
export function isAppAddress(url) {
    const p = pathOf(url)
    if (p === '/' || p === '/home' || p.startsWith('/api/') || p.startsWith('/@')) return false
    return !path.posix.basename(p).includes('.')
}

/** dist/: the app's page becomes app.html, the entry page becomes index.html. */
export function renameBuiltPages(dir) {
    const app = path.join(dir, 'index.html'), entry = path.join(dir, ENTRY_SOURCE)
    if (!fs.existsSync(entry)) throw new Error(`entryPage: the build has no ${ENTRY_SOURCE} in ${dir}`)
    if (!fs.existsSync(app)) throw new Error(`entryPage: the build has no index.html in ${dir}`)
    fs.renameSync(app, path.join(dir, APP_BUILT))
    fs.renameSync(entry, app)
}

const wantsPage = (req) => req.method === 'GET' || req.method === 'HEAD'

/**
 * The Vite plugin.
 * @param {{ root: string, coverSet?: string }} options - root: the Vite root (public/); coverSet: VITE_SPLASH_COVERS
 */
export function entryPage({ root, coverSet }) {
    const gatePath = path.join(root, 'splash', 'gate.js')
    let outDir = null
    return {
        name: 'entry-page',
        configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
        transformIndexHtml: {
            order: 'pre',
            handler(html, ctx) {
                if (path.basename(ctx.filename) !== ENTRY_SOURCE) return html
                return fillEntryPage(html, { set: coverSet, gateSource: fs.readFileSync(gatePath, 'utf8') })
            }
        },
        writeBundle(options) { renameBuiltPages(options.dir || outDir) },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (wantsPage(req) && isEntryAddress(req.url)) req.url = `/${ENTRY_SOURCE}${req.url.slice(pathOf(req.url).length)}`
                next()
            })
        },
        configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
                // dist/index.html is the entry page: /home is answered with it, as Firebase's rewrite does
                if (wantsPage(req) && isHomeAddress(req.url)) req.url = `/index.html${req.url.slice(pathOf(req.url).length)}`
                else if (wantsPage(req) && isAppAddress(req.url)) req.url = `/${APP_BUILT}${req.url.slice(pathOf(req.url).length)}`
                next()
            })
        }
    }
}
