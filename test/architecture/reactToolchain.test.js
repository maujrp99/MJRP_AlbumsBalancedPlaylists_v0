// @vitest-environment node
/**
 * F83, wave 0, TASK-01 (REQ-06): the tools the React screens are built and checked with are in place.
 *
 * This reads the configuration files, it does not run the tools: the suite, the lint and the build
 * run them. What it holds: React is one exact version, the same as the app's (the root `overrides`);
 * TypeScript is strict on the code of the site's React folders and does not check the old JavaScript;
 * the type check is inside `npm run lint` (so the contract's lint sensor and the CI cover it); the test
 * runner, Vite and Tailwind read `.tsx`; the lint has a block for `.ts`/`.tsx`.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8')
const pkg = JSON.parse(read('package.json'))
const EXACT = /^\d+\.\d+\.\d+$/

describe('the React toolchain (F83 wave 0)', () => {
    it('React and react-dom are one exact version, the one the root overrides pin for the app too', () => {
        expect(pkg.dependencies.react).toMatch(EXACT)
        expect(pkg.dependencies['react-dom']).toBe(pkg.dependencies.react)
        expect(pkg.overrides.react).toBe(pkg.dependencies.react)
        const app = JSON.parse(read('app/package.json'))
        expect(app.dependencies.react).toBe(pkg.dependencies.react)
    })

    it('the build tools are dev dependencies at an exact version', () => {
        for (const name of ['typescript', '@types/react', '@types/react-dom', '@vitejs/plugin-react', 'typescript-eslint', 'eslint-plugin-react-hooks']) {
            expect(pkg.devDependencies[name], name).toMatch(EXACT)
        }
    })

    it('tsconfig.json: strict, reads the old JavaScript for its types and does not check it', () => {
        const config = JSON.parse(read('tsconfig.json'))
        const options = config.compilerOptions
        expect(options.strict).toBe(true)
        expect(options.allowJs).toBe(true)
        expect(options.checkJs).toBeFalsy()
        expect(options.noEmit).toBe(true)
        expect(options.jsx).toBe('react-jsx')
        expect(config.include.join(' ')).toMatch(/public\/js\/\*\*\/\*\.tsx/)
        expect(config.include.join(' ')).toMatch(/test\/\*\*\/\*\.tsx/)
    })

    it('npm run typecheck exists and npm run lint includes it', () => {
        expect(pkg.scripts.typecheck).toMatch(/tsc\b.*tsconfig\.json/)
        expect(pkg.scripts.lint).toMatch(/npm run typecheck/)
        expect(pkg.scripts.lint).toMatch(/eslint \./)
    })

    it('the CI and the deploy scripts run the type check', () => {
        expect(read('.github/workflows/ci.yml')).toMatch(/npm run typecheck/)
        expect(read('scripts/lib/deploy-common.sh')).toMatch(/npm run typecheck/)
    })

    it('Vite and Vitest use the React plugin; Vitest runs .test.ts and .test.tsx', () => {
        expect(read('vite.config.js')).toMatch(/@vitejs\/plugin-react/)
        const vitest = read('vitest.config.js')
        expect(vitest).toMatch(/@vitejs\/plugin-react/)
        expect(vitest).toMatch(/test\.\{js,ts,tsx\}|\.test\.tsx/)
    })

    it('Tailwind reads the classes written in .tsx', () => {
        expect(read('tailwind.config.js')).toMatch(/js,ts,tsx|\.tsx/)
    })

    it('the lint has a block for .ts and .tsx: hooks rules, no dangerouslySetInnerHTML, no any, complexity 10', () => {
        const config = read('eslint.config.mjs')
        expect(config).toMatch(/\*\*\/\*\.\{ts,tsx\}/)
        expect(config).toMatch(/react-hooks/)
        expect(config).toMatch(/dangerouslySetInnerHTML/)
        expect(config).toMatch(/no-explicit-any/)
        expect(config).toMatch(/complexity/)
    })
})
