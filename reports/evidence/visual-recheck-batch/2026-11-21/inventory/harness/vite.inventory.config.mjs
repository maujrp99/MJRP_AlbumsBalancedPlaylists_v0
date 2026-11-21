// Visual recheck 2026-11-21: copy of the F76 inventory harness config (reports/evidence/F76/harness),
// moved six levels under the repository root. The page serves the repository root, so a page under
// reports/ imports the REAL views, components and CSS of public/js with fixture data. Firebase is an
// empty module, and the inventory wiring is replaced by standInWiring.js (the real InventoryService on
// an in-memory repository), so nothing is read from or written to Firestore.
//   npx vite --config reports/evidence/visual-recheck-batch/2026-11-21/inventory/harness/vite.inventory.config.mjs --port 5402 --strictPort --host 127.0.0.1
// open http://127.0.0.1:5402/reports/evidence/visual-recheck-batch/2026-11-21/inventory/harness/inventory.html?s=list
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../../../../../tailwind.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../../../..')

export default defineConfig({
    root,
    css: { postcss: { plugins: [tailwindcss({ ...tailwindConfig, content: [path.join(root, 'public/**/*.{html,js}'), path.join(here, '*.{html,js}')] })] } },
    resolve: {
        alias: [
            { find: /^.*\/services\/inventory\/inventoryWiring\.js$/, replacement: path.join(here, 'standInWiring.js') },
            { find: /^.*\/firebase-init\.js$/, replacement: path.join(here, 'fakeFirebase.js') },
            // the aliases of the app's own vite.config.js
            { find: '@shared', replacement: path.join(root, 'shared') },
            { find: '@stores', replacement: path.join(root, 'public/js/stores') },
            { find: '@components', replacement: path.join(root, 'public/js/components') },
            { find: '@views', replacement: path.join(root, 'public/js/views') },
            { find: /^@\//, replacement: path.join(root, 'public/js') + '/' }
        ]
    },
    // scan only this page for dependencies (the repository root holds other HTML pages that need packages this checkout lacks)
    optimizeDeps: { entries: [path.join(here, 'inventory.html')] },
    server: { hmr: { overlay: false }, fs: { allow: [root, path.resolve(root, '..')] } }
})
