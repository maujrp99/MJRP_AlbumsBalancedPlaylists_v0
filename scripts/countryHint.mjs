/**
 * The country hint in the Vite build (F81, REQ-02): two tiny files that let the app know, without asking the browser for the
 * location and without any outside service, whether the visitor is in Brazil.
 *
 *   dist/country.json              {"country":""}    what everybody gets
 *   dist/geo/ALL_br/country.json   {"country":"br"}  what Firebase Hosting answers INSTEAD, at the same address, to a visitor in Brazil
 *
 * That swap is Firebase Hosting's «i18n rewrites» (firebase.json, `hosting.i18n.root`: `/geo`; the folder `ALL_<country>` is its
 * naming). The app reads `/country.json` (public/js/i18n/language.js). In the dev server the default is answered: no country.
 */
import fs from 'node:fs'
import path from 'node:path'

export const HINT_FILE = 'country.json'
export const I18N_ROOT = 'geo'

const hint = (country) => `${JSON.stringify({ country })}\n`

/** The files, by their path inside dist/. */
export const countryHintFiles = () => ({
    [HINT_FILE]: hint(''),
    [`${I18N_ROOT}/ALL_br/${HINT_FILE}`]: hint('br')
})

export function countryHint() {
    let outDir = 'dist'
    return {
        name: 'country-hint',
        configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
        writeBundle(options) {
            const dir = options.dir || outDir
            for (const [file, body] of Object.entries(countryHintFiles())) {
                fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
                fs.writeFileSync(path.join(dir, file), body)
            }
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (String(req.url || '').split(/[?#]/)[0] !== `/${HINT_FILE}`) return next()
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Cache-Control', 'no-store')
                res.end(hint(''))
            })
        }
    }
}
