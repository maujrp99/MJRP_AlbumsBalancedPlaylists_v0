/**
 * F82 TASK-05: the Firestore rules test needs the emulator (Java and the Firebase CLI), so it is NOT
 * in the default suite (`npx vitest run` must pass with no emulator). It has its own step,
 * `npm run test:rules`, and this sensor holds that the step exists and that the places that must run
 * it do: the CI and the deploy scripts. A rules test that no pipeline runs proves nothing.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const read = (file) => readFileSync(resolve(ROOT, file), 'utf8')
const RULES_TEST = 'test/security/firestoreRules.emulator.js'

describe('the rules test has its own step', () => {
    it('the file exists, is left out of the default suite (not *.test.js) and is the only file of the rules config', () => {
        expect(existsSync(resolve(ROOT, RULES_TEST))).toBe(true)
        expect(read('vitest.config.js')).toMatch(/include: \['test\/\*\*\/\*\.test\./)
        expect(RULES_TEST).not.toMatch(/\.test\./)
        expect(read('vitest.rules.config.js')).toContain(`include: ['${RULES_TEST}']`)
        expect(read('vitest.config.js')).toContain('firestoreRules.emulator.js')
    })

    it('`npm run test:rules` starts the emulator through the script, which finds Java and fails clearly without it', () => {
        const scripts = JSON.parse(read('package.json')).scripts
        expect(scripts['test:rules']).toBe('node scripts/rules-emulator.mjs test')
        const script = read('scripts/rules-emulator.mjs')
        expect(script).toContain('emulators:exec')
        expect(script).toContain('/opt/homebrew/opt/openjdk/bin')
        expect(script).toMatch(/No Java found/)
    })

    it('the CI sets Java up and runs the step', () => {
        const ci = read('.github/workflows/ci.yml')
        expect(ci).toContain('actions/setup-java')
        expect(ci).toContain('npm run test:rules')
    })

    it('the deploy scripts run it right after the unit tests, and a failure stops the deploy', () => {
        const common = read('scripts/lib/deploy-common.sh')
        const unitTests = common.slice(common.indexOf('run_unit_tests()'), common.indexOf('run_rules_tests()'))
        expect(unitTests).toMatch(/\n\s*run_rules_tests\n/)
        const rules = common.slice(common.indexOf('run_rules_tests()'))
        expect(rules).toContain('npm run test:rules')
        expect(rules).toMatch(/die "the rules test failed/)
        for (const script of ['deploy-site.sh', 'deploy-server.sh', 'deploy-preview.sh']) {
            expect(read(`scripts/${script}`), script).toMatch(/^run_unit_tests$/m)
        }
    })
})
