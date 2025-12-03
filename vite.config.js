import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
    root: 'public',
    publicDir: false, // Disable default public dir behavior (we'll copy manually)

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'public/hybrid-curator.html'),
                v2: path.resolve(__dirname, 'public/index-v2.html')
            }
        },
        // Copy firebase-config.js to dist
        copyPublicDir: false
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
            name: 'copy-static-files',
            closeBundle() {
                // Copy firebase-config.js to dist/js/
                const jsDestDir = path.resolve(__dirname, 'dist/js')
                if (!fs.existsSync(jsDestDir)) {
                    fs.mkdirSync(jsDestDir, { recursive: true })
                }
                fs.copyFileSync(
                    path.resolve(__dirname, 'public/js/firebase-config.js'),
                    path.resolve(jsDestDir, 'firebase-config.js')
                )
                console.log('✓ Copied firebase-config.js to dist/js/')

                // Copy assets folder (images/logos) to dist/
                const assetsSource = path.resolve(__dirname, 'public/assets')
                const assetsDest = path.resolve(__dirname, 'dist/assets')
                if (fs.existsSync(assetsSource)) {
                    fs.cpSync(assetsSource, assetsDest, { recursive: true })
                    console.log('✓ Copied assets/ folder to dist/')
                }
            }
        },
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
