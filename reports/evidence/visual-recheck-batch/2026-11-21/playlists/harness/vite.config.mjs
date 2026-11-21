/**
 * Visual recheck 2026-11-21: copy of the F76 playlists harness config (reports/evidence/F76/harness/playlists),
 * moved six levels under the repository root. The REAL playlists, saved playlists and blending menu views
 * drawn with fixture data. Not part of the site. Run from the repository root:
 *   npx vite --config reports/evidence/visual-recheck-batch/2026-11-21/playlists/harness/vite.config.mjs --port 5403 --strictPort --host 127.0.0.1
 * open http://127.0.0.1:5403/?screen=generated
 */
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../../../../../tailwind.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../../../../../..')

export default defineConfig({
    root: here,
    css: { postcss: { plugins: [tailwindcss(tailwindConfig)] } },
    optimizeDeps: { entries: [path.join(here, 'index.html')] },
    resolve: {
        alias: {
            '@': path.join(repo, 'public/js'), '@shared': path.join(repo, 'shared'),
            '@stores': path.join(repo, 'public/js/stores'), '@components': path.join(repo, 'public/js/components'), '@views': path.join(repo, 'public/js/views')
        }
    },
    server: { fs: { allow: [repo] } }
})
