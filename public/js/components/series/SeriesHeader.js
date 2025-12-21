/**
 * SeriesHeader.js
 * 
 * Displays the Title, Description, and Stats for the current Series.
 * Also houses the primary "Page Level" actions.
 */
import Component from '../base/Component.js';

export default class SeriesHeader extends Component {
    /**
     * @param {Object} props
     * @param {Object} props.metadata - { title, description, stats: { count, duration } }
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { metadata } = this.props;
        const title = metadata?.title || 'My Collection';
        const description = metadata?.description || 'Curate your perfect series.';
        const count = metadata?.stats?.count || 0;
        const duration = metadata?.stats?.duration || '0m';

        this.container.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <!-- Meta Info -->
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                        ${title}
                    </h1>
                    <p class="text-gray-400 text-sm mt-1 max-w-2xl">${description}</p>
                    
                    <div class="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
                        <span class="bg-gray-800 px-2 py-0.5 rounded"><i class="fas fa-compact-disc mr-1"></i> ${count} Albums</span>
                        <span class="bg-gray-800 px-2 py-0.5 rounded"><i class="fas fa-clock mr-1"></i> ${duration}</span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors" title="Import from Spotify">
                        <i class="fab fa-spotify text-green-500 mr-2"></i> Import
                    </button>
                    <button id="btn-create-mix" class="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-lg text-sm font-bold shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5">
                        <i class="fas fa-blender mr-2"></i> Create Mix
                    </button>
                </div>
            </div>
        `;
    }
}
