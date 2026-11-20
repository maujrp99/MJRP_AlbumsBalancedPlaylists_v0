/**
 * F78, REQ-17: nothing secret ships in the phone app (proposal § 8, «O que nunca vai no app»: the AI
 * key, Apple's private key, the Discogs token, Spotify's secret, any Firebase administrator
 * credential). What the check reads and what it looks for: scripts/app-bundle-scan.mjs.
 *
 *   1. the app's source and configuration (app/ without node_modules and dist): no name of a server
 *      secret, no key pattern, no .env file; always runs;
 *   2. the bundles `expo export` made (app/dist/ios, app/dist/android): no name, no pattern, no
 *      module of server/ or .env in the source map, and the core's id port by one path. Runs when
 *      the bundles exist, and says so when they do not: the gate that always has them is app/'s
 *      `check` (`npm run app:check` at the root), which exports and then runs the same scan.
 *   3. the sensor is seen failing on planted text.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { findSecrets, forbiddenSources, readExport, scanExport, PLATFORMS, APP_DIST } from '../../scripts/app-bundle-scan.mjs'

const ROOT = path.resolve(__dirname, '../..')
const APP = path.join(ROOT, 'app')

function listFiles(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return ['node_modules', 'dist', '.expo', 'ios', 'android'].includes(entry.name) ? [] : listFiles(full)
        return [full]
    })
}

const appFiles = listFiles(APP)
const textFiles = appFiles.filter(file => /\.(m?js|cjs|jsx|ts|tsx|json|md|ya?ml)$/.test(file) || path.basename(file).startsWith('.'))

describe('nothing secret in the app (F78, REQ-17)', () => {
    it('the app\'s source and configuration name no server secret and carry no key', () => {
        const finds = textFiles.flatMap(file => findSecrets(fs.readFileSync(file, 'utf8')).map(f => `${path.relative(ROOT, file)}: ${f.kind} ${f.what}`))
        expect(finds).toEqual([])
    })

    it('the app keeps no .env file and no key file', () => {
        const kept = appFiles.filter(file => /(^|\/)\.env(\.|$)|\.(p8|p12|pem|key|jks|keystore|mobileprovision)$|GoogleService-Info\.plist$|google-services\.json$/.test(file))
        expect(kept.map(file => path.relative(ROOT, file))).toEqual([])
    })

    for (const platform of PLATFORMS) {
        const exported = readExport(platform)
        it(`the ${platform} bundle ${exported ? `(${exported.bundle})` : `is not built here (app/dist/${platform}): app/'s check builds and scans it`} carries no secret and has the core once`, () => {
            if (!exported) {
                expect(fs.existsSync(path.join(APP_DIST, platform))).toBe(false)
                return
            }
            const { finds, idPortPaths } = scanExport(exported)
            expect(finds).toEqual([])
            expect(idPortPaths).toHaveLength(1)
        })
    }
})

describe('the sensor fails when a line is broken on purpose', () => {
    it('finds a server secret\'s name and the shape of each key, and prints none whole', () => {
        const planted = [
            'const key = process.env.AI_API_KEY',
            `const google = "AIza${'x'.repeat(35)}"`,
            '-----BEGIN PRIVATE KEY-----',
            '{"type": "service_account", "private_key_id": "1"}',
            `sk-proj-${'a'.repeat(30)}`,
            'secret: discogs-token'
        ].join('\n')
        const finds = findSecrets(planted)
        expect(finds.map(f => f.kind)).toEqual(expect.arrayContaining(['server secret name', 'Google API key', 'PEM private key', 'service account file', 'OpenAI-style key']))
        expect(finds.filter(f => f.kind === 'server secret name').map(f => f.what).sort()).toEqual(['AI_API_KEY', 'discogs-token'])
        expect(finds.every(f => f.what.length <= 30)).toBe(true)
    })

    it('does not take a longer name for a secret\'s name', () => {
        expect(findSecrets('MY_AI_API_KEY_HINT and AI_API_KEYS')).toEqual([])
    })

    it('finds a module of server/ or a .env file in a source map', () => {
        expect(forbiddenSources(['/app/src/a.ts', '/server/lib/auth/x.js', '/app/.env', '/shared/x.js', '/app/.env.local'])).toEqual(['/server/lib/auth/x.js', '/app/.env', '/app/.env.local'])
    })

    it('a planted key in a bundle fails the scan', () => {
        const exported = { platform: 'ios', bundle: 'planted.hbc', size: 1, text: `x AIza${'y'.repeat(35)} x`, sourceMap: { sources: ['/shared/platform/newId.js'], sourcesContent: ['APPLE_MUSIC_PRIVATE_KEY'] } }
        const { finds, idPortPaths } = scanExport(exported)
        expect(finds.map(f => f.kind)).toEqual(['Google API key', 'server secret name'])
        expect(idPortPaths).toHaveLength(1)
    })
})
