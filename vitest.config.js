import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.js'],
        // test/security/firestoreRules.emulator.js is left out ON PURPOSE (not *.test.js): it needs the Firestore emulator and runs in its own step, `npm run test:rules` (vitest.rules.config.js; the CI and the deploy run it; test/architecture/rulesTestHasItsOwnStep.test.js holds that)
        include: ['test/**/*.test.{js,ts,tsx}'], // .ts/.tsx: the React screens (F83); the server's tests are in test/server
        exclude: ['node_modules/**', 'test/visual/**'], // test/visual/ is the Playwright visual sensor (mjrp-scripts/visual_parity), not the app's tests
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            exclude: [
                'node_modules/',
                'test/',
                'dist/',
                'server/',
                '*.config.js'
            ]
        }
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'public/js'),
            '@stores': path.resolve(__dirname, 'public/js/stores'),
            '@shared': path.resolve(__dirname, 'shared'),
            '@mjrp/admin-kit-core': path.resolve(__dirname, 'shared/admin-kit/index.js')
        }
    }
})
