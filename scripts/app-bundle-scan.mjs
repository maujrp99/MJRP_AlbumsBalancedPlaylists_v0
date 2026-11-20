// What must never ship in the phone app (F78, REQ-17; proposal § 8), and the check of the bundles
// `expo export` produces (app/dist/<platform>/).
//
//   node scripts/app-bundle-scan.mjs        scans app/dist/ios and app/dist/android; exit 1 on a find
//                                           or when a bundle is missing (run `npm run bundle:ios` and
//                                           `bundle:android` in app/ first; app/'s `check` does both)
//
// Used by test/architecture/noSecretsInTheApp.test.js (the root suite) and by app/'s `scan:bundles`.
//
// Three kinds of find:
//   - the NAMES of what the server holds (its environment and the Secret Manager): a name in the
//     app means someone wired, or tried to wire, a server secret into it;
//   - PATTERNS of keys and private material: a Google API key (AIza…, the AI key's shape; the app
//     carries no Firebase web key either, React Native Firebase reads its configuration from the
//     native files), a PEM private key, a service-account file, an OpenAI-style key, a JWT;
//   - for the source maps, the path of a file the app must never bundle: server/ and .env files.
// Public by nature, and allowed (proposal § 8): the Firebase app configuration, the PostHog
// project key (from the build environment), the server's address.
//
// Also reported, for the record of the export: the size of each bundle, and how many module paths
// the core's id port has (one: the core is one module instance under both of its names).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const APP_DIST = path.join(ROOT, 'app/dist')
export const PLATFORMS = ['ios', 'android']

/** The names of the server's secrets (server/ reads them from process.env; deploy-server.sh keeps them in the service). */
export const SERVER_SECRET_NAMES = [
    'AI_API_KEY', 'SPOTIFY_CLIENT_SECRET', 'APPLE_MUSIC_PRIVATE_KEY', 'APPLE_KEY_ID',
    'DISCOGS_TOKEN', 'discogs-token', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN'
]

export const SECRET_PATTERNS = [
    { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/g },
    { name: 'PEM private key', re: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g },
    { name: 'service account file', re: /"type"\s*:\s*"service_account"|"private_key_id"\s*:/g },
    { name: 'OpenAI-style key', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}/g },
    { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g }
]

const nameRe = (name) => new RegExp(`(^|[^A-Za-z0-9_])${name.replace(/[-]/g, '\\-')}([^A-Za-z0-9_]|$)`)

/** The finds in one text: `[{ kind, what }]`. */
export function findSecrets(text) {
    const finds = []
    SERVER_SECRET_NAMES.forEach(name => { if (nameRe(name).test(text)) finds.push({ kind: 'server secret name', what: name }) })
    SECRET_PATTERNS.forEach(({ name, re }) => {
        const hits = text.match(re) || []
        hits.forEach(hit => finds.push({ kind: name, what: `${hit.slice(0, 8)}…` })) // never print a whole key
    })
    return finds
}

/** Module paths of a source map that the app must never bundle. */
export function forbiddenSources(sources) {
    return sources.filter(source => /(^|\/)server\//.test(source) || /(^|\/)\.env(\.|$)/.test(source))
}

/** One platform's export: the bundle (Hermes bytecode or JavaScript) and its source map. */
export function readExport(platform, dist = APP_DIST) {
    const dir = path.join(dist, platform, '_expo/static/js', platform)
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir)
    const bundle = files.find(f => /\.(hbc|js)$/.test(f))
    const map = files.find(f => f.endsWith('.map'))
    if (!bundle) return null
    const bytes = fs.readFileSync(path.join(dir, bundle))
    const sourceMap = map ? JSON.parse(fs.readFileSync(path.join(dir, map), 'utf8')) : null
    return { platform, bundle, size: bytes.length, text: bytes.toString('latin1'), sourceMap }
}

export function scanExport(exported) {
    const finds = findSecrets(exported.text).map(f => ({ ...f, where: exported.bundle }))
    const sources = exported.sourceMap?.sources || []
    ;(exported.sourceMap?.sourcesContent || []).forEach((content, i) => {
        if (typeof content === 'string') findSecrets(content).forEach(f => finds.push({ ...f, where: sources[i] }))
    })
    forbiddenSources(sources).forEach(source => finds.push({ kind: 'forbidden module', what: source, where: 'source map' }))
    const idPortPaths = sources.filter(source => /shared\/platform\/newId\.js$/.test(source))
    return { finds, idPortPaths, modules: sources.length }
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    let failed = false
    for (const platform of PLATFORMS) {
        const exported = readExport(platform)
        if (!exported) {
            console.log(`${platform}: no bundle in app/dist/${platform} (run the bundle:${platform} script of app/ first)`)
            failed = true
            continue
        }
        const { finds, idPortPaths, modules } = scanExport(exported)
        console.log(`${platform}: ${exported.bundle} ${mb(exported.size)}, ${modules} modules in the source map, ` +
            `the id port by ${idPortPaths.length} path(s); ${finds.length} find(s)`)
        finds.forEach(f => console.log(`  ${f.kind}: ${f.what} (${f.where})`))
        if (finds.length > 0 || idPortPaths.length !== 1) failed = true
    }
    process.exitCode = failed ? 1 : 0
}
