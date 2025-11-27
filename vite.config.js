import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    root: 'public',

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'public/hybrid-curator.html')
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
        port: 5000,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },

    plugins: [
        {
            name: 'v2-spa-fallback',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    // Serve index-v2.html for v2.0 SPA routes
                    if (req.url && (
                        req.url.startsWith('/home') ||
                        req.url.startsWith('/albums') ||
                        req.url.startsWith('/ranking') ||
                        req.url.startsWith('/playlists')
                    )) {
                        req.url = '/index-v2.html'
                    }
                    next()
                })
            }
        }
    ]
})
