/**
 * The rules test, in its own step (F82 TASK-05): the one file the default suite leaves out
 * (vitest.config.js, `exclude`). It runs only through `npm run test:rules`, under the Firestore
 * emulator (scripts/rules-emulator.mjs), in the CI and before every deploy.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['test/security/firestoreRules.emulator.js'],
        testTimeout: 30000
    }
})
