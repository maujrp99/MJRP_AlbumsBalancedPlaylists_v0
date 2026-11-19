import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    root: 'public',
    envDir: '../', // Fix: Vite looks in 'root' by default, but our .env is one level up


    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false, // the published site does not hand out its source (F59)
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
