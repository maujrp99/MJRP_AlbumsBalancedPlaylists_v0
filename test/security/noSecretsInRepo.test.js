/**
 * F65 (UAT-17, UAT-20): no credential is written in the files of the repository.
 *
 * The scan (test/security/support/secretScan.js) reads every text file git tracks and reports
 * file, line and rule; it never shows the value it matched. On the `main` this feature started
 * from it was red on scripts/generate-dataset.js:8 and scripts/fetch-missing-artists.js:12 (a
 * Discogs token written in the code); both scripts left with this feature. The token is still
 * in the git history: only the owner of the Discogs account can revoke it.
 *
 * A finding is fixed by taking the value out of the file (it comes from the environment) and
 * replacing the credential at the provider. A line is added to PUBLIC_BY_DESIGN only for a value
 * that is public on purpose, with the reason.
 */
import { describe, it, expect } from 'vitest'
import { scanRepository, scanText, looksLikeACredential, filesToScan } from './support/secretScan.js'

/**
 * Values that are in the repository on purpose. Key: the file; value: the rules it may match.
 */
const PUBLIC_BY_DESIGN = {
    // The Firebase web configuration identifies the project to the browser and is served to
    // every visitor; what protects the data is firestore.rules and the login, not this value.
    'public/js/firebase-config.js': ['Google API key', 'credential assigned to a name']
}

const allowed = (file, rule) => (PUBLIC_BY_DESIGN[file] || []).includes(rule)

/** Samples are put together here, at run time, so that this file holds no value the scan would find. */
const HEX_40 = 'a1b2c3d4e5'.repeat(4)
const LETTERS_40 = 'QwErTyUiOpAsDfGhJkLzXcVbNm'.split('').reverse().join('') + 'pLmKoIjNbHuYgV'
const rulesOf = (text) => scanText(text).map(finding => finding.rule)

describe('no credential is written in the repository', () => {
    it('the scan reads the files of the repository', () => {
        const files = filesToScan()
        expect(files.length).toBeGreaterThan(300)
        expect(files).toContain('package.json')
        expect(files).toContain('server/index.js')
    })

    it('no tracked text file holds a credential', () => {
        expect(scanRepository(allowed)).toEqual([])
    })

    it('every line of the list of public values is still needed', () => {
        const everything = scanRepository()
        const stale = Object.entries(PUBLIC_BY_DESIGN).flatMap(([file, rules]) => rules
            .filter(rule => !everything.some(line => line.startsWith(`${file}:`) && line.endsWith(`  ${rule}`)))
            .map(rule => `${file}: ${rule}`))
        expect(stale).toEqual([])
    })
})

describe('what the scan takes for a credential', () => {
    it('a long value assigned to a name that says token, secret, key or password', () => {
        expect(rulesOf(`const DISCOGS_TOKEN = '${LETTERS_40}';`)).toEqual(['credential assigned to a name'])
        expect(rulesOf(`{ "client_secret": "${HEX_40}" }`)).toEqual(['credential assigned to a name'])
        expect(rulesOf(`apiKey: \`${HEX_40}\``)).toEqual(['credential assigned to a name'])
        expect(rulesOf(`password = "${HEX_40}"`)).toEqual(['credential assigned to a name'])
    })

    it('a credential in a line of an environment file', () => {
        expect(rulesOf(`PORT=3000\nAI_API_KEY=${HEX_40}\n`)).toEqual(['credential in an environment line'])
    })

    it('a token written in an Authorization header', () => {
        expect(rulesOf(`headers: { Authorization: 'Discogs token=${LETTERS_40}' }`)).toContain('Discogs token in an Authorization header')
        expect(rulesOf(`curl -H "Authorization: Bearer ${HEX_40}"`)).toContain('literal Bearer token')
    })

    it('a private key, and the keys with a known shape', () => {
        const header = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ')
        expect(rulesOf(`${header}\n${'MIIEvQIBADANBgkqhkiG9w0BAQEFAASC'.repeat(2)}`)).toEqual(['private key'])
        expect(rulesOf(['AI', 'za', 'B'.repeat(35)].join(''))).toEqual(['Google API key'])
        expect(rulesOf(['AK', 'IA', 'ABCDEFGHIJKLMNOP'].join(''))).toEqual(['AWS access key id'])
    })

    it('says the line, and keeps no value', () => {
        const findings = scanText(`\n\nconst token = '${HEX_40}'\n`)
        expect(findings).toEqual([{ line: 3, rule: 'credential assigned to a name' }])
        expect(JSON.stringify(findings)).not.toContain(HEX_40)
    })
})

describe('what the scan leaves alone', () => {
    it('a value that comes from the environment or from a variable', () => {
        expect(rulesOf('const token = process.env.DISCOGS_TOKEN')).toEqual([])
        expect(rulesOf('headers: { Authorization: `Discogs token=${DISCOGS_TOKEN}` }')).toEqual([])
        expect(rulesOf('Authorization: `Bearer ${accessToken}`')).toEqual([])
    })

    it('a placeholder, a word, a name of the code', () => {
        expect(rulesOf('AI_API_KEY=your_api_key_goes_right_here_please')).toEqual([])
        expect(rulesOf("const tokenKey = 'spotify_access_token_expires_at'")).toEqual([])
        expect(rulesOf("localStorage.getItem('spotify_refresh_token')")).toEqual([])
        expect(looksLikeACredential('x'.repeat(40))).toBe(false)
        expect(looksLikeACredential('someLongCamelCaseIdentifierName')).toBe(false)
    })

    it('the header of a private key with no key after it (code that builds or checks one)', () => {
        const header = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ')
        expect(rulesOf(`key = \`${header}\\n\${key}\\n-----END\``)).toEqual([])
    })
})
