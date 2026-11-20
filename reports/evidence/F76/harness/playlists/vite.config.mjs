/**
 * F76 TASK-04 harness: the REAL playlists screens (PlaylistsView, SavedPlaylistsView) drawn with
 * fixture data, for the browser proof at 393x852 and 1280x800. Not part of the site.
 *   npx vite --config reports/evidence/F76/harness/playlists/vite.config.mjs --port 5187 --strictPort --host 127.0.0.1
 */
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import tailwindConfig from '../../../../../tailwind.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../../../../..')

export default defineConfig({
    root: here,
    css: { postcss: { plugins: [tailwindcss(tailwindConfig)] } },
    resolve: { alias: { '@': path.join(repo, 'public/js'), '@shared': path.join(repo, 'shared') } },
    server: { fs: { allow: [repo] } }
})
