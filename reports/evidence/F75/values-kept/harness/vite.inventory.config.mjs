// F75 values kept harness: serves the repository root, so a page under reports/ can import the REAL
// components of public/js with fixture data. Firebase is replaced by an empty module (no sign-in,
// no network). Run from the worktree root:
//   npx vite --config reports/evidence/F75/values-kept/harness/vite.inventory.config.mjs --port 5291 --strictPort --host 127.0.0.1
// and open http://127.0.0.1:5291/reports/evidence/F75/values-kept/harness/inventory.html?s=list
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../../../../tailwind.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../../..')

export default defineConfig({
    root,
    css: { postcss: { plugins: [tailwindcss({ ...tailwindConfig, content: [path.join(root, 'public/**/*.{html,js}'), path.join(here, '*.{html,js}')] })] } },
    resolve: {
        alias: [
            { find: /^.*\/firebase-init\.js$/, replacement: path.join(here, 'fakeFirebase.js') },
            // the aliases of the app's own vite.config.js
            { find: '@shared', replacement: path.join(root, 'shared') },
            { find: '@stores', replacement: path.join(root, 'public/js/stores') },
            { find: '@components', replacement: path.join(root, 'public/js/components') },
            { find: '@views', replacement: path.join(root, 'public/js/views') },
            { find: /^@\//, replacement: path.join(root, 'public/js') + '/' }
        ]
    },
    // scan only the harness page: the prototypes under design/ import packages this tree does not install
    optimizeDeps: { entries: [path.join(here, 'inventory.html')] },
    server: { hmr: { overlay: false }, fs: { allow: [root, path.resolve(root, '..')] } }
})
