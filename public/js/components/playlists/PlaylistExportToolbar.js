/**
 * PlaylistExportToolbar.js
 * 
 * Floating toolbar or fixed header bar for Playlist Actions.
 * Handles "Save All", "Export to Spotify", "Regenerate".
 */
import Component from '../base/Component.js';

export default class PlaylistExportToolbar extends Component {
    /**
     * @param {Object} props
     * @param {string} props.seriesName - Name of the active series/batch
     * @param {Function} props.onSave - () => void
     * @param {Function} props.onExport - (platform) => void
     * @param {Function} props.onRegenerate - () => void
     */
    constructor(props) {
        super(props);
    }

    render() {
        const { seriesName = 'Untitled Mix' } = this.props;

        this.container.innerHTML = `
            <div class="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-900 border-b border-gray-800">
                
                <!-- Info -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white leading-tight">${seriesName}</h2>
                        <p class="text-xs text-green-400">Ready to Export</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    
                    <button data-action="regenerate" class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700">
                        <i class="fas fa-sync-alt"></i> Regenerate
                    </button>

                    <div class="h-6 w-px bg-gray-700 mx-2"></div>

                    <button data-action="save" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-transform active:scale-95">
                        <i class="fas fa-save"></i> Save Library
                    </button>

                    <button data-action="export-spotify" class="flex items-center gap-2 px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-transform active:scale-95">
                        <i class="fab fa-spotify"></i> Export
                    </button>
                    
                </div>
            </div>
        `;
    }

    onMount() {
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;

            if (action === 'save') this.props.onSave?.();
            if (action === 'regenerate') this.props.onRegenerate?.();
            if (action === 'export-spotify') this.props.onExport?.('spotify');
            if (action === 'export-apple') this.props.onExport?.('apple');
        });
    }
}
