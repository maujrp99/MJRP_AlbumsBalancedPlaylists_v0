/**
 * ComingSoonView.js
 * 
 * Placeholder view for features under development
 * Used for: /artists, /genres, /tracks, /blend
 */

import { BaseView } from './BaseView.js';
import { getIcon } from '../components/Icons.js';

export class ComingSoonView extends BaseView {
    constructor() {
        super();
        this.featureName = 'This Feature';
    }

    async render(params) {
        // Determine feature name from route
        const path = window.location.pathname;
        const features = {
            '/artists': { name: 'Artist Series', icon: 'User', description: 'Organize your music by artists' },
            '/genres': { name: 'Genre Series', icon: 'Tag', description: 'Categorize music by genres' },
            '/tracks': { name: 'Track Series', icon: 'Music', description: 'Create collections of individual tracks' },
            '/blend': { name: 'The Blending Menu', icon: 'Sliders', description: 'Mix and blend your series into perfect playlists' }
        };

        const feature = features[path] || { name: 'This Feature', icon: 'Clock', description: 'Coming soon' };

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
        `;
    }

    async mount() {
        // No special mounting needed
    }
}

export default ComingSoonView;
