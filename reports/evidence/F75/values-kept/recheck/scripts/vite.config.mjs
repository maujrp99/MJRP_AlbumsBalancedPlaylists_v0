import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = process.env.JROOT
const { default: tailwindConfig } = await import(path.join(root, 'tailwind.config.js'))
export default defineConfig({
    root,
    css: { postcss: { plugins: [tailwindcss({ ...tailwindConfig, content: [path.join(root, 'public/**/*.{html,js}'), path.join(here, '*.{html,js}')] })] } },
    resolve: { alias: [
        { find: /^.*\/firebase-init\.js$/, replacement: path.join(here, 'fakeFirebase.js') },
        { find: '@shared', replacement: path.join(root, 'shared') },
        { find: '@stores', replacement: path.join(root, 'public/js/stores') },
        { find: '@components', replacement: path.join(root, 'public/js/components') },
        { find: '@views', replacement: path.join(root, 'public/js/views') },
        { find: /^@\//, replacement: path.join(root, 'public/js') + '/' }
    ] },
    optimizeDeps: { entries: [path.join(here, 'inventory.html')] },
    server: { hmr: false, fs: { strict: false, allow: [root, here, '/'] } }
})
