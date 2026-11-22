/**
 * The «Coming soon» screen as it was before F83 moved it to React (public/js/views/ComingSoonView.js, deleted in the same
 * commit that wired the new one): the template of its render(), copied as it was, with the texts in it. The proof of the move
 * (test/screens/coming-soon/ComingSoon.test.tsx) compares what the new screen draws in #app with what this draws.
 */
import { getIcon } from '../support/iconMarkup.js'

const features = {
    '/artists': { name: 'Artist Series', icon: 'User', description: 'Organize your music by artists' },
    '/genres': { name: 'Genre Series', icon: 'Tag', description: 'Categorize music by genres' },
    '/tracks': { name: 'Track Series', icon: 'Music', description: 'Create collections of individual tracks' }
}

export function legacyComingSoonHtml(path) {
    const feature = features[path]

    return `
            <div class="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="mb-8">
                        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center mb-6 animate-pulse">
                            ${getIcon(feature.icon, 'w-12 h-12 text-orange-400')}
                        </div>
                        <h1 class="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                            ${feature.name}
                        </h1>
                        <p class="text-muted text-lg mb-2">${feature.description}</p>
                    </div>

                    <div class="glass-panel rounded-xl p-6 mb-8">
                        <div class="flex items-center justify-center gap-3 mb-4">
                            ${getIcon('Clock', 'w-5 h-5 text-orange-400')}
                            <span class="text-lg font-semibold">Coming Soon</span>
                        </div>
                        <p class="text-sm text-muted">
                            We're working hard to bring you this feature. Stay tuned!
                        </p>
                    </div>

                    <a href="/albums" class="btn btn-primary" data-link>
                        ${getIcon('ArrowLeft', 'w-4 h-4')}
                        Back to Albums
                    </a>
                </div>
            </div>
        `
}
