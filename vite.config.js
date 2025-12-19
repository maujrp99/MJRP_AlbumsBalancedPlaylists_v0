import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    root: 'public',
    envDir: '../', // Fix: Vite looks in 'root' by default, but our .env is one level up


    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'public/index.html')
            }
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
    },

    server: {
        host: true, // Accept localhost and 127.0.0.1 (needed for Spotify OAuth)
        port: 5000,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})
