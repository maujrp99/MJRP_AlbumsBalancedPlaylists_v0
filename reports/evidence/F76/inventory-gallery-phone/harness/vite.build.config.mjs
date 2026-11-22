// F89 harness: BUILDS the harness page (inventory.html here) with the site's own pipeline (Tailwind built with it, the stylesheets in the
// order app.js imports them), so the WebKit check runs on a built page, as the owner's iPhone does. Firebase is an empty module and
// the inventory wiring is the in-memory stand-in: nothing is read from or written to Firestore.
//   OUT=<folder> npx vite build --config reports/evidence/F76/inventory-gallery-phone/harness/vite.build.config.mjs
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../../../../tailwind.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../../..')

export default defineConfig({
    root,
    base: '/',
    css: { postcss: { plugins: [tailwindcss({ ...tailwindConfig, content: [path.join(root, 'public/**/*.{html,js}'), path.join(here, '*.{html,js}')] })] } },
    resolve: {
        alias: [
            { find: /^.*\/services\/inventory\/inventoryWiring\.js$/, replacement: path.join(here, 'standInWiring.js') },
            { find: /^.*\/firebase-init\.js$/, replacement: path.join(here, 'fakeFirebase.js') },
            { find: '@shared', replacement: path.join(root, 'shared') },
            { find: '@stores', replacement: path.join(root, 'public/js/stores') },
            { find: '@components', replacement: path.join(root, 'public/js/components') },
            { find: '@views', replacement: path.join(root, 'public/js/views') },
            { find: /^@\//, replacement: path.join(root, 'public/js') + '/' }
        ]
    },
    build: {
        outDir: process.env.OUT,
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: { input: path.join(here, 'inventory.html') }
    }
})
