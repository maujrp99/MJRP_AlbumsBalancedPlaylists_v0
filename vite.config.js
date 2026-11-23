import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import tailwindConfig from './tailwind.config.js'
import { entryPage } from './scripts/entryPage.mjs'
import { countryHint } from './scripts/countryHint.mjs'

export default defineConfig({
    root: 'public',
    envDir: '../', // Fix: Vite looks in 'root' by default, but our .env is one level up

    // The entry page (F80): public/splash.html, served at the root and at /home to everyone, signed in or not; in
    // dist/ it is index.html and the app is app.html (scripts/entryPage.mjs, firebase.json).
    // VITE_SPLASH_COVERS=real puts the real covers on it; anything else, the fictional ones.
    plugins: [
        react(), // the React screens (F83, ADR-0023): the plugin of the Vite that already builds the site
        entryPage({
            coverSet: process.env.VITE_SPLASH_COVERS ?? loadEnv(process.env.NODE_ENV || 'development', __dirname, 'VITE_').VITE_SPLASH_COVERS
        }),
        countryHint() // F81: the file the hosting answers by country (dist/country.json, dist/geo/ALL_br/country.json)
    ],

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false, // the published site does not hand out its source (F59)
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'public/index.html'),
                splash: path.resolve(__dirname, 'public/splash.html')
            },
            output: {
                // React and its renderer in a file of their own (F83, REQ-07): the main script does not grow with them, they are
                // downloaded once, when the first screen in React opens, and the browser keeps them between publications while
                // the version stays. scripts/bundle-budget.mjs checks that there is exactly one such file and its weight.
                manualChunks(id) {
                    if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor'
                }
            }
        }
    },

    // Tailwind is built with the site (F59, UAT-25): every stylesheet Vite handles goes through it,
    // in the dev server and in the build. The one that asks for it is public/css/tailwind.css.
    css: {
        postcss: {
            plugins: [tailwindcss(tailwindConfig)]
        }
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'public/js'),
            '@stores': path.resolve(__dirname, 'public/js/stores'),
            '@shared': path.resolve(__dirname, 'shared'),
            '@mjrp/admin-kit-core': path.resolve(__dirname, 'shared/admin-kit/index.js')
        }
    },

    server: {
        host: true, // Answers at localhost too; the app sends it to 127.0.0.1 (utils/localAddress.js)
        port: 5010, // The one local address is http://127.0.0.1:5010 (F50); the Spotify redirect is registered for it
        strictPort: true, // Never drift to another port: the logins are tied to this one
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})
