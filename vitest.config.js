import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.js'],
        include: ['test/**/*.test.js'], // the server's tests are in test/server
        // test/e2e drives a real browser against a running app: it has its own runner (`npm run test:e2e`)
        exclude: ['test/e2e/**', 'node_modules/**'],
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
            '@components': path.resolve(__dirname, 'public/js/components'),
            '@views': path.resolve(__dirname, 'public/js/views'),
            '@shared': path.resolve(__dirname, 'shared')
        }
    }
})
