import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: here,
    plugins: [react()],
    server: { port: 5199, strictPort: true, fs: { strict: false } },
    resolve: { alias: { '@shared': path.resolve(here, '../../../../../shared') } }
})
